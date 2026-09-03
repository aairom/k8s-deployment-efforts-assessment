aws_region         = "eu-west-1"
cluster_name       = "hello-operator-eks-prod"
kubernetes_version = "1.29"
node_group_name    = "hello-operator-nodes"
instance_types     = ["m5.xlarge"]
desired_size       = 2
min_size           = 1
max_size           = 4
vpc_id             = "vpc-0xxxxxxxxxxxxxxxx"
subnet_ids = [
  "subnet-0aaaaaaaaaaaaaaaa",
  "subnet-0bbbbbbbbbbbbbbbbb",
  "subnet-0ccccccccccccccccc",
]
tags = {
  "ManagedBy"   = "terraform"
  "App"         = "hello-operator"
  "Environment" = "production"
  "Platform"    = "eks"
}
kubeconfig_output_path = "~/.kube/config-eks-hello-operator"
helm_chart_path        = "../../../hello-operator/chart"
helm_release_name      = "hello-operator"
helm_namespace         = "hello-operator-system"
helm_chart_version     = ""
helm_values_override = {
  "replicaCount"              = "2"
  "image.tag"                 = "v0.1.0"
  "resources.requests.cpu"    = "100m"
  "resources.requests.memory" = "128Mi"
  "resources.limits.cpu"      = "500m"
  "resources.limits.memory"   = "256Mi"
}
