terraform {
  backend "s3" {
    bucket         = "tfstate-hello-operator-eks"
    key            = "eks/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "tfstate-lock-hello-operator"
    # AWS_ACCESS_KEY_ID     → Access Key ID AWS
    # AWS_SECRET_ACCESS_KEY → Secret Access Key AWS
  }
}
