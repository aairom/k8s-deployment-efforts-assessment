# MyApp on Self-Provisioned Kubernetes — Secret Management Guide

> **Platform:** Self-managed Kubernetes (bare-metal, VMware, or cloud IaaS VMs)  
> **Two strategies available** — choose the one that fits your infrastructure

---

## Why this approach

IBM Vault Radar's Block Secrets control rejected commits containing base64-encoded
credentials in Kubernetes Secret manifests. The remediation removes every hardcoded
value and replaces them with safe-to-commit manifests that resolve real secrets at
deploy-time. **Nothing sensitive is ever written to the Git repository.**

---

## Strategy A — Sealed Secrets (Bitnami kubeseal)

Best for: air-gapped clusters, clusters without a separate secret store, teams
that want a fully GitOps-compatible workflow with cluster-bound encryption.

### How it works

```
.env (never committed)
   │
   ▼
kubectl create secret --dry-run → plain Secret YAML (temp, never committed)
   │
   ▼
kubeseal → sealed-secret.yaml (safe to commit — encrypted with cluster public key)
   │
   ▼
kubectl apply → Sealed Secrets Controller decrypts → live K8s Secret
```

### Files

| File | Committed? | Purpose |
|------|-----------|---------|
| `.env.example` | ✅ Yes | Template — copy to `.env` and fill real values |
| `.env` | ❌ No (in `.gitignore`) | Actual secret values — local only |
| `sealed-secret.yaml` | ✅ Yes (after kubeseal) | Encrypted SealedSecret — safe to commit |
| `secret.yaml` | ✅ Yes (empty) | Sentinel — no data block |

### Step-by-step

#### 1 — Install Sealed Secrets controller

```bash
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update
helm install sealed-secrets sealed-secrets/sealed-secrets \
  -n kube-system \
  --set fullnameOverride=sealed-secrets-controller
```

#### 2 — Install kubeseal CLI

```bash
# macOS
brew install kubeseal

# Linux
KUBESEAL_VERSION=$(curl -s https://api.github.com/repos/bitnami-labs/sealed-secrets/releases/latest \
  | jq -r .tag_name | tr -d v)
curl -OL "https://github.com/bitnami-labs/sealed-secrets/releases/download/v${KUBESEAL_VERSION}/kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz"
tar -xvzf kubeseal-${KUBESEAL_VERSION}-linux-amd64.tar.gz kubeseal
sudo install -m 755 kubeseal /usr/local/bin/kubeseal
```

#### 3 — Create your `.env` file from the example

```bash
cp myapp-deployments/self-provisioned-kubernetes/.env.example \
   myapp-deployments/self-provisioned-kubernetes/.env

# Edit .env — fill in real values
# DB_PASSWORD, APP_API_KEY, JWT_SECRET, REGISTRY_TOKEN
```

**Verify `.env` is gitignored:**
```bash
git check-ignore -v myapp-deployments/self-provisioned-kubernetes/.env
# Expected output: .gitignore:.env  myapp-deployments/self-provisioned-kubernetes/.env
```

#### 4 — Generate a plain Secret (ephemeral — never commit)

```bash
kubectl create secret generic myapp-secret \
  --from-env-file=myapp-deployments/self-provisioned-kubernetes/.env \
  --namespace myapp \
  --dry-run=client \
  -o yaml > /tmp/myapp-secret-plain.yaml
```

#### 5 — Seal it with kubeseal

```bash
kubeseal \
  --controller-name=sealed-secrets-controller \
  --controller-namespace=kube-system \
  --format yaml \
  < /tmp/myapp-secret-plain.yaml \
  > myapp-deployments/self-provisioned-kubernetes/sealed-secret.yaml

# Destroy the plaintext immediately
rm /tmp/myapp-secret-plain.yaml
```

#### 6 — Uncomment `sealed-secret.yaml` in `kustomization.yaml`

Edit `myapp-deployments/self-provisioned-kubernetes/kustomization.yaml`:
```yaml
  # Strategy A — Sealed Secrets (Bitnami kubeseal)
  - sealed-secret.yaml     # ← remove the leading #
```

