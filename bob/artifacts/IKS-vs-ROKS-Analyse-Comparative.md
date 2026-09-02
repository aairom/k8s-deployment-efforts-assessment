# IBM Cloud Kubernetes Service (IKS) vs. Red Hat OpenShift on IBM Cloud (ROKS)
## Analyse Comparative Entreprise — Plateformes de Conteneurs Gérées sur IBM Cloud

> **Classification du document :** Référence Architecture Technique  
> **Périmètre :** Plateformes de conteneurs gérées IBM Cloud — IKS & ROKS  
> **Audience :** Architectes Cloud, Ingénieurs Plateformes, Décideurs Infrastructure  
> **Dernière mise à jour :** 2025

---

## Table des Matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Analyse Architecturale & Mécanique du Plan de Contrôle](#2-analyse-architecturale--mécanique-du-plan-de-contrôle)
3. [Topologies de Déploiement & Intégrations Infrastructure](#3-topologies-de-déploiement--intégrations-infrastructure)
4. [Fondations Communes (Points Partagés)](#4-fondations-communes-points-partagés)
5. [Distinctions Clés & Différences Opérationnelles](#5-distinctions-clés--différences-opérationnelles)
6. [Matrice de Comparaison Technique Complète](#6-matrice-de-comparaison-technique-complète)
7. [Guide de Décision Architecturale](#7-guide-de-décision-architecturale)

---

## 1. Résumé Exécutif

IBM Cloud propose deux plateformes de conteneurs gérées de premier plan, conçues pour répondre aux besoins divergents des charges de travail d'entreprise modernes. Les deux services reposent sur l'infrastructure cloud mondiale éprouvée d'IBM, bénéficient d'un plan de contrôle entièrement géré et s'intègrent nativement à l'écosystème plus large des services IBM Cloud. Malgré leurs fondations infrastructure communes, ces deux plateformes représentent des approches philosophiquement distinctes de l'orchestration de conteneurs à l'échelle de l'entreprise.

### IBM Cloud Kubernetes Service (IKS)

IKS fournit un **Kubernetes vanilla, aligné sur l'upstream**, en tant que service entièrement géré. Il cible les organisations recherchant une conformité maximale avec l'écosystème Cloud Native Computing Foundation (CNCF), des charges de travail optimisées en coût, et des équipes disposant d'une expertise Kubernetes approfondie qui préfèrent composer leur propre chaîne d'outils à partir des meilleurs composants open-source. IKS supporte les dernières distributions Kubernetes et offre le point d'entrée au coût par nœud le plus bas dans le portefeuille de conteneurs gérés IBM Cloud.

**Proposition de valeur principale :** Conformité maximale avec Kubernetes, TCO le plus bas pour les charges de travail conteneurisées pures, et compatibilité la plus large avec l'outillage de l'écosystème CNCF.

### Red Hat OpenShift on IBM Cloud (ROKS)

ROKS fournit la **Red Hat OpenShift Container Platform (OCP)** en tant que service entièrement géré. Il cible les organisations standardisant sur OpenShift dans des environnements hybrides, celles opérant sous des mandats stricts de sécurité et de conformité d'entreprise, les équipes nécessitant une plateforme développeur intégrée (et pas seulement un orchestrateur), et les organisations déployant des IBM Cloud Paks. ROKS inclut la licence Red Hat OpenShift dans la tarification des nœuds workers, offrant une plateforme commercialement supportée et opiniâtre avec un chemin accéléré vers la production.

**Proposition de valeur principale :** Sécurité entreprise par défaut, plateforme développeur intégrée, déploiement simplifié des IBM Cloud Paks, et expérience opérationnelle cohérente dans les environnements hybrides et multi-cloud.

---

## 2. Analyse Architecturale & Mécanique du Plan de Contrôle

### 2.1 Gestion du Plan de Contrôle

IKS et ROKS fonctionnent tous deux selon un **modèle de plan de contrôle entièrement géré**. IBM provisionne, exploite, surveille et corrige les composants maîtres Kubernetes/OpenShift au nom du client, supprimant ainsi la plus grande charge opérationnelle des déploiements Kubernetes autogérés.

| Aspect | IKS | ROKS |
|---|---|---|
| Propriété du maître | Géré par IBM, dédié par cluster | Géré par IBM, dédié par cluster |
| Réplicas HA | 3 réplicas ; multi-zone (1/zone en MZC) | 3 réplicas répartis entre zones de disponibilité |
| etcd | Entièrement géré et sauvegardé par IBM | Entièrement géré et sauvegardé par IBM |
| Correctifs du maître | Automatiques par IBM ; aucune action client requise | Automatiques par IBM ; aucune action client requise |
| Accès SSH client | Désactivé (posture de sécurité renforcée) | Désactivé (posture de sécurité renforcée) |
| SLA du plan de contrôle | Couvert par le SLA IBM Cloud | Couvert par le SLA IBM Cloud |
| Isolation du maître (VPC) | Dédié par cluster | Dédié par cluster ; non partagé entre clients IBM |

Dans les **clusters multi-zones**, les deux plateformes distribuent les réplicas maîtres sur trois zones de disponibilité au sein d'une région, avec un équilibreur de charge hautement disponible devant le domaine du maître. Cette architecture tolère la perte d'une zone de disponibilité complète sans interruption du plan de contrôle.

### 2.2 Systèmes d'Exploitation des Nœuds Workers

**OS des nœuds workers IKS :**
Les nœuds workers IKS fonctionnent sous **Ubuntu 20.04/22.04 LTS** (pour les nœuds virtuels standard et bare metal) ou **Red Hat Enterprise Linux (RHEL) 8** selon la version du cluster et le type de nœud sélectionné. L'OS est géré par les SRE IBM et corrigé via une ré-imagerie complète du nœud via `ibmcloud ks worker update`. Le chiffrement LUKS AES-256 est appliqué par défaut à la partition du système de fichiers conteneur de chaque nœud worker. L'accès SSH direct aux nœuds workers est désactivé.

**OS des nœuds workers ROKS :**
Les nœuds workers ROKS fonctionnent sous **Red Hat Enterprise Linux CoreOS (RHCOS)** pour les clusters OpenShift 4.x, avec RHEL également disponible pour certaines configurations de pools de workers. RHCOS est un OS immuable, optimisé pour les conteneurs, conçu spécifiquement pour OpenShift : géré de manière déclarative via la configuration Ignition, il utilise `rpm-ostree` pour les mises à jour atomiques basées sur des images, et impose des partitions système en lecture seule. CRI-O est le runtime de conteneurs mandaté sur les nœuds workers RHCOS.

### 2.3 Composants Système Internes

#### Composants Système IKS

- **Serveur API :** Serveur API Kubernetes standard, géré par IBM.
- **Contrôleur Ingress :** Application Load Balancer (ALB) IBM basé sur NGINX. Un ALB par zone dans les clusters multi-zones. Supporte nativement les ressources `Ingress`.
- **Registre de conteneurs :** Aucun registre intégré dans le cluster. IBM Cloud Container Registry (ICR) sert de registre externe hautement disponible, intégré étroitement via des secrets de tirage. ICR supporte le Vulnerability Advisor pour l'analyse des images.
- **Authentification/RBAC :** Intégration IAM IBM Cloud. Les rôles d'accès au service IAM se synchronisent automatiquement avec les liaisons ClusterRole RBAC Kubernetes pour les niveaux d'accès `Manager`, `Writer` et `Reader`.
- **Plugin réseau :** Plugin CNI Calico pour l'application des politiques réseau et l'isolation au niveau des pods.
- **Konnectivity :** Agent de tunnel spécifique IBM fournissant une communication TLS chiffrée entre le maître géré par IBM et les nœuds workers clients.
- **Runtime de conteneurs :** `containerd` (remplace le démon Docker dans les versions Kubernetes modernes).

#### Composants Système ROKS

- **Serveur API :** Serveur API Kubernetes étendu par OpenShift (inclut les CRD et plugins d'admission spécifiques OCP), géré par IBM.
- **Serveur OAuth :** Automatiquement configuré pour déléguer l'authentification à IBM Cloud IAM. Les fournisseurs d'identité personnalisés ne sont pas configurables ; IAM est la source d'identité canonique.
- **Routeur (Ingress) :** Routeur OpenShift basé sur HAProxy, déployé en tant que composant géré par Operator. Un routeur par zone dans les clusters multi-zones. Gère nativement les ressources `Route`, avec support supplémentaire des ressources `Ingress` traduites en objets `Route`.
- **Registre d'images interne :** Registre interne OpenShift intégré, adossé à **IBM Cloud Object Storage (COS)** — une dépendance obligatoire. Supporte les ressources `ImageStream` pour l'abstraction des images et le déclenchement de pipelines de rebuild automatisés.
- **OperatorHub :** Catalogue pré-configuré d'opérateurs certifiés Red Hat, communautaires et ISV installables via l'Operator Lifecycle Manager (OLM).
- **Console Web :** Console Web OpenShift complète avec perspectives Développeur et Administrateur, pré-déployée et gérée par IBM.
- **Runtime de conteneurs :** `CRI-O` — le runtime léger conforme OCI mandaté par OpenShift.
- **Contrôleurs d'admission :** Ensemble étendu incluant `SecurityContextConstraint`, `SCCExecRestrictions`, `BuildByStrategy`, `OriginPodNodeEnvironment`, et des contrôleurs de politique spécifiques à OpenShift.

---

## 3. Topologies de Déploiement & Intégrations Infrastructure

### 3.1 Infrastructure Classic vs. VPC

Les deux plateformes supportent le déploiement sur l'**infrastructure Classic IBM Cloud** et l'infrastructure **VPC (Virtual Private Cloud) IBM Cloud**. Le choix du sous-jacent affecte significativement l'architecture réseau, la gestion du cycle de vie des nœuds workers et la transparence de la facturation.

**Infrastructure Classic :**
- Les nœuds workers sont provisionnés directement dans votre compte d'infrastructure IBM Cloud.
- Réseau basé sur les VLAN ; Virtual Router Function (VRF) ou VLAN spanning requis pour le routage multi-zone.
- Un Multi-Zone Load Balancer (MZLB) dédié est automatiquement provisionné pour les clusters multi-zones.
- Des sous-réseaux publics portables (8 IP) sont auto-commandés et facturés mensuellement.
- `IKS uniquement :` L'infrastructure Classic supporte les configurations de clusters sur réseau privé uniquement.

**Infrastructure VPC (Recommandée pour les nouveaux déploiements) :**
- Les nœuds workers sont provisionnés dans des comptes d'infrastructure appartenant à IBM.
- Réseau basé sur les sous-réseaux VPC avec des groupes de sécurité régissant tout le trafic inter-nœuds et équilibreur de charge.
- **Réseau VPC sécurisé par défaut** (IKS 1.30+ / ROKS 4.15+) : Quatre groupes de sécurité sont auto-créés : `kube-<clusterID>` (SG worker), SG passerelle VPE maître, SG passerelle VPE partagée, et SG LBaaS. Tout le trafic sortant public est bloqué par défaut.
- Des Points de Terminaison Privés Virtuels (VPE) sont automatiquement créés pour IBM Container Registry, COS, l'API VPC et le maître du cluster.

### 3.2 Topologies Mono-Zone vs. Multi-Zone

**Cluster Mono-Zone (SZC) :**
Tous les nœuds workers et les réplicas du plan de contrôle résident dans une seule zone de disponibilité. Adapté aux charges de travail de développement, test et hors production. Le maître maintient toujours trois réplicas dans la zone pour une HA au niveau processus, mais une défaillance de zone entraîne l'indisponibilité complète du cluster.

**Cluster Multi-Zone (MZC) :**
Les nœuds workers sont distribués sur 2–3 zones de disponibilité au sein d'une MZR (Multi-Zone Region). Les réplicas maîtres sont répartis à raison d'un par zone. Les pools de workers doivent avoir au minimum un nœud worker par zone.

- **MZC IKS :** Les ALBs Ingress sont déployés un par zone. Un seul service Kubernetes `LoadBalancer` génère des VPC LBs par zone ou un MZLB cross-zone (Classic).
- **MZC ROKS :** Les services routeur sont déployés un par zone. Les VPC LBs desservent les services routeur. Le bucket COS du registre interne est une ressource régionale, héritant des garanties de durabilité 11 neuf de COS.

### 3.3 Hybride et Multi-Cloud : IBM Cloud Satellite

IKS et ROKS peuvent tous deux être étendus à l'infrastructure gérée par le client via **IBM Cloud Satellite**. Satellite permet aux organisations de déployer des plans de contrôle gérés par IBM sur du matériel situé dans des centres de données clients, des installations de co-location, des emplacements de périphérie, ou des fournisseurs cloud tiers (AWS, Azure, GCP).

**IKS sur Satellite :** Déploie des clusters Kubernetes standard sur l'infrastructure gérée par le client. Adapté aux charges de travail nécessitant une résidence des données ou un outillage K8s cohérent en périphérie.

**ROKS sur Satellite :** Déploie des clusters OpenShift sur l'infrastructure gérée par le client. Il s'agit du principal vecteur pour les organisations standardisant sur OpenShift dans des déploiements hybrides. Les IBM Cloud Paks peuvent être déployés sur des clusters ROKS attachés à Satellite. **Note tarifaire :** Les clusters ROKS sur Satellite (après novembre 2022) sont facturés selon des frais mensuels fixes de gestion du cluster + frais de gestion des workers par vCPU + frais de licence OCP par vCPU. La licence OCP en mode Bring-Your-Own (BYOL) via des abonnements Red Hat existants est supportée sur Satellite.

---

## 4. Fondations Communes (Points Partagés)

Malgré leurs différences, IKS et ROKS partagent une fondation profonde et unifiée au sein d'IBM Cloud.

### 4.1 Intégration des Services IBM Cloud

Les deux plateformes s'intègrent nativement avec les services de plateforme IBM Cloud suivants :

| Service IBM Cloud | Intégration IKS | Intégration ROKS |
|---|---|---|
| **IBM Cloud IAM** | Rôles de service IAM → synchronisation RBAC K8s | IAM → Serveur OAuth OpenShift → synchronisation RBAC K8s |
| **Key Protect** | Fournisseur KMS pour le chiffrement des secrets etcd au repos | Fournisseur KMS pour le chiffrement des secrets etcd |
| **Hyper Protect Crypto Services (HPCS)** | Chiffrement des secrets adossé à un HSM FIPS 140-2 Niveau 4 | Terminaison TLS des routes avec HPCS ; chiffrement des secrets |
| **IBM Cloud Activity Tracker** | Diffusion des journaux d'audit API et cluster | Diffusion des journaux d'audit API et cluster |
| **IBM Log Analysis (Cloud Logs)** | Transfert des journaux workers et applications | Transfert des journaux workers et applications |
| **IBM Cloud Monitoring** | Métriques Prometheus via l'agent IBM Cloud Monitoring | Métriques Prometheus ; stack de monitoring OpenShift |
| **IBM Cloud Container Registry (ICR)** | Secrets de tirage, Vulnerability Advisor, signature d'images | Secrets de tirage ; proxy ImageStreams vers ICR |
| **IBM Cloud Continuous Delivery** | Pipelines Tekton, Toolchains DevOps | Toolchains Tekton + OpenShift Pipelines natif |
| **Context-Based Restrictions (CBR)** | Contrôle d'accès API à portée de zone réseau | Contrôle d'accès API à portée de zone réseau |

### 4.2 Couches de Stockage Communes

Les deux plateformes supportent les mêmes intégrations de stockage persistant IBM Cloud :

- **IBM Cloud Block Storage (VPC/Classic) :** Pilotes CSI et classes de stockage pour les volumes de bloc RWO (ReadWriteOnce). Supporte le chiffrement avec Key Protect et HPCS.
- **IBM Cloud File Storage (Classic) / VPC File Storage :** Classes de stockage NFS pour les charges de travail RWX (ReadWriteMany).
- **IBM Cloud Object Storage (COS) :** Stockage objet compatible S3, accessible via le pilote IBM COS CSI. *ROKS requiert en outre une instance COS pour le registre d'images interne.*
- **Portworx Enterprise :** Couche de stockage définie par logiciel, disponible sur les deux plateformes, supportant la réplication des données persistantes multi-zone, le chiffrement et la HA des charges de travail avec état.
- **OpenShift Data Foundation (ODF) / Red Hat Ceph :** Disponible sur ROKS en tant qu'opérateur certifié via OperatorHub, fournissant des interfaces de stockage bloc, fichier et objet définies par logiciel dans le cluster.

### 4.3 Primitives d'Isolation Réseau

Les deux plateformes emploient les mêmes primitives d'isolation réseau sous-jacentes :

- **Calico CNI :** Les deux plateformes utilisent Project Calico comme plugin CNI pour la mise en réseau des pods. Calico supporte les objets Kubernetes `NetworkPolicy` pour la micro-segmentation L3/L4.
- **Points de terminaison de service privés :** Les maîtres de cluster peuvent être configurés avec des points de terminaison de service privés exclusifs ou doubles (public + privé). Les configurations privées uniquement acheminent toutes les communications du plan de contrôle via le réseau privé IBM Cloud.
- **Groupes de sécurité VPC (clusters VPC) :** Les groupes de sécurité appliquent des règles d'entrée/sortie au niveau de la NIC worker, de l'équilibreur de charge et de la passerelle VPE — fournissant une segmentation réseau en profondeur.

---

## 5. Distinctions Clés & Différences Opérationnelles

### 5.1 Expérience Développeur & Opérateur

#### IKS : Outillage Natif Kubernetes

IKS fournit une surface opérationnelle Kubernetes standard sans extensions CLI propriétaires au-delà des commandes de gestion des clusters IBM Cloud :

- **CLI :** `kubectl` (CLI Kubernetes upstream standard) + plugin `ibmcloud ks` pour les opérations du cycle de vie des clusters.
- **Interface :** IBM Cloud Console fournit un tableau de bord de cluster, la surveillance des nœuds et le téléchargement de la configuration `kubectl`. Le Kubernetes Dashboard standard est déployable mais non pré-installé.
- **Gestion de paquets :** Helm 3 est le standard de fait pour le déploiement d'applications complexes sur IKS. Aucun framework d'opérateurs intégré ; les opérateurs doivent être installés manuellement via `kubectl apply` ou Helm.
- **Libre-service développeur :** Aucun portail développeur intégré. Les équipes s'intègrent typiquement avec des outils CI/CD externes (GitHub Actions, Jenkins, Tekton via IBM Cloud Continuous Delivery).

#### ROKS : Plateforme Développeur Intégrée

ROKS fournit une surface d'expérience opérateur et développeur significativement plus riche :

- **CLI :** `oc` (CLI OpenShift — un sur-ensemble de `kubectl`) + `kubectl` (tous deux supportés) + plugin `ibmcloud oc` pour les opérations du cycle de vie des clusters. `oc` fournit des commandes supplémentaires pour les ressources spécifiques à OpenShift : `oc new-project`, `oc new-app`, `oc rollout`, `oc policy`, `oc adm`, etc.
- **Console Web :** Console Web OpenShift complète avec deux perspectives basées sur les rôles :
  - **Perspective Développeur :** Vue topologie, déploiement guidé d'applications depuis Git ou des images de conteneurs, streaming de journaux intégré, initiation de builds S2I et visualisation des pipelines Tekton.
  - **Perspective Administrateur :** Administration complète du cluster, gestion des opérateurs, tableaux de bord de monitoring, application des politiques de sécurité et gestion des quotas de ressources.
- **Operator Lifecycle Manager (OLM) :** Framework intégré pour découvrir, installer et gérer le cycle de vie des opérateurs Kubernetes depuis l'OperatorHub intégré.
- **OperatorHub :** Marketplace pré-configuré de centaines d'opérateurs couvrant les bases de données (PostgreSQL, MongoDB, Redis), la messagerie (Apache Kafka, RabbitMQ), le maillage de services, les frameworks ML/IA et les IBM Cloud Paks.

### 5.2 Posture de Sécurité & Isolation

#### IKS : Pod Security Standards (PSS) Kubernetes

IKS applique la sécurité via le modèle de sécurité Kubernetes upstream :

- **Pod Security Admission (PSA) :** Les clusters Kubernetes modernes sur IKS appliquent les Pod Security Standards au niveau des espaces de noms (modes `privileged`, `baseline`, `restricted`). Le profil `restricted` impose l'exécution non-root, les systèmes de fichiers racine en lecture seule et la suppression des capabilities.
- **RBAC :** RBAC Kubernetes standard avec synchronisation IAM vers ClusterRole.
- **Politiques réseau :** Objets Calico NetworkPolicy ; non appliqués par défaut — les administrateurs doivent définir explicitement les règles d'entrée/sortie.
- **Durcissement des nœuds :** Configuration OS alignée CIS Benchmark. Chiffrement LUKS AES-256 sur les partitions de conteneurs des nœuds workers. SSH désactivé.

#### ROKS : Security Context Constraints (SCC) — Plus Strict par Défaut

ROKS applique une posture de sécurité plus opiniâtre via le framework Security Context Constraints d'OpenShift, qui précède et étend les capacités du PSS Kubernetes :

- **Security Context Constraints (SCC) :** Les SCC sont des politiques d'admission spécifiques à OpenShift appliquées par le contrôleur d'admission `SecurityContextConstraint`. Les SCC contrôlent : plages UID/GID, types de volumes autorisés, accès au réseau/PID/IPC hôte, capabilities Linux, profils AppArmor/SELinux et escalade de privilèges. ROKS est livré avec 8 SCC intégrés :
  - `restricted` — Par défaut ; interdit l'escalade de privilèges, impose l'UID non-root, supprime toutes les capabilities.
  - `nonroot` — Autorise tout UID non-root.
  - `anyuid` — Autorise tout UID y compris root (nécessite une attribution explicite).
  - `hostnetwork` — Autorise l'espace de noms réseau hôte.
  - `privileged` — Accès complet à l'hôte (uniquement pour les pods système au niveau infrastructure).
  - `node-exporter`, `hostmount-anyuid`, `hostaccess` — SCC spécialisés pour les agents de monitoring et pilotes de stockage.
- **Implication :** De nombreuses applications conteneurisées conçues pour Kubernetes vanilla nécessitent des ajustements SCC lors de la migration vers ROKS, car les images s'exécutant en root ou utilisant des UID arbitraires seront rejetées par le SCC `restricted` par défaut.
- **SELinux :** RHCOS active SELinux en mode enforcing sur les nœuds workers, fournissant un contrôle d'accès obligatoire au niveau de l'OS — une limite de sécurité supplémentaire absente des nœuds IKS basés sur Ubuntu.

### 5.3 Builds & Pipelines CI/CD

#### IKS : CI/CD Composable

IKS ne comprend pas de système de build ou CI/CD opiniâtre. Approches recommandées :

- **IBM Cloud Continuous Delivery :** Toolchains DevOps gérées avec support des pipelines Tekton, intégrées aux outils IBM Cloud, à la gestion des secrets (Secrets Manager) et au Code Risk Analyzer.
- **ArgoCD / Flux :** Opérateurs GitOps déployables via Helm pour la réconciliation déclarative des déploiements basée sur les dépôts.
- **GitHub Actions / GitLab CI / Jenkins :** Outils CI externes se connectant au cluster via `kubectl` et Helm, utilisant IBM Cloud Container Registry pour le stockage des images.
- **Tekton Pipelines :** Déployable en tant qu'opérateur autonome sur IKS pour l'exécution de pipelines CI/CD natifs Kubernetes.

#### ROKS : Plateforme de Build & Pipeline Intégrée

ROKS est livré avec un sous-système de build et CI/CD natif, entièrement intégré :

- **OpenShift Builds :** Les ressources `BuildConfig` définissent des pipelines de build d'images automatisés déclenchés par des commits de code source, des changements de tags d'images ou des événements webhook. Les builds s'exécutent en tant que pods isolés dans le cluster.
- **Source-to-Image (S2I) :** Les images de builder permettent aux développeurs de pousser du code source (Java, Node.js, Python, Ruby, Go, etc.) et d'obtenir une image de conteneur exécutable sans écrire de Dockerfile. S2I impose des images de base sécurisées et des environnements de build cohérents.
- **OpenShift Pipelines (Tekton) :** Système de pipeline CI/CD natif Kubernetes pré-installé en tant qu'opérateur sur ROKS. Fournit les CRDs `Pipeline`, `Task`, `PipelineRun` et `TaskRun` ; s'intègre à la Console Web OpenShift pour la gestion visuelle des pipelines.
- **ImageStreams :** Couche d'abstraction sur les images de conteneurs permettant le déclenchement automatique de redéploiements ou rebuilds lorsqu'une image upstream est mise à jour.
- **IBM Cloud Paks :** Paquets logiciels d'entreprise (Cloud Pak for Data, Cloud Pak for Integration, Cloud Pak for AIOps, Cloud Pak for Security, Cloud Pak for Business Automation) nécessitant exclusivement OpenShift et déployables uniquement sur ROKS.

### 5.4 Licence, Support & Matrice de Coût

#### Modèle Tarifaire IKS

IKS suit un **modèle de consommation pure de ressources** :

- Le coût des nœuds workers est basé sur le vCPU, la mémoire et le stockage du type de nœud sélectionné.
- Aucun frais de licence plateforme — uniquement les coûts d'infrastructure.
- La gestion des nœuds maîtres est incluse sans frais supplémentaires.
- **Réservations Classic :** Contrats de tarification réservée sur 1 an ou 3 ans disponibles pour les nœuds workers Classic, offrant des économies de 30–50 % par rapport aux tarifs à la demande.
- Coût d'entrée le plus bas dans le portefeuille de conteneurs IBM Cloud.

#### Modèle Tarifaire ROKS

ROKS inclut la **licence Red Hat OpenShift Container Platform (OCP)** dans la tarification des nœuds workers :

- Le coût des nœuds workers comprend l'infrastructure sous-jacente plus les frais de licence OCP.
- **Nouveau modèle de licence OCP :** Une licence Red Hat par 2 cœurs virtuels (ou 1 cœur physique). Facturée à l'heure pour le cycle de vie du nœud worker.
- **Ancien modèle de licence OCP :** Une licence par 4 cœurs virtuels (ou 2 cœurs physiques), facturée mensuellement par worker déployé.
- Les coûts de licence OCP sont reflétés en sous-poste ou plan séparé sur la facture IBM Cloud selon le modèle de facturation.
- **Bring Your Own License (BYOL) :** Les organisations disposant de droits IBM Cloud Pak existants ou d'abonnements Red Hat OpenShift peuvent appliquer ces droits aux nœuds workers ROKS, supprimant ainsi le surcoût de licence OCP.
- **Surcoût effectif net :** Les nœuds workers ROKS sont typiquement **~25–30 % plus chers** que les nœuds IKS équivalents en raison de la licence OCP incluse.
- Sur Satellite, ROKS ajoute des frais mensuels fixes de gestion du cluster plus des frais par vCPU pour la gestion des workers et la licence OCP.

---

## 6. Matrice de Comparaison Technique Complète

| Fonctionnalité / Attribut | IBM Cloud Kubernetes Service (IKS) | Red Hat OpenShift on IBM Cloud (ROKS) |
|---|---|---|
| **Distribution Upstream** | Kubernetes communautaire certifié CNCF (dernière version upstream) | Red Hat OpenShift Container Platform (OCP) 4.x |
| **Actualité Version K8s** | Dernière version mineure Kubernetes disponible | Cadence de version OCP (peut être en retard de 1–2 versions mineures K8s) |
| **Gestion Plan de Contrôle** | Entièrement géré par IBM ; dédié par cluster | Entièrement géré par IBM ; dédié par cluster |
| **Config HA du Maître** | 3 réplicas ; multi-zone | 3 réplicas répartis entre zones de disponibilité |
| **OS des Nœuds Workers** | Ubuntu 20.04/22.04 LTS ou RHEL 8 | RHCOS (immuable) ; RHEL 8 également disponible |
| **Runtime de Conteneurs** | `containerd` | `CRI-O` |
| **SELinux** | Non appliqué (noyau Ubuntu) | Mode enforcing sur les nœuds workers RHCOS |
| **Registre par Défaut** | IBM Cloud Container Registry (externe) | Registre Interne OpenShift (adossé IBM COS) + ICR |
| **Dépendance COS** | Optionnelle | Obligatoire (pour le registre d'images interne) |
| **Abstraction d'Image** | Références d'images OCI standard | ImageStreams + ImageStreamTags (+ refs OCI) |
| **Authentification / IdP** | IBM Cloud IAM → synchronisation RBAC K8s | IAM → Serveur OAuth OCP → synchronisation RBAC K8s |
| **Modèle Multi-Tenant** | Namespaces + RBAC + NetworkPolicy | Projects + RBAC + SCC + NetworkPolicy |
| **Sécurité par Défaut** | Pod Security Admission (PSS Baseline/Restricted) | SCC Restricted + SELinux enforcing — plus strict par défaut |
| **Contrôleurs d'Admission** | Chaîne d'admission Kubernetes standard | Étendue : SCC, BuildByStrategy, webhooks spécifiques OCP |
| **Outils CLI** | `kubectl` + `ibmcloud ks` | `oc` (sur-ensemble kubectl) + `kubectl` + `ibmcloud oc` |
| **Console Web / Interface** | IBM Cloud Console (infra) ; K8s Dashboard (déploiement manuel) | Console Web OpenShift (Développeur + Admin) — pré-installée |
| **Contrôleur Ingress** | ALB IBM basé sur NGINX (ressources `Ingress`) | Routeur OpenShift HAProxy (ressources `Route` + `Ingress`) |
| **Framework d'Opérateurs** | Déploiement manuel (kubectl/Helm) | OLM + OperatorHub — pré-installés |
| **Système de Build** | Aucun intégré ; CI/CD externe requis | OpenShift Builds + S2I — intégrés |
| **Pipelines CI/CD** | Outils externes ; IBM CD Toolchains ; Tekton (installation manuelle) | OpenShift Pipelines (Tekton) — opérateur pré-installé |
| **Maillage de Services** | Déploiement manuel d'Istio/Linkerd | OpenShift Service Mesh (basé Istio) via OperatorHub |
| **Stack de Monitoring** | Agent IBM Cloud Monitoring ; Prometheus/Grafana manuels | OpenShift Monitoring (Prometheus + Grafana) intégré ; surveillance des charges utilisateur |
| **Journalisation** | Agent IBM Log Analysis ; DaemonSet Fluentd | Agent IBM Log Analysis ; OpenShift Logging (EFK/Loki) via Opérateur |
| **Cycle de Vie OS** | Géré IBM ; ré-imagerie via `ibmcloud ks worker update` | Géré IBM ; mises à jour atomiques RHCOS via MachineConfigOperator |
| **IBM Cloud Paks** | Non supportés (nécessitent OCP) | Entièrement supportés ; opérateurs Cloud Pak via OperatorHub |
| **Virtualisation OpenShift** | Non disponible | Basé KubeVirt ; disponible en tant qu'opérateur (ROKS 4.x) |
| **Nœuds Workers Minimum** | 1 nœud worker par zone | 2 nœuds workers par zone (4 vCPU chacun minimum) |
| **Options Infrastructure** | Classic, VPC, Satellite | Classic, VPC, Satellite |
| **Cluster Privé (Classic)** | ✅ Supporté | Non supporté sur Classic |
| **Modèle Tarifaire** | Coût de calcul pur ; aucune licence plateforme | Calcul + licence OCP incluse (~25–30 % de surcoût vs. IKS) |
| **BYOL / Droit** | N/A | Droit IBM Cloud Pak ou abonnement Red Hat accepté |
| **Extension Satellite** | Clusters IKS sur hôtes gérés par le client | Clusters ROKS + Cloud Paks sur hôtes gérés par le client |
| **Conformité CNCF** | Kubernetes certifié CNCF | OCP certifié CNCF (+ APIs Red Hat supplémentaires) |
| **Portabilité Multi-Cloud** | Élevée (APIs K8s upstream uniquement) | Moyenne (APIs spécifiques OCP nécessitent une adaptation hors plateforme) |

---

## 7. Guide de Décision Architecturale

### Cadre de Décision

Utilisez le cadre suivant basé sur les scénarios pour orienter le choix de la plateforme. Les deux plateformes sont adaptées à la production ; la décision doit être guidée par le contexte organisationnel, les investissements existants dans l'écosystème et l'analyse du coût total de possession.

---

### Choisir IKS quand :

**1. Optimisation Budgétaire est Prioritaire**
Vos charges de travail sont conteneurisées mais ne nécessitent pas les fonctionnalités de la plateforme développeur OpenShift. Le surcoût de ~25–30 % de la licence OCP n'est pas compensé par les exigences en capacités de la plateforme. Les équipes sont à l'aise avec l'assemblage de leur propre chaîne d'outils (Helm, ArgoCD, Prometheus, registres externes).

**2. Conformité Maximale avec Kubernetes Upstream est Requise**
Votre organisation a une politique stricte d'exécution des dernières versions mineures Kubernetes upstream. IKS suit la cadence de publication Kubernetes upstream plus fidèlement que ROKS, qui suit le calendrier de publication OCP (généralement en retard d'une à deux versions mineures par rapport à K8s upstream).

**3. Portabilité entre Clouds**
Votre architecture doit être portable vers GKE, EKS ou AKS avec un minimum de refactorisation. Les charges de travail IKS utilisant uniquement les APIs Kubernetes upstream sont directement portables ; les charges ROKS utilisant `Route`, SCC, `BuildConfig` ou `ImageStream` nécessitent une adaptation lors de la migration hors OpenShift.

**4. Modèle d'Opérateurs Vanilla Kubernetes**
Votre équipe préfère composer l'écosystème d'opérateurs manuellement et dispose d'investissements existants dans des charts Helm ou des opérateurs Kubernetes spécifiques qui peuvent entrer en conflit avec OLM ou nécessiter des grants SCC personnalisés sur OpenShift.

**5. Clusters Classic sur Réseau Privé Uniquement**
Vos exigences de conformité imposent zéro exposition internet public, y compris aucun réseau public sur les nœuds workers en infrastructure Classic. IKS supporte les clusters Classic avec workers sur des VLAN privés uniquement ; ROKS ne propose pas cette topologie sur Classic.

**6. Charges de Travail Légères en Périphérie / Dev/Test**
Vous avez besoin de clusters à faible overhead pour les runners CI, les environnements de développement/test ou des nœuds de périphérie. IKS supporte les configurations mono-nœud ; ROKS exige un minimum de 2 workers par zone (4 vCPU chacun).

---

### Choisir ROKS quand :

**1. Écosystème Red Hat / OpenShift Existant**
Votre organisation exploite OpenShift sur site (OCP) ou sur d'autres fournisseurs cloud. ROKS assure la cohérence opérationnelle entre les environnements : le même CLI `oc`, les mêmes SCC, le même OperatorHub et la même surface API OCP. Les compétences des ingénieurs plateformes se transfèrent directement ; les runbooks sont portables.

**2. Déploiement d'IBM Cloud Paks**
Les IBM Cloud Paks (Cloud Pak for Data, Cloud Pak for Integration, Cloud Pak for AIOps, Cloud Pak for Business Automation, Cloud Pak for Security) nécessitent exclusivement OpenShift. Si votre cas d'usage implique un Cloud Pak, ROKS est la seule option IBM Cloud gérée.

**3. Mandats Stricts de Sécurité & Conformité Entreprise**
Votre organisation opère dans un secteur réglementé (FSI, Santé, Gouvernement) et nécessite des composants OS validés FIPS, le mode SELinux enforcing, un durcissement mandatoire des pods basé sur SCC et une posture de conformité intégrée. RHCOS + SCC + OLM fournissent tout cela par défaut.

**4. Modernisation Accélérée des Applications**
Vos équipes de développement ont besoin d'outils guidés pour conteneuriser des applications legacy. Le S2I d'OpenShift, les déclencheurs BuildConfig, la promotion via ImageStream et la perspective Développeur dans la Console Web réduisent considérablement le délai de mise en production pour les équipes avec une expertise limitée en conteneurs.

**5. Plateforme Développeur Intégrée**
Votre organisation souhaite une plateforme unique couvrant : orchestration de conteneurs + registre intégré + pipelines CI/CD (Tekton) + catalogue de services (OperatorHub) + portail libre-service développeur (Console Web) + monitoring (Prometheus/Grafana). ROKS fournit tout cela sans installation ou effort d'intégration de composants supplémentaires.

**6. Standardisation Hybride et Multi-Cloud via Satellite**
Votre organisation déploie des charges de travail sur IBM Cloud, des centres de données sur site et/ou d'autres clouds publics. ROKS sur IBM Cloud Satellite fournit un plan de contrôle OpenShift et des outils cohérents dans tous les environnements, avec une gestion centralisée via IBM Cloud.

**7. Licence OpenShift en Mode Bring-Your-Own (BYOL)**
Votre organisation dispose d'un abonnement Red Hat OpenShift existant ou d'un droit IBM Cloud Pak. L'application de ce droit aux nœuds workers ROKS supprime le surcoût de licence OCP, rendant le coût par nœud comparable à IKS tout en conservant toutes les capacités de la plateforme OpenShift.

---

### Matrice Récapitulative de Décision

| Facteur de Décision | Favorise IKS | Favorise ROKS |
|---|---|---|
| **Contrainte budgétaire (sans licence RH existante)** | ✅ | — |
| **IBM Cloud Paks requis** | — | ✅ |
| **OpenShift existant sur site** | — | ✅ |
| **Licence Red Hat / Cloud Pak en BYOL** | — | ✅ |
| **Conformité Kubernetes vanilla** | ✅ | — |
| **Dernière version Kubernetes requise** | ✅ | — |
| **Système de build & CI/CD intégré** | — | ✅ |
| **Portail développeur libre-service** | — | ✅ |
| **Durcissement SELinux + SCC** | — | ✅ |
| **Conformité FSI / Santé / Gouvernement** | — | ✅ |
| **Cluster Classic privé uniquement** | ✅ | — |
| **Empreinte de nœud minimale (1 nœud)** | ✅ | — |
| **Écosystème OperatorHub / OLM** | — | ✅ |
| **Portabilité multi-cloud** | ✅ Élevée | Moyenne (APIs OCP spécifiques) |
| **Outillage S2I / Modernisation d'applications** | — | ✅ |
| **Cohérence hybride via Satellite** | ✅ (Standard K8s) | ✅ (Standard OCP) |
| **Charges VM aux côtés des conteneurs** | — | ✅ OpenShift Virtualization (KubeVirt) |

---

*Ce document est fondé sur la documentation officielle des produits IBM Cloud et représente l'état des plateformes IKS et ROKS en 2025. Consultez la [documentation IBM Cloud Kubernetes Service](https://cloud.ibm.com/docs/containers) et la [documentation Red Hat OpenShift on IBM Cloud](https://cloud.ibm.com/docs/openshift) pour les informations les plus récentes par version.*
