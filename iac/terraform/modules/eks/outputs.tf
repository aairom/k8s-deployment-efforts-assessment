output "cluster_id" {
  description = "ARN du cluster EKS."
  value       = aws_eks_cluster.cluster.arn
}

output "cluster_name" {
  description = "Nom du cluster EKS."
  value       = aws_eks_cluster.cluster.name
}

output "cluster_endpoint" {
  description = "URL du serveur API Kubernetes du cluster EKS."
  value       = aws_eks_cluster.cluster.endpoint
}

output "cluster_ca_certificate" {
  description = "Certificat CA (base64) du plan de contrôle EKS."
  value       = aws_eks_cluster.cluster.certificate_authority[0].data
}

output "oidc_issuer_url" {
  description = "URL de l'émetteur OIDC pour IRSA (IAM Roles for Service Accounts)."
  value       = aws_eks_cluster.cluster.identity[0].oidc[0].issuer
}

output "oidc_provider_arn" {
  description = "ARN du fournisseur OIDC IAM créé pour ce cluster."
  value       = aws_iam_openid_connect_provider.oidc_provider.arn
}

output "node_group_arn" {
  description = "ARN du Managed Node Group EKS."
  value       = aws_eks_node_group.workers.arn
}

output "cluster_security_group_id" {
  description = "ID du Security Group du plan de contrôle EKS."
  value       = aws_security_group.cluster_sg.id
}
