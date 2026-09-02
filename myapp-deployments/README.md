# MyApp — Kubernetes Deployment Manifests

Production-realistic YAML manifests for deploying **MyApp** across four Kubernetes platforms.
Each subfolder is fully self-contained and ready to apply with `kubectl apply -k <folder>`.

---

## Repository Structure

```
myapp-deployments/
├── iks-vpc-ibmcloud/              ← IBM Kubernetes Service on VPC
│   ├── ARCHITECTURE.md            ← Mermaid diagrams + deployment guide
│   ├── namespace.yaml
│   ├── serviceaccount.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── pvc.yaml                   ← ibmc-vpc-block-10iops-tier
│   ├── deployment.yaml            ← ICR image, VPC zone spread, non-root
│   ├── service.yaml               ← ClusterIP (+ optional VPC NLB annotations)
│   ├── ingress.yaml               ← IBM ALB, IBM subdomain, wildcard TLS
│   ├── hpa.yaml                   ← CPU/mem HPA, min:3 / max:10
│   └── kustomization.yaml
│
├── roks-openshift-ibmcloud/       ← Red Hat OpenShift on IBM Cloud
│   ├── ARCHITECTURE.md            ← Mermaid diagrams + SCC flow + upgrade flow
│   ├── namespace.yaml             ← OpenShift Project with UWM label
│   ├── serviceaccount.yaml        ← SA + RoleBinding for restricted-v2 SCC
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── pvc.yaml                   ← VPC Block or ODF (ocs-storagecluster-ceph-rbd)
│   ├── deployment.yaml            ← Standard Deployment (not DeploymentConfig)
│   ├── service.yaml               ← ClusterIP
│   ├── route.yaml                 ← OpenShift Route: edge TLS, HSTS, sticky
│   ├── hpa.yaml
│   └── kustomization.yaml
│
├── self-provisioned-kubernetes/   ← Self-managed K8s (on-prem / bare VMs)
│   ├── ARCHITECTURE.md            ← Mermaid diagrams + responsibility matrix + bootstrap guide
│   ├── namespace.yaml             ← PSA restricted policy labels
│   ├── serviceaccount.yaml        ← SA + view RoleBinding
│   ├── configmap.yaml             ← Generic, adapt endpoints to your infra
│   ├── secret.yaml                ← Placeholders — must use etcd encryption or Vault
│   ├── pvc.yaml                   ← local-path (adapt to Rook-Ceph/Longhorn)
│   ├── deployment.yaml            ← PSA restricted compliant, generic registry
│   ├── service.yaml               ← ClusterIP (+ MetalLB optional)
│   ├── ingress.yaml               ← NGINX Ingress, cert-manager, ingressClassName
│   ├── hpa.yaml                   ← Requires Metrics Server pre-installed
│   └── kustomization.yaml
│
└── eks-amazon/                    ← Amazon Elastic Kubernetes Service (EKS)
    ├── ARCHITECTURE.md            ← Mermaid diagrams + IRSA flow + scaling + network model
    ├── myapp-namespace.yaml       ← Namespace with cost-allocation labels
    ├── myapp-serviceaccount.yaml  ← SA with IRSA annotation (eks.amazonaws.com/role-arn)
    ├── myapp-configmap.yaml
    ├── myapp-secret.yaml          ← Placeholders — use Secrets Manager + ESO in prod
    ├── myapp-networkpolicy.yaml   ← Deny-all + selective allow (ALB, DNS, HTTPS, DB)
    ├── myapp-deployment.yaml      ← ECR image, multi-AZ spread, IRSA SA, non-root
    ├── myapp-service.yaml         ← ClusterIP (ALB targets pod IPs directly)
    ├── myapp-ingress.yaml         ← ALB Controller, internet-facing, ACM TLS, target-type: ip
    ├── myapp-hpa.yaml             ← CPU/mem HPA, min:2 / max:10, scale-down stabilization
    ├── myapp-pdb.yaml             ← PodDisruptionBudget minAvailable:1
    └── kustomization.yaml
```

---

## Platform Comparison at a Glance

