import { useEffect, useState, useCallback } from "react";
import { fetchMapData } from "../utils/api";
import type { MapData, MapNode } from "../utils/types";
import GraphVisualization from "../components/GraphVisualization";
import {
  getGraphDomainColor,
  getGraphDomainTint,
  getGraphDomainBorder,
} from "../utils/graphPalette";

function looksLikeInternalPlan(text: string): boolean {
  const value = (text || "").trim().toLowerCase();
  if (!value) return false;

  return [
    "## research plan",
    "created agents.md",
    "created heartbeat.md",
    "created soul.md",
    "created tools.md",
    "created user.md",
    "memory/history.md",
    "workdir:",
    "approval:",
    "sandbox:",
    "provider:",
    "openai codex",
    "research preview",
  ].some((pattern) => value.includes(pattern));
}

function getGraphMethodDisplay(node: MapNode): {
  text: string;
  isPlaceholder: boolean;
} {
  const rawIdea = (node.idea || "").trim();
  const source = (node.source || "").toLowerCase();
  const shouldSuppress =
    source.startsWith("researchclawbench/") || looksLikeInternalPlan(rawIdea);

  if (!rawIdea || rawIdea === (node.label || "").trim() || shouldSuppress) {
    return {
      text: "This public node does not include a clean method summary. Use the task title, metric, and technique tags as the reliable public fields.",
      isPlaceholder: true,
    };
  }

  return {
    text: rawIdea,
    isPlaceholder: false,
  };
}

const DOMAIN_GROUPS: { label: string; domains: string[] }[] = [
  { label: "AI Core", domains: ["pretraining", "posttraining", "model_compression"] },
  { label: "AI for Science", domains: ["astronomy", "energy_systems", "earth_science", "materials_science", "neuroscience"] },
  { label: "Science", domains: ["chemistry", "life_sciences", "physics", "mathematics", "medicine", "earth_space", "engineering", "economics"] },
];

