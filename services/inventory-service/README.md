# inventory-service

Tracks ticket availability per show and safely decrements stock on booking.
**Phase 3 - implemented.**

## Run locally

```bash
docker compose up --build inventory-service catalog-service auth-service postgres
```

## The core engineering idea: atomic, race-safe decrement

Ticket booking is the textbook example of a race condition: two customers can both
read "1 seat left" at the same instant and both try to book it. This service avoids
that without explicit row locks, using a single conditional SQL UPDATE:

```sql
UPDATE inventory
SET available_seats = available_seats - :qty
WHERE show_id = :showId AND available_seats >= :qty
```

If two requests race for the last seat, the database itself guarantees only one
`UPDATE` can match the `available_seats >= :qty` condition - the second one affects
zero rows, and the service turns that into a clean `409 Conflict` ("not enough
seats") instead of overselling. `release` (booking cancellation) works the same way
in reverse, capped so it can never push `available_seats` above `totalSeats`.

## How a show gets inventory in the first place

Catalog Service calls this service automatically right after creating a Show
(`POST /inventory/shows/{showId}/initialize`), forwarding the admin's own JWT rather
than inventing a separate service credential. That call is **best-effort** - if
Inventory Service is briefly down, Catalog still creates the show and logs a loud
warning rather than failing the whole request. This is a deliberate distributed-
systems trade-off (see `InventoryClient` in catalog-service for the reasoning) - a
good talking point if your evaluator asks about consistency between services.

## Endpoints (direct, port 8083 - via gateway: `/api/inventory/...`)

```bash
# Called automatically by Catalog Service - you normally won't call this by hand
curl -X POST http://localhost:8083/inventory/shows/1/initialize \
  -H "Content-Type: application/json" -H "Authorization: Bearer <admin-token>" \
  -d '{"totalSeats": 184}'

# Public - check remaining seats
curl http://localhost:8083/inventory/shows/1

# Decrement (any logged-in user - this is what Booking Service will call)
curl -X POST http://localhost:8083/inventory/shows/1/decrement \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"quantity": 2}'

# Release (booking cancellation)
curl -X POST http://localhost:8083/inventory/shows/1/release \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"quantity": 2}'
```

## What's implemented

- `Inventory` entity, one row per show, unique on `showId`
- Atomic conditional decrement/release via JPQL `@Modifying` queries (no explicit locks)
- `initialize` is guarded against double-initialization (409 if already set up)
- `decrement`/`release` return 409 with a clear message when the operation is invalid,
  404 if the show has no inventory record at all
- JWT validation (same shared secret as every other service); GET is public,
  `initialize` is admin-only, `decrement`/`release` require any authenticated user

## What's NOT implemented (by design)

No seat-map / specific-seat selection - this is a ticket-count model (matches your
original scope decision to avoid a distributed-locking research project). Specific
seat selection is reasonable future scope, not needed for this project's goals.
