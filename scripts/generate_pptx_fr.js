#!/usr/bin/env node
// generate_pptx_fr.js — IBM-styled French PPTX for IKS vs ROKS
const PptxGenJS = require('pptxgenjs');
const path = require('path');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';
pptx.title = 'IKS vs ROKS — Analyse Comparative Entreprise';
pptx.author = 'IBM Cloud Architecture';

// ── DESIGN TOKENS ──────────────────────────────────────────
const IBM_BLUE    = '0F3460';
const IBM_BLUE2   = '1A56DB';
const RED         = 'C52020';
const GREEN       = '1A7F37';
const WHITE       = 'FFFFFF';
const GRAY_10     = 'F4F4F4';
const GRAY_20     = 'E0E0E0';
const GRAY_70     = '525252';
const GRAY_100    = '161616';
const IKS_BG      = 'DBEAFE';
const IKS_TEXT    = '1E40AF';
const ROKS_BG     = 'FEE2E2';
const ROKS_TEXT   = '991B1B';

const W = 10;   // slide width inches
const H = 5.625; // slide height inches

// ── MASTER BACKGROUND helper ───────────────────────────────
function addSlideBackground(slide, color) {
  slide.background = { color };
}

// ── COVER SLIDE (Slide 1) ──────────────────────────────────
{
  const s = pptx.addSlide();
  addSlideBackground(s, IBM_BLUE);

  // Top accent bar
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.08, fill: { color: IBM_BLUE2 } });

  // IBM label
  s.addText('IBM CLOUD', {
    x: 0.5, y: 0.3, w: 9, h: 0.3,
    fontSize: 11, bold: true, color: 'FFFFFF', transparency: 20,
    charSpacing: 4,
  });

  // Main title
  s.addText('IBM Cloud Kubernetes Service (IKS)\nvs.\nRed Hat OpenShift on IBM Cloud (ROKS)', {
    x: 0.5, y: 0.75, w: 8.5, h: 2.2,
    fontSize: 32, bold: true, color: WHITE, lineSpacingMultiple: 1.2,
  });

  // Subtitle
  s.addText('Analyse Comparative Entreprise\nPlateformes de Conteneurs Gérées sur IBM Cloud', {
    x: 0.5, y: 3.1, w: 8.5, h: 0.9,
    fontSize: 16, color: WHITE, transparency: 15, lineSpacingMultiple: 1.4,
  });

  // Meta row
  s.addText('Référence Architecture Technique  ·  Architectes Cloud & Ingénieurs Plateformes  ·  2025', {
    x: 0.5, y: 4.4, w: 9, h: 0.3,
    fontSize: 10, color: WHITE, transparency: 30, italic: true,
  });

  // Bottom accent bar
  s.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.06, w: W, h: 0.06, fill: { color: IBM_BLUE2 } });
}

// ── AGENDA SLIDE (Slide 2) ─────────────────────────────────
{
  const s = pptx.addSlide();
  addSlideBackground(s, WHITE);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.08, fill: { color: IBM_BLUE } });

  s.addText('Sommaire', {
    x: 0.5, y: 0.2, w: 9, h: 0.45,
    fontSize: 22, bold: true, color: IBM_BLUE,
  });

  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.72, w: 9, h: 0.03, fill: { color: GRAY_20 } });

  const items = [
    ['01', 'Résumé Exécutif'],
    ['02', 'Analyse Architecturale & Plan de Contrôle'],
    ['03', 'Topologies de Déploiement & Infrastructure'],
    ['04', 'Fondations Communes'],
    ['05', 'Distinctions Clés & Différences Opérationnelles'],
    ['06', 'Matrice de Comparaison Technique'],
    ['07', 'Guide de Décision Architecturale'],
  ];

  items.forEach(([num, label], i) => {
    const y = 0.9 + i * 0.63;
    s.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 0.55, h: 0.42, fill: { color: IBM_BLUE }, line: { color: IBM_BLUE } });
    s.addText(num, { x: 0.5, y, w: 0.55, h: 0.42, fontSize: 13, bold: true, color: WHITE, align: 'center', valign: 'middle' });
    s.addText(label, { x: 1.2, y: y + 0.06, w: 8, h: 0.3, fontSize: 14, color: GRAY_100 });
  });

  s.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.06, w: W, h: 0.06, fill: { color: IBM_BLUE } });
}

// ── SECTION DIVIDER helper ─────────────────────────────────
function addSection(num, title) {
  const s = pptx.addSlide();
  addSlideBackground(s, IBM_BLUE);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.08, fill: { color: IBM_BLUE2 } });
  s.addText(String(num).padStart(2, '0'), {
    x: 0.5, y: 1.5, w: 2, h: 1.5,
    fontSize: 80, bold: true, color: WHITE, transparency: 80,
  });
  s.addText(title, {
    x: 0.5, y: 2.2, w: 9, h: 1.2,
    fontSize: 28, bold: true, color: WHITE, lineSpacingMultiple: 1.2,
  });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.06, w: W, h: 0.06, fill: { color: IBM_BLUE2 } });
  return s;
}

// ── CONTENT SLIDE helper ───────────────────────────────────
function addContent(title, sectionNum) {
  const s = pptx.addSlide();
  addSlideBackground(s, WHITE);
  // Header bar
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.65, fill: { color: IBM_BLUE } });
  s.addText(title, { x: 0.4, y: 0.1, w: 9, h: 0.45, fontSize: 17, bold: true, color: WHITE });
  // Footer
  s.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.28, w: W, h: 0.28, fill: { color: GRAY_10 } });
  s.addText(`IBM Cloud — Analyse Comparative IKS vs ROKS  ·  Section ${sectionNum}`, {
    x: 0.3, y: H - 0.22, w: 9, h: 0.18, fontSize: 8, color: GRAY_70,
  });
  return s;
}

