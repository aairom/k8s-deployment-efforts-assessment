# Infrastructure as Code — hello-operator

> **Guide complet** pour le provisionnement et le déploiement du `hello-operator`
> sur IKS, ROKS, Amazon EKS, Azure AKS et Google GKE.

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Structure du dépôt](#2-structure-du-dépôt)
3. [Utilisation Terraform](#3-utilisation-terraform)
4. [Utilisation Ansible](#4-utilisation-ansible)
5. [Tableaux de référence des variables](#5-tableaux-de-référence-des-variables)
6. [Guide de gestion du cycle de vie](#6-guide-de-gestion-du-cycle-de-vie)
7. [Notes de sécurité](#7-notes-de-sécurité)

---

## 1. Prérequis

### Outils communs (toutes plateformes)

| Outil | Version minimale | Installation |
|---|---|---|
| `terraform` | 1.5.0 | https://developer.hashicorp.com/terraform/install |
| `kubectl` | 1.28.0 | https://kubernetes.io/docs/tasks/tools/ |
| `helm` | 3.14.0 | https://helm.sh/docs/intro/install/ |
| `ansible` | 2.15.0 | https://docs.ansible.com/ansible/latest/installation_guide/ |
| `ansible-lint` | 6.22.0 | `pip install ansible-lint` |
| `git` | 2.40.0 | https://git-scm.com/downloads |

### Outils spécifiques par plateforme

#### IBM Cloud (IKS & ROKS)

| Outil | Version minimale | Installation |
|---|---|---|
| `ibmcloud` CLI | 2.20.0 | `curl -fsSL https://clis.cloud.ibm.com/install/osx \| sh` |
| Plugin `ks` (Kubernetes Service) | 1.0.597 | `ibmcloud plugin install container-service` |
| Plugin `cr` (Container Registry) | 1.3.5 | `ibmcloud plugin install container-registry` |
| `oc` (OpenShift CLI) | 4.14.0 | ROKS uniquement — https://console.redhat.com/openshift/downloads |

```bash
# Vérification des plugins IBM Cloud
ibmcloud plugin list
```

#### Amazon EKS

| Outil | Version minimale | Installation |
|---|---|---|
| `aws` CLI | 2.13.0 | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| `eksctl` | 0.168.0 | https://eksctl.io/installation/ |

```bash
# Vérification
aws --version
eksctl version
```

#### Azure AKS

| Outil | Version minimale | Installation |
|---|---|---|
| `az` CLI | 2.55.0 | https://learn.microsoft.com/en-us/cli/azure/install-azure-cli |

```bash
# Vérification
az version
az aks install-cli  # installe kubectl via az
```

#### Google GKE

| Outil | Version minimale | Installation |
|---|---|---|
| `gcloud` CLI | 460.0.0 | https://cloud.google.com/sdk/docs/install |
| Composant `gke-gcloud-auth-plugin` | 0.5.0 | `gcloud components install gke-gcloud-auth-plugin` |

```bash
# Vérification
gcloud version
gke-gcloud-auth-plugin --version
```

---

## 2. Structure du dépôt

```
iac/
├── INFRASTRUCTURE.md                        ← Ce document (version française)
├── INFRASTRUCTURE-EN.md                     ← Version anglaise
│
├── terraform/
│   ├── modules/                             ← Modules réutilisables par plateforme
│   │   ├── iks/
│   │   │   ├── main.tf                      ← Ressources IBM Cloud IKS VPC-Gen2
│   │   │   ├── variables.tf                 ← Variables d'entrée IKS
│   │   │   ├── outputs.tf                   ← Sorties (cluster_id, endpoint, kubeconfig)
│   │   │   └── versions.tf                  ← ibm-cloud/ibm >= 1.62.0
│   │   ├── roks/
│   │   │   ├── main.tf                      ← Ressources ROKS OpenShift 4.x VPC-Gen2
│   │   │   ├── variables.tf                 ← Variables d'entrée ROKS (+ cos_instance_crn)
│   │   │   ├── outputs.tf                   ← Sorties ROKS
│   │   │   └── versions.tf                  ← ibm-cloud/ibm >= 1.62.0
│   │   ├── eks/
│   │   │   ├── main.tf                      ← EKS cluster + IAM + OIDC + Node Group + Add-ons
│   │   │   ├── variables.tf                 ← Variables d'entrée EKS
│   │   │   ├── outputs.tf                   ← Sorties EKS (arn, oidc_issuer_url, etc.)
│   │   │   └── versions.tf                  ← hashicorp/aws >= 5.0.0
│   │   ├── aks/
│   │   │   ├── main.tf                      ← AKS + Log Analytics + auto-scaling + AAD RBAC
│   │   │   ├── variables.tf                 ← Variables d'entrée AKS
│   │   │   ├── outputs.tf                   ← Sorties AKS (kubeconfig_raw, identity, etc.)
│   │   │   └── versions.tf                  ← hashicorp/azurerm >= 3.90.0
│   │   └── gke/
│   │       ├── main.tf                      ← GKE régional + Workload Identity + node pool
│   │       ├── variables.tf                 ← Variables d'entrée GKE
│   │       ├── outputs.tf                   ← Sorties GKE (endpoint, ca_certificate, etc.)
│   │       └── versions.tf                  ← hashicorp/google >= 5.0.0
│   │
│   ├── environments/                        ← Configurations d'environnements concrets
│   │   ├── iks/
│   │   │   ├── main.tf                      ← Appel module IKS + helm-release
│   │   │   ├── backend.tf                   ← Backend IBM COS (S3-compatible)
│   │   │   └── terraform.tfvars             ← Valeurs d'exemple IKS
│   │   ├── roks/
│   │   │   ├── main.tf                      ← Appel module ROKS + helm-release
│   │   │   ├── backend.tf                   ← Backend IBM COS (S3-compatible)
│   │   │   └── terraform.tfvars             ← Valeurs d'exemple ROKS
│   │   ├── eks/
│   │   │   ├── main.tf                      ← Appel module EKS + kubeconfig + helm-release
│   │   │   ├── backend.tf                   ← Backend AWS S3 + DynamoDB lock
│   │   │   └── terraform.tfvars             ← Valeurs d'exemple EKS
│   │   ├── aks/
│   │   │   ├── main.tf                      ← Appel module AKS + local_file kubeconfig + helm
│   │   │   ├── backend.tf                   ← Backend Azure Blob Storage
│   │   │   └── terraform.tfvars             ← Valeurs d'exemple AKS
│   │   └── gke/
│   │       ├── main.tf                      ← Appel module GKE + kubeconfig + helm-release
│   │       ├── backend.tf                   ← Backend GCS
│   │       └── terraform.tfvars             ← Valeurs d'exemple GKE
│   │
│   └── shared/
│       ├── helm-release/                    ← Module Helm provider pour déployer le chart
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   ├── outputs.tf
│       │   └── versions.tf
│       └── kubernetes-manifests/            ← Application de manifests YAML bruts via kubectl
│           ├── main.tf
│           ├── variables.tf
│           ├── outputs.tf
│           └── versions.tf
│
└── ansible/
    ├── ansible.cfg                          ← Configuration globale Ansible
    ├── inventory/
    │   ├── iks.yml                          ← Inventaire IKS (connexion locale)
    │   ├── roks.yml                         ← Inventaire ROKS
    │   ├── eks.yml                          ← Inventaire EKS
    │   ├── aks.yml                          ← Inventaire AKS
    │   └── gke.yml                          ← Inventaire GKE
    ├── group_vars/
    │   ├── iks.yml                          ← Variables IKS (cluster, image, manifests, helm)
    │   ├── roks.yml                         ← Variables ROKS
    │   ├── eks.yml                          ← Variables EKS
    │   ├── aks.yml                          ← Variables AKS
    │   └── gke.yml                          ← Variables GKE
    ├── roles/
    │   ├── common/
    │   │   ├── tasks/main.yml               ← Auth multi-plateforme + kubectl context switch
    │   │   └── defaults/main.yml
    │   ├── deploy_operator/
    │   │   ├── tasks/main.yml               ← CRD → RBAC → Operator Deployment → CR
    │   │   ├── templates/
    │   │   │   ├── operator_deployment.yaml.j2
    │   │   │   └── helloworld_cr.yaml.j2
    │   │   └── defaults/main.yml
    │   ├── lifecycle/
    │   │   ├── tasks/
    │   │   │   ├── upgrade.yml              ← Rolling update avec kubectl set image
    │   │   │   ├── rollback.yml             ← kubectl rollout undo
    │   │   │   └── delete.yml               ← Suppression complète + CRD cleanup
    │   │   └── defaults/main.yml
    │   └── validate/
    │       ├── tasks/main.yml               ← Vérification CRD + pod + CR Ready
    │       └── defaults/main.yml
    └── playbooks/
        ├── deploy.yml                       ← common + deploy_operator + validate
        ├── upgrade.yml                      ← common + lifecycle/upgrade + validate
        ├── rollback.yml                     ← common + lifecycle/rollback + validate
        ├── delete.yml                       ← common + lifecycle/delete
        └── validate.yml                     ← common + validate
```

---

## 3. Utilisation Terraform

### Initialisation commune

Avant tout `terraform init`, exporter les credentials via les variables d'environnement appropriées (voir section [7. Notes de sécurité](#7-notes-de-sécurité)).

### 3.1 — IBM Kubernetes Service (IKS)

```bash
# 1. Exporter les credentials IBM Cloud
export TF_VAR_ibmcloud_api_key="<votre_cle_api_ibm_cloud>"
export AWS_ACCESS_KEY_ID="<hmac_access_key_cos>"       # Backend COS
export AWS_SECRET_ACCESS_KEY="<hmac_secret_key_cos>"   # Backend COS

# 2. Initialiser Terraform
cd iac/terraform/environments/iks
terraform init

# 3. Planifier
terraform plan -out=plan.tfplan

# 4. Appliquer
terraform apply plan.tfplan

# 5. Vérifier les sorties
terraform output cluster_endpoint
terraform output kubeconfig_path

# 6. Détruire (si nécessaire)
terraform destroy
```

**Variables d'environnement requises :**

| Variable | Description |
|---|---|
| `TF_VAR_ibmcloud_api_key` | Clé API IBM Cloud |
| `AWS_ACCESS_KEY_ID` | HMAC Access Key pour le backend IBM COS |
| `AWS_SECRET_ACCESS_KEY` | HMAC Secret Key pour le backend IBM COS |

---

### 3.2 — Red Hat OpenShift on IBM Cloud (ROKS)

```bash
export TF_VAR_ibmcloud_api_key="<votre_cle_api_ibm_cloud>"
export AWS_ACCESS_KEY_ID="<hmac_access_key_cos>"
export AWS_SECRET_ACCESS_KEY="<hmac_secret_key_cos>"

cd iac/terraform/environments/roks
terraform init
terraform plan -out=plan.tfplan
terraform apply plan.tfplan

# Vérifier le cluster
terraform output cluster_endpoint
```

> **Note ROKS :** Le provisionnement prend ~30 min (OpenShift est plus volumineux qu'IKS).
> Le `cos_instance_crn` est obligatoire pour le registre d'images interne OpenShift.

---

### 3.3 — Amazon EKS

```bash
export AWS_ACCESS_KEY_ID="<aws_access_key_id>"
export AWS_SECRET_ACCESS_KEY="<aws_secret_access_key>"
export AWS_REGION="eu-west-1"

cd iac/terraform/environments/eks
terraform init
terraform plan -out=plan.tfplan
terraform apply plan.tfplan

# Mettre à jour kubeconfig
aws eks update-kubeconfig --region eu-west-1 --name hello-operator-eks-prod
kubectl cluster-info
```

**Variables d'environnement requises :**

| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key |
| `AWS_REGION` | Région AWS cible |

> **Note backend EKS :** Créer au préalable le bucket S3 et la table DynamoDB de lock :
> ```bash
> aws s3api create-bucket --bucket tfstate-hello-operator-eks --region eu-west-1 \
>   --create-bucket-configuration LocationConstraint=eu-west-1
> aws s3api put-bucket-versioning --bucket tfstate-hello-operator-eks \
>   --versioning-configuration Status=Enabled
> aws dynamodb create-table --table-name tfstate-lock-hello-operator \
>   --attribute-definitions AttributeName=LockID,AttributeType=S \
>   --key-schema AttributeName=LockID,KeyType=HASH \
>   --billing-mode PAY_PER_REQUEST --region eu-west-1
> ```

---

### 3.4 — Azure AKS

```bash
export ARM_CLIENT_ID="<service_principal_client_id>"
export ARM_CLIENT_SECRET="<service_principal_client_secret>"
export ARM_TENANT_ID="<azure_tenant_id>"
export ARM_SUBSCRIPTION_ID="<azure_subscription_id>"

cd iac/terraform/environments/aks
terraform init
terraform plan -out=plan.tfplan
terraform apply plan.tfplan

# Vérifier la connexion
kubectl --kubeconfig ~/.kube/config-aks-hello-operator cluster-info
```

**Variables d'environnement requises :**

| Variable | Description |
|---|---|
| `ARM_CLIENT_ID` | Client ID du Service Principal Azure |
| `ARM_CLIENT_SECRET` | Client Secret du Service Principal |
| `ARM_TENANT_ID` | ID du tenant Azure (Entra ID) |
| `ARM_SUBSCRIPTION_ID` | ID de la souscription Azure |

> **Note backend AKS :** Créer le Storage Account Azure au préalable :
> ```bash
> az group create --name tfstate-rg --location westeurope
> az storage account create --name tfstatehellooperator \
>   --resource-group tfstate-rg --location westeurope --sku Standard_LRS
> az storage container create --name tfstate \
>   --account-name tfstatehellooperator
> ```

---

### 3.5 — Google GKE

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/chemin/vers/service-account.json"
# ou
gcloud auth application-default login

cd iac/terraform/environments/gke
terraform init
terraform plan -out=plan.tfplan
terraform apply plan.tfplan

# Vérifier la connexion
gcloud container clusters get-credentials hello-operator-gke-prod \
  --region europe-west1 --project mon-projet-gcp-123456
kubectl cluster-info
```

**Variables d'environnement requises :**

| Variable | Description |
|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | Chemin vers le JSON du compte de service GCP |
| `GOOGLE_CLOUD_PROJECT` | ID du projet GCP |

> **Note backend GKE :** Créer le bucket GCS au préalable :
> ```bash
> gsutil mb -l europe-west1 gs://tfstate-hello-operator-gke
> gsutil versioning set on gs://tfstate-hello-operator-gke
> ```

---

## 4. Utilisation Ansible

Tous les playbooks s'exécutent depuis le répertoire `iac/ansible/` :

```bash
cd iac/ansible
```

Le paramètre `-e target_platform=<plateforme>` est **obligatoire** pour tous les playbooks.

### 4.1 — Déploiement (`deploy.yml`)

```bash
# IKS
ansible-playbook playbooks/deploy.yml \
  -i inventory/iks.yml \
  -e target_platform=iks

# ROKS
ansible-playbook playbooks/deploy.yml \
  -i inventory/roks.yml \
  -e target_platform=roks

# EKS
ansible-playbook playbooks/deploy.yml \
  -i inventory/eks.yml \
  -e target_platform=eks \
  -e aws_region=eu-west-1

# AKS
ansible-playbook playbooks/deploy.yml \
  -i inventory/aks.yml \
  -e target_platform=aks \
  -e azure_resource_group=hello-operator-aks-rg

# GKE
ansible-playbook playbooks/deploy.yml \
  -i inventory/gke.yml \
  -e target_platform=gke \
  -e gcp_project_id=mon-projet-gcp-123456 \
  -e gcp_region=europe-west1
```

### 4.2 — Mise à jour (`upgrade.yml`)

```bash
# Mettre à jour l'image sur IKS vers v0.2.0
ansible-playbook playbooks/upgrade.yml \
  -i inventory/iks.yml \
  -e target_platform=iks \
  -e new_image_tag=v0.2.0

# Mettre à jour sur EKS avec une image ECR
ansible-playbook playbooks/upgrade.yml \
  -i inventory/eks.yml \
  -e target_platform=eks \
  -e new_image_tag=v0.2.0 \
  -e operator_image_repository=123456789012.dkr.ecr.eu-west-1.amazonaws.com/hello-operator
```

### 4.3 — Rollback (`rollback.yml`)

```bash
# Rollback vers la révision précédente sur GKE
ansible-playbook playbooks/rollback.yml \
  -i inventory/gke.yml \
  -e target_platform=gke

# Rollback sur AKS
ansible-playbook playbooks/rollback.yml \
  -i inventory/aks.yml \
  -e target_platform=aks
```

### 4.4 — Suppression (`delete.yml`)

```bash
# Suppression complète sur ROKS (confirmation interactive)
ansible-playbook playbooks/delete.yml \
  -i inventory/roks.yml \
  -e target_platform=roks

# Suppression non interactive (CI/CD)
ANSIBLE_NOCOLOR=true ansible-playbook playbooks/delete.yml \
  -i inventory/eks.yml \
  -e target_platform=eks \
  --extra-vars '{"ansible_pause_confirm": false}'
```

### 4.5 — Validation (`validate.yml`)

```bash
# Valider le déploiement sur IKS
ansible-playbook playbooks/validate.yml \
  -i inventory/iks.yml \
  -e target_platform=iks

# Valider sur GKE avec timeout personnalisé
ansible-playbook playbooks/validate.yml \
  -i inventory/gke.yml \
  -e target_platform=gke \
  -e validation_timeout=180
```

---

## 5. Tableaux de référence des variables

### 5.1 — Variables Terraform

#### IKS

| Variable | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ibmcloud_api_key` | `string` | ✅ | — | Clé API IBM Cloud (sensible) |
| `region` | `string` | Non | `eu-de` | Région IBM Cloud |
| `resource_group` | `string` | ✅ | — | Nom du Resource Group IBM Cloud |
| `cluster_name` | `string` | ✅ | — | Nom du cluster IKS |
| `kubernetes_version` | `string` | Non | `1.29.4` | Version Kubernetes |
| `worker_pool_name` | `string` | Non | `default` | Nom du worker pool |
| `worker_flavor` | `string` | Non | `bx2.4x16` | Profil VM des nœuds |
| `worker_count` | `number` | Non | `2` | Nœuds par zone |
| `vpc_id` | `string` | ✅ | — | ID du VPC IBM Cloud |
| `subnet_ids` | `list(string)` | ✅ | — | IDs des sous-réseaux VPC |
| `tags` | `list(string)` | Non | `["managed-by:terraform"]` | Tags IBM Cloud |

#### ROKS

| Variable | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `ibmcloud_api_key` | `string` | ✅ | — | Clé API IBM Cloud (sensible) |
| `region` | `string` | Non | `eu-de` | Région IBM Cloud |
| `resource_group` | `string` | ✅ | — | Nom du Resource Group |
| `cluster_name` | `string` | ✅ | — | Nom du cluster ROKS |
| `ocp_version` | `string` | Non | `4.14_openshift` | Version OpenShift |
| `worker_pool_name` | `string` | Non | `default` | Nom du worker pool |
| `worker_flavor` | `string` | Non | `bx2.4x16` | Profil VM des nœuds |
| `worker_count` | `number` | Non | `2` | Nœuds par zone |
| `vpc_id` | `string` | ✅ | — | ID du VPC IBM Cloud |
| `subnet_ids` | `list(string)` | ✅ | — | IDs des sous-réseaux VPC |
| `entitlement` | `string` | Non | `""` | `cloud_pak` si couvert par une licence Cloud Pak |
| `cos_instance_crn` | `string` | ✅ | — | CRN de l'instance IBM COS |
| `tags` | `list(string)` | Non | `["managed-by:terraform"]` | Tags IBM Cloud |

#### EKS

| Variable | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `aws_region` | `string` | Non | `eu-west-1` | Région AWS |
| `cluster_name` | `string` | ✅ | — | Nom du cluster EKS |
| `kubernetes_version` | `string` | Non | `1.29` | Version Kubernetes |
| `node_group_name` | `string` | Non | `hello-operator-nodes` | Nom du Node Group |
| `instance_types` | `list(string)` | Non | `["m5.xlarge"]` | Types d'instances EC2 |
| `desired_size` | `number` | Non | `2` | Taille désirée |
| `min_size` | `number` | Non | `1` | Taille minimale |
| `max_size` | `number` | Non | `4` | Taille maximale |
| `vpc_id` | `string` | ✅ | — | ID du VPC AWS |
| `subnet_ids` | `list(string)` | ✅ | — | IDs des sous-réseaux privés |
| `tags` | `map(string)` | Non | `{"ManagedBy":"terraform"}` | Tags AWS |

#### AKS

| Variable | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `subscription_id` | `string` | ✅ | — | ID de la souscription Azure |
| `resource_group` | `string` | ✅ | — | Nom du Resource Group Azure |
| `location` | `string` | Non | `westeurope` | Région Azure |
| `cluster_name` | `string` | ✅ | — | Nom du cluster AKS |
| `kubernetes_version` | `string` | Non | `1.29.2` | Version Kubernetes |
| `node_pool_name` | `string` | Non | `systempool` | Nom du node pool système |
| `vm_size` | `string` | Non | `Standard_D4s_v3` | Taille de VM Azure |
| `node_count` | `number` | Non | `2` | Nœuds (auto-scaling désactivé) |
| `min_count` | `number` | Non | `1` | Minimum (auto-scaling) |
| `max_count` | `number` | Non | `4` | Maximum (auto-scaling) |
| `enable_auto_scaling` | `bool` | Non | `true` | Activer l'auto-scaling |
| `vnet_subnet_id` | `string` | ✅ | — | ID du sous-réseau Azure VNet |
| `tags` | `map(string)` | Non | `{"ManagedBy":"terraform"}` | Tags Azure |

#### GKE

| Variable | Type | Requis | Défaut | Description |
|---|---|---|---|---|
| `project_id` | `string` | ✅ | — | ID du projet GCP |
| `region` | `string` | Non | `europe-west1` | Région GCP |
| `zone` | `string` | Non | `europe-west1-b` | Zone GCP (clusters zonaux) |
| `cluster_name` | `string` | ✅ | — | Nom du cluster GKE |
| `kubernetes_version` | `string` | Non | `1.29` | Version minimale du plan de contrôle |
| `node_pool_name` | `string` | Non | `hello-operator-pool` | Nom du node pool |
| `machine_type` | `string` | Non | `e2-standard-4` | Type de machine GCE |
| `initial_node_count` | `number` | Non | `1` | Nœuds initiaux par zone |
| `min_node_count` | `number` | Non | `1` | Minimum autoscaling |
| `max_node_count` | `number` | Non | `4` | Maximum autoscaling |
| `network` | `string` | Non | `default` | Réseau VPC GCP |
| `subnetwork` | `string` | Non | `default` | Sous-réseau GCP |
| `tags` | `list(string)` | Non | `["hello-operator"]` | Tags réseau GCE |

---

### 5.2 — Variables Ansible (group_vars)

#### IKS (`group_vars/iks.yml`)

| Variable | Requis | Description |
|---|---|---|
| `ibmcloud_api_key` | ✅ | Via `lookup('env', 'IBMCLOUD_API_KEY')` |
| `ibmcloud_region` | ✅ | Région IBM Cloud (ex: `eu-de`) |
| `ibmcloud_resource_group` | ✅ | Nom du Resource Group IBM Cloud |
| `cluster_name` | ✅ | Nom du cluster IKS cible |
| `kubeconfig_path` | ✅ | Chemin local du kubeconfig |
| `kubectl_context` | Non | Contexte kubectl à activer |
| `operator_namespace` | Non | Namespace de déploiement (défaut: `hello-operator-system`) |
| `operator_image_repository` | ✅ | Registry et nom de l'image |
| `operator_image_tag` | ✅ | Tag de l'image à déployer |
| `operator_replicas` | Non | Nombre de réplicas (défaut: `2`) |
| `helloworld_cr_name` | Non | Nom du CR de validation (défaut: `helloworld-sample`) |
| `helloworld_replicas` | Non | Réplicas dans le CR (défaut: `2`) |
| `helloworld_message` | Non | Message affiché par HelloWorld |
| `helm_chart_path` | ✅ | Chemin vers le chart Helm |
| `helm_release_name` | Non | Nom du release Helm (défaut: `hello-operator`) |
| `validation_timeout` | Non | Timeout validation en secondes (défaut: `120`) |

#### EKS (`group_vars/eks.yml`)

| Variable | Requis | Description |
|---|---|---|
| `aws_region` | ✅ | Région AWS (ex: `eu-west-1`) |
| `aws_account_id` | ✅ | Via `lookup('env', 'AWS_ACCOUNT_ID')` |
| `cluster_name` | ✅ | Nom du cluster EKS |
| `kubeconfig_path` | ✅ | Chemin local du kubeconfig EKS |
| `kubectl_context` | Non | ARN du contexte EKS |
| `operator_image_repository` | ✅ | URI ECR ou autre registry |
| `operator_image_tag` | ✅ | Tag de l'image |

#### AKS (`group_vars/aks.yml`)

| Variable | Requis | Description |
|---|---|---|
| `azure_subscription_id` | ✅ | Via `lookup('env', 'ARM_SUBSCRIPTION_ID')` |
| `azure_resource_group` | ✅ | Resource Group Azure du cluster |
| `cluster_name` | ✅ | Nom du cluster AKS |
| `kubeconfig_path` | ✅ | Chemin local du kubeconfig AKS |
| `operator_image_repository` | ✅ | URI ACR ou autre registry |
| `operator_image_tag` | ✅ | Tag de l'image |

#### GKE (`group_vars/gke.yml`)

| Variable | Requis | Description |
|---|---|---|
| `gcp_project_id` | ✅ | Via `lookup('env', 'GOOGLE_CLOUD_PROJECT')` |
| `gcp_region` | ✅ | Région GCP (ex: `europe-west1`) |
| `cluster_name` | ✅ | Nom du cluster GKE |
| `kubeconfig_path` | ✅ | Chemin local du kubeconfig GKE |
| `operator_image_repository` | ✅ | URI Artifact Registry ou autre registry |
| `operator_image_tag` | ✅ | Tag de l'image |

---

## 6. Guide de gestion du cycle de vie

### 6.1 — Mise à jour zero-downtime de l'opérateur

La mise à jour utilise un rolling update Kubernetes pour garantir la continuité de service.

**Pré-requis :**
- La nouvelle image doit être publiée dans le registry cible avant le déploiement
- L'opérateur doit avoir au moins 2 réplicas en production

**Procédure :**

```bash
# Étape 1 — Publier la nouvelle image (exemple ECR)
docker build -t hello-operator:v0.2.0 hello-operator/
docker tag hello-operator:v0.2.0 123456789012.dkr.ecr.eu-west-1.amazonaws.com/hello-operator:v0.2.0
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.eu-west-1.amazonaws.com
docker push 123456789012.dkr.ecr.eu-west-1.amazonaws.com/hello-operator:v0.2.0

# Étape 2 — Déclencher la mise à jour via Ansible
cd iac/ansible
ansible-playbook playbooks/upgrade.yml \
  -i inventory/eks.yml \
  -e target_platform=eks \
  -e new_image_tag=v0.2.0

# Étape 3 — Surveiller le rolling update
kubectl rollout status deployment/hello-operator-controller-manager \
  -n hello-operator-system --watch

# Étape 4 — Vérifier les réplicas
kubectl get pods -n hello-operator-system -w
```

**Logique du rolling update :**
- `maxUnavailable: 0` — aucun pod ne sera indisponible pendant la mise à jour
- `maxSurge: 33%` — au maximum 1/3 de pods supplémentaires créés simultanément
- Les CRs HelloWorld existantes continuent d'être réconciliées pendant la mise à jour

---

### 6.2 — Rollback

En cas de problème après une mise à jour :

```bash
# Rollback Ansible (revient à la révision précédente)
cd iac/ansible
ansible-playbook playbooks/rollback.yml \
  -i inventory/eks.yml \
  -e target_platform=eks

# Rollback manuel kubectl
kubectl rollout undo deployment/hello-operator-controller-manager \
  -n hello-operator-system

# Rollback vers une révision spécifique
kubectl rollout undo deployment/hello-operator-controller-manager \
  -n hello-operator-system --to-revision=3

# Vérifier l'historique
kubectl rollout history deployment/hello-operator-controller-manager \
  -n hello-operator-system
```

---

### 6.3 — Décommissionnement complet

Pour supprimer entièrement l'opérateur et toutes ses ressources :

```bash
# Étape 1 — Supprimer via Ansible (avec confirmation interactive)
cd iac/ansible
ansible-playbook playbooks/delete.yml \
  -i inventory/iks.yml \
  -e target_platform=iks

# Étape 2 — Détruire l'infrastructure Terraform
cd iac/terraform/environments/iks
terraform destroy

# Vérification : aucune ressource résiduelle
kubectl get helloworld --all-namespaces 2>/dev/null || echo "CRD supprimé"
kubectl get namespaces | grep hello-operator 2>/dev/null || echo "Namespace supprimé"
```

---

## 7. Notes de sécurité

### 7.1 — Gestion des secrets via variables d'environnement

**Ne jamais committer** de clés API, secrets ou credentials dans le code source.
Utiliser exclusivement des variables d'environnement ou des gestionnaires de secrets.

```bash
# IBM Cloud
export IBMCLOUD_API_KEY="ic-..."
export TF_VAR_ibmcloud_api_key="${IBMCLOUD_API_KEY}"

# AWS
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."  # si rôle IAM temporaire

# Azure
export ARM_CLIENT_ID="..."
export ARM_CLIENT_SECRET="..."
export ARM_TENANT_ID="..."
export ARM_SUBSCRIPTION_ID="..."

# GCP
export GOOGLE_APPLICATION_CREDENTIALS="/chemin/vers/sa-key.json"
export GOOGLE_CLOUD_PROJECT="mon-projet"
```

### 7.2 — Ansible Vault pour les secrets en environnement d'équipe

```bash
# Créer un fichier de secrets chiffré
ansible-vault create iac/ansible/group_vars/secrets.yml

# Contenu exemple de secrets.yml (avant chiffrement) :
# ibmcloud_api_key: "ic-..."
# aws_secret_access_key: "..."

# Utiliser le vault dans un playbook
ansible-playbook playbooks/deploy.yml \
  -i inventory/iks.yml \
  -e target_platform=iks \
  --ask-vault-pass

# Ou avec un fichier de mot de passe (pour CI/CD)
ansible-playbook playbooks/deploy.yml \
  -i inventory/iks.yml \
  -e target_platform=iks \
  --vault-password-file ~/.ansible/vault-password

# Éditer un fichier vault existant
ansible-vault edit iac/ansible/group_vars/secrets.yml
```

### 7.3 — Chiffrement du state Terraform

| Plateforme | Backend | Chiffrement |
|---|---|---|
| IKS / ROKS | IBM COS (S3-compatible) | AES-256 côté serveur (SSE) |
| EKS | AWS S3 | `encrypt = true` + KMS optionnel |
| AKS | Azure Blob Storage | Chiffrement Azure Storage natif |
| GKE | GCS | Chiffrement Google-managed ou CMEK |

**Activation du chiffrement KMS pour le backend EKS :**

```hcl
# Dans iac/terraform/environments/eks/backend.tf, ajouter :
terraform {
  backend "s3" {
    # ...
    kms_key_id = "arn:aws:kms:eu-west-1:123456789012:key/mrk-..."
  }
}
```

### 7.4 — Principe du moindre privilège

- **IBM Cloud :** Créer un Service ID dédié avec rôle `Kubernetes Service Administrator` uniquement sur le Resource Group cible.
- **AWS :** Utiliser des rôles IAM avec politique minimale (EKS:CreateCluster, EKS:DescribeCluster, etc.) ; préférer IRSA pour les pods.
- **Azure :** Utiliser un Service Principal avec rôle `Azure Kubernetes Service Cluster Admin` uniquement sur le Resource Group cible.
- **GCP :** Utiliser un compte de service dédié avec rôles `container.admin`, `iam.serviceAccountUser` uniquement sur le projet cible.

### 7.5 — .gitignore — fichiers à ne jamais committer

```gitignore
# Fichiers sensibles Terraform
*.tfvars
!*.tfvars.example
*.tfstate
*.tfstate.backup
.terraform/
.terraform.lock.hcl

# Fichiers sensibles Ansible
*vault*
*.key
group_vars/secrets.yml

# Credentials cloud
*.json
!package.json
!**/testdata/**/*.json
.env
.envrc

# kubeconfig locaux
config-*-hello-operator
```

> **Référence :** Ce projet inclut déjà un `.gitignore` à la racine qui exclut les fichiers `.env`
> et les répertoires commençant par `_`. Compléter avec les entrées ci-dessus pour les fichiers IaC.
