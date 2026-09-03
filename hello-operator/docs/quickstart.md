# hello-operator — Quickstart Guide

**hello-operator** is a production-ready Kubernetes Operator written in Go that manages a simple "Hello World" HTTP application through a custom `HelloWorld` resource. This guide walks you through every step from cloning the repository to running a live workload on any Kubernetes platform.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Structure](#2-repository-structure)
3. [Clone and Build](#3-clone-and-build)
4. [Generate CRD Manifests](#4-generate-crd-manifests)
5. [Build and Push the Operator Image](#5-build-and-push-the-operator-image)
6. [Deploy the Operator](#6-deploy-the-operator)
7. [Apply the Sample Custom Resource](#7-apply-the-sample-custom-resource)
8. [Verify the Deployment](#8-verify-the-deployment)
9. [Access the Hello World Application](#9-access-the-hello-world-application)
10. [Update the Custom Resource](#10-update-the-custom-resource)
11. [Cleanup](#11-cleanup)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

Before you begin, ensure the following tools are installed and configured on your workstation.

### Required Tools

| Tool | Minimum version | Installation |
|---|---|---|
| **Go** | 1.21 | https://go.dev/dl/ |
| **Docker** or **Podman** | Docker 24+ / Podman 4+ | https://docs.docker.com/get-docker/ |
| **kubectl** | 1.26+ | https://kubernetes.io/docs/tasks/tools/ |
| **kustomize** | 5.x | `make kustomize` (auto-installed) |
| **controller-gen** | 0.13+ | `make controller-gen` (auto-installed) |

### Optional but Recommended

| Tool | Purpose |
|---|---|
| **Operator SDK** v1.x | Alternative scaffolding and `operator-sdk run bundle` |
| **Kubebuilder** v3.x+ | Alternative scaffolding |
| **golangci-lint** | Code linting (`make lint`) |

### Kubernetes Cluster Access

You need a Kubernetes cluster with:

- **kubectl** configured with a context that has cluster-admin permissions (for CRD installation)
- **Container registry** credentials — you need to push the operator image to a registry reachable from your cluster

Supported platforms (no platform-specific changes required):

| Platform | Notes |
|---|---|
| **Vanilla Kubernetes** (kind, kubeadm) | Fully supported |
| **IBM Kubernetes Service (IKS)** | Use IBM Cloud Container Registry (ICR) or Docker Hub |
| **Red Hat OpenShift (ROKS/OCP)** | Use `oc` instead of `kubectl`; grant `anyuid` SCC if needed |
| **Google GKE** | Use Google Artifact Registry |
| **Amazon EKS** | Use Amazon ECR |
| **Azure AKS** | Use Azure Container Registry |
| **Minikube / kind** | `make docker-build` then `minikube image load` or `kind load docker-image` |

### Verify Your Setup

```bash
go version        # should print go1.21.x or later
docker version    # or: podman version
kubectl version   # should print client and server versions
kubectl cluster-info
```

---

## 2. Repository Structure

```
hello-operator/
├── api/
│   └── v1alpha1/
│       ├── doc.go                          # Package-level Go doc and group annotation
│       ├── groupversion_info.go            # GroupVersion and SchemeBuilder registration
│       ├── helloworld_types.go             # HelloWorld CRD Go types (Spec, Status, conditions)
│       └── zz_generated.deepcopy.go        # Auto-generated DeepCopy methods (do not edit)
├── cmd/
│   └── manager/
│       └── main.go                         # Operator entry point — boots the Manager
├── config/
│   ├── crd/
│   │   ├── bases/
│   │   │   └── apps.example.com_helloworlds.yaml  # CRD YAML (generated / hand-crafted)
│   │   └── kustomization.yaml
│   ├── default/
│   │   └── kustomization.yaml              # Top-level Kustomize overlay (namespace, image)
│   ├── manager/
│   │   ├── manager.yaml                    # Operator Deployment manifest
│   │   ├── namespace.yaml                  # hello-operator-system Namespace
│   │   └── kustomization.yaml
│   ├── rbac/
│   │   ├── role.yaml                       # ClusterRoles for manager, metrics, proxy
│   │   ├── role_binding.yaml               # ClusterRoleBindings
│   │   ├── service_account.yaml            # Operator ServiceAccount
│   │   └── kustomization.yaml
│   └── samples/
│       ├── apps_v1alpha1_helloworld.yaml   # Example HelloWorld custom resource
│       └── kustomization.yaml
├── docs/
│   ├── quickstart.md                       # This document
│   └── quickstart.html                     # Self-contained HTML version
├── hack/
│   └── boilerplate.go.txt                  # License header for generated files
├── internal/
│   └── controller/
│       └── helloworld_controller.go        # Reconciliation logic
├── Dockerfile                              # Multi-stage build (builder + distroless)
├── Makefile                                # All build, generate, deploy targets
├── go.mod                                  # Go module descriptor
└── go.sum                                  # Dependency checksums
```

---

## 3. Clone and Build

### 3.1 Clone the Repository

```bash
git clone https://github.com/example/hello-operator.git
cd hello-operator
```

If you are working from a local copy (no remote), simply enter the directory:

```bash
cd hello-operator
```

### 3.2 Download Dependencies

```bash
go mod tidy
```

This downloads all modules declared in `go.mod` and updates `go.sum`. Expected output:

```
go: downloading k8s.io/api v0.28.4
go: downloading k8s.io/apimachinery v0.28.4
...
```

### 3.3 Compile the Manager Binary Locally

```bash
make build
```

This runs `go build -o bin/manager ./cmd/manager`. The binary is written to `bin/manager`. No Kubernetes cluster is required for this step.

To confirm the binary works:

```bash
./bin/manager --help
```

Expected output:

```
Usage of /manager:
  -health-probe-bind-address string
    The address the health probe endpoint binds to. (default ":8081")
  -leader-elect
    Enable leader election for controller manager.
  -metrics-bind-address string
    The address the metrics endpoint binds to. (default ":8080")
  ...
```

---

## 4. Generate CRD Manifests

> **Skip this step** if you are using the pre-generated manifests already in `config/crd/bases/`. Run it only after modifying `api/v1alpha1/helloworld_types.go`.

The `make manifests` target uses `controller-gen` to regenerate the CRD YAML from Go struct annotations, and `make generate` regenerates the `zz_generated.deepcopy.go` file.

```bash
# Install controller-gen locally (placed in ./bin/controller-gen)
make controller-gen

# Regenerate CRD YAML and RBAC from Go annotations
make manifests

# Regenerate DeepCopy methods
make generate
```

After running these commands, inspect the regenerated CRD:

```bash
cat config/crd/bases/apps.example.com_helloworlds.yaml
```

You should see the `openAPIV3Schema` block updated to reflect your current type definitions.

---

## 5. Build and Push the Operator Image

Replace `<your-registry>` with your container registry (e.g., `docker.io/myuser`, `us.icr.io/my-namespace`, `123456789012.dkr.ecr.us-east-1.amazonaws.com`).

### 5.1 Set the Image Variable

```bash
export IMG=<your-registry>/hello-operator:v0.1.0
```

### 5.2 Build the Image

```bash
make docker-build IMG=$IMG
```

This builds a multi-stage Docker image:
- **Stage 1 (builder):** `golang:1.21-alpine` — compiles the binary with `CGO_ENABLED=0`
- **Stage 2 (runtime):** `gcr.io/distroless/static-debian11:nonroot` — minimal attack surface

### 5.3 Push the Image

```bash
make docker-push IMG=$IMG
```

Ensure you are logged in to your registry before pushing:

```bash
# Docker Hub
docker login

# IBM Cloud Container Registry
ibmcloud cr login

# Amazon ECR
aws ecr get-login-password --region <region> | docker login --username AWS \
  --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

# Google Artifact Registry
gcloud auth configure-docker <region>-docker.pkg.dev

# Azure Container Registry
az acr login --name <registry-name>
```

### 5.4 Multi-Architecture Build (optional)

To build for both `linux/amd64` and `linux/arm64` (e.g., for Apple Silicon or Graviton nodes):

```bash
make docker-buildx IMG=$IMG
```

---

## 6. Deploy the Operator

### 6.1 Install the CRD

```bash
make install
```

This applies `config/crd/bases/apps.example.com_helloworlds.yaml` to the cluster. Verify:

```bash
kubectl get crd helloworlds.apps.example.com
```

Expected output:

```
NAME                            CREATED AT
helloworlds.apps.example.com    2026-09-03T13:40:00Z
```

### 6.2 Deploy the Operator Pod

```bash
make deploy IMG=$IMG
```

This command:
1. Runs `kustomize edit set image controller=$IMG` inside `config/manager/`
2. Builds the full Kustomize overlay from `config/default/`
3. Applies the resulting YAML to the cluster

This creates the `hello-operator-system` namespace and deploys:

- `Namespace/hello-operator-system`
- `ServiceAccount/hello-operator-controller-manager`
- `ClusterRole/hello-operator-manager-role`
- `ClusterRoleBinding/hello-operator-manager-rolebinding`
- `Deployment/hello-operator-controller-manager`

### 6.3 Verify the Operator is Running

```bash
kubectl -n hello-operator-system get pods
```

Expected output (wait ~30 seconds for the image pull):

```
NAME                                                    READY   STATUS    RESTARTS   AGE
hello-operator-controller-manager-6d9f8c4b7d-xk4pl     1/1     Running   0          45s
```

Check the operator logs:

```bash
kubectl -n hello-operator-system logs -l control-plane=controller-manager --follow
```

You should see:

```
{"level":"info","ts":"...","logger":"setup","msg":"starting manager"}
{"level":"info","ts":"...","logger":"controller-runtime.manager","msg":"Starting server","path":"/metrics","kind":"metrics"}
{"level":"info","ts":"...","logger":"controller-runtime.manager","msg":"Starting EventSource","controller":"helloworld","controllerKind":"HelloWorld"}
```

### OpenShift / ROKS-specific step

If deploying on OpenShift (ROKS or OCP), the `hashicorp/http-echo` image runs as root by default. Grant the appropriate SCC:

```bash
oc adm policy add-scc-to-serviceaccount anyuid \
  -n hello-operator-system \
  -z hello-operator-controller-manager

# Or for sample workloads in the default namespace:
oc adm policy add-scc-to-serviceaccount anyuid \
  -n default -z default
```

---

## 7. Apply the Sample Custom Resource

```bash
kubectl apply -f config/samples/apps_v1alpha1_helloworld.yaml
```

The sample manifest creates a `HelloWorld` resource named `helloworld-sample` in the `default` namespace with 2 replicas and a custom message.

You can also create a resource inline:

```bash
kubectl apply -f - <<EOF
apiVersion: apps.example.com/v1alpha1
kind: HelloWorld
metadata:
  name: my-hello
  namespace: default
spec:
  replicas: 1
  message: "Hello from kubectl!"
  serviceType: ClusterIP
EOF
```

---

## 8. Verify the Deployment

### 8.1 List HelloWorld Resources

```bash
kubectl get helloworld -A
# or using the shortname:
kubectl get hw -A
```

Expected output:

```
NAMESPACE   NAME                 REPLICAS   READY   MESSAGE                          AGE
default     helloworld-sample    2          2       Hello from the hello-operator!   30s
```

### 8.2 Check the Pods

```bash
kubectl get pods -l app.kubernetes.io/managed-by=hello-operator
```

Expected output:

```
NAME                                               READY   STATUS    RESTARTS   AGE
helloworld-sample-deployment-7d9f5b8c4-j6pfx       1/1     Running   0          35s
helloworld-sample-deployment-7d9f5b8c4-qrtmk       1/1     Running   0          35s
```

### 8.3 Check the Service

```bash
kubectl get svc -l app.kubernetes.io/managed-by=hello-operator
```

Expected output:

```
NAME                        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
helloworld-sample-service   ClusterIP   10.96.142.87    <none>        80/TCP    40s
```

### 8.4 Inspect the HelloWorld Status

```bash
kubectl describe helloworld helloworld-sample
```

The `Status.Conditions` section will show:

```
Conditions:
  Type         Status  Reason               Message
  ----         ------  ------               -------
  Available    True    DeploymentAvailable  2/2 replicas available
  Progressing  False   DeploymentAvailable  Deployment is fully available
  Degraded     False   DeploymentAvailable  Deployment is healthy
```

---

## 9. Access the Hello World Application

### Option A: Port-Forward (All Platforms)

```bash
kubectl port-forward svc/helloworld-sample-service 8080:80
```

Then in a separate terminal:

```bash
curl http://localhost:8080
```

Expected output:

```
Hello from the hello-operator!
```

### Option B: LoadBalancer Service (Cloud Platforms)

Edit the sample resource to use `serviceType: LoadBalancer`:

```bash
kubectl patch helloworld helloworld-sample \
  --type=merge \
  -p '{"spec":{"serviceType":"LoadBalancer"}}'
```

Wait for the external IP to be assigned:

```bash
kubectl get svc helloworld-sample-service --watch
```

Once `EXTERNAL-IP` is populated:

```bash
EXTERNAL_IP=$(kubectl get svc helloworld-sample-service \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://${EXTERNAL_IP}
```

### Option C: NodePort (Bare Metal / On-Premises)

```bash
kubectl patch helloworld helloworld-sample \
  --type=merge \
  -p '{"spec":{"serviceType":"NodePort"}}'

NODE_PORT=$(kubectl get svc helloworld-sample-service \
  -o jsonpath='{.spec.ports[0].nodePort}')

NODE_IP=$(kubectl get nodes \
  -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

curl http://${NODE_IP}:${NODE_PORT}
```

### OpenShift / ROKS: Expose via Route

```bash
oc expose svc helloworld-sample-service
oc get route helloworld-sample-service
```

---

## 10. Update the Custom Resource

The operator watches for changes to `HelloWorld` resources and reconciles automatically.

### 10.1 Scale Up the Replicas

```bash
kubectl patch helloworld helloworld-sample \
  --type=merge \
  -p '{"spec":{"replicas":3}}'
```

Observe the reconciliation:

```bash
kubectl get pods -l app.kubernetes.io/managed-by=hello-operator --watch
```

Expected: a third pod starts within a few seconds.

### 10.2 Change the Message

```bash
kubectl patch helloworld helloworld-sample \
  --type=merge \
  -p '{"spec":{"message":"Updated message!"}}'
```

Trigger a port-forward and verify:

```bash
kubectl port-forward svc/helloworld-sample-service 8080:80 &
curl http://localhost:8080
# Output: Updated message!
```

### 10.3 Edit the Resource Directly

```bash
kubectl edit helloworld helloworld-sample
```

Modify any field under `spec:`, save, and the operator reconciles within seconds.

### 10.4 Observe the Reconciliation Loop

```bash
kubectl -n hello-operator-system logs -l control-plane=controller-manager --follow
```

You will see log lines like:

```
{"level":"info","logger":"controller.helloworld","msg":"Updating Deployment","name":"helloworld-sample-deployment"}
{"level":"info","logger":"controller.helloworld","msg":"Updating Service","name":"helloworld-sample-service"}
```

---

## 11. Cleanup

### 11.1 Delete the Sample Custom Resource

```bash
kubectl delete -f config/samples/apps_v1alpha1_helloworld.yaml
```

Because owner references are set, the Deployment and Service are automatically garbage-collected.

Verify:

```bash
kubectl get pods -l app.kubernetes.io/managed-by=hello-operator
# Expected: No resources found.
kubectl get svc -l app.kubernetes.io/managed-by=hello-operator
# Expected: No resources found.
```

### 11.2 Remove the Operator

```bash
make undeploy
```

This deletes the operator Deployment, RBAC resources, and the `hello-operator-system` namespace.

### 11.3 Remove the CRD

```bash
make uninstall
```

Or manually:

```bash
kubectl delete crd helloworlds.apps.example.com
```

> **Warning:** Deleting the CRD removes all `HelloWorld` custom resources cluster-wide. Ensure you have deleted all instances first if you want to preserve anything.

---

## 12. Troubleshooting

### General Debugging Commands

```bash
# Operator pod status
kubectl -n hello-operator-system get pods

# Operator logs (last 100 lines)
kubectl -n hello-operator-system logs -l control-plane=controller-manager --tail=100

# Full status of a HelloWorld resource
kubectl describe helloworld helloworld-sample

# Kubernetes events in default namespace
kubectl get events --sort-by='.lastTimestamp'

# Kubernetes events in operator namespace
kubectl -n hello-operator-system get events --sort-by='.lastTimestamp'
```

---

### Error: `no matches for kind "HelloWorld" in version "apps.example.com/v1alpha1"`

**Cause:** The CRD has not been installed.

**Fix:**

```bash
make install
# or:
kubectl apply -f config/crd/bases/apps.example.com_helloworlds.yaml
```

---

### Error: `ImagePullBackOff` on the operator pod

**Cause:** The operator image cannot be pulled from the registry.

**Fix:**

1. Verify the image name: `kubectl -n hello-operator-system describe pod <pod-name>`
2. Confirm the image is pushed: `docker manifest inspect $IMG`
3. If the registry is private, create an image pull secret:

```bash
kubectl -n hello-operator-system create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<password>

kubectl -n hello-operator-system patch serviceaccount hello-operator-controller-manager \
  -p '{"imagePullSecrets": [{"name": "regcred"}]}'
```

---

### Error: `forbidden: User ... cannot create resource "deployments"` 

**Cause:** The RBAC resources were not applied correctly.

**Fix:**

```bash
kubectl apply -f config/rbac/role.yaml
kubectl apply -f config/rbac/role_binding.yaml
```

Verify:

```bash
kubectl auth can-i create deployments \
  --as=system:serviceaccount:hello-operator-system:hello-operator-controller-manager
```

---

### Operator pod is in `CrashLoopBackOff`

**Cause:** The manager binary exited with an error (e.g., cannot connect to the API server, missing RBAC).

**Fix:**

```bash
kubectl -n hello-operator-system logs <pod-name> --previous
```

Common causes:
- `unable to start manager: ... no configuration has been provided` — no kubeconfig and not running in-cluster. Run `make run` for out-of-cluster development.
- `failed to get API group resources` — API server unreachable. Check `kubectl cluster-info`.

---

### IKS-Specific: `RBAC: access denied` when creating CRD

**Cause:** The IBM Cloud IAM role is not mapped to `cluster-admin`.

**Fix:** Ensure your IAM user has the **Manager** service access role for the IKS cluster:

```bash
ibmcloud ks cluster config --cluster <cluster-name>
kubectl create clusterrolebinding my-admin \
  --clusterrole=cluster-admin \
  --user=$(ibmcloud iam oauth-tokens --output json | jq -r '.iam_token' | cut -d' ' -f2 | \
  python3 -c "import sys,base64,json; t=sys.stdin.read().strip(); \
  print(json.loads(base64.b64decode(t.split('.')[1]+'=='))['sub'])")
```

---

### ROKS / OpenShift-Specific: Pods stuck in `CreateContainerConfigError`

**Cause:** The `hashicorp/http-echo` image runs as root, which is blocked by the default OpenShift `restricted` SCC.

**Fix:**

```bash
# Grant anyuid SCC to the default ServiceAccount in the target namespace
oc adm policy add-scc-to-serviceaccount anyuid -n default -z default
```

Alternatively, set `runAsUser: 1000` in the container's `securityContext` in the Deployment.

---

### EKS-Specific: `exec plugin: invalid apiVersion`

**Cause:** A mismatch between the AWS CLI version and the `aws-iam-authenticator` / `kubectl` token plugin version.

**Fix:**

```bash
# Update aws-cli
pip install --upgrade awscli

# Update kubeconfig
aws eks update-kubeconfig --region <region> --name <cluster-name>
```

---

### GKE-Specific: `Forbidden` when applying CRD

**Cause:** The kubectl context user does not have `cluster-admin`.

**Fix:**

```bash
kubectl create clusterrolebinding cluster-admin-binding \
  --clusterrole=cluster-admin \
  --user=$(gcloud config get-value core/account)
```

---

### AKS-Specific: `no matches for kind "Kustomization"`

**Cause:** An old version of kubectl / kustomize is being used that does not support `apiVersion: kustomize.config.k8s.io/v1beta1`.

**Fix:**

```bash
# Update kubectl
az aks install-cli

# Use the bundled kustomize from the Makefile
make kustomize
./bin/kustomize build config/default | kubectl apply -f -
```

---

### Metrics Endpoint Returns `connection refused`

**Cause:** The operator pod may not be exposing port 8080 (metrics) because of a network policy.

**Fix:** Port-forward to the metrics endpoint for local inspection:

```bash
kubectl -n hello-operator-system port-forward \
  $(kubectl -n hello-operator-system get pod -l control-plane=controller-manager -o name) \
  8080:8080

curl http://localhost:8080/metrics
```

---

*For further help, open an issue at https://github.com/example/hello-operator/issues.*
