output "k3s_node_public_ip" {
  value = aws_instance.k3s_node.public_ip
}

output "s3_bucket_name" {
  value = aws_s3_bucket.eventix_assets.bucket
}

output "jenkins_node_public_ip" {
  value = aws_instance.jenkins_node.public_ip
}

output "jenkins_node_instance_id" {
  value = aws_instance.jenkins_node.id
}

output "jenkins_access_url" {
  value = "http://${aws_instance.jenkins_node.public_ip}:8090"
}
