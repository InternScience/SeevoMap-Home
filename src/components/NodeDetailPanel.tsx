import type { NodeDetail } from "../utils/types";
import CodeBlock from "./CodeBlock";

interface NodeDetailPanelProps {
  node: NodeDetail | null;
  loading: boolean;
  onClose: () => void;
}

export default function NodeDetailPanel({ node, loading, onClose }: NodeDetailPanelProps) {
  if (!loading && !node) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-xl z-50 bg-bg-card border-l border-border-subtle overflow-y-auto"
        style={{ animation: "slide-in-right 0.3s ease-out" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-emerald-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : node ? (
          <div className="p-6 pt-14 space-y-6">
            {/* Domain + Status */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                {node.domain}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                node.status === "approved"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-yellow-500/15 text-yellow-400"
              }`}>
                {node.status}
              </span>
            </div>

            {/* Idea */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Idea</h3>
              <p className="text-text-primary leading-relaxed">{node.idea}</p>
            </div>

            {/* Metrics */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Metric</h3>
              <div className="bg-bg-primary rounded-lg p-4 border border-border-subtle">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">{node.metric_name}</span>
                  <span className="text-text-primary font-mono font-semibold">
                    {typeof node.metric_value === "number"
                      ? node.metric_value.toFixed(4)
                      : node.metric_value}
                  </span>
                </div>
              </div>
            </div>

            {/* Analysis */}
            {node.analysis && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Analysis</h3>
                <p className="text-text-secondary leading-relaxed text-sm whitespace-pre-wrap">
                  {node.analysis}
                </p>
              </div>
            )}

            {/* Code Diff */}
            {node.code_diff && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Code Diff</h3>
                <CodeBlock code={node.code_diff} language="diff" />
              </div>
            )}

            {/* Neighbors */}
            {node.neighbors && node.neighbors.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">
                  Related Nodes ({node.neighbors.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {node.neighbors.map((n) => (
                    <span
                      key={n}
                      className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-text-secondary border border-border-subtle"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
