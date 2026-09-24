def JAVA_SERVICES = [
    'auth-service', 'catalog-service', 'inventory-service', 'booking-service',
    'payment-service', 'notification-service', 'api-gateway'
]
def ALL_WORKLOADS = JAVA_SERVICES + ['frontend']
def DOCKERHUB_USER = 'samarr30'
def KUBE_NAMESPACE = 'eventix'
def GATEWAY_PUBLIC_URL = 'http://65.0.176.1:30080'

pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Detect changed workloads') {
            steps {
                script {
                    def baseCommit = env.GIT_PREVIOUS_COMMIT?.trim()
                    if (!baseCommit) {
                        baseCommit = sh(
                            script: 'git rev-list --max-parents=0 HEAD',
                            returnStdout: true
                        ).trim()
                    }

                    def changedFilesText = sh(
                        script: "git diff --name-only ${baseCommit} ${env.GIT_COMMIT}",
                        returnStdout: true
                    ).trim()
                    def changedFiles = changedFilesText ? changedFilesText.split('\n') : []
                    def changed = ALL_WORKLOADS.findAll { workload ->
                        changedFiles.any { path ->
                            path.startsWith("services/${workload}/") ||
                            path.startsWith("infrastructure/k8s/${workload}/") ||
                            (workload == 'frontend' && path.startsWith('frontend/'))
                        }
                    }

                    env.CHANGED_WORKLOADS = changed.join(',')
                    echo "Compared ${baseCommit} to ${env.GIT_COMMIT}. Changed workloads: ${changed ?: '(none)'}"
                }
            }
        }

        stage('Build and test') {
            when {
                expression { env.CHANGED_WORKLOADS?.trim() }
            }
            steps {
                script {
                    env.CHANGED_WORKLOADS.split(',').each { workload ->
                        if (JAVA_SERVICES.contains(workload)) {
                            dir("services/${workload}") {
                                sh 'mvn -B package -DskipTests'
                            }
                        } else if (workload == 'frontend') {
                            dir('frontend') {
                                sh 'npm ci'
                                sh 'npm run lint'
                                sh 'npm run build'
                            }
                        }
                    }
                }
            }
        }

        stage('Build Docker images') {
            when {
                expression { env.CHANGED_WORKLOADS?.trim() }
            }
            steps {
                script {
                    def shortSha = env.GIT_COMMIT.take(12)
                    env.CHANGED_WORKLOADS.split(',').each { workload ->
                        def image = "${DOCKERHUB_USER}/${workload}"
                        if (workload == 'frontend') {
                            sh "docker build --build-arg VITE_API_BASE_URL=${GATEWAY_PUBLIC_URL} -t ${image}:${shortSha} -t ${image}:latest frontend"
                        } else {
                            sh "docker build -t ${image}:${shortSha} -t ${image}:latest services/${workload}"
                        }
                    }
                }
            }
        }

        stage('Push Docker images') {
            when {
                expression { env.CHANGED_WORKLOADS?.trim() }
            }
            steps {
                script {
                    def shortSha = env.GIT_COMMIT.take(12)
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                                                       usernameVariable: 'DOCKER_USER',
                                                       passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                        env.CHANGED_WORKLOADS.split(',').each { workload ->
                            def image = "${DOCKERHUB_USER}/${workload}"
                            sh "docker push ${image}:${shortSha}"
                            sh "docker push ${image}:latest"
                        }
                    }
                }
            }
        }

        stage('Deploy changed workloads') {
            when {
                expression { env.CHANGED_WORKLOADS?.trim() }
            }
            steps {
                script {
                    def shortSha = env.GIT_COMMIT.take(12)
                    withCredentials([file(credentialsId: 'k3s-kubeconfig', variable: 'KUBECONFIG')]) {
                        env.CHANGED_WORKLOADS.split(',').each { workload ->
                            def image = "${DOCKERHUB_USER}/${workload}:${shortSha}"
                            sh "kubectl set image deployment/${workload} ${workload}=${image} -n ${KUBE_NAMESPACE}"
                            sh "kubectl rollout status deployment/${workload} -n ${KUBE_NAMESPACE} --timeout=120s"
                        }
                    }
                }
            }
        }

        stage('Nothing to deploy') {
            when {
                expression { !env.CHANGED_WORKLOADS?.trim() }
            }
            steps {
                echo 'No deployable workload changed; build, image, push, and rollout stages skipped.'
            }
        }
    }
}
