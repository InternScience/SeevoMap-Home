import { useEffect, useRef, useState, useCallback } from "react";
import type { MapData, MapNode } from "../utils/types";

const DOMAIN_COLORS: Record<string, string> = {
  pretraining: "#3B82F6",
  posttraining: "#EF4444",
  model_compression: "#F59E0B",
};

const DOMAIN_GLOW: Record<string, string> = {
  pretraining: "rgba(59,130,246,0.35)",
  posttraining: "rgba(239,68,68,0.35)",
  model_compression: "rgba(245,158,11,0.35)",
};

function getDomainColor(domain: string): string {
  for (const [k, v] of Object.entries(DOMAIN_COLORS)) {
    if (domain.toLowerCase().includes(k)) return v;
  }
  return "#6B7280";
}

function getDomainGlow(domain: string): string {
  for (const [k, v] of Object.entries(DOMAIN_GLOW)) {
    if (domain.toLowerCase().includes(k)) return v;
  }
  return "rgba(107,114,128,0.3)";
}

interface Props {
  data: MapData;
  height?: number;
  onNodeClick?: (node: MapNode) => void;
  domainFilter?: Set<string>;
}

export default function GraphVisualization({ data, height = 700, onNodeClick, domainFilter }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: MapNode } | null>(null);
  const [dim, setDim] = useState({ w: 800, h: height });
  const animFrame = useRef<number>(0);

  const cam = useRef({ x: 0, y: 0, scale: 1.8 }); // start zoomed in more
  const drag = useRef({ active: false, sx: 0, sy: 0, cx: 0, cy: 0 });

  const filteredNodes = domainFilter
    ? data.nodes.filter((n) => domainFilter.has(n.domain))
    : data.nodes;
  const nodeIdSet = new Set(filteredNodes.map((n) => n.id));
  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

  // Bounds
  const bounds = useRef({ minX: 0, maxX: 1, minY: 0, maxY: 1 });
  useEffect(() => {
    if (!data.nodes.length) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of data.nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }
    const px = (maxX - minX) * 0.08, py = (maxY - minY) * 0.08;
    bounds.current = { minX: minX - px, maxX: maxX + px, minY: minY - py, maxY: maxY + py };
  }, [data]);

  // Resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDim({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setDim({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const toScreen = useCallback((wx: number, wy: number) => {
    const { w, h } = dim;
    const c = cam.current;
    const b = bounds.current;
    const sx = ((wx - b.minX) / (b.maxX - b.minX)) * w;
    const sy = h - ((wy - b.minY) / (b.maxY - b.minY)) * h;
    return {
      x: (sx - w / 2) * c.scale + w / 2 + c.x,
      y: (sy - h / 2) * c.scale + h / 2 + c.y,
    };
  }, [dim]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = dim;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Background with subtle gradient
    const bgGrad = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.5, h * 0.5, w * 0.8);
    bgGrad.addColorStop(0, "#0F1520");
    bgGrad.addColorStop(1, "#0B0F19");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Grid dots (subtle)
    ctx.fillStyle = "rgba(255,255,255,0.015)";
    const gridStep = 40;
    for (let gx = 0; gx < w; gx += gridStep) {
      for (let gy = 0; gy < h; gy += gridStep) {
        ctx.fillRect(gx, gy, 1, 1);
      }
    }

    const c = cam.current;

    // Draw edges with gradient
    let edgeCount = 0;
    ctx.lineWidth = 0.8;
    for (const edge of data.edges) {
      if (edgeCount > 5000) break;
      if (!nodeIdSet.has(edge.source) || !nodeIdSet.has(edge.target)) continue;
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (!s || !t) continue;
      const sp = toScreen(s.x, s.y);
      const tp = toScreen(t.x, t.y);
      // Skip offscreen
      if (sp.x < -50 && tp.x < -50) continue;
      if (sp.x > w + 50 && tp.x > w + 50) continue;
      if (sp.y < -50 && tp.y < -50) continue;
      if (sp.y > w + 50 && tp.y > w + 50) continue;

      const grad = ctx.createLinearGradient(sp.x, sp.y, tp.x, tp.y);
      const sc = getDomainColor(s.domain);
      const tc = getDomainColor(t.domain);
      grad.addColorStop(0, sc.replace(")", ",0.08)").replace("rgb", "rgba"));
      grad.addColorStop(1, tc.replace(")", ",0.08)").replace("rgb", "rgba"));
      ctx.strokeStyle = `rgba(255,255,255,0.06)`;
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(tp.x, tp.y);
      ctx.stroke();
      edgeCount++;
    }

    // Draw nodes — outer glow + inner bright
    const baseR = Math.max(3.5, 5 * c.scale);
    for (const node of filteredNodes) {
      const p = toScreen(node.x, node.y);
      if (p.x < -30 || p.x > w + 30 || p.y < -30 || p.y > h + 30) continue;

      const color = getDomainColor(node.domain);
      const glow = getDomainGlow(node.domain);

      // Outer glow
      const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, baseR * 3);
      glowGrad.addColorStop(0, glow);
      glowGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, baseR * 3, 0, Math.PI * 2);
      ctx.fill();

      // Main dot
      const dotGrad = ctx.createRadialGradient(p.x - baseR * 0.3, p.y - baseR * 0.3, 0, p.x, p.y, baseR);
      dotGrad.addColorStop(0, "#FFFFFF");
      dotGrad.addColorStop(0.3, color);
      dotGrad.addColorStop(1, color);
      ctx.fillStyle = dotGrad;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, baseR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Highlight hovered node
    if (tooltip) {
      const p = toScreen(tooltip.node.x, tooltip.node.y);
      const color = getDomainColor(tooltip.node.domain);
      // Ring
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, baseR + 4, 0, Math.PI * 2);
      ctx.stroke();
      // Pulse glow
      ctx.fillStyle = getDomainGlow(tooltip.node.domain).replace("0.35", "0.5");
      ctx.beginPath();
      ctx.arc(p.x, p.y, baseR * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legend bar at bottom
    const legendDomains = [...new Set(filteredNodes.map((n) => n.domain))].sort();
    ctx.font = "600 11px Inter, system-ui, sans-serif";
    let lx = 20;
    const ly = h - 20;
    for (const d of legendDomains) {
      const color = getDomainColor(d);
      // Dot
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(lx + 5, ly - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Label
      ctx.fillStyle = "#9CA3AF";
      const count = filteredNodes.filter((n) => n.domain === d).length;
      const text = `${d} (${count})`;
      ctx.fillText(text, lx + 14, ly);
      lx += ctx.measureText(text).width + 32;
    }

    // Node count top-right
    ctx.font = "500 12px JetBrains Mono, monospace";
    ctx.fillStyle = "rgba(156,163,175,0.5)";
    ctx.textAlign = "right";
    ctx.fillText(`${filteredNodes.length.toLocaleString()} nodes · ${edgeCount.toLocaleString()} edges`, w - 16, 24);
    ctx.textAlign = "left";

  }, [data, filteredNodes, nodeIdSet, nodeMap, dim, toScreen, tooltip]);

  useEffect(() => {
    cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(draw);
  }, [draw]);

  // Mouse
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const c = cam.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.88 : 1.12;
    const newScale = Math.max(0.3, Math.min(30, c.scale * factor));
    // Zoom toward mouse position
    c.x = mx - (mx - c.x) * (newScale / c.scale);
    c.y = my - (my - c.y) * (newScale / c.scale);
    c.scale = newScale;
    animFrame.current = requestAnimationFrame(draw);
  }, [draw]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const c = cam.current;
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, cx: c.x, cy: c.y };
  }, []);

  const findNode = useCallback((mx: number, my: number): MapNode | null => {
    const c = cam.current;
    const hitR = Math.max(10, 7 * c.scale);
    const hitR2 = hitR * hitR;
    let closest: MapNode | null = null;
    let closestD = hitR2;
    for (const node of filteredNodes) {
      const p = toScreen(node.x, node.y);
      const d = (p.x - mx) ** 2 + (p.y - my) ** 2;
      if (d < closestD) { closestD = d; closest = node; }
    }
    return closest;
  }, [filteredNodes, toScreen]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const d = drag.current;
    if (d.active) {
      cam.current.x = d.cx + (e.clientX - d.sx);
      cam.current.y = d.cy + (e.clientY - d.sy);
      setTooltip(null);
      animFrame.current = requestAnimationFrame(draw);
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
  }, [findNode, draw]);

  const handleMouseUp = useCallback(() => { drag.current.active = false; }, []);

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
        onMouseLeave={() => { drag.current.active = false; setTooltip(null); }}
        onClick={handleClick}
      />
      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none max-w-sm"
          style={{ left: tooltip.x + 16, top: tooltip.y - 12 }}
        >
          <div className="bg-bg-card/95 backdrop-blur-sm border border-border-subtle rounded-xl px-4 py-3 shadow-2xl">
            {/* Domain badge */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: getDomainColor(tooltip.node.domain), boxShadow: `0 0 6px ${getDomainGlow(tooltip.node.domain)}` }}
              />
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                {tooltip.node.domain}
              </span>
              {tooltip.node.success !== undefined && (
                <span className={`text-xs ml-auto ${tooltip.node.success ? "text-emerald-400" : "text-red-400"}`}>
                  {tooltip.node.success ? "success" : "failed"}
                </span>
              )}
            </div>
            {/* Label */}
            <p className="text-sm text-text-primary font-medium leading-snug mb-2 line-clamp-2">
              {(tooltip.node.label || "").replace("[Experiment] ", "")}
            </p>
            {/* Metric */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">{tooltip.node.metric_name}</span>
              <span className="text-text-primary font-mono font-semibold">
                {typeof tooltip.node.metric_value === "number" ? tooltip.node.metric_value.toFixed(4) : tooltip.node.metric_value}
              </span>
            </div>
            {/* Source */}
            {tooltip.node.source && (
              <p className="text-[10px] text-text-muted mt-1.5 truncate">
                {tooltip.node.source}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
