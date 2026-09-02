# MyApp on IKS (IBM Cloud VPC) — Secret Management Guide

> **Secret backend:** IBM Secrets Manager  
> **Operator:** External Secrets Operator (ESO) v0.9+  
> **Auth method:** IBM Cloud API Key (Service ID)

---

## Why this approach

IBM Vault Radar's Block Secrets control rejected commits containing base64-encoded
credentials in Kubernetes Secret manifests. The remediation replaces every hardcoded
value with an **ExternalSecret** CRD. ESO fetches real values from IBM Secrets Manager
at deploy-time. **Nothing sensitive is ever written to the Git repository.**

---

## Files introduced

| File | Purpose |
|------|---------|
| `secretstore.yaml` | Declares the IBM Secrets Manager backend and Service ID API key auth for ESO |
| `externalsecret.yaml` | Maps IBM Secrets Manager secret names → K8s Secret keys; ESO creates `myapp-secret` |
| `secret.yaml` | Empty sentinel — no `data:` block; kept for documentation only |

---

## Prerequisites — complete these BEFORE running `kubectl apply -k`

### 1 — Provision IBM Secrets Manager

```bash
# Create a Secrets Manager instance (Standard plan, us-south)
ibmcloud resource service-instance-create \
  myapp-secrets-manager \
  secrets-manager \
  standard \
  us-south

# Get the instance GUID
ibmcloud resource service-instance myapp-secrets-manager --id
# Output: crn:v1:bluemix:... / <INSTANCE_GUID>
```

Update `secretstore.yaml` → `spec.provider.ibm.serviceUrl` with the actual GUID.

### 2 — Create a Service ID with SecretsReader role

```bash
# Create the Service ID
ibmcloud iam service-id-create myapp-eso-reader \
  --description "ESO service ID for MyApp secrets read"

# Assign SecretsReader role on the Secrets Manager instance
ibmcloud iam service-policy-create myapp-eso-reader \
  --roles SecretsReader \
  --service-name secrets-manager \
  --service-instance <INSTANCE_GUID>

# Create an API key for the Service ID
ibmcloud iam service-api-key-create myapp-eso-apikey myapp-eso-reader \
  --description "ESO API key for myapp-secrets-manager"
# ⚠ Copy the API key value now — it is shown only once.
```

### 3 — Create the bootstrap Kubernetes Secret (one-time, operator-only)

This Secret holds the IBM Cloud API key that ESO uses to authenticate.
It is created imperatively — **never committed to Git**.

```bash
# Authenticate to the cluster
ibmcloud ks cluster config --cluster <CLUSTER_NAME>

# Create the bootstrap Secret
kubectl create secret generic secret-ibm-api-key \
  --from-literal=apiKey=<IBM_CLOUD_API_KEY_FROM_STEP_2> \
  -n myapp
```

### 4 — Install External Secrets Operator

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace \
  --set installCRDs=true
```

Verify:
```bash
kubectl get pods -n external-secrets-system
kubectl get crd externalsecrets.external-secrets.io
```

### 5 — Create secrets in IBM Secrets Manager

```bash
# Create a secret group for production
ibmcloud secrets-manager secret-group-create \
  --name myapp-production \
  --description "MyApp production credentials"

GROUP_ID=$(ibmcloud secrets-manager secret-groups --output json | \
  jq -r '.secret_groups[] | select(.name=="myapp-production") | .id')

# DB password
ibmcloud secrets-manager secret-create \
  --secret-type arbitrary \
  --secret-name "myapp/db-password" \
  --secret-payload "<STRONG_RANDOM_PASSWORD>" \
  --secret-group-id "$GROUP_ID"

# IBM Cloud API key (for application use, separate from the ESO key)
ibmcloud secrets-manager secret-create \
  --secret-type arbitrary \
  --secret-name "myapp/ibm-cloud-api-key" \
  --secret-payload "<APP_IBM_CLOUD_API_KEY>" \
  --secret-group-id "$GROUP_ID"

# JWT secret
ibmcloud secrets-manager secret-create \
  --secret-type arbitrary \
  --secret-name "myapp/jwt-secret" \
  --secret-payload "$(openssl rand -base64 48)" \
  --secret-group-id "$GROUP_ID"
```

### 6 — Deploy

```bash
kubectl apply -k myapp-deployments/iks-vpc-ibmcloud/

# Confirm ESO synced the Secret
kubectl get externalsecret myapp-externalsecret -n myapp
kubectl get secret myapp-secret -n myapp
```

Expected ESO status: `SecretSynced — True`

---

## Rotation

IBM Secrets Manager supports automatic rotation for supported secret types.
ESO re-fetches every `refreshInterval: 1h`. To force an immediate refresh:

```bash
kubectl annotate externalsecret myapp-externalsecret \
  force-sync=$(date +%s) \
  --overwrite \
  -n myapp
```

---

## Troubleshooting

```bash
# Check ESO sync status
kubectl describe externalsecret myapp-externalsecret -n myapp

# Check ESO controller logs
kubectl logs -n external-secrets-system \
  -l app.kubernetes.io/name=external-secrets --tail=50

# Verify IBM Secrets Manager access with the Service ID API key
ibmcloud login --apikey <IBM_CLOUD_API_KEY>
ibmcloud secrets-manager secret-list
```

---

## Vault Radar compliance

| Check | Status |
|-------|--------|
| No base64 secret values in any committed YAML | ✅ |
| No plaintext passwords in any committed file | ✅ |
| Secret values stored only in IBM Secrets Manager | ✅ |
| ESO creates the live K8s Secret at runtime | ✅ |
| Bootstrap API key Secret created imperatively (never in Git) | ✅ |
| `.gitignore` excludes all `.env` files | ✅ |
