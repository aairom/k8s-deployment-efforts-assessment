# ──────────────────────────────────────────────────────────────────────────────
# Module GKE — Google Kubernetes Engine
# Provisionne un cluster GKE régional Standard avec un node pool autoscalable,
# Workload Identity, et Binary Authorization désactivée (configurable).
# ──────────────────────────────────────────────────────────────────────────────

provider "google" {
  project = var.project_id
  region  = var.region
}

# ── Cluster GKE ──────────────────────────────────────────────────────────────

resource "google_container_cluster" "cluster" {
  name     = var.cluster_name
  location = var.region

  # Suppression du node pool par défaut — on crée un pool séparé
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = var.network
  subnetwork = var.subnetwork

  min_master_version = var.kubernetes_version

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Logging et monitoring Cloud Operations
  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }
  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS", "APISERVER", "SCHEDULER", "CONTROLLER_MANAGER"]
    managed_prometheus {
      enabled = true
    }
  }

  # IP aliasing (requis pour VPC-native)
  ip_allocation_policy {}

  # Accès privé au plan de contrôle (recommandé en production)
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "Tout (à restreindre en production)"
    }
  }

  release_channel {
    channel = "REGULAR"
  }

  lifecycle {
    ignore_changes = [
      initial_node_count,
      min_master_version,
    ]
  }
}

# ── Node Pool ─────────────────────────────────────────────────────────────────

resource "google_container_node_pool" "workers" {
  name     = var.node_pool_name
  cluster  = google_container_cluster.cluster.name
  location = var.region

  autoscaling {
    min_node_count = var.min_node_count
    max_node_count = var.max_node_count
  }

  initial_node_count = var.initial_node_count

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }

  node_config {
    machine_type = var.machine_type
    disk_type    = "pd-ssd"
    disk_size_gb = 100
    tags         = var.tags

    # Workload Identity sur les nœuds
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    # Désactiver les métadonnées d'instance legacy
    metadata = {
      disable-legacy-endpoints = "true"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }
}
