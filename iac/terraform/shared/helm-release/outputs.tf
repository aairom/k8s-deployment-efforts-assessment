output "release_name" {
  description = "Nom du release Helm déployé."
  value       = helm_release.hello_operator.name
}

output "namespace" {
  description = "Namespace Kubernetes dans lequel le release a été déployé."
  value       = helm_release.hello_operator.namespace
}

output "release_status" {
  description = "Statut courant du release Helm."
  value       = helm_release.hello_operator.status
}

output "chart_version" {
  description = "Version du chart Helm déployée."
  value       = helm_release.hello_operator.version
}
