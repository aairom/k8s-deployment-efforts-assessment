# IBM Cloud Kubernetes Service (IKS) vs. Red Hat OpenShift on IBM Cloud (ROKS)
## Comprehensive Enterprise Comparative Analysis

> **Document Classification:** Technical Architecture Reference  
> **Scope:** IBM Cloud Managed Container Platforms — IKS & ROKS  
> **Audience:** Cloud Architects, Platform Engineers, Infrastructure Decision-Makers  
> **Last Updated:** 2025

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architectural Deep-Dive & Control Plane Mechanics](#2-architectural-deep-dive--control-plane-mechanics)
3. [Deployment Typologies & Infrastructure Integrations](#3-deployment-typologies--infrastructure-integrations)
4. [Shared Foundations (Common Points)](#4-shared-foundations-common-points)
5. [Key Distinctions & Operational Differences](#5-key-distinctions--operational-differences)
6. [Comprehensive Technical Comparison Matrix](#6-comprehensive-technical-comparison-matrix)
7. [Architectural Decision Guide](#7-architectural-decision-guide)

---

## 1. Executive Summary

IBM Cloud offers two premier managed container platforms designed to meet the divergent needs of modern enterprise workloads. Both services are underpinned by IBM's proven global cloud infrastructure, benefit from a fully managed control plane, and integrate natively with the broader IBM Cloud service ecosystem. Despite sharing foundational infrastructure, they represent philosophically distinct approaches to container orchestration at enterprise scale.

### IBM Cloud Kubernetes Service (IKS)

IKS delivers **vanilla, upstream-aligned Kubernetes** as a fully managed service. It targets organizations seeking maximum conformance with the Cloud Native Computing Foundation (CNCF) ecosystem, cost-optimized workloads, and teams operating with deep Kubernetes expertise who prefer composing their own toolchain from best-of-breed open-source components. IKS supports the latest Kubernetes distributions and provides the lowest cost-per-node entry point into IBM Cloud's managed container portfolio.

**Core Value Proposition:** Maximum Kubernetes conformance, lowest TCO for pure container workloads, and the broadest compatibility with CNCF-ecosystem tooling.

### Red Hat OpenShift on IBM Cloud (ROKS)

ROKS delivers **Red Hat OpenShift Container Platform (OCP)** as a fully managed service. It targets organizations standardizing on OpenShift across hybrid cloud environments, those operating under strict enterprise security and compliance mandates, teams requiring an integrated developer platform (not just an orchestrator), and organizations deploying IBM Cloud Paks. ROKS bundles the Red Hat OpenShift license into worker node pricing, delivering a commercially supported, opinionated platform with an accelerated path to production.

**Core Value Proposition:** Enterprise-grade security defaults, an integrated developer platform, seamless IBM Cloud Pak deployment, and consistent operational experience across hybrid and multi-cloud environments.

---

## 2. Architectural Deep-Dive & Control Plane Mechanics

### 2.1 Control Plane Management

Both IKS and ROKS operate under a **fully managed control plane model**. IBM provisions, operates, monitors, and patches the Kubernetes/OpenShift master components on behalf of the customer. This removes the operational burden of managing etcd, the API server, the controller manager, and the scheduler.

| Aspect | IKS | ROKS |
|---|---|---|
| Master ownership | IBM-managed, dedicated per cluster | IBM-managed, dedicated per cluster |
| HA replicas | 3 master replicas (multi-zone aware) | 3 master replicas spread across zones |
| etcd | Managed and backed up by IBM | Managed and backed up by IBM |
| Master patching | Automatic patch updates by IBM | Automatic patch updates by IBM |
| Customer SSH access | Not available (hardened posture) | Not available (hardened posture) |
| Control plane SLA | Covered under IBM Cloud SLA | Covered under IBM Cloud SLA |

In **multi-zone clusters**, both platforms distribute master replicas across three availability zones within a region, with a highly available load balancer fronting the master domain. This architecture tolerates the loss of a full availability zone without control-plane disruption.

### 2.2 Worker Node Operating Systems

Worker node OS selection is a significant architectural differentiator between the platforms.

**IKS Worker Node OS:**
IKS worker nodes run on **Ubuntu 20.04/22.04 LTS** (for standard virtual and bare metal nodes) or **Red Hat Enterprise Linux (RHEL) 8** depending on the cluster version and flavor selected. The OS is managed by IBM SREs and patched via full node re-imaging through `ibmcloud ks worker update`. The Linux kernel underpins all worker nodes, and containers based on any Linux distribution are supported. AES-256 LUKS encryption is applied to the container filesystem partition of every worker node by default. Direct SSH access to worker nodes is disabled to enforce a hardened security posture.

**ROKS Worker Node OS:**
ROKS worker nodes run on **Red Hat Enterprise Linux CoreOS (RHCOS)** for OpenShift 4.x clusters (the current generation), with RHEL also available for certain worker pool configurations. RHCOS is an immutable, container-optimized OS engineered specifically for OpenShift: it is declaratively managed via Ignition configuration, uses `rpm-ostree` for atomic image-based OS updates, and enforces read-only system partitions. The use of RHCOS aligns the managed cloud offering with on-premises and Satellite-based OpenShift deployments, creating a consistent OS surface across all topologies. CRI-O is the mandated container runtime on RHCOS worker nodes, replacing Docker/containerd as the interface between the Kubernetes kubelet and the container.

### 2.3 Internal System Components

#### IKS System Components

- **API Server:** Standard Kubernetes API server, IBM-managed.
- **Ingress Controller:** IBM-provided Application Load Balancer (ALB) based on the NGINX Ingress Controller. One ALB per zone in multi-zone clusters. Supports `Ingress` resources natively.
- **Container Registry:** No built-in in-cluster registry. IBM Cloud Container Registry (ICR) serves as the external, highly available registry tightly integrated via pull secrets. ICR supports Vulnerability Advisor for image scanning.
- **Authentication/RBAC:** IBM Cloud IAM integration via `ibmcloud ks cluster config`. IAM service access roles automatically synchronize to Kubernetes RBAC ClusterRole bindings for `Manager`, `Writer`, and `Reader` access levels.
- **Networking Plugin:** Calico CNI plugin for network policy enforcement and pod-level isolation.
- **Konnectivity:** IBM-specific tunneling agent providing encrypted TLS communication between the IBM-managed master and customer worker nodes.
- **Container Runtime:** `containerd` (replaces the Docker daemon in modern Kubernetes versions).

#### ROKS System Components

- **API Server:** OpenShift-extended Kubernetes API server (includes OpenShift-specific CRDs and admission plugins), IBM-managed.
- **OAuth Server:** Automatically configured to delegate authentication to IBM Cloud IAM. Custom identity providers are not configurable; IAM is the canonical identity source.
- **Router (Ingress):** HAProxy-based OpenShift Router deployed as an Operator-managed component. One router per zone in multi-zone clusters. Handles `Route` resources natively, with additional support for `Ingress` resources translated to `Route` objects.
- **Internal Image Registry:** Built-in OpenShift internal registry backed by **IBM Cloud Object Storage (COS)** — a mandatory dependency. Supports `ImageStream` resources for image abstraction and triggering automated rebuild pipelines.
- **OperatorHub:** Pre-configured catalog of certified Red Hat, community, and ISV operators installable via the Operator Lifecycle Manager (OLM).
- **Web Console:** Full OpenShift Web Console with Developer and Administrator perspectives, pre-deployed and managed by IBM.
- **Container Runtime:** `CRI-O` — the lightweight, OCI-compliant runtime mandated by OpenShift.
- **Admission Controllers:** Extended set including `SecurityContextConstraint`, `SCCExecRestrictions`, `BuildByStrategy`, `OriginPodNodeEnvironment`, and OpenShift-specific policy controllers in addition to standard Kubernetes admission webhooks.

---

## 3. Deployment Typologies & Infrastructure Integrations

### 3.1 Classic vs. VPC Infrastructure

Both platforms support deployment on **IBM Cloud Classic Infrastructure** and **IBM Cloud Virtual Private Cloud (VPC)** infrastructure. The choice of underlay significantly affects networking architecture, worker node lifecycle management, and billing transparency.

**Classic Infrastructure:**
- Worker nodes are provisioned into your IBM Cloud infrastructure account directly.
- Networking is VLAN-based; Virtual Router Function (VRF) or VLAN spanning required for multi-zone routing.
- A dedicated Multi-Zone Load Balancer (MZLB) is automatically provisioned for multi-zone clusters.
- Portable public subnets (8 IPs) are auto-ordered and billed monthly.
- `IKS-only:` Classic infrastructure supports private-network-only cluster configurations — worker nodes can be provisioned with no public VLAN, serving air-gapped or strict compliance environments.
- Infrastructure costs are visible separately in your IBM Cloud infrastructure invoice.

**VPC Infrastructure (Recommended for new deployments):**
- Worker nodes are provisioned into IBM-owned infrastructure accounts; not visible in your VPC dashboard but billed through the IKS/ROKS service.
- Networking is VPC subnet-based with security groups governing all inter-node and load balancer traffic.
- **Secure-by-Default VPC Networking** (IKS 1.30+ / ROKS 4.15+): Four security groups are auto-created: `kube-<clusterID>` (worker SG), master VPE gateway SG, shared VPE gateway SG, and LBaaS SG. All public egress is blocked by default; explicit `--disable-outbound-traffic-protection` flag required to open unrestricted egress.
- VPC Load Balancers replace Classic MLBs; multi-zone aware and billed via VPC pricing.
- Virtual Private Endpoints (VPEs) are automatically created for IBM Container Registry, COS, VPC API, and the cluster master — eliminating public internet traversal for IBM service calls.
- Regional pricing uplifts apply to VPC worker nodes; sustained usage discounts available.

### 3.2 Single-Zone vs. Multi-Zone Cluster Topologies

**Single-Zone Cluster (SZC):**
All worker nodes and the control plane replicas reside within a single availability zone. Suitable for development, test, and non-production workloads. The master still runs three replicas within the zone for process-level HA, but a zone failure causes full cluster unavailability.

**Multi-Zone Cluster (MZC):**
Worker nodes are distributed across 2–3 availability zones within an MZR (Multi-Zone Region). Master replicas are spread one-per-zone. Worker pools must have a minimum of one worker node per zone. This topology is the production standard for all business-critical workloads.

- **IKS MZC:** Ingress ALBs are deployed one-per-zone. A single Kubernetes `LoadBalancer` service generates zone-specific VPC LBs or a cross-zone MZLB (Classic).
- **ROKS MZC:** Router services are deployed one-per-zone. VPC LBs front the router services. The internal registry COS bucket is a regional resource, inheriting COS's 11-nines durability guarantees.

### 3.3 Hybrid and Multi-Cloud: IBM Cloud Satellite

Both IKS and ROKS can be extended to customer-managed infrastructure via **IBM Cloud Satellite**. Satellite allows organizations to deploy IBM-managed control planes onto hardware located in customer data centers, co-location facilities, edge locations, or third-party cloud providers (AWS, Azure, GCP).

**Satellite Architecture:**
- Customer provisions Satellite "Location" with 3+ control plane hosts and N worker hosts.
- IBM manages the Satellite location control plane and the attached IKS/ROKS cluster master.
- Worker nodes run on customer-owned hardware; customer is responsible for host OS and hardware maintenance.
- Cluster management API, IAM integration, and IBM Cloud tooling remain consistent with native IBM Cloud deployments.

**IKS on Satellite:** Deploys standard Kubernetes clusters to customer-managed infrastructure. Suitable for workloads requiring data residency or consistent K8s tooling at the edge.

**ROKS on Satellite:** Deploys OpenShift clusters on customer-managed infrastructure. This is the primary vehicle for organizations standardizing on OpenShift across hybrid deployments. IBM Cloud Paks can be deployed on Satellite-attached ROKS clusters. **Pricing Note:** Satellite ROKS clusters (post November 2022) are billed as a flat monthly cluster management fee + per-vCPU worker node management fee + per-vCPU OCP licensing fee. Bring-Your-Own (BYO) OCP license via existing Red Hat subscriptions is supported on Satellite.

---

## 4. Shared Foundations (Common Points)

Despite their differences, IKS and ROKS share a deep, unified foundation within IBM Cloud.

### 4.1 IBM Cloud Service Integration

Both platforms natively integrate with the following IBM Cloud platform services:

| IBM Cloud Service | IKS Integration | ROKS Integration |
|---|---|---|
| **IBM Cloud IAM** | IAM service roles → K8s RBAC sync | IAM → OAuth Server → K8s RBAC sync |
| **IBM Key Protect** | KMS provider for etcd secret encryption | KMS provider for etcd secret encryption |
| **Hyper Protect Crypto Services (HPCS)** | FIPS 140-2 Level 4 HSM-backed KMS for secrets | Route TLS termination with HPCS; secret encryption |
| **IBM Cloud Activity Tracker** | API and cluster activity auditing (Kubernetes audit logs) | API and cluster activity auditing |
| **IBM Log Analysis (Cloud Logs)** | Worker node and application log forwarding | Worker node and application log forwarding |
| **IBM Cloud Monitoring** | Prometheus-based metrics via IBM Cloud Monitoring agent | Prometheus-based metrics; OpenShift monitoring stack |
| **IBM Cloud Container Registry** | Pull secrets, Vulnerability Advisor, image signing | Pull secrets, image streams proxy to ICR |
| **IBM Cloud Continuous Delivery** | Tekton pipelines, DevOps Toolchains | Tekton pipelines, DevOps Toolchains (+ native OpenShift Pipelines) |
| **Context-Based Restrictions (CBR)** | Network zone-scoped API access control | Network zone-scoped API access control |

### 4.2 Common Storage Layers

Both platforms support the same IBM Cloud persistent storage integrations:

- **IBM Cloud Block Storage (VPC/Classic):** CSI drivers and storage classes for RWO (ReadWriteOnce) block volumes. Supports encryption with Key Protect and HPCS.
- **IBM Cloud File Storage (Classic) / VPC File Storage:** NFS-backed storage classes for RWX (ReadWriteMany) workloads.
- **IBM Cloud Object Storage (COS):** S3-compatible object storage accessible via the IBM COS CSI driver. *ROKS additionally requires a COS instance for the internal image registry.*
- **Portworx Enterprise:** Software-defined storage layer available on both platforms, supporting multi-zone persistent data replication, encryption, and stateful workload HA. Portworx is deployed as an operator/DaemonSet on worker nodes and manages storage pools across the cluster.
- **OpenShift Data Foundation (ODF) / Red Hat Ceph:** Available on ROKS as a certified operator via OperatorHub, providing software-defined storage including block, file, and object interfaces within the cluster.

### 4.3 Network Isolation

Both platforms employ the same underlying network isolation primitives:

- **Calico CNI:** Both platforms use Project Calico as the Container Network Interface plugin for pod networking. Calico supports Kubernetes `NetworkPolicy` objects for L3/L4 micro-segmentation.
- **Private Service Endpoints:** Cluster masters can be configured with private-only or dual (public + private) cloud service endpoints. Private-only configurations route all control plane communication over the IBM Cloud private backbone, eliminating public internet exposure of the Kubernetes/OpenShift API server.
- **Public Service Endpoints:** Optional public API server endpoint for developer and operator convenience; can be disabled for hardened environments.
- **VPC Security Groups (VPC clusters):** Security groups enforce ingress/egress rules at the worker node NIC, load balancer, and VPE gateway layers — providing defense-in-depth network segmentation independent of application-level policies.

---

## 5. Key Distinctions & Operational Differences

### 5.1 Developer & Operator Experience

#### IKS: Kubernetes-Native Toolchain

IKS provides a standard Kubernetes operational surface with no proprietary CLI extensions beyond IBM Cloud cluster management commands:

- **CLI:** `kubectl` (standard upstream Kubernetes CLI) + `ibmcloud ks` plugin for cluster lifecycle operations (provisioning, node updates, networking, storage configuration).
- **UI:** IBM Cloud Console provides cluster dashboard, node monitoring, and `kubectl` configuration download. Standard Kubernetes Dashboard is deployable but not pre-installed.
- **Package Management:** Helm 3 is the de facto standard for deploying complex applications on IKS. No built-in operator framework; operators must be installed manually via `kubectl apply` or Helm.
- **Developer Self-Service:** No built-in developer portal. Teams typically integrate with external CI/CD tools (GitHub Actions, Jenkins, Tekton via IBM Cloud Continuous Delivery).

#### ROKS: Integrated Developer Platform

ROKS delivers a significantly richer operator and developer experience surface:

- **CLI:** `oc` (OpenShift CLI — a superset of `kubectl`) + `kubectl` (both are supported) + `ibmcloud oc` plugin for cluster lifecycle operations. `oc` provides additional commands for OpenShift-specific resources: `oc new-project`, `oc new-app`, `oc rollout`, `oc policy`, `oc adm`, and more.
- **Web Console:** Full OpenShift Web Console with two role-based perspectives:
  - **Developer Perspective:** Topology view, guided application deployment from Git or container images, integrated log streaming, S2I build initiation, and Tekton pipeline visualization.
  - **Administrator Perspective:** Full cluster administration, operator management, monitoring dashboards, security policy enforcement, and resource quota management.
- **Operator Lifecycle Manager (OLM):** Built-in framework for discovering, installing, and managing the lifecycle of Kubernetes operators from the integrated OperatorHub. Includes Red Hat-certified, community, and Marketplace operator catalogs.
- **OperatorHub:** Pre-configured marketplace of hundreds of operators covering databases (PostgreSQL, MongoDB, Redis), messaging (Apache Kafka, RabbitMQ), service mesh, AI/ML frameworks, and IBM Cloud Paks.

### 5.2 Security Posture & Isolation

#### IKS: Kubernetes Pod Security Standards (PSS)

IKS enforces security using the upstream Kubernetes security model:

- **Pod Security Admission (PSA):** Modern Kubernetes clusters on IKS enforce Pod Security Standards at the namespace level (`privileged`, `baseline`, `restricted` modes). The `restricted` profile enforces non-root execution, read-only root filesystems, and capability dropping.
- **RBAC:** Standard Kubernetes RBAC with IAM-to-ClusterRole synchronization.
- **Network Policies:** Calico NetworkPolicy objects; not enforced by default — administrators must explicitly define ingress/egress rules.
- **Node Hardening:** CIS Benchmark-aligned OS configuration. LUKS AES-256 encryption on worker node container partitions. SSH disabled.

#### ROKS: Security Context Constraints (SCC) — Stricter by Default

ROKS enforces a more opinionated security posture through OpenShift's Security Context Constraints framework, which predates and extends the capabilities of Kubernetes PSS:

- **Security Context Constraints (SCC):** SCCs are OpenShift-specific admission policies enforced by the `SecurityContextConstraint` admission controller (loaded in the master admission chain). SCCs control: UID/GID ranges, volume types permitted, host network/PID/IPC access, Linux capabilities, AppArmor/SELinux profiles, and container privilege escalation. ROKS ships with 8 built-in SCCs:
  - `restricted` — Default; disallows privilege escalation, enforces non-root UID, drops all capabilities.
  - `nonroot` — Allows any non-root UID.
  - `anyuid` — Allows any UID including root (requires explicit grant).
  - `hostnetwork` — Allows host network namespace.
  - `privileged` — Full host access (only for infrastructure-level system pods).
  - `node-exporter`, `hostmount-anyuid`, `hostaccess` — Specialized SCCs for monitoring agents and storage drivers.
- **Implication:** Many containerized applications built for vanilla Kubernetes require SCC adjustments when migrated to ROKS, as images that run as root or use arbitrary UIDs will be rejected by the `restricted` SCC by default.
- **SELinux:** RHCOS enables SELinux in enforcing mode on worker nodes, providing mandatory access control at the OS layer — an additional security boundary not present on Ubuntu-based IKS nodes.
- **Dedicated Masters:** On VPC clusters, ROKS master components are dedicated per cluster (not shared with other IBM customers), providing stronger multi-tenant isolation at the control plane level.

### 5.3 Build & CI/CD Pipelines

#### IKS: Composable CI/CD

IKS does not include an opinionated build or CI/CD system. Recommended approaches:

- **IBM Cloud Continuous Delivery:** Managed DevOps toolchains with Tekton pipeline support, integrated with IBM Cloud tooling, secrets management (Secrets Manager), and Code Risk Analyzer.
- **ArgoCD / Flux:** GitOps operators deployable via Helm for declarative, repository-driven deployment reconciliation.
- **GitHub Actions / GitLab CI / Jenkins:** External CI tools connecting to the cluster via `kubectl` and Helm, using IBM Cloud Container Registry for image storage.
- **Tekton Pipelines:** Deployable as a standalone operator on IKS for Kubernetes-native CI/CD pipeline execution.

#### ROKS: Integrated Build & Pipeline Platform

ROKS ships with a native, fully integrated build and CI/CD subsystem:

- **OpenShift Builds:** `BuildConfig` resources define automated image build pipelines triggered by source code commits, image tag changes, or webhook events. Builds run as isolated pods within the cluster.
- **Source-to-Image (S2I):** Builder images allow developers to push source code (Java, Node.js, Python, Ruby, Go, etc.) and receive a runnable container image without writing a Dockerfile. S2I enforces security-hardened base images and consistent build environments across the organization.
- **OpenShift Pipelines (Tekton):** Kubernetes-native CI/CD pipeline system pre-installed as an operator on ROKS. Provides `Pipeline`, `Task`, `PipelineRun`, and `TaskRun` CRDs; integrates with the OpenShift Web Console for visual pipeline management and log streaming.
- **ImageStreams:** Abstraction layer over container images that enables automatic triggering of redeployments or rebuilds when an upstream image is updated (e.g., base OS security patch). Provides image promotion workflows between environments without requiring registry credential management at the deployment level.
- **IBM Cloud Paks:** Enterprise software bundles (Cloud Pak for Data, Cloud Pak for Integration, Cloud Pak for AIOps, Cloud Pak for Security, Cloud Pak for Business Automation) exclusively require OpenShift and can only be deployed on ROKS clusters. Cloud Paks leverage OLM, SCCs, and OpenShift platform APIs extensively.

### 5.4 Licensing, Support & Cost Matrix

#### IKS Pricing Model

IKS follows a **pure resource consumption model**:

- Worker node costs are based on the vCPU, memory, and storage of the selected flavor (shared VMs, dedicated hosts, or bare metal).
- No platform license fee — only infrastructure costs.
- Master node management is included at no additional charge.
- **Classic reservations:** 1-year or 3-year reserved pricing contracts available for Classic worker nodes, offering 30–50% savings vs. on-demand rates.
- Lowest entry cost in the IBM Cloud container portfolio.

#### ROKS Pricing Model

ROKS bundles the **Red Hat OpenShift Container Platform (OCP) license** into worker node pricing:

- Worker node costs include the underlying compute infrastructure plus an OCP license fee.
- **New OCP license model:** One Red Hat license per 2 virtual cores (or 1 physical core). Billed hourly for the lifecycle of the worker node.
- **Legacy OCP license model:** One license per 4 virtual cores (or 2 physical cores), billed monthly per deployed worker node.
- OCP license costs are reflected as a sub-item or separate line item on the IBM Cloud invoice depending on the billing model.
- **Bring Your Own License (BYOL):** Organizations with existing IBM Cloud Pak entitlements or Red Hat OpenShift subscriptions can apply those entitlements to ROKS worker nodes, eliminating the OCP license surcharge and reducing total cost.
- **Net effective premium:** ROKS worker nodes are typically **~25–30% more expensive** than equivalent IKS worker nodes due to the bundled OCP license. This premium is offset by eliminating the need for a separate Red Hat OpenShift subscription and by the included platform capabilities (OperatorHub, Web Console, S2I, Pipelines).
- On Satellite, ROKS adds a flat monthly cluster management fee plus per-vCPU fees for worker node management and OCP licensing.

---

## 6. Comprehensive Technical Comparison Matrix

| Feature / Attribute | IBM Cloud Kubernetes Service (IKS) | Red Hat OpenShift on IBM Cloud (ROKS) |
|---|---|---|
| **Upstream Distribution** | CNCF-certified community Kubernetes (latest upstream) | Red Hat OpenShift Container Platform 4.x (OCP) |
| **Kubernetes Version Currency** | Latest Kubernetes minor release available | OCP version cadence (may trail upstream K8s minor versions) |
| **Control Plane Management** | Fully managed by IBM; dedicated per cluster | Fully managed by IBM; dedicated per cluster |
| **Master HA Configuration** | 3 replicas; multi-zone aware | 3 replicas; spread across zones |
| **Worker Node OS** | Ubuntu 20.04/22.04 LTS or RHEL 8 | Red Hat Enterprise Linux CoreOS (RHCOS); RHEL available |
| **Container Runtime** | `containerd` | `CRI-O` |
| **Default Container Registry** | IBM Cloud Container Registry (ICR) — external | OpenShift Internal Registry (backed by IBM COS) + ICR |
| **OCI Image Registry Dependency** | IBM Cloud Container Registry (optional) | IBM Cloud Object Storage (mandatory for internal registry) |
| **Image Management** | Standard OCI image references | ImageStreams + ImageStreamTags (+ OCI references) |
| **Authentication / IdP** | IBM Cloud IAM → Kubernetes RBAC | IBM Cloud IAM → OpenShift OAuth Server → Kubernetes RBAC |
| **Multi-tenancy Model** | Namespaces + RBAC + NetworkPolicy | Projects (Namespaces) + RBAC + SCC + NetworkPolicy |
| **Security Default Posture** | Pod Security Standards (PSA) — Baseline/Restricted | Security Context Constraints (SCC) — Restricted by default; SELinux enforcing on RHCOS |
| **Admission Controllers** | Standard Kubernetes admission chain | Extended admission chain including SCC, BuildByStrategy, OpenShift-specific webhooks |
| **CLI Tools** | `kubectl` + `ibmcloud ks` | `oc` (kubectl superset) + `kubectl` + `ibmcloud oc` |
| **Web Console / UI** | IBM Cloud Console (cluster infra); K8s Dashboard (manual deploy) | OpenShift Web Console (Developer + Admin perspectives) — pre-installed |
| **Ingress / Traffic Routing** | IBM NGINX-based ALB (`Ingress` resources) | HAProxy-based OpenShift Router (`Route` + `Ingress` resources) |
| **Operator Framework** | Manual operator deployment (kubectl/Helm) | Operator Lifecycle Manager (OLM) + OperatorHub — pre-installed |
| **Build System** | No built-in; external CI/CD required | OpenShift Builds + Source-to-Image (S2I) — built-in |
| **CI/CD Pipelines** | External tools; IBM CD Toolchains; Tekton (manual) | OpenShift Pipelines (Tekton) — pre-installed operator |
| **Service Mesh** | Manual Istio/Linkerd deployment | OpenShift Service Mesh (Istio-based) via OperatorHub |
| **Monitoring Stack** | IBM Cloud Monitoring agent (external); manual Prometheus/Grafana | OpenShift Monitoring (Prometheus + Grafana) — built-in; user workload monitoring available |
| **Logging** | IBM Log Analysis agent; Fluentd DaemonSet | IBM Log Analysis agent; OpenShift Logging (EFK/Loki) via Operator |
| **OS Lifecycle Management** | IBM-managed; node reimaging via `ibmcloud ks worker update` | IBM-managed; RHCOS atomic image updates via MachineConfigOperator |
| **IBM Cloud Paks Support** | Not supported (requires OCP) | Fully supported; Cloud Pak operators available via OperatorHub |
| **Virtualization Support** | Not supported | OpenShift Virtualization (KubeVirt) — available as operator |
| **Minimum Worker Nodes** | 1 worker node per zone | 2 worker nodes per zone (4 vCPU each minimum) |
| **Infrastructure Options** | Classic, VPC, Satellite | Classic, VPC, Satellite |
| **Private-Only Cluster (Classic)** | Supported | Not supported on Classic (requires at least public endpoint) |
| **Pricing Model** | Pure compute cost; no platform license | Compute cost + bundled OCP license (~25–30% premium) |
| **BYOL / Entitlement** | N/A | IBM Cloud Pak entitlement or Red Hat subscription BYOL supported |
| **Satellite Extension** | IKS clusters on customer-managed hosts | ROKS clusters on customer-managed hosts |
| **Hybrid Cloud Consistency** | Kubernetes-standard; varies by distribution | Consistent OpenShift platform across cloud, on-prem, edge |
| **CNCF Conformance** | Certified CNCF-conformant Kubernetes | OCP is CNCF-conformant (includes additional Red Hat APIs) |

---

## 7. Architectural Decision Guide

### Decision Framework

Use the following scenario-based framework to guide platform selection. Both platforms are production-grade; the decision should be driven by organizational context, existing ecosystem investments, and total cost of ownership analysis.

---

### Choose IKS when:

**1. Budget Optimization is Primary**
Your workloads are containerized but do not require the OpenShift developer platform features. The ~25–30% OCP license premium on ROKS worker nodes is not offset by platform capability requirements. Teams are comfortable assembling their own toolchain (Helm, ArgoCD, Prometheus, external registries).

**2. Maximum Upstream Kubernetes Conformance is Required**
Your organization has a strict policy of running latest upstream Kubernetes minor releases. IKS tracks the upstream Kubernetes release cadence more closely than ROKS, which follows the OCP release schedule (typically lagging upstream K8s by one to two minor versions).

**3. Portability Across Cloud Providers**
Your architecture must be portable to GKE, EKS, or AKS with minimal refactoring. IKS workloads using only upstream Kubernetes APIs are directly portable; ROKS workloads using `Route`, SCC, `BuildConfig`, or `ImageStream` resources require adaptation when migrating off OpenShift.

**4. Vanilla Kubernetes Operator Model**
Your team prefers composing the operator ecosystem manually and has existing investments in specific Helm charts or Kubernetes operators that may conflict with OLM or require custom SCC grants on OpenShift.

**5. Private-Network-Only Classic Clusters**
Your compliance requirements mandate zero public internet exposure, including no public worker node networking on Classic infrastructure. IKS supports Classic clusters with workers on private VLANs only; ROKS does not offer this topology on Classic.

**6. Lightweight Edge / Dev/Test Workloads**
You need minimal-overhead clusters for CI pipeline runners, dev/test environments, or edge nodes. IKS supports single-node configurations; ROKS requires a minimum of 2 workers per zone (4 vCPUs each).

---

### Choose ROKS when:

**1. Existing Red Hat / OpenShift Ecosystem**
Your organization operates OpenShift on-premises (OCP) or on other cloud providers. ROKS provides operational consistency across environments: the same `oc` CLI, the same SCCs, the same OperatorHub, and the same OCP API surface. Platform engineers' skills transfer directly; runbooks are portable.

**2. IBM Cloud Paks Deployment**
IBM Cloud Paks (Cloud Pak for Data, Cloud Pak for Integration, Cloud Pak for AIOps, Cloud Pak for Business Automation, Cloud Pak for Security) exclusively require OpenShift. If your use case involves any Cloud Pak, ROKS is the only managed IBM Cloud option.

**3. Strict Enterprise Security & Compliance Mandates**
Your organization operates in a regulated industry (FSI, Healthcare, Government) and requires FIPS-validated operating system components, SELinux enforcing mode, mandatory SCC-based pod admission hardening, and an integrated compliance posture. RHCOS + SCC + OLM provides this out of the box.

**4. Accelerated Application Modernization**
Your development teams need guided tooling for containerizing legacy applications. OpenShift's Source-to-Image (S2I), BuildConfig triggers, ImageStream promotion, and the Developer Perspective in the Web Console dramatically reduce the time-to-production for application teams with limited container expertise.

**5. Integrated Developer Platform**
Your organization wants a single platform that covers: container orchestration + integrated registry + CI/CD pipelines (Tekton) + service catalog (OperatorHub) + developer self-service portal (Web Console) + monitoring (Prometheus/Grafana). ROKS delivers all of these without additional component installation or integration effort.

**6. Hybrid and Multi-Cloud Standardization via Satellite**
Your organization deploys workloads across IBM Cloud, on-premises data centers, and/or other public clouds. ROKS on IBM Cloud Satellite provides a consistent OpenShift control plane and tooling across all environments, with centralized management through IBM Cloud.

**7. Bring-Your-Own OpenShift License (BYOL)**
Your organization has an existing Red Hat OpenShift subscription or IBM Cloud Pak entitlement. Applying that entitlement to ROKS worker nodes eliminates the OCP license surcharge, making the per-node cost comparable to IKS while retaining all OpenShift platform capabilities.

---

### Decision Summary Matrix

| Decision Factor | Favors IKS | Favors ROKS |
|---|---|---|
| **Cost sensitivity (no existing RH license)** | ✅ | — |
| **IBM Cloud Paks required** | — | ✅ |
| **Existing OpenShift on-prem** | — | ✅ |
| **BYOL Red Hat / Cloud Pak license** | — | ✅ |
| **Vanilla Kubernetes conformance** | ✅ | — |
| **Latest Kubernetes version** | ✅ | — |
| **Integrated CI/CD & build system** | — | ✅ |
| **Developer self-service portal** | — | ✅ |
| **SELinux + SCC security hardening** | — | ✅ |
| **FSI / Healthcare / Gov compliance** | — | ✅ |
| **Private-only Classic cluster** | ✅ | — |
| **Minimum node footprint** | ✅ | — |
| **Hybrid consistency via Satellite** | ✅ (K8s) | ✅ (OCP) |
| **OperatorHub / OLM ecosystem** | — | ✅ |
| **Cross-cloud portability** | ✅ | — |
| **S2I / AppModernization tooling** | — | ✅ |

---

*This document is based on IBM Cloud product documentation and represents the state of the IKS and ROKS platforms as of 2025. Refer to [IBM Cloud Kubernetes Service docs](https://cloud.ibm.com/docs/containers) and [Red Hat OpenShift on IBM Cloud docs](https://cloud.ibm.com/docs/openshift) for the latest version-specific information.*
