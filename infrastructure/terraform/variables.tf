variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1" # Mumbai - closest region if you're in India
}

variable "instance_type" {
  description = "EC2 instance size for the k3s node. t2.micro (free tier) is too small to run 6 Java services + Postgres + k3s - use at least t3.medium."
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair, for SSH access"
  type        = string
}

variable "s3_bucket_name" {
  description = "Globally unique S3 bucket name, e.g. eventix-assets-yourname-2026"
  type        = string
}
