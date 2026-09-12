# Kubernetes manifests (Phase 8)

Phase 8 prepares the Kubernetes manifests for the Eventix application. The nine
workloads are Postgres, six backend services, the API Gateway, and the frontend.
The backend services, gateway, and frontend have Deployments, Services, and
HPAs; ConfigMaps and Secrets are included where needed. Postgres also has a
PVC. A live Kubernetes cluster is not required to review or validate these
manifests. Terraform and cloud infrastructure are part of Phase 9, not Phase 8.

## Important configuration

1. **The JWT secret must be identical everywhere.** Every backend service has a
   `JWT_SECRET` field in its `secret.example.yaml`. Auth issues tokens and all
   six backend services independently validate them, so the value must be
   byte-for-byte identical in `auth-service`, `catalog-service`,
   `inventory-service`, `booking-service`, `payment-service`, and
   `notification-service`. Do not commit real Secret files or credentials.

2. **The frontend API URL is build-time configuration.** This frontend uses
   Vite, which bakes `VITE_API_BASE_URL` into the static JavaScript bundle at
   `docker build` time. Setting it as a Kubernetes Deployment environment
   variable after the image is built does not change the bundle. The
   `frontend/Dockerfile` takes it as a build argument instead:

   ```bash
   docker build --build-arg VITE_API_BASE_URL=http://<ec2-public-ip>:30080 \
     -t <your-dockerhub-username>/frontend:latest ./frontend
   ```

   For local Docker development, use `VITE_API_BASE_URL=http://localhost:8080`.
   For Kubernetes, rebuild the frontend image with the externally reachable
   Gateway URL before pushing it. The frontend always communicates through the
   API Gateway; it does not bypass the gateway to reach internal services.

## Apply order

```bash
kubectl apply -f infrastructure/k8s/namespace.yaml

# Fill in every secret.example.yaml -> secret.yaml first (see the JWT_SECRET
# warning above), then:
kubectl apply -f infrastructure/k8s/postgres/
kubectl apply -f infrastructure/k8s/auth-service/
kubectl apply -f infrastructure/k8s/catalog-service/
kubectl apply -f infrastructure/k8s/inventory-service/
kubectl apply -f infrastructure/k8s/booking-service/
kubectl apply -f infrastructure/k8s/payment-service/
kubectl apply -f infrastructure/k8s/notification-service/
kubectl apply -f infrastructure/k8s/api-gateway/
kubectl apply -f infrastructure/k8s/frontend/
```

Postgres needs a moment to initialize before the backend services can connect.
If a service's pod crash-loops on first apply, inspect
`kubectl get pods -n eventix -w` and wait for Postgres to become ready.

## Service exposure

`api-gateway` and `frontend` are exposed via `NodePort` `30080` and `30300`.
They are reachable at `http://<node-ip>:30080` and
`http://<node-ip>:30300` once Phase 9 provides a real node. Every other backend
service and Postgres use `ClusterIP` and remain internal, as in docker-compose.

## Images

Every application Deployment references
`<your-dockerhub-username>/<service>:latest`. Replace the placeholder with real
image names after building and pushing the images. Until then, these manifests
are correct and reviewable, but application images will not successfully pull
against a live cluster. Do not commit real credentials, passwords, tokens, or
generated Secret files; the `secret.example.yaml` files are templates only.

## Resource sizing

Every backend service requests 250m CPU / 256Mi memory, with limits of 1 CPU /
512Mi. Six services at `minReplicas: 2` is already 12 pods before scaling, so
size the Phase 9 EC2 instance for that baseline rather than only for peak load.
