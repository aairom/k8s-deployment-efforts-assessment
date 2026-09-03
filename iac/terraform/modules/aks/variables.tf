variable "subscription_id" {
  type        = string
  description = "ID de la souscription Azure cible."
}

variable "resource_group" {
  type        = string
  description = "Nom du Resource Group Azure où créer le cluster AKS."
}

variable "location" {
  type        = string
  description = "Région Azure (ex: westeurope, eastus)."
  default     = "westeurope"
}

variable "cluster_name" {
  type        = string
  description = "Nom du cluster AKS."
}

variable "kubernetes_version" {
  type        = string
  description = "Version Kubernetes pour AKS (ex: 1.29.2)."
  default     = "1.29.2"
}

variable "node_pool_name" {
  type        = string
  description = "Nom du node pool système AKS."
  default     = "systempool"
}

variable "vm_size" {
  type        = string
  description = "Taille de VM Azure pour les nœuds workers (ex: Standard_D4s_v3)."
  default     = "Standard_D4s_v3"
}

variable "node_count" {
  type        = number
  description = "Nombre initial de nœuds (utilisé si auto-scaling désactivé)."
  default     = 2
}

variable "min_count" {
  type        = number
  description = "Nombre minimum de nœuds (auto-scaling activé)."
  default     = 1
}

variable "max_count" {
  type        = number
  description = "Nombre maximum de nœuds (auto-scaling activé)."
  default     = 4
}

variable "enable_auto_scaling" {
  type        = bool
  description = "Activer l'auto-scaling sur le node pool système."
  default     = true
}

variable "vnet_subnet_id" {
  type        = string
  description = "ID du sous-réseau Azure VNet pour les nœuds AKS."
}

variable "tags" {
  type        = map(string)
  description = "Map de tags Azure à appliquer aux ressources."
  default = {
    "ManagedBy" = "terraform"
    "App"       = "hello-operator"
  }
}