| Feature | IKS (VPC) | ROKS (OpenShift) | Self-Provisioned | **EKS (Amazon)** |
|---------|-----------|------------------|------------------|------------------|
| **Control Plane** | IBM-managed | IBM-managed (OCP) | You manage (kubeadm) | **AWS-managed** |
| **Ingress Resource** | `Ingress` (IBM ALB / NGINX) | `Route` (HAProxy) | `Ingress` (NGINX) | **`Ingress` (AWS ALB Controller)** |
| **TLS Certificate** | IBM Certificate Manager (auto) | IBM-managed wildcard (auto) | cert-manager + Let's Encrypt | **AWS ACM (auto-renewed)** |
| **Storage Class** | `ibmc-vpc-block-10iops-tier` | `ibmc-vpc-block-*` or ODF | `local-path` (adapt) | **`gp3-csi` / EBS CSI Driver** |
| **Pod Security** | Pod Security Admission | SCCs (`restricted-v2`) | Pod Security Admission | **Pod Security Admission (`restricted`)** |
| **Image Registry** | ICR (auto pull secret) | ICR + OpenShift internal | Your registry (manual pull secret) | **ECR (Node IAM Role — no pull secret needed)** |
| **IAM Integration** | IBM Cloud IAM | IBM Cloud IAM + Red Hat SSO | Manual / Vault | **IRSA — OIDC-federated, short-lived tokens** |
| **Monitoring** | IBM Cloud Monitoring (Sysdig) | Built-in Prometheus + Grafana | kube-prometheus-stack (install) | **CloudWatch Container Insights (optional)** |
| **Autoscaling** | HPA + IBM Cluster Autoscaler | HPA + MachineAutoscaler | HPA + Cluster Autoscaler (manual) | **HPA + Cluster Autoscaler or Karpenter** |
| **Node OS** | Ubuntu 20/22 LTS or RHEL 8 | RHCOS (immutable) or RHEL 8 | Ubuntu / RHEL (you manage) | **Amazon Linux 2/2023 or Bottlerocket** |
| **Upgrades** | IBM-triggered rolling update | CVO-managed (OCP channels) | Manual (kubeadm upgrade) | **Managed Node Group rolling AMI update** |
| **NetworkPolicy** | Calico (included) | OVN-Kubernetes (included) | Calico / Cilium (you install) | **VPC CNI Network Policy or Calico** |
| **PodDisruptionBudget** | Manual | Manual | Manual | **Included (`myapp-pdb.yaml`)** |
| **Effort** | 🟢 Low–Medium | 🟢 Low–Medium | 🔴 High | **🟢 Low–Medium** |

---

## Quick Deploy

```bash
# IKS on VPC
kubectl apply -k iks-vpc-ibmcloud/

# ROKS / OpenShift
oc apply -k roks-openshift-ibmcloud/

# Self-provisioned Kubernetes
kubectl apply -k self-provisioned-kubernetes/

# Amazon EKS
aws eks update-kubeconfig --name <CLUSTER_NAME> --region us-east-1
kubectl apply -k eks-amazon/
```

---

## Prerequisites per Platform

### IKS on VPC
- IBM Cloud CLI with `container-service` plugin: `ibmcloud plugin install container-service`
- Cluster context: `ibmcloud ks cluster config --cluster <CLUSTER_NAME>`
- Image pushed to IBM Container Registry: `ibmcloud cr login && docker push us.icr.io/...`
- Replace `<CLUSTER_NAME>` placeholder in [`ingress.yaml`](iks-vpc-ibmcloud/ingress.yaml)

### ROKS / OpenShift
- `oc` CLI or `kubectl` with OpenShift cluster kubeconfig
- `oc login --token=<TOKEN> --server=https://api.<DOMAIN>:6443`
- Replace `<CLUSTER_NAME>` and `<REGION>` placeholders in [`route.yaml`](roks-openshift-ibmcloud/route.yaml)

### Self-Provisioned Kubernetes
Must install before applying:
1. **NGINX Ingress Controller** — `kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/baremetal/deploy.yaml`
2. **cert-manager** — `kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml`
3. **Metrics Server** — `kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml`
4. A production CSI driver (Rook-Ceph, Longhorn) and its `StorageClass`
5. Replace `myapp.example.com` in [`ingress.yaml`](self-provisioned-kubernetes/ingress.yaml) and `myregistry.io/myapp:1.0.0` in [`deployment.yaml`](self-provisioned-kubernetes/deployment.yaml)

