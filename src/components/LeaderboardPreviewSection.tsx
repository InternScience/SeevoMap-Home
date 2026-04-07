import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchModelLeaderboard } from "../utils/api";
import type { ModelLeaderboardRow } from "../utils/types";

const PREVIEW_LIMIT = 5;

export default function LeaderboardPreviewSection() {
  const [rows, setRows] = useState<ModelLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPreview() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchModelLeaderboard(PREVIEW_LIMIT);
        if (!active) return;
        setRows(payload.rows.slice(0, PREVIEW_LIMIT));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load leaderboard preview");
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPreview();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="surface-card section-tone-stone rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              Model Leaderboard
            </h2>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Generator models ranked by offline idea quality first, with usage kept
              as optional evidence instead of the definition of quality.
            </p>
          </div>
          <Link
            to="/leaderboard"
            className="theme-secondary-button inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm"
          >
            Open Full Leaderboard
          </Link>
        </div>

        {loading ? (
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-[0.18em]">
                    <th className="py-3 px-4 text-left font-semibold w-20">Rank</th>
                    <th className="py-3 px-4 text-left font-semibold">Model</th>
                    <th className="py-3 px-4 text-right font-semibold">Total</th>
                    <th className="py-3 px-4 text-right font-semibold">Idea Gen</th>
                    <th className="py-3 px-4 text-right font-semibold">Ideas</th>
                    <th className="py-3 px-4 text-right font-semibold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: PREVIEW_LIMIT }).map((_, index) => (
                    <tr key={index} className="border-b border-border-subtle/60 last:border-b-0">
                      <td className="py-4 px-4"><div className="skeleton h-5 w-10" /></td>
                      <td className="py-4 px-4"><div className="skeleton h-5 w-48 max-w-full" /></td>
                      <td className="py-4 px-4 text-right"><div className="skeleton h-5 w-16 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="skeleton h-5 w-16 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="skeleton h-5 w-12 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="skeleton h-5 w-20 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-[0.18em]">
                    <th className="py-3 px-4 text-left font-semibold w-20">Rank</th>
                    <th className="py-3 px-4 text-left font-semibold">Model</th>
                    <th className="py-3 px-4 text-right font-semibold">Total</th>
                    <th className="py-3 px-4 text-right font-semibold">Idea Gen</th>
                    <th className="py-3 px-4 text-right font-semibold">Ideas</th>
                    <th className="py-3 px-4 text-right font-semibold">Confidence</th>
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
                          {row.generator_model}
                        </div>
                        <div className="text-xs text-text-secondary mt-1">
                          {row.idea_count} ideas
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right tabular-nums">
                        <span className="text-base font-bold text-cyan-light">
                          {formatScore(row.model_total_score)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-text-primary font-semibold tabular-nums">
                        {formatScore(row.model_idea_gen_score)}
                      </td>
                      <td className="py-4 px-4 text-right text-text-primary font-semibold tabular-nums">
                        {row.scored_idea_count}
                      </td>
                      <td className="py-4 px-4 text-right text-text-primary font-semibold tabular-nums">
                        {row.score_confidence.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function rankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function formatScore(value: number | null): string {
  return value == null ? "N/A" : value.toFixed(2);
}