// ── COLOR BOX helper ───────────────────────────────────────
function colorBox(s, x, y, w, h, fillColor, textColor, title, bullets) {
  s.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { color: fillColor }, line: { color: fillColor } });
  s.addText(title, { x: x + 0.12, y: y + 0.05, w: w - 0.2, h: 0.28, fontSize: 10, bold: true, color: WHITE });
  const rows = bullets.map(b => [{ text: '▸  ' + b, options: { fontSize: 9, color: textColor, breakLine: false } }]);
  let ty = y + 0.36;
  bullets.forEach(b => {
    s.addText('▸  ' + b, { x: x + 0.12, y: ty, w: w - 0.2, h: 0.28, fontSize: 9, color: GRAY_100 });
    ty += 0.26;
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 1 — RÉSUMÉ EXÉCUTIF
// ═══════════════════════════════════════════════════════════
addSection(1, 'Résumé Exécutif');

{
  const s = addContent('Résumé Exécutif — Deux Plateformes, Un Écosystème', 1);

  s.addText(
    'IBM Cloud propose deux plateformes de conteneurs gérées répondant aux besoins divergents des entreprises modernes. ' +
    'Malgré leurs fondations infrastructure communes, elles représentent des approches philosophiquement distinctes de l\'orchestration de conteneurs.',
    { x: 0.4, y: 0.75, w: 9.2, h: 0.6, fontSize: 11, color: GRAY_100, lineSpacingMultiple: 1.3 }
  );

  // IKS Card
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.45, w: 4.4, h: 3.5, fill: { color: GRAY_10 }, line: { color: IKS_TEXT, w: 1.5 } });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.45, w: 4.4, h: 0.38, fill: { color: IBM_BLUE2 }, line: { color: IBM_BLUE2 } });
  s.addText('IBM Cloud Kubernetes Service (IKS)', { x: 0.4, y: 1.48, w: 4.2, h: 0.32, fontSize: 10, bold: true, color: WHITE });

  const iksBullets = [
    'Kubernetes CNCF certifié, aligné upstream',
    'Plan de contrôle entièrement géré par IBM',
    'OS : Ubuntu 20.04/22.04 LTS ou RHEL 8',
    'Runtime : containerd',
    'Tarification ressources pures (sans licence)',
    'Portabilité maximale multi-cloud',
  ];
  iksBullets.forEach((b, i) => {
    s.addText('✓  ' + b, { x: 0.45, y: 1.95 + i * 0.32, w: 4.1, h: 0.28, fontSize: 9.5, color: GRAY_100 });
  });
  s.addText('Proposition de valeur : TCO le plus bas, conformité CNCF maximale', {
    x: 0.4, y: 4.05, w: 4.2, h: 0.35, fontSize: 8.5, italic: true, color: IKS_TEXT,
  });

  // ROKS Card
  s.addShape(pptx.ShapeType.rect, { x: 5.1, y: 1.45, w: 4.4, h: 3.5, fill: { color: GRAY_10 }, line: { color: ROKS_TEXT, w: 1.5 } });
  s.addShape(pptx.ShapeType.rect, { x: 5.1, y: 1.45, w: 4.4, h: 0.38, fill: { color: RED }, line: { color: RED } });
  s.addText('Red Hat OpenShift on IBM Cloud (ROKS)', { x: 5.2, y: 1.48, w: 4.2, h: 0.32, fontSize: 10, bold: true, color: WHITE });

  const roksBullets = [
    'Red Hat OpenShift Container Platform (OCP) 4.x',
    'Plan de contrôle dédié, entièrement géré',
    'OS : RHCOS immuable ou RHEL 8',
    'Runtime : CRI-O ; SELinux enforcing',
    'Licence OCP incluse (~25–30 % surcoût)',
    'Cible exclusive des IBM Cloud Paks',
  ];
  roksBullets.forEach((b, i) => {
    s.addText('✓  ' + b, { x: 5.2, y: 1.95 + i * 0.32, w: 4.1, h: 0.28, fontSize: 9.5, color: GRAY_100 });
  });
  s.addText('Proposition de valeur : Sécurité entreprise, plateforme développeur intégrée', {
    x: 5.15, y: 4.05, w: 4.2, h: 0.35, fontSize: 8.5, italic: true, color: ROKS_TEXT,
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 2 — ARCHITECTURE & PLAN DE CONTRÔLE
// ═══════════════════════════════════════════════════════════
addSection(2, 'Analyse Architecturale\n& Mécanique du Plan de Contrôle');

// Slide 2.1 — Control Plane table
{
  const s = addContent('2.1 — Gestion du Plan de Contrôle', 2);

  s.addText('Les deux plateformes opèrent selon un modèle de plan de contrôle entièrement géré. IBM provisionne, surveille et corrige tous les composants maîtres.', {
    x: 0.4, y: 0.72, w: 9.2, h: 0.4, fontSize: 10, color: GRAY_70, italic: true,
  });

  const rows = [
    ['Aspect', 'IKS', 'ROKS'],
    ['Propriété du maître', 'Géré par IBM, dédié par cluster', 'Géré par IBM, dédié par cluster'],
    ['Réplicas HA', '3 réplicas ; 1/zone en multi-zone', '3 réplicas répartis entre zones'],
    ['etcd', 'Géré et sauvegardé par IBM', 'Géré et sauvegardé par IBM'],
    ['Correctifs maître', 'Automatiques, aucune action client', 'Automatiques, aucune action client'],
    ['Accès SSH client', 'Désactivé (sécurité renforcée)', 'Désactivé (sécurité renforcée)'],
    ['Isolation maître (VPC)', 'Dédié par cluster', 'Dédié, non partagé entre clients IBM'],
  ];

  const colW = [2.6, 3.2, 3.2];
  const colX = [0.4, 3.05, 6.3];
  const rowH = 0.42;
  const startY = 1.2;

  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const isHeader = ri === 0;
      const bg = isHeader ? IBM_BLUE : (ri % 2 === 0 ? GRAY_10 : WHITE);
      const fc = isHeader ? WHITE : (ci === 1 ? IKS_TEXT : ci === 2 ? ROKS_TEXT : GRAY_100);
      s.addShape(pptx.ShapeType.rect, {
        x: colX[ci], y: startY + ri * rowH, w: colW[ci], h: rowH,
        fill: { color: bg }, line: { color: GRAY_20, w: 0.5 },
      });
      s.addText(cell, {
        x: colX[ci] + 0.1, y: startY + ri * rowH + 0.07, w: colW[ci] - 0.15, h: rowH - 0.1,
        fontSize: isHeader ? 9.5 : 9, bold: isHeader, color: fc, valign: 'middle',
      });
    });
  });
}

// Slide 2.2 — OS comparison
{
  const s = addContent('2.2 — Systèmes d\'Exploitation des Nœuds Workers', 2);

  // IKS col
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 0.75, w: 4.4, h: 0.38, fill: { color: IBM_BLUE2 }, line: { color: IBM_BLUE2 } });
  s.addText('IKS — OS des Nœuds Workers', { x: 0.4, y: 0.78, w: 4.2, h: 0.3, fontSize: 10, bold: true, color: WHITE });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.13, w: 4.4, h: 3.55, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });

  const iksOS = [
    'Ubuntu 20.04/22.04 LTS ou RHEL 8',
    'CIS Benchmark appliqué par les SRE IBM',
    'Correctifs via ré-imagerie : ibmcloud ks worker update',
    'Runtime : containerd (conforme OCI)',
    'Chiffrement LUKS AES-256 (partition conteneurs)',
    'SSH désactivé ; clé LUKS unique par nœud',
  ];
  iksOS.forEach((b, i) => {
    s.addText('▸  ' + b, { x: 0.45, y: 1.2 + i * 0.42, w: 4.1, h: 0.36, fontSize: 9.5, color: GRAY_100 });
  });

  // ROKS col
  s.addShape(pptx.ShapeType.rect, { x: 5.1, y: 0.75, w: 4.4, h: 0.38, fill: { color: RED }, line: { color: RED } });
  s.addText('ROKS — OS des Nœuds Workers', { x: 5.2, y: 0.78, w: 4.2, h: 0.3, fontSize: 10, bold: true, color: WHITE });
  s.addShape(pptx.ShapeType.rect, { x: 5.1, y: 1.13, w: 4.4, h: 3.55, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });

  const roksOS = [
    'RHCOS — OS immuable, optimisé conteneurs',
    'Géré via Ignition ; mises à jour atomiques rpm-ostree',
    'Partitions système en lecture seule',
    'Runtime : CRI-O (mandaté par OpenShift)',
    'SELinux en mode enforcing sur tous les nœuds',
    'MachineConfigOperator gère la config OS as code',
  ];
  roksOS.forEach((b, i) => {
    s.addText('▸  ' + b, { x: 5.25, y: 1.2 + i * 0.42, w: 4.1, h: 0.36, fontSize: 9.5, color: GRAY_100 });
  });
}

