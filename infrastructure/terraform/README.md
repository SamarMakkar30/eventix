# Terraform - Eventix infrastructure (Phase 9)

Provisions:
- One EC2 instance running k3s (a lightweight, fully-compliant Kubernetes distribution)
- One S3 bucket for posters/banners/generated tickets
- A security group allowing SSH, HTTP/S, the k8s API, and the NodePort range

## Usage

```bash
cd infrastructure/terraform
terraform init
terraform plan  -var="key_name=YOUR_EC2_KEY_PAIR" -var="s3_bucket_name=eventix-assets-yourname-2026"
terraform apply -var="key_name=YOUR_EC2_KEY_PAIR" -var="s3_bucket_name=eventix-assets-yourname-2026"
```

After apply, SSH in and confirm the cluster is up:

```bash
ssh -i your-key.pem ubuntu@$(terraform output -raw k3s_node_public_ip)
sudo k3s kubectl get nodes
```

**Cost note:** a t3.medium runs about $0.04/hour (~$30/month if left on 24/7). Run
`terraform destroy` when you're not actively working, and re-`apply` before your demo.
