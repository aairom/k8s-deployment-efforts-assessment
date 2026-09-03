output "cluster_id" {
  description = "ID de la ressource AKS dans Azure."
  value       = azurerm_kubernetes_cluster.cluster.id
}

output "cluster_name" {
  description = "Nom du cluster AKS."
  value       = azurerm_kubernetes_cluster.cluster.name
}

output "cluster_endpoint" {
  description = "URL du serveur API Kubernetes du cluster AKS."
  value       = azurerm_kubernetes_cluster.cluster.kube_config[0].host
}

output "kubeconfig_raw" {
  description = "Contenu brut du kubeconfig admin AKS (sensible)."
  value       = azurerm_kubernetes_cluster.cluster.kube_config_raw
  sensitive   = true
}

output "node_resource_group" {
  description = "Nom du Resource Group géré par AKS pour les nœuds."
  value       = azurerm_kubernetes_cluster.cluster.node_resource_group
}

output "identity_principal_id" {
  description = "Principal ID de l'identité managée SystemAssigned du cluster."
  value       = azurerm_kubernetes_cluster.cluster.identity[0].principal_id
}

output "log_analytics_workspace_id" {
  description = "ID du workspace Log Analytics Container Insights."
  value       = azurerm_log_analytics_workspace.aks_logs.id
}
