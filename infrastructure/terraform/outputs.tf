output "k3s_node_public_ip" {
  value = aws_instance.k3s_node.public_ip
}

output "s3_bucket_name" {
  value = aws_s3_bucket.eventix_assets.bucket
}
