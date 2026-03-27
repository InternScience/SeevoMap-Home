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
  getSemanticDomainAnchors,
  getSemanticMaturityBands,
  layoutSemanticNodes,
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
}

interface ScreenPoint {
  x: number;
  y: number;
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
  const [, setCameraVersion] = useState(0);

  const cam = useRef({ x: 0, y: 0, scale: 1 });
  const drag = useRef({ active: false, sx: 0, sy: 0, cx: 0, cy: 0 });
  const animFrame = useRef<number>(0);
  const overlayFrame = useRef<number | null>(null);

  const filteredNodes = domainFilter
    ? data.nodes.filter((node) => domainFilter.has(node.domain))
    : data.nodes;

  const stage = useMemo<StageLayout>(() => {
    const width = Math.min(Math.max(dim.w * 0.78, 680), Math.max(320, dim.w - 56), 1100);
    const height = Math.min(Math.max(dim.h * 0.72, 480), Math.max(260, dim.h - 120), 700);
    const x = (dim.w - width) / 2;
    const y = Math.max(108, (dim.h - height) / 2 + 18);
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

  const publicAnchors = useMemo(() => getSemanticDomainAnchors(), []);
  const maturityBands = useMemo(() => getSemanticMaturityBands(), []);
  const nobelReferences = useMemo(() => getNobelReferences(), []);
  const nobelLinks = useMemo(() => {
    return nobelReferences.flatMap((beacon) => {
      const candidates = semanticNodes
        .filter((item) => getPublicDomainLabel(item.node.domain) === beacon.publicDomain)
        .map((item) => ({
          beacon,
          node: item.node,
          nodeX: item.x,
          nodeY: item.y,
          distance: Math.hypot(item.x - beacon.x, item.y - beacon.y),
        }))
        .sort((left, right) => left.distance - right.distance)
        .slice(0, 3);

      return candidates;
    });
  }, [nobelReferences, semanticNodes]);

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

  const requestOverlayRefresh = useCallback(() => {
    if (overlayFrame.current !== null) return;
    overlayFrame.current = requestAnimationFrame(() => {
      overlayFrame.current = null;
      setCameraVersion((value) => value + 1);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (overlayFrame.current !== null) {
        cancelAnimationFrame(overlayFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    cam.current = { x: 0, y: 0, scale: 1 };
    requestOverlayRefresh();
  }, [requestOverlayRefresh, stage.height, stage.width]);

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
      const baseX = stage.x + x * stage.width;
      const baseY = stage.y + y * stage.height;
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
      const graphStageBeaconFill = theme.getPropertyValue("--graph-stage-beacon-fill").trim() || "rgba(255,255,255,0.08)";
      const graphStageBeaconStroke = theme.getPropertyValue("--graph-stage-beacon-stroke").trim() || "rgba(255,255,255,0.14)";
      const graphStageBeaconText = theme.getPropertyValue("--graph-stage-beacon-text").trim() || "rgba(240,234,219,0.92)";

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

      const stageFill = ctx.createLinearGradient(stage.x, stage.y, stage.x, stage.y + stage.height);
      stageFill.addColorStop(0, graphStageStart);
      stageFill.addColorStop(1, graphStageEnd);
      ctx.fillStyle = stageFill;
      ctx.beginPath();
      ctx.roundRect(stage.x, stage.y, stage.width, stage.height, 28);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(stage.x, stage.y, stage.width, stage.height, 28);
      ctx.clip();

      const stageAtmosphere = [
        { x: 0.18, y: 0.22, r: 0.32, domain: "pretraining", alpha: 0.12 },
        { x: 0.42, y: 0.28, r: 0.22, domain: "physics", alpha: 0.08 },
        { x: 0.62, y: 0.42, r: 0.28, domain: "chemistry", alpha: 0.07 },
        { x: 0.78, y: 0.58, r: 0.28, domain: "earth_space", alpha: 0.07 },
      ];

      for (const field of stageAtmosphere) {
        const gx = stage.x + field.x * stage.width;
        const gy = stage.y + field.y * stage.height;
        const radius = stage.width * field.r;
        const wash = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
        wash.addColorStop(0, getGraphDomainTint(field.domain, field.alpha));
        wash.addColorStop(0.5, getGraphDomainGlow(field.domain, field.alpha * 0.55));
        wash.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = wash;
        ctx.beginPath();
        ctx.arc(gx, gy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const band of maturityBands) {
        const start = toScreen(0.03, band.y);
        const end = toScreen(0.97, band.y);
        ctx.strokeStyle = graphStageGuide;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 9]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      let edgeCount = 0;
      for (const edge of data.edges) {
        if (edgeCount > 2600) break;
        const source = semanticNodeMap.get(edge.source);
        const target = semanticNodeMap.get(edge.target);
        if (!source || !target) continue;

        const sp = toScreen(source.x, source.y);
        const tp = toScreen(target.x, target.y);
        const distance = Math.hypot(tp.x - sp.x, tp.y - sp.y);
        if (distance > stage.width * 0.42) continue;

        const gradient = ctx.createLinearGradient(sp.x, sp.y, tp.x, tp.y);
        gradient.addColorStop(0, getGraphDomainGlow(source.node.domain, 0.11));
        gradient.addColorStop(1, getGraphDomainGlow(target.node.domain, 0.11));
        ctx.strokeStyle = gradient;
        ctx.lineWidth = distance > stage.width * 0.12 ? 0.65 : 0.95;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.quadraticCurveTo((sp.x + tp.x) / 2, (sp.y + tp.y) / 2 - 8, tp.x, tp.y);
        ctx.stroke();
        edgeCount += 1;
      }

      let nobelEdgeCount = 0;
      for (const link of nobelLinks) {
        const start = toScreen(link.beacon.x, link.beacon.y);
        const end = toScreen(link.nodeX, link.nodeY);
        const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        gradient.addColorStop(0, graphStageBeaconStroke);
        gradient.addColorStop(1, getGraphDomainGlow(link.node.domain, 0.16));
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 8]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo((start.x + end.x) / 2, (start.y + end.y) / 2 - 10, end.x, end.y);
        ctx.stroke();
        nobelEdgeCount += 1;
      }
      ctx.setLineDash([]);

      const baseRadius = Math.max(2.3, 2.9 * cam.current.scale);
      for (const item of semanticNodes) {
        const point = toScreen(item.x, item.y);
        const radius = baseRadius;
        const color = getGraphDomainColor(item.node.domain);

        const halo = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 3.2);
        halo.addColorStop(0, getGraphDomainGlow(item.node.domain, 0.16));
        halo.addColorStop(0.7, getGraphDomainTint(item.node.domain, 0.05));
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius * 3.2, 0, Math.PI * 2);
        ctx.fill();

        const dot = ctx.createRadialGradient(
          point.x - radius * 0.24,
          point.y - radius * 0.24,
          0,
          point.x,
          point.y,
          radius,
        );
        dot.addColorStop(0, "rgba(255,255,255,0.94)");
        dot.addColorStop(0.35, color);
        dot.addColorStop(1, color);
        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const beacon of nobelReferences) {
        const point = toScreen(beacon.x, beacon.y);
        const halo = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 16);
        halo.addColorStop(0, "rgba(255,255,255,0.18)");
        halo.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = graphStageBeaconFill;
        ctx.strokeStyle = graphStageBeaconStroke;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = graphStageBeaconText;
        ctx.font = "700 10px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(beacon.symbol, point.x, point.y + 0.5);
      }

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

      ctx.font = "500 12px JetBrains Mono, monospace";
      ctx.fillStyle = graphNodeCount;
      ctx.textAlign = "right";
      ctx.fillText(
        `${filteredNodes.length.toLocaleString()} nodes · ${Math.min(edgeCount, 2600).toLocaleString()} semantic edges · ${nobelEdgeCount.toLocaleString()} reference ties`,
        w - 18,
        26,
      );
      ctx.textAlign = "left";

      ctx.font = "500 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = graphLegend;
      ctx.textBaseline = "alphabetic";
      ctx.fillText("drag inside the stage · scroll to zoom", 18, h - 18);
    },
    [data.edges, dim, filteredNodes.length, maturityBands, nobelLinks, nobelReferences, semanticNodeMap, semanticNodes, stage, toScreen, tooltip],
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
      let closestDistance = Math.max(10, 8 * cam.current.scale) ** 2;
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
      let closestDistance = 14 ** 2;
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
      const nextScale = Math.max(1, Math.min(3.2, cam.current.scale * factor));

      cam.current.x = mouseRelX - (mouseRelX - cam.current.x) * (nextScale / cam.current.scale);
      cam.current.y = mouseRelY - (mouseRelY - cam.current.y) * (nextScale / cam.current.scale);
      cam.current.scale = nextScale;
      clampCamera();
      requestOverlayRefresh();
    },
    [clampCamera, isInsideStage, requestOverlayRefresh, stage.centerX, stage.centerY],
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
        requestOverlayRefresh();
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
    [clampCamera, findNobelBeacon, findNode, isInsideStage, requestOverlayRefresh],
  );

