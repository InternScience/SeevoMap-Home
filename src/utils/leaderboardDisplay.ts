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

export function summarizeLeaderboardQuestion(question: string, maxLength = 140): string {
  const compact = String(question || "").replace(/\s+/g, " ").trim();
  if (!compact) return "Untitled node";
  if (compact.length <= maxLength) return compact;
  if (maxLength <= 3) return ".".repeat(Math.max(0, maxLength));
  return `${compact.slice(0, maxLength - 3).trimEnd()}...`;
}
