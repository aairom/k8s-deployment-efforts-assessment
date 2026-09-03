variable "ibmcloud_api_key" {
  type        = string
  description = "Clé API IBM Cloud utilisée pour s'authentifier."
  sensitive   = true
}

variable "region" {
  type        = string
  description = "Région IBM Cloud où déployer le cluster (ex: eu-de, us-south)."
  default     = "eu-de"
}

variable "resource_group" {
  type        = string
  description = "Nom du Resource Group IBM Cloud cible."
}

variable "cluster_name" {
  type        = string
  description = "Nom du cluster ROKS à créer."
}

variable "ocp_version" {
  type        = string
  description = "Version OpenShift Container Platform (ex: 4.14_openshift)."
  default     = "4.14_openshift"
}

variable "worker_pool_name" {
  type        = string
  description = "Nom du worker pool par défaut."
  default     = "default"
}

variable "worker_flavor" {
  type        = string
  description = "Profil de machine virtuelle pour les nœuds workers (ex: bx2.4x16)."
  default     = "bx2.4x16"
}

variable "worker_count" {
  type        = number
  description = "Nombre de nœuds workers par zone."
  default     = 2
}

variable "vpc_id" {
  type        = string
  description = "ID du VPC IBM Cloud dans lequel déployer le cluster."
}

variable "subnet_ids" {
  type        = list(string)
  description = "Liste des IDs de sous-réseaux VPC pour les nœuds workers (une entrée par zone)."
}

variable "entitlement" {
  type        = string
  description = "Type de droit OCP : 'cloud_pak' si couvert par une licence Cloud Pak, sinon laisser vide."
  default     = ""
}

variable "cos_instance_crn" {
  type        = string
  description = "CRN de l'instance IBM Cloud Object Storage utilisée pour le registre d'images interne ROKS."
}

variable "tags" {
  type        = list(string)
  description = "Liste de tags à associer aux ressources IBM Cloud."
  default     = ["managed-by:terraform", "app:hello-operator"]
}