// Slide 2.3 — Architecture Topology
{
  const s = addContent('2.3 — Topologie d\'Architecture Logique', 2);

  const layers = [
    {
      label: 'PLAN DE CONTRÔLE GÉRÉ PAR IBM (Dédié par cluster)',
      color: GREEN,
      nodes: [
        { t: 'Serveur API K8s', c: '166534' },
        { t: 'etcd chiffré', c: '166534' },
        { t: 'Ctrl Manager', c: '166534' },
        { t: 'Planificateur', c: '166534' },
        { t: 'Serveur OAuth [ROKS]', c: ROKS_TEXT },
        { t: 'Admission OCP [ROKS]', c: ROKS_TEXT },
      ],
    },
    {
      label: 'NŒUDS WORKERS GÉRÉS PAR LE CLIENT',
      color: IBM_BLUE2,
      nodes: [
        { t: 'kubelet', c: '166534' },
        { t: 'containerd [IKS]', c: IKS_TEXT },
        { t: 'CRI-O [ROKS]', c: ROKS_TEXT },
        { t: 'Calico CNI', c: '166534' },
        { t: 'Konnectivity', c: '166534' },
        { t: 'MachineConfig [ROKS]', c: ROKS_TEXT },
      ],
    },
    {
      label: 'COUCHE SERVICES PLATEFORME',
      color: '7C3AED',
      nodes: [
        { t: 'ALB NGINX [IKS]', c: IKS_TEXT },
        { t: 'Routeur HAProxy [ROKS]', c: ROKS_TEXT },
        { t: 'Registre Interne+COS [ROKS]', c: ROKS_TEXT },
        { t: 'OLM+OperatorHub [ROKS]', c: ROKS_TEXT },
        { t: 'OCP Pipelines [ROKS]', c: ROKS_TEXT },
      ],
    },
    {
      label: 'INFRASTRUCTURE IBM CLOUD (Classic / VPC / Satellite)',
      color: '4C1D95',
      nodes: [
        { t: 'IBM Cloud IAM', c: '4C1D95' },
        { t: 'Key Protect/HPCS', c: '4C1D95' },
        { t: 'IBM Container Registry', c: '4C1D95' },
        { t: 'VPC Security Groups', c: '4C1D95' },
        { t: 'IBM COS', c: '4C1D95' },
      ],
    },
  ];

  layers.forEach((layer, li) => {
    const baseY = 0.72 + li * 1.14;
    s.addShape(pptx.ShapeType.rect, { x: 0.3, y: baseY, w: 9.4, h: 0.22, fill: { color: layer.color }, line: { color: layer.color } });
    s.addText(layer.label, { x: 0.4, y: baseY + 0.02, w: 9, h: 0.18, fontSize: 7.5, bold: true, color: WHITE, charSpacing: 1 });

    const nw = 1.7;
    const gap = 0.1;
    layer.nodes.forEach((n, ni) => {
      const nx = 0.3 + ni * (nw + gap);
      if (nx + nw > 9.8) return;
      const bgCol = n.c === IKS_TEXT ? IKS_BG : n.c === ROKS_TEXT ? ROKS_BG : 'F0FDF4';
      s.addShape(pptx.ShapeType.rect, { x: nx, y: baseY + 0.25, w: nw, h: 0.62, fill: { color: bgCol }, line: { color: GRAY_20 }, rounding: '0.05' });
      s.addText(n.t, { x: nx + 0.05, y: baseY + 0.3, w: nw - 0.1, h: 0.52, fontSize: 8, color: n.c, align: 'center', valign: 'middle', bold: true });
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 3 — DÉPLOIEMENT & INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════
addSection(3, 'Topologies de Déploiement\n& Intégrations Infrastructure');

// Slide 3.1 — Classic vs VPC
{
  const s = addContent('3.1 — Infrastructure Classic vs. VPC', 3);

  const rows = [
    ['Attribut', 'Infrastructure Classic', 'Infrastructure VPC (Recommandée)'],
    ['Réseau workers', 'VLAN ; VRF/VLAN spanning requis (MZC)', 'Sous-réseaux VPC ; groupes de sécurité'],
    ['Visibilité workers', 'Visible dans le portail infra IBM Cloud', 'Non visible VPC ; facturé via IKS/ROKS'],
    ['Équilibreur de charge', 'MZLB auto-provisionné (MZC)', 'VPC LBs multi-zone ; tarification VPC'],
    ['Réseau sécurisé défaut', 'Non applicable', 'IKS 1.30+/ROKS 4.15+ : 4 SG auto-créés'],
    ['Services IBM', 'CSE via réseau privé IBM', 'VPE auto-créés (ICR, COS, API VPC)'],
    ['Cluster privé (IKS)', '✅ Supporté (VLAN privés)', 'Via point terminaison service privé'],
    ['Réservations IKS', '✅ 1/3 ans — économies 30–50 %', 'Remises utilisation soutenue'],
  ];

  const colW = [2.2, 3.5, 3.7];
  const colX = [0.3, 2.55, 6.1];
  const rowH = 0.43;
  const startY = 0.75;

  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const isHeader = ri === 0;
      const bg = isHeader ? IBM_BLUE : (ri % 2 === 0 ? GRAY_10 : WHITE);
      const fc = isHeader ? WHITE : GRAY_100;
      s.addShape(pptx.ShapeType.rect, {
        x: colX[ci], y: startY + ri * rowH, w: colW[ci], h: rowH,
        fill: { color: bg }, line: { color: GRAY_20, w: 0.5 },
      });
      s.addText(cell, {
        x: colX[ci] + 0.1, y: startY + ri * rowH + 0.06, w: colW[ci] - 0.15, h: rowH - 0.08,
        fontSize: isHeader ? 9 : 8.5, bold: isHeader, color: fc, valign: 'middle',
      });
    });
  });
}

// Slide 3.2 — Topologies
{
  const s = addContent('3.2 & 3.3 — Topologies de Cluster & IBM Cloud Satellite', 3);

  // SZC box
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 0.75, w: 4.35, h: 0.35, fill: { color: GRAY_70 }, line: { color: GRAY_70 } });
  s.addText('Cluster Mono-Zone (SZC)', { x: 0.4, y: 0.77, w: 4.1, h: 0.28, fontSize: 10, bold: true, color: WHITE });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.1, w: 4.35, h: 1.45, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });
  ['Workers + maîtres dans une seule zone', '3 réplicas maître pour HA process', 'Défaillance zone → cluster indisponible', 'Adapté : dev, test, CI, non-critique'].forEach((b, i) => {
    s.addText('▸  ' + b, { x: 0.45, y: 1.15 + i * 0.34, w: 4.1, h: 0.3, fontSize: 9, color: GRAY_100 });
  });

  // MZC box
  s.addShape(pptx.ShapeType.rect, { x: 5.05, y: 0.75, w: 4.65, h: 0.35, fill: { color: GREEN }, line: { color: GREEN } });
  s.addText('Cluster Multi-Zone (MZC) — Standard Production', { x: 5.15, y: 0.77, w: 4.4, h: 0.28, fontSize: 10, bold: true, color: WHITE });
  s.addShape(pptx.ShapeType.rect, { x: 5.05, y: 1.1, w: 4.65, h: 1.45, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });
  ['Workers répartis sur 2–3 zones (MZR)', '1 réplica maître par zone (3 total)', 'IKS : ALBs NGINX + MZC LB auto', 'ROKS : Routeurs par zone + VPC LBs', 'IKS : ≥1 nœud/zone  |  ROKS : ≥2/zone (4 vCPU)'].forEach((b, i) => {
    s.addText('▸  ' + b, { x: 5.15, y: 1.15 + i * 0.28, w: 4.4, h: 0.25, fontSize: 9, color: GRAY_100 });
  });

  // Satellite
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 2.7, w: 9.4, h: 0.35, fill: { color: IBM_BLUE }, line: { color: IBM_BLUE } });
  s.addText('IBM Cloud Satellite — Extension Hybride & Multi-Cloud (AWS / Azure / GCP / On-Premises)', {
    x: 0.4, y: 2.72, w: 9.2, h: 0.28, fontSize: 10, bold: true, color: WHITE,
  });

  const satCols = [
    { title: 'IKS sur Satellite', color: IBM_BLUE2, items: ['Clusters K8s standard sur infra client', 'Cas d\'usage : résidence des données, edge', 'IBM gère le plan de contrôle', 'IBM Cloud Paks : Non supportés'] },
    { title: 'ROKS sur Satellite', color: RED, items: ['Clusters OpenShift sur infra client', 'IBM Cloud Paks entièrement supportés', 'Licence OCP BYOL (abonnement Red Hat)', 'Facturation : frais fixes + vCPU + OCP'] },
    { title: 'Cohérence Commune', color: GREEN, items: ['IAM & outillage IBM Cloud centralisés', 'Monitoring & journalisation unifiés', 'SRE IBM 24/7 sur le plan de contrôle', 'Intégration CBR & Key Protect'] },
  ];

  satCols.forEach((col, ci) => {
    const x = 0.3 + ci * 3.15;
    s.addShape(pptx.ShapeType.rect, { x, y: 3.1, w: 3.05, h: 0.3, fill: { color: col.color }, line: { color: col.color } });
    s.addText(col.title, { x: x + 0.1, y: 3.12, w: 2.85, h: 0.25, fontSize: 9, bold: true, color: WHITE });
    s.addShape(pptx.ShapeType.rect, { x, y: 3.4, w: 3.05, h: 1.65, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });
    col.items.forEach((b, bi) => {
      s.addText('▸  ' + b, { x: x + 0.1, y: 3.45 + bi * 0.38, w: 2.85, h: 0.34, fontSize: 8.5, color: GRAY_100 });
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 4 — FONDATIONS COMMUNES
// ═══════════════════════════════════════════════════════════
addSection(4, 'Fondations Communes\n(Points Partagés)');

// Slide 4.1 — IBM Services table
{
  const s = addContent('4.1 — Intégration des Services IBM Cloud', 4);

  const rows = [
    ['Service IBM Cloud', 'Intégration IKS', 'Intégration ROKS'],
    ['IBM Cloud IAM', 'Rôles IAM → sync RBAC K8s', 'IAM → OAuth OCP → sync RBAC'],
    ['Key Protect', 'KMS : chiffrement secrets etcd', 'KMS : chiffrement secrets etcd'],
    ['HPCS', 'HSM FIPS 140-2 L4 ; secrets', 'TLS routes HPCS + secrets HSM'],
    ['Activity Tracker', 'Journaux audit K8s', 'Journaux audit OCP API'],
    ['IBM Log Analysis', 'Journaux workers + applis', 'Journaux workers + applis'],
    ['IBM Cloud Monitoring', 'Métriques Prometheus agent', 'Stack OCP (Prometheus+Grafana)'],
    ['IBM Container Registry', 'Registre principal ; VA ; signing', 'ICR + Registre interne ; ImageStreams'],
    ['Continuous Delivery', 'Tekton ; DevOps Toolchains', 'Toolchains + OCP Pipelines natif'],
    ['CBR', 'Accès API par zone réseau', 'Accès API par zone réseau'],
  ];

  const colW = [2.4, 3.3, 3.8];
  const colX = [0.3, 2.75, 6.1];
  const rowH = 0.385;
  const startY = 0.72;

  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const isHeader = ri === 0;
      const bg = isHeader ? IBM_BLUE : (ri % 2 === 0 ? GRAY_10 : WHITE);
      const fc = isHeader ? WHITE : GRAY_100;
      s.addShape(pptx.ShapeType.rect, {
        x: colX[ci], y: startY + ri * rowH, w: colW[ci], h: rowH,
        fill: { color: bg }, line: { color: GRAY_20, w: 0.5 },
      });
      s.addText(cell, {
        x: colX[ci] + 0.1, y: startY + ri * rowH + 0.05, w: colW[ci] - 0.15, h: rowH - 0.07,
        fontSize: isHeader ? 9 : 8.5, bold: isHeader, color: fc, valign: 'middle',
      });
    });
  });
}

