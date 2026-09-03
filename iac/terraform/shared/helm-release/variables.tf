variable "chart_path" {
  type        = string
  description = "Chemin local ou URL du chart Helm hello-operator à déployer."
}

variable "release_name" {
  type        = string
  description = "Nom du release Helm."
  default     = "hello-operator"
}

variable "namespace" {
  type        = string
  description = "Namespace Kubernetes cible pour le déploiement."
  default     = "hello-operator-system"
}

variable "create_namespace" {
  type        = bool
  description = "Créer le namespace s'il n'existe pas."
  default     = true
}

variable "values_override" {
  type        = map(string)
  description = "Map de valeurs Helm à surcharger (key = chemin YAML pointé, value = valeur)."
  default     = {}
}

variable "kubeconfig_path" {
  type        = string
  description = "Chemin vers le fichier kubeconfig à utiliser pour se connecter au cluster."
  default     = "~/.kube/config"
}

variable "chart_version" {
  type        = string
  description = "Version du chart Helm à déployer (laisser vide pour la dernière)."
  default     = ""
}

variable "atomic" {
  type        = bool
  description = "Si true, rollback automatique en cas d'échec du déploiement Helm."
  default     = true
}

variable "timeout" {
  type        = number
  description = "Délai en secondes avant échec du déploiement Helm."
  default     = 300
}
