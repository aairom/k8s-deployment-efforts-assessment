variable "kubeconfig_path" {
  type        = string
  description = "Chemin vers le fichier kubeconfig à utiliser."
  default     = "~/.kube/config"
}

variable "manifests_directory" {
  type        = string
  description = "Chemin vers le répertoire contenant les manifests YAML Kubernetes à appliquer."
}

variable "namespace" {
  type        = string
  description = "Namespace Kubernetes par défaut pour les manifests sans namespace explicite."
  default     = "hello-operator-system"
}