// Slide 4.2 — Storage + Network
{
  const s = addContent('4.2 & 4.3 — Stockage Commun & Isolation Réseau', 4);

  // Storage
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 0.72, w: 9.4, h: 0.32, fill: { color: IBM_BLUE }, line: { color: IBM_BLUE } });
  s.addText('Couches de Stockage Communes', { x: 0.4, y: 0.74, w: 9, h: 0.26, fontSize: 10, bold: true, color: WHITE });

  const storageItems = [
    ['Block Storage (VPC/Classic)', 'CSI drivers ; volumes RWO ; chiffrement Key Protect/HPCS'],
    ['File Storage (Classic/VPC)', 'NFS ; volumes RWX ; charges de travail partagées'],
    ['Object Storage (COS)', 'Compatible S3 ; pilote CSI IBM COS (obligatoire ROKS)'],
    ['Portworx Enterprise', 'SDS ; réplication multi-zone ; chiffrement ; HA état'],
    ['ODF / Red Hat Ceph', 'ROKS uniquement : bloc+fichier+objet via OperatorHub'],
  ];
  storageItems.forEach(([name, desc], i) => {
    const bg = i % 2 === 0 ? GRAY_10 : WHITE;
    s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.06 + i * 0.38, w: 9.4, h: 0.38, fill: { color: bg }, line: { color: GRAY_20, w: 0.5 } });
    s.addText(name, { x: 0.45, y: 1.1 + i * 0.38, w: 2.8, h: 0.3, fontSize: 9, bold: true, color: IBM_BLUE });
    s.addText(desc, { x: 3.3, y: 1.1 + i * 0.38, w: 6.3, h: 0.3, fontSize: 9, color: GRAY_100 });
  });

  // Network
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 3.0, w: 9.4, h: 0.32, fill: { color: GREEN }, line: { color: GREEN } });
  s.addText('Primitives d\'Isolation Réseau Communes', { x: 0.4, y: 3.02, w: 9, h: 0.26, fontSize: 10, bold: true, color: WHITE });

  const netItems = [
    ['Calico CNI', 'Plugin CNI commun aux deux plateformes ; NetworkPolicy K8s L3/L4'],
    ['Service Endpoints Privés', 'Communications plan de contrôle via réseau privé IBM Cloud'],
    ['Groupes de Sécurité VPC', 'Règles ingress/egress NIC worker, LB et passerelle VPE'],
  ];
  netItems.forEach(([name, desc], i) => {
    const bg = i % 2 === 0 ? GRAY_10 : WHITE;
    s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 3.34 + i * 0.38, w: 9.4, h: 0.38, fill: { color: bg }, line: { color: GRAY_20, w: 0.5 } });
    s.addText(name, { x: 0.45, y: 3.38 + i * 0.38, w: 2.4, h: 0.3, fontSize: 9, bold: true, color: GREEN });
    s.addText(desc, { x: 2.9, y: 3.38 + i * 0.38, w: 6.7, h: 0.3, fontSize: 9, color: GRAY_100 });
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 5 — DISTINCTIONS CLÉS
// ═══════════════════════════════════════════════════════════
addSection(5, 'Distinctions Clés\n& Différences Opérationnelles');

