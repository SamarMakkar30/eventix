# catalog-service

Manages movies, events, venues and showtimes. **Phase 2 - implemented.**

## Run locally

```bash
docker compose up --build catalog-service postgres
```

## Data model

- **Movie** - title, description, genre, language, durationMinutes, posterUrl, rating
- **Event** - name, description, category, bannerUrl
- **Venue** - name, address, city
- **Show** - the actual bookable unit: links a Movie *or* Event to a Venue, a
  `showDateTime`, a `price`, and `totalSeats`. A show must reference exactly one of
  `movieId` / `eventId` - enforced in `ShowService`, not just left to chance.

Poster/banner images are plain URL strings for now (point them at any public image URL
for testing). Real upload to S3 gets wired in when we do Terraform/AWS (Phase 9).

## Access rules

- `GET` endpoints (browsing) are public - no login required.
- `POST` / `PUT` / `DELETE` require a valid JWT **with the ADMIN role**.

### There's no admin yet - here's how to get one for testing

`auth-service` always registers new users as `CUSTOMER` (deliberately - there's no
public "become an admin" endpoint, since that would be a security hole). For now,
promote a user directly in the database:

```bash
docker exec -it eventix-postgres psql -U eventix -d auth_db \
  -c "UPDATE users SET role='ADMIN' WHERE email='asha@example.com';"
```

**Then log in again** - the role is baked into the JWT at issue time, so a token you
already have still says CUSTOMER. `POST /auth/login` again to get a fresh admin token.

## Endpoints (direct, port 8082 - via gateway: `/api/catalog/...`)

### Movies
```bash
# Create (admin token required)
curl -X POST http://localhost:8082/catalog/movies \
  -H "Content-Type: application/json" -H "Authorization: Bearer <admin-token>" \
  -d '{"title":"Example Movie","genre":"Action","language":"English","durationMinutes":140,"posterUrl":"https://example.com/poster.jpg","rating":8.1}'

# Browse (no auth needed)
curl http://localhost:8082/catalog/movies
curl http://localhost:8082/catalog/movies/1
```
`PUT /catalog/movies/{id}` and `DELETE /catalog/movies/{id}` also exist, admin-only.

### Events
Same shape as movies: `POST/GET/PUT/DELETE /catalog/events`, fields `name`,
`description`, `category`, `bannerUrl`.

### Venues
`POST/GET /catalog/venues`, fields `name`, `address`, `city`. (No update/delete yet -
not needed for the booking flow; add later if you want full CRUD parity.)

### Shows - the bookable unit
```bash
curl -X POST http://localhost:8082/catalog/shows \
  -H "Content-Type: application/json" -H "Authorization: Bearer <admin-token>" \
  -d '{
    "showType": "MOVIE",
    "movieId": 1,
    "venueId": 1,
    "showDateTime": "2026-09-15T19:30:00",
    "price": 250,
    "totalSeats": 184
  }'
```
The response includes the resolved movie/event title and venue name, not just raw ids -
handy for the frontend later. `GET /catalog/shows` and `GET /catalog/shows/{id}` are public.

## What's implemented

- Full CRUD for Movies and Events, create+browse for Venues, create+browse for Shows
- The movie-XOR-event validation rule on Show creation, with a clean 400 error if violated
- JWT validation (same shared secret as auth-service) + role-based write restrictions
- Validation on all inputs, with a `GlobalExceptionHandler` returning clean JSON errors
  (404 for missing resources, 400 for bad Show combos/validation, 403 for non-admins)

## Known TODO (Phase 3 integration point)

When a Show is created, `ShowService.create()` has a marked TODO for calling Inventory
Service to initialize ticket stock (`totalSeats`) for that show. Left undone on purpose -
Inventory Service doesn't exist yet, and Catalog Service should stay fully testable on
its own until it does. We'll wire this the moment Inventory Service is built.
