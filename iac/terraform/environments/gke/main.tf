terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
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

module "gke_cluster" {
  source = "../../modules/gke"

  project_id         = var.project_id
  region             = var.region
  zone               = var.zone
  cluster_name       = var.cluster_name
  kubernetes_version = var.kubernetes_version
  node_pool_name     = var.node_pool_name
  machine_type       = var.machine_type
  initial_node_count = var.initial_node_count
  min_node_count     = var.min_node_count
  max_node_count     = var.max_node_count
  network            = var.network
  subnetwork         = var.subnetwork
  tags               = var.tags
}

# Génération du kubeconfig GKE via gcloud
resource "null_resource" "gke_kubeconfig" {
  provisioner "local-exec" {
    command = "gcloud container clusters get-credentials ${module.gke_cluster.cluster_name} --region ${var.region} --project ${var.project_id} --kubeconfig ${var.kubeconfig_output_path}"
  }
  depends_on = [module.gke_cluster]
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

  depends_on = [null_resource.gke_kubeconfig]
}

variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "europe-west1"
}

variable "zone" {
  type    = string
  default = "europe-west1-b"
}

variable "cluster_name" {
  type = string
}

variable "kubernetes_version" {
  type    = string
  default = "1.29"
}

variable "node_pool_name" {
  type    = string
  default = "hello-operator-pool"
}

variable "machine_type" {
  type    = string
  default = "e2-standard-4"
}

variable "initial_node_count" {
  type    = number
  default = 1
}

variable "min_node_count" {
  type    = number
  default = 1
}

variable "max_node_count" {
  type    = number
  default = 4
}

variable "network" {
  type    = string
  default = "default"
}

variable "subnetwork" {
  type    = string
  default = "default"
}

variable "tags" {
  type    = list(string)
  default = ["hello-operator", "managed-by-terraform"]
}

variable "kubeconfig_output_path" {
  type    = string
  default = "~/.kube/config-gke-hello-operator"
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
  value = module.gke_cluster.cluster_id
}

output "cluster_endpoint" {
  value = module.gke_cluster.cluster_endpoint
}

output "workload_identity_pool" {
  value = module.gke_cluster.workload_identity_pool
}

output "helm_status" {
  value = module.hello_operator.release_status
}