// Slide 5.1 — Developer Experience
{
  const s = addContent('5.1 — Expérience Développeur & Opérateur', 5);

  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 0.72, w: 4.4, h: 0.35, fill: { color: IBM_BLUE2 }, line: { color: IBM_BLUE2 } });
  s.addText('IKS — Outillage Natif Kubernetes', { x: 0.4, y: 0.74, w: 4.2, h: 0.28, fontSize: 10, bold: true, color: WHITE });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.07, w: 4.4, h: 3.8, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });

  const iksDev = [
    ['CLI', 'kubectl + ibmcloud ks (cycle de vie clusters)'],
    ['Interface', 'IBM Cloud Console ; K8s Dashboard (manuel)'],
    ['Paquets', 'Helm 3 — standard de facto'],
    ['Opérateurs', 'Installation manuelle kubectl/Helm'],
    ['CI/CD', 'IBM CD, GitHub Actions, Jenkins, ArgoCD'],
    ['Registre', 'IBM Cloud Container Registry (externe)'],
    ['Self-service', 'Aucun portail développeur intégré'],
  ];
  iksDev.forEach(([k, v], i) => {
    s.addText(k + ' :', { x: 0.45, y: 1.12 + i * 0.5, w: 1.2, h: 0.4, fontSize: 9, bold: true, color: IKS_TEXT });
    s.addText(v, { x: 1.65, y: 1.12 + i * 0.5, w: 2.9, h: 0.4, fontSize: 9, color: GRAY_100 });
  });

  s.addShape(pptx.ShapeType.rect, { x: 5.1, y: 0.72, w: 4.6, h: 0.35, fill: { color: RED }, line: { color: RED } });
  s.addText('ROKS — Plateforme Développeur Intégrée', { x: 5.2, y: 0.74, w: 4.4, h: 0.28, fontSize: 10, bold: true, color: WHITE });
  s.addShape(pptx.ShapeType.rect, { x: 5.1, y: 1.07, w: 4.6, h: 3.8, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });

  const roksDev = [
    ['CLI', 'oc (sur-ensemble kubectl) + ibmcloud oc'],
    ['Console Web', 'Pré-installée ; perspectives Développeur + Admin'],
    ['Perspective Dev', 'Topologie, S2I, pipelines, logs intégrés'],
    ['OLM + OperatorHub', 'Pré-installés ; centaines d\'opérateurs certifiés'],
    ['CI/CD', 'OpenShift Pipelines (Tekton) pré-installé'],
    ['Registre', 'Registre interne (ImageStreams) + ICR'],
    ['Self-service', 'Déploiement guidé Git/image sans Dockerfile'],
  ];
  roksDev.forEach(([k, v], i) => {
    s.addText(k + ' :', { x: 5.25, y: 1.12 + i * 0.5, w: 1.5, h: 0.4, fontSize: 9, bold: true, color: ROKS_TEXT });
    s.addText(v, { x: 6.75, y: 1.12 + i * 0.5, w: 2.8, h: 0.4, fontSize: 9, color: GRAY_100 });
  });
}

