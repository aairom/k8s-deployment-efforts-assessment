# ──────────────────────────────────────────────────────────────────────────────
# Shared module: helm-release
# Déploie le chart Helm hello-operator sur un cluster Kubernetes cible.
# Le provider Helm est configuré à partir du kubeconfig fourni en entrée.
# ──────────────────────────────────────────────────────────────────────────────

provider "helm" {
  kubernetes {
    config_path = var.kubeconfig_path
  }
}

provider "kubernetes" {
  config_path = var.kubeconfig_path
}

# ── Namespace cible ───────────────────────────────────────────────────────────

resource "kubernetes_namespace" "operator_ns" {
  count = var.create_namespace ? 1 : 0

  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = "hello-operator"
    }
  }
}

# ── Release Helm ──────────────────────────────────────────────────────────────

resource "helm_release" "hello_operator" {
  name             = var.release_name
  chart            = var.chart_path
  version          = var.chart_version != "" ? var.chart_version : null
  namespace        = var.namespace
  create_namespace = false # Géré par kubernetes_namespace ci-dessus
  atomic           = var.atomic
  timeout          = var.timeout
  cleanup_on_fail  = true

  # Surcharges de valeurs dynamiques
  dynamic "set" {
    for_each = var.values_override
    content {
      name  = set.key
      value = set.value
    }
  }

  depends_on = [kubernetes_namespace.operator_ns]
}
