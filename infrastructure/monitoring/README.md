# Prometheus + Grafana monitoring (Phase 11)

Phase 11 connects Eventix application metrics to Prometheus and Grafana:

```text
Locust -> API Gateway -> Eventix services -> Spring Boot Actuator/Micrometer
                                             /actuator/prometheus
                                             -> Prometheus -> Grafana
```

The Phase 10 Locust test is the intended traffic generator. It sends traffic to
`/api/bookings` through the API Gateway, so request rate and latency panels show
the behavior of the complete booking path.

## What is instrumented

All seven Eventix services already include Spring Boot Actuator and the
Prometheus Micrometer registry. Their `application.yml` files expose
`health,info,prometheus`, retain health probes, and use the consistent
`application` tag (`auth-service`, `catalog-service`, `inventory-service`,
`booking-service`, `payment-service`, `notification-service`, or
`api-gateway`). HTTP request histograms are enabled so bucket-based p95/p99
queries are available.

Booking Service increments these counters at the actual business events:

- `eventix_bookings_confirmed_total`: incremented after a successful payment and
  persisted confirmed booking.
- `eventix_bookings_payment_failed_total`: incremented after a failed payment
  has been compensated and persisted as `PAYMENT_FAILED`.

Cancellation does not increment either counter.

## Install Prometheus and Grafana

This project uses k3s from Phase 9. k3s includes metrics-server for HPA resource
metrics; do not install a second metrics-server.

The expected Prometheus/Grafana installation is the Prometheus Operator bundle:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
```

The `serviceMonitorSelectorNilUsesHelmValues=false` setting is important. Without
it, the Prometheus resource normally selects only ServiceMonitors carrying the
Helm release's own selector labels. The supplied ServiceMonitor is labeled
`release: prometheus` and is in the `eventix` namespace; verify that this label
matches the release/selector in the installed Prometheus resource.

Apply the monitor after the Eventix namespace and Services exist:

```bash
kubectl apply -f infrastructure/monitoring/service-monitor.yaml
```

The monitor selects all Eventix Services labeled `prometheus-scrape: "true"` and
scrapes their named `http` port at `/actuator/prometheus`. It does not alter
public NodePorts or expose internal services publicly.

## Grafana dashboard

Port-forward Grafana and obtain its generated password:

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
kubectl get secret -n monitoring prometheus-grafana \
  -o jsonpath="{.data.admin-password}" | base64 -d
```

Open `http://localhost:3000`, choose **Dashboards -> New -> Import**, upload
`infrastructure/monitoring/grafana-dashboard-eventix.json`, and select the
Prometheus data source when prompted. The dashboard includes request rate,
5xx error rate, p95 latency, CPU, memory, deployment replicas, confirmed
bookings, and payment failures.

## Verify collection

Check application endpoints through the relevant Service or port-forward:

```bash
kubectl port-forward -n eventix svc/booking-service 8084:8084
curl http://localhost:8084/actuator/health
curl http://localhost:8084/actuator/prometheus
```

Check discovery and scrape health:

```bash
kubectl get servicemonitor -n eventix eventix-services
kubectl describe servicemonitor -n eventix eventix-services
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

Then open `http://localhost:9090/targets` and look for the `eventix-services`
endpoints. This repository does not include a live Prometheus or Grafana
instance, so target health and dashboard rendering must be verified after
installation.

## PromQL reference

| Panel | Query |
|---|---|
| Request rate | `sum(rate(http_server_requests_seconds_count{namespace="eventix"}[1m])) by (application)` |
| HTTP 5xx rate | `sum(rate(http_server_requests_seconds_count{namespace="eventix",status=~"5.."}[1m])) by (application)` |
| p95 latency | `histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket{namespace="eventix"}[5m])) by (le, application))` |
| CPU usage | `sum(rate(container_cpu_usage_seconds_total{namespace="eventix",container!=""}[2m])) by (container)` |
| Memory usage | `sum(container_memory_working_set_bytes{namespace="eventix",container!=""}) by (container)` |
| Deployment replicas | `kube_deployment_status_replicas{namespace="eventix"}` |
| Confirmed bookings/min | `sum(rate(eventix_bookings_confirmed_total{namespace="eventix"}[1m])) * 60` |
| Payment failures/min | `sum(rate(eventix_bookings_payment_failed_total{namespace="eventix"}[1m])) * 60` |

Spring application metrics come from Micrometer. Prometheus stores and queries
those samples. Kubernetes `metrics-server` supplies resource metrics used by
HPA, while `kube-state-metrics` supplies objects such as deployment replica
counts. They are different data sources: metrics-server is not a replacement
for Prometheus scraping, and kube-state-metrics does not measure application
latency.

## Troubleshooting no data

1. Confirm the target Service has `prometheus-scrape: "true"`, a named `http`
   port, and selects ready pods.
2. Confirm `/actuator/prometheus` returns text from inside the cluster.
3. Confirm the ServiceMonitor is in `eventix` and its selector matches the
   Prometheus Operator's `serviceMonitorSelector`.
4. Confirm the Prometheus release label expected by the installed Helm chart;
   the example install uses `release: prometheus`.
5. Check Prometheus `/targets` and `/service-discovery` for scrape errors.
6. If application panels are empty, generate traffic first. Business counters
   are created only after their booking outcomes occur.
7. If CPU or replica panels are empty, verify kube-state-metrics/cAdvisor are
   enabled in the installed stack and that the `namespace="eventix"` labels
   match the emitted series.

Horizontal Pod Autoscaling is Kubernetes-only. Docker Compose can exercise the
booking flow and produce application traffic, but it does not provide HPA,
pod replicas, metrics-server, or kube-state-metrics.
