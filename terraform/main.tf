terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Always fetch the latest Ubuntu 22.04 AMI instead of hardcoding an ID,
# so this stays valid regardless of when/where you apply it.
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_security_group" "eventix_sg" {
  name        = "eventix-sg"
  description = "SSH, HTTP/S, Kubernetes API, and NodePort range"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  ingress {
    description = "Kubernetes API (k3s)"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = [var.allowed_kubernetes_api_cidr]
  }

  ingress {
    description = "Frontend NodePort"
    from_port   = 30300
    to_port     = 30300
    protocol    = "tcp"
    cidr_blocks = [var.allowed_nodeport_cidr]
  }

  ingress {
    description = "API Gateway NodePort"
    from_port   = 30080
    to_port     = 30080
    protocol    = "tcp"
    cidr_blocks = [var.allowed_nodeport_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "k3s_node" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.eventix_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.eventix_ec2_profile.name
  user_data              = file("${path.module}/k3s-install.sh")

  root_block_device {
    volume_size = 20
  }

  tags = {
    Name = "eventix-k3s-node"
  }
}

resource "aws_s3_bucket" "eventix_assets" {
  bucket = var.s3_bucket_name
}

resource "aws_s3_bucket_public_access_block" "eventix_assets" {
  bucket                  = aws_s3_bucket.eventix_assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "eventix_assets" {
  bucket = aws_s3_bucket.eventix_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# The EC2 instance gets S3 access via an IAM instance profile - never via
# hardcoded access keys anywhere in this repo or in catalog-service's config.
# The AWS SDK's default credential chain picks this up automatically once the
# instance profile is attached; catalog-service's S3Config doesn't reference
# credentials at all.
resource "aws_iam_role" "eventix_ec2_role" {
  name = "eventix-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "eventix_s3_access" {
  name = "eventix-s3-access"
  role = aws_iam_role.eventix_ec2_role.id

  # Two statements, not one combined list: ListBucket is a bucket-level action
  # (needs the bucket ARN itself) while Get/Put/Delete are object-level actions
  # (need the /* suffix). Keeping them separate is correct IAM hygiene, not
  # just style - worth pointing out as a deliberate choice if asked.
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListBucket"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [aws_s3_bucket.eventix_assets.arn]
      },
      {
        Sid      = "ReadWriteObjects"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = ["${aws_s3_bucket.eventix_assets.arn}/*"]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "eventix_ec2_profile" {
  name = "eventix-ec2-profile"
  role = aws_iam_role.eventix_ec2_role.name
}
