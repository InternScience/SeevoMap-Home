import type { SearchResult } from "../utils/types";

const DOMAIN_COLORS: Record<string, string> = {
  pretraining: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  posttraining: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  compression: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  data: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  evaluation: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

function getDomainStyle(domain: string) {
  const key = domain.toLowerCase();
  for (const [k, v] of Object.entries(DOMAIN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-gray-500/15 text-gray-400 border-gray-500/20";
}

interface NodeCardProps {
  node: SearchResult;
  onClick?: () => void;
}

export default function NodeCard({ node, onClick }: NodeCardProps) {
  const metricPercent = Math.min(Math.abs(node.metric_value) * 100, 100);

  return (
    <button
      onClick={onClick}
      className="card-hover w-full text-left bg-bg-card border border-border-subtle rounded-xl p-5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-primary/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getDomainStyle(
            node.domain,
          )}`}
        >
          {node.domain}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            node.status === "approved"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-yellow-500/15 text-yellow-400"
          }`}
        >
          {node.status || "pending"}
        </span>
      </div>

      {/* Idea */}
      <p className="text-sm text-text-primary leading-relaxed mb-4 line-clamp-3">
        {node.idea}
      </p>

      {/* Metric bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-text-muted">{node.metric_name || "metric"}</span>
          <span className="text-text-primary font-mono font-medium">
            {typeof node.metric_value === "number"
              ? node.metric_value.toFixed(4)
              : node.metric_value}
          </span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-primary to-cyan-primary transition-all duration-500"
            style={{ width: `${metricPercent}%` }}
          />
        </div>
      </div>

      {/* Score */}
      {node.score != null && (
        <div className="flex items-center gap-1.5 mt-3">
          <span className="text-xs text-text-muted">Relevance</span>
          <span className="text-xs font-mono text-cyan-primary font-medium">
            {node.score.toFixed(3)}
          </span>
        </div>
      )}
    </button>
  );
}
