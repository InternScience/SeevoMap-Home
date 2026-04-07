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
  rows: ModelLeaderboardRow[],
): string | null {
  const calibratedRow = rows.find((row) => (row.score_adjustments || []).length > 0);
  const adjustment = calibratedRow?.score_adjustments?.[0];
  if (!calibratedRow || !adjustment) {
    return null;
  }
  if (
    calibratedRow.generator_model === "deepseek-v3"
    && adjustment.target === "node_agent_score"
    && adjustment.delta === -1.1
  ) {
    return "Current version applies a temporary -1.1 calibration to deepseek-v3 because of the server-side inference issue in this batch. Later refined versions should not inherit it.";
  }
  return null;
}

export function formatModelDisplayName(model: string | null | undefined): string {
  const value = String(model || "").trim();
  if (!value) return "unknown";

  const normalized = value.toLowerCase();
  if (normalized === "gpt5") return "GPT-5";
  if (normalized === "gpt-5.4") return "GPT-5.4";
  if (normalized === "claude_4_5_sonnet") return "Claude 4.5 Sonnet";
  if (normalized === "claude_4_5_opus") return "Claude 4.5 Opus";
  if (normalized === "claude-opus-4-6") return "Claude Opus 4.6";
  if (normalized === "deepseek-v3") return "DeepSeek V3";
  if (normalized === "gemini-2.5-pro") return "Gemini 2.5 Pro";
  if (normalized === "gemini-3.1-pro-preview") return "Gemini 3.1 Pro";
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
