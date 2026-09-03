# ──────────────────────────────────────────────────────────────────────────────
# Module AKS — Azure Kubernetes Service
# Provisionne un cluster AKS avec identité managée, auto-scaling, et
# intégration Azure Monitor / Container Insights.
# ──────────────────────────────────────────────────────────────────────────────

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
  subscription_id = var.subscription_id
}

# ── Resource Group ────────────────────────────────────────────────────────────

resource "azurerm_resource_group" "rg" {
  name     = var.resource_group
  location = var.location
  tags     = var.tags
}

# ── Log Analytics Workspace (pour Container Insights) ────────────────────────

resource "azurerm_log_analytics_workspace" "aks_logs" {
  name                = "${var.cluster_name}-logs"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

# ── Cluster AKS ──────────────────────────────────────────────────────────────

resource "azurerm_kubernetes_cluster" "cluster" {
  name                = var.cluster_name
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = var.cluster_name
  kubernetes_version  = var.kubernetes_version
  tags                = var.tags

  # Identité managée (recommandée vs Service Principal)
  identity {
    type = "SystemAssigned"
  }

  # Node pool système (obligatoire)
  default_node_pool {
    name                 = var.node_pool_name
    vm_size              = var.vm_size
    node_count           = var.enable_auto_scaling ? null : var.node_count
    min_count            = var.enable_auto_scaling ? var.min_count : null
    max_count            = var.enable_auto_scaling ? var.max_count : null
    auto_scaling_enabled = var.enable_auto_scaling
    vnet_subnet_id       = var.vnet_subnet_id
    os_disk_type         = "Managed"
    os_disk_size_gb      = 128

    upgrade_settings {
      max_surge = "33%"
    }
  }

  # Réseau Azure CNI
  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    load_balancer_sku = "standard"
  }

  # RBAC avec AAD (Entra ID) géré — Azure RBAC activé
  azure_active_directory_role_based_access_control {
    azure_rbac_enabled = true
  }

  # Container Insights
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.aks_logs.id
  }

  # Mise à jour automatique du patch
  maintenance_window_auto_upgrade {
    frequency   = "Weekly"
    interval    = 1
    duration    = 4
    day_of_week = "Sunday"
    utc_offset  = "+00:00"
    start_time  = "02:00"
  }

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count,
    ]
  }
}
