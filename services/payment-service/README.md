# payment-service

Simulated payment processing; returns SUCCESS / FAILED / PENDING.

## Run locally

```bash
cd services/payment-service
mvn spring-boot:run
```

Or as part of the full stack:

```bash
docker compose up --build payment-service
```

## Endpoints (to be implemented - see project roadmap Phase referencing this service)

- `GET /actuator/health` - liveness/readiness (already works out of the box)
- `GET /actuator/prometheus` - metrics for Prometheus scraping (already works out of the box)
