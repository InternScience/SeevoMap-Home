import type { MapNode } from "./types";
import { getPublicDomainGroup } from "./publicDomains";

export interface PublicDomainAnchor {
  key: string;
  label: string;
  x: number;
}

export interface ScaleAxisAnchor {
  key: string;
  label: string;
  x: number;
  spread: number;
}

export interface SemanticMaturityBand {
  key: string;
  label: string;
  y: number;
  layoutY?: number;
}

export interface SemanticProjection {
  x: number;
  y: number;
  anchor: PublicDomainAnchor;
  scaleAnchor: ScaleAxisAnchor;
  maturity: SemanticMaturityBand;
}

export interface SemanticNodeProjection extends SemanticProjection {
  node: MapNode;
}

interface DensityLobe {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  weight: number;
}

interface SemanticField {
  positive: DensityLobe[];
  negative?: DensityLobe[];
}

interface FieldSample {
  x: number;
  y: number;
  density: number;
}

interface LayoutEntry {
  node: MapNode;
  normalizedDomain: string;
  anchor: PublicDomainAnchor;
  scaleAnchor: ScaleAxisAnchor;
  maturity: SemanticMaturityBand;
  normX: number;
  cohortNormX: number;
  cohortKey: string;
  cohortIndex: number;
  cohortSize: number;
}