  const handleMouseUp = useCallback(() => {
    drag.current.active = false;
    clampCamera();
    requestOverlayRefresh();
  }, [clampCamera, requestOverlayRefresh]);

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
        <defs>
          <clipPath id="semantic-stage-clip">
            <rect x={stage.x} y={stage.y} width={stage.width} height={stage.height} rx={28} />
          </clipPath>
        </defs>

        <rect
          x={stage.x}
          y={stage.y}
          width={stage.width}
          height={stage.height}
          rx={28}
          fill="rgba(0,0,0,0)"
          stroke="var(--graph-stage-border)"
          strokeWidth="1.2"
        />

        <line
          x1={stage.x}
          y1={stage.y + stage.height}
          x2={stage.x + stage.width}
          y2={stage.y + stage.height}
          stroke="var(--graph-stage-axis)"
          strokeWidth="1.2"
        />
        <line
          x1={stage.x}
          y1={stage.y}
          x2={stage.x}
          y2={stage.y + stage.height}
          stroke="var(--graph-stage-axis)"
          strokeWidth="1.2"
        />

        <text
          x={stage.x + 10}
          y={stage.y + stage.height + 28}
          fill="var(--graph-stage-axis-label)"
          fontSize="11"
          fontWeight="700"
          textAnchor="start"
        >
          ← Micro / Abstract
        </text>
        <text
          x={stage.x + stage.width - 10}
          y={stage.y + stage.height + 28}
          fill="var(--graph-stage-axis-label)"
          fontSize="11"
          fontWeight="700"
          textAnchor="end"
        >
          Macro / Systems →
        </text>

        {maturityBands.map((band) => {
          const y = stage.y + band.y * stage.height;
          return (
            <text
              key={band.key}
              x={stage.x - 14}
              y={y}
              fill="var(--graph-stage-label)"
              fontSize="12"
              fontWeight="600"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {band.label}
            </text>
          );
        })}

        {publicAnchors.map((anchor) => (
          <text
            key={anchor.key}
            x={stage.x + anchor.x * stage.width}
            y={stage.y + stage.height + 54}
            fill="var(--graph-stage-label)"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
          >
            {anchor.label}
          </text>
        ))}

      </svg>

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
