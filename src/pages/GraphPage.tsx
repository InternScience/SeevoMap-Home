import { useEffect, useState, useCallback } from "react";
import { fetchMapData, getNodeDetail } from "../utils/api";
import type { MapData, NodeDetail } from "../utils/types";
import GraphVisualization from "../components/GraphVisualization";
import NodeDetailPanel from "../components/NodeDetailPanel";

export default function GraphPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Domain filter
  const [allDomains, setAllDomains] = useState<string[]>([]);
  const [enabledDomains, setEnabledDomains] = useState<Set<string>>(new Set());

  // Node detail panel
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const handleNodeClick = useCallback(async (nodeId: string) => {
    setDetailLoading(true);
    setSelectedNode(null);
    const detail = await getNodeDetail(nodeId);
    setSelectedNode(detail);
    setDetailLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="pt-16 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading knowledge graph...</p>
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

  const filteredNodeCount = mapData.nodes.filter((n) => enabledDomains.has(n.domain)).length;

  return (
    <div className="pt-16 relative" style={{ height: "100vh" }}>
      {/* Graph */}
      <div className="absolute inset-0 pt-16">
        <GraphVisualization
          data={mapData}
          height={window.innerHeight - 64}
          onNodeClick={handleNodeClick}
          domainFilter={enabledDomains}
        />
      </div>

      {/* Left floating panel */}
      <div className="absolute top-20 left-4 z-10 glass rounded-xl p-4 w-64">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Filters</h3>

        <div className="space-y-2 mb-4">
          {allDomains.map((domain) => (
            <label
              key={domain}
              className="flex items-center gap-2 text-sm cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={enabledDomains.has(domain)}
                onChange={() => toggleDomain(domain)}
                className="rounded border-border-subtle bg-bg-primary text-emerald-primary focus:ring-emerald-primary/30 focus:ring-offset-0"
              />
              <span className="text-text-secondary group-hover:text-text-primary transition-colors">
                {domain}
              </span>
            </label>
          ))}
        </div>

        <div className="border-t border-border-subtle pt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Nodes</span>
            <span className="text-text-primary font-mono">{filteredNodeCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Edges</span>
            <span className="text-text-primary font-mono">{mapData.edges.length.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Domains</span>
            <span className="text-text-primary font-mono">{allDomains.length}</span>
          </div>
        </div>
      </div>

      {/* Node detail panel */}
      {(detailLoading || selectedNode) && (
        <NodeDetailPanel
          node={selectedNode}
          loading={detailLoading}
          onClose={() => {
            setSelectedNode(null);
            setDetailLoading(false);
          }}
        />
      )}
    </div>
  );
}