// Slide 5.2 — Security SCC
{
  const s = addContent('5.2 — Posture de Sécurité : PSS (IKS) vs SCC (ROKS)', 5);

  // IKS PSS
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 0.72, w: 4.2, h: 0.32, fill: { color: IBM_BLUE2 }, line: { color: IBM_BLUE2 } });
  s.addText('IKS — Pod Security Standards (PSS)', { x: 0.4, y: 0.74, w: 4.0, h: 0.26, fontSize: 9.5, bold: true, color: WHITE });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.04, w: 4.2, h: 1.4, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });
  ['PSA au niveau des namespaces (privileged/baseline/restricted)', 'restricted : non-root, FS lecture seule, drop capabilities', 'Calico NetworkPolicy L3/L4 (non appliqué par défaut)', 'CIS Benchmark OS ; LUKS AES-256 ; SSH désactivé'].forEach((b, i) => {
    s.addText('▸  ' + b, { x: 0.45, y: 1.09 + i * 0.33, w: 3.95, h: 0.3, fontSize: 8.5, color: GRAY_100 });
  });

  // ROKS SCC header
  s.addShape(pptx.ShapeType.rect, { x: 4.7, y: 0.72, w: 5.0, h: 0.32, fill: { color: RED }, line: { color: RED } });
  s.addText('ROKS — Security Context Constraints (SCC) — Plus Strict par Défaut', { x: 4.8, y: 0.74, w: 4.8, h: 0.26, fontSize: 9.5, bold: true, color: WHITE });

  // SCC table
  const sccRows = [
    ['SCC', 'Attribution', 'Restrictions Clés'],
    ['restricted', 'Tous (défaut)', 'Non-root, pas d\'escalade, drop caps'],
    ['nonroot', 'Attribution explicite', 'Tout UID non-root'],
    ['anyuid', 'Attribution explicite', 'Tout UID y compris root'],
    ['hostnetwork', 'Attribution explicite', 'Accès namespace réseau hôte'],
    ['privileged', 'Admins / pods système', 'Accès complet hôte'],
  ];
  const sccColW = [1.5, 1.6, 1.85];
  const sccColX = [4.7, 6.25, 7.9];
  const sccRowH = 0.38;

  sccRows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const isHeader = ri === 0;
      const isRestricted = ri === 1;
      const isPriv = ri === sccRows.length - 1;
      const bg = isHeader ? IBM_BLUE : isRestricted ? 'FFF7ED' : isPriv ? 'FEF2F2' : (ri % 2 === 0 ? GRAY_10 : WHITE);
      s.addShape(pptx.ShapeType.rect, {
        x: sccColX[ci], y: 1.04 + ri * sccRowH, w: sccColW[ci], h: sccRowH,
        fill: { color: bg }, line: { color: GRAY_20, w: 0.5 },
      });
      s.addText(cell, {
        x: sccColX[ci] + 0.07, y: 1.04 + ri * sccRowH + 0.06, w: sccColW[ci] - 0.1, h: sccRowH - 0.1,
        fontSize: isHeader ? 8.5 : 8, bold: isHeader, color: isHeader ? WHITE : GRAY_100, valign: 'middle',
      });
    });
  });

  // Warning box
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 2.56, w: 9.4, h: 0.65, fill: { color: 'FEF2F2' }, line: { color: RED, w: 1 } });
  s.addText('⚠  Implication Migration SCC (ROKS) :', { x: 0.5, y: 2.6, w: 3, h: 0.22, fontSize: 9, bold: true, color: RED });
  s.addText('Les images s\'exécutant en root (UID 0) ou avec des UID arbitraires sont rejetées par le SCC restricted par défaut. ' +
    'Une évaluation de compatibilité SCC avant migration est fortement recommandée. ' +
    'RHCOS active SELinux en mode enforcing — contrôle d\'accès obligatoire absent sur Ubuntu (IKS).',
    { x: 0.5, y: 2.82, w: 9.0, h: 0.34, fontSize: 8.5, color: GRAY_100 });

  // Build/CI/CD
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 3.28, w: 9.4, h: 0.3, fill: { color: IBM_BLUE }, line: { color: IBM_BLUE } });
  s.addText('5.3 — Builds & Pipelines CI/CD', { x: 0.4, y: 3.3, w: 9, h: 0.24, fontSize: 9.5, bold: true, color: WHITE });

  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 3.6, w: 4.5, h: 1.35, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });
  s.addText('IKS — CI/CD Composable', { x: 0.4, y: 3.62, w: 4.2, h: 0.24, fontSize: 9, bold: true, color: IBM_BLUE2 });
  ['Aucun système de build/CI intégré', 'IBM CD Toolchains (Tekton) + Code Risk Analyzer', 'ArgoCD / Flux (GitOps via Helm)', 'GitHub Actions / GitLab CI / Jenkins'].forEach((b, i) => {
    s.addText('▸  ' + b, { x: 0.45, y: 3.9 + i * 0.27, w: 4.1, h: 0.24, fontSize: 8.5, color: GRAY_100 });
  });

  s.addShape(pptx.ShapeType.rect, { x: 5.1, y: 3.6, w: 4.6, h: 1.35, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });
  s.addText('ROKS — Build & Pipeline Intégrés', { x: 5.2, y: 3.62, w: 4.3, h: 0.24, fontSize: 9, bold: true, color: RED });
  ['OpenShift Builds (BuildConfig + webhooks)', 'Source-to-Image (S2I) : code → image sans Dockerfile', 'OpenShift Pipelines (Tekton) pré-installé', 'ImageStreams : rebuild auto sur CVE upstream'].forEach((b, i) => {
    s.addText('▸  ' + b, { x: 5.2, y: 3.9 + i * 0.27, w: 4.4, h: 0.24, fontSize: 8.5, color: GRAY_100 });
  });
}

// Slide 5.3 — Pricing
{
  const s = addContent('5.4 — Licence, Support & Modèle de Coût', 5);

  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 0.72, w: 4.4, h: 0.35, fill: { color: IBM_BLUE2 }, line: { color: IBM_BLUE2 } });
  s.addText('IKS — Consommation Pure de Ressources', { x: 0.4, y: 0.74, w: 4.2, h: 0.28, fontSize: 10, bold: true, color: WHITE });
  s.addShape(pptx.ShapeType.rect, { x: 0.3, y: 1.07, w: 4.4, h: 3.8, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });

  const iksPrice = [
    'Coût = infrastructure uniquement (vCPU + RAM + stockage)',
    'Aucun frais de licence plateforme',
    'Gestion maître incluse sans surcoût',
    'Classic : réservations 1/3 ans → 30–50 % d\'économies',
    'Coût d\'entrée le plus bas du portefeuille IBM Cloud',
    'VPC : remises utilisation soutenue disponibles',
  ];
  iksPrice.forEach((b, i) => {
    s.addText('✓  ' + b, { x: 0.45, y: 1.15 + i * 0.55, w: 4.1, h: 0.48, fontSize: 9.5, color: GRAY_100 });
  });

  s.addShape(pptx.ShapeType.rect, { x: 5.1, y: 0.72, w: 4.6, h: 0.35, fill: { color: RED }, line: { color: RED } });
  s.addText('ROKS — Calcul + Licence OCP Incluse', { x: 5.2, y: 0.74, w: 4.4, h: 0.28, fontSize: 10, bold: true, color: WHITE });
  s.addShape(pptx.ShapeType.rect, { x: 5.1, y: 1.07, w: 4.6, h: 3.8, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });

  const roksPrice = [
    'Coût = infrastructure + frais licence OCP',
    'Nouveau modèle : 1 licence / 2 vCores ; facturation horaire',
    'Ancien modèle : 1 licence / 4 vCores ; facturation mensuelle',
    'BYOL : droit Cloud Pak ou abonnement Red Hat accepté',
    'Surcoût effectif vs IKS : ~25–30 %',
    'Satellite : frais fixes + vCPU worker + vCPU OCP',
  ];
  roksPrice.forEach((b, i) => {
    s.addText('✓  ' + b, { x: 5.25, y: 1.15 + i * 0.55, w: 4.3, h: 0.48, fontSize: 9.5, color: GRAY_100 });
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 6 — MATRICE DE COMPARAISON
// ═══════════════════════════════════════════════════════════
addSection(6, 'Matrice de Comparaison\nTechnique Complète');

// Matrix slide 1 (rows 1-17)
{
  const s = addContent('Matrice Technique — Partie 1 / 2', 6);

  const rows = [
    ['Attribut', 'IKS', 'ROKS'],
    ['Distribution', 'Kubernetes CNCF certifié (upstream)', 'OCP 4.x (Red Hat)'],
    ['Version K8s', 'Dernière version mineure upstream', 'Cadence OCP (1–2 versions retard)'],
    ['Plan de Contrôle', 'Entièrement géré IBM ; dédié', 'Entièrement géré IBM ; dédié'],
    ['Maître HA', '3 réplicas ; multi-zone', '3 réplicas entre zones'],
    ['OS Workers', 'Ubuntu 22.04 LTS ou RHEL 8', 'RHCOS immuable ; RHEL 8 dispo'],
    ['Runtime', 'containerd', 'CRI-O'],
    ['SELinux', 'Non appliqué (noyau Ubuntu)', 'Enforcing sur RHCOS'],
    ['Registre Défaut', 'IBM Container Registry (externe)', 'Registre interne (COS) + ICR'],
    ['Dépendance COS', 'Optionnelle', 'Obligatoire (registre interne)'],
    ['Abstraction Image', 'Références OCI standard', 'ImageStreams + ImageStreamTags'],
    ['Authentification', 'IAM → RBAC K8s', 'IAM → OAuth OCP → RBAC K8s'],
    ['Multi-Tenant', 'Namespaces + RBAC + NetworkPolicy', 'Projects + RBAC + SCC + NetworkPolicy'],
    ['Sécurité Défaut', 'PSS Baseline/Restricted', 'SCC Restricted + SELinux enforcing'],
    ['Admission', 'Chaîne K8s standard', 'Étendue : SCC + webhooks OCP'],
    ['CLI', 'kubectl + ibmcloud ks', 'oc + kubectl + ibmcloud oc'],
    ['Console / UI', 'IBM Cloud Console ; K8s Dashboard', 'OCP Web Console Dev+Admin (pré-install)'],
  ];

  const colW = [2.3, 3.4, 3.8];
  const colX = [0.3, 2.65, 6.1];
  const rowH = 0.31;
  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const isHeader = ri === 0;
      const bg = isHeader ? IBM_BLUE : (ri % 2 === 0 ? GRAY_10 : WHITE);
      const fc = isHeader ? WHITE : (ci === 1 && !isHeader ? IKS_TEXT : ci === 2 && !isHeader ? ROKS_TEXT : GRAY_100);
      s.addShape(pptx.ShapeType.rect, {
        x: colX[ci], y: 0.72 + ri * rowH, w: colW[ci], h: rowH,
        fill: { color: bg }, line: { color: GRAY_20, w: 0.5 },
      });
      s.addText(cell, {
        x: colX[ci] + 0.08, y: 0.72 + ri * rowH + 0.04, w: colW[ci] - 0.12, h: rowH - 0.06,
        fontSize: isHeader ? 8.5 : 8, bold: isHeader, color: fc, valign: 'middle',
      });
    });
  });
}

