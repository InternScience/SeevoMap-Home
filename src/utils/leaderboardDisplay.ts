import type { ModelLeaderboardRow, NodeLeaderboardRow } from "./types.js";

export const MODEL_BOARD_PUBLIC_COLUMNS = [
  "Rank",
  "Model",
  "Score",
  "Top Nodes",
] as const;

export const NODE_BOARD_PUBLIC_COLUMNS = [
  "Rank",
  "Node",
  "Score",
  "Generator",
] as const;

export function getPublicModelBoardScore(row: ModelLeaderboardRow): number | null {
  return row.model_total_score;
}

export function getPublicNodeBoardScore(row: NodeLeaderboardRow): number | null {
  return row.node_total_score;
}

export function getLeaderboardCalibrationNotice(
  _rows: ModelLeaderboardRow[],
): string | null {
  return null;
}

export function getPublicScoreContract(view: "model" | "node"): string {
  if (view === "model") {
    return "Score reflects judged idea quality and can be strengthened by execution evidence and community usage or feedback when those signals exist. Missing optional signals are not treated as penalties.";
  }
  return "Node score reflects judged idea quality first, with execution evidence and community usage or feedback available as supporting signals when present. Table titles are shortened for readability, while the full node stays available in detail view.";
}

export function formatModelDisplayName(model: string | null | undefined): string {
  const value = String(model || "").trim();
  if (!value) return "unknown";

  const normalized = value.toLowerCase();
  if (normalized === "gpt5") return "GPT-5";
  if (normalized === "gpt-5.4") return "GPT-5.4";
  if (normalized === "claude_4_5_sonnet") return "Claude Sonnet 4.5";
  if (normalized === "claude_4_5_opus") return "Claude Opus 4.5";
  if (normalized === "claude-opus-4-6") return "Claude Opus 4.6";
  if (normalized === "deepseek-v3") return "DeepSeek V3";
  if (normalized === "gemini-2.5-pro") return "Gemini 2.5 Pro";
  if (normalized === "gemini-3.1-pro-preview") return "Gemini 3.1 Pro";
  if (normalized === "grok-4") return "Grok 4";
  if (normalized === "qwen3.5-plus") return "Qwen 3.5 Plus";
  if (normalized === "minimax-m2.7") return "MiniMax M2.7";
  return value;
}

export function summarizeLeaderboardQuestion(question: string, maxLength = 140): string {
  const compact = String(question || "").replace(/\s+/g, " ").trim();
  if (!compact) return "Untitled node";
  if (compact.length <= maxLength) return compact;
  if (maxLength <= 3) return ".".repeat(Math.max(0, maxLength));
  return `${compact.slice(0, maxLength - 3).trimEnd()}...`;
}
