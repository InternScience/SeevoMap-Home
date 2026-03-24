import { useEffect, useState, useCallback } from "react";
import { fetchMapData } from "../utils/api";
import type { MapData, MapNode } from "../utils/types";
import GraphVisualization from "../components/GraphVisualization";

export default function GraphPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allDomains, setAllDomains] = useState<string[]>([]);
  const [enabledDomains, setEnabledDomains] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);

  useEffect(() => {
    fetchMapData()
      .then((data) => {
        setMapData(data);
        const domains = [...new Set(data.nodes.map((n) => n.domain))].sort();
        setAllDomains(domains);
        setEnabledDomains(new Set(domains));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleDomain = useCallback((domain: string) => {
    setEnabledDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }, []);

  const handleNodeClick = useCallback((node: MapNode) => {
    setSelectedNode(node);
  }, []);

  if (loading) {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load graph data</p>
          <p className="text-text-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const filteredCount = mapData.nodes.filter((n) => enabledDomains.has(n.domain)).length;
  const DOMAIN_COLORS: Record<string, string> = {
    pretraining: "#3B82F6",
    posttraining: "#EF4444",
    model_compression: "#F59E0B",
  };

  return (
    <div className="pt-16 relative" style={{ height: "100vh" }}>
      {/* Graph canvas */}
      <div className="absolute inset-0 pt-16">
        <GraphVisualization
          data={mapData}
          height={window.innerHeight - 64}
          onNodeClick={handleNodeClick}
          domainFilter={enabledDomains}
        />
      </div>

      {/* Left filter panel */}
      <div className="absolute top-20 left-4 z-10 glass rounded-xl p-4 w-60 animate-fade-in">
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Domains</h3>
        <div className="space-y-2.5 mb-4">
          {allDomains.map((domain) => (
            <label key={domain} className="flex items-center gap-2.5 text-sm cursor-pointer group">
              <input
                type="checkbox"
                checked={enabledDomains.has(domain)}
                onChange={() => toggleDomain(domain)}
                className="rounded border-border-subtle bg-bg-primary text-emerald-primary focus:ring-emerald-primary/30 focus:ring-offset-0 w-4 h-4"
              />
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: DOMAIN_COLORS[domain] || "#6B7280" }}
              />
              <span className="text-text-secondary group-hover:text-text-primary transition-colors truncate">
                {domain}
              </span>
              <span className="text-text-muted text-xs ml-auto font-mono">
                {mapData.nodes.filter((n) => n.domain === domain).length}
              </span>
            </label>
          ))}
        </div>
        <div className="border-t border-white/10 pt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Showing</span>
            <span className="text-text-primary font-mono">{filteredCount.toLocaleString()} nodes</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Connections</span>
            <span className="text-text-primary font-mono">{mapData.edges.length.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Node detail panel (from map.json data, no API call) */}
      {selectedNode && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setSelectedNode(null)} />
          <div
            className="fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-bg-card border-l border-border-subtle overflow-y-auto"
            style={{ animation: "slide-in-right 0.3s ease-out" }}
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 pt-14 space-y-5">
              {/* Domain + Success */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full border"
                  style={{
                    color: DOMAIN_COLORS[selectedNode.domain] || "#9CA3AF",
                    borderColor: (DOMAIN_COLORS[selectedNode.domain] || "#9CA3AF") + "40",
                    backgroundColor: (DOMAIN_COLORS[selectedNode.domain] || "#9CA3AF") + "15",
                  }}
                >
                  {selectedNode.domain}
                </span>
                {selectedNode.success !== undefined && (
                  <span className={`text-xs px-2.5 py-1 rounded-full ${selectedNode.success ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"}`}>
                    {selectedNode.success ? "success" : "failed"}
                  </span>
                )}
                <span className="text-[10px] text-text-muted font-mono ml-auto">ID: {selectedNode.id}</span>
              </div>

              {/* Idea / Label */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Experiment</h3>
                <p className="text-text-primary leading-relaxed text-sm">
                  {(selectedNode.label || "").replace("[Experiment] ", "")}
                </p>
              </div>

              {/* Metric */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Result</h3>
                <div className="bg-bg-primary rounded-lg p-4 border border-border-subtle">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">{selectedNode.metric_name}</span>
                    <span className="text-text-primary font-mono font-bold text-lg">
                      {typeof selectedNode.metric_value === "number"
                        ? selectedNode.metric_value.toFixed(4)
                        : selectedNode.metric_value}
                    </span>
                  </div>
                </div>
              </div>

              {/* Method tags */}
              {selectedNode.method_tags && selectedNode.method_tags.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Methods</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.method_tags.map((tag) => (
                      <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-text-secondary border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Source */}
              {selectedNode.source && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Source</h3>
                  <p className="text-text-secondary text-sm font-mono">{selectedNode.source}</p>
                </div>
              )}

              {/* Task */}
              {selectedNode.task_name && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Task</h3>
                  <p className="text-text-secondary text-sm">{selectedNode.task_name}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
