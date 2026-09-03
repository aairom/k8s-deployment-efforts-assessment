terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.12.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.25.0"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.2.0"
    }
  }
}

module "eks_cluster" {
  source = "../../modules/eks"

  aws_region         = var.aws_region
  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version
  node_group_name    = var.node_group_name
  instance_types     = var.instance_types
  desired_size       = var.desired_size
  min_size           = var.min_size
  max_size           = var.max_size
  vpc_id             = var.vpc_id
  subnet_ids         = var.subnet_ids
  tags               = var.tags
}

# Génération du kubeconfig EKS via la commande AWS CLI
resource "null_resource" "eks_kubeconfig" {
  provisioner "local-exec" {
    command = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks_cluster.cluster_name} --kubeconfig ${var.kubeconfig_output_path}"
  }
  depends_on = [module.eks_cluster]
}

module "hello_operator" {
  source = "../../shared/helm-release"

  chart_path       = var.helm_chart_path
  release_name     = var.helm_release_name
  namespace        = var.helm_namespace
  create_namespace = true
  kubeconfig_path  = var.kubeconfig_output_path
  values_override  = var.helm_values_override
  chart_version    = var.helm_chart_version
  atomic           = true
  timeout          = 300

  depends_on = [null_resource.eks_kubeconfig]
}

variable "aws_region" {
  type    = string
  default = "eu-west-1"
}

variable "cluster_name" {
  type = string
}

variable "kubernetes_version" {
  type    = string
  default = "1.29"
}

variable "node_group_name" {
  type    = string
  default = "hello-operator-nodes"
}

variable "instance_types" {
  type    = list(string)
  default = ["m5.xlarge"]
}

variable "desired_size" {
  type    = number
  default = 2
}

variable "min_size" {
  type    = number
  default = 1
}

variable "max_size" {
  type    = number
  default = 4
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "tags" {
  type = map(string)
  default = {
    "ManagedBy" = "terraform"
    "App"       = "hello-operator"
  }
}

variable "kubeconfig_output_path" {
  type    = string
  default = "~/.kube/config-eks-hello-operator"
}

variable "helm_chart_path" {
  type    = string
  default = "../../../hello-operator/chart"
}

variable "helm_release_name" {
  type    = string
  default = "hello-operator"
}

variable "helm_namespace" {
  type    = string
  default = "hello-operator-system"
}

variable "helm_chart_version" {
  type    = string
  default = ""
}

variable "helm_values_override" {
  type    = map(string)
  default = {}
}

output "cluster_arn" {
  value = module.eks_cluster.cluster_id
}

output "cluster_endpoint" {
  value = module.eks_cluster.cluster_endpoint
}

output "oidc_issuer_url" {
  value = module.eks_cluster.oidc_issuer_url
}

output "helm_status" {
  value = module.hello_operator.release_status
}
