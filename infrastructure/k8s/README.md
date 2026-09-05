# Kubernetes manifests (Phase 8)

`auth-service/` is a complete worked example: Deployment, Service, HPA, ConfigMap,
and an example Secret. Once auth-service is built and tested, duplicate this exact
pattern for catalog-service, inventory-service, booking-service, payment-service,
and notification-service - only the name, port, and env vars change.

Namespace: everything assumes a `eventix` namespace. Create it first:

```bash
kubectl create namespace eventix
```

Then, per service:

```bash
kubectl apply -f infrastructure/k8s/auth-service/
```
