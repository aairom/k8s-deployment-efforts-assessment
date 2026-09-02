# MyApp on Amazon EKS — Secret Management Guide

> **Secret backend:** AWS Secrets Manager  
> **Operator:** External Secrets Operator (ESO) v0.9+  
> **Auth method:** IRSA (IAM Roles for Service Accounts — OIDC-federated)

---

## Why this approach

IBM Vault Radar's Block Secrets control rejected commits that contained
base64-encoded credentials in Kubernetes Secret manifests. The remediation
replaces every hardcoded value with an **ExternalSecret** CRD that instructs
ESO to fetch real values from AWS Secrets Manager at deploy-time.
**Nothing sensitive is ever written to the Git repository.**

---

## Files introduced

| File | Purpose |
|------|---------|
| `myapp-secretstore.yaml` | Declares the AWS Secrets Manager backend and IRSA auth for ESO |
| `myapp-externalsecret.yaml` | Maps AWS secret keys → Kubernetes Secret keys; ESO creates the live `myapp-secret` object |
| `myapp-secret.yaml` | Empty sentinel — no `data:` block; kept for kustomization documentation only |

---

## Prerequisites — complete these BEFORE running `kubectl apply -k`

### 1 — Install External Secrets Operator

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
kubectl get crd | grep external-secrets
```

### 2 — Create the IAM Role for ESO (IRSA)

Create an IAM policy that allows ESO to read only the `myapp/production` secret:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ],
    "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:myapp/production-*"
  }]
}
```

```bash
# Create the policy
aws iam create-policy \
  --policy-name myapp-eso-secretsmanager-policy \
  --policy-document file://eso-policy.json

# Create the IRSA role and ServiceAccount
eksctl create iamserviceaccount \
  --name external-secrets-sa \
  --namespace myapp \
  --cluster <CLUSTER_NAME> \
  --attach-policy-arn arn:aws:iam::123456789012:policy/myapp-eso-secretsmanager-policy \
  --approve
```

Update `myapp-secretstore.yaml` → `spec.provider.aws.auth.jwt.serviceAccountRef.name`
if you used a different ServiceAccount name.

### 3 — Create the secret in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name myapp/production \
  --region us-east-1 \
  --description "MyApp production credentials" \
  --secret-string '{
    "DB_HOST":        "db.prod.us-east-1.rds.amazonaws.com",
    "DB_NAME":        "myapp_db",
    "DB_USER":        "myapp_user",
    "DB_PASSWORD":    "<STRONG_RANDOM_PASSWORD>",
    "API_SECRET_KEY": "<32_CHAR_HEX_KEY>",
    "JWT_SECRET":     "<64_CHAR_RANDOM_STRING>"
  }'
```

Use strong, randomly generated values. Suggested generation:
```bash
# DB_PASSWORD
openssl rand -base64 24

# API_SECRET_KEY
openssl rand -hex 32

# JWT_SECRET
openssl rand -base64 48
```

### 4 — Deploy

```bash
# Apply namespace and RBAC first
kubectl apply -f myapp-deployments/eks-amazon/myapp-namespace.yaml

# Apply the full stack (ESO will create myapp-secret automatically)
kubectl apply -k myapp-deployments/eks-amazon/

# Confirm ESO synced the secret
kubectl get externalsecret myapp-externalsecret -n myapp
kubectl get secret myapp-secret -n myapp
```

Expected ESO status: `SecretSynced — True`

---

## Rotation

AWS Secrets Manager supports automatic rotation via Lambda functions.
ESO re-fetches every `refreshInterval: 1h` (configurable in `myapp-externalsecret.yaml`).
Rolling pod restarts on rotation can be triggered with:

```bash
kubectl rollout restart deployment/myapp -n myapp
```

Or via the ESO `secretVersionStage` / `secretVersionId` fields to pin a specific version.

---

## Troubleshooting

```bash
# Check ESO reconciliation status
kubectl describe externalsecret myapp-externalsecret -n myapp

# Check ESO controller logs
kubectl logs -n external-secrets-system \
  -l app.kubernetes.io/name=external-secrets --tail=50

# Manually test IAM role assumption
aws secretsmanager get-secret-value \
  --secret-id myapp/production \
  --region us-east-1
```

---

## Vault Radar compliance

| Check | Status |
|-------|--------|
| No base64 secret values in any committed YAML | ✅ |
| No plaintext passwords in any committed file | ✅ |
| Secret values stored only in AWS Secrets Manager | ✅ |
| ESO creates the live K8s Secret at runtime | ✅ |
| `.gitignore` excludes all `.env` files | ✅ |
