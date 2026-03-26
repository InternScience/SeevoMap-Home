import { MAP_URL, GRADIO_API } from "../config";
import type { MapData, SearchResult, NodeDetail, MapNode } from "./types";

let cachedMap: MapData | null = null;
const LOCAL_MAP_URL = `${import.meta.env.BASE_URL}map.json`;
const GRADIO_TIMEOUT_MS = 1500;

function getNodeSummary(node: MapNode): string {
  return node.idea || node.label || node.task_name || node.id;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

function scoreNode(query: string, node: MapNode): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;

  const haystackParts = [
    node.domain,
    node.task_name || "",
    node.metric_name || "",
    node.label || "",
    node.idea || "",
    node.source || "",
    ...(node.method_tags || []),
  ];
  const haystack = haystackParts.join(" ").toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (haystack.includes(token)) score += 1;
    if ((node.task_name || "").toLowerCase().includes(token)) score += 1.2;
    if ((node.label || "").toLowerCase().includes(token)) score += 1.1;
    if ((node.metric_name || "").toLowerCase().includes(token)) score += 0.8;
    if ((node.method_tags || []).some((tag) => tag.toLowerCase().includes(token))) score += 0.9;
    if ((node.domain || "").toLowerCase().includes(token)) score += 0.7;
  }

  if (haystack.includes(query.toLowerCase())) score += 2;
  if (node.success) score += 0.15;

  return score;
}

function toSearchResult(node: MapNode, score: number): SearchResult {
  return {
    id: node.id,
    idea: getNodeSummary(node),
    domain: node.domain,
    metric_name: node.metric_name,
    metric_value: node.metric_value,
    score,
    status: node.status || (node.success ? "approved" : "pending"),
  };
}

function normalizeSearchResult(raw: unknown): SearchResult | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  const id = typeof item.id === "string" && item.id ? item.id : null;
  if (!id) return null;

  const domain =
    typeof item.domain === "string" && item.domain.trim()
      ? item.domain
      : "unknown";
  const metricName =
    typeof item.metric_name === "string" && item.metric_name.trim()
      ? item.metric_name
      : "metric";
  const metricValue =
    typeof item.metric_value === "number"
      ? item.metric_value
      : Number(item.metric_value ?? 0);
  const score =
    typeof item.score === "number" ? item.score : Number(item.score ?? 0);
  const status =
    typeof item.status === "string" && item.status.trim()
      ? item.status
      : "pending";

  const ideaCandidates = [
    item.idea,
    item.label,
    item.task_name,
    item.summary,
    item.title,
  ];
  const idea =
    ideaCandidates.find(
      (candidate) => typeof candidate === "string" && candidate.trim(),
    ) || id;

  return {
    id,
    idea: String(idea),
    domain,
    metric_name: metricName,
    metric_value: Number.isFinite(metricValue) ? metricValue : 0,
    score: Number.isFinite(score) ? score : 0,
    status,
  };
}

function buildOfflineAnalysis(node: MapNode): string {
  const lines = [
    "Offline detail generated from bundled map.json fallback.",
    `Task: ${node.task_name || "unknown"}`,
    `Source: ${node.source || "unknown"}`,
    `Metric: ${node.metric_name} = ${node.metric_value}`,
  ];

  if (node.method_tags && node.method_tags.length > 0) {
    lines.push(`Method tags: ${node.method_tags.join(", ")}`);
  }

  if (node.label) {
    lines.push(`Label: ${node.label}`);
  }

  return lines.join("\n");
}

async function searchNodesLocally(
  query: string,
  topK = 10,
): Promise<SearchResult[]> {
  const map = await fetchMapData();
  return map.nodes
    .map((node) => ({ node, score: scoreNode(query, node) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ node, score }) => toSearchResult(node, score));
}

