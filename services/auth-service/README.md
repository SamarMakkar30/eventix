# auth-service

Registration, login, JWT issuance and validation. **Phase 1 - implemented.**

## Run locally

```bash
docker compose up --build auth-service postgres
```

## Endpoints

All paths below are as seen **directly on this service** (port 8081). Through the
gateway they're reachable at `http://localhost:8080/api/auth/...`.

### Register

```bash
curl -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Asha Verma","email":"asha@example.com","password":"password123"}'
```

Returns `201 Created`:
```json
{
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "name": "Asha Verma", "email": "asha@example.com", "role": "CUSTOMER" }
}
```

### Login

```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"asha@example.com","password":"password123"}'
```

### Get current user (requires the token from register/login)

```bash
curl http://localhost:8081/auth/me \
  -H "Authorization: Bearer <token>"
```

### Health & metrics (already work out of the box)

- `GET /actuator/health`
- `GET /actuator/prometheus`

## What's implemented

- `User` entity + Postgres-backed repository (table auto-created via `ddl-auto: update`)
- BCrypt password hashing
- JWT generation and validation (`JwtService`), 24h expiry by default
- A `JwtAuthFilter` that reads `Authorization: Bearer <token>` and populates the Spring
  Security context, so `/auth/me` and any future protected endpoint can use `Authentication`
- Stateless `SecurityConfig` - only `/auth/register`, `/auth/login`, and `/actuator/**` are public
- Validation on requests (name/email/password) with a `GlobalExceptionHandler` that returns
  clean JSON error bodies instead of stack traces (duplicate email -> 409, bad login -> 401,
  invalid input -> 400 with per-field messages)

## Not yet implemented (later phases)

- Role-based endpoint restrictions (e.g. admin-only routes) - the `ROLE_ADMIN` /
  `ROLE_CUSTOMER` authority is already attached to the security context, so this is just
  adding `.hasRole("ADMIN")` to specific routes when Catalog/Booking need it.
- Refresh tokens (out of scope for this project; 24h expiry is fine for a demo).