// Matrix slide 2 (rows 18–34)
{
  const s = addContent('Matrice Technique — Partie 2 / 2', 6);

  const rows = [
    ['Attribut', 'IKS', 'ROKS'],
    ['Ingress', 'ALB NGINX (ressources Ingress)', 'Routeur HAProxy (Route + Ingress)'],
    ['Opérateurs', 'Installation manuelle (kubectl/Helm)', 'OLM + OperatorHub pré-installés'],
    ['Système Build', 'Aucun ; CI/CD externe requis', 'OCP Builds + S2I intégrés'],
    ['CI/CD Pipelines', 'IBM CD ; Tekton (installation manuelle)', 'OCP Pipelines (Tekton) pré-installé'],
    ['Service Mesh', 'Istio/Linkerd manuel', 'OCP Service Mesh via OperatorHub'],
    ['Monitoring', 'Agent IBM Cloud Monitoring ; Prometheus manuel', 'OCP Monitoring (Prometheus+Grafana) intégré'],
    ['Journalisation', 'IBM Log Analysis ; Fluentd DaemonSet', 'IBM Log Analysis ; OCP Logging (EFK/Loki)'],
    ['Cycle de Vie OS', 'Ré-imagerie : ibmcloud ks worker update', 'MachineConfigOperator (mises à jour atomiques)'],
    ['IBM Cloud Paks', 'Non supportés', 'Entièrement supportés via OperatorHub'],
    ['Virtualisation', 'Non disponible', 'KubeVirt ; opérateur ROKS 4.x'],
    ['Workers Minimum', '1 nœud par zone', '2 nœuds/zone (4 vCPU min)'],
    ['Infrastructure', 'Classic, VPC, Satellite', 'Classic, VPC, Satellite'],
    ['Cluster Privé Classic', '✅ Supporté', 'Non supporté Classic'],
    ['Modèle Tarifaire', 'Calcul pur ; sans licence plateforme', 'Calcul + licence OCP (~25–30 % surcoût)'],
    ['BYOL / Droit', 'N/A', 'Cloud Pak ou Red Hat BYOL accepté'],
    ['Portabilité', 'Élevée (APIs K8s upstream)', 'Moyenne (APIs OCP spécifiques)'],
  ];

  const colW = [2.3, 3.4, 3.8];
  const colX = [0.3, 2.65, 6.1];
  const rowH = 0.31;
  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const isHeader = ri === 0;
      const bg = isHeader ? IBM_BLUE : (ri % 2 === 0 ? GRAY_10 : WHITE);
      const fc = isHeader ? WHITE : (ci === 1 && !isHeader ? IKS_TEXT : ci === 2 && !isHeader ? ROKS_TEXT : GRAY_100);
      s.addShape(pptx.ShapeType.rect, {
        x: colX[ci], y: 0.72 + ri * rowH, w: colW[ci], h: rowH,
        fill: { color: bg }, line: { color: GRAY_20, w: 0.5 },
      });
      s.addText(cell, {
        x: colX[ci] + 0.08, y: 0.72 + ri * rowH + 0.04, w: colW[ci] - 0.12, h: rowH - 0.06,
        fontSize: isHeader ? 8.5 : 8, bold: isHeader, color: fc, valign: 'middle',
      });
    });
  });
}

// ═══════════════════════════════════════════════════════════
// SECTION 7 — GUIDE DE DÉCISION
// ═══════════════════════════════════════════════════════════
addSection(7, 'Guide de Décision\nArchitecturale');

// Slide 7.1 — Choisir IKS
{
  const s = addContent('Quand Choisir IKS ?', 7);

  const scenarios = [
    ['S1 — Optimisation Budgétaire', 'Pas de licence Red Hat existante. Le surcoût OCP de ~25–30 % n\'est pas justifié. Équipe autonome avec Helm, ArgoCD, Prometheus.'],
    ['S2 — Conformité K8s Upstream', 'Politique d\'exécution des dernières versions K8s. IKS suit la cadence upstream plus fidèlement que ROKS (1–2 versions d\'avance).'],
    ['S3 — Portabilité Multi-Cloud', 'Charges portables vers GKE, EKS, AKS. IKS utilise des APIs K8s pures ; ROKS utilise des APIs OCP spécifiques (Route, SCC, BuildConfig).'],
    ['S4 — Opérateurs Composables', 'Préférence pour composer l\'écosystème manuellement. Investissements Helm pouvant entrer en conflit avec OLM ou nécessiter des grants SCC.'],
    ['S5 — Cluster Privé Classic', 'Conformité : zéro exposition public sur Classic. IKS supporte les clusters VLAN privés uniquement ; ROKS ne propose pas cette topologie.'],
    ['S6 — Empreinte Minimale', 'Runners CI, dev/test légers ou nœuds edge. IKS : 1 worker/zone minimum. ROKS exige ≥2 workers/zone à 4 vCPU chacun.'],
  ];

  scenarios.forEach(([title, desc], i) => {
    const y = 0.72 + i * 0.78;
    s.addShape(pptx.ShapeType.rect, { x: 0.3, y, w: 2.0, h: 0.38, fill: { color: IBM_BLUE2 }, line: { color: IBM_BLUE2 } });
    s.addText(title, { x: 0.38, y: y + 0.05, w: 1.85, h: 0.28, fontSize: 8, bold: true, color: WHITE });
    s.addShape(pptx.ShapeType.rect, { x: 2.35, y, w: 7.35, h: 0.62, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });
    s.addText(desc, { x: 2.45, y: y + 0.08, w: 7.15, h: 0.5, fontSize: 9, color: GRAY_100, lineSpacingMultiple: 1.2 });
  });
}

