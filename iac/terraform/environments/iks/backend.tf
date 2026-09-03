# ──────────────────────────────────────────────────────────────────────────────
# Backend IKS — IBM Cloud Object Storage (S3-compatible)
# Remplacer les valeurs par celles de votre instance COS.
# ──────────────────────────────────────────────────────────────────────────────

terraform {
  backend "s3" {
    # IBM Cloud Object Storage endpoint S3
    endpoint                    = "https://s3.eu-de.cloud-object-storage.appdomain.cloud"
    bucket                      = "tfstate-hello-operator-iks"
    key                         = "iks/terraform.tfstate"
    region                      = "eu-de"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true

    # Les credentials (HMAC) sont passés via les variables d'environnement :
    # AWS_ACCESS_KEY_ID     → HMAC Access Key ID IBM COS
    # AWS_SECRET_ACCESS_KEY → HMAC Secret Access Key IBM COS
  }
}
