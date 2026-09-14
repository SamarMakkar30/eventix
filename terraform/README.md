# Terraform - Eventix infrastructure (Phase 9)

Provisions:
- One EC2 instance running k3s (a lightweight, fully-compliant Kubernetes distribution)
- One S3 bucket for posters/banners
- An IAM role + instance profile giving that EC2 instance (and only that instance)
  read/write access to that specific bucket - no AWS access keys anywhere in this repo
- A security group allowing SSH, the k3s API, and only the frontend/API gateway NodePorts

The Terraform directory provisions infrastructure only. It does not build or publish
Docker images, install application manifests, or create Kubernetes secrets.

## Usage

```bash
cd terraform
terraform init
terraform plan  -var="key_name=YOUR_EC2_KEY_PAIR" -var="s3_bucket_name=eventix-assets-yourname-2026" -var="allowed_ssh_cidr=YOUR_IP/32" -var="allowed_kubernetes_api_cidr=YOUR_IP/32"
terraform apply -var="key_name=YOUR_EC2_KEY_PAIR" -var="s3_bucket_name=eventix-assets-yourname-2026" -var="allowed_ssh_cidr=YOUR_IP/32" -var="allowed_kubernetes_api_cidr=YOUR_IP/32"
```

Configure AWS credentials through the AWS CLI/profile or environment used by
Terraform. Never put access keys in Terraform variables, Kubernetes manifests, or
application configuration. The EC2 instance uses its IAM instance profile for S3.

## Getting kubectl working from your own laptop (not just via SSH)

The k3s install script fetches the instance's own public IP and bakes it into
both the server's TLS certificate and the kubeconfig file, specifically so this
works:

```bash
scp -i your-key.pem ubuntu@$(terraform output -raw k3s_node_public_ip):~/.kube/config ./eventix-kubeconfig
export KUBECONFIG=$(pwd)/eventix-kubeconfig
kubectl get nodes
```

Without that fix, this kubeconfig would only work from inside the instance
itself (`server: https://127.0.0.1:6443`) and would fail TLS verification if
you pointed it at the public IP manually - a well-known k3s-on-a-cloud-VM
gotcha, not something obvious from the k3s docs' quickstart.

## Full deployment walkthrough, start to finish

```bash
# 1. Provision the infrastructure (above), then get kubectl working (above).

# 2. Deploy Kubernetes prerequisites from the repository root
kubectl apply -f ../infrastructure/k8s/namespace.yaml
# Fill in every infrastructure/k8s/*/secret.example.yaml -> secret.yaml first -
# see infrastructure/k8s/README.md's JWT_SECRET warning before doing this.
kubectl apply -f ../infrastructure/k8s/postgres/

# 3. Build and push every image (from your own machine, Docker Hub is simplest)
docker build -t <dockerhub-user>/auth-service:latest ../services/auth-service
docker push <dockerhub-user>/auth-service:latest
# Repeat for catalog-service, inventory-service, booking-service, payment-service,
# notification-service, and api-gateway.

# Vite reads VITE_API_BASE_URL at build time.
docker build --build-arg VITE_API_BASE_URL=http://$(terraform output -raw k3s_node_public_ip):30080/api \
  -t <dockerhub-user>/frontend:latest ../frontend
docker push <dockerhub-user>/frontend:latest

# 4. Update every infrastructure/k8s/*/deployment.yaml image: line to your
#    actual Docker Hub username (replace <your-dockerhub-username>), then:
kubectl apply -f ../infrastructure/k8s/auth-service/
kubectl apply -f ../infrastructure/k8s/catalog-service/
kubectl apply -f ../infrastructure/k8s/inventory-service/
kubectl apply -f ../infrastructure/k8s/booking-service/
kubectl apply -f ../infrastructure/k8s/payment-service/
kubectl apply -f ../infrastructure/k8s/notification-service/
kubectl apply -f ../infrastructure/k8s/api-gateway/
kubectl apply -f ../infrastructure/k8s/frontend/

# 5. Verify
kubectl get pods -n eventix
```

Visit `http://<public-ip>:30300` for the frontend, `http://<public-ip>:30080/api/...`
for the API directly.

**One thing you'll hit and shouldn't be surprised by:** the gateway's
`CORS_ALLOWED_ORIGIN` (in `infrastructure/k8s/api-gateway/configmap.yaml`) needs
to be updated to `http://<public-ip>:30300` and re-applied before the deployed
frontend can successfully call the deployed gateway - the default only works for
local dev. Same root cause as the CORS fix from Phase 6, just a different origin now.

Before applying catalog-service, replace `S3_BUCKET_NAME` in its ConfigMap with
`terraform output -raw s3_bucket_name`. Its upload endpoints are admin-only:
`POST /catalog/movies/{id}/poster` and `POST /catalog/events/{id}/banner`.
The bucket is private; returned object URLs require an appropriate read strategy
later if browsers must fetch them directly. Uploads work on EC2 through the IAM
instance profile. Local uploads require AWS credentials available to the AWS SDK
default credential chain; local catalog browsing does not require S3 credentials.

## On not using an Elastic IP

Deliberately skipped. An Elastic IP would keep the public IP stable across
stop/start, but associating one via Terraform introduces a real race condition
risk: the k3s install script (which runs during first boot) needs the *final*
public IP to bake into the TLS certificate, and there's no guarantee the EIP
association completes before that script runs. The simpler, safer choice: accept
that the IP changes if you stop and restart the instance, and re-run the `scp`/
`CORS_ALLOWED_ORIGIN`/frontend-rebuild steps above if that happens. An Elastic
IP is a reasonable improvement to make later, with proper `depends_on` handling
of that race - not free to add carelessly today.

## Cost note

A t3.medium runs about $0.04/hour (~$30/month if left on 24/7). Run
`terraform destroy` when you're not actively working, and re-`apply` before
your demo. Six backend services at `minReplicas: 2` each is already 12 pods
before any HPA scaling happens - this is why the default instance size is
t3.medium, not the free-tier t2.micro (which doesn't have enough RAM for that
baseline plus k3s itself).
