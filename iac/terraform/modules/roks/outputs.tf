output "cluster_id" {
  description = "ID unique du cluster ROKS."
  value       = ibm_container_vpc_cluster.cluster.id
}

output "cluster_name" {
  description = "Nom du cluster ROKS."
  value       = ibm_container_vpc_cluster.cluster.name
}

output "cluster_endpoint" {
  description = "URL du serveur API OpenShift du cluster ROKS."
  value       = ibm_container_vpc_cluster.cluster.master_url
}

output "kubeconfig_path" {
  description = "Chemin local du fichier kubeconfig généré pour ce cluster."
  value       = data.ibm_container_cluster_config.kubeconfig.config_file_path
}

output "ocp_version" {
  description = "Version OpenShift active sur le plan de contrôle."
  value       = ibm_container_vpc_cluster.cluster.kube_version
}

output "resource_group_id" {
  description = "ID du Resource Group IBM Cloud associé au cluster."
  value       = data.ibm_resource_group.rg.id
}