// Slide 7.2 — Choisir ROKS
{
  const s = addContent('Quand Choisir ROKS ?', 7);

  const scenarios = [
    ['S1 — Écosystème OCP Existant', 'OCP déjà opéré sur site ou autre cloud. Cohérence totale : oc CLI, SCC, OperatorHub, API OCP. Compétences et runbooks directement transférables.'],
    ['S2 — IBM Cloud Paks Requis', 'Tout IBM Cloud Pak (Data, Integration, AIOps, Security) nécessite OpenShift. ROKS est la seule option IBM Cloud gérée.'],
    ['S3 — Sécurité & Conformité', 'Secteur réglementé (FSI, Santé, Gouvernement). RHCOS validé FIPS + SELinux enforcing + SCC par défaut sans configuration supplémentaire.'],
    ['S4 — Modernisation Applications', 'Conteneurisation guidée des applis legacy. S2I, déclencheurs BuildConfig, promotion ImageStream accélèrent le time-to-production.'],
    ['S5 — Plateforme Dev Intégrée', 'Une seule plateforme : orchestration + registre + CI/CD + catalogue + portail + monitoring. ROKS fournit tout sans composants supplémentaires.'],
    ['S6 — Standardisation via Satellite', 'IBM Cloud + sur site + edge. ROKS sur Satellite : plan de contrôle OCP cohérent dans tous les environnements depuis IBM Cloud.'],
    ['S7 — Licence BYOL', 'Abonnement Red Hat OCP ou droit Cloud Pak existant. Application du droit → suppression du surcoût OCP. Coût comparable à IKS.'],
  ];

  scenarios.forEach(([title, desc], i) => {
    const y = 0.68 + i * 0.68;
    s.addShape(pptx.ShapeType.rect, { x: 0.3, y, w: 2.0, h: 0.36, fill: { color: RED }, line: { color: RED } });
    s.addText(title, { x: 0.38, y: y + 0.04, w: 1.85, h: 0.28, fontSize: 7.8, bold: true, color: WHITE });
    s.addShape(pptx.ShapeType.rect, { x: 2.35, y, w: 7.35, h: 0.56, fill: { color: GRAY_10 }, line: { color: GRAY_20 } });
    s.addText(desc, { x: 2.45, y: y + 0.07, w: 7.15, h: 0.45, fontSize: 8.8, color: GRAY_100, lineSpacingMultiple: 1.15 });
  });
}

// Slide 7.3 — Decision Matrix Summary
{
  const s = addContent('Matrice Récapitulative de Décision', 7);

  const rows = [
    ['Facteur de Décision', 'Favorise IKS', 'Favorise ROKS'],
    ['Budget (sans licence RH existante)', '✅ Oui', '—'],
    ['IBM Cloud Paks requis', '—', '✅ Oui'],
    ['OpenShift existant sur site', '—', '✅ Oui'],
    ['Licence BYOL Red Hat / Cloud Pak', '—', '✅ Oui'],
    ['Conformité Kubernetes vanilla', '✅ Oui', '—'],
    ['Dernière version Kubernetes', '✅ Oui', '—'],
    ['Build & CI/CD intégré', '—', '✅ Oui'],
    ['Portail développeur self-service', '—', '✅ Oui'],
    ['SELinux + SCC durcissement', '—', '✅ Oui'],
    ['Conformité FSI/Santé/Gouv.', '—', '✅ Oui'],
    ['Cluster Classic privé uniquement', '✅ Oui', '—'],
    ['Empreinte minimale (1 nœud)', '✅ Oui', '—'],
    ['Écosystème OperatorHub / OLM', '—', '✅ Oui'],
    ['Portabilité multi-cloud élevée', '✅ Élevée', 'Moyenne (APIs OCP)'],
    ['S2I / Modernisation applications', '—', '✅ Oui'],
    ['Hybride cohérent via Satellite', '✅ Standard K8s', '✅ Standard OCP'],
    ['VMs + conteneurs côte à côte', '—', '✅ KubeVirt'],
  ];

  const colW = [3.9, 2.5, 3.1];
  const colX = [0.3, 4.25, 6.8];
  const rowH = 0.285;

  rows.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const isHeader = ri === 0;
      const isIKS = cell.startsWith('✅') && ci === 1;
      const isROKS = cell.startsWith('✅') && ci === 2;
      const bg = isHeader ? IBM_BLUE : (ri % 2 === 0 ? GRAY_10 : WHITE);
      const fc = isHeader ? WHITE : isIKS ? IKS_TEXT : isROKS ? ROKS_TEXT : GRAY_70;
      s.addShape(pptx.ShapeType.rect, {
        x: colX[ci], y: 0.68 + ri * rowH, w: colW[ci], h: rowH,
        fill: { color: bg }, line: { color: GRAY_20, w: 0.5 },
      });
      s.addText(cell, {
        x: colX[ci] + 0.1, y: 0.68 + ri * rowH + 0.04, w: colW[ci] - 0.15, h: rowH - 0.06,
        fontSize: isHeader ? 9 : 8.5, bold: isHeader || isIKS || isROKS, color: fc, valign: 'middle',
      });
    });
  });
}

// ── CLOSING SLIDE ──────────────────────────────────────────
{
  const s = pptx.addSlide();
  addSlideBackground(s, IBM_BLUE);
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.08, fill: { color: IBM_BLUE2 } });

  s.addText('Merci', { x: 0.5, y: 1.2, w: 9, h: 1.0, fontSize: 52, bold: true, color: WHITE, align: 'center' });
  s.addText('Pour approfondir l\'analyse :', { x: 1.5, y: 2.5, w: 7, h: 0.35, fontSize: 13, color: WHITE, transparency: 20, align: 'center' });
  s.addText('Documentation IKS : cloud.ibm.com/docs/containers', { x: 1.5, y: 3.0, w: 7, h: 0.28, fontSize: 11, color: WHITE, transparency: 30, align: 'center' });
  s.addText('Documentation ROKS : cloud.ibm.com/docs/openshift', { x: 1.5, y: 3.32, w: 7, h: 0.28, fontSize: 11, color: WHITE, transparency: 30, align: 'center' });

  s.addText('IBM Cloud Architecture  ·  Référence Architecture Technique  ·  2025', {
    x: 0.5, y: 4.6, w: 9, h: 0.25, fontSize: 9, color: WHITE, transparency: 40, align: 'center',
  });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: H - 0.06, w: W, h: 0.06, fill: { color: IBM_BLUE2 } });
}

// ── WRITE FILE ─────────────────────────────────────────────
const outPath = path.resolve(__dirname, '../bob/artifacts/IKS-vs-ROKS-Analyse-Comparative.pptx');
pptx.writeFile({ fileName: outPath })
  .then(() => console.log('✅ PPTX écrit : ' + outPath))
  .catch(e => { console.error('❌ Erreur :', e); process.exit(1); });
