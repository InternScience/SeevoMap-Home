/**
 * 任务节点坐标映射器
 * 基于与诺奖点的相似度计算任务节点的位置
 *
 * 核心思路：任务点分布在与其最相关的诺奖点周围，
 * 形成"站在巨人肩膀上"的视觉效果
 */

import type { MapNode } from "./types";
import { TASK_SCALE_X, TASK_SCALE_Y, NOBEL_SCALE_X, NOBEL_SCALE_Y } from "../data/scivbookScaleMap";

// 诺奖信息用于相似度计算
interface NobelInfo {
  id: string;
  field: string;
  x: number;
  y: number;
  keywords: string[];
}

// 诺奖关键词映射（用于相似度计算）
const NOBEL_KEYWORDS: Record<string, string[]> = {
  // 物理
  '2000-物理': ['semiconductor', 'integrated circuit', 'chip', 'transistor'],
  '2001-物理': ['bec', 'bose-einstein', 'condensate', 'ultracold', 'atom'],
  '2002-物理': ['neutrino', 'cosmic', 'x-ray', 'astrophysics'],
  '2003-物理': ['superconductor', 'superfluid', 'helium'],
  '2004-物理': ['qcd', 'quark', 'asymptotic freedom', 'strong force'],
  '2005-物理': ['quantum optics', 'laser', 'frequency comb', 'spectroscopy'],
  '2006-物理': ['cmb', 'cosmic microwave', 'blackbody', 'cosmology'],
  '2007-物理': ['gmr', 'magnetoresistance', 'magnetic', 'spintronics'],
  '2008-物理': ['symmetry breaking', 'cp violation', 'kaon', 'quark'],
  '2009-物理': ['fiber optic', 'ccd', 'imaging', 'sensor', 'camera'],
  '2010-物理': ['graphene', 'carbon', '2d material', 'nanomaterial'],
  '2011-物理': ['supernova', 'dark energy', 'accelerating', 'universe expansion'],
  '2012-物理': ['ion trap', 'quantum measurement', 'photon'],
  '2013-物理': ['higgs', 'boson', 'particle', 'mass', 'lhc'],
  '2014-物理': ['led', 'blue light', 'gallium nitride', 'lighting'],
  '2015-物理': ['neutrino oscillation', 'neutrino mass', 'flavor'],
  '2016-物理': ['topology', 'topological', 'phase transition', 'quantum hall'],
  '2017-物理': ['gravitational wave', 'ligo', 'black hole merger'],
  '2018-物理': ['optical tweezers', 'laser trap', 'chirped pulse'],
  '2019-物理': ['exoplanet', 'cosmology', 'universe evolution'],
  '2020-物理': ['black hole', 'singularity', 'event horizon', 'penrose'],
  '2021-物理': ['climate', 'complex system', 'spin glass', 'disorder'],
  '2022-物理': ['quantum entanglement', 'bell inequality', 'quantum information'],
  '2023-物理': ['attosecond', 'ultrafast', 'electron dynamics'],
  '2024-物理': ['neural network', 'machine learning', 'deep learning', 'ai'],
  '2025-物理': ['quantum tunneling', 'scanning tunneling', 'microscope'],
  // 化学
  '2000-化学': ['conducting polymer', 'polyacetylene', 'organic conductor'],
  '2001-化学': ['asymmetric catalysis', 'chiral', 'enantiomer'],
  '2002-化学': ['mass spectrometry', 'nmr', 'protein structure'],
  '2003-化学': ['ion channel', 'aquaporin', 'membrane protein'],
  '2004-化学': ['ubiquitin', 'protein degradation', 'proteasome'],
  '2005-化学': ['metathesis', 'olefin', 'grubbs catalyst'],
  '2006-化学': ['transcription', 'rna polymerase', 'gene expression'],
  '2007-化学': ['surface chemistry', 'heterogeneous catalysis'],
  '2008-化学': ['gfp', 'green fluorescent', 'fluorescence', 'imaging'],
  '2009-化学': ['ribosome', 'translation', 'protein synthesis'],
  '2010-化学': ['palladium', 'cross coupling', 'suzuki', 'heck'],
  '2011-化学': ['quasicrystal', 'aperiodic', 'diffraction'],
  '2012-化学': ['gpcr', 'g protein', 'receptor', 'signaling'],
  '2013-化学': ['multiscale', 'molecular dynamics', 'qm/mm'],
  '2014-化学': ['super resolution', 'nanoscopy', 'sted', 'palm'],
  '2015-化学': ['dna repair', 'nucleotide excision', 'base excision'],
  '2016-化学': ['molecular machine', 'molecular motor', 'rotaxane'],
  '2017-化学': ['cryo-em', 'electron microscopy', 'structure'],
  '2018-化学': ['directed evolution', 'enzyme engineering', 'phage display'],
  '2019-化学': ['lithium battery', 'li-ion', 'rechargeable'],
  '2020-化学': ['crispr', 'cas9', 'genome editing', 'gene editing'],
  '2021-化学': ['organocatalysis', 'asymmetric', 'enamine'],
  '2022-化学': ['click chemistry', 'bioorthogonal', 'azide alkyne'],
  '2023-化学': ['quantum dot', 'nanocrystal', 'semiconductor'],
  '2024-化学': ['protein design', 'alphafold', 'protein folding', 'structure prediction'],
  '2025-化学': ['mof', 'metal organic framework', 'porous material'],
  // 医学
  '2000-医学': ['dopamine', 'neurotransmitter', 'synapse', 'signal transduction'],
  '2001-医学': ['cell cycle', 'cdk', 'cyclin', 'cell division'],
  '2002-医学': ['apoptosis', 'organ development', 'c elegans'],
  '2003-医学': ['mri', 'magnetic resonance', 'imaging', 'diagnostic'],
  '2004-医学': ['olfactory', 'smell', 'receptor', 'sensory'],
  '2005-医学': ['helicobacter', 'pylori', 'gastric', 'ulcer'],
  '2006-医学': ['rnai', 'sirna', 'gene silencing', 'interference'],
  '2007-医学': ['gene targeting', 'knockout', 'embryonic stem'],
  '2008-医学': ['hpv', 'hiv', 'virus', 'cervical cancer', 'aids'],
  '2009-医学': ['telomere', 'telomerase', 'chromosome', 'aging'],
  '2010-医学': ['ivf', 'in vitro', 'fertilization', 'reproductive'],
  '2011-医学': ['innate immunity', 'toll receptor', 'dendritic cell'],
  '2012-医学': ['ips', 'induced pluripotent', 'stem cell', 'reprogramming'],
  '2013-医学': ['vesicle', 'transport', 'exocytosis', 'snare'],
  '2014-医学': ['place cell', 'grid cell', 'spatial', 'navigation', 'hippocampus'],
  '2015-医学': ['malaria', 'artemisinin', 'parasitic', 'ivermectin'],
  '2016-医学': ['autophagy', 'lysosome', 'degradation', 'recycling'],
  '2017-医学': ['circadian', 'clock gene', 'period', 'biological rhythm'],
  '2018-医学': ['immune checkpoint', 'pd-1', 'ctla-4', 'cancer immunotherapy'],
  '2019-医学': ['hypoxia', 'hif', 'oxygen sensing', 'erythropoietin'],
  '2020-医学': ['hepatitis c', 'hcv', 'liver', 'viral'],
  '2021-医学': ['touch', 'temperature', 'mechanoreceptor', 'sensory'],
  '2022-医学': ['ancient dna', 'paleogenomics', 'neanderthal', 'human evolution'],
  '2023-医学': ['mrna', 'vaccine', 'nucleoside', 'covid'],
  '2024-医学': ['microrna', 'mirna', 'gene regulation', 'post-transcriptional'],
  '2025-医学': ['immune tolerance', 'regulatory t cell', 'autoimmune'],
};

