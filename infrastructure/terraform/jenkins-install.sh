#!/bin/bash
set -euo pipefail

curl -fsSL https://get.docker.com | sh
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y git maven nodejs npm
usermod -aG docker ubuntu

curl -fsSL -o /usr/local/bin/kubectl \
  "https://dl.k8s.io/release/$(curl -fsSL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod 0755 /usr/local/bin/kubectl

mkdir -p /var/jenkins_home

# Jenkins uses the host Docker daemon (Docker-outside-of-Docker). Maven and
# Node are installed on the host and mounted because the stock Jenkins image
# does not include the toolchain used by this repository's pipeline.
docker run -d --name jenkins --restart unless-stopped \
  -p 8090:8080 \
  -v /var/jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /usr/bin/docker:/usr/bin/docker:ro \
  -v /usr/bin/mvn:/usr/bin/mvn:ro \
  -v /usr/share/maven:/usr/share/maven:ro \
  -v /usr/bin/node:/usr/bin/node:ro \
  -v /usr/bin/npm:/usr/bin/npm:ro \
  -v /usr/lib/node_modules:/usr/lib/node_modules:ro \
  -v /usr/share/nodejs:/usr/share/nodejs:ro \
  -v /usr/local/bin/kubectl:/usr/local/bin/kubectl:ro \
  -u root \
  jenkins/jenkins:lts