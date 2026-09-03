# ──────────────────────────────────────────────────────────────────────────────
# Valeurs d'exemple pour l'environnement IKS
# NE PAS committer ce fichier avec de vraies clés API.
# Utiliser : export TF_VAR_ibmcloud_api_key="<votre_clé>"
# ──────────────────────────────────────────────────────────────────────────────

region             = "eu-de"
resource_group     = "hello-operator-rg"
cluster_name       = "hello-operator-iks-prod"
kubernetes_version = "1.29.4"
worker_pool_name   = "hello-op-pool"
worker_flavor      = "bx2.4x16"
worker_count       = 2
vpc_id             = "r010-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
subnet_ids = [
  "0717-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "0727-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
]
tags = [
  "env:production",
  "app:hello-operator",
  "platform:iks",
  "managed-by:terraform",
]
helm_chart_path    = "../../../hello-operator/chart"
helm_release_name  = "hello-operator"
helm_namespace     = "hello-operator-system"
helm_chart_version = ""
helm_values_override = {
  "replicaCount"              = "2"
  "image.tag"                 = "v0.1.0"
  "resources.requests.cpu"    = "100m"
  "resources.requests.memory" = "128Mi"
  "resources.limits.cpu"      = "500m"
  "resources.limits.memory"   = "256Mi"
}
