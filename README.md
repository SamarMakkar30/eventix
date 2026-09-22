# Eventix - Online Event / Movie Ticket Booking System

A cloud-native ticket booking platform built as a set of independent Java/Spring Boot
microservices, containerized with Docker, orchestrated on Kubernetes with traffic-based
autoscaling (HPA), provisioned on AWS via Terraform, deployed through a Jenkins CI/CD
pipeline triggered by GitHub webhooks, and observed live through Prometheus + Grafana.

## Architecture

```
 React Frontend
       |
   API Gateway  (:8080)
       |
   +---+-----------+-----------+-----------+-----------+
   |               |           |           |           |
 Auth(8081)   Catalog(8082) Inventory(8083) Booking(8084)
                                                |
                                    +-----------+-----------+
                                    |                       |
                               Payment(8085)       Notification(8086)
```

Each service owns its own PostgreSQL database and can be built, tested, containerized,
deployed and scaled completely independently of the others.

## Tech stack

| Layer            | Technology |
|-------------------|------------|
| Frontend          | React |
| Backend           | Java 17, Spring Boot 3.2.4 |
| Gateway           | Spring Cloud Gateway |
| Database          | PostgreSQL (one DB per service) |
| Auth              | Spring Security + JWT |
| Containerization  | Docker |
| Orchestration     | Kubernetes (k3s on a single EC2 host) + HPA |
| IaC               | Terraform |
| Cloud             | AWS (EC2, S3) |
| CI/CD             | Jenkins, triggered by a GitHub webhook (no GitHub Actions) |
| Monitoring        | Prometheus |
| Dashboards        | Grafana |
| Load testing      | Locust |

## Repo layout

```
eventix/
  frontend/                React app
  services/
    api-gateway/           Spring Cloud Gateway
    auth-service/
    catalog-service/
    inventory-service/
    booking-service/
    payment-service/
    notification-service/
  infrastructure/
    k8s/                    Kubernetes manifests (example: auth-service)
  terraform/                AWS EC2 (k3s host) + S3, as code
  jenkins/                  Jenkinsfile template
  docker-compose.yml        Local dev environment (all services + Postgres)
```

## Running locally (Phases 1-11)

```bash
docker compose up --build
```

This brings up Postgres (with one database per service) and every microservice.
The gateway will be reachable at http://localhost:8080 once each service is implemented.

## Build roadmap

- [x] Phase 0 - Repo scaffold, docker-compose, service skeletons
- [x] Phase 1 - Auth Service: register/login/JWT
- [x] Phase 2 - Catalog Service: movies/events CRUD
- [x] Phase 3 - Inventory Service: safe ticket decrement
- [x] Phase 4 - Booking, Payment + Notification Services (simulated Saga orchestration)
- [x] Phase 6 - API Gateway routing, full local end-to-end flow
- [x] Phase 7 - React frontend
- [x] Phase 8 - Kubernetes manifests for all services + probes/resource limits
- [x] Phase 9 - Terraform: provision EC2 (k3s) + S3, deploy cluster there
- [x] Phase 10 - HPA + Locust load test (the autoscaling demo)
- [x] Phase 11 - Prometheus + Grafana dashboards
- [ ] Phase 12 - Jenkins pipeline + GitHub webhook
- [ ] Phase 13 - Security hardening, docs, demo rehearsal

Each phase should end with something that actually runs before you move to the next one.
