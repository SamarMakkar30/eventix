# Eventix Jenkins CI/CD

The root `Jenkinsfile` is a GitHub-webhook-triggered monorepo pipeline. It
checks out the repository, compares `GIT_PREVIOUS_COMMIT` with `GIT_COMMIT`
(falling back to the repository's first commit), then builds, tests, pushes,
and rolls out only changed workloads. README-only and other unrelated changes
successfully skip application stages.

## Provision Jenkins

1. Create or identify the Jenkins EC2 key pair, then apply the existing
   Terraform module:

   ```bash
   cd infrastructure/terraform
   terraform apply -var="key_name=YOUR_KEY" \
     -var="s3_bucket_name=YOUR_UNIQUE_BUCKET" \
     -var="allowed_ssh_cidr=YOUR_IP/32" \
     -var="allowed_kubernetes_api_cidr=JENKINS_PUBLIC_IP/32"
   terraform output jenkins_node_public_ip
   terraform output jenkins_access_url
   ```

   Use a larger `-var="jenkins_instance_type=t3.small"` or more for reliable
   Maven and Docker builds. `t3.micro` is a demo/free-tier-oriented default.
2. Open the Jenkins URL on port `8090` and complete the initial setup.
3. Install the suggested plugins plus GitHub Integration, Pipeline, Git, and
   Docker Pipeline if they are not already installed.
4. Retrieve the initial password over SSH:

   ```bash
   ssh -i YOUR_KEY.pem ubuntu@JENKINS_PUBLIC_IP
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```

## Configure Jenkins

5. Add these Jenkins credentials. Do not commit either secret.

   | Kind | ID | Value |
   | --- | --- | --- |
   | Username with password | `dockerhub-creds` | Docker Hub username and access token |
   | Secret file | `k3s-kubeconfig` | K3s kubeconfig with the cluster endpoint configured |

6. Create a Pipeline job from SCM. Use repository
   `SamarMakkar30/eventix`, branch `master`, and script path `Jenkinsfile`.
   Enable **GitHub hook trigger for GITScm polling**.
7. Set the three non-secret values near the top of the root Jenkinsfile:
   `DOCKERHUB_USER`, `KUBE_NAMESPACE` (`eventix`), and
   `GATEWAY_PUBLIC_URL` (for example,
   `http://<k3s-public-ip>:30080/api`). The frontend uses the required
   `VITE_API_BASE_URL` build argument; it must not use localhost in deployment.
8. In GitHub, add a push-event webhook with payload URL
   `http://<jenkins-public-ip>:8090/github-webhook/` and content type
   `application/json`.

## Verify a push

Push a change under one service or `frontend/` and confirm the console log
shows only that workload, its Maven or npm checks, its immutable 12-character
commit image and `latest` image pushes, and its matching `kubectl` rollout.
Then push a README-only change and confirm all application stages are skipped.

The Jenkins host uses Docker-outside-of-Docker: the Jenkins container mounts
the host Docker socket and CLI. This grants builds root-equivalent control of
the EC2 host, so use a dedicated instance, restrict SSH, protect Jenkins
administration, and do not expose the socket to untrusted jobs. Port `8090` is
open for GitHub webhooks; production deployments should put Jenkins behind
HTTPS and restrict access with a reverse proxy or network controls.

The standalone decision/command test is `jenkins/pipeline_logic_test.groovy`.
It covers service-only, frontend-only, multi-service, README-only,
first-build, and multi-commit ranges. A real Jenkins, AWS, GitHub webhook, and
K3s rollout were not available for local validation and are not claimed here.# Jenkins (Phase 12)

1. Run Jenkins itself as a container (or on the same/another EC2 box):
   `docker run -d -p 8090:8080 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts`
2. Install the Docker Pipeline and GitHub plugins.
3. Add DockerHub credentials in Jenkins as `dockerhub-creds`.
4. In your GitHub repo settings, add a webhook pointing at
   `http://<jenkins-host>:8090/github-webhook/`.
5. Create a pipeline job per service using `Jenkinsfile.template` as the base
   (or one parameterized multibranch job for all six).