// Domain 到 Nobel field 的映射
const DOMAIN_TO_FIELD: Record<string, string[]> = {
  physics: ['物理'],
  mathematics: ['物理'],
  quantum: ['物理'],
  astronomy: ['物理'],
  earth_space: ['物理'],
  earth_science: ['物理'],
  chemistry: ['化学'],
  materials_science: ['化学', '物理'],
  life_science: ['医学', '化学'],
  life_sciences: ['医学', '化学'],
  medicine: ['医学'],
  neuroscience: ['医学'],
  biology: ['医学', '化学'],
  // 信息科学类 - 映射到神经网络诺奖
  pretraining: ['物理'],
  posttraining: ['物理'],
  model_compression: ['物理'],
  information_science: ['物理'],
  engineering: ['物理', '化学'],
  economics: ['物理'],
};

/**
 * 限制值在范围内
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 获取所有诺奖信息
 */
function getAllNobelInfo(): NobelInfo[] {
  const result: NobelInfo[] = [];
  for (const id of Object.keys(NOBEL_SCALE_X)) {
    const field = id.split('-')[1];
    result.push({
      id,
      field,
      x: NOBEL_SCALE_X[id],
      y: NOBEL_SCALE_Y[id],
      keywords: NOBEL_KEYWORDS[id] || [],
    });
  }
  return result;
}

