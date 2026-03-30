import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { MapData, MapNode } from "../utils/types";
import {
  getGraphDomainColor,
  getGraphDomainGlow,
  getGraphDomainTint,
} from "../utils/graphPalette";
import {
  getPublicDomainColorDomain,
  getPublicDomainLabel,
} from "../utils/publicDomains";
import {
  layoutSemanticNodes,
  getScaleScenesX,
  getScaleLevelsY,
} from "../utils/graphSemanticLayout";
import { getNobelReferences } from "../utils/nobelReferences";
import type { NobelReference } from "../utils/nobelReferences";

interface Props {
  data: MapData;
  height?: number;
  onNodeClick?: (node: MapNode) => void;
  domainFilter?: Set<string>;
}

interface StageLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

interface SemanticNode {
  node: MapNode;
  x: number;
  y: number;
  anchor: {
    key: string;
  };
  maturity: {
    key: string;
  };
}

interface ScreenPoint {
  x: number;
  y: number;
}

function seededRatio(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return (hash % 10000) / 10000;
}

/**
 * 绘制学术风格山峰图标
 * 简洁优雅的山峰轮廓，金/银/铜色调区分领域
 */
function drawNobelIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  field: string,
  size: number = 12,
) {
  ctx.save();
  ctx.translate(x, y);

  // 根据领域选择配色（诺奖奖牌色调）
  let fillColor: string;
  let strokeColor: string;
  let glowColor: string;

  if (field === '物理') {
    // 金色 - 物理
    fillColor = 'rgba(218, 165, 32, 0.25)';
    strokeColor = 'rgba(218, 165, 32, 0.85)';
    glowColor = 'rgba(218, 165, 32, 0.15)';
  } else if (field === '化学') {
    // 银色 - 化学
    fillColor = 'rgba(169, 169, 169, 0.25)';
    strokeColor = 'rgba(192, 192, 192, 0.85)';
    glowColor = 'rgba(192, 192, 192, 0.15)';
  } else {
    // 铜色 - 医学
    fillColor = 'rgba(184, 115, 51, 0.25)';
    strokeColor = 'rgba(205, 133, 63, 0.85)';
    glowColor = 'rgba(205, 133, 63, 0.15)';
  }

  // 绘制柔和光晕
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
  ctx.fill();

  // 绘制山峰轮廓（简洁的三角形，带圆角效果）
  const peakHeight = size * 1.1;
  const baseWidth = size * 0.9;

  ctx.beginPath();
  ctx.moveTo(0, -peakHeight);  // 顶点
  ctx.lineTo(baseWidth, size * 0.4);   // 右下
  ctx.lineTo(-baseWidth, size * 0.4);  // 左下
  ctx.closePath();

  // 填充渐变
  const gradient = ctx.createLinearGradient(0, -peakHeight, 0, size * 0.4);
  gradient.addColorStop(0, fillColor);
  gradient.addColorStop(0.6, fillColor.replace('0.25', '0.15'));
  gradient.addColorStop(1, fillColor.replace('0.25', '0.08'));
  ctx.fillStyle = gradient;
  ctx.fill();

  // 描边
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 顶部高光点
  ctx.beginPath();
  ctx.arc(0, -peakHeight + 2, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = strokeColor;
  ctx.fill();

  ctx.restore();
}

/**
 * 确定性采样节点
 * 只对 AI 任务采样，其他任务全部显示
 */
function sampleNodes(nodes: MapNode[], aiSampleRate = 0.15): MapNode[] {
  const aiDomains = new Set(['pretraining', 'posttraining', 'model_compression', 'information_science']);

  return nodes.filter((node) => {
    const isAI = aiDomains.has(node.domain?.toLowerCase() || '');
    if (!isAI) return true; // 非 AI 任务全部保留
    // AI 任务使用确定性哈希采样
    const hash = seededRatio(`sample:${node.id}`);
    return hash < aiSampleRate;
  });
}

type TooltipState =
  | { x: number; y: number; node: MapNode }
  | { x: number; y: number; beacon: NobelReference };

export default function GraphVisualization({
  data,
  height = 700,
  onNodeClick,
  domainFilter,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [dim, setDim] = useState({ w: 800, h: height });

  const cam = useRef({ x: 0, y: 0, scale: 1 });
  const drag = useRef({ active: false, sx: 0, sy: 0, cx: 0, cy: 0 });
  const animFrame = useRef<number>(0);

  const filteredNodes = useMemo(() => {
    const domainFiltered = domainFilter
      ? data.nodes.filter((node) => domainFilter.has(node.domain))
      : data.nodes;
    // 只对 AI 任务采样 15%，其他任务全部显示
    return sampleNodes(domainFiltered, 0.15);
  }, [data.nodes, domainFilter]);

  const stage = useMemo<StageLayout>(() => {
    const width = Math.min(Math.max(dim.w * 0.82, 680), Math.max(320, dim.w - 48), 1200);
    const height = Math.min(Math.max(dim.h * 0.75, 480), Math.max(260, dim.h - 100), 750);
    const x = (dim.w - width) / 2;
    const y = Math.max(90, (dim.h - height) / 2 + 12);
    return {
      x,
      y,
      width,
      height,
      centerX: x + width / 2,
      centerY: y + height / 2,
    };
  }, [dim]);

  const semanticNodes = useMemo<SemanticNode[]>(
    () => layoutSemanticNodes(filteredNodes),
    [filteredNodes],
  );

  const semanticNodeMap = useMemo(
    () => new Map(semanticNodes.map((item) => [item.node.id, item])),
    [semanticNodes],
  );

  const renderSemanticNodes = useMemo(
    () =>
      [...semanticNodes].sort(
        (left, right) =>
          seededRatio(`${left.node.id}:render-order`) -
          seededRatio(`${right.node.id}:render-order`),
      ),
    [semanticNodes],
  );

  const scenesX = useMemo(() => getScaleScenesX(), []);
  const levelsY = useMemo(() => getScaleLevelsY(), []);
  const nobelReferences = useMemo(() => getNobelReferences(), []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setDim({ w: element.clientWidth, h: element.clientHeight });
    });
    observer.observe(element);
    setDim({ w: element.clientWidth, h: element.clientHeight });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    cam.current = { x: 0, y: 0, scale: 1 };
  }, [stage.height, stage.width]);

  const clampCamera = useCallback(() => {
    const maxOffsetX = Math.max((stage.width * (cam.current.scale - 1)) / 2, 0);
    const maxOffsetY = Math.max((stage.height * (cam.current.scale - 1)) / 2, 0);
    cam.current.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, cam.current.x));
    cam.current.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, cam.current.y));
  }, [stage.height, stage.width]);

  const isInsideStage = useCallback(
    (x: number, y: number) =>
      x >= stage.x && x <= stage.x + stage.width && y >= stage.y && y <= stage.y + stage.height,
    [stage],
  );

  const toScreen = useCallback(
    (x: number, y: number): ScreenPoint => {
      // Y 轴翻转: 理论在上 (1) → 应用在下 (0)
      const baseX = stage.x + x * stage.width;
      const baseY = stage.y + (1 - y) * stage.height;
      return {
        x: stage.centerX + (baseX - stage.centerX) * cam.current.scale + cam.current.x,
        y: stage.centerY + (baseY - stage.centerY) * cam.current.scale + cam.current.y,
      };
    },
    [stage],
  );

  const draw = useCallback(
    (timeMs = 0) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { w, h } = dim;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      const time = timeMs * 0.00028;
      const theme = getComputedStyle(document.documentElement);
      const graphBgInner = theme.getPropertyValue("--graph-bg-inner").trim() || "#16201a";
      const graphBgOuter = theme.getPropertyValue("--graph-bg-outer").trim() || "#0f1310";
      const graphGrid = theme.getPropertyValue("--graph-grid").trim() || "rgba(255,255,255,0.04)";
      const graphLegend = theme.getPropertyValue("--graph-legend").trim() || "rgba(156,163,175,0.75)";
      const graphNodeCount = theme.getPropertyValue("--graph-node-count").trim() || "rgba(156,163,175,0.5)";
      const graphStageStart = theme.getPropertyValue("--graph-stage-fill-start").trim() || "rgba(15,21,18,0.78)";
      const graphStageEnd = theme.getPropertyValue("--graph-stage-fill-end").trim() || "rgba(10,14,12,0.88)";
      const graphStageGuide = theme.getPropertyValue("--graph-stage-guide").trim() || "rgba(120, 142, 190, 0.14)";

      // 背景渐变
      const bg = ctx.createRadialGradient(
        w * (0.34 + Math.sin(time * 0.32) * 0.02),
        h * (0.4 + Math.cos(time * 0.24) * 0.02),
        0,
        w * 0.52,
        h * 0.5,
        Math.max(w, h) * 0.92,
      );
      bg.addColorStop(0, graphBgInner);
      bg.addColorStop(1, graphBgOuter);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // 背景装饰线
      ctx.save();
      for (let band = 0; band < 4; band += 1) {
        const y = h * (0.18 + band * 0.2);
        ctx.strokeStyle = graphGrid;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-40, y + Math.sin(time + band) * 10);
        ctx.bezierCurveTo(
          w * 0.2,
          y - 18,
          w * 0.65,
          y + 18,
          w + 40,
          y + Math.cos(time + band) * 8,
        );
        ctx.stroke();
      }
      ctx.restore();

      // 舞台背景
      const stageFill = ctx.createLinearGradient(stage.x, stage.y, stage.x, stage.y + stage.height);
      stageFill.addColorStop(0, graphStageStart);
      stageFill.addColorStop(1, graphStageEnd);
      ctx.fillStyle = stageFill;
      ctx.beginPath();
      ctx.roundRect(stage.x, stage.y, stage.width, stage.height, 24);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(stage.x, stage.y, stage.width, stage.height, 24);
      ctx.clip();

      // 绘制 X 轴场景分隔线 (垂直虚线)
      ctx.strokeStyle = graphStageGuide;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 8]);
      for (const scene of scenesX) {
        if (scene.range[0] > 0) {
          const x = toScreen(scene.range[0], 0.5).x;
          ctx.beginPath();
          ctx.moveTo(x, stage.y + 20);
          ctx.lineTo(x, stage.y + stage.height - 20);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);

      // 绘制 Y 轴层级分隔线 (水平虚线)
      ctx.setLineDash([4, 8]);
      for (const level of levelsY) {
        if (level.range[0] > 0) {
          const y = toScreen(0.5, level.range[0]).y;
          ctx.beginPath();
          ctx.moveTo(stage.x + 20, y);
          ctx.lineTo(stage.x + stage.width - 20, y);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);

      // 绘制诺贝尔奖参考点 (背景层 - 学术风格图标)
      for (const beacon of nobelReferences) {
        const point = toScreen(beacon.x, beacon.y);
        drawNobelIcon(ctx, point.x, point.y, beacon.field, 12);
      }

      // 绘制任务节点 (前景层 - 小圆点)
      const baseRadius = Math.max(2.5, 3 * cam.current.scale);
      for (const item of renderSemanticNodes) {
        const point = toScreen(item.x, item.y);
        const domain = getPublicDomainColorDomain(item.node.domain);

        // 光晕
        const halo = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          baseRadius * 3.5,
        );
        halo.addColorStop(0, getGraphDomainGlow(domain, 0.18));
        halo.addColorStop(0.6, getGraphDomainTint(domain, 0.06));
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(point.x, point.y, baseRadius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // 节点圆点
        const dot = ctx.createRadialGradient(
          point.x - baseRadius * 0.2,
          point.y - baseRadius * 0.2,
          0,
          point.x,
          point.y,
          baseRadius,
        );
        dot.addColorStop(0, "rgba(255,255,255,0.9)");
        dot.addColorStop(0.4, getGraphDomainGlow(domain, 0.95));
        dot.addColorStop(1, getGraphDomainGlow(domain, 0.85));
        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(point.x, point.y, baseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 绘制选中节点高亮
      if (tooltip && "node" in tooltip) {
        const target = semanticNodeMap.get(tooltip.node.id);
        if (target) {
          const point = toScreen(target.x, target.y);
          ctx.strokeStyle = getGraphDomainColor(tooltip.node.domain);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(point.x, point.y, baseRadius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();

      // 统计信息
      ctx.font = "500 12px JetBrains Mono, monospace";
      ctx.fillStyle = graphNodeCount;
      ctx.textAlign = "right";
      ctx.fillText(
        `${filteredNodes.length.toLocaleString()} nodes · ${nobelReferences.length} Nobel references`,
        w - 18,
        26,
      );
      ctx.textAlign = "left";

      // 底部提示
      ctx.font = "500 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = graphLegend;
      ctx.textBaseline = "alphabetic";
      ctx.fillText("drag to pan · scroll to zoom", 18, h - 18);
    },
    [
      dim,
      filteredNodes.length,
      levelsY,
      nobelReferences,
      renderSemanticNodes,
      scenesX,
      semanticNodeMap,
      stage,
      toScreen,
      tooltip,
    ],
  );

  useEffect(() => {
    cancelAnimationFrame(animFrame.current);
    let lastFrame = 0;
    const render = (timeMs: number) => {
      if (timeMs - lastFrame > 32) {
        draw(timeMs);
        lastFrame = timeMs;
      }
      animFrame.current = requestAnimationFrame(render);
    };
    animFrame.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame.current);
  }, [draw]);

  const findNode = useCallback(
    (mx: number, my: number): MapNode | null => {
      let closest: MapNode | null = null;
      let closestDistance = Math.max(12, 10 * cam.current.scale) ** 2;
      for (const item of semanticNodes) {
        const point = toScreen(item.x, item.y);
        const distance = (point.x - mx) ** 2 + (point.y - my) ** 2;
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = item.node;
        }
      }
      return closest;
    },
    [semanticNodes, toScreen],
  );

  const findNobelBeacon = useCallback(
    (mx: number, my: number): NobelReference | null => {
      let closest: NobelReference | null = null;
      let closestDistance = 16 ** 2;
      for (const beacon of nobelReferences) {
        const point = toScreen(beacon.x, beacon.y);
        const distance = (point.x - mx) ** 2 + (point.y - my) ** 2;
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = beacon;
        }
      }
      return closest;
    },
    [nobelReferences, toScreen],
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      if (!isInsideStage(mx, my)) return;

      event.preventDefault();
      const mouseRelX = mx - stage.centerX;
      const mouseRelY = my - stage.centerY;
      const factor = event.deltaY > 0 ? 0.92 : 1.08;
      const nextScale = Math.max(1, Math.min(3.5, cam.current.scale * factor));

      cam.current.x = mouseRelX - (mouseRelX - cam.current.x) * (nextScale / cam.current.scale);
      cam.current.y = mouseRelY - (mouseRelY - cam.current.y) * (nextScale / cam.current.scale);
      cam.current.scale = nextScale;
      clampCamera();
    },
    [clampCamera, isInsideStage, stage.centerX, stage.centerY],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      if (!isInsideStage(mx, my)) return;
      drag.current = { active: true, sx: event.clientX, sy: event.clientY, cx: cam.current.x, cy: cam.current.y };
    },
    [isInsideStage],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;

      if (drag.current.active) {
        cam.current.x = drag.current.cx + (event.clientX - drag.current.sx);
        cam.current.y = drag.current.cy + (event.clientY - drag.current.sy);
        clampCamera();
        setTooltip(null);
        canvas.style.cursor = "grabbing";
        return;
      }

      if (!isInsideStage(mx, my)) {
        canvas.style.cursor = "default";
        setTooltip(null);
        return;
      }

      const found = findNode(mx, my);
      if (found) {
        canvas.style.cursor = "pointer";
        setTooltip({ x: event.clientX, y: event.clientY, node: found });
      } else {
        const foundBeacon = findNobelBeacon(mx, my);
        if (foundBeacon) {
          canvas.style.cursor = "pointer";
          setTooltip({ x: event.clientX, y: event.clientY, beacon: foundBeacon });
        } else {
          canvas.style.cursor = "grab";
          setTooltip(null);
        }
      }
    },
    [clampCamera, findNobelBeacon, findNode, isInsideStage],
  );

  const handleMouseUp = useCallback(() => {
    drag.current.active = false;
    clampCamera();
  }, [clampCamera]);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!onNodeClick) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      if (!isInsideStage(mx, my)) return;
      const found = findNode(mx, my);
      if (found) onNodeClick(found);
    },
    [findNode, isInsideStage, onNodeClick],
  );

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: "default" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          drag.current.active = false;
          setTooltip(null);
        }}
        onClick={handleClick}
      />

      <svg
        className="pointer-events-none absolute inset-0 z-10"
        width={dim.w}
        height={dim.h}
        viewBox={`0 0 ${dim.w} ${dim.h}`}
        aria-hidden="true"
      >
        {/* 舞台边框 */}
        <rect
          x={stage.x}
          y={stage.y}
          width={stage.width}
          height={stage.height}
          rx={24}
          fill="rgba(0,0,0,0)"
          stroke="var(--graph-stage-border)"
          strokeWidth="1.2"
        />

        {/* X 轴 */}
        <line
          x1={stage.x}
          y1={stage.y + stage.height}
          x2={stage.x + stage.width}
          y2={stage.y + stage.height}
          stroke="var(--graph-stage-axis)"
          strokeWidth="1.2"
        />
        {/* Y 轴 */}
        <line
          x1={stage.x}
          y1={stage.y}
          x2={stage.x}
          y2={stage.y + stage.height}
          stroke="var(--graph-stage-axis)"
          strokeWidth="1.2"
        />

        {/* X 轴端点标签 */}
        <text
          x={stage.x + 12}
          y={stage.y + stage.height + 26}
          fill="var(--graph-stage-axis-label)"
          fontSize="11"
          fontWeight="700"
          textAnchor="start"
        >
          Macro ← Universe
        </text>
        <text
          x={stage.x + stage.width - 12}
          y={stage.y + stage.height + 26}
          fill="var(--graph-stage-axis-label)"
          fontSize="11"
          fontWeight="700"
          textAnchor="end"
        >
          Quantum → Micro
        </text>

        {/* X 轴场景标签 */}
        {scenesX.map((scene) => {
          const x = stage.x + ((scene.range[0] + scene.range[1]) / 2) * stage.width;
          return (
            <text
              key={scene.key}
              x={x}
              y={stage.y + stage.height + 48}
              fill="var(--graph-stage-label)"
              fontSize="10"
              fontWeight="500"
              textAnchor="middle"
            >
              {scene.labelEn}
            </text>
          );
        })}

        {/* Y 轴层级标签 */}
        {levelsY.map((level) => {
          const y = stage.y + (1 - (level.range[0] + level.range[1]) / 2) * stage.height;
          return (
            <text
              key={level.key}
              x={stage.x - 12}
              y={y}
              fill="var(--graph-stage-label)"
              fontSize="11"
              fontWeight="600"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {level.labelEn}
            </text>
          );
        })}
      </svg>

      {/* 图例 */}
      <div className="pointer-events-none absolute right-6 top-24 z-20 max-w-xs">
        <div className="graph-ui-panel rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">⚛</span>
            <span className="text-sm">⚗</span>
            <span className="text-sm">✚</span>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
              Nobel Reference Beacons
            </span>
          </div>
          <p className="text-xs leading-relaxed text-text-muted">
            Landmark Nobel discoveries from physics, chemistry, and medicine.
            Hover a beacon to inspect the year, winners, and contribution.
          </p>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip ? (
        <div
          className="fixed z-50 pointer-events-none max-w-sm"
          style={{ left: tooltip.x + 16, top: tooltip.y - 12 }}
        >
          <div className="graph-ui-panel rounded-2xl px-4 py-3">
            {"node" in tooltip ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: getGraphDomainColor(getPublicDomainColorDomain(tooltip.node.domain)),
                      boxShadow: `0 0 8px ${getGraphDomainGlow(getPublicDomainColorDomain(tooltip.node.domain), 0.4)}`,
                    }}
                  />
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    {getPublicDomainLabel(tooltip.node.domain)}
                  </span>
                  {tooltip.node.success !== undefined ? (
                    <span className={`text-xs ml-auto ${tooltip.node.success ? "text-emerald-400" : "text-red-400"}`}>
                      {tooltip.node.success ? "success" : "failed"}
                    </span>
                  ) : null}
                </div>

                <p className="text-sm text-text-primary font-medium leading-snug mb-2 line-clamp-2">
                  {(tooltip.node.label || "").replace("[Experiment] ", "")}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{tooltip.node.metric_name}</span>
                  <span className="text-text-primary font-mono font-semibold">
                    {typeof tooltip.node.metric_value === "number"
                      ? tooltip.node.metric_value.toFixed(4)
                      : tooltip.node.metric_value}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{tooltip.beacon.symbol}</span>
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    Nobel Beacon
                  </span>
                  <span className="text-xs ml-auto text-text-muted">
                    {tooltip.beacon.year}
                  </span>
                </div>
                <p className="text-sm text-text-primary font-medium leading-snug mb-1">
                  {tooltip.beacon.contribution}
                </p>
                <p className="text-xs text-text-secondary mb-1">
                  {tooltip.beacon.winners}
                </p>
                <p className="text-xs text-text-muted">
                  {tooltip.beacon.publicDomain}
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
