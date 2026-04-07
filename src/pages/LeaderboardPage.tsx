import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getGraphLabel } from "../config";
import {
  formatModelDisplayName,
  getLeaderboardCalibrationNotice,
  getPublicScoreContract,
  getPublicModelBoardScore,
  getPublicNodeBoardScore,
  MODEL_BOARD_PUBLIC_COLUMNS,
  NODE_BOARD_PUBLIC_COLUMNS,
  summarizeLeaderboardQuestion,
} from "../utils/leaderboardDisplay";
import {
  fetchModelLeaderboard,
  fetchNodeLeaderboard,
  getNodeDetail,
  submitLeaderboardFeedback,
} from "../utils/api";
import type {
  ModelLeaderboardRow,
  NodeDetail,
  NodeLeaderboardRow,
} from "../utils/types";
import NodeDetailPanel from "../components/NodeDetailPanel";

type LeaderboardView = "model" | "node";

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatScore(value: number | null | undefined): string {
  return value == null ? "N/A" : value.toFixed(2);
}

export default function LeaderboardPage() {
  const { accessToken, selectedGraphId } = useAuth();
  const [view, setView] = useState<LeaderboardView>("model");
  const [modelRows, setModelRows] = useState<ModelLeaderboardRow[]>([]);
  const [nodeRows, setNodeRows] = useState<NodeLeaderboardRow[]>([]);
  const [modelUpdatedAt, setModelUpdatedAt] = useState<string | null>(null);
  const [nodeUpdatedAt, setNodeUpdatedAt] = useState<string | null>(null);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [sessionId, setSessionId] = useState("");
  const [helpfulIds, setHelpfulIds] = useState("");
  const [notHelpfulIds, setNotHelpfulIds] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const loadLeaderboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [modelPayload, nodePayload] = await Promise.all([
        fetchModelLeaderboard(limit, {
          graphId: selectedGraphId,
          accessToken,
        }),
        fetchNodeLeaderboard(limit, {
          graphId: selectedGraphId,
          accessToken,
        }),
      ]);
      setModelRows(modelPayload.rows);
      setNodeRows(nodePayload.rows);
      setModelUpdatedAt(modelPayload.updated_at || null);
      setNodeUpdatedAt(nodePayload.updated_at || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboards");
      setModelRows([]);
      setNodeRows([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, limit, selectedGraphId]);

  useEffect(() => {
    void loadLeaderboards();
  }, [loadLeaderboards]);

  const totals = useMemo(() => ({
    modelCount: modelRows.length,
    nodeCount: nodeRows.length,
    topModelScore: modelRows[0]?.model_total_score ?? 0,
    topNodeScore: nodeRows[0]?.node_total_score ?? 0,
  }), [modelRows, nodeRows]);

  const handleFeedbackSubmit = useCallback(async () => {
    if (!sessionId.trim()) {
      setFeedbackError("Session ID is required");
      setFeedbackMessage(null);
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError(null);
    setFeedbackMessage(null);
    try {
      const helpful = helpfulIds
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const notHelpful = notHelpfulIds
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const result = await submitLeaderboardFeedback(
        sessionId.trim(),
        helpful,
        notHelpful,
        {
          graphId: selectedGraphId,
          accessToken,
        },
      );
      setFeedbackMessage(
        `Feedback saved for session ${result.session_id || sessionId.trim()}.`,
      );
      setHelpfulIds("");
      setNotHelpfulIds("");
      await loadLeaderboards();
    } catch (err) {
      setFeedbackError(
        err instanceof Error ? err.message : "Failed to submit feedback",
      );
    } finally {
      setFeedbackLoading(false);
    }
  }, [accessToken, helpfulIds, loadLeaderboards, notHelpfulIds, selectedGraphId, sessionId]);

  const loadNodeDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setSelectedNode(null);
    setError(null);
    try {
      const detail = await getNodeDetail(id, {
        graphId: selectedGraphId,
        accessToken,
      });
      if (!detail) {
        setError("Failed to load node detail");
        return;
      }
      setSelectedNode(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load node detail");
    } finally {
      setDetailLoading(false);
    }
  }, [accessToken, selectedGraphId]);

  useEffect(() => {
    setSelectedNode(null);
    setSessionId("");
    setHelpfulIds("");
    setNotHelpfulIds("");
    setFeedbackMessage(null);
    setFeedbackError(null);
  }, [selectedGraphId]);

  const updatedAt = view === "model" ? modelUpdatedAt : nodeUpdatedAt;
  const calibrationNotice = useMemo(() => getLeaderboardCalibrationNotice(modelRows), [modelRows]);
  const scoreContractText = useMemo(() => getPublicScoreContract(view), [view]);

  return (
    <div className="pt-16 min-h-screen overflow-hidden">
      <section className="relative border-b border-border-subtle">
        <div className="absolute inset-0 hero-field" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-text-muted text-xs uppercase tracking-[0.18em] mb-5">
            Model-First Leaderboard
          </p>
          <div className="max-w-3xl mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
              Rank the models behind the nodes
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              The main board ranks generator models by offline idea quality. The
              node board explains which concrete ideas drove those model scores.
              Usage stays visible as optional evidence, not the definition of quality.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary">
              <span className="text-text-muted">Active graph</span>
              <span className="font-semibold text-text-primary">
                {getGraphLabel(selectedGraphId)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <div className="surface-card section-tone-sky rounded-2xl px-5 py-5">
              <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
                Models Ranked
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2">
                {totals.modelCount}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Generator models with scored idea output
              </p>
            </div>
            <div className="surface-card section-tone-sage rounded-2xl px-5 py-5">
              <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
                Top Model Score
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2 tabular-nums">
                {totals.topModelScore.toFixed(2)}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Highest model total in this view
              </p>
            </div>
            <div className="surface-card section-tone-clay rounded-2xl px-5 py-5">
              <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
                Nodes Ranked
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2">
                {totals.nodeCount}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Offline-scored ideas available in the node board
              </p>
            </div>
            <div className="surface-card section-tone-stone rounded-2xl px-5 py-5">
              <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
                Top Node Score
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2 tabular-nums">
                {totals.topNodeScore.toFixed(2)}
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                Strongest idea-level score in this slice
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.55fr] gap-6 items-start">
          <div className="space-y-6">
            <div className="surface-card section-tone-stone rounded-3xl p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-2">
                    Public Leaderboard
                  </p>
                  <h2 className="text-2xl font-semibold text-text-primary mb-2">
                    {view === "model" ? "Model Board" : "Node Board"}
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Updated: {formatTimestamp(updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-full border border-border-subtle p-1">
                    {(["model", "node"] as LeaderboardView[]).map((candidate) => (
                      <button
                        key={candidate}
                        type="button"
                        onClick={() => setView(candidate)}
                        className={`rounded-full px-4 py-2 text-sm transition-colors ${
                          view === candidate
                            ? "bg-emerald-primary text-white"
                            : "text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {candidate === "model" ? "Model" : "Node"}
                      </button>
                    ))}
                  </div>
                  <label className="text-sm text-text-secondary">
                    Rows
                    <select
                      value={limit}
                      onChange={(event) => setLimit(Number(event.target.value))}
                      className="ml-3 rounded-xl border border-border-subtle bg-transparent px-3 py-2 text-text-primary"
                    >
                      {[10, 25, 50, 100].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => void loadLeaderboards()}
                    className="surface-pill rounded-full border px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="surface-card rounded-2xl p-5 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <LeaderboardSkeleton view={view} />
            ) : view === "model" ? (
              <ModelLeaderboardTable rows={modelRows} />
            ) : (
              <NodeLeaderboardTable rows={nodeRows} onOpenNode={loadNodeDetail} />
            )}
          </div>

          <aside className="space-y-6">
            <div className="surface-card section-tone-sky rounded-3xl p-6">
              <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
                Score Contract
              </p>
              <div className="space-y-3">
                <p className="text-sm text-text-secondary leading-relaxed">
                  {scoreContractText}
                </p>
                {calibrationNotice && (
                  <p className="hidden">{calibrationNotice}</p>
                )}
              </div>
            </div>

            <div className="surface-card section-tone-sage rounded-3xl p-6">
              <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
                Usage Feedback
              </p>
              <h2 className="text-xl font-semibold text-text-primary mb-3">
                Add optional community evidence
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                Feedback is session-bound and optional. It still matters, but it now
                acts as a secondary signal on top of the offline quality scores.
              </p>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-text-secondary mb-2 block">
                    Session ID
                  </span>
                  <input
                    value={sessionId}
                    onChange={(event) => setSessionId(event.target.value)}
                    placeholder="e.g. 4d2a17b9"
                    className="w-full rounded-2xl border border-border-subtle bg-transparent px-4 py-3 text-text-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-text-secondary mb-2 block">
                    Helpful node IDs
                  </span>
                  <input
                    value={helpfulIds}
                    onChange={(event) => setHelpfulIds(event.target.value)}
                    placeholder="comma,separated,node_ids"
                    className="w-full rounded-2xl border border-border-subtle bg-transparent px-4 py-3 text-text-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-text-secondary mb-2 block">
                    Not Helpful node IDs
                  </span>
                  <input
                    value={notHelpfulIds}
                    onChange={(event) => setNotHelpfulIds(event.target.value)}
                    placeholder="comma,separated,node_ids"
                    className="w-full rounded-2xl border border-border-subtle bg-transparent px-4 py-3 text-text-primary"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleFeedbackSubmit()}
                  disabled={feedbackLoading}
                  className="w-full rounded-2xl bg-emerald-primary px-4 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-60"
                >
                  {feedbackLoading ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>

              {feedbackMessage && (
                <p className="mt-4 text-sm text-emerald-primary">
                  {feedbackMessage}
                </p>
              )}
              {feedbackError && (
                <p className="mt-4 text-sm text-red-400">{feedbackError}</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {(detailLoading || selectedNode) && (
        <NodeDetailPanel
          node={selectedNode}
          loading={detailLoading}
          onOpenNode={(id) => {
            void loadNodeDetail(id);
          }}
          onClose={() => {
            setSelectedNode(null);
            setDetailLoading(false);
          }}
        />
      )}
    </div>
  );
}

function LeaderboardSkeleton({ view }: { view: LeaderboardView }) {
  const columns = view === "model"
    ? MODEL_BOARD_PUBLIC_COLUMNS
    : NODE_BOARD_PUBLIC_COLUMNS;

  return (
    <div className="rounded-xl border border-border-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-[0.18em]">
              {columns.map((label, index) => (
                <th
                  key={label}
                  className={`py-3 px-4 font-semibold ${index < 2 ? "text-left" : "text-right"}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={index} className="border-b border-border-subtle/60 last:border-b-0">
                {columns.map((label, columnIndex) => (
                  <td
                    key={`${index}-${label}`}
                    className={`py-4 px-4 ${columnIndex < 2 ? "" : "text-right"}`}
                  >
                    <div className={`skeleton h-5 ${columnIndex === 1 ? "w-48" : "w-16"} ${columnIndex < 2 ? "" : "ml-auto"}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModelLeaderboardTable({ rows }: { rows: ModelLeaderboardRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-6 text-sm text-text-secondary">
        No model leaderboard rows yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-[0.18em]">
              <th className="py-3 px-4 text-left font-semibold w-20">Rank</th>
              <th className="py-3 px-4 text-left font-semibold">Model</th>
              <th className="py-3 px-4 text-right font-semibold">Score</th>
              <th className="py-3 px-4 text-left font-semibold">Top Nodes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.generator_model}
                className="border-b border-border-subtle/60 last:border-b-0 hover:bg-black/5 transition-colors"
              >
                <td className="py-4 px-4">
                  <span className="text-base font-semibold text-text-primary">
                    {rankLabel(index + 1)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="font-semibold text-text-primary">
                    {formatModelDisplayName(row.generator_model)}
                  </div>
                </td>
                <td className="py-4 px-4 text-right font-bold text-cyan-light tabular-nums">
                  {formatScore(getPublicModelBoardScore(row))}
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-2">
                    {row.top_node_ids.length > 0 ? row.top_node_ids.map((nodeId) => (
                      <span
                        key={nodeId}
                        className="rounded-full border border-border-subtle px-3 py-1 text-xs text-text-secondary"
                      >
                        {nodeId}
                      </span>
                    )) : (
                      <span className="text-text-secondary text-xs">No nodes</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NodeLeaderboardTable(
  { rows, onOpenNode }: {
    rows: NodeLeaderboardRow[];
    onOpenNode: (id: string) => Promise<void>;
  },
) {
  if (rows.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-6 text-sm text-text-secondary">
        No node leaderboard rows yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-[0.18em]">
              <th className="py-3 px-4 text-left font-semibold w-20">Rank</th>
              <th className="py-3 px-4 text-left font-semibold w-[62%]">Node</th>
              <th className="py-3 px-4 text-right font-semibold w-28">Score</th>
              <th className="py-3 px-4 text-right font-semibold w-40">Generator</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const canOpenDetail = Boolean(row.detail_node_id);
              const questionPreview = summarizeLeaderboardQuestion(row.question, 140);
              return (
                <tr
                  key={row.node_id}
                  className="border-b border-border-subtle/60 last:border-b-0 hover:bg-black/5 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span className="text-base font-semibold text-text-primary">
                      {rankLabel(index + 1)}
                    </span>
                  </td>
                  <td className="py-4 px-4 min-w-0">
                    {canOpenDetail ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (row.detail_node_id) {
                            void onOpenNode(row.detail_node_id);
                          }
                        }}
                        className="block w-full min-w-0 text-left hover:opacity-90 transition-opacity"
                      >
                        <div className="font-semibold text-text-primary hover:text-cyan-light transition-colors whitespace-normal break-words leading-6 line-clamp-2">
                          {questionPreview}
                        </div>
                        <div className="text-xs text-text-secondary mt-1 truncate">
                          <code>{row.node_id}</code>
                        </div>
                      </button>
                    ) : (
                      <div className="min-w-0">
                        <div className="font-semibold text-text-primary whitespace-normal break-words leading-6 line-clamp-2">
                          {questionPreview}
                        </div>
                        <div className="text-xs text-text-secondary mt-1 truncate">
                          <code>{row.node_id}</code> · offline-only
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-cyan-light tabular-nums">
                    {formatScore(getPublicNodeBoardScore(row))}
                  </td>
                  <td className="py-4 px-4 text-right text-text-primary font-semibold">
                    {formatModelDisplayName(row.generator_model)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function rankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}
