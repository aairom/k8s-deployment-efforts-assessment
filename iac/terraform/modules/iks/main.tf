# ──────────────────────────────────────────────────────────────────────────────
# Module IKS — IBM Kubernetes Service
# Provisionne un cluster IKS VPC-Gen2 avec un worker pool multi-zone.
# ──────────────────────────────────────────────────────────────────────────────

provider "ibm" {
  ibmcloud_api_key = var.ibmcloud_api_key
  region           = var.region
}

# Résolution du Resource Group par son nom
data "ibm_resource_group" "rg" {
  name = var.resource_group
}

# Cluster IKS VPC-Gen2
resource "ibm_container_vpc_cluster" "cluster" {
  name              = var.cluster_name
  vpc_id            = var.vpc_id
  flavor            = var.worker_flavor
  worker_count      = var.worker_count
  kube_version      = var.kubernetes_version
  resource_group_id = data.ibm_resource_group.rg.id
  tags              = var.tags

  # Un zone/subnet par sous-réseau fourni
  dynamic "zones" {
    for_each = var.subnet_ids
    content {
      subnet_id = zones.value
      name      = "${var.region}-${zones.key + 1}"
    }
  }

  timeouts {
    create = "60m"
    update = "60m"
    delete = "30m"
  }
}

# Worker pool supplémentaire (optionnel — même configuration que le pool par défaut)
resource "ibm_container_vpc_worker_pool" "default_pool" {
  cluster           = ibm_container_vpc_cluster.cluster.id
  worker_pool_name  = var.worker_pool_name
  flavor            = var.worker_flavor
  vpc_id            = var.vpc_id
  worker_count      = var.worker_count
  resource_group_id = data.ibm_resource_group.rg.id

  dynamic "zones" {
    for_each = var.subnet_ids
    content {
      subnet_id = zones.value
      name      = "${var.region}-${zones.key + 1}"
    }
  }
}

# Récupération du kubeconfig après création
data "ibm_container_cluster_config" "kubeconfig" {
  cluster_name_id   = ibm_container_vpc_cluster.cluster.id
  resource_group_id = data.ibm_resource_group.rg.id
  admin             = true
}
