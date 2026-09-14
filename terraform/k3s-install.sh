#!/bin/bash
# Runs automatically on first boot (EC2 user_data).
# Installs a single-node k3s (lightweight Kubernetes) cluster.
set -e

# Fetch this instance's own public IP via the EC2 instance metadata service
# (IMDSv2 - a token is required first on current-generation Ubuntu AMIs).
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)

# --tls-san adds the public IP to k3s's server certificate. Without this,
# kubectl from your own laptop fails TLS verification outright - k3s's default
# self-signed cert only covers localhost and the instance's private IP, never
# whatever address you're actually connecting from.
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --tls-san $PUBLIC_IP" sh -

# Let the ubuntu user run kubectl without sudo, from inside the instance.
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config

# Also rewrite the server address from 127.0.0.1 to the public IP, so this
# same kubeconfig file works after you scp it to your own laptop too - see
# infrastructure/terraform/README.md for the exact command.
sed -i "s/127.0.0.1/$PUBLIC_IP/" /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
