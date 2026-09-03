variable "aws_region" {
  type        = string
  description = "Région AWS où déployer le cluster EKS (ex: eu-west-1)."
  default     = "eu-west-1"
}

variable "cluster_name" {
  type        = string
  description = "Nom du cluster Amazon EKS."
}

variable "kubernetes_version" {
  type        = string
  description = "Version Kubernetes pour le plan de contrôle EKS (ex: 1.29)."
  default     = "1.29"
}

variable "node_group_name" {
  type        = string
  description = "Nom du Managed Node Group EKS."
  default     = "hello-operator-nodes"
}

variable "instance_types" {
  type        = list(string)
  description = "Liste des types d'instances EC2 pour les nœuds workers."
  default     = ["m5.xlarge"]
}

variable "desired_size" {
  type        = number
  description = "Nombre désiré de nœuds dans le node group."
  default     = 2
}

variable "min_size" {
  type        = number
  description = "Taille minimale du node group (auto-scaling)."
  default     = 1
}

variable "max_size" {
  type        = number
  description = "Taille maximale du node group (auto-scaling)."
  default     = 4
}

variable "vpc_id" {
  type        = string
  description = "ID du VPC AWS dans lequel déployer le cluster."
}

variable "subnet_ids" {
  type        = list(string)
  description = "Liste des IDs de sous-réseaux privés pour les nœuds workers EKS."
}

variable "tags" {
  type        = map(string)
  description = "Map de tags AWS à appliquer aux ressources."
  default = {
    "ManagedBy" = "terraform"
    "App"       = "hello-operator"
  }
}
