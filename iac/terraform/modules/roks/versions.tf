terraform {
  required_version = ">= 1.5.0"

  required_providers {
    ibm = {
      source  = "ibm-cloud/ibm"
      version = ">= 1.62.0"
    }
  }
}
