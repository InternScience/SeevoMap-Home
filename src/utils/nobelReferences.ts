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

function seededRatio(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }
  return (hash % 10000) / 10000;
}

export function getNobelReferences(): NobelReference[] {
  return (rawNobelPrizes as RawNobelPrize[]).map((prize) => {
    const id = `${prize.year}-${prize.field}`;
    const domain = FIELD_DOMAIN_MAP[prize.field];
    const anchor = getPublicDomainAnchor(domain);
    const rawX = NOBEL_SCALE_X[id] ?? 0.5;
    const rawY = NOBEL_SCALE_Y[id] ?? 0.5;
    const jitterX = seededRatio(`${id}:x`) - 0.5;
    const jitterY = seededRatio(`${id}:y`) - 0.5;
    const semanticX = 0.08 + (1 - rawX) * 0.84;
    const semanticY = 0.14 + (1 - rawY) * 0.68;

    return {
      id,
      year: prize.year,
      field: prize.field,
      winners: prize.winners,
      contribution: prize.contribution,
      publicDomain: anchor.label,
      x: clamp(semanticX * 0.82 + anchor.x * 0.18 + jitterX * 0.028, 0.05, 0.95),
      y: clamp(semanticY + jitterY * 0.022, 0.12, 0.9),
      symbol: FIELD_SYMBOL_MAP[prize.field],
    };
  });
}
