terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "tfstatehellooperator"
    container_name       = "tfstate"
    key                  = "aks/terraform.tfstate"
    # ARM_CLIENT_ID       → Service Principal client ID
    # ARM_CLIENT_SECRET   → Service Principal client secret
    # ARM_TENANT_ID       → Azure Tenant ID
    # ARM_SUBSCRIPTION_ID → Azure Subscription ID
  }
}
