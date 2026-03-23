import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { MapData } from "../utils/types";

const DOMAIN_COLOR_MAP: Record<string, string> = {
  pretraining: "#3B82F6",
  posttraining: "#EF4444",
  compression: "#F59E0B",
  data: "#8B5CF6",
  evaluation: "#10B981",
};

function getDomainColor(domain: string): string {
  const key = domain.toLowerCase();
  for (const [k, v] of Object.entries(DOMAIN_COLOR_MAP)) {
    if (key.includes(k)) return v;
  }
  return "#6B7280";
}

interface GraphVisualizationProps {
  data: MapData;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
  domainFilter?: Set<string>;
}

export default function GraphVisualization({
  data,
  height = 700,
  onNodeClick,
  domainFilter,
}: GraphVisualizationProps) {
  const { traces, edgeTrace } = useMemo(() => {
    const filteredNodes = domainFilter
      ? data.nodes.filter((n) => domainFilter.has(n.domain))
      : data.nodes;

    const nodeIds = new Set(filteredNodes.map((n) => n.id));

    // Group nodes by domain
    const byDomain: Record<string, typeof filteredNodes> = {};
    for (const node of filteredNodes) {
      if (!byDomain[node.domain]) byDomain[node.domain] = [];
      byDomain[node.domain].push(node);
    }

    const nodeTraces = Object.entries(byDomain).map(([domain, nodes]) => ({
      type: "scatter" as const,
      mode: "markers" as const,
      name: domain,
      x: nodes.map((n) => n.x),
      y: nodes.map((n) => n.y),
      customdata: nodes.map((n) => n.id),
      text: nodes.map(
        (n) =>
          `<b>${n.label || n.id}</b><br>${n.metric_name}: ${
            typeof n.metric_value === "number"
              ? n.metric_value.toFixed(4)
              : n.metric_value
          }<br><i>${n.idea?.slice(0, 80) ?? ""}...</i>`,
      ),
      hovertemplate: "%{text}<extra></extra>",
      marker: {
        color: getDomainColor(domain),
        size: 6,
        opacity: 0.8,
        line: { width: 0 },
      },
    }));

    // Edges (limit for performance)
    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));
    const edgesSlice = data.edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
    ).slice(0, 3000);

    const edgeX: (number | null)[] = [];
    const edgeY: (number | null)[] = [];
    for (const edge of edgesSlice) {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (s && t) {
        edgeX.push(s.x, t.x, null);
        edgeY.push(s.y, t.y, null);
      }
    }

    const edgeTrace = {
      type: "scatter" as const,
      mode: "lines" as const,
      x: edgeX,
      y: edgeY,
      line: { color: "rgba(255,255,255,0.04)", width: 0.5 },
      hoverinfo: "skip" as const,
      showlegend: false,
    };

    return { traces: nodeTraces, edgeTrace };
  }, [data, domainFilter]);

  return (
    <Plot
      data={[edgeTrace, ...traces]}
      layout={{
        autosize: true,
        height,
        margin: { t: 20, r: 20, b: 20, l: 20 },
        paper_bgcolor: "#0B0F19",
        plot_bgcolor: "#0B0F19",
        xaxis: {
          showgrid: false,
          zeroline: false,
          showticklabels: false,
          showline: false,
        },
        yaxis: {
          showgrid: false,
          zeroline: false,
          showticklabels: false,
          showline: false,
        },
        legend: {
          font: { color: "#F9FAFB", size: 12 },
          bgcolor: "rgba(0,0,0,0)",
          orientation: "h",
          x: 0.5,
          xanchor: "center",
          y: 1.02,
          yanchor: "bottom",
        },
        hovermode: "closest",
        dragmode: "pan",
      }}
      config={{
        responsive: true,
        displayModeBar: false,
        scrollZoom: true,
      }}
      style={{ width: "100%", height: "100%" }}
      onClick={(e) => {
        if (onNodeClick && e.points[0]?.customdata) {
          onNodeClick(e.points[0].customdata as string);
        }
      }}
    />
  );
}
