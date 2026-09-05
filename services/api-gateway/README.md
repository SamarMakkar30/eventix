# api-gateway

Single entry point. Routes /api/** requests to the correct backend service.

## Run locally

```bash
cd services/api-gateway
mvn spring-boot:run
```

Or as part of the full stack:

```bash
docker compose up --build api-gateway
```

## Endpoints (to be implemented - see project roadmap Phase referencing this service)

- `GET /actuator/health` - liveness/readiness (already works out of the box)
- `GET /actuator/prometheus` - metrics for Prometheus scraping (already works out of the box)

## Routing table

| External path         | Routed to             |
|------------------------|------------------------|
| `/api/auth/**`          | auth-service:8081      |
| `/api/catalog/**`       | catalog-service:8082   |
| `/api/inventory/**`     | inventory-service:8083 |
| `/api/bookings/**`      | booking-service:8084   |
| `/api/payments/**`      | payment-service:8085   |
| `/api/notifications/**` | notification-service:8086 |
