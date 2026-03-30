/**
 * 简化的图语义布局工具
 * 使用线性坐标映射替代复杂的语义场算法
 *
 * X 轴: 宏观→微观 (0 = 宇宙, 1 = 量子)
 * Y 轴: 应用→理论 (0 = 临床工程, 1 = 理论突破)
 */

import type { MapNode } from "./types";
import { getPublicDomainGroup } from "./publicDomains";
import { computeTaskCoordinates } from "./taskCoordinateMapper";
import {
  SCALE_SCENES_X,
  SCALE_LEVELS_Y,
  type ScaleSceneX,
  type ScaleLevelY,
} from "../data/scivbookScaleMap";

// ===== 导出的接口定义 =====

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

// ===== 简化的锚点定义 =====

const DOMAIN_ANCHORS: PublicDomainAnchor[] = [
  { key: "information_science", label: "Information Science", x: 0.93 },
  { key: "earth_space", label: "Earth & Space", x: 0.15 },
  { key: "economics", label: "Economics", x: 0.35 },
  { key: "medicine", label: "Medicine", x: 0.45 },
  { key: "engineering", label: "Engineering", x: 0.45 },
  { key: "life_science", label: "Life Science", x: 0.55 },
  { key: "chemistry", label: "Chemistry", x: 0.75 },
  { key: "physics", label: "Physics", x: 0.95 },
  { key: "mathematics", label: "Mathematics", x: 0.95 },
];

// 基于新 X 轴场景定义的尺度锚点
const SCALE_ANCHORS: ScaleAxisAnchor[] = SCALE_SCENES_X.map((scene) => ({
  key: scene.key,
  label: scene.labelEn,
  x: (scene.range[0] + scene.range[1]) / 2,
  spread: (scene.range[1] - scene.range[0]) * 0.8,
}));

// 基于新 Y 轴层级定义的成熟度带
const MATURITY_BANDS: SemanticMaturityBand[] = SCALE_LEVELS_Y.map((level) => ({
  key: level.key,
  label: level.labelEn,
  y: (level.range[0] + level.range[1]) / 2,
  layoutY: (level.range[0] + level.range[1]) / 2,
}));

// Domain → Scale Key 映射 (基于宏观-微观坐标系)
const DOMAIN_SCALE_KEY_MAP: Record<string, string> = {
  astronomy: "universe",
  cosmology: "universe",
  earth_space: "astrophysics",
  earth_science: "earth_climate",
  climate: "earth_climate",
  economics: "bio_system",
  neuroscience: "bio_system",
  medicine: "organ_tissue",
  engineering: "organ_tissue",
  life_science: "cell",
  life_sciences: "cell",
  biology: "biomolecule",
  chemistry: "molecule",
  materials_science: "atom_material",
  physics: "quantum",
  mathematics: "quantum",
  // AI/信息科学 → 量子/粒子（与神经网络诺奖位置对应）
  information_science: "quantum",
  pretraining: "quantum",
  posttraining: "quantum",
  model_compression: "quantum",
};

// ===== 辅助函数 =====

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
  return (
    DOMAIN_ANCHORS.find((anchor) => anchor.key === key) ||
    DOMAIN_ANCHORS.find((anchor) => anchor.key === "information_science") ||
    DOMAIN_ANCHORS[0]
  );
}

function getScaleAnchorByKey(key: string): ScaleAxisAnchor {
  return SCALE_ANCHORS.find((anchor) => anchor.key === key) || SCALE_ANCHORS[4];
}

// ===== 导出的函数 =====

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
  const groupKey = DOMAIN_SCALE_KEY_MAP[group?.key || "information_science"];
  return getScaleAnchorByKey(groupKey || "organ_tissue");
}

export function getSemanticMaturityBand(node: MapNode): SemanticMaturityBand {
  const metric = (node.metric_name || "").toLowerCase();
  const source = (node.source || "").toLowerCase();
  const idea = (node.idea || "").toLowerCase();

  // 理论假设层
  if (node.status === "hypothesis") {
    return MATURITY_BANDS[4]; // theoretical_breakthrough
  }

  // 基础发现/机制阐明
  if (
    node.status === "pending" ||
    metric.includes("novelty") ||
    metric.includes("checklist") ||
    source.includes("ideaminer") ||
    source.includes("scivbook") ||
    idea.includes("research plan")
  ) {
    return MATURITY_BANDS[2]; // mechanism_discovery
  }

  // 技术发明/临床应用
  if (node.success !== undefined || node.status === "approved" || node.status === "rejected") {
    return MATURITY_BANDS[1]; // technical_invention
  }

  return MATURITY_BANDS[2]; // 默认: mechanism_discovery
}

/**
 * 投影单个节点到语义坐标系
 */
export function projectSemanticNode(node: MapNode): SemanticProjection {
  const anchor = getPublicDomainAnchor(node.domain);
  const scaleAnchor = getScaleAxisAnchor(node.domain);
  const maturity = getSemanticMaturityBand(node);

  // 使用新的坐标计算器
  const coords = computeTaskCoordinates(node);

  return {
    x: coords.x,
    y: coords.y,
    anchor,
    scaleAnchor,
    maturity,
  };
}

/**
 * 批量布局节点 - 简化版本
 * 使用线性坐标映射替代复杂的语义场算法
 */
export function layoutSemanticNodes(nodes: MapNode[]): SemanticNodeProjection[] {
  if (nodes.length === 0) return [];

  const projections: SemanticNodeProjection[] = [];

  for (const node of nodes) {
    const anchor = getPublicDomainAnchor(node.domain);
    const scaleAnchor = getScaleAxisAnchor(node.domain);
    const maturity = getSemanticMaturityBand(node);

    // 使用新的坐标计算器获取基础坐标
    const coords = computeTaskCoordinates(node);

    // 添加基于 cohort 的微小抖动以避免完全重叠
    const label = (node.label || node.id).trim().toLowerCase().slice(0, 100);
    const cohortSeed = `${node.domain}:${label}`;
    const cohortJitterX = (seededRatio(`${cohortSeed}:jitter-x`) - 0.5) * 0.02;
    const cohortJitterY = (seededRatio(`${cohortSeed}:jitter-y`) - 0.5) * 0.02;
    const nodeJitterX = (seededRatio(`${node.id}:jitter-x`) - 0.5) * 0.015;
    const nodeJitterY = (seededRatio(`${node.id}:jitter-y`) - 0.5) * 0.015;

    projections.push({
      node,
      x: clamp(coords.x + cohortJitterX + nodeJitterX, 0.02, 0.98),
      y: clamp(coords.y + cohortJitterY + nodeJitterY, 0.02, 0.98),
      anchor,
      scaleAnchor,
      maturity,
    });
  }

  return projections;
}

/**
 * 获取领域锚点列表
 */
export function getSemanticDomainAnchors(): PublicDomainAnchor[] {
  return DOMAIN_ANCHORS;
}

/**
 * 获取尺度锚点列表 (基于新 X 轴场景)
 */
export function getSemanticScaleAnchors(): ScaleAxisAnchor[] {
  return SCALE_ANCHORS;
}

/**
 * 获取成熟度带列表 (基于新 Y 轴层级)
 */
export function getSemanticMaturityBands(): SemanticMaturityBand[] {
  return MATURITY_BANDS;
}

/**
 * 获取 X 轴场景定义
 */
export function getScaleScenesX(): ScaleSceneX[] {
  return SCALE_SCENES_X;
}

/**
 * 获取 Y 轴层级定义
 */
export function getScaleLevelsY(): ScaleLevelY[] {
  return SCALE_LEVELS_Y;
}