async function getNodeDetailLocally(id: string): Promise<NodeDetail | null> {
  const map = await fetchMapData();
  const node = map.nodes.find((item) => item.id === id);
  if (!node) return null;

  const neighborIds = map.edges
    .filter((edge) => edge.source === id || edge.target === id)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8)
    .map((edge) => (edge.source === id ? edge.target : edge.source));

  const neighbors = neighborIds.map((neighborId) => {
    const neighbor = map.nodes.find((item) => item.id === neighborId);
    return neighbor ? `${neighbor.task_name || neighbor.domain}: ${getNodeSummary(neighbor)}` : neighborId;
  });

  return {
    id: node.id,
    idea: getNodeSummary(node),
    domain: node.domain,
    metric_name: node.metric_name,
    metric_value: node.metric_value,
    analysis: buildOfflineAnalysis(node),
    code_diff:
      "Offline fallback mode only has graph metadata. Full code diff is available when the remote SeevoMap API is reachable.",
    status: node.status || (node.success ? "approved" : "pending"),
    neighbors,
  };
}

export async function fetchMapData(): Promise<MapData> {
  if (cachedMap) return cachedMap;

  // Try local fallback first (works without network), then HF
  for (const url of [LOCAL_MAP_URL, MAP_URL]) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data: MapData = await res.json();
        cachedMap = data;
        return data;
      }
    } catch {
      continue;
    }
  }
  throw new Error("Failed to fetch map data from any source");
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = GRADIO_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

/**
 * Call a Gradio SSE endpoint:
 *  1. POST /gradio_api/call/<fn_name> → { event_id }
 *  2. GET  /gradio_api/call/<fn_name>/<event_id> → SSE stream, last "data:" line has result
 */
async function callGradio<T>(fnName: string, payload: unknown[]): Promise<T> {
  const postRes = await fetchWithTimeout(`${GRADIO_API}/${fnName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  if (!postRes.ok) throw new Error(`Gradio POST failed: ${postRes.status}`);
  const { event_id } = await postRes.json();

  const getRes = await fetchWithTimeout(`${GRADIO_API}/${fnName}/${event_id}`);
  if (!getRes.ok) throw new Error(`Gradio GET failed: ${getRes.status}`);

  const text = await getRes.text();
  const lines = text.split("\n");

  // Find last "data: " line
  let lastData = "";
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      lastData = line.slice(6);
    }
  }

  if (!lastData) throw new Error("No data in Gradio SSE response");
  return JSON.parse(lastData) as T;
}

export async function searchNodes(
  query: string,
  topK = 10,
): Promise<SearchResult[]> {
  const localResults = await searchNodesLocally(query, topK);

  try {
    const raw = await callGradio<unknown[]>("ui_search", [query, topK]);
    if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
      const remoteResults = raw[0]
        .map(normalizeSearchResult)
        .filter((item): item is SearchResult => item !== null);
      return remoteResults.length > 0 ? remoteResults : localResults;
    }
    if (Array.isArray(raw)) {
      const remoteResults = raw
        .map(normalizeSearchResult)
        .filter((item): item is SearchResult => item !== null);
      return remoteResults.length > 0 ? remoteResults : localResults;
    }
  } catch {
    return localResults;
  }
  return localResults;
}

function parseNodeDetail(raw: unknown, fallback: NodeDetail | null): NodeDetail | null {
  // raw[0] might be a JSON string — try to parse it
  let obj = raw;
  if (typeof obj === "string") {
    try { obj = JSON.parse(obj); } catch { return fallback; }
  }
  if (!obj || typeof obj !== "object") return fallback;
  const r = obj as Record<string, unknown>;
  // Validate it has the required fields
  if (typeof r.id !== "string" || !r.id) return fallback;
  return {
    id: String(r.id),
    idea: String(r.idea ?? r.label ?? r.task_name ?? r.id),
    domain: String(r.domain ?? "unknown"),
    metric_name: String(r.metric_name ?? "metric"),
    metric_value: typeof r.metric_value === "number" ? r.metric_value : Number(r.metric_value ?? 0),
    analysis: String(r.analysis ?? ""),
    code_diff: String(r.code_diff ?? ""),
    status: String(r.status ?? "pending"),
    neighbors: Array.isArray(r.neighbors) ? r.neighbors.map(String) : [],
  };
}

export async function getNodeDetail(
  id: string,
): Promise<NodeDetail | null> {
  const localDetail = await getNodeDetailLocally(id);

  try {
    const raw = await callGradio<unknown[]>("ui_node_detail", [id]);
    if (Array.isArray(raw) && raw.length > 0) {
      return parseNodeDetail(raw[0], localDetail);
    }
    return parseNodeDetail(raw, localDetail);
  } catch {
    return localDetail;
  }
}
