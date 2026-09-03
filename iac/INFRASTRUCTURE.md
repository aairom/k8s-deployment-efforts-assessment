# Infrastructure as Code — hello-operator

> **Comprehensive guide** for provisioning and deploying the `hello-operator`
> on IKS, ROKS, Amazon EKS, Azure AKS, and Google GKE.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Layout](#2-repository-layout)
3. [Terraform Usage](#3-terraform-usage)
4. [Ansible Usage](#4-ansible-usage)
5. [Variable Reference Tables](#5-variable-reference-tables)
6. [Lifecycle Management Guide](#6-lifecycle-management-guide)
7. [Security Notes](#7-security-notes)

---

## 1. Prerequisites

### Common tools (all platforms)

| Tool | Minimum version | Installation |
|---|---|---|
| `terraform` | 1.5.0 | https://developer.hashicorp.com/terraform/install |
| `kubectl` | 1.28.0 | https://kubernetes.io/docs/tasks/tools/ |
| `helm` | 3.14.0 | https://helm.sh/docs/intro/install/ |
| `ansible` | 2.15.0 | https://docs.ansible.com/ansible/latest/installation_guide/ |
| `ansible-lint` | 6.22.0 | `pip install ansible-lint` |
| `git` | 2.40.0 | https://git-scm.com/downloads |

### Platform-specific tools

#### IBM Cloud (IKS & ROKS)

| Tool | Minimum version | Installation |
|---|---|---|
| `ibmcloud` CLI | 2.20.0 | `curl -fsSL https://clis.cloud.ibm.com/install/osx \| sh` |
| Plugin `ks` (Kubernetes Service) | 1.0.597 | `ibmcloud plugin install container-service` |
| Plugin `cr` (Container Registry) | 1.3.5 | `ibmcloud plugin install container-registry` |
| `oc` (OpenShift CLI) | 4.14.0 | ROKS only — https://console.redhat.com/openshift/downloads |

```bash
# Check installed IBM Cloud plugins
ibmcloud plugin list
```

#### Amazon EKS

| Tool | Minimum version | Installation |
|---|---|---|
| `aws` CLI | 2.13.0 | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| `eksctl` | 0.168.0 | https://eksctl.io/installation/ |

```bash
aws --version
eksctl version
```

#### Azure AKS

| Tool | Minimum version | Installation |
|---|---|---|
| `az` CLI | 2.55.0 | https://learn.microsoft.com/en-us/cli/azure/install-azure-cli |

```bash
az version
az aks install-cli   # installs kubectl via az
```

#### Google GKE

| Tool | Minimum version | Installation |
|---|---|---|
| `gcloud` CLI | 460.0.0 | https://cloud.google.com/sdk/docs/install |
| `gke-gcloud-auth-plugin` | 0.5.0 | `gcloud components install gke-gcloud-auth-plugin` |

```bash
gcloud version
gke-gcloud-auth-plugin --version
```

---

## 2. Repository Layout

```
iac/
├── INFRASTRUCTURE.md                        ← This document (English version)
├── INFRASTRUCTURE-FR.md                     ← French version
│
├── terraform/
│   ├── modules/                             ← Reusable per-platform modules
│   │   ├── iks/
│   │   │   ├── main.tf                      ← IBM Cloud IKS VPC-Gen2 resources
│   │   │   ├── variables.tf                 ← IKS input variables
│   │   │   ├── outputs.tf                   ← Outputs (cluster_id, endpoint, kubeconfig)
│   │   │   └── versions.tf                  ← ibm-cloud/ibm >= 1.62.0
│   │   ├── roks/
│   │   │   ├── main.tf                      ← ROKS OpenShift 4.x VPC-Gen2 resources
│   │   │   ├── variables.tf                 ← ROKS input variables (+ cos_instance_crn)
│   │   │   ├── outputs.tf                   ← ROKS outputs
│   │   │   └── versions.tf                  ← ibm-cloud/ibm >= 1.62.0
│   │   ├── eks/
│   │   │   ├── main.tf                      ← EKS cluster + IAM + OIDC + Node Group + Add-ons
│   │   │   ├── variables.tf                 ← EKS input variables
│   │   │   ├── outputs.tf                   ← EKS outputs (arn, oidc_issuer_url, etc.)
│   │   │   └── versions.tf                  ← hashicorp/aws >= 5.0.0
│   │   ├── aks/
│   │   │   ├── main.tf                      ← AKS + Log Analytics + auto-scaling + AAD RBAC
│   │   │   ├── variables.tf                 ← AKS input variables
│   │   │   ├── outputs.tf                   ← AKS outputs (kubeconfig_raw, identity, etc.)
│   │   │   └── versions.tf                  ← hashicorp/azurerm >= 3.90.0
│   │   └── gke/
│   │       ├── main.tf                      ← GKE regional + Workload Identity + node pool
│   │       ├── variables.tf                 ← GKE input variables
│   │       ├── outputs.tf                   ← GKE outputs (endpoint, ca_certificate, etc.)
│   │       └── versions.tf                  ← hashicorp/google >= 5.0.0
│   │
│   ├── environments/                        ← Concrete environment configurations
│   │   ├── iks/
│   │   │   ├── main.tf                      ← Calls IKS module + helm-release
│   │   │   ├── backend.tf                   ← IBM COS backend (S3-compatible)
│   │   │   └── terraform.tfvars             ← Example values for IKS
│   │   ├── roks/
│   │   │   ├── main.tf                      ← Calls ROKS module + helm-release
│   │   │   ├── backend.tf                   ← IBM COS backend (S3-compatible)
│   │   │   └── terraform.tfvars             ← Example values for ROKS
│   │   ├── eks/
│   │   │   ├── main.tf                      ← Calls EKS module + kubeconfig + helm-release
│   │   │   ├── backend.tf                   ← AWS S3 + DynamoDB lock backend
│   │   │   └── terraform.tfvars             ← Example values for EKS
│   │   ├── aks/
│   │   │   ├── main.tf                      ← Calls AKS module + local kubeconfig + helm
│   │   │   ├── backend.tf                   ← Azure Blob Storage backend
│   │   │   └── terraform.tfvars             ← Example values for AKS
│   │   └── gke/
│   │       ├── main.tf                      ← Calls GKE module + kubeconfig + helm-release
│   │       ├── backend.tf                   ← GCS backend
│   │       └── terraform.tfvars             ← Example values for GKE
│   │
│   └── shared/
│       ├── helm-release/                    ← Helm provider module to deploy the chart
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   ├── outputs.tf
│       │   └── versions.tf
│       └── kubernetes-manifests/            ← Applies raw YAML manifests via kubectl provider
│           ├── main.tf
│           ├── variables.tf
│           ├── outputs.tf
│           └── versions.tf
│
└── ansible/
    ├── ansible.cfg                          ← Global Ansible configuration
    ├── inventory/
    │   ├── iks.yml                          ← IKS inventory (local connection)
    │   ├── roks.yml                         ← ROKS inventory
    │   ├── eks.yml                          ← EKS inventory
    │   ├── aks.yml                          ← AKS inventory
    │   └── gke.yml                          ← GKE inventory
    ├── group_vars/
    │   ├── iks.yml                          ← IKS variables (cluster, image, manifests, helm)
    │   ├── roks.yml                         ← ROKS variables
    │   ├── eks.yml                          ← EKS variables
    │   ├── aks.yml                          ← AKS variables
    │   └── gke.yml                          ← GKE variables
    ├── roles/
    │   ├── common/
    │   │   ├── tasks/main.yml               ← Multi-platform auth + kubectl context switch
    │   │   └── defaults/main.yml
    │   ├── deploy_operator/
    │   │   ├── tasks/main.yml               ← CRD → RBAC → Operator Deployment → CR
    │   │   ├── templates/
    │   │   │   ├── operator_deployment.yaml.j2
    │   │   │   └── helloworld_cr.yaml.j2
    │   │   └── defaults/main.yml
    │   ├── lifecycle/
    │   │   ├── tasks/
    │   │   │   ├── upgrade.yml              ← Rolling update with kubectl set image
    │   │   │   ├── rollback.yml             ← kubectl rollout undo
    │   │   │   └── delete.yml               ← Full deletion + CRD cleanup
    │   │   └── defaults/main.yml
    │   └── validate/
    │       ├── tasks/main.yml               ← CRD + pod + CR Ready checks
    │       └── defaults/main.yml
    └── playbooks/
        ├── deploy.yml                       ← common + deploy_operator + validate
        ├── upgrade.yml                      ← common + lifecycle/upgrade + validate
        ├── rollback.yml                     ← common + lifecycle/rollback + validate
        ├── delete.yml                       ← common + lifecycle/delete
        └── validate.yml                     ← common + validate
```

---

## 3. Terraform Usage

### Common initialization

Before any `terraform init`, export the appropriate credentials via environment variables (see [Section 7 — Security Notes](#7-security-notes)).

### 3.1 — IBM Kubernetes Service (IKS)

```bash
# 1. Export IBM Cloud credentials
export TF_VAR_ibmcloud_api_key="<your_ibm_cloud_api_key>"
export AWS_ACCESS_KEY_ID="<cos_hmac_access_key>"       # COS backend
export AWS_SECRET_ACCESS_KEY="<cos_hmac_secret_key>"   # COS backend

# 2. Initialize Terraform
cd iac/terraform/environments/iks
terraform init

# 3. Plan
terraform plan -out=plan.tfplan

# 4. Apply
terraform apply plan.tfplan

# 5. Check outputs
terraform output cluster_endpoint
terraform output kubeconfig_path

# 6. Destroy (when needed)
terraform destroy
```

**Required environment variables:**

| Variable | Description |
|---|---|
| `TF_VAR_ibmcloud_api_key` | IBM Cloud API key |
| `AWS_ACCESS_KEY_ID` | HMAC Access Key for IBM COS backend |
| `AWS_SECRET_ACCESS_KEY` | HMAC Secret Key for IBM COS backend |

---

### 3.2 — Red Hat OpenShift on IBM Cloud (ROKS)

```bash
export TF_VAR_ibmcloud_api_key="<your_ibm_cloud_api_key>"
export AWS_ACCESS_KEY_ID="<cos_hmac_access_key>"
export AWS_SECRET_ACCESS_KEY="<cos_hmac_secret_key>"

cd iac/terraform/environments/roks
terraform init
terraform plan -out=plan.tfplan
terraform apply plan.tfplan

terraform output cluster_endpoint
```

> **Note:** ROKS provisioning takes ~30 minutes (OpenShift is heavier than plain IKS).
> The `cos_instance_crn` variable is mandatory — it provides the IBM COS instance used by
> the OpenShift internal image registry.

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

# Update local kubeconfig
aws eks update-kubeconfig --region eu-west-1 --name hello-operator-eks-prod
kubectl cluster-info
```

**Required environment variables:**

| Variable | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key |
| `AWS_REGION` | Target AWS region |

> **Backend pre-requisite:** Create the S3 bucket and DynamoDB lock table before the first `terraform init`:
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

kubectl --kubeconfig ~/.kube/config-aks-hello-operator cluster-info
```

**Required environment variables:**

| Variable | Description |
|---|---|
| `ARM_CLIENT_ID` | Azure Service Principal client ID |
| `ARM_CLIENT_SECRET` | Azure Service Principal client secret |
| `ARM_TENANT_ID` | Azure tenant ID (Entra ID) |
| `ARM_SUBSCRIPTION_ID` | Azure subscription ID |

> **Backend pre-requisite:** Create the Azure Storage Account before the first `terraform init`:
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
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
# or use ADC
gcloud auth application-default login

cd iac/terraform/environments/gke
terraform init
terraform plan -out=plan.tfplan
terraform apply plan.tfplan

gcloud container clusters get-credentials hello-operator-gke-prod \
  --region europe-west1 --project my-gcp-project-123456
kubectl cluster-info
```

**Required environment variables:**

| Variable | Description |
|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to the GCP service account JSON key file |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |

> **Backend pre-requisite:** Create the GCS bucket before the first `terraform init`:
> ```bash
> gsutil mb -l europe-west1 gs://tfstate-hello-operator-gke
> gsutil versioning set on gs://tfstate-hello-operator-gke
> ```

---

## 4. Ansible Usage

All playbooks are run from the `iac/ansible/` directory:

```bash
cd iac/ansible
```

The `-e target_platform=<platform>` parameter is **required** for every playbook.

### 4.1 — Deploy (`deploy.yml`)

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
  -e gcp_project_id=my-gcp-project-123456 \
  -e gcp_region=europe-west1
```

### 4.2 — Upgrade (`upgrade.yml`)

```bash
# Upgrade image on IKS to v0.2.0
ansible-playbook playbooks/upgrade.yml \
  -i inventory/iks.yml \
  -e target_platform=iks \
  -e new_image_tag=v0.2.0

# Upgrade on EKS with an ECR image
ansible-playbook playbooks/upgrade.yml \
  -i inventory/eks.yml \
  -e target_platform=eks \
  -e new_image_tag=v0.2.0 \
  -e operator_image_repository=123456789012.dkr.ecr.eu-west-1.amazonaws.com/hello-operator
```

### 4.3 — Rollback (`rollback.yml`)

```bash
# Roll back to the previous revision on GKE
ansible-playbook playbooks/rollback.yml \
  -i inventory/gke.yml \
  -e target_platform=gke

# Roll back on AKS
ansible-playbook playbooks/rollback.yml \
  -i inventory/aks.yml \
  -e target_platform=aks
```

### 4.4 — Delete (`delete.yml`)

```bash
# Full deletion on ROKS (interactive confirmation)
ansible-playbook playbooks/delete.yml \
  -i inventory/roks.yml \
  -e target_platform=roks

# Non-interactive deletion (CI/CD)
ANSIBLE_NOCOLOR=true ansible-playbook playbooks/delete.yml \
  -i inventory/eks.yml \
  -e target_platform=eks \
  --extra-vars '{"ansible_pause_confirm": false}'
```

### 4.5 — Validate (`validate.yml`)

```bash
# Validate the deployment on IKS
ansible-playbook playbooks/validate.yml \
  -i inventory/iks.yml \
  -e target_platform=iks

# Validate on GKE with a custom timeout
ansible-playbook playbooks/validate.yml \
  -i inventory/gke.yml \
  -e target_platform=gke \
  -e validation_timeout=180
```

---

## 5. Variable Reference Tables

### 5.1 — Terraform Variables

#### IKS

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `ibmcloud_api_key` | `string` | ✅ | — | IBM Cloud API key (sensitive) |
| `region` | `string` | No | `eu-de` | IBM Cloud region |
| `resource_group` | `string` | ✅ | — | IBM Cloud Resource Group name |
| `cluster_name` | `string` | ✅ | — | IKS cluster name |
| `kubernetes_version` | `string` | No | `1.29.4` | Kubernetes version |
| `worker_pool_name` | `string` | No | `default` | Worker pool name |
| `worker_flavor` | `string` | No | `bx2.4x16` | Worker node VM profile |
| `worker_count` | `number` | No | `2` | Nodes per zone |
| `vpc_id` | `string` | ✅ | — | IBM Cloud VPC ID |
| `subnet_ids` | `list(string)` | ✅ | — | VPC subnet IDs |
| `tags` | `list(string)` | No | `["managed-by:terraform"]` | IBM Cloud resource tags |

#### ROKS

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `ibmcloud_api_key` | `string` | ✅ | — | IBM Cloud API key (sensitive) |
| `region` | `string` | No | `eu-de` | IBM Cloud region |
| `resource_group` | `string` | ✅ | — | Resource Group name |
| `cluster_name` | `string` | ✅ | — | ROKS cluster name |
| `ocp_version` | `string` | No | `4.14_openshift` | OpenShift version |
| `worker_pool_name` | `string` | No | `default` | Worker pool name |
| `worker_flavor` | `string` | No | `bx2.4x16` | Worker node VM profile |
| `worker_count` | `number` | No | `2` | Nodes per zone |
| `vpc_id` | `string` | ✅ | — | IBM Cloud VPC ID |
| `subnet_ids` | `list(string)` | ✅ | — | VPC subnet IDs |
| `entitlement` | `string` | No | `""` | Set `cloud_pak` if covered by a Cloud Pak license |
| `cos_instance_crn` | `string` | ✅ | — | IBM COS instance CRN for OCP internal registry |
| `tags` | `list(string)` | No | `["managed-by:terraform"]` | IBM Cloud resource tags |

#### EKS

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `aws_region` | `string` | No | `eu-west-1` | AWS region |
| `cluster_name` | `string` | ✅ | — | EKS cluster name |
| `kubernetes_version` | `string` | No | `1.29` | Kubernetes version |
| `node_group_name` | `string` | No | `hello-operator-nodes` | Node group name |
| `instance_types` | `list(string)` | No | `["m5.xlarge"]` | EC2 instance types |
| `desired_size` | `number` | No | `2` | Desired node count |
| `min_size` | `number` | No | `1` | Minimum node count |
| `max_size` | `number` | No | `4` | Maximum node count |
| `vpc_id` | `string` | ✅ | — | AWS VPC ID |
| `subnet_ids` | `list(string)` | ✅ | — | Private subnet IDs |
| `tags` | `map(string)` | No | `{"ManagedBy":"terraform"}` | AWS resource tags |

#### AKS

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `subscription_id` | `string` | ✅ | — | Azure subscription ID |
| `resource_group` | `string` | ✅ | — | Azure Resource Group name |
| `location` | `string` | No | `westeurope` | Azure region |
| `cluster_name` | `string` | ✅ | — | AKS cluster name |
| `kubernetes_version` | `string` | No | `1.29.2` | Kubernetes version |
| `node_pool_name` | `string` | No | `systempool` | System node pool name |
| `vm_size` | `string` | No | `Standard_D4s_v3` | Azure VM size |
| `node_count` | `number` | No | `2` | Node count (auto-scaling disabled) |
| `min_count` | `number` | No | `1` | Minimum nodes (auto-scaling) |
| `max_count` | `number` | No | `4` | Maximum nodes (auto-scaling) |
| `enable_auto_scaling` | `bool` | No | `true` | Enable cluster autoscaler |
| `vnet_subnet_id` | `string` | ✅ | — | Azure VNet subnet ID |
| `tags` | `map(string)` | No | `{"ManagedBy":"terraform"}` | Azure resource tags |

#### GKE

| Variable | Type | Required | Default | Description |
|---|---|---|---|---|
| `project_id` | `string` | ✅ | — | GCP project ID |
| `region` | `string` | No | `europe-west1` | GCP region |
| `zone` | `string` | No | `europe-west1-b` | GCP zone (for zonal clusters) |
| `cluster_name` | `string` | ✅ | — | GKE cluster name |
| `kubernetes_version` | `string` | No | `1.29` | Minimum control plane version |
| `node_pool_name` | `string` | No | `hello-operator-pool` | Node pool name |
| `machine_type` | `string` | No | `e2-standard-4` | GCE machine type |
| `initial_node_count` | `number` | No | `1` | Initial nodes per zone |
| `min_node_count` | `number` | No | `1` | Minimum nodes (autoscaling) |
| `max_node_count` | `number` | No | `4` | Maximum nodes (autoscaling) |
| `network` | `string` | No | `default` | GCP VPC network name |
| `subnetwork` | `string` | No | `default` | GCP subnetwork name |
| `tags` | `list(string)` | No | `["hello-operator"]` | GCE network tags |

---

### 5.2 — Ansible Variables (group_vars)

#### IKS (`group_vars/iks.yml`)

| Variable | Required | Description |
|---|---|---|
| `ibmcloud_api_key` | ✅ | Sourced via `lookup('env', 'IBMCLOUD_API_KEY')` |
| `ibmcloud_region` | ✅ | IBM Cloud region (e.g. `eu-de`) |
| `ibmcloud_resource_group` | ✅ | IBM Cloud Resource Group name |
| `cluster_name` | ✅ | Target IKS cluster name |
| `kubeconfig_path` | ✅ | Local path where kubeconfig is written |
| `kubectl_context` | No | kubectl context to activate |
| `operator_namespace` | No | Deployment namespace (default: `hello-operator-system`) |
| `operator_image_repository` | ✅ | Registry and image name |
| `operator_image_tag` | ✅ | Image tag to deploy |
| `operator_replicas` | No | Number of replicas (default: `2`) |
| `helloworld_cr_name` | No | Name of the validation CR (default: `helloworld-sample`) |
| `helloworld_replicas` | No | Replicas in the CR (default: `2`) |
| `helloworld_message` | No | Message displayed by HelloWorld |
| `helm_chart_path` | ✅ | Path to the Helm chart |
| `helm_release_name` | No | Helm release name (default: `hello-operator`) |
| `validation_timeout` | No | Validation timeout in seconds (default: `120`) |

#### EKS (`group_vars/eks.yml`)

| Variable | Required | Description |
|---|---|---|
| `aws_region` | ✅ | AWS region (e.g. `eu-west-1`) |
| `aws_account_id` | ✅ | Sourced via `lookup('env', 'AWS_ACCOUNT_ID')` |
| `cluster_name` | ✅ | EKS cluster name |
| `kubeconfig_path` | ✅ | Local path to the EKS kubeconfig |
| `kubectl_context` | No | Full EKS ARN context string |
| `operator_image_repository` | ✅ | ECR URI or other registry |
| `operator_image_tag` | ✅ | Image tag |

#### AKS (`group_vars/aks.yml`)

| Variable | Required | Description |
|---|---|---|
| `azure_subscription_id` | ✅ | Sourced via `lookup('env', 'ARM_SUBSCRIPTION_ID')` |
| `azure_resource_group` | ✅ | Azure Resource Group containing the cluster |
| `cluster_name` | ✅ | AKS cluster name |
| `kubeconfig_path` | ✅ | Local path to the AKS kubeconfig |
| `operator_image_repository` | ✅ | ACR URI or other registry |
| `operator_image_tag` | ✅ | Image tag |

#### GKE (`group_vars/gke.yml`)

| Variable | Required | Description |
|---|---|---|
| `gcp_project_id` | ✅ | Sourced via `lookup('env', 'GOOGLE_CLOUD_PROJECT')` |
| `gcp_region` | ✅ | GCP region (e.g. `europe-west1`) |
| `cluster_name` | ✅ | GKE cluster name |
| `kubeconfig_path` | ✅ | Local path to the GKE kubeconfig |
| `operator_image_repository` | ✅ | Artifact Registry URI or other registry |
| `operator_image_tag` | ✅ | Image tag |

---

## 6. Lifecycle Management Guide

### 6.1 — Zero-downtime operator upgrade

The upgrade uses a Kubernetes rolling update to guarantee service continuity.

**Prerequisites:**
- The new image must be pushed to the target registry before triggering the deployment
- The operator should have at least 2 replicas in production

**Procedure:**

```bash
# Step 1 — Build and push the new image (ECR example)
docker build -t hello-operator:v0.2.0 hello-operator/
docker tag hello-operator:v0.2.0 123456789012.dkr.ecr.eu-west-1.amazonaws.com/hello-operator:v0.2.0
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.eu-west-1.amazonaws.com
docker push 123456789012.dkr.ecr.eu-west-1.amazonaws.com/hello-operator:v0.2.0

# Step 2 — Trigger the upgrade via Ansible
cd iac/ansible
ansible-playbook playbooks/upgrade.yml \
  -i inventory/eks.yml \
  -e target_platform=eks \
  -e new_image_tag=v0.2.0

# Step 3 — Monitor the rolling update
kubectl rollout status deployment/hello-operator-controller-manager \
  -n hello-operator-system --watch

# Step 4 — Verify replicas
kubectl get pods -n hello-operator-system -w
```

**Rolling update behavior:**
- `maxUnavailable: 0` — no pod will be unavailable during the update
- `maxSurge: 33%` — at most 1/3 of extra pods are created simultaneously
- Existing HelloWorld CRs continue to be reconciled during the update

---

### 6.2 — Rollback

If a problem occurs after an upgrade:

```bash
# Ansible rollback (reverts to the previous revision)
cd iac/ansible
ansible-playbook playbooks/rollback.yml \
  -i inventory/eks.yml \
  -e target_platform=eks

# Manual kubectl rollback
kubectl rollout undo deployment/hello-operator-controller-manager \
  -n hello-operator-system

# Rollback to a specific revision
kubectl rollout undo deployment/hello-operator-controller-manager \
  -n hello-operator-system --to-revision=3

# Check the revision history
kubectl rollout history deployment/hello-operator-controller-manager \
  -n hello-operator-system
```

---

### 6.3 — Full decommission

To completely remove the operator and all its resources:

```bash
# Step 1 — Delete via Ansible (interactive confirmation)
cd iac/ansible
ansible-playbook playbooks/delete.yml \
  -i inventory/iks.yml \
  -e target_platform=iks

# Step 2 — Destroy the Terraform infrastructure
cd iac/terraform/environments/iks
terraform destroy

# Verify no residual resources remain
kubectl get helloworld --all-namespaces 2>/dev/null || echo "CRD removed"
kubectl get namespaces | grep hello-operator 2>/dev/null || echo "Namespace removed"
```

---

## 7. Security Notes

### 7.1 — Secret management via environment variables

**Never commit** API keys, secrets, or credentials to source control.
Use environment variables or a dedicated secrets manager exclusively.

```bash
# IBM Cloud
export IBMCLOUD_API_KEY="ic-..."
export TF_VAR_ibmcloud_api_key="${IBMCLOUD_API_KEY}"

# AWS
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."      # if using a temporary IAM role

# Azure
export ARM_CLIENT_ID="..."
export ARM_CLIENT_SECRET="..."
export ARM_TENANT_ID="..."
export ARM_SUBSCRIPTION_ID="..."

# GCP
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/sa-key.json"
export GOOGLE_CLOUD_PROJECT="my-project"
```

### 7.2 — Ansible Vault for team environments

```bash
# Create an encrypted secrets file
ansible-vault create iac/ansible/group_vars/secrets.yml

# Example secrets.yml content (before encryption):
# ibmcloud_api_key: "ic-..."
# aws_secret_access_key: "..."

# Use vault in a playbook (interactive password prompt)
ansible-playbook playbooks/deploy.yml \
  -i inventory/iks.yml \
  -e target_platform=iks \
  --ask-vault-pass

# Use a password file (for CI/CD pipelines)
ansible-playbook playbooks/deploy.yml \
  -i inventory/iks.yml \
  -e target_platform=iks \
  --vault-password-file ~/.ansible/vault-password

# Edit an existing vault file
ansible-vault edit iac/ansible/group_vars/secrets.yml
```

### 7.3 — Terraform state encryption

| Platform | Backend | Encryption |
|---|---|---|
| IKS / ROKS | IBM COS (S3-compatible) | Server-side AES-256 (SSE) |
| EKS | AWS S3 | `encrypt = true` + optional KMS |
| AKS | Azure Blob Storage | Native Azure Storage encryption |
| GKE | GCS | Google-managed or CMEK encryption |

**Enable KMS encryption for the EKS backend:**

```hcl
# In iac/terraform/environments/eks/backend.tf, add:
terraform {
  backend "s3" {
    # ...
    kms_key_id = "arn:aws:kms:eu-west-1:123456789012:key/mrk-..."
  }
}
```

### 7.4 — Principle of least privilege

- **IBM Cloud:** Create a dedicated Service ID with the `Kubernetes Service Administrator` role scoped only to the target Resource Group.
- **AWS:** Use IAM roles with minimal policies (EKS:CreateCluster, EKS:DescribeCluster, etc.); prefer IRSA for pod-level AWS access.
- **Azure:** Use a Service Principal with the `Azure Kubernetes Service Cluster Admin` role scoped only to the target Resource Group.
- **GCP:** Use a dedicated service account with `container.admin` and `iam.serviceAccountUser` roles scoped to the target project only.

### 7.5 — .gitignore — files to never commit

```gitignore
# Sensitive Terraform files
*.tfvars
!*.tfvars.example
*.tfstate
*.tfstate.backup
.terraform/
.terraform.lock.hcl

# Sensitive Ansible files
*vault*
*.key
group_vars/secrets.yml

# Cloud credentials
*.json
!package.json
!**/testdata/**/*.json
.env
.envrc

# Local kubeconfig files
config-*-hello-operator
```

> **Note:** This project already includes a `.gitignore` at the root that excludes `.env` files
> and directories starting with `_`. Extend it with the entries above to cover IaC-specific files.
