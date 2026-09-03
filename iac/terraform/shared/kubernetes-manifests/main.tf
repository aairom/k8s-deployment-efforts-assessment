# ──────────────────────────────────────────────────────────────────────────────
# Shared module: kubernetes-manifests
# Applique les manifests Kubernetes bruts (CRDs, RBAC, samples) via kubectl.
# ──────────────────────────────────────────────────────────────────────────────

provider "kubectl" {
  config_path = var.kubeconfig_path
}

# Lecture et application de tous les fichiers YAML dans le répertoire spécifié
data "kubectl_path_documents" "manifests" {
  pattern = "${var.manifests_directory}/*.yaml"
}

resource "kubectl_manifest" "apply" {
  for_each  = toset(data.kubectl_path_documents.manifests.documents)
  yaml_body = each.value

  wait              = true
  server_side_apply = true
}
