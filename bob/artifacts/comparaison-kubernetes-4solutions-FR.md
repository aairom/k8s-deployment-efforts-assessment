# Comparaison des Solutions Kubernetes — Analyse Complète 4 Solutions

**IKS · ROKS · Kubernetes Auto-Géré · Amazon EKS**

> **Classification :** Référence Architecture Technique  
> **Périmètre :** Plateformes Kubernetes managées et auto-gérées  
> **Audience :** Architectes Cloud, Ingénieurs Plateformes, Décideurs Infrastructure  
> **Mise à jour :** Septembre 2026

---

## Table des Matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Vue d'ensemble des Solutions](#2-vue-densemble-des-solutions)
3. [Infrastructure & Modèle d'Hébergement](#3-infrastructure--modèle-dhébergement)
4. [Facilité de Déploiement & Provisionnement](#4-facilité-de-déploiement--provisionnement)
5. [Gestion des Versions Kubernetes & Mises à Jour](#5-gestion-des-versions-kubernetes--mises-à-jour)
6. [Sécurité & Conformité](#6-sécurité--conformité)
7. [Réseau & Capacités Ingress](#7-réseau--capacités-ingress)
8. [Options de Stockage](#8-options-de-stockage)
9. [Modèle Tarifaire & Coûts](#9-modèle-tarifaire--coûts)
10. [Intégrations & Écosystème](#10-intégrations--écosystème)
11. [Support & SLA](#11-support--sla)
12. [Charge Opérationnelle & Complexité](#12-charge-opérationnelle--complexité)
13. [Matrice de Comparaison Complète](#13-matrice-de-comparaison-complète)
14. [Recommandations par Profil](#14-recommandations-par-profil)

---

## 1. Résumé Exécutif

Les organisations évaluant une plateforme Kubernetes font face à un éventail de solutions allant des services entièrement managés par un fournisseur cloud jusqu'aux déploiements autogérés sur infrastructure propre. Cette analyse compare les quatre solutions les plus représentatives :

| Solution | Fournisseur | Type |
|---|---|---|
| **IBM Kubernetes Service (IKS)** | IBM Cloud | Kubernetes managé |
| **Red Hat OpenShift on IBM Cloud (ROKS)** | IBM Cloud + Red Hat | OpenShift managé |
| **Kubernetes Auto-Géré** | Infrastructure propre / IaaS non managé | Kubernetes autogéré |
| **Amazon Elastic Kubernetes Service (EKS)** | Amazon Web Services | Kubernetes managé |

Chaque solution présente un équilibre distinct entre contrôle, complexité opérationnelle, coût et richesse fonctionnelle. Le choix optimal dépend du contexte organisationnel : cloud existant, exigences réglementaires, expertise interne et stratégie à long terme.

---

## 2. Vue d'ensemble des Solutions

### 2.1 IBM Kubernetes Service (IKS)

IKS fournit un **Kubernetes vanilla certifié CNCF** en tant que service entièrement managé sur IBM Cloud. IBM prend en charge le plan de contrôle (API server, etcd, scheduler, controller-manager), les correctifs de sécurité des nœuds workers et l'intégration native avec les services IBM Cloud.

**Points clés :**
- Plan de contrôle dédié par cluster, géré par IBM
- Nœuds workers Ubuntu 22.04 LTS ou RHEL 8
- Runtime `containerd`, plugin CNI Calico
- Intégration native IBM Cloud IAM, Key Protect, ICR, Monitoring
- Conformité ISO 27001, SOC 2, PCI DSS, HIPAA
- Point d'entrée au coût le plus bas du portefeuille IBM Cloud

### 2.2 Red Hat OpenShift on IBM Cloud (ROKS)

ROKS fournit **Red Hat OpenShift Container Platform (OCP) 4.x** en tant que service entièrement managé sur IBM Cloud. Il combine la richesse opérationnelle d'OpenShift avec la fiabilité de l'infrastructure IBM Cloud.

**Points clés :**
- Plan de contrôle OpenShift dédié, géré par IBM
- Nœuds workers RHCOS (immutable) avec SELinux enforcing
- Runtime CRI-O, Security Context Constraints (SCC) par défaut
- OperatorHub intégré, OpenShift Pipelines (Tekton), S2I
- Console Web développeur/administrateur pré-installée
- Prérequis obligatoire pour les IBM Cloud Paks
- Conformité FIPS 140-2, FedRAMP, DoD CC SRG

### 2.3 Kubernetes Auto-Géré (Self-Managed)

Le Kubernetes auto-géré désigne tout déploiement où l'organisation installe, configure, opère et maintient Kubernetes sur son propre matériel ou une infrastructure IaaS non managée (bare metal, VMware, OpenStack, cloud IaaS).

**Points clés :**
- Contrôle total sur la version, la configuration, les composants
- Distributions au choix : kubeadm, k3s, RKE2, Talos, Kubespray, Rancher…
- Charge opérationnelle maximale (etcd, PKI, CNI, CSI, Ingress à gérer)
- Flexibilité totale sur la topologie réseau et le stockage
- Aucune dépendance fournisseur (vendor lock-in minimal)
- Adapté aux environnements air-gapped et exigences de souveraineté

### 2.4 Amazon Elastic Kubernetes Service (EKS)

Amazon EKS fournit un **Kubernetes managé certifié CNCF** sur l'infrastructure AWS. AWS gère le plan de contrôle multi-AZ et intègre nativement les services AWS (IAM, VPC, ALB, EBS, ECR).

**Points clés :**
- Plan de contrôle multi-AZ entièrement managé par AWS
- Nœuds EC2 (Managed Node Groups) ou pods serverless (Fargate)
- CNI VPC AWS natif (IPs VPC directement assignées aux pods)
- Intégration native IAM AWS, EBS/EFS/FSx, ECR, ALB
- EKS Anywhere pour déploiement on-premises
- Conformité SOC, PCI, ISO, HIPAA, FedRAMP

---

## 3. Infrastructure & Modèle d'Hébergement

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **Localisation** | Datacenters IBM Cloud (6 continents) | Datacenters IBM Cloud | Infrastructure propre / datacenter / IaaS | Régions AWS (35+) |
| **Type de nœuds** | VMs IBM Cloud, bare metal optionnel | VMs IBM Cloud, bare metal | Bare metal, VMs (VMware, KVM, etc.) | EC2, bare metal, Fargate |
| **Haute disponibilité** | Multi-zone (MZC) dans une région IBM | Multi-zone dans une région IBM | À concevoir et déployer manuellement | Multi-AZ natif |
| **Option on-premises** | Via IBM Cloud Satellite | Via IBM Cloud Satellite | Native (raison d'être principale) | Via EKS Anywhere |
| **Isolation réseau** | VPC IBM Cloud ou Classic Network | VPC IBM Cloud ou Classic Network | Totale (infrastructure propre) | VPC AWS |
| **SLA plan de contrôle** | 99,9 % | 99,9 % | Interne (aucun SLA fournisseur) | 99,95 % |

---

## 4. Facilité de Déploiement & Provisionnement

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **Outils de provisionnement** | `ibmcloud ks`, Terraform, UI IBM Cloud, Schematics | `ibmcloud oc`, Terraform, UI IBM Cloud, Schematics | kubeadm, k3s, RKE2, Kubespray, Ansible/Terraform | `eksctl`, AWS Console, Terraform, CDK, CloudFormation |
| **Délai de déploiement** | ~10–15 min | ~20–30 min | Plusieurs heures à plusieurs jours | ~10–15 min |
| **Auto-scaling nœuds** | Cluster Autoscaler intégré | Cluster Autoscaler + MachineConfig Operator | Manuel ou via Cluster Autoscaler (installation requise) | Managed Node Groups + Karpenter |
| **Infrastructure as Code** | Terraform IBM provider, Schematics | Terraform IBM provider, Schematics, Ansible | Terraform/Ansible librement | Terraform AWS provider, CDK, CloudFormation |
| **Complexité initiale** | Faible | Modérée (OCP plus lourd) | Très élevée | Faible |

---

## 5. Gestion des Versions Kubernetes & Mises à Jour

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **Politique de support** | N-2 versions Kubernetes | Cycle OCP (~6 mois) | Au choix de l'organisation | N-4 versions Kubernetes |
| **Mise à jour plan de contrôle** | Manuelle déclenchée par l'utilisateur (ou auto) | Gérée par IBM via CVO (Cluster Version Operator) | Entièrement manuelle | En 1 clic ou automatique |
| **Mise à jour OS nœuds** | Ré-imagerie complète via `ibmcloud ks worker update` | Mise à jour atomique RHCOS via MachineConfigOperator | Manuelle (yum/apt, Ansible) | Via Managed Node Group (drain automatique) |
| **Correctifs sécurité** | Appliqués par IBM sur le plan de contrôle | Appliqués par IBM sur le plan de contrôle | Sous responsabilité interne | Appliqués par AWS sur le plan de contrôle |
| **Flexibilité version** | Faible (gérée par IBM) | Faible (gérée par IBM) | Totale | Faible (gérée par AWS) |
| **Support versions EOL** | Préavis 6 mois avant retrait | Long Term Support OCP disponible | Illimité (risque de sécurité) | Extended Support payant disponible |

---

## 6. Sécurité & Conformité

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **Gestion des identités** | IBM Cloud IAM → RBAC Kubernetes | IBM Cloud IAM → OAuth OCP → RBAC K8s | RBAC K8s natif (IdP externe à configurer) | IAM AWS + IRSA (IAM Roles for Service Accounts) |
| **Modèle de sécurité pods** | Pod Security Admission (PSA) — PSS Baseline/Restricted | Security Context Constraints (SCC) — plus strict par défaut | PSA / PSP (selon version) — à configurer | Pod Security Admission (PSA) activé par défaut |
| **SELinux** | Non appliqué (Ubuntu) | Mode enforcing sur RHCOS | Selon l'OS choisi | Selon l'OS (Bottlerocket l'active) |
| **Chiffrement secrets** | Key Protect / HPCS (HSM FIPS 140-2 Niv. 4) | Key Protect / HPCS | HashiCorp Vault ou autre (à déployer) | AWS KMS natif |
| **Scan d'images** | IBM Vulnerability Advisor (ICR) | IBM Vulnerability Advisor + Red Hat ACS | Trivy, Clair, Snyk (à déployer) | Amazon Inspector + ECR scan |
| **Politiques réseau** | Calico NetworkPolicy | OVN-K8s NetworkPolicy + SCC | Selon CNI choisi (Calico, Cilium, etc.) | VPC Security Groups + K8s NetworkPolicy |
| **Certifications** | ISO 27001, SOC 2, PCI DSS, HIPAA | FIPS 140-2, FedRAMP, DoD CC SRG, ISO | À construire selon besoins | SOC 1/2/3, PCI DSS, HIPAA, FedRAMP |
| **Audit logs** | IBM Cloud Activity Tracker | IBM Cloud Activity Tracker + OCP Audit | À déployer (Falco, Elastic, etc.) | AWS CloudTrail + EKS audit logs |

---

## 7. Réseau & Capacités Ingress

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **Plugin CNI** | Calico | OVN-Kubernetes (ou SDN OpenShift) | Au choix : Calico, Cilium, Flannel, Weave… | AWS VPC CNI (IPs VPC natives pour les pods) |
| **Contrôleur Ingress** | ALB IBM basé sur NGINX (managé) | Routeur OpenShift HAProxy (managé) | À installer : nginx, Traefik, Kong… | AWS Load Balancer Controller (ALB/NLB natifs) |
| **Load Balancer externe** | IBM Cloud Load Balancer (NLB v1/v2) | IBM Cloud Load Balancer | MetalLB, HAProxy, F5, VIP externe | ALB/NLB AWS natifs |
| **Routes / Ingress** | Ressources `Ingress` Kubernetes | Routes OpenShift + `Ingress` traduit | Ressources `Ingress` Kubernetes | Ressources `Ingress` Kubernetes |
| **Service Mesh** | Istio managé (IBM Cloud Service Mesh) | OpenShift Service Mesh (Istio/Kiali/Jaeger) | Au choix : Istio, Linkerd, Consul… | AWS App Mesh ou Istio |
| **Multi-interface (Multus)** | Non (par défaut) | Oui (Multus CNI supporté) | Oui (si installé) | Limité |
| **BGP / routage avancé** | Oui (Calico) | Limité | Oui (Calico, Cilium) | Limité (VPC CNI) |

---

## 8. Options de Stockage

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **Stockage bloc** | IBM Cloud Block Storage (SSD, 10–4000 IOPS) | IBM Cloud Block Storage | iSCSI, FC, Ceph RBD, Longhorn, OpenEBS… | Amazon EBS (gp3, io2) — SSD haute performance |
| **Stockage fichier (NFS/RWX)** | IBM Cloud File Storage (NFS v4.1) | IBM Cloud File Storage | NFS, CephFS, GlusterFS… | Amazon EFS (NFS managé, multi-AZ) |
| **Stockage objet** | IBM COS (S3-compatible) via S3FS CSI | IBM COS (obligatoire pour le registre interne) | Rook-Ceph, MinIO, S3 externe | Amazon S3 via Mountpoint for S3 (CSI natif) |
| **Stockage haute performance** | Portworx Enterprise | Portworx Enterprise + ODF/OCS | Rook-Ceph, Pure Storage, NetApp, etc. | Amazon FSx (Lustre, NetApp ONTAP, OpenZFS) |
| **StorageClasses pré-configurées** | Oui (IBM Cloud) | Oui (IBM Cloud + ODF) | Non (à créer manuellement) | Oui (AWS CSI driver managé) |
| **Snapshots CSI** | Oui | Oui | Oui (si CSI driver supporte) | Oui (EBS snapshots) |

---

## 9. Modèle Tarifaire & Coûts

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **Coût du plan de contrôle** | Inclus (gratuit) | Inclus (gratuit) | Coût infrastructure (serveurs dédiés) | **0,10 $/h par cluster** |
| **Coût des nœuds workers** | Facturation par VM IBM Cloud | Facturation par VM + licence OCP (~25–30 % de surcoût) | Coût infrastructure propre (CAPEX/OPEX) | Coût des instances EC2 |
| **Licence plateforme** | Aucune | Red Hat OCP incluse (~0,16 $/h/nœud selon profil) | Aucune (K8s open source) | Aucune |
| **Modèle serverless** | Non | Non | Non | Oui — AWS Fargate (facturation pod/vCPU/mémoire) |
| **Remises / réservations** | Commitments IBM Cloud, Reserved Instances Classic | Commitments IBM Cloud, BYOL Red Hat | Selon infrastructure propre | Reserved Instances, Savings Plans AWS |
| **Coût opérationnel** | Faible (plan de contrôle géré) | Faible (plan de contrôle géré) | **Très élevé** (équipes SRE dédiées requises) | Faible (plan de contrôle géré) |
| **TCO global** | ★★★★☆ (bon) | ★★★☆☆ (surcoût OCP) | ★★☆☆☆ (CAPEX + OPEX souvent sous-estimés) | ★★★☆☆ (frais cluster + egress élevés) |

> **Note BYOL :** Les organisations disposant d'un abonnement Red Hat existant ou de droits IBM Cloud Pak peuvent appliquer leur licence ROKS, supprimant le surcoût OCP et rendant ROKS comparable à IKS en termes de coût.

---

## 10. Intégrations & Écosystème

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **Catalogue services cloud** | IBM Cloud Catalog (Watson, Db2, MQ, Event Streams…) | IBM Cloud Catalog + Red Hat Marketplace | Aucune restriction (tout service accessible) | AWS Marketplace (milliers d'applications) |
| **IBM Cloud Paks** | ❌ Non supportés (nécessitent OCP) | ✅ Entièrement supportés | ❌ Non (nécessitent OCP sur IBM Cloud) | ❌ Non |
| **Gestionnaire d'opérateurs** | Manuel (kubectl/Helm) | OLM + OperatorHub intégrés | Manuel ou via Helm | Manuel ou via Helm |
| **CI/CD intégré** | IBM Cloud CD Toolchains, Tekton (externe) | OpenShift Pipelines (Tekton) natif + GitOps (ArgoCD) | ArgoCD, Flux, Jenkins, GitHub Actions (à installer) | AWS CodePipeline, CodeBuild + intégration native ECR |
| **Service Mesh** | Istio (installation manuelle) | OpenShift Service Mesh (opérateur intégré) | Istio, Linkerd, Consul (à installer) | AWS App Mesh, Istio |
| **Monitoring** | IBM Cloud Monitoring (Sysdig), Prometheus (externe) | OpenShift Monitoring (Prometheus/Grafana) intégré | Prometheus, Grafana, Datadog (à installer) | Amazon CloudWatch, ADOT, Prometheus |
| **Journalisation** | IBM Log Analysis (LogDNA) | IBM Log Analysis + OpenShift Logging (EFK/Loki) | EFK, Loki, Splunk (à installer) | Amazon CloudWatch Logs, Fluent Bit |
| **GitOps** | Flux, ArgoCD (à déployer) | OpenShift GitOps (ArgoCD intégré) | Flux, ArgoCD (à déployer) | Flux, ArgoCD (à déployer) |

---

## 11. Support & SLA

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **SLA disponibilité** | 99,9 % plan de contrôle | 99,9 % plan de contrôle | Aucun (responsabilité interne) | 99,95 % plan de contrôle |
| **Niveaux de support** | Basic, Standard, Premium (IBM Cloud) | Basic, Standard, Premium (IBM + Red Hat) | Communautaire / distribution commerciale | Developer, Business, Enterprise On-Ramp, Enterprise |
| **Délai réponse P1** | < 1h (Support Premium) | < 1h (Support Premium) | Selon équipe interne / astreinte | < 15 min (Enterprise On-Ramp/Enterprise) |
| **Support 24/7** | Avec abonnement Premium | Avec abonnement Premium | Selon organisation | Business et supérieur |
| **Support Red Hat inclus** | ❌ Non | ✅ Oui (accès Red Hat Customer Portal) | Possible si distribution commerciale | ❌ Non |
| **Documentation** | IBM Cloud Docs, communauté IBM | IBM Cloud Docs + Red Hat Docs | CNCF, GitHub, communauté open source | AWS Docs, re:Post, AWS Knowledge Center |

---

## 12. Charge Opérationnelle & Complexité

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **Gestion plan de contrôle** | ✅ IBM (zéro effort) | ✅ IBM (zéro effort) | ❌ Interne (etcd, API server, scheduler…) | ✅ AWS (zéro effort) |
| **Gestion OS nœuds** | Partielle (IBM gère les patches) | Partielle (RHCOS géré via MachineConfigOperator) | Totale (responsabilité interne) | Partielle (AWS gère via Managed Node Groups) |
| **Monitoring** | Semi-intégré (Sysdig IBM) | Intégré (stack Prometheus/Grafana OCP) | À construire entièrement | Semi-intégré (CloudWatch, ADOT) |
| **Backup etcd** | ✅ Automatique par IBM | ✅ Automatique par IBM | ❌ Manuel (responsabilité interne) | ✅ Automatique par AWS |
| **Niveau expertise requis** | Intermédiaire (K8s) | Intermédiaire-avancé (K8s + OCP) | Expert (K8s, réseau, OS, sécurité) | Intermédiaire (K8s + AWS) |
| **Complexité globale** | ★★☆☆☆ Faible | ★★★☆☆ Modérée | ★★★★★ Très élevée | ★★☆☆☆ Faible |

---

## 13. Matrice de Comparaison Complète

| Critère | IKS | ROKS | K8s Auto-Géré | Amazon EKS |
|---|---|---|---|---|
| **Fournisseur** | IBM Cloud | IBM Cloud + Red Hat | Auto-géré | Amazon Web Services |
| **Technologie de base** | Kubernetes vanilla (CNCF) | OpenShift Container Platform 4.x | Kubernetes vanilla (CNCF) | Kubernetes vanilla (CNCF) |
| **Plan de contrôle managé** | ✅ IBM | ✅ IBM | ❌ Interne | ✅ AWS |
| **OS nœuds workers** | Ubuntu 22.04 / RHEL 8 | RHCOS (immutable) | Au choix | Amazon Linux 2/2023, Bottlerocket, Ubuntu |
| **Runtime conteneurs** | containerd | CRI-O | Au choix | containerd |
| **SELinux enforcing** | ❌ | ✅ | Selon OS | Selon OS (Bottlerocket : ✅) |
| **Registre intégré** | ❌ (ICR externe) | ✅ (registre interne OCP) | ❌ (à déployer) | ❌ (ECR externe) |
| **IBM Cloud Paks** | ❌ | ✅ | ❌ | ❌ |
| **OperatorHub / OLM** | ❌ (manuel) | ✅ (intégré) | ❌ (manuel) | ❌ (manuel) |
| **CI/CD intégré** | ❌ | ✅ (Tekton + GitOps) | ❌ | Partiel (CodePipeline AWS) |
| **Console développeur** | ❌ | ✅ (OpenShift Web Console) | ❌ | ❌ |
| **Facilité déploiement** | ★★★★☆ | ★★★☆☆ | ★★☆☆☆ | ★★★★☆ |
| **Gestion versions K8s** | ★★★★☆ | ★★★★★ | ★★☆☆☆ | ★★★★☆ |
| **Sécurité managée** | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★★★★☆ |
| **Écosystème intégrations** | ★★★★☆ (IBM) | ★★★★★ (IBM + RH) | ★★★★★ (libre) | ★★★★★ (AWS) |
| **Flexibilité réseau** | ★★★☆☆ | ★★★☆☆ | ★★★★★ | ★★★★☆ |
| **Options stockage** | ★★★★☆ | ★★★★★ | ★★★★★ | ★★★★★ |
| **Maîtrise des coûts** | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ |
| **SLA** | 99,9 % IBM | 99,9 % IBM + RH | Interne | 99,95 % AWS |
| **Complexité opérationnelle** | Faible | Modérée | Très élevée | Faible |
| **Certifications conformité** | ISO/SOC/PCI/HIPAA | FIPS/FedRAMP/DoD | À construire | SOC/PCI/HIPAA/FedRAMP |
| **Vendor lock-in** | IBM Cloud | IBM Cloud + Red Hat | Minimal | AWS |
| **Portabilité multi-cloud** | ★★★★☆ | ★★★☆☆ | ★★★★★ | ★★★☆☆ |

---

## 14. Recommandations par Profil

### Profil 1 — Entreprise native IBM Cloud

**Solution recommandée : IKS ou ROKS**

- Choisir **IKS** si : l'organisation utilise principalement des workloads conteneurisés purs, souhaite le coût le plus bas et dispose d'équipes expertes Kubernetes préférant assembler leur propre chaîne d'outils.
- Choisir **ROKS** si : l'organisation déploie des IBM Cloud Paks, souhaite une expérience développeur enrichie, opère dans un secteur réglementé (FIPS, FedRAMP) ou standardise sur OpenShift dans un environnement hybride.

### Profil 2 — Organisation hybride / Multi-Cloud

**Solution recommandée : ROKS (via IBM Cloud Satellite)**

- OpenShift sur Satellite assure une cohérence opérationnelle entre IBM Cloud, les datacenters on-premises et d'autres clouds publics.
- Le même CLI `oc`, les mêmes SCC, le même OperatorHub et la même surface API OCP dans tous les environnements.
- IBM Advanced Cluster Management (ACM) permet la gouvernance centralisée de clusters multiples.

### Profil 3 — Organisation native AWS

**Solution recommandée : Amazon EKS**

- Déjà investi dans l'écosystème AWS (IAM, VPC, RDS, S3, Lambda).
- Intégration native avec tous les services AWS et le AWS Marketplace.
- Fargate pour workloads serverless sans gestion des nœuds.
- Karpenter pour optimisation des coûts EC2 en temps réel.

### Profil 4 — Souveraineté des données / On-Premises obligatoire

**Solution recommandée : Kubernetes Auto-Géré**

- Exigences réglementaires interdisant le cloud public.
- Infrastructure propre existante à valoriser (CAPEX déjà engagé).
- Envisager une distribution commerciale (Rancher, VMware Tanzu, OpenShift autogéré) pour réduire la charge opérationnelle.
- **Avertissement :** Investissement en expertise SRE/Ops considérable requis. Le TCO réel dépasse souvent les estimations initiales.

---

### Tableau de Décision Rapide

| Besoin principal | Solution recommandée |
|---|---|
| Coût minimal sur IBM Cloud | IKS |
| IBM Cloud Paks | ROKS |
| OpenShift hybride (on-prem + cloud) | ROKS sur Satellite |
| Conformité FIPS / FedRAMP | ROKS |
| Écosystème AWS natif | Amazon EKS |
| Fargate / serverless K8s | Amazon EKS |
| Souveraineté des données / air-gapped | K8s Auto-Géré |
| Contrôle total sur la configuration K8s | K8s Auto-Géré |
| Portabilité maximale multi-cloud | K8s Auto-Géré ou IKS |
| Expérience développeur intégrée | ROKS |

---

*Document basé sur les analyses IKS vs ROKS existantes et les caractéristiques documentées d'Amazon EKS et Kubernetes auto-géré — Septembre 2026.*
