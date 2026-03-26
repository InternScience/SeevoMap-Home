import type { SearchResult } from "../utils/types";

const DOMAIN_COLORS: Record<string, string> = {
  pretraining: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  posttraining: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  compression: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  data: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  evaluation: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};

function getDomainStyle(domain: string) {
  const key = (domain || "unknown").toLowerCase();
  for (const [k, v] of Object.entries(DOMAIN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-gray-500/15 text-gray-400 border-gray-500/20";
}

function getIdeaTitle(idea: string) {
  const candidate = (idea || "")
    .split(/[\n.!?]/)
    .map((item) => item.trim())
    .find(Boolean);
  if (!candidate) return "Untitled execution asset";
  return candidate.length > 52 ? `${candidate.slice(0, 49)}...` : candidate;
}

interface NodeCardProps {
  node: SearchResult;
  onClick?: () => void;
}

export default function NodeCard({ node, onClick }: NodeCardProps) {
  const safeIdea = node.idea || "Untitled execution asset";
  const safeDomain = node.domain || "unknown";
  const safeMetricName = node.metric_name || "metric";
  const safeMetricValue =
    typeof node.metric_value === "number" && Number.isFinite(node.metric_value)
      ? node.metric_value
      : 0;
  const metricPercent = Math.min(Math.abs(safeMetricValue) * 100, 100);
  const title = getIdeaTitle(safeIdea);
  const idSuffix = (node.id || "unknown").slice(-6);

  return (
    <button
      onClick={onClick}
      className="card-hover w-full rounded-2xl border border-white/8 bg-[#0c1322]/95 p-5 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-primary/30"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getDomainStyle(safeDomain)}`}>
          {safeDomain}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            node.status === "approved"
              ? "bg-emerald-500/12 text-emerald-300"
              : "bg-amber-500/12 text-amber-300"
          }`}
        >
          {node.status || "pending"}
        </span>
      </div>

      <h3 className="mb-3 text-lg font-semibold leading-snug text-text-primary">
        {title}
      </h3>

      <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-text-secondary">
        {safeIdea}
      </p>

      <div className="mb-4 border-t border-white/6 pt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-text-muted">{safeMetricName}</span>
          <span className="font-mono font-medium text-text-primary">
            {safeMetricValue.toFixed(4)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-primary via-emerald-primary to-cyan-light transition-all duration-500"
            style={{ width: `${metricPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-text-muted">
          asset #{idSuffix}
        </span>
        <div className="ml-auto text-text-muted">
          click to inspect
        </div>
      </div>
    </button>
  );
}
