terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.90.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.12.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.25.0"
    }
    local = {
      source  = "hashicorp/local"
      version = ">= 2.4.0"
    }
  }
}

module "aks_cluster" {
  source = "../../modules/aks"

  subscription_id     = var.subscription_id
  resource_group      = var.resource_group
  location            = var.location
  cluster_name        = var.cluster_name
  kubernetes_version  = var.kubernetes_version
  node_pool_name      = var.node_pool_name
  vm_size             = var.vm_size
  node_count          = var.node_count
  min_count           = var.min_count
  max_count           = var.max_count
  enable_auto_scaling = var.enable_auto_scaling
  vnet_subnet_id      = var.vnet_subnet_id
  tags                = var.tags
}

# Écriture du kubeconfig AKS dans un fichier local
resource "local_file" "aks_kubeconfig" {
  content         = module.aks_cluster.kubeconfig_raw
  filename        = var.kubeconfig_output_path
  file_permission = "0600"
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

  depends_on = [local_file.aks_kubeconfig]
}

variable "subscription_id" {
  type = string
}

variable "resource_group" {
  type = string
}

variable "location" {
  type    = string
  default = "westeurope"
}

variable "cluster_name" {
  type = string
}

variable "kubernetes_version" {
  type    = string
  default = "1.29.2"
}

variable "node_pool_name" {
  type    = string
  default = "systempool"
}

variable "vm_size" {
  type    = string
  default = "Standard_D4s_v3"
}

variable "node_count" {
  type    = number
  default = 2
}

variable "min_count" {
  type    = number
  default = 1
}

variable "max_count" {
  type    = number
  default = 4
}

variable "enable_auto_scaling" {
  type    = bool
  default = true
}

variable "vnet_subnet_id" {
  type = string
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
  default = "~/.kube/config-aks-hello-operator"
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

output "cluster_id" {
  value = module.aks_cluster.cluster_id
}

output "cluster_endpoint" {
  value = module.aks_cluster.cluster_endpoint
}

output "helm_status" {
  value = module.hello_operator.release_status
}
