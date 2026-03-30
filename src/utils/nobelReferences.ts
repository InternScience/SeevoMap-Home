/**
 * 诺贝尔奖参考点
 * 使用新的坐标系直接映射 X/Y 坐标
 *
 * X 轴: 研究尺度 (宏观 → 微观)
 * Y 轴: 贡献类型 (应用 → 理论)
 */

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

/**
 * 检查新参考点是否与已选参考点保持足够距离
 */
function shouldKeepReference(reference: NobelReference, selected: NobelReference[]): boolean {
  return selected.every((existing) => {
    const minDistance =
      existing.publicDomain === reference.publicDomain ? 0.05 : 0.04;
    return Math.hypot(existing.x - reference.x, existing.y - reference.y) > minDistance;
  });
}

/**
 * 获取所有诺贝尔奖参考点
 * 直接使用 NOBEL_SCALE_X/Y 中的坐标值
 */
export function getNobelReferences(): NobelReference[] {
  const references = (rawNobelPrizes as RawNobelPrize[]).map((prize) => {
    const id = `${prize.year}-${prize.field}`;
    const domain = FIELD_DOMAIN_MAP[prize.field];
    const anchor = getPublicDomainAnchor(domain);

    // 直接使用预定义的坐标值
    const rawX = NOBEL_SCALE_X[id] ?? 0.5;
    const rawY = NOBEL_SCALE_Y[id] ?? 0.5;

    // 添加微小抖动以避免完全重叠
    const jitterX = (seededRatio(`${id}:x`) - 0.5) * 0.02;
    const jitterY = (seededRatio(`${id}:y`) - 0.5) * 0.02;

    return {
      id,
      year: prize.year,
      field: prize.field,
      winners: prize.winners,
      contribution: prize.contribution,
      publicDomain: anchor.label,
      x: clamp(rawX + jitterX, 0.02, 0.98),
      y: clamp(rawY + jitterY, 0.02, 0.98),
      symbol: FIELD_SYMBOL_MAP[prize.field],
    };
  });

  // 按年份和 X 坐标排序，然后进行距离过滤
  const sorted = references.sort((left, right) =>
    left.year - right.year ||
    left.x - right.x ||
    left.y - right.y
  );

  const selected: NobelReference[] = [];
  for (const reference of sorted) {
    if (shouldKeepReference(reference, selected)) {
      selected.push(reference);
    }
  }

  return selected;
}

/**
 * 获取指定场景的诺贝尔奖参考点
 */
export function getNobelReferencesByScene(sceneKey: string): NobelReference[] {
  const allReferences = getNobelReferences();

  // 根据 X 坐标范围筛选
  const sceneRanges: Record<string, [number, number]> = {
    universe: [0.00, 0.10],
    astrophysics: [0.10, 0.20],
    earth_climate: [0.20, 0.30],
    bio_system: [0.30, 0.40],
    organ_tissue: [0.40, 0.50],
    cell: [0.50, 0.60],
    biomolecule: [0.60, 0.70],
    molecule: [0.70, 0.80],
    atom_material: [0.80, 0.90],
    quantum: [0.90, 1.00],
  };

  const range = sceneRanges[sceneKey];
  if (!range) return allReferences;

  return allReferences.filter(
    (ref) => ref.x >= range[0] && ref.x < range[1]
  );
}

/**
 * 获取指定层级的诺贝尔奖参考点
 */
export function getNobelReferencesByLevel(levelKey: string): NobelReference[] {
  const allReferences = getNobelReferences();

  // 根据 Y 坐标范围筛选
  const levelRanges: Record<string, [number, number]> = {
    clinical_engineering: [0.00, 0.25],
    technical_invention: [0.25, 0.45],
    mechanism_discovery: [0.45, 0.65],
    fundamental_discovery: [0.65, 0.85],
    theoretical_breakthrough: [0.85, 1.00],
  };

  const range = levelRanges[levelKey];
  if (!range) return allReferences;

  return allReferences.filter(
    (ref) => ref.y >= range[0] && ref.y < range[1]
  );
}
