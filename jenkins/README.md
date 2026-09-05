# Jenkins (Phase 12)

1. Run Jenkins itself as a container (or on the same/another EC2 box):
   `docker run -d -p 8090:8080 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts`
2. Install the Docker Pipeline and GitHub plugins.
3. Add DockerHub credentials in Jenkins as `dockerhub-creds`.
4. In your GitHub repo settings, add a webhook pointing at
   `http://<jenkins-host>:8090/github-webhook/`.
5. Create a pipeline job per service using `Jenkinsfile.template` as the base
   (or one parameterized multibranch job for all six).
