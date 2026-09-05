#!/bin/bash
# Runs automatically on first boot (EC2 user_data).
# Installs a single-node k3s (lightweight Kubernetes) cluster.
curl -sfL https://get.k3s.io | sh -

# Let the ubuntu user run kubectl without sudo
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