interface AssignmentTarget {
  x: number;
  y: number;
  xWeight: number;
  yWeight: number;
  priority: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface DomainPlacementRule {
  focusX: number;
  focusY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  xWeight: number;
  yWeight: number;
  clusterScaleX: number;
  clusterScaleY: number;
  centerYOffset: number;
}

const DOMAIN_ANCHORS: PublicDomainAnchor[] = [
  { key: "information_science", label: "Information Science", x: 0.14 },
  { key: "mathematics", label: "Mathematics", x: 0.26 },
  { key: "physics", label: "Physics", x: 0.38 },
  { key: "chemistry", label: "Chemistry", x: 0.52 },
  { key: "life_science", label: "Life Science", x: 0.64 },
  { key: "medicine", label: "Medicine", x: 0.73 },
  { key: "engineering", label: "Engineering", x: 0.47 },
  { key: "earth_space", label: "Earth & Space", x: 0.18 },
  { key: "economics", label: "Economics", x: 0.32 },
];

const SCALE_ANCHORS: ScaleAxisAnchor[] = [
  { key: "universe", label: "Universe", x: 0.12, spread: 0.07 },
  { key: "celestial", label: "Celestial", x: 0.22, spread: 0.075 },
  { key: "systems", label: "Systems", x: 0.35, spread: 0.13 },
  { key: "devices", label: "Devices", x: 0.48, spread: 0.11 },
  { key: "materials", label: "Materials", x: 0.61, spread: 0.1 },
  { key: "molecules", label: "Molecules", x: 0.73, spread: 0.085 },
  { key: "genes", label: "Genes", x: 0.84, spread: 0.075 },
  { key: "quantum", label: "Quantum", x: 0.93, spread: 0.06 },
];

const MATURITY_BANDS: SemanticMaturityBand[] = [
  { key: "hypothesis_led", label: "Foundational Theory", y: 0.18, layoutY: 0.19 },
  { key: "mechanism_proposal", label: "Core Mechanism", y: 0.31, layoutY: 0.31 },
  { key: "experiment_loop", label: "Applied Development", y: 0.46, layoutY: 0.49 },
  { key: "execution_ready", label: "Clinical / Engineering", y: 0.68, layoutY: 0.67 },
];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const MASTER_FIELD: SemanticField = {
  positive: [
    { cx: 0.23, cy: 0.29, rx: 0.11, ry: 0.09, weight: 0.98 },
    { cx: 0.35, cy: 0.245, rx: 0.11, ry: 0.09, weight: 1.04 },
    { cx: 0.46, cy: 0.2, rx: 0.11, ry: 0.1, weight: 1.14 },
    { cx: 0.56, cy: 0.19, rx: 0.11, ry: 0.1, weight: 1.16 },
    { cx: 0.66, cy: 0.225, rx: 0.1, ry: 0.095, weight: 1.08 },
    { cx: 0.74, cy: 0.28, rx: 0.09, ry: 0.095, weight: 0.98 },
    { cx: 0.51, cy: 0.45, rx: 0.095, ry: 0.12, weight: 0.92 },
    { cx: 0.49, cy: 0.62, rx: 0.15, ry: 0.125, weight: 1.3 },
    { cx: 0.46, cy: 0.62, rx: 0.095, ry: 0.095, weight: 1.04 },
  ],
  negative: [
    { cx: 0.52, cy: 0.53, rx: 0.16, ry: 0.08, weight: 0.22 },
    { cx: 0.14, cy: 0.54, rx: 0.05, ry: 0.16, weight: 0.28 },
    { cx: 0.83, cy: 0.54, rx: 0.06, ry: 0.13, weight: 0.18 },
  ],
};

const DOMAIN_SCALE_KEY_MAP: Record<string, string> = {
  astronomy: "universe",
  earth_space: "celestial",
  earth_science: "celestial",
  economics: "systems",
  information_science: "systems",
  pretraining: "systems",
  posttraining: "devices",
  engineering: "devices",
  energy_systems: "devices",
  model_compression: "materials",
  materials_science: "materials",
  chemistry: "molecules",
  life_science: "genes",
  life_sciences: "genes",
  medicine: "genes",
  neuroscience: "genes",
  mathematics: "quantum",
  physics: "quantum",
};

const GROUP_SCALE_KEY_MAP: Record<string, string> = {
  information_science: "systems",
  mathematics: "quantum",
  physics: "quantum",
  chemistry: "molecules",
  life_science: "genes",
  medicine: "genes",
  engineering: "devices",
  earth_space: "celestial",
  economics: "systems",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeLabelKey(label: string): string {
  return (label || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

function seededRatio(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return (hash % 10000) / 10000;
}

function normalize(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max - min < 1e-6) {
    return fallback;
  }
  return clamp((value - min) / (max - min), 0, 1);
}

function halton(index: number, base: number): number {
  let result = 0;
  let fraction = 1 / base;
  let current = index;
  while (current > 0) {
    result += fraction * (current % base);
    current = Math.floor(current / base);
    fraction /= base;
  }
  return result;
}

function getAnchorByKey(key: string): PublicDomainAnchor {
  return DOMAIN_ANCHORS.find((anchor) => anchor.key === key) || DOMAIN_ANCHORS[0];
}

function getScaleAnchorByKey(key: string): ScaleAxisAnchor {
  return SCALE_ANCHORS.find((anchor) => anchor.key === key) || SCALE_ANCHORS[2];
}

function getFieldBounds(field: SemanticField) {
  const lobes = [...field.positive, ...(field.negative ?? [])];
  const minX = Math.min(...lobes.map((lobe) => lobe.cx - lobe.rx));
  const maxX = Math.max(...lobes.map((lobe) => lobe.cx + lobe.rx));
  const minY = Math.min(...lobes.map((lobe) => lobe.cy - lobe.ry));
  const maxY = Math.max(...lobes.map((lobe) => lobe.cy + lobe.ry));
  return { minX, maxX, minY, maxY };
}

function getLobeInfluence(lobe: DensityLobe, x: number, y: number): number {
  const dx = (x - lobe.cx) / lobe.rx;
  const dy = (y - lobe.cy) / lobe.ry;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance >= 1) {
    return 0;
  }
  return Math.pow(1 - distance, 1.85) * lobe.weight;
}

function getFieldDensity(field: SemanticField, x: number, y: number): number {
  const positive = field.positive.reduce((sum, lobe) => sum + getLobeInfluence(lobe, x, y), 0);
  const negative = (field.negative ?? []).reduce((sum, lobe) => sum + getLobeInfluence(lobe, x, y), 0);
  return Math.max(0, positive - negative * 1.08);
}

function generateFieldSamples(count: number, field: SemanticField, prefix: string): FieldSample[] {
  if (count === 0) return [];

  const bounds = getFieldBounds(field);
  const samples: FieldSample[] = [];
  const targetCount = Math.ceil(count * 1.28);
  const offsetX = seededRatio(`${prefix}:offset-x`);
  const offsetY = seededRatio(`${prefix}:offset-y`);
  const maxAttempts = Math.max(targetCount * 120, 1800);

  for (let attempt = 1; attempt <= maxAttempts && samples.length < targetCount; attempt += 1) {
    const rawX = (halton(attempt, 2) + offsetX) % 1;
    const rawY = (halton(attempt, 3) + offsetY) % 1;
    const x = bounds.minX + rawX * (bounds.maxX - bounds.minX);
    const y = bounds.minY + rawY * (bounds.maxY - bounds.minY);
    const density = getFieldDensity(field, x, y);
    if (density <= 0.08) continue;

    const accept = Math.min(1, 0.14 + density * 0.78);
    if (seededRatio(`${prefix}:accept:${attempt}`) <= accept) {
      samples.push({ x, y, density });
    }
  }

  while (samples.length < targetCount) {
    const lobe = field.positive[samples.length % field.positive.length];
    samples.push({ x: lobe.cx, y: lobe.cy, density: lobe.weight });
  }

  return samples;
}

function pullToward(value: number, target: number, weight: number): number {
  return value + (target - value) * weight;
}

function getCohortMassiness(cohortSize: number): number {
  return clamp((Math.log2(cohortSize + 1) - 4.5) / 6.5, 0, 1);
}

function getDomainPlacementRule(entry: LayoutEntry): DomainPlacementRule {
  const domain = entry.normalizedDomain;

  if (domain === "pretraining") {
    return {
      focusX: 0.458,
      focusY: 0.626,
      minX: 0.37,
      maxX: 0.55,
      minY: 0.52,
      maxY: 0.72,
      xWeight: 1.7,
      yWeight: 1.08,
      clusterScaleX: 0.92,
      clusterScaleY: 1.08,
      centerYOffset: 0.002,
    };
  }

  if (domain === "posttraining") {
    return {
      focusX: 0.476,
      focusY: 0.628,
      minX: 0.39,
      maxX: 0.57,
      minY: 0.52,
      maxY: 0.72,
      xWeight: 1.72,
      yWeight: 1.08,
      clusterScaleX: 0.94,
      clusterScaleY: 1.06,
      centerYOffset: 0,
    };
  }

  if (domain === "model_compression") {
    return {
      focusX: 0.515,
      focusY: 0.49,
      minX: 0.45,
      maxX: 0.57,
      minY: 0.41,
      maxY: 0.56,
      xWeight: 1.58,
      yWeight: 1,
      clusterScaleX: 0.72,
      clusterScaleY: 0.82,
      centerYOffset: 0,
    };
  }

  if (domain === "mathematics") {
    return {
      focusX: 0.69,
      focusY: 0.265,
      minX: 0.64,
      maxX: 0.75,
      minY: 0.18,
      maxY: 0.36,
      xWeight: 1.68,
      yWeight: 1.02,
      clusterScaleX: 0.72,
      clusterScaleY: 0.8,
      centerYOffset: 0.004,
    };
  }

  if (domain === "physics") {
    return {
      focusX: 0.75,
      focusY: 0.282,
      minX: 0.7,
      maxX: 0.81,
      minY: 0.2,
      maxY: 0.39,
      xWeight: 1.7,
      yWeight: 1.02,
      clusterScaleX: 0.7,
      clusterScaleY: 0.78,
      centerYOffset: 0.01,
    };
  }

  if (domain === "chemistry") {
    return {
      focusX: 0.53,
      focusY: 0.19,
      minX: 0.48,
      maxX: 0.58,
      minY: 0.13,
      maxY: 0.29,
      xWeight: 1.48,
      yWeight: 0.98,
      clusterScaleX: 0.7,
      clusterScaleY: 0.74,
      centerYOffset: -0.006,
    };
  }

  if (
    domain === "life_science" ||
    domain === "life_sciences" ||
    domain === "neuroscience"
  ) {
    return {
      focusX: 0.6,
      focusY: 0.202,
      minX: 0.55,
      maxX: 0.66,
      minY: 0.14,
      maxY: 0.3,
      xWeight: 1.44,
      yWeight: 0.96,
      clusterScaleX: 0.7,
      clusterScaleY: 0.74,
      centerYOffset: -0.002,
    };
  }

  if (domain === "medicine") {
    return {
      focusX: 0.64,
      focusY: 0.223,
      minX: 0.59,
      maxX: 0.7,
      minY: 0.16,
      maxY: 0.32,
      xWeight: 1.48,
      yWeight: 0.98,
      clusterScaleX: 0.68,
      clusterScaleY: 0.74,
      centerYOffset: 0.002,
    };
  }

  if (domain === "engineering" || domain === "energy_systems") {
    return {
      focusX: 0.45,
      focusY: 0.208,
      minX: 0.425,
      maxX: 0.485,
      minY: 0.14,
      maxY: 0.36,
      xWeight: 1.58,
      yWeight: 0.94,
      clusterScaleX: 0.46,
      clusterScaleY: 1.2,
      centerYOffset: -0.002,
    };
  }

  if (
    domain === "earth_space" ||
    domain === "earth_science" ||
    domain === "astronomy"
  ) {
    return {
      focusX: 0.23,
      focusY: 0.29,
      minX: 0.18,
      maxX: 0.29,
      minY: 0.2,
      maxY: 0.38,
      xWeight: 1.42,
      yWeight: 0.92,
      clusterScaleX: 0.76,
      clusterScaleY: 0.72,
      centerYOffset: 0.004,
    };
  }

  if (domain === "economics") {
    return {
      focusX: 0.34,
      focusY: 0.252,
      minX: 0.29,
      maxX: 0.4,
      minY: 0.18,
      maxY: 0.34,
      xWeight: 1.4,
      yWeight: 0.94,
      clusterScaleX: 0.68,
      clusterScaleY: 0.74,
      centerYOffset: 0,
    };
  }

  if (domain === "materials_science") {
    return {
      focusX: 0.49,
      focusY: 0.23,
      minX: 0.4,
      maxX: 0.58,
      minY: 0.16,
      maxY: 0.35,
      xWeight: 1.42,
      yWeight: 0.94,
      clusterScaleX: 0.78,
      clusterScaleY: 0.74,
      centerYOffset: -0.002,
    };
  }

  if (entry.anchor.key === "information_science") {
    return {
      focusX: 0.43,
      focusY: 0.56,
      minX: 0.31,
      maxX: 0.52,
      minY: 0.4,
      maxY: 0.76,
      xWeight: 1.52,
      yWeight: 0.98,
      clusterScaleX: 0.76,
      clusterScaleY: 0.88,
      centerYOffset: 0.004,
    };
  }

  return {
    focusX: entry.scaleAnchor.x,
    focusY: entry.maturity.y,
    minX: Math.max(0.08, entry.scaleAnchor.x - 0.11),
    maxX: Math.min(0.96, entry.scaleAnchor.x + 0.11),
    minY: 0.12,
    maxY: 0.88,
    xWeight: 1.32,
    yWeight: 0.94,
    clusterScaleX: 0.76,
    clusterScaleY: 0.82,
    centerYOffset: 0,
  };
}

function getCohortRadii(entry: LayoutEntry, rule: DomainPlacementRule) {
  const cohortScale = Math.min(Math.sqrt(entry.cohortSize), 36);
  const massiness = getCohortMassiness(entry.cohortSize);
  const radiusX =
    Math.min(
    (rule.maxX - rule.minX) * 0.38,
    (0.008 + cohortScale * 0.0018) * rule.clusterScaleX,
    ) * (1 - massiness * 0.28);
  const radiusY =
    Math.min(
    (rule.maxY - rule.minY) * 0.28,
    (0.01 + cohortScale * 0.00135) * rule.clusterScaleY,
    ) * (1 - massiness * 0.24);

  return { radiusX, radiusY };
}

function getScaleSag(x: number, maturity: SemanticMaturityBand): number {
  const phase = clamp((x - 0.12) / 0.82, 0, 1);
  const arch = Math.sin(phase * Math.PI);
  const strength =
    maturity.key === "hypothesis_led"
      ? -0.018
      : maturity.key === "mechanism_proposal"
        ? -0.013
        : maturity.key === "experiment_loop"
          ? -0.006
          : 0.008;

  return arch * strength;
}

function getSceneTarget(entry: LayoutEntry): AssignmentTarget {
  const rule = getDomainPlacementRule(entry);
  const cohortSeedX = seededRatio(`${entry.cohortKey}:center-x`) - 0.5;
  const cohortSeedY = seededRatio(`${entry.cohortKey}:center-y`) - 0.5;
  const driftX = seededRatio(`${entry.node.id}:scene-target-x`) - 0.5;
  const driftY = seededRatio(`${entry.node.id}:scene-target-y`) - 0.5;
  const massiness = getCohortMassiness(entry.cohortSize);
  const anchorNormX = entry.cohortSize >= 80 ? entry.cohortNormX : entry.normX;
  const normXSpreadWeight = entry.cohortSize >= 80 ? 0.14 : entry.cohortSize > 1 ? 0.28 : 0.54;
  const focusPull = entry.cohortSize >= 80 ? 0.74 : 0.62;

  const baseX = pullToward(
    entry.scaleAnchor.x + (anchorNormX - 0.5) * entry.scaleAnchor.spread * normXSpreadWeight,
    rule.focusX,
    focusPull,
  );
  const centerX = clamp(baseX + cohortSeedX * 0.012, rule.minX + 0.01, rule.maxX - 0.01);
  const maturityBaseY = (entry.maturity.layoutY ?? entry.maturity.y) + getScaleSag(centerX, entry.maturity);
  const blendedY = pullToward(maturityBaseY, rule.focusY, 0.78);
  const centerY = clamp(
    blendedY + rule.centerYOffset + cohortSeedY * 0.01,
    rule.minY + 0.01,
    rule.maxY - 0.01,
  );

  const { radiusX, radiusY } = getCohortRadii(entry, rule);
  const cohortAngleOffset = seededRatio(`${entry.cohortKey}:angle`) * Math.PI * 2;
  const angleJitter = (seededRatio(`${entry.node.id}:cohort-angle-jitter`) - 0.5) * (0.18 + massiness * 0.46);
  const angle =
    entry.cohortSize > 1
      ? cohortAngleOffset + GOLDEN_ANGLE * entry.cohortIndex + angleJitter
      : cohortAngleOffset + seededRatio(`${entry.node.id}:single-angle`) * Math.PI * 2 + angleJitter;
  const radial =
    entry.cohortSize > 1
      ? Math.pow((entry.cohortIndex + 0.5) / entry.cohortSize, 0.6 + massiness * 0.6)
      : 0.18 + seededRatio(`${entry.node.id}:single-radius`) * 0.28;
  const x = clamp(
    centerX + Math.cos(angle) * radiusX * radial + driftX * radiusX * (0.18 - massiness * 0.1),
    rule.minX,
    rule.maxX,
  );
  const y = clamp(
    centerY + Math.sin(angle) * radiusY * radial + driftY * radiusY * (0.22 - massiness * 0.12),
    rule.minY,
    rule.maxY,
  );
  const padX = Math.max(radiusX * (1.65 - massiness * 0.7), 0.035 + (1 - massiness) * 0.025);
  const padY = Math.max(radiusY * (1.8 - massiness * 0.78), 0.03 + (1 - massiness) * 0.025);
  const minX = Math.max(rule.minX, centerX - padX);
  const maxX = Math.min(rule.maxX, centerX + padX);
  const minY = Math.max(rule.minY, centerY - padY);
  const maxY = Math.min(rule.maxY, centerY + padY);

  return {
    x,
    y,
    xWeight: rule.xWeight,
    yWeight: rule.yWeight,
    priority:
      Math.abs(x - 0.52) * 0.9 +
      Math.abs(y - 0.5) * 1.1 +
      Math.min(1, Math.log2(entry.cohortSize + 1) * 0.12),
    minX,
    maxX,
    minY,
    maxY,
  };
}

function assignNodesToField(
  entries: LayoutEntry[],
  samples: FieldSample[],
): SemanticNodeProjection[] {
  const pool = [...samples];
  const assignments = entries
    .map((entry) => ({ entry, target: getSceneTarget(entry) }))
    .sort(
      (left, right) =>
        right.target.priority - left.target.priority ||
        left.target.x - right.target.x ||
        left.entry.node.id.localeCompare(right.entry.node.id),
    );

  const projections: SemanticNodeProjection[] = [];

  for (const { entry, target } of assignments) {
    const massiness = getCohortMassiness(entry.cohortSize);
    if (entry.normalizedDomain === "model_compression" && entry.cohortSize >= 12 && entry.cohortSize < 80) {
      const angle = seededRatio(`${entry.node.id}:compression-cluster-angle`) * Math.PI * 2;
      const radial = Math.sqrt(seededRatio(`${entry.node.id}:compression-cluster-radius`));
      const jitterX = seededRatio(`${entry.node.id}:compression-cluster-jitter-x`) - 0.5;
      const jitterY = seededRatio(`${entry.node.id}:compression-cluster-jitter-y`) - 0.5;
      const centerX = 0.52;
      const centerY = 0.492;
      const radiusX = 0.03;
      const radiusY = 0.026;

      projections.push({
        node: entry.node,
        x: clamp(centerX + Math.cos(angle) * radiusX * radial + jitterX * radiusX * 0.03, 0.47, 0.56),
        y: clamp(centerY + Math.sin(angle) * radiusY * radial + jitterY * radiusY * 0.03, 0.45, 0.54),
        anchor: entry.anchor,
        scaleAnchor: entry.scaleAnchor,
        maturity: entry.maturity,
      });
      continue;
    }

    if (entry.cohortSize >= 80) {
      const angle = seededRatio(`${entry.node.id}:direct-cloud-angle`) * Math.PI * 2;
      const radial = Math.pow(seededRatio(`${entry.node.id}:direct-cloud-radius`), 1.12 + massiness * 0.4);
      const jitterX = seededRatio(`${entry.node.id}:direct-cloud-jitter-x`) - 0.5;
      const jitterY = seededRatio(`${entry.node.id}:direct-cloud-jitter-y`) - 0.5;

      if (entry.anchor.key === "information_science" && entry.cohortSize >= 600) {
        const isCompression = entry.normalizedDomain === "model_compression";
        const directAngle = seededRatio(`${entry.node.id}:info-oval-angle`) * Math.PI * 2;
        const directRadial = isCompression
          ? Math.pow(seededRatio(`${entry.node.id}:info-oval-radius`), 0.68)
          : Math.sqrt(seededRatio(`${entry.node.id}:info-oval-radius`));
        const directJitterX = seededRatio(`${entry.node.id}:info-oval-jitter-x`) - 0.5;
        const directJitterY = seededRatio(`${entry.node.id}:info-oval-jitter-y`) - 0.5;
        const coreSeedX = isCompression ? seededRatio(`${entry.cohortKey}:info-core-x`) - 0.5 : 0;
        const coreSeedY = isCompression ? seededRatio(`${entry.cohortKey}:info-core-y`) - 0.5 : 0;
        const centerX = (isCompression ? 0.52 : 0.468) + coreSeedX * (isCompression ? 0.01 : 0);
        const centerY = (isCompression ? 0.49 : 0.632) + coreSeedY * (isCompression ? 0.008 : 0);
        const radiusX = isCompression ? 0.036 : 0.09;
        const radiusY = isCompression ? 0.03 : 0.075;
        const minX = isCompression ? Math.max(target.minX, centerX - radiusX * 1.08) : centerX - radiusX * 1.02;
        const maxX = isCompression ? Math.min(target.maxX, centerX + radiusX * 1.08) : centerX + radiusX * 1.02;
        const minY = isCompression ? Math.max(target.minY, centerY - radiusY * 1.08) : centerY - radiusY * 1.02;
        const maxY = isCompression ? Math.min(target.maxY, centerY + radiusY * 1.08) : centerY + radiusY * 1.02;

        projections.push({
          node: entry.node,
          x: clamp(
            centerX +
              Math.cos(directAngle) * radiusX * directRadial +
              directJitterX * radiusX * (isCompression ? 0.05 : 0.035),
            minX,
            maxX,
          ),
          y: clamp(
            centerY +
              Math.sin(directAngle) * radiusY * directRadial +
              directJitterY * radiusY * (isCompression ? 0.05 : 0.035),
            minY,
            maxY,
          ),
          anchor: entry.anchor,
          scaleAnchor: entry.scaleAnchor,
          maturity: entry.maturity,
        });
        continue;
      }

      const cloudWidth = target.maxX - target.minX;
      const cloudHeight = target.maxY - target.minY;
      const radiusX = Math.max(
        entry.anchor.key === "information_science" ? cloudWidth * 0.34 : cloudWidth * 0.3,
        0.02,
      );
      const radiusY = Math.max(
        entry.anchor.key === "information_science" ? cloudHeight * 0.48 : cloudHeight * 0.34,
        0.022,
      );

      projections.push({
        node: entry.node,
        x: clamp(
          target.x + Math.cos(angle) * radiusX * radial + jitterX * radiusX * 0.08,
          target.minX,
          target.maxX,
        ),
        y: clamp(
          target.y + Math.sin(angle) * radiusY * radial + jitterY * radiusY * 0.08,
          target.minY,
          target.maxY,
        ),
        anchor: entry.anchor,
        scaleAnchor: entry.scaleAnchor,
        maturity: entry.maturity,
      });
      continue;
    }

    const xPull = 0.12 + massiness * 0.24;
    const yPull = 0.1 + massiness * 0.26;
    const jitterScaleX = 0.008 - massiness * 0.0048;
    const jitterScaleY = 0.01 - massiness * 0.006;
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let index = 0; index < pool.length; index += 1) {
      const sample = pool[index];
      const dx = sample.x - target.x;
      const dy = sample.y - target.y;
      const score = dx * dx * target.xWeight + dy * dy * target.yWeight - sample.density * 0.01;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    const sample = pool[bestIndex];
    pool[bestIndex] = pool[pool.length - 1];
    pool.pop();

    projections.push({
      node: entry.node,
      x: clamp(
        pullToward(sample.x, target.x, xPull) + (seededRatio(`${entry.node.id}:jitter-x`) - 0.5) * jitterScaleX,
        target.minX,
        target.maxX,
      ),
      y: clamp(
        pullToward(sample.y, target.y, yPull) + (seededRatio(`${entry.node.id}:jitter-y`) - 0.5) * jitterScaleY,
        target.minY,
        target.maxY,
      ),
      anchor: entry.anchor,
      scaleAnchor: entry.scaleAnchor,
      maturity: entry.maturity,
    });
  }

  return projections;
}

export function getPublicDomainAnchor(rawDomain: string): PublicDomainAnchor {
  const group = getPublicDomainGroup(rawDomain);
  return getAnchorByKey(group?.key || "information_science");
}

export function getScaleAxisAnchor(rawDomain: string): ScaleAxisAnchor {
  const normalized = (rawDomain || "").toLowerCase();
  const directKey = DOMAIN_SCALE_KEY_MAP[normalized];
  if (directKey) {
    return getScaleAnchorByKey(directKey);
  }

  const group = getPublicDomainGroup(normalized);
  return getScaleAnchorByKey(GROUP_SCALE_KEY_MAP[group?.key || "information_science"] || "systems");
}

export function getSemanticMaturityBand(node: MapNode): SemanticMaturityBand {
  const metric = (node.metric_name || "").toLowerCase();
  const source = (node.source || "").toLowerCase();
  const idea = (node.idea || "").toLowerCase();

  if (node.status === "hypothesis") {
    return MATURITY_BANDS[0];
  }

  if (
    node.status === "pending" ||
    metric.includes("novelty") ||
    metric.includes("checklist") ||
    source.includes("ideaminer") ||
    source.includes("scivbook") ||
    idea.includes("research plan")
  ) {
    return MATURITY_BANDS[1];
  }

  if (node.success !== undefined || node.status === "approved" || node.status === "rejected") {
    return MATURITY_BANDS[3];
  }

  return MATURITY_BANDS[2];
}

export function projectSemanticNode(node: MapNode): SemanticProjection {
  const anchor = getPublicDomainAnchor(node.domain);
  const scaleAnchor = getScaleAxisAnchor(node.domain);
  const maturity = getSemanticMaturityBand(node);
  const normalizedDomain = (node.domain || "").toLowerCase();
  const entry: LayoutEntry = {
    node,
    normalizedDomain,
    anchor,
    scaleAnchor,
    maturity,
    normX: 0.5,
    cohortNormX: 0.5,
    cohortKey: `${normalizedDomain}:${normalizeLabelKey(node.label || node.id)}`,
    cohortIndex: 0,
    cohortSize: 1,
  };
  const rule = getDomainPlacementRule(entry);
  const jitterX = seededRatio(`${node.id}:project-x`) - 0.5;
  const jitterY = seededRatio(`${node.id}:project-y`) - 0.5;
  const x = clamp(
    pullToward(scaleAnchor.x, rule.focusX, 0.58) + jitterX * Math.min(scaleAnchor.spread * 0.32, 0.03),
    rule.minX,
    rule.maxX,
  );
  const maturityBaseY = (maturity.layoutY ?? maturity.y) + getScaleSag(x, maturity);
  const y = clamp(
    pullToward(maturityBaseY, rule.focusY, 0.78) + rule.centerYOffset + jitterY * 0.024,
    rule.minY,
    rule.maxY,
  );

  return {
    x,
    y,
    anchor,
    scaleAnchor,
    maturity,
  };
}

export function layoutSemanticNodes(nodes: MapNode[]): SemanticNodeProjection[] {
  if (nodes.length === 0) return [];

  const globalMinX = Math.min(...nodes.map((node) => node.x));
  const globalMaxX = Math.max(...nodes.map((node) => node.x));

  const entries = nodes.map((node) => ({
    node,
    normalizedDomain: (node.domain || "").toLowerCase(),
    anchor: getPublicDomainAnchor(node.domain),
    scaleAnchor: getScaleAxisAnchor(node.domain),
    maturity: getSemanticMaturityBand(node),
    normX: normalize(node.x, globalMinX, globalMaxX, seededRatio(`${node.id}:norm-x`)),
    cohortNormX: 0.5,
    cohortKey: "",
    cohortIndex: 0,
    cohortSize: 1,
  }));

  const cohorts = new Map<string, LayoutEntry[]>();
  for (const entry of entries) {
    entry.cohortKey = `${entry.normalizedDomain}:${normalizeLabelKey(entry.node.label || entry.node.id)}`;
    const bucket = cohorts.get(entry.cohortKey) ?? [];
    bucket.push(entry);
    cohorts.set(entry.cohortKey, bucket);
  }

  for (const bucket of cohorts.values()) {
    const cohortNormX =
      bucket.reduce((sum, entry) => sum + entry.normX, 0) / Math.max(bucket.length, 1);
    bucket.sort((left, right) => left.node.id.localeCompare(right.node.id));
    bucket.forEach((entry, index) => {
      entry.cohortIndex = index;
      entry.cohortSize = bucket.length;
      entry.cohortNormX = cohortNormX;
    });
  }

  const samples = generateFieldSamples(entries.length, MASTER_FIELD, "master:scale-scene");
  return assignNodesToField(entries, samples);
}

export function getSemanticDomainAnchors(): PublicDomainAnchor[] {
  return DOMAIN_ANCHORS;
}

export function getSemanticScaleAnchors(): ScaleAxisAnchor[] {
  return SCALE_ANCHORS.map(({ spread: _spread, ...anchor }) => ({
    ...anchor,
    spread: _spread,
  }));
}

export function getSemanticMaturityBands(): SemanticMaturityBand[] {
  return MATURITY_BANDS;
}
