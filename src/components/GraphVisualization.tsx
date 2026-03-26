import { useEffect, useRef, useState, useCallback } from "react";
import type { MapData, MapNode } from "../utils/types";
import {
  getGraphDomainColor,
  getGraphDomainGlow,
  getGraphDomainTint,
} from "../utils/graphPalette";

interface Props {
  data: MapData;
  height?: number;
  onNodeClick?: (node: MapNode) => void;
  domainFilter?: Set<string>;
}

interface DomainCluster {
  domain: string;
  count: number;
  x: number;
  y: number;
}

interface RegionLabel {
  label: string;
  x: number;
  y: number;
  size: number;
  domain: string;
}

export default function GraphVisualization({
  data,
  height = 700,
  onNodeClick,
  domainFilter,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: MapNode } | null>(null);
  const [dim, setDim] = useState({ w: 800, h: height });

  const cam = useRef({ x: 0, y: 0, scale: 1.55 });
  const drag = useRef({ active: false, sx: 0, sy: 0, cx: 0, cy: 0 });
  const animFrame = useRef<number>(0);

  const filteredNodes = domainFilter
    ? data.nodes.filter((node) => domainFilter.has(node.domain))
    : data.nodes;
  const nodeIdSet = new Set(filteredNodes.map((node) => node.id));
  const nodeMap = new Map(data.nodes.map((node) => [node.id, node]));

  const bounds = useRef({ minX: 0, maxX: 1, minY: 0, maxY: 1 });
  useEffect(() => {
    if (!data.nodes.length) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const node of data.nodes) {
      if (node.x < minX) minX = node.x;
      if (node.x > maxX) maxX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.y > maxY) maxY = node.y;
    }
    const padX = (maxX - minX) * 0.1;
    const padY = (maxY - minY) * 0.1;
    bounds.current = {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }, [data]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setDim({ w: el.clientWidth, h: el.clientHeight });
    });
    observer.observe(el);
    setDim({ w: el.clientWidth, h: el.clientHeight });
    return () => observer.disconnect();
  }, []);

  const toScreen = useCallback((wx: number, wy: number) => {
    const { w, h } = dim;
    const { minX, maxX, minY, maxY } = bounds.current;
    const { x, y, scale } = cam.current;
    const sx = ((wx - minX) / (maxX - minX)) * w;
    const sy = h - ((wy - minY) / (maxY - minY)) * h;
    return {
      x: (sx - w / 2) * scale + w / 2 + x,
      y: (sy - h / 2) * scale + h / 2 + y,
    };
  }, [dim]);

  const buildClusters = useCallback((): DomainCluster[] => {
    const domainStats = new Map<string, { count: number; sumX: number; sumY: number }>();
    for (const node of filteredNodes) {
      const current = domainStats.get(node.domain) ?? { count: 0, sumX: 0, sumY: 0 };
      current.count += 1;
      current.sumX += node.x;
      current.sumY += node.y;
      domainStats.set(node.domain, current);
    }

    return [...domainStats.entries()]
      .map(([domain, value]) => ({
        domain,
        count: value.count,
        x: value.sumX / value.count,
        y: value.sumY / value.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredNodes]);

  const buildRegionLabels = useCallback((clusters: DomainCluster[]): RegionLabel[] => {
    const clusterMap = new Map(clusters.map((cluster) => [cluster.domain, cluster]));
    const scienceNodes = filteredNodes.filter((node) =>
      !["pretraining", "posttraining", "model_compression"].includes(node.domain),
    );

    const scienceAnchor = scienceNodes.length > 0
      ? {
          x: scienceNodes.reduce((sum, node) => sum + node.x, 0) / scienceNodes.length,
          y: scienceNodes.reduce((sum, node) => sum + node.y, 0) / scienceNodes.length,
        }
      : null;

    const labels: Array<RegionLabel | null> = [
      clusterMap.get("posttraining")
        ? {
            label: "Post-Training",
            x: clusterMap.get("posttraining")!.x,
            y: clusterMap.get("posttraining")!.y,
            size: 26,
            domain: "posttraining",
          }
        : null,
      clusterMap.get("pretraining")
        ? {
            label: "Pretraining",
            x: clusterMap.get("pretraining")!.x,
            y: clusterMap.get("pretraining")!.y,
            size: 28,
            domain: "pretraining",
          }
        : null,
      clusterMap.get("model_compression")
        ? {
            label: "Compression Bridge",
            x: clusterMap.get("model_compression")!.x,
            y: clusterMap.get("model_compression")!.y,
            size: 16,
            domain: "model_compression",
          }
        : null,
      scienceAnchor
        ? {
            label: "Science Clusters",
            x: scienceAnchor.x,
            y: scienceAnchor.y,
            size: 30,
            domain: "astronomy",
          }
        : null,
    ];

    return labels.filter((item): item is RegionLabel => item !== null);
  }, [filteredNodes]);

  const draw = useCallback((timeMs = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = dim;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const time = timeMs * 0.00032;
    const theme = getComputedStyle(document.documentElement);
    const graphBgInner = theme.getPropertyValue("--graph-bg-inner").trim() || "#16201a";
    const graphBgOuter = theme.getPropertyValue("--graph-bg-outer").trim() || "#0f1310";
    const graphLegend = theme.getPropertyValue("--graph-legend").trim() || "rgba(156,163,175,0.75)";
    const graphNodeCount = theme.getPropertyValue("--graph-node-count").trim() || "rgba(156,163,175,0.5)";
    const graphCurrent = theme.getPropertyValue("--graph-current").trim() || "rgba(255,255,255,0.12)";
    const graphCurrentStrong = theme.getPropertyValue("--graph-current-strong").trim() || "rgba(255,255,255,0.2)";

    const bg = ctx.createRadialGradient(
      w * (0.34 + Math.sin(time * 0.3) * 0.02),
      h * (0.36 + Math.cos(time * 0.2) * 0.02),
      0,
      w * 0.52,
      h * 0.5,
      Math.max(w, h) * 0.9,
    );
    bg.addColorStop(0, graphBgInner);
    bg.addColorStop(1, graphBgOuter);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const atmosphericFields = [
      {
        domain: "posttraining",
        x: w * (0.18 + Math.sin(time * 0.23) * 0.025),
        y: h * (0.18 + Math.cos(time * 0.19) * 0.018),
        radius: Math.max(w, h) * 0.34,
        alpha: 0.12,
      },
      {
        domain: "pretraining",
        x: w * (0.22 + Math.cos(time * 0.2) * 0.022),
        y: h * (0.76 + Math.sin(time * 0.17) * 0.02),
        radius: Math.max(w, h) * 0.36,
        alpha: 0.11,
      },
      {
        domain: "model_compression",
        x: w * (0.43 + Math.sin(time * 0.31) * 0.018),
        y: h * (0.52 + Math.cos(time * 0.27) * 0.015),
        radius: Math.max(w, h) * 0.18,
        alpha: 0.1,
      },
      {
        domain: "astronomy",
        x: w * (0.82 + Math.cos(time * 0.16) * 0.02),
        y: h * (0.46 + Math.sin(time * 0.14) * 0.018),
        radius: Math.max(w, h) * 0.38,
        alpha: 0.09,
      },
      {
        domain: "chemistry",
        x: w * (0.7 + Math.sin(time * 0.22) * 0.016),
        y: h * (0.72 + Math.cos(time * 0.18) * 0.014),
        radius: Math.max(w, h) * 0.26,
        alpha: 0.06,
      },
    ];

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const field of atmosphericFields) {
      const wash = ctx.createRadialGradient(field.x, field.y, 0, field.x, field.y, field.radius);
      wash.addColorStop(0, getGraphDomainTint(field.domain, field.alpha));
      wash.addColorStop(0.45, getGraphDomainGlow(field.domain, field.alpha * 0.7));
      wash.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = wash;
      ctx.beginPath();
      ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const verticalVeil = ctx.createLinearGradient(0, 0, 0, h);
    verticalVeil.addColorStop(0, graphCurrent);
    verticalVeil.addColorStop(0.45, "rgba(0,0,0,0)");
    verticalVeil.addColorStop(1, graphCurrent);
    ctx.fillStyle = verticalVeil;
    ctx.globalAlpha = 0.14;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "screen";
    for (let band = 0; band < 11; band += 1) {
      const baseY = h * (0.08 + band * 0.085);
      const drift = Math.sin(time * 1.1 + band * 0.8) * 18;
      const crest = Math.cos(time * 0.9 + band * 0.55) * 22;
      ctx.strokeStyle = band % 3 === 0 ? graphCurrentStrong : graphCurrent;
      ctx.lineWidth = band % 4 === 0 ? 1.4 : 0.85;
      ctx.beginPath();
      ctx.moveTo(-60, baseY + drift);
      ctx.bezierCurveTo(
        w * 0.18,
        baseY - 26 + crest,
        w * 0.56,
        baseY + 28 - crest,
        w + 60,
        baseY + drift * 0.65,
      );
      ctx.stroke();
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.25, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, graphBgOuter);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    const clusters = buildClusters();
    const strongestClusters = clusters.slice(0, 10);
    const regionLabels = buildRegionLabels(clusters);

    for (const [index, cluster] of strongestClusters.entries()) {
      const p = toScreen(cluster.x, cluster.y);
      const radius = 48 + Math.sqrt(cluster.count) * 5.8;
      const pulse = 1 + Math.sin(time * 1.25 + index * 0.7) * 0.05;
      const aura = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * pulse);
      aura.addColorStop(0, getGraphDomainGlow(cluster.domain, 0.18));
      aura.addColorStop(0.4, getGraphDomainTint(cluster.domain, 0.09));
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    const flowClusters = [...strongestClusters]
      .slice(0, 6)
      .sort((a, b) => a.x - b.x);

    ctx.lineCap = "round";
    for (let index = 0; index < flowClusters.length - 1; index += 1) {
      const start = toScreen(flowClusters[index].x, flowClusters[index].y);
      const end = toScreen(flowClusters[index + 1].x, flowClusters[index + 1].y);
      const midpointX = (start.x + end.x) / 2;
      const midpointY = (start.y + end.y) / 2;
      const offset = Math.sin(time * 1.1 + index) * 28;

      for (let layer = 0; layer < 2; layer += 1) {
        const width = layer === 0 ? 18 : 8;
        const alpha = layer === 0 ? 0.11 : 0.2;
        const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        gradient.addColorStop(0, getGraphDomainGlow(flowClusters[index].domain, alpha * 0.8));
        gradient.addColorStop(0.5, layer === 0 ? graphCurrent : graphCurrentStrong);
        gradient.addColorStop(1, getGraphDomainGlow(flowClusters[index + 1].domain, alpha * 0.8));
        ctx.strokeStyle = gradient;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(midpointX, midpointY - offset - layer * 6, end.x, end.y);
        ctx.stroke();
      }
    }

    let edgeCount = 0;
    ctx.lineWidth = 0.8;
    for (const edge of data.edges) {
      if (edgeCount > 4500) break;
      if (!nodeIdSet.has(edge.source) || !nodeIdSet.has(edge.target)) continue;
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (!source || !target) continue;

      const sp = toScreen(source.x, source.y);
      const tp = toScreen(target.x, target.y);
      if (sp.x < -80 && tp.x < -80) continue;
      if (sp.x > w + 80 && tp.x > w + 80) continue;
      if (sp.y < -80 && tp.y < -80) continue;
      if (sp.y > h + 80 && tp.y > h + 80) continue;

      const alphaShift = 0.03 + (Math.sin(time * 1.8 + edgeCount * 0.013) + 1) * 0.01;
      const gradient = ctx.createLinearGradient(sp.x, sp.y, tp.x, tp.y);
      gradient.addColorStop(0, getGraphDomainGlow(source.domain, alphaShift));
      gradient.addColorStop(0.5, graphCurrent);
      gradient.addColorStop(1, getGraphDomainGlow(target.domain, alphaShift));
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(tp.x, tp.y);
      ctx.stroke();
      edgeCount += 1;
    }

    const baseRadius = Math.max(2.3, 3.15 * cam.current.scale);
    for (const [index, node] of filteredNodes.entries()) {
      const p = toScreen(node.x, node.y);
      if (p.x < -30 || p.x > w + 30 || p.y < -30 || p.y > h + 30) continue;

      const pulse = 1 + Math.sin(time * 1.3 + index * 0.011) * 0.05;
      const radius = baseRadius * pulse;
      const color = getGraphDomainColor(node.domain);

      const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 3.2);
      halo.addColorStop(0, getGraphDomainGlow(node.domain, 0.2));
      halo.addColorStop(0.6, getGraphDomainTint(node.domain, 0.08));
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      const dot = ctx.createRadialGradient(
        p.x - radius * 0.25,
        p.y - radius * 0.25,
        0,
        p.x,
        p.y,
        radius,
      );
      dot.addColorStop(0, "rgba(255,255,255,0.96)");
      dot.addColorStop(0.35, color);
      dot.addColorStop(1, color);
      ctx.fillStyle = dot;
      ctx.globalAlpha = 0.94;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (tooltip) {
      const p = toScreen(tooltip.node.x, tooltip.node.y);
      ctx.strokeStyle = getGraphDomainColor(tooltip.node.domain);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, baseRadius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.font = "500 12px JetBrains Mono, monospace";
    ctx.fillStyle = graphNodeCount;
    ctx.textAlign = "right";
    ctx.fillText(
      `${filteredNodes.length.toLocaleString()} nodes · ${edgeCount.toLocaleString()} edges`,
      w - 18,
      26,
    );
    ctx.textAlign = "left";

    ctx.font = "500 11px Inter, system-ui, sans-serif";
    ctx.fillStyle = graphLegend;
    ctx.fillText("drag to pan · scroll to zoom", 18, h - 18);

    ctx.save();
    ctx.textAlign = "center";

    for (const region of regionLabels) {
      const p = toScreen(region.x, region.y);
      if (p.x < -140 || p.x > w + 140 || p.y < -80 || p.y > h + 80) continue;
      const scaleFactor = Math.max(0.72, Math.min(1.45, Math.sqrt(cam.current.scale / 1.55)));
      const labelSize = Math.round(region.size * scaleFactor);

      ctx.font = `700 ${labelSize}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = getGraphDomainGlow(region.domain, 0.065);
      ctx.fillText(region.label, p.x, p.y);
      ctx.font = `600 ${Math.max(11, Math.round(labelSize * 0.42))}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = graphLegend;
      ctx.globalAlpha = 0.55;
      ctx.fillText(region.label, p.x, p.y);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }, [buildClusters, buildRegionLabels, data.edges, dim, filteredNodes, nodeIdSet, nodeMap, toScreen, tooltip]);

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

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const { x, y, scale } = cam.current;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const nextScale = Math.max(0.42, Math.min(18, scale * factor));
    cam.current.x = mx - (mx - x) * (nextScale / scale);
    cam.current.y = my - (my - y) * (nextScale / scale);
    cam.current.scale = nextScale;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = cam.current;
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, cx: x, cy: y };
  }, []);

  const findNode = useCallback((mx: number, my: number): MapNode | null => {
    const hitRadius = Math.max(10, 8 * cam.current.scale);
    const hitRadiusSquared = hitRadius * hitRadius;
    let closest: MapNode | null = null;
    let closestDistance = hitRadiusSquared;

    for (const node of filteredNodes) {
      const p = toScreen(node.x, node.y);
      const distance = (p.x - mx) ** 2 + (p.y - my) ** 2;
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = node;
      }
    }
    return closest;
  }, [filteredNodes, toScreen]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentDrag = drag.current;
    if (currentDrag.active) {
      cam.current.x = currentDrag.cx + (e.clientX - currentDrag.sx);
      cam.current.y = currentDrag.cy + (e.clientY - currentDrag.sy);
      setTooltip(null);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const found = findNode(mx, my);

    if (found) {
      canvas.style.cursor = "pointer";
      setTooltip({ x: e.clientX, y: e.clientY, node: found });
    } else {
      canvas.style.cursor = "grab";
      setTooltip(null);
    }
  }, [findNode]);

  const handleMouseUp = useCallback(() => {
    drag.current.active = false;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!onNodeClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const found = findNode(e.clientX - rect.left, e.clientY - rect.top);
    if (found) onNodeClick(found);
  }, [findNode, onNodeClick]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: "grab" }}
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

      {tooltip ? (
        <div
          className="fixed z-50 pointer-events-none max-w-sm"
          style={{ left: tooltip.x + 16, top: tooltip.y - 12 }}
        >
          <div className="graph-ui-panel rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: getGraphDomainColor(tooltip.node.domain),
                  boxShadow: `0 0 8px ${getGraphDomainGlow(tooltip.node.domain, 0.4)}`,
                }}
              />
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                {tooltip.node.domain.replace(/_/g, " ")}
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

            {tooltip.node.source ? (
              <p className="text-[10px] text-text-muted mt-1.5 truncate">
                {tooltip.node.source}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