/**
 * 计算任务与诺奖的相似度
 */
function computeSimilarity(node: MapNode, nobel: NobelInfo): number {
  let score = 0;
  const domain = (node.domain || '').toLowerCase();
  const label = (node.label || '').toLowerCase();
  const idea = (node.idea || '').toLowerCase();
  const tags = (node.method_tags || []).map(t => t.toLowerCase());
  const metricName = (node.metric_name || '').toLowerCase();
  const searchText = `${label} ${idea} ${tags.join(' ')}`;

  // 1. Domain 匹配 (权重: 2)
  const matchedFields = DOMAIN_TO_FIELD[domain] || [];
  if (matchedFields.includes(nobel.field)) {
    score += 2;
  }

  // 2. 关键词匹配 (权重: 每个关键词 3 分)
  for (const keyword of nobel.keywords) {
    if (searchText.includes(keyword)) {
      score += 3;
    }
  }

  // 3. Method tags 匹配 (权重: 每个 2 分)
  for (const tag of tags) {
    for (const keyword of nobel.keywords) {
      if (tag.includes(keyword) || keyword.includes(tag)) {
        score += 2;
      }
    }
  }

  // 4. AI/ML 任务的细粒度匹配
  if (['pretraining', 'posttraining', 'model_compression'].includes(domain)) {
    // 根据任务内容分配到不同诺奖

    // 语言模型相关 → 神经网络 + 复杂系统
    if (searchText.includes('language') || searchText.includes('llm') || searchText.includes('gpt') || searchText.includes('bert')) {
      if (nobel.id === '2024-物理') score += 4; // 神经网络
      if (nobel.id === '2021-物理') score += 3; // 复杂系统
    }

    // 视觉/图像相关 → 超分辨 + CCD
    if (searchText.includes('vision') || searchText.includes('image') || searchText.includes('visual') || searchText.includes('cnn')) {
      if (nobel.id === '2014-化学') score += 4; // 超分辨
      if (nobel.id === '2009-物理') score += 3; // CCD
    }

    // 蛋白质/生物相关 → AlphaFold类
    if (searchText.includes('protein') || searchText.includes('bio') || searchText.includes('molecular')) {
      if (nobel.id === '2024-化学') score += 5; // 蛋白质设计
      if (nobel.id === '2017-化学') score += 3; // 冷冻电镜
    }

    // 优化/压缩相关 → 计算方法
    if (searchText.includes('optim') || searchText.includes('compress') || searchText.includes('efficient') || searchText.includes('quantiz')) {
      if (nobel.id === '2013-化学') score += 4; // 多尺度模型
      if (nobel.id === '2024-物理') score += 2;
    }

    // 强化学习相关 → 复杂系统
    if (searchText.includes('reinforcement') || searchText.includes('rl') || searchText.includes('reward') || searchText.includes('policy')) {
      if (nobel.id === '2021-物理') score += 4; // 复杂系统
    }

    // 生成模型相关 → 分子机器
    if (searchText.includes('generat') || searchText.includes('diffusion') || searchText.includes('vae') || searchText.includes('gan')) {
      if (nobel.id === '2016-化学') score += 4; // 分子机器
      if (nobel.id === '2018-化学') score += 3; // 定向进化
    }

    // 注意力/Transformer → 量子测量（信息处理）
    if (searchText.includes('attention') || searchText.includes('transformer')) {
      if (nobel.id === '2012-物理') score += 3; // 量子测量
      if (nobel.id === '2022-物理') score += 3; // 量子信息
    }

    // 训练相关 → 神经网络基础
    if (metricName.includes('loss') || searchText.includes('training') || searchText.includes('gradient')) {
      if (nobel.id === '2024-物理') score += 3;
    }

    // 准确率/性能相关 → 应用层面
    if (metricName.includes('accuracy') || metricName.includes('performance')) {
      if (nobel.id === '2009-物理') score += 2; // CCD (传感器)
      if (nobel.id === '2014-物理') score += 2; // LED (应用)
    }

    // 默认：如果没有特殊匹配，给神经网络诺奖一个基础分
    if (score < 3 && nobel.id === '2024-物理') {
      score += 2;
    }
  }

  // 5. 传统学科的匹配
  // 物理相关
  if (domain === 'physics') {
    if (searchText.includes('quantum') || searchText.includes('qubit')) {
      if (nobel.id === '2022-物理') score += 5;
      if (nobel.id === '2012-物理') score += 4;
    }
    if (searchText.includes('particle') || searchText.includes('higgs')) {
      if (nobel.id === '2013-物理') score += 5;
    }
    if (searchText.includes('material') || searchText.includes('graphene')) {
      if (nobel.id === '2010-物理') score += 5;
    }
  }

  // 化学相关
  if (domain === 'chemistry') {
    if (searchText.includes('catalyst') || searchText.includes('reaction')) {
      if (nobel.id === '2010-化学') score += 4;
      if (nobel.id === '2021-化学') score += 4;
    }
    if (searchText.includes('polymer') || searchText.includes('material')) {
      if (nobel.id === '2000-化学') score += 4;
    }
  }

  // 生命科学相关
  if (domain === 'life_sciences' || domain === 'life_science' || domain === 'medicine') {
    if (searchText.includes('gene') || searchText.includes('crispr') || searchText.includes('edit')) {
      if (nobel.id === '2020-化学') score += 5;
    }
    if (searchText.includes('cell') || searchText.includes('stem')) {
      if (nobel.id === '2012-医学') score += 4;
    }
    if (searchText.includes('immune') || searchText.includes('cancer')) {
      if (nobel.id === '2018-医学') score += 4;
    }
    if (searchText.includes('brain') || searchText.includes('neuro')) {
      if (nobel.id === '2014-医学') score += 4;
    }
  }

  return score;
}

