variable "project_id" {
  type        = string
  description = "ID du projet Google Cloud Platform."
}

variable "region" {
  type        = string
  description = "Région GCP pour le cluster GKE (ex: europe-west1)."
  default     = "europe-west1"
}

variable "zone" {
  type        = string
  description = "Zone GCP pour les nœuds (ex: europe-west1-b). Utilisé pour les clusters zonaux."
  default     = "europe-west1-b"
}

variable "cluster_name" {
  type        = string
  description = "Nom du cluster GKE."
}

variable "kubernetes_version" {
  type        = string
  description = "Version minimale du plan de contrôle GKE (ex: 1.29)."
  default     = "1.29"
}

variable "node_pool_name" {
  type        = string
  description = "Nom du node pool GKE."
  default     = "hello-operator-pool"
}

variable "machine_type" {
  type        = string
  description = "Type de machine GCE pour les nœuds workers (ex: e2-standard-4)."
  default     = "e2-standard-4"
}

variable "initial_node_count" {
  type        = number
  description = "Nombre initial de nœuds dans le node pool."
  default     = 1
}

variable "min_node_count" {
  type        = number
  description = "Nombre minimum de nœuds (autoscaling GKE)."
  default     = 1
}

variable "max_node_count" {
  type        = number
  description = "Nombre maximum de nœuds (autoscaling GKE)."
  default     = 4
}

variable "network" {
  type        = string
  description = "Nom du réseau VPC GCP à utiliser."
  default     = "default"
}

variable "subnetwork" {
  type        = string
  description = "Nom du sous-réseau GCP à utiliser pour les nœuds."
  default     = "default"
}

variable "tags" {
  type        = list(string)
  description = "Liste de tags réseau GCE à appliquer aux nœuds workers."
  default     = ["hello-operator", "managed-by-terraform"]
}
