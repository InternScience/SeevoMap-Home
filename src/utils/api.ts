import {
  DEFAULT_GRAPH_ID,
  GRADIO_API,
  MAP_URL,
  SPACE_API_URL,
} from "../config";
import type {
  AccessRequestCreatePayload,
  AccessRequestRecord,
  GraphListResponse,
  LeaderboardBoard,
  LeaderboardResponse,
  LeaderboardRow,
  MapData,
  ModelLeaderboardRow,
  MapNode,
  NodeLeaderboardRow,
  NodeDetail,
  FeedbackResponse,
  Principal,
  RelatedNode,
  SearchResult,
  UsageLeaderboardRow,
  UsageSessionPayload,
} from "./types";

export interface ApiRequestOptions {
  graphId?: string;
  accessToken?: string | null;
}

const cachedMaps = new Map<string, MapData>();
const LOCAL_MAP_URL = `${import.meta.env.BASE_URL}map.json`;
const LOCAL_OFFLINE_QUALITY_FIXTURE_URL =
  `${import.meta.env.BASE_URL}generated/offline_quality_fixture.json`;
const GRADIO_TIMEOUT_MS = 1500;
let cachedOfflineQualityFixture: Record<string, unknown> | null | undefined;

function normalizeGraphId(graphId?: string | null): string {
  return String(graphId || DEFAULT_GRAPH_ID).trim() || DEFAULT_GRAPH_ID;
}