export default function GraphPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allDomains, setAllDomains] = useState<string[]>([]);
  const [enabledDomains, setEnabledDomains] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchMapData()
      .then((data) => {
        setMapData(data);
        const domains = [...new Set(data.nodes.map((node) => node.domain))].sort();
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

  const toggleGroup = useCallback((domains: string[]) => {
    setEnabledDomains((prev) => {
      const next = new Set(prev);
      const allEnabled = domains.every((domain) => next.has(domain));
      for (const domain of domains) {
        if (allEnabled) next.delete(domain);
        else next.add(domain);
      }
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

  const filteredCount = mapData.nodes.filter((node) => enabledDomains.has(node.domain)).length;
  const enabledGroupCount = DOMAIN_GROUPS.flatMap((group) => group.domains)
    .filter((domain) => enabledDomains.has(domain)).length;

  const groupedDomains = DOMAIN_GROUPS.map((group) => ({
    ...group,
    domains: group.domains.filter((domain) => allDomains.includes(domain)),
  })).filter((group) => group.domains.length > 0);

  const knownDomains = new Set(DOMAIN_GROUPS.flatMap((group) => group.domains));
  const ungrouped = allDomains.filter((domain) => !knownDomains.has(domain));
  if (ungrouped.length > 0) {
    groupedDomains.push({ label: "Other", domains: ungrouped });
  }

  const graphHeight = typeof window !== "undefined" ? window.innerHeight - 64 : 900;
  const methodDisplay = selectedNode ? getGraphMethodDisplay(selectedNode) : null;

  return (
    <div className="pt-16 relative" style={{ height: "100vh" }}>
      <div className="absolute inset-0 pt-16">
        <GraphVisualization
          data={mapData}
          height={graphHeight}
          onNodeClick={handleNodeClick}
          domainFilter={enabledDomains}
        />
      </div>

      <div className="absolute top-20 left-4 z-20 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="graph-ui-button inline-flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-primary/12 text-amber-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span>Domains</span>
            <span className="text-[11px] font-normal text-text-muted">
              {enabledDomains.size}/{allDomains.length} enabled
            </span>
          </span>
        </button>

        <div className="graph-ui-panel rounded-full px-4 py-2.5">
          <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1">
            View
          </p>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-text-primary font-medium">
              {filteredCount.toLocaleString()} visible
            </span>
            <span className="text-text-muted">
              {enabledGroupCount} core filters
            </span>
          </div>
        </div>
      </div>

      {drawerOpen ? (
        <>
          <div
            className="fixed inset-0 z-30"
            style={{ backgroundColor: "var(--color-overlay)" }}
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="graph-ui-drawer fixed left-4 top-20 z-40 w-[320px] max-h-[calc(100vh-104px)] overflow-y-auto rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted mb-2">
                  Domain Drawer
                </p>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Shape the graph view
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Keep the graph clean by opening filters only when you need them.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="graph-ui-button rounded-full p-2 text-text-muted hover:text-text-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="graph-ui-stat rounded-2xl px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
                  Showing
                </p>
                <p className="text-lg font-semibold text-text-primary">
                  {filteredCount.toLocaleString()}
                </p>
              </div>
              <div className="graph-ui-stat rounded-2xl px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
                  Total
                </p>
                <p className="text-lg font-semibold text-text-primary">
                  {mapData.nodes.length.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {groupedDomains.map((group) => {
                const groupCount = group.domains.reduce(
                  (sum, domain) => sum + mapData.nodes.filter((node) => node.domain === domain).length,
                  0,
                );
                const allEnabled = group.domains.every((domain) => enabledDomains.has(domain));

                return (
                  <section key={group.label} className="surface-note rounded-2xl p-4">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.domains)}
                      className="w-full flex items-center justify-between text-left mb-3"
                    >
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-1">
                          {group.label}
                        </p>
                        <p className="text-sm text-text-primary">
                          {groupCount.toLocaleString()} nodes
                        </p>
                      </div>
                      <span className="graph-ui-chip rounded-full px-3 py-1 text-xs text-text-secondary">
                        {allEnabled ? "hide group" : "show group"}
                      </span>
                    </button>

                    <div className="space-y-2">
                      {group.domains.map((domain) => {
                        const count = mapData.nodes.filter((node) => node.domain === domain).length;
                        const checked = enabledDomains.has(domain);
                        return (
                          <label
                            key={domain}
                            className="graph-ui-chip flex items-center gap-3 rounded-2xl px-3 py-2.5 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDomain(domain)}
                              className="rounded border-border-subtle bg-bg-primary text-amber-primary focus:ring-amber-primary/30 focus:ring-offset-0 w-3.5 h-3.5"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getGraphDomainColor(domain) }}
                            />
                            <span className="text-sm text-text-secondary flex-1 truncate">
                              {domain.replace(/_/g, " ")}
                            </span>
                            <span className="text-[11px] text-text-muted font-mono">
                              {count}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </aside>
        </>
      ) : null}

      {selectedNode ? (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "var(--color-overlay)" }}
            onClick={() => setSelectedNode(null)}
          />
          <aside className="graph-ui-drawer fixed right-4 top-20 bottom-4 z-50 w-full max-w-[420px] rounded-3xl overflow-y-auto">
            <div className="sticky top-0 z-10 border-b border-border-subtle px-6 py-5 backdrop-blur-sm" style={{ backgroundColor: "var(--graph-ui-bg-strong)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span
                      className="rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{
                        color: getGraphDomainColor(selectedNode.domain),
                        borderColor: getGraphDomainBorder(selectedNode.domain),
                        backgroundColor: getGraphDomainTint(selectedNode.domain),
                      }}
                    >
                      {selectedNode.domain.replace(/_/g, " ")}
                    </span>
                    {selectedNode.status ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        selectedNode.status === "pending"
                          ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                          : selectedNode.success
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/15 text-red-400 border border-red-500/20"
                      }`}>
                        {selectedNode.status === "pending" ? "pending" : selectedNode.success ? "success" : "failed"}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary leading-snug mb-2">
                    {selectedNode.label || selectedNode.id}
                  </h2>
                  <p className="text-xs font-mono text-text-muted">
                    {selectedNode.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="graph-ui-button rounded-full p-2 text-text-muted hover:text-text-primary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <section className="surface-note rounded-2xl p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-3">
                  Research Frame
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="graph-ui-stat rounded-2xl px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
                      Metric
                    </p>
                    <p className="text-sm text-text-primary">{selectedNode.metric_name}</p>
                  </div>
                  <div className="graph-ui-stat rounded-2xl px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
                      Value
                    </p>
                    <p className="text-sm font-mono text-text-primary">
                      {typeof selectedNode.metric_value === "number"
                        ? selectedNode.metric_value.toFixed(4)
                        : selectedNode.metric_value}
                    </p>
                  </div>
                </div>
              </section>

              {methodDisplay ? (
                <section className="surface-card-deep section-tone-clay rounded-2xl p-5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-3">
                    Idea / Method
                  </p>
                  <p
                    className={`text-sm leading-relaxed whitespace-pre-wrap ${
                      methodDisplay.isPlaceholder ? "text-text-muted" : "text-text-secondary"
                    }`}
                  >
                    {methodDisplay.text}
                  </p>
                </section>
              ) : null}

              {selectedNode.method_tags && selectedNode.method_tags.length > 0 ? (
                <section className="surface-card-deep section-tone-sage rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
                      Techniques
                    </p>
                    <span className="text-xs text-text-muted">
                      {selectedNode.method_tags.length} tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.method_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-3 py-1 text-xs"
                        style={{
                          color: getGraphDomainColor(selectedNode.domain),
                          backgroundColor: getGraphDomainTint(selectedNode.domain, 0.14),
                          border: `1px solid ${getGraphDomainBorder(selectedNode.domain, 0.22)}`,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
