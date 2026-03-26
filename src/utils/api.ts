import { MAP_URL, GRADIO_API } from "../config";
import type {
  MapData,
  SearchResult,
  NodeDetail,
  MapNode,
  RelatedNode,
} from "./types";

let cachedMap: MapData | null = null;
const LOCAL_MAP_URL = `${import.meta.env.BASE_URL}map.json`;
const GRADIO_TIMEOUT_MS = 1500;

function getNodeSummary(node: MapNode): string {
  // For ScivBook nodes: label = question (good title), idea = methodology (numbered steps, bad title)
  // Prefer label over idea when label exists and isn't just the id
  if (node.label && node.label !== node.id && !node.label.match(/^[0-9a-f]{6,}$/)) {
    return node.label;
  }
  return node.idea || node.task_name || node.id;
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
    label: node.label || node.task_name || node.id,
    idea: node.idea || node.label || "",
    domain: node.domain,
    metric_name: node.metric_name,
    metric_value: node.metric_value,
    score,
    status: node.status || (node.success ? "approved" : "pending"),
  };
}

function enrichSearchResults(
  results: SearchResult[],
  map: MapData,
): SearchResult[] {
  const nodesById = new Map(map.nodes.map((node) => [node.id, node]));

  return results.map((result) => {
    const node = nodesById.get(result.id);
    if (!node) return result;

    const label = node.label || result.label || node.task_name || node.id;
    const remoteIdea = (result.idea || "").trim();
    const localIdea = (node.idea || "").trim();
    const shouldUseLocalIdea =
      !remoteIdea ||
      remoteIdea === result.label ||
      remoteIdea === label;

    return {
      ...result,
      label,
      idea: shouldUseLocalIdea ? localIdea || remoteIdea || label : remoteIdea,
      domain: result.domain !== "unknown" ? result.domain : node.domain,
      metric_name: result.metric_name !== "metric" ? result.metric_name : node.metric_name,
      status: result.status || node.status || (node.success ? "approved" : "pending"),
    };
  });
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

  const labelStr = typeof item.label === "string" && item.label.trim() ? item.label
    : typeof item.task_name === "string" && item.task_name.trim() ? item.task_name
    : String(idea);

  return {
    id,
    label: String(labelStr),
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

function normalizeRelatedNodeTitle(text: string): string {
  const value = (text || "").trim();
  if (!value) return "Untitled related node";
  const colonIndex = value.indexOf(": ");
  if (colonIndex !== -1) {
    return value.slice(colonIndex + 2).trim() || value;
  }
  return value;
}

function parseRelatedNode(
  raw: unknown,
  fallback?: RelatedNode,
): RelatedNode | null {
  if (typeof raw === "string") {
    if (fallback) return fallback;
    const title = normalizeRelatedNodeTitle(raw);
    return title ? { id: raw, title } : null;
  }

  if (!raw || typeof raw !== "object") {
    return fallback ?? null;
  }

  const item = raw as Record<string, unknown>;
  const id =
    typeof item.id === "string" && item.id.trim()
      ? item.id
      : fallback?.id;
  const titleCandidate =
    typeof item.title === "string" && item.title.trim()
      ? item.title
      : typeof item.label === "string" && item.label.trim()
        ? item.label
        : typeof item.idea === "string" && item.idea.trim()
          ? item.idea
          : fallback?.title;

  if (!id || !titleCandidate) {
    return fallback ?? null;
  }

  const domain =
    typeof item.domain === "string" && item.domain.trim()
      ? item.domain
      : fallback?.domain;

  return {
    id,
    title: normalizeRelatedNodeTitle(titleCandidate),
    domain,
  };
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

export async function browseByDomain(
  domainFilter: string,
  limit = 30,
  sourceFilter = "",
): Promise<SearchResult[]> {
  const map = await fetchMapData();
  return map.nodes
    .filter((node) => {
      const domainMatch = (node.domain || "").toLowerCase().includes(domainFilter.toLowerCase());
      if (!domainMatch) return false;
      if (!sourceFilter) return true;
      // sourceFilter: "ai4s" → source contains "ai4s", "science" → source contains "science"
      const src = (node.source || "").toLowerCase();
      return src.includes(sourceFilter.toLowerCase());
    })
    .sort((a, b) => {
      if (a.success && !b.success) return -1;
      if (!a.success && b.success) return 1;
      return (b.metric_value ?? 0) - (a.metric_value ?? 0); // higher novelty first for hypotheses
    })
    .slice(0, limit)
    .map((node) => toSearchResult(node, 0));
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
    if (!neighbor) {
      return { id: neighborId, title: neighborId };
    }
    return {
      id: neighbor.id,
      title: getNodeSummary(neighbor),
      domain: neighbor.domain,
    };
  });

  return {
    id: node.id,
    idea: node.idea || getNodeSummary(node),
    domain: node.domain,
    metric_name: node.metric_name,
    metric_value: node.metric_value,
    analysis: buildOfflineAnalysis(node),
    code_diff: "",
    status: node.status || (node.success ? "approved" : "pending"),
    neighbors,
    source: node.source,
    task_name: node.task_name,
    method_tags: node.method_tags,
    success: node.success,
    label: node.label,
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
  const map = await fetchMapData();

  try {
    const raw = await callGradio<unknown[]>("ui_search", [query, topK]);
    if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
      const remoteResults = raw[0]
        .map(normalizeSearchResult)
        .filter((item): item is SearchResult => item !== null);
      return remoteResults.length > 0
        ? enrichSearchResults(remoteResults, map)
        : localResults;
    }
    if (Array.isArray(raw)) {
      const remoteResults = raw
        .map(normalizeSearchResult)
        .filter((item): item is SearchResult => item !== null);
      return remoteResults.length > 0
        ? enrichSearchResults(remoteResults, map)
        : localResults;
    }
  } catch {
    return localResults;
  }
  return localResults;
}

function parseNodeDetail(raw: unknown, fallback: NodeDetail | null): NodeDetail | null {
  let obj = raw;
  if (typeof obj === "string") {
    try { obj = JSON.parse(obj); } catch { return fallback; }
  }
  if (!obj || typeof obj !== "object") return fallback;
  const r = obj as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return fallback;

  // SeevoMap nodes have nested objects: task.domain, idea.text, result.metric_name, etc.
  const task = (r.task && typeof r.task === "object" ? r.task : {}) as Record<string, unknown>;
  const idea = (r.idea && typeof r.idea === "object" ? r.idea : {}) as Record<string, unknown>;
  const result = (r.result && typeof r.result === "object" ? r.result : {}) as Record<string, unknown>;
  const context = (r.context && typeof r.context === "object" ? r.context : {}) as Record<string, unknown>;

  // Extract idea text: could be nested idea.text or flat r.idea (string)
  const ideaText = typeof r.idea === "string" ? r.idea
    : String(idea.text ?? idea.raw_text ?? r.label ?? r.task_name ?? task.name ?? r.id);

  // Extract domain: nested task.domain or flat r.domain
  const domain = String(task.domain ?? r.domain ?? "unknown");

  // Extract metric: nested result.metric_name or flat r.metric_name
  const metricName = String(result.metric_name ?? r.metric_name ?? "metric");
  const rawMetric = result.metric_value ?? r.metric_value ?? 0;
  const metricValue = typeof rawMetric === "number" ? rawMetric : Number(rawMetric);

  // Extract method_tags: nested idea.method_tags or flat r.method_tags
  const rawTags = idea.method_tags ?? r.method_tags;
  const methodTags = Array.isArray(rawTags) ? rawTags.map(String) : [];

  // Extract success
  const rawSuccess = result.success ?? r.success;
  const success = typeof rawSuccess === "boolean" ? rawSuccess : undefined;
  const fallbackNeighbors = fallback?.neighbors ?? [];
  const rawNeighbors = Array.isArray(r.neighbors) ? r.neighbors : [];
  const neighbors =
    rawNeighbors.length > 0
      ? rawNeighbors
          .map((neighbor, index) => parseRelatedNode(neighbor, fallbackNeighbors[index]))
          .filter((item): item is RelatedNode => item !== null)
      : fallbackNeighbors;

  return {
    id: String(r.id),
    idea: ideaText,
    domain,
    metric_name: metricName,
    metric_value: Number.isFinite(metricValue) ? metricValue : 0,
    analysis: String(r.analysis ?? ""),
    code_diff: String(r.code_diff ?? ""),
    status: String(r.status ?? "pending"),
    neighbors,
    source: String(context.source ?? r.source ?? ""),
    task_name: String(task.name ?? task.description ?? r.task_name ?? ""),
    method_tags: methodTags,
    success,
    label: String(r.label ?? ""),
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