#### 7 — Deploy

```bash
kubectl apply -k myapp-deployments/self-provisioned-kubernetes/
kubectl get secret myapp-secret -n myapp
```

#### 8 — Commit `sealed-secret.yaml` (it is safe)

```bash
git add myapp-deployments/self-provisioned-kubernetes/sealed-secret.yaml
git commit -m "chore: add sealed secret for myapp (Strategy A)"
```

---

## Strategy B — External Secrets Operator + HashiCorp Vault

Best for: clusters with an existing HashiCorp Vault instance, teams managing multiple
clusters that share a central secret store.

### Files

| File | Committed? | Purpose |
|------|-----------|---------|
| `secretstore.yaml` | ✅ Yes | ESO backend — points to Vault address, configures K8s auth |
| `externalsecret.yaml` | ✅ Yes | Maps Vault KV paths → K8s Secret keys |
| `secret.yaml` | ✅ Yes (empty) | Sentinel — no data block |

### Step-by-step

#### 1 — Install HashiCorp Vault

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update
helm install vault hashicorp/vault \
  -n vault \
  --create-namespace \
  --set "server.dev.enabled=false"

# Initialise and unseal Vault (follow output instructions)
kubectl exec -n vault vault-0 -- vault operator init
kubectl exec -n vault vault-0 -- vault operator unseal <UNSEAL_KEY>
```

#### 2 — Configure Vault Kubernetes auth

```bash
kubectl exec -n vault vault-0 -- /bin/sh -c "
  vault auth enable kubernetes
  vault write auth/kubernetes/config \
    kubernetes_host='https://\$KUBERNETES_PORT_443_TCP_ADDR:443'
"
```

#### 3 — Create Vault policy and role

```bash
kubectl exec -n vault vault-0 -- vault policy write myapp-read - <<'EOF'
path "secret/data/myapp/production" {
  capabilities = ["read"]
}
EOF

kubectl exec -n vault vault-0 -- vault write auth/kubernetes/role/myapp-eso \
  bound_service_account_names=external-secrets-sa \
  bound_service_account_namespaces=myapp \
  policies=myapp-read \
  ttl=1h
```

#### 4 — Write secrets to Vault (never in Git)

```bash
kubectl exec -n vault vault-0 -- vault kv put secret/myapp/production \
  DB_PASSWORD="$(openssl rand -base64 24)" \
  APP_API_KEY="$(openssl rand -hex 32)" \
  JWT_SECRET="$(openssl rand -base64 48)" \
  REGISTRY_TOKEN="<harbor-or-quay-robot-token>"
```

#### 5 — Install ESO and create its ServiceAccount

```bash
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace \
  --set installCRDs=true

kubectl create serviceaccount external-secrets-sa -n myapp
```

#### 6 — Update `secretstore.yaml` Vault address

Edit `myapp-deployments/self-provisioned-kubernetes/secretstore.yaml`:
```yaml
server: "http://vault.vault.svc:8200"   # ← replace VAULT_ADDRESS placeholder
```

#### 7 — Uncomment ESO resources in `kustomization.yaml`

```yaml
  # Strategy B
  - secretstore.yaml        # ← remove leading #
  - externalsecret.yaml     # ← remove leading #
```

#### 8 — Deploy

```bash
kubectl apply -k myapp-deployments/self-provisioned-kubernetes/
kubectl get externalsecret myapp-externalsecret -n myapp
kubectl get secret myapp-secret -n myapp
```

---

## Vault Radar compliance

| Check | Status |
|-------|--------|
| No base64 secret values in any committed YAML | ✅ |
| No plaintext passwords in any committed file | ✅ |
| `.env` excluded by `.gitignore` | ✅ |
| `sealed-secret.yaml` contains only asymmetrically encrypted ciphertext | ✅ |
| ESO + Vault: real values stored only in Vault, never in Git | ✅ |
| `secret.yaml` contains no `data:` block | ✅ |
