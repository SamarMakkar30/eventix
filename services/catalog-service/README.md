# catalog-service

Manages movies, events, venues and showtimes. Poster/banner images live in S3.

## Run locally

```bash
cd services/catalog-service
mvn spring-boot:run
```

Or as part of the full stack:

```bash
docker compose up --build catalog-service
```

## Endpoints (to be implemented - see project roadmap Phase referencing this service)

- `GET /actuator/health` - liveness/readiness (already works out of the box)
- `GET /actuator/prometheus` - metrics for Prometheus scraping (already works out of the box)
