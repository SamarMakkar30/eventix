# api-gateway

Single entry point. Routes `/api/**` requests to the correct backend service.
**Phase 6 - wired and verified.**

## What changed this phase

The routing table itself was already correct from Phase 0 - each route's
`StripPrefix` value was chosen up front to match the path each service's
controllers ended up using, so no route changes were needed once every service
existed. What was actually missing, and would have caused real confusion later, is:

1. **CORS.** Without `globalcors` configured, the browser blocks every request the
   React frontend makes to this gateway - silently, client-side, before the request
   even leaves the browser. A REST client like curl or Postman never reveals this
   bug because CORS is a browser-enforced rule, not a server one - "the API works
   fine in Postman" is exactly the trap. Fixed via `CORS_ALLOWED_ORIGIN` (defaults to
   `http://localhost:3000` for local dev; override this in Terraform/K8s once the
   frontend has a real domain).
2. **`/actuator/gateway/routes`** is now exposed, so you can confirm exactly what's
   configured by hitting an endpoint instead of re-reading YAML when something 404s.

## Routing table

| External path (through the gateway) | Internal path (what the service receives) | Service |
|---|---|---|
| `/api/auth/**` | `/auth/**` | auth-service (8081) |
| `/api/catalog/**` | `/catalog/**` | catalog-service (8082) |
| `/api/inventory/**` | `/inventory/**` | inventory-service (8083) |
| `/api/bookings/**` | `/bookings/**` | booking-service (8084) |
| `/api/payments/**` | `/payments/**` | payment-service (8085) |
| `/api/notifications/**` | `/notifications/**` | notification-service (8086) |

## A deliberate choice: this gateway does NOT do authentication

Every downstream service independently validates its own JWTs (see any service's
`security/` package). The gateway is a pure router - it forwards the `Authorization`
header through unmodified and lets the destination service decide whether the
request is allowed. Centralizing JWT validation here instead is a legitimate
architectural alternative (and would remove some duplicated code across services),
but it wasn't done, on purpose: the current design already works and is fully
tested per-service, and refactoring six working services' security late in the
project for a code-cleanliness win isn't worth the risk. Worth naming as a "known
alternative we considered" if asked in a viva.

## Proving it actually works: full flow through port 8080 ONLY

Every call below hits **only** `localhost:8080` - if this whole sequence works, the
gateway, CORS, and every downstream service are correctly wired together.

```bash
docker compose up --build

# 1. Register (through the gateway)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Verma","email":"asha@example.com","password":"password123"}'
# copy the "token" from the response

TOKEN="<paste token here>"

# 2. Promote to admin directly in the DB (see catalog-service/README.md), then log in
#    again through the gateway to get a fresh admin token:
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com","password":"password123"}'

ADMIN_TOKEN="<paste the new token here>"

# 3. Create a movie, a venue, and a show - through the gateway
curl -X POST http://localhost:8080/api/catalog/movies \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Example Movie","genre":"Action","durationMinutes":140}'

curl -X POST http://localhost:8080/api/catalog/venues \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"ABC Cinemas","city":"Ludhiana"}'

curl -X POST http://localhost:8080/api/catalog/shows \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"showType":"MOVIE","movieId":1,"venueId":1,"showDateTime":"2026-12-15T19:30:00","price":250,"totalSeats":50}'

# 4. Confirm Catalog -> Inventory integration fired, through the gateway
curl http://localhost:8080/api/inventory/shows/1

# 5. Book tickets - the full Booking -> Inventory -> Payment -> Notification chain
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"showId": 1, "quantity": 2}'

# 6. Confirm the booking shows up in "my bookings"
curl http://localhost:8080/api/bookings -H "Authorization: Bearer $TOKEN"
```

If step 5 returns a `CONFIRMED` booking and step 6 lists it, every service in the
system is correctly reachable through the single gateway entry point - which is
exactly what the frontend will rely on next (Phase 7).

## Debugging aid

```bash
curl http://localhost:8080/actuator/gateway/routes
```
Lists every configured route as JSON - useful the moment any `/api/...` call
returns an unexpected 404, to rule out "wrong route config" before chasing anything
downstream.
