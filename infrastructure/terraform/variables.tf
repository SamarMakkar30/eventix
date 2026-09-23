variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1" # Mumbai - closest region if you're in India
}

variable "instance_type" {
  description = "EC2 instance size for the k3s node. t2.micro (free tier) is too small to run 6 Java services + Postgres + k3s - use at least t3.medium."
  type        = string
  default     = "m7i-flex.large"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair, for SSH access"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH to the application and Jenkins EC2 hosts"
  type        = string
}

variable "allowed_kubernetes_api_cidr" {
  description = "CIDR allowed to access the K3s API"
  type        = string
}

variable "allowed_nodeport_cidr" {
  description = "CIDR allowed to access the public application NodePorts"
  type        = string
  default     = "0.0.0.0/0"
}

variable "s3_bucket_name" {
  description = "Globally unique S3 bucket name, e.g. eventix-assets-yourname-2026"
  type        = string
}

variable "jenkins_instance_type" {
  description = "EC2 size for Jenkins. t3.micro suits a demo; Maven and Docker builds may need a larger instance in production."
  type        = string
  default     = "t3.micro"
}
