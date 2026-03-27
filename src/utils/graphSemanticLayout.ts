import type { MapNode } from "./types";
import { getPublicDomainGroup } from "./publicDomains";

export interface PublicDomainAnchor {
  key: string;
  label: string;
  x: number;
}

export interface SemanticMaturityBand {
  key: string;
  label: string;
  y: number;
}

export interface SemanticProjection {
  x: number;
  y: number;
  anchor: PublicDomainAnchor;
  maturity: SemanticMaturityBand;
}

export interface SemanticNodeProjection extends SemanticProjection {
  node: MapNode;
}

const DOMAIN_ANCHORS: PublicDomainAnchor[] = [
  { key: "information_science", label: "Information Science", x: 0.08 },
  { key: "mathematics", label: "Mathematics", x: 0.18 },
  { key: "physics", label: "Physics", x: 0.28 },
  { key: "chemistry", label: "Chemistry", x: 0.39 },
  { key: "life_science", label: "Life Science", x: 0.5 },
  { key: "medicine", label: "Medicine", x: 0.6 },
  { key: "engineering", label: "Engineering", x: 0.72 },
  { key: "earth_space", label: "Earth & Space", x: 0.84 },
  { key: "economics", label: "Economics", x: 0.93 },
];

const MATURITY_BANDS: SemanticMaturityBand[] = [
  { key: "hypothesis_led", label: "Fundamental Theory", y: 0.14 },
  { key: "mechanism_proposal", label: "Core Mechanism", y: 0.36 },
  { key: "experiment_loop", label: "Applied Translation", y: 0.6 },
  { key: "execution_ready", label: "Clinical / Engineering", y: 0.82 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function seededRatio(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return (hash % 10000) / 10000;
}

function getAnchorByKey(key: string): PublicDomainAnchor {
  return DOMAIN_ANCHORS.find((anchor) => anchor.key === key) || DOMAIN_ANCHORS[0];
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

function getClusterRadius(count: number, base: number, growth: number, cap: number): number {
  return Math.min(cap, base + Math.sqrt(Math.max(count, 1)) * growth);
}

function mix(start: number, end: number, weight: number): number {
  return start * (1 - weight) + end * weight;
}

export function getPublicDomainAnchor(rawDomain: string): PublicDomainAnchor {
  const group = getPublicDomainGroup(rawDomain);
  return getAnchorByKey(group?.key || "information_science");
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

  if (
    node.success !== undefined ||
    node.status === "approved" ||
    node.status === "rejected"
  ) {
    return MATURITY_BANDS[3];
  }

  return MATURITY_BANDS[2];
}

export function projectSemanticNode(node: MapNode): SemanticProjection {
  const anchor = getPublicDomainAnchor(node.domain);
  const maturity = getSemanticMaturityBand(node);
  const jitterX = seededRatio(`${node.id}:x`) - 0.5;
  const jitterY = seededRatio(`${node.id}:y`) - 0.5;

  return {
    x: clamp(anchor.x + jitterX * 0.044, 0.045, 0.955),
    y: clamp(maturity.y + jitterY * 0.052, 0.09, 0.9),
    anchor,
    maturity,
  };
}

export function layoutSemanticNodes(nodes: MapNode[]): SemanticNodeProjection[] {
  const buckets = new Map<string, MapNode[]>();
  const globalMinX = Math.min(...nodes.map((node) => node.x));
  const globalMaxX = Math.max(...nodes.map((node) => node.x));
  const globalMinY = Math.min(...nodes.map((node) => node.y));
  const globalMaxY = Math.max(...nodes.map((node) => node.y));

  for (const node of nodes) {
    const maturity = getSemanticMaturityBand(node);
    const key = maturity.key;
    const current = buckets.get(key) ?? [];
    current.push(node);
    buckets.set(key, current);
  }

  const projections: SemanticNodeProjection[] = [];

  for (const bucketNodes of buckets.values()) {
    const maturity = getSemanticMaturityBand(bucketNodes[0]);
    const semanticScored = bucketNodes
      .map((node) => {
        const anchor = getPublicDomainAnchor(node.domain);
        const normX = normalize(node.x, globalMinX, globalMaxX, seededRatio(`${node.id}:norm-x`));
        const normY = normalize(node.y, globalMinY, globalMaxY, seededRatio(`${node.id}:norm-y`));
        const semanticScore = mix(anchor.x, 0.08 + normX * 0.84, 0.42);
        return { node, anchor, normX, normY, semanticScore };
      })
      .sort((left, right) => left.semanticScore - right.semanticScore || left.node.id.localeCompare(right.node.id));

    const stageMinX = 0.06;
    const stageMaxX = 0.95;
    const bandThickness =
      maturity.key === "hypothesis_led"
        ? 0.075
        : maturity.key === "mechanism_proposal"
          ? 0.095
          : maturity.key === "experiment_loop"
            ? 0.118
            : 0.145;
    const semanticWeight =
      maturity.key === "hypothesis_led"
        ? 0.1
        : maturity.key === "mechanism_proposal"
          ? 0.12
          : maturity.key === "experiment_loop"
            ? 0.14
            : 0.16;
    const radiusX = getClusterRadius(semanticScored.length, 0.024, 0.0046, 0.06);
    const radiusY = getClusterRadius(semanticScored.length, bandThickness * 0.24, 0.0034, bandThickness * 0.62);

    semanticScored.forEach(({ node, anchor, normX, normY, semanticScore }, index) => {
      const fallbackY = seededRatio(`${node.id}:base-y`);
      const seq = index + 1;
      const rank = semanticScored.length === 1 ? 0.5 : index / (semanticScored.length - 1);
      const fieldX = stageMinX + Math.pow(rank, 0.94) * (stageMaxX - stageMinX);
      const preferredX = mix(fieldX, semanticScore, semanticWeight);
      const angle = halton(seq, 2) * Math.PI * 2 + (seededRatio(`${node.id}:angle`) - 0.5) * 0.18;
      const radius = Math.pow(halton(seq, 3), 0.52);
      const jitterX = seededRatio(`${node.id}:jitter-x`) - 0.5;
      const jitterY = seededRatio(`${node.id}:jitter-y`) - 0.5;
      const domainBias = (anchor.x - preferredX) * 0.07;
      const organicX = Math.cos(angle) * radiusX * radius;
      const organicY = Math.sin(angle) * radiusY * radius;
      const bandCurve = Math.sin((rank * 1.1 + normX * 0.18) * Math.PI * 2) * bandThickness * 0.16;
      const fieldY = mix(maturity.y, 0.14 + normY * 0.68, 0.1);

      projections.push({
        node,
        x: clamp(preferredX + domainBias + organicX + jitterX * radiusX * 0.32 + (normX - 0.5) * 0.018, 0.05, 0.96),
        y: clamp(fieldY + organicY + bandCurve + jitterY * radiusY * 0.42 + (fallbackY - 0.5) * 0.018, 0.08, 0.92),
        anchor,
        maturity,
      });
    });
  }

  return projections;
}

export function getSemanticDomainAnchors(): PublicDomainAnchor[] {
  return DOMAIN_ANCHORS;
}

export function getSemanticMaturityBands(): SemanticMaturityBand[] {
  return MATURITY_BANDS;
}