function buildAuthHeaders(accessToken?: string | null, extra?: HeadersInit): HeadersInit {
  const headers = new Headers(extra || {});
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return headers;
}

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
  options: ApiRequestOptions = {},
): Promise<SearchResult[]> {
  const map = await fetchMapData(options);
  const publicDomainAliases: Record<string, string[]> = {
    information_science: [
      "information_science",
      "pretraining",
      "posttraining",
      "model_compression",
    ],
    life_science: ["life_science", "life_sciences", "neuroscience"],
    physics: ["physics"],
    mathematics: ["mathematics"],
    earth_space: ["earth_space", "earth_science", "astronomy"],
    engineering: ["engineering", "energy_systems", "materials_science"],
    chemistry: ["chemistry"],
    medicine: ["medicine"],
    economics: ["economics"],
  };
  const allowedDomains = publicDomainAliases[domainFilter] || [domainFilter];

  return map.nodes
    .filter((node) => {
      const domain = (node.domain || "").toLowerCase();
      const domainMatch = allowedDomains.includes(domain);
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
  const map = await fetchMapData({ graphId: DEFAULT_GRAPH_ID });
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

async function fetchJson<T>(
  path: string,
  {
    accessToken,
    method = "GET",
    body,
    timeoutMs = GRADIO_TIMEOUT_MS,
  }: {
    accessToken?: string | null;
    method?: string;
    body?: unknown;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const response = await fetchWithTimeout(`${SPACE_API_URL}${path}`, {
    method,
    headers: buildAuthHeaders(accessToken, {
      "Content-Type": "application/json",
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  }, timeoutMs);

  if (!response.ok) {
    let detail = "";
    try {
      const payload = await response.json();
      if (typeof payload?.detail === "string") {
        detail = payload.detail;
      }
    } catch {
      // ignore JSON decode failures here
    }
    throw new Error(detail || `${method} ${path} failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchPublicFallbackMap(): Promise<MapData> {
  for (const url of [LOCAL_MAP_URL, MAP_URL]) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response.json() as Promise<MapData>;
      }
    } catch {
      continue;
    }
  }
  throw new Error("Failed to fetch bundled public map data");
}

async function fetchOfflineQualityFixture(): Promise<Record<string, unknown> | null> {
  if (cachedOfflineQualityFixture !== undefined) {
    return cachedOfflineQualityFixture;
  }

  try {
    const response = await fetch(LOCAL_OFFLINE_QUALITY_FIXTURE_URL);
    if (!response.ok) {
      cachedOfflineQualityFixture = null;
      return null;
    }
    cachedOfflineQualityFixture = await response.json() as Record<string, unknown>;
    return cachedOfflineQualityFixture;
  } catch {
    cachedOfflineQualityFixture = null;
    return null;
  }
}

async function fetchLeaderboardBoardFromFixture<T extends LeaderboardRow>(
  board: LeaderboardBoard,
  normalizer: (raw: unknown) => T | null,
): Promise<LeaderboardResponse<T> | null> {
  const fixture = await fetchOfflineQualityFixture();
  if (!fixture) return null;

  const key = board === "model"
    ? "model_leaderboard"
    : board === "node"
      ? "node_leaderboard"
      : "usage_leaderboard";
  const payload = fixture[key];
  if (!payload || typeof payload !== "object") return null;
  const rawPayload = payload as Record<string, unknown>;
  const rows = Array.isArray(rawPayload.rows) ? rawPayload.rows : [];

  return {
    status: typeof rawPayload.status === "string" ? rawPayload.status : "ok",
    board,
    updated_at:
      typeof rawPayload.updated_at === "string" && rawPayload.updated_at.trim()
        ? rawPayload.updated_at
        : typeof fixture.generated_at === "string"
          ? fixture.generated_at
          : undefined,
    total_rows:
      typeof rawPayload.total_rows === "number"
        ? rawPayload.total_rows
        : rows.length,
    rows: rows
      .map(normalizer)
      .filter((item): item is T => item !== null),
    message:
      typeof rawPayload.message === "string" && rawPayload.message.trim()
        ? rawPayload.message
        : undefined,
  };
}

async function getNodeDetailFromFixture(id: string): Promise<NodeDetail | null> {
  const fixture = await fetchOfflineQualityFixture();
  if (!fixture) return null;
  const rawDetails = fixture.node_details;
  if (!rawDetails || typeof rawDetails !== "object") return null;
  const payload = (rawDetails as Record<string, unknown>)[id];
  return parseNodeDetail(payload, null);
}

export async function fetchMapData(options: ApiRequestOptions = {}): Promise<MapData> {
  const graphId = normalizeGraphId(options.graphId);
  const cached = cachedMaps.get(graphId);
  if (cached) return cached;

  try {
    const map = await fetchJson<MapData>(`/graph/${graphId}/map`, {
      accessToken: options.accessToken,
      timeoutMs: 4000,
    });
    cachedMaps.set(graphId, map);
    return map;
  } catch (error) {
    if (graphId !== DEFAULT_GRAPH_ID) {
      throw error;
    }
    const fallback = await fetchPublicFallbackMap();
    cachedMaps.set(graphId, fallback);
    return fallback;
  }
}

/**
 * Call a Gradio SSE endpoint:
 *  1. POST /gradio_api/call/<fn_name> → { event_id }
 *  2. GET  /gradio_api/call/<fn_name>/<event_id> → SSE stream, last "data:" line has result
 */
async function callGradio<T>(
  fnName: string,
  payload: unknown[],
  accessToken?: string | null,
): Promise<T> {
  const postRes = await fetchWithTimeout(`${GRADIO_API}/${fnName}`, {
    method: "POST",
    headers: buildAuthHeaders(accessToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({ data: payload }),
  });
  if (!postRes.ok) throw new Error(`Gradio POST failed: ${postRes.status}`);
  const { event_id } = await postRes.json();

  const getRes = await fetchWithTimeout(`${GRADIO_API}/${fnName}/${event_id}`, {
    headers: buildAuthHeaders(accessToken),
  });
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

function unwrapGradioJson<T>(raw: unknown): T | null {
  const payload = Array.isArray(raw) ? raw[0] : raw;
  if (typeof payload === "string") {
    try {
      return JSON.parse(payload) as T;
    } catch {
      return null;
    }
  }
  if (payload && typeof payload === "object") {
    return payload as T;
  }
  return null;
}

export async function fetchWhoAmI(accessToken?: string | null): Promise<Principal> {
  return fetchJson<Principal>("/whoami", { accessToken });
}

export async function fetchVisibleGraphs(accessToken?: string | null): Promise<GraphListResponse> {
  return fetchJson<GraphListResponse>("/graphs", { accessToken });
}

export async function createAccessRequest(
  payload: AccessRequestCreatePayload,
  accessToken?: string | null,
): Promise<AccessRequestRecord> {
  return fetchJson<AccessRequestRecord>("/access-requests", {
    accessToken,
    method: "POST",
    body: payload,
    timeoutMs: 4000,
  });
}

function normalizeUsageLeaderboardRow(raw: unknown): UsageLeaderboardRow | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.node_id !== "string" || !item.node_id.trim()) return null;

  return {
    node_id: item.node_id,
    title:
      typeof item.title === "string" && item.title.trim()
        ? item.title
        : item.node_id,
    domain:
      typeof item.domain === "string" && item.domain.trim()
        ? item.domain
        : "unknown",
    usage_score:
      typeof item.usage_score === "number"
        ? item.usage_score
        : Number(item.usage_score ?? 0),
    retrieved_count:
      typeof item.retrieved_count === "number"
        ? item.retrieved_count
        : Number(item.retrieved_count ?? 0),
    injected_count:
      typeof item.injected_count === "number"
        ? item.injected_count
        : Number(item.injected_count ?? 0),
    helpful_count:
      typeof item.helpful_count === "number"
        ? item.helpful_count
        : Number(item.helpful_count ?? 0),
    not_helpful_count:
      typeof item.not_helpful_count === "number"
        ? item.not_helpful_count
        : Number(item.not_helpful_count ?? 0),
    feedback_sessions:
      typeof item.feedback_sessions === "number"
        ? item.feedback_sessions
        : Number(item.feedback_sessions ?? 0),
    feedback_coverage:
      typeof item.feedback_coverage === "string" && item.feedback_coverage.trim()
        ? item.feedback_coverage
        : "0/0",
    last_used_at:
      typeof item.last_used_at === "string" && item.last_used_at.trim()
        ? item.last_used_at
        : null,
  };
}

function normalizeModelLeaderboardRow(raw: unknown): ModelLeaderboardRow | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.generator_model !== "string" || !item.generator_model.trim()) {
    return null;
  }

  const rawTopNodeIds = Array.isArray(item.top_node_ids) ? item.top_node_ids : [];

  return {
    generator_model: item.generator_model,
    generator_family:
      typeof item.generator_family === "string" && item.generator_family.trim()
        ? item.generator_family
        : null,
    idea_count:
      typeof item.idea_count === "number" ? item.idea_count : Number(item.idea_count ?? 0),
    scored_idea_count:
      typeof item.scored_idea_count === "number"
        ? item.scored_idea_count
        : Number(item.scored_idea_count ?? 0),
    model_total_score:
      typeof item.model_total_score === "number"
        ? item.model_total_score
        : item.model_total_score == null
          ? null
          : Number(item.model_total_score),
    model_idea_gen_score:
      typeof item.model_idea_gen_score === "number"
        ? item.model_idea_gen_score
        : item.model_idea_gen_score == null
          ? null
          : Number(item.model_idea_gen_score),
    model_execution_score:
      typeof item.model_execution_score === "number"
        ? item.model_execution_score
        : item.model_execution_score == null
          ? null
          : Number(item.model_execution_score),
    model_usage_score:
      typeof item.model_usage_score === "number"
        ? item.model_usage_score
        : item.model_usage_score == null
          ? null
          : Number(item.model_usage_score),
    score_confidence:
      typeof item.score_confidence === "number"
        ? item.score_confidence
        : Number(item.score_confidence ?? 0),
    top_node_ids: rawTopNodeIds
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean),
    last_generated_at:
      typeof item.last_generated_at === "string" && item.last_generated_at.trim()
        ? item.last_generated_at
        : null,
  };
}

function normalizeNodeLeaderboardRow(raw: unknown): NodeLeaderboardRow | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  if (typeof item.node_id !== "string" || !item.node_id.trim()) return null;

  const linkedNodeId =
    typeof item.linked_seevomap_node_id === "string" && item.linked_seevomap_node_id.trim()
      ? item.linked_seevomap_node_id
      : null;
  const detailNodeId = linkedNodeId || (!item.node_id.includes(":") ? item.node_id : null);

  return {
    node_id: item.node_id,
    question:
      typeof item.question === "string" && item.question.trim()
        ? item.question
        : item.node_id,
    generator_model:
      typeof item.generator_model === "string" && item.generator_model.trim()
        ? item.generator_model
        : null,
    field:
      typeof item.field === "string" && item.field.trim()
        ? item.field
        : null,
    node_total_score:
      typeof item.node_total_score === "number"
        ? item.node_total_score
        : item.node_total_score == null
          ? null
          : Number(item.node_total_score),
    node_agent_score:
      typeof item.node_agent_score === "number"
        ? item.node_agent_score
        : item.node_agent_score == null
          ? null
          : Number(item.node_agent_score),
    node_execution_score:
      typeof item.node_execution_score === "number"
        ? item.node_execution_score
        : item.node_execution_score == null
          ? null
          : Number(item.node_execution_score),
    node_usage_score:
      typeof item.node_usage_score === "number"
        ? item.node_usage_score
        : item.node_usage_score == null
          ? null
          : Number(item.node_usage_score),
    linked_seevomap_node_id: linkedNodeId,
    detail_node_id: detailNodeId,
  };
}

async function fetchLeaderboardBoard<T extends LeaderboardRow>(
  board: LeaderboardBoard,
  limit = 25,
  options: ApiRequestOptions = {},
  normalizer: (raw: unknown) => T | null,
): Promise<LeaderboardResponse<T>> {
  const graphId = normalizeGraphId(options.graphId);
  const apiName = board === "model"
    ? "api_model_leaderboard"
    : board === "node"
      ? "api_node_leaderboard"
      : "api_leaderboard";

  try {
    const raw = await callGradio<unknown>(
      apiName,
      [limit, graphId],
      options.accessToken,
    );
    const payload = unwrapGradioJson<LeaderboardResponse>(raw);
    if (!payload) {
      throw new Error("Invalid leaderboard response");
    }
    if (payload.status !== "ok") {
      throw new Error(payload.message || "Failed to fetch leaderboard");
    }
    return {
      ...payload,
      board,
      rows: (payload.rows || [])
        .map(normalizer)
        .filter((item): item is T => item !== null),
    };
  } catch (error) {
    if (graphId !== DEFAULT_GRAPH_ID) {
      throw error;
    }
    const fallback = await fetchLeaderboardBoardFromFixture(board, normalizer);
    if (fallback) {
      return fallback;
    }
    throw error;
  }
}

export async function searchNodes(
  query: string,
  topK = 10,
  options: ApiRequestOptions = {},
): Promise<SearchResult[]> {
  const graphId = normalizeGraphId(options.graphId);
  const localResults = graphId === DEFAULT_GRAPH_ID
    ? await searchNodesLocally(query, topK)
    : [];
  const map = await fetchMapData(options);

  try {
    const raw = await callGradio<unknown>(
      "api_search",
      [query, topK, "", "community_real", graphId],
      options.accessToken,
    );
    const payload = unwrapGradioJson<UsageSessionPayload>(raw);
    if (payload?.status === "error") {
      throw new Error(payload.message || "Search failed");
    }
    const remoteResults = (payload?.results || [])
      .map(normalizeSearchResult)
      .filter((item): item is SearchResult => item !== null);
    if (remoteResults.length > 0) {
      return enrichSearchResults(remoteResults, map);
    }
  } catch {
    if (graphId !== DEFAULT_GRAPH_ID) {
      throw new Error(`Failed to search ${graphId}`);
    }
    return localResults;
  }
  return localResults;
}

export async function createInjectSession(
  query: string,
  topK = 10,
  taskId = "",
  sourceType = "community_real",
  options: ApiRequestOptions = {},
): Promise<UsageSessionPayload> {
  const raw = await callGradio<unknown>(
    "api_inject",
    [query, topK, taskId, sourceType, normalizeGraphId(options.graphId)],
    options.accessToken,
  );
  const payload = unwrapGradioJson<UsageSessionPayload>(raw);
  if (!payload) {
    throw new Error("Invalid inject response");
  }
  if (payload.status !== "ok") {
    throw new Error(payload.message || "Failed to create inject session");
  }
  return payload;
}

export async function fetchLeaderboard(
  board: LeaderboardBoard = "model",
  limit = 25,
  options: ApiRequestOptions = {},
): Promise<LeaderboardResponse> {
  if (board === "model") {
    return fetchLeaderboardBoard<ModelLeaderboardRow>(
      "model",
      limit,
      options,
      normalizeModelLeaderboardRow,
    );
  }
  if (board === "node") {
    return fetchLeaderboardBoard<NodeLeaderboardRow>(
      "node",
      limit,
      options,
      normalizeNodeLeaderboardRow,
    );
  }
  return fetchLeaderboardBoard<UsageLeaderboardRow>(
    "usage",
    limit,
    options,
    normalizeUsageLeaderboardRow,
  );
}

export async function fetchModelLeaderboard(
  limit = 25,
  options: ApiRequestOptions = {},
): Promise<LeaderboardResponse<ModelLeaderboardRow>> {
  return fetchLeaderboardBoard<ModelLeaderboardRow>(
    "model",
    limit,
    options,
    normalizeModelLeaderboardRow,
  );
}

export async function fetchNodeLeaderboard(
  limit = 25,
  options: ApiRequestOptions = {},
): Promise<LeaderboardResponse<NodeLeaderboardRow>> {
  return fetchLeaderboardBoard<NodeLeaderboardRow>(
    "node",
    limit,
    options,
    normalizeNodeLeaderboardRow,
  );
}

export async function fetchUsageLeaderboard(
  limit = 25,
  options: ApiRequestOptions = {},
): Promise<LeaderboardResponse<UsageLeaderboardRow>> {
  return fetchLeaderboardBoard<UsageLeaderboardRow>(
    "usage",
    limit,
    options,
    normalizeUsageLeaderboardRow,
  );
}

export async function submitLeaderboardFeedback(
  sessionId: string,
  helpfulIds: string[],
  notHelpfulIds: string[],
  options: ApiRequestOptions = {},
): Promise<FeedbackResponse> {
  const payloadArgs = [
    sessionId,
    helpfulIds.join(","),
    notHelpfulIds.join(","),
    "human",
  ];
  const graphId = String(options.graphId || "").trim();
  if (graphId) {
    payloadArgs.push(graphId);
  }
  const raw = await callGradio<unknown>("api_feedback", payloadArgs, options.accessToken);
  const payload = unwrapGradioJson<FeedbackResponse>(raw);
  if (!payload) {
    throw new Error("Invalid feedback response");
  }
  if (payload.status !== "ok") {
    throw new Error(payload.message || "Failed to submit feedback");
  }
  return payload;
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
  options: ApiRequestOptions = {},
): Promise<NodeDetail | null> {
  const graphId = normalizeGraphId(options.graphId);
  const localDetail = graphId === DEFAULT_GRAPH_ID
    ? await getNodeDetailLocally(id)
    : null;

  try {
    const payload = await fetchJson<unknown>(`/graph/${graphId}/nodes/${id}`, {
      accessToken: options.accessToken,
      timeoutMs: 4000,
    });
    return parseNodeDetail(payload, localDetail);
  } catch {
    if (graphId === DEFAULT_GRAPH_ID) {
      const fixtureDetail = await getNodeDetailFromFixture(id);
      if (fixtureDetail) {
        return fixtureDetail;
      }
    }
    return localDetail;
  }
}