/**
 * 找到与任务最相似的诺奖点
 */
function findMostSimilarNobels(node: MapNode, nobelList: NobelInfo[], topK: number = 3): { nobel: NobelInfo; score: number }[] {
  const scored = nobelList.map(nobel => ({
    nobel,
    score: computeSimilarity(node, nobel),
  }));

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * 检查是否为 AI/信息科学类任务
 */
function isAITask(domain: string): boolean {
  const aiDomains = ['pretraining', 'posttraining', 'model_compression', 'information_science'];
  return aiDomains.includes(domain.toLowerCase());
}

/**
 * 生成更好的二维随机分布
 * 使用多个独立的哈希因子确保 X 和 Y 真正独立
 */
function hash2D(seed: string): { x: number; y: number } {
  // 使用不同的哈希算法生成两个独立的值
  let hashX = 0;
  let hashY = 0;

  for (let i = 0; i < seed.length; i += 1) {
    const char = seed.charCodeAt(i);
    // X 使用一种哈希方式
    hashX = ((hashX << 5) - hashX + char) >>> 0;
    // Y 使用不同的哈希方式（乘以不同的素数）
    hashY = ((hashY << 7) + hashY + char * 17) >>> 0;
  }

  // 额外混淆确保独立性
  hashX = (hashX * 2654435761) >>> 0;
  hashY = (hashY * 2246822519) >>> 0;

  return {
    x: (hashX % 10000) / 10000,
    y: (hashY % 10000) / 10000,
  };
}

/**
 * 为 AI 任务计算均匀分布的坐标
 * 聚集在 2024 神经网络诺奖 (X=0.88) 周围
 */
function computeAITaskCoordinates(node: MapNode): { x: number; y: number } {
  // 以 2024 神经网络诺奖为中心 (X=0.91, Y=0.24)
  const centerX = 0.91;
  const centerY = 0.24;

  // 在诺奖周围的散布范围
  const spreadX = 0.05;
  const spreadY = 0.10;

  // 使用多个独立因素生成基础位置
  const idHash = hash2D(`ai-task:${node.id}`);
  const labelHash = hash2D(`ai-label:${(node.label || '').slice(0, 20)}`);
  const sourceHash = hash2D(`ai-source:${node.source || ''}`);

  // 混合多个哈希值，确保真正的 2D 随机性
  const baseX = (idHash.x * 0.6 + labelHash.y * 0.25 + sourceHash.x * 0.15);
  const baseY = (idHash.y * 0.6 + sourceHash.y * 0.25 + labelHash.x * 0.15);

  // 使用极坐标方式生成更自然的聚集分布
  const angle = baseX * Math.PI * 2;
  const radius = Math.sqrt(baseY);
  const offsetX = Math.cos(angle) * radius * spreadX;
  const offsetY = Math.sin(angle) * radius * spreadY;

  // 添加基于 metric 的小偏移
  const metricName = (node.metric_name || '').toLowerCase();
  let metricOffsetY = 0;
  if (metricName.includes('accuracy') || metricName.includes('performance')) {
    metricOffsetY = -0.02;
  } else if (metricName.includes('novelty')) {
    metricOffsetY = 0.03;
  }

  // 最终坐标：以诺奖为中心散布
  const x = centerX + offsetX;
  const y = centerY + offsetY + metricOffsetY;

  return {
    x: clamp(x, 0.86, 0.96),  // 限制在神经网络诺奖周围
    y: clamp(y, 0.12, 0.36),
  };
}

/**
 * 基于相似诺奖计算任务坐标
 */
function computeCoordinatesFromSimilarity(node: MapNode): { x: number; y: number } {
  const domain = (node.domain || '').toLowerCase();

  // AI/信息科学任务使用专门的分布逻辑
  if (isAITask(domain)) {
    return computeAITaskCoordinates(node);
  }

  const nobelList = getAllNobelInfo();
  const topMatches = findMostSimilarNobels(node, nobelList, 5);

  // 如果没有匹配，使用默认位置（分散在中心区域）
  if (topMatches.length === 0) {
    const defaultHash = hash2D(`default:${node.id}`);
    return {
      x: 0.2 + defaultHash.x * 0.6,
      y: 0.2 + defaultHash.y * 0.6,
    };
  }

  // 加权平均计算位置（使用更多诺奖点来增加多样性）
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (const match of topMatches) {
    // 使用平方根来减少最高分的主导性
    const weight = Math.sqrt(match.score);
    weightedX += match.nobel.x * weight;
    weightedY += match.nobel.y * weight;
    totalWeight += weight;
  }

  const baseX = weightedX / totalWeight;
  const baseY = weightedY / totalWeight;

  // 增大散布范围，根据匹配强度调整
  const topScore = topMatches[0]?.score || 1;
  const spreadFactor = Math.max(0.08, 0.18 - topScore * 0.005);

  // 使用改进的 2D 哈希生成真正独立的偏移
  const spreadHash = hash2D(`spread:${node.id}:${node.label || ''}`);
  const angle = spreadHash.x * Math.PI * 2;
  const radius = spreadHash.y * spreadFactor;
  const radialOffsetX = Math.cos(angle) * radius;
  const radialOffsetY = Math.sin(angle) * radius;

  // 基于 metric 的额外偏移（让不同类型的任务有不同的Y位置）
  const metricName = (node.metric_name || '').toLowerCase();
  let metricOffsetY = 0;
  if (metricName.includes('accuracy')) {
    metricOffsetY = -0.10;
  } else if (metricName.includes('loss')) {
    metricOffsetY = -0.04;
  } else if (metricName.includes('novelty')) {
    metricOffsetY = 0.12;
  }

  return {
    x: clamp(baseX + radialOffsetX, 0.02, 0.98),
    y: clamp(baseY + radialOffsetY + metricOffsetY, 0.02, 0.98),
  };
}

/**
 * 计算任务节点的 X/Y 坐标
 */
export function computeTaskCoordinates(node: MapNode): { x: number; y: number } {
  // 1. 首先检查是否有预定义的静态映射
  if (TASK_SCALE_X[node.id] !== undefined && TASK_SCALE_Y[node.id] !== undefined) {
    return {
      x: TASK_SCALE_X[node.id],
      y: TASK_SCALE_Y[node.id],
    };
  }

  // 2. 基于与诺奖的相似度计算坐标
  return computeCoordinatesFromSimilarity(node);
}

/**
 * 批量计算多个任务节点的坐标
 */
export function computeTaskCoordinatesBatch(
  nodes: MapNode[],
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    result.set(node.id, computeTaskCoordinates(node));
  }
  return result;
}

/**
 * 获取节点所属的 X 轴场景
 */
export function getNodeSceneX(x: number): string {
  if (x < 0.10) return "universe";
  if (x < 0.20) return "astrophysics";
  if (x < 0.30) return "earth_climate";
  if (x < 0.40) return "bio_system";
  if (x < 0.50) return "organ_tissue";
  if (x < 0.60) return "cell";
  if (x < 0.70) return "biomolecule";
  if (x < 0.80) return "molecule";
  if (x < 0.90) return "atom_material";
  return "quantum";
}

/**
 * 获取节点所属的 Y 轴层级
 */
export function getNodeLevelY(y: number): string {
  if (y < 0.20) return "clinical_engineering";
  if (y < 0.40) return "technical_invention";
  if (y < 0.60) return "mechanism_discovery";
  if (y < 0.80) return "fundamental_discovery";
  return "theoretical_breakthrough";
}
