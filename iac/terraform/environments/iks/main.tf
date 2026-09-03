terraform {
  required_version = ">= 1.5.0"

  required_providers {
    ibm = {
      source  = "ibm-cloud/ibm"
      version = ">= 1.62.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.12.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.25.0"
    }
  }
}

# ── Appel du module IKS ───────────────────────────────────────────────────────

module "iks_cluster" {
  source = "../../modules/iks"

  ibmcloud_api_key   = var.ibmcloud_api_key
  region             = var.region
  resource_group     = var.resource_group
  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version
  worker_pool_name   = var.worker_pool_name
  worker_flavor      = var.worker_flavor
  worker_count       = var.worker_count
  vpc_id             = var.vpc_id
  subnet_ids         = var.subnet_ids
  tags               = var.tags
}

# ── Déploiement du chart Helm via le module partagé ──────────────────────────

module "hello_operator" {
  source = "../../shared/helm-release"

  chart_path       = var.helm_chart_path
  release_name     = var.helm_release_name
  namespace        = var.helm_namespace
  create_namespace = true
  kubeconfig_path  = module.iks_cluster.kubeconfig_path
  values_override  = var.helm_values_override
  chart_version    = var.helm_chart_version
  atomic           = true
  timeout          = 300

  depends_on = [module.iks_cluster]
}

# ── Variables locales à cet environnement ────────────────────────────────────

variable "ibmcloud_api_key" {
  type      = string
  sensitive = true
}

variable "region" {
  type    = string
  default = "eu-de"
}

variable "resource_group" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "kubernetes_version" {
  type    = string
  default = "1.29.4"
}

variable "worker_pool_name" {
  type    = string
  default = "default"
}

variable "worker_flavor" {
  type    = string
  default = "bx2.4x16"
}

variable "worker_count" {
  type    = number
  default = 2
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "tags" {
  type    = list(string)
  default = ["env:production", "app:hello-operator"]
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

# ── Outputs ───────────────────────────────────────────────────────────────────

output "cluster_id" {
  value = module.iks_cluster.cluster_id
}

output "cluster_endpoint" {
  value = module.iks_cluster.cluster_endpoint
}

output "kubeconfig_path" {
  value = module.iks_cluster.kubeconfig_path
}

output "helm_status" {
  value = module.hello_operator.release_status
}
