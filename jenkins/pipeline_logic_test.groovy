class PipelineLogic {
    static final List JAVA_SERVICES = [
        'auth-service', 'catalog-service', 'inventory-service', 'booking-service',
        'payment-service', 'notification-service', 'api-gateway'
    ]
    static final List WORKLOADS = JAVA_SERVICES + ['frontend']

    static List changedWorkloads(String changedFilesText) {
        def files = changedFilesText ? changedFilesText.readLines() : []
        WORKLOADS.findAll { workload ->
            files.any { path ->
                path.startsWith("services/${workload}/") ||
                path.startsWith("infrastructure/k8s/${workload}/") ||
                (workload == 'frontend' && path.startsWith('frontend/'))
            }
        }
    }

    static List commands(String workload, String sha) {
        def image = "demo/${workload}:${sha}"
        def result = []
        if (JAVA_SERVICES.contains(workload)) {
            result << "cd services/${workload} && mvn -B clean verify"
            result << "docker build -t demo/${workload}:${sha} -t demo/${workload}:latest services/${workload}"
        } else {
            result << 'cd frontend && npm ci && npm run lint && npm run build'
            result << "docker build --build-arg VITE_API_BASE_URL=http://gateway:30080/api -t ${image} -t demo/${workload}:latest frontend"
        }
        result << "kubectl set image deployment/${workload} ${workload}=${image} -n eventix"
        result << "kubectl rollout status deployment/${workload} -n eventix --timeout=120s"
        result
    }
}

assert PipelineLogic.changedWorkloads('services/auth-service/src/Main.java') == ['auth-service']
assert PipelineLogic.changedWorkloads('frontend/src/App.tsx') == ['frontend']
assert PipelineLogic.changedWorkloads('services/payment-service/pom.xml\nfrontend/src/main.tsx') == ['payment-service', 'frontend']
assert PipelineLogic.changedWorkloads('README.md') == []
assert PipelineLogic.changedWorkloads('services/catalog-service/src/App.java') == ['catalog-service']
assert PipelineLogic.changedWorkloads('services/auth-service/a.java\nREADME.md\nservices/auth-service/b.java') == ['auth-service']

def javaCommands = PipelineLogic.commands('auth-service', 'abc1234')
assert javaCommands[0].contains('mvn -B clean verify')
assert javaCommands[1].contains('docker build')
assert javaCommands[2].contains('deployment/auth-service')
assert javaCommands.size() == 4

def frontendCommands = PipelineLogic.commands('frontend', 'abc1234')
assert frontendCommands[0].contains('npm ci')
assert frontendCommands[1].contains('VITE_API_BASE_URL')
assert !frontendCommands[1].contains('REACT_APP_API_BASE_URL')
assert frontendCommands[2].contains('deployment/frontend frontend=')

println 'pipeline_logic_test.groovy: all assertions passed'