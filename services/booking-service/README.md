# booking-service

Orchestrates the booking workflow: Inventory -> Payment -> Notification.

## Run locally

```bash
cd services/booking-service
mvn spring-boot:run
```

Or as part of the full stack:

```bash
docker compose up --build booking-service
```

## Endpoints (to be implemented - see project roadmap Phase referencing this service)

- `GET /actuator/health` - liveness/readiness (already works out of the box)
- `GET /actuator/prometheus` - metrics for Prometheus scraping (already works out of the box)
