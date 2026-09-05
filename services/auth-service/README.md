# auth-service

Registration, login, JWT issuance and validation.

## Run locally

```bash
cd services/auth-service
mvn spring-boot:run
```

Or as part of the full stack:

```bash
docker compose up --build auth-service
```

## Endpoints (to be implemented - see project roadmap Phase referencing this service)

- `GET /actuator/health` - liveness/readiness (already works out of the box)
- `GET /actuator/prometheus` - metrics for Prometheus scraping (already works out of the box)
