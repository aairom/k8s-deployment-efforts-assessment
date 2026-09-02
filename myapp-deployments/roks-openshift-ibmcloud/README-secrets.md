# MyApp on ROKS (Red Hat OpenShift on IBM Cloud) — Secret Management Guide

> **Secret backend:** IBM Secrets Manager  
> **Operator:** External Secrets Operator (ESO) v0.9+ — installable via OperatorHub  
> **Auth method:** IBM Cloud API Key (Service ID)

---

## Why this approach

IBM Vault Radar's Block Secrets control rejected commits containing base64-encoded
credentials in Kubernetes Secret manifests. The remediation replaces every hardcoded
value with an **ExternalSecret** CRD. ESO fetches real values from IBM Secrets Manager
at deploy-time. **Nothing sensitive is ever written to the Git repository.**

On ROKS, ESO integrates naturally alongside OpenShift GitOps (ArgoCD) and can be
installed directly from OperatorHub for a fully operator-managed experience.

---

## Files introduced

| File | Purpose |
|------|---------|
| `secretstore.yaml` | Declares the IBM Secrets Manager backend and Service ID auth for ESO |
| `externalsecret.yaml` | Maps IBM Secrets Manager secret names → K8s Secret keys; ESO creates `myapp-secret` |
| `secret.yaml` | Empty sentinel — no `data:` block; kept for documentation only |

---

## Prerequisites — complete these BEFORE running `oc apply -k`

### 1 — Install External Secrets Operator via OperatorHub

```bash
# Option A — OperatorHub (recommended on ROKS)
# Navigate to: OpenShift Web Console → OperatorHub → search "External Secrets Operator"
# Install into namespace: external-secrets-system
# Approval: Automatic

# Option B — Helm
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace \
  --set installCRDs=true
```

### 2 — Provision IBM Secrets Manager and Service ID

Follow the same steps as the IKS guide:
see [`../iks-vpc-ibmcloud/README-secrets.md`](../iks-vpc-ibmcloud/README-secrets.md) — Steps 1–5.

The IBM Secrets Manager instance and secrets can be shared between IKS and ROKS clusters
in the same IBM Cloud account if they are in the same region.

### 3 — Create the bootstrap Kubernetes Secret (one-time, operator-only)

```bash
# Authenticate to the ROKS cluster
ibmcloud oc cluster config --cluster <CLUSTER_NAME>
oc login --token=<TOKEN> --server=https://api.<CLUSTER_DOMAIN>:6443

# Create the bootstrap Secret — NEVER committed to Git
oc create secret generic secret-ibm-api-key \
  --from-literal=apiKey=<IBM_CLOUD_API_KEY_SERVICE_ID> \
  -n myapp
```

### 4 — Deploy

```bash
oc apply -k myapp-deployments/roks-openshift-ibmcloud/

# Confirm ESO synced the Secret
oc get externalsecret myapp-externalsecret -n myapp
oc get secret myapp-secret -n myapp
```

Expected ESO status: `SecretSynced — True`

### 5 — Verify SCC compatibility

ESO creates the `myapp-secret` object as a controller, not as a pod — SCC enforcement
does not apply to the Secret creation process itself. The application pods read
the Secret via environment variable injection, which is unaffected by SCC.

```bash
# Confirm the Secret has the expected keys
oc get secret myapp-secret -n myapp -o jsonpath='{.data}' | jq 'keys'
# Expected: ["DB_PASSWORD", "IBM_CLOUD_API_KEY", "JWT_SECRET"]
```

---

## OpenShift GitOps (ArgoCD) integration note

If using ArgoCD, add the `ExternalSecret` and `SecretStore` manifests to your
Application source. ArgoCD will sync them; ESO will reconcile the live Secret.
Set `ignoreDifferences` for the `myapp-secret` Secret object in the ArgoCD Application
spec so ArgoCD does not attempt to manage the ESO-owned Secret directly:

```yaml
ignoreDifferences:
  - group: ""
    kind: Secret
    name: myapp-secret
    namespace: myapp
    jsonPointers:
      - /data
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
