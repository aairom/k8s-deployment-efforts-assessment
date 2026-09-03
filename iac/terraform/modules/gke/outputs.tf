output "cluster_id" {
  description = "Identifiant unique du cluster GKE."
  value       = google_container_cluster.cluster.id
}

output "cluster_name" {
  description = "Nom du cluster GKE."
  value       = google_container_cluster.cluster.name
}

output "cluster_endpoint" {
  description = "URL du serveur API Kubernetes du cluster GKE."
  value       = "https://${google_container_cluster.cluster.endpoint}"
}

output "cluster_ca_certificate" {
  description = "Certificat CA (base64) du plan de contrôle GKE."
  value       = google_container_cluster.cluster.master_auth[0].cluster_ca_certificate
}

output "cluster_location" {
  description = "Région ou zone GCP du cluster GKE."
  value       = google_container_cluster.cluster.location
}

output "workload_identity_pool" {
  description = "Pool Workload Identity associé au cluster."
  value       = "${var.project_id}.svc.id.goog"
}

output "node_pool_name" {
  description = "Nom du node pool créé."
  value       = google_container_node_pool.workers.name
}
