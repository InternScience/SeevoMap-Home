import { useState } from "react";
import type { NodeDetail } from "../utils/types";

interface Props {
  node: NodeDetail | null;
  loading: boolean;
  onClose: () => void;
  onOpenNode?: (id: string) => void;
}

const DOMAIN_COLORS: Record<string, string> = {
  pretraining: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  posttraining: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  model_compression: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  chemistry: "bg-green-500/15 text-green-400 border-green-500/20",
  life_sciences: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  physics: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  mathematics: "bg-lime-500/15 text-lime-400 border-lime-500/20",
  medicine: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  earth_space: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  engineering: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  economics: "bg-teal-500/15 text-teal-400 border-teal-500/20",
  astronomy: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  neuroscience: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
};

function getDomainStyle(domain: string) {
  const key = (domain || "").toLowerCase();
  for (const [k, v] of Object.entries(DOMAIN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-gray-500/15 text-gray-400 border-gray-500/20";
}

function isHypothesis(node: NodeDetail): boolean {
  return node.status === "hypothesis" ||
    (node.source || "").includes("ScivBook") ||
    node.metric_name === "novelty_score";
}

function SectionCard({ icon, title, badge, children }: {
  icon: string; title: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="surface-card-deep section-tone-stone rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        {badge && <span className="text-xs text-text-muted">{badge}</span>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/** Split idea text: [Experiment]...[Code Changes]... */
function splitIdea(idea: string): { experiment: string; codeChanges: string } {
  if (!idea) return { experiment: "", codeChanges: "" };
  const codeIdx = idea.indexOf("[Code Changes]");
  if (codeIdx !== -1) {
    const exp = idea.slice(0, codeIdx).trim().replace(/^\[Experiment\]\s*/i, "");
    const code = idea.slice(codeIdx + 14).trim().replace(/\[End\]\s*$/i, "").trim();
    return { experiment: exp, codeChanges: code };
  }
  return { experiment: idea.replace(/^\[Experiment\]\s*/i, ""), codeChanges: "" };
}

export default function NodeDetailPanel({
  node,
  loading,
  onClose,
  onOpenNode,
}: Props) {
  const [showCode, setShowCode] = useState(false);

  if (!loading && !node) return null;

  const hypo = node ? isHypothesis(node) : false;
  const { experiment, codeChanges } = node ? splitIdea(node.idea) : { experiment: "", codeChanges: "" };

  // Model: from node field, or extract from source
  const model = (() => {
    if (!node) return "-";
    // Direct model field (from enriched map.json)
    const m = (node as unknown as Record<string, unknown>).model;
    if (typeof m === "string" && m) return m;
    // Extract from source
    const s = (node.source || "").toLowerCase();
    if (s.includes("claude") && s.includes("opus")) return "Claude Opus";
    if (s.includes("claude") && s.includes("sonnet")) return "Claude Sonnet";
    if (s.includes("gpt5") || s.includes("gpt-5")) return "GPT-5";
    if (s.includes("scivbook")) return "DeepSeek-V3";
    return "-";
  })();

  const statusLabel = hypo ? "Proposed" : node?.status || "approved";
  const statusStyle = hypo
    ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
    : node?.status === "approved"
      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
      : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20";

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ backgroundColor: "var(--color-overlay)" }}
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 w-full max-w-4xl z-50 bg-bg-primary overflow-y-auto border-l border-border-subtle"
        style={{ animation: "slide-in-right 0.25s ease-out" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-10 h-10 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : node ? (
          <div className="min-h-full">
            {/* Header */}
            <div
              className="sticky top-0 z-10 backdrop-blur-sm border-b border-border-subtle px-6 py-4"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-bg-primary) 92%, transparent)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm text-text-muted mb-1">
                    <span className="font-mono">{node.id}</span>
                    <span>/</span>
                    <span>{node.domain.replace(/_/g, " ")}</span>
                  </div>
                  <h1 className="text-lg font-semibold text-text-primary leading-snug line-clamp-2">
                    {hypo
                      ? (node.label || node.task_name || node.idea?.split("\n")[0] || node.id)
                      : experiment.split("\n")[0].slice(0, 120)}
                  </h1>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getDomainStyle(node.domain)}`}>
                    {node.domain.replace(/_/g, " ")}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle}`}>
                    {statusLabel}
                  </span>
                  <button
                    onClick={onClose}
                    className="surface-pill p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Stats bar */}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-text-muted">
                {hypo ? (
                  <>
                    <span>Novelty: <strong className="text-text-primary font-mono">{node.metric_value?.toFixed(1)}</strong>/10</span>
                    <span>Model: <strong className="text-text-primary">{model}</strong></span>
                  </>
                ) : (
                  <>
                    <span>{node.metric_name}: <strong className="text-text-primary font-mono">{node.metric_value?.toFixed(4)}</strong></span>
                    {node.success !== undefined && (
                      <span>{node.success ? "✓ Beat baseline" : "✗ Below baseline"}</span>
                    )}
                    <span>Model: <strong className="text-text-primary">{model}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col lg:flex-row gap-5 p-6">
              {/* Left */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Idea */}
                <SectionCard icon="💡" title="Idea">
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                    {hypo ? node.idea : experiment}
                  </p>
                </SectionCard>

                {/* Code Changes (collapsed, only for executed experiments) */}
                {!hypo && codeChanges && (
                  <div className="surface-card-deep section-tone-clay rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setShowCode(!showCode)}
                      className="w-full flex items-center justify-between px-5 py-3 border-b border-border-subtle text-left surface-hover transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                        <span>⌥</span><span>Code Changes</span>
                      </div>
                      <span className="text-xs text-text-muted transition-transform duration-200" style={{ transform: showCode ? "rotate(45deg)" : "none" }}>+</span>
                    </button>
                    {showCode && (
                      <div className="px-5 py-4">
                        <pre className="surface-note text-xs text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap rounded-lg p-3 max-h-80 overflow-y-auto">
                          {codeChanges}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Techniques */}
                {node.method_tags && node.method_tags.length > 0 && (
                  <SectionCard icon="🏷" title="Techniques" badge={`${node.method_tags.length} tags`}>
                    <div className="flex flex-wrap gap-2">
                      {node.method_tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-cyan-primary/10 border border-cyan-primary/20 text-cyan-light text-xs px-3 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* Right sidebar */}
              <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
                {/* About */}
                <div className="surface-card-deep section-tone-stone rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-text-secondary mb-4">About</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      ["Domain", node.domain.replace(/_/g, " ")],
                      ["Model", model],
                      ["Status", statusLabel],
                      ["Node ID", node.id],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-text-muted">{label}</span>
                        <span className="text-text-primary font-mono text-xs truncate max-w-[140px]">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metric card — different for hypothesis vs executed */}
                <div className="surface-card-deep section-tone-sage rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-text-secondary mb-4">
                    {hypo ? "Novelty Rating" : "Execution Result"}
                  </h3>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-3xl font-bold font-mono text-text-primary">
                      {hypo
                        ? (node.metric_value ?? 0).toFixed(1)
                        : (node.metric_value ?? 0).toFixed(4)}
                    </span>
                    <span className="text-sm text-text-muted">
                      {hypo ? "/ 10" : node.metric_name || "metric"}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {hypo
                      ? "Novelty rating assigned by AI reviewer. Scale 1-10. This hypothesis has not been experimentally validated yet."
                      : node.metric_name === "val_loss"
                        ? "Validation loss from auto-research evolutionary search. Lower is better."
                        : node.metric_name === "val_bpb"
                          ? "Bits-per-byte on held-out validation set. Lower is better."
                          : "Execution metric recorded from the experiment run."}
                  </p>
                </div>

                {/* Related nodes */}
                {node.neighbors && node.neighbors.length > 0 && (
                  <div className="surface-card-deep section-tone-sky rounded-2xl p-5">
                    <h3 className="text-sm font-medium text-text-secondary mb-4">Related Nodes</h3>
                    <div className="space-y-2">
                      {node.neighbors.slice(0, 6).map((neighbor, index) => (
                        <button
                          key={`${neighbor.id}-${index}`}
                          type="button"
                          onClick={() => onOpenNode?.(neighbor.id)}
                          disabled={!onOpenNode}
                          className="surface-note w-full rounded-xl p-3 text-left text-xs transition-colors hover:text-text-primary disabled:cursor-default"
                        >
                          <p className="text-text-primary leading-snug line-clamp-2">
                            {neighbor.title}
                          </p>
                          {neighbor.domain ? (
                            <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-text-muted">
                              {neighbor.domain.replace(/_/g, " ")}
                            </p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
