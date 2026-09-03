output "applied_manifest_count" {
  description = "Nombre de manifests Kubernetes appliqués."
  value       = length(kubectl_manifest.apply)
}
