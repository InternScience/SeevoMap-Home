import { getGraphLabel } from "../config";
import type { GraphRecord } from "../utils/types";

interface GraphSelectorProps {
  graphs: GraphRecord[];
  selectedGraphId: string;
  onChange: (graphId: string) => void;
}

export default function GraphSelector({
  graphs,
  selectedGraphId,
  onChange,
}: GraphSelectorProps) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border-subtle px-3 py-2 text-sm text-text-secondary">
      <span className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
        Map
      </span>
      <select
        value={selectedGraphId}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-sm font-medium text-text-primary outline-none"
      >
        {graphs.map((graph) => (
          <option key={graph.graph_id} value={graph.graph_id}>
            {getGraphLabel(graph.graph_id)}
          </option>
        ))}
      </select>
    </label>
  );
}