### Amazon EKS
Must install / configure before applying:
1. **AWS CLI + kubeconfig** — `aws eks update-kubeconfig --name <CLUSTER_NAME> --region us-east-1`
2. **AWS Load Balancer Controller** — install via Helm in `kube-system` (required for `Ingress` → ALB provisioning)
3. **OIDC provider** — `eksctl utils associate-iam-oidc-provider --cluster <CLUSTER_NAME> --approve`
4. **IRSA IAM Role** — create a role with your required policies; update `eks.amazonaws.com/role-arn` in [`myapp-serviceaccount.yaml`](eks-amazon/myapp-serviceaccount.yaml)
5. **Metrics Server** — `kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml`
6. **NetworkPolicy support** — enable VPC CNI network policy: `aws eks update-addon --cluster-name <NAME> --addon-name vpc-cni --configuration-values '{"enableNetworkPolicy":"true"}'`
7. Replace `myapp.example.com` and the ACM certificate ARN in [`myapp-ingress.yaml`](eks-amazon/myapp-ingress.yaml), and the ECR image URI in [`myapp-deployment.yaml`](eks-amazon/myapp-deployment.yaml)

---

## Security Checklist (All Platforms)

- [ ] Replace all base64 placeholder values in `secret.yaml` with real secrets — or better, delete the file and use an external secrets manager
- [ ] Enable etcd encryption at rest (self-provisioned: `--encryption-provider-config`; IKS/ROKS: IBM Key Protect; EKS: KMS envelope encryption via `aws eks update-cluster-config --encryption-config`)
- [ ] Review and tighten RBAC — the `view` ClusterRole in `serviceaccount.yaml` may be too permissive
- [ ] Apply `NetworkPolicy` resources to restrict pod-to-pod traffic (EKS: already included in `myapp-networkpolicy.yaml` — ensure VPC CNI Network Policy or Calico is active)
- [ ] Add a `PodDisruptionBudget` to protect against accidental mass eviction (EKS: already included in `myapp-pdb.yaml`)
- [ ] Enable image vulnerability scanning (ICR Vulnerability Advisor for IKS/ROKS; Amazon ECR enhanced scanning with Inspector for EKS; Trivy in CI/CD for self-provisioned)
- [ ] Rotate `JWT_SECRET` and `DB_PASSWORD` regularly
- [ ] EKS only: scope IRSA IAM Role policies to the minimum required permissions (least-privilege)
- [ ] EKS only: tag VPC subnets correctly (`kubernetes.io/role/elb=1` for public, `kubernetes.io/role/internal-elb=1` for private) so the ALB Controller can discover them

---

## Related Documents

| Document | Description |
|----------|-------------|
| [`output/comparison_en.html`](../output/comparison_en.html) | Detailed effort comparison — English HTML |
| [`output/comparison_fr.html`](../output/comparison_fr.html) | Detailed effort comparison — French HTML |
| [`output/comparison_en.md`](../output/comparison_en.md) | Detailed effort comparison — English Markdown |
| [`output/comparison_fr.md`](../output/comparison_fr.md) | Detailed effort comparison — French Markdown |
| [`iks-vpc-ibmcloud/ARCHITECTURE.md`](iks-vpc-ibmcloud/ARCHITECTURE.md) | IKS architecture + request flow + scaling diagrams |
| [`roks-openshift-ibmcloud/ARCHITECTURE.md`](roks-openshift-ibmcloud/ARCHITECTURE.md) | ROKS architecture + SCC flow + upgrade diagrams |
| [`self-provisioned-kubernetes/ARCHITECTURE.md`](self-provisioned-kubernetes/ARCHITECTURE.md) | Self-hosted architecture + bootstrap guide + responsibility matrix |
| [`eks-amazon/ARCHITECTURE.md`](eks-amazon/ARCHITECTURE.md) | EKS architecture + IRSA flow + ALB + scaling + network model diagrams |

---

*Kubernetes Platform Deployment Examples · 2025 · MyApp v1.0.0*
