terraform {
  backend "gcs" {
    bucket = "tfstate-hello-operator-gke"
    prefix = "gke/terraform.tfstate"
    # GOOGLE_CREDENTIALS → Chemin vers le fichier JSON du compte de service GCP
    # ou GOOGLE_APPLICATION_CREDENTIALS
  }
}
