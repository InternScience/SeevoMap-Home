import rawNobelPrizes from "../data/nobelPrizes.json";
import { NOBEL_SCALE_X, NOBEL_SCALE_Y } from "../data/scivbookScaleMap";
import { getPublicDomainAnchor } from "./graphSemanticLayout";

interface RawNobelPrize {
  year: number;
  field: "物理" | "化学" | "医学";
  winners: string;
  contribution: string;
  papers?: string | null;
  venue?: string | null;
  link?: string;
}

export interface NobelReference {
  id: string;
  year: number;
  field: string;
  winners: string;
  contribution: string;
  publicDomain: string;
  x: number;
  y: number;
  symbol: string;
}

const FIELD_DOMAIN_MAP: Record<RawNobelPrize["field"], string> = {
  物理: "physics",
  化学: "chemistry",
  医学: "medicine",
};

const FIELD_SYMBOL_MAP: Record<RawNobelPrize["field"], string> = {
  物理: "⚛",
  化学: "⚗",
  医学: "✚",
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function seededRatio(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }
  return (hash % 10000) / 10000;
}

function shouldKeepReference(reference: NobelReference, selected: NobelReference[]): boolean {
  return selected.every((existing) => {
    const minDistance =
      existing.publicDomain === reference.publicDomain ? 0.044 : 0.032;
    return Math.hypot(existing.x - reference.x, existing.y - reference.y) > minDistance;
  });
}

function getBoundaryRingPosition(
  field: RawNobelPrize["field"],
  rawX: number,
  rawY: number,
  id: string,
): { x: number; y: number } {
  const t = clamp(rawX * 0.72 + (1 - rawY) * 0.28, 0, 1);
  const wobble = seededRatio(`${id}:ring-wobble`) - 0.5;

  if (field === "化学") {
    const angle = lerp(-2.7, -0.46, t) + wobble * 0.08;
    return {
      x: 0.54 + Math.cos(angle) * 0.21,
      y: 0.3 + Math.sin(angle) * 0.11,
    };
  }

  if (field === "物理") {
    const angle = lerp(-1.6, 0.02, t) + wobble * 0.08;
    return {
      x: 0.72 + Math.cos(angle) * 0.11,
      y: 0.34 + Math.sin(angle) * 0.12,
    };
  }

  const angle = lerp(-1.12, 1.16, t) + wobble * 0.06;
  return {
    x: 0.72 + Math.cos(angle) * 0.085,
    y: 0.5 + Math.sin(angle) * 0.18,
  };
}

export function getNobelReferences(): NobelReference[] {
  const references = (rawNobelPrizes as RawNobelPrize[]).map((prize) => {
    const id = `${prize.year}-${prize.field}`;
    const domain = FIELD_DOMAIN_MAP[prize.field];
    const anchor = getPublicDomainAnchor(domain);
    const rawX = NOBEL_SCALE_X[id] ?? 0.5;
    const rawY = NOBEL_SCALE_Y[id] ?? 0.5;
    const jitterX = seededRatio(`${id}:x`) - 0.5;
    const jitterY = seededRatio(`${id}:y`) - 0.5;
    const ring = getBoundaryRingPosition(prize.field, rawX, rawY, id);

    return {
      id,
      year: prize.year,
      field: prize.field,
      winners: prize.winners,
      contribution: prize.contribution,
      publicDomain: anchor.label,
      x: clamp(ring.x + jitterX * 0.018, 0.08, 0.95),
      y: clamp(ring.y + jitterY * 0.018, 0.12, 0.88),
      symbol: FIELD_SYMBOL_MAP[prize.field],
    };
  });

  const selected: NobelReference[] = [];
  for (const reference of references.sort((left, right) => left.y - right.y || left.x - right.x || left.year - right.year)) {
    if (shouldKeepReference(reference, selected)) {
      selected.push(reference);
    }
  }

  return selected;
}
