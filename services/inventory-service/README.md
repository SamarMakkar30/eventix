# inventory-service

Tracks ticket availability per show and safely decrements stock on booking.

## Run locally

```bash
cd services/inventory-service
mvn spring-boot:run
```

Or as part of the full stack:

```bash
docker compose up --build inventory-service
```

## Endpoints (to be implemented - see project roadmap Phase referencing this service)

- `GET /actuator/health` - liveness/readiness (already works out of the box)
- `GET /actuator/prometheus` - metrics for Prometheus scraping (already works out of the box)
