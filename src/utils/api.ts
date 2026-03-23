import { MAP_URL, GRADIO_API } from "../config";
import type { MapData, SearchResult, NodeDetail } from "./types";

let cachedMap: MapData | null = null;

export async function fetchMapData(): Promise<MapData> {
  if (cachedMap) return cachedMap;

  // Try local fallback first (works without network), then HF
  for (const url of ["/map.json", MAP_URL]) {
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

/**
 * Call a Gradio SSE endpoint:
 *  1. POST /gradio_api/call/<fn_name> → { event_id }
 *  2. GET  /gradio_api/call/<fn_name>/<event_id> → SSE stream, last "data:" line has result
 */
async function callGradio<T>(fnName: string, payload: unknown[]): Promise<T> {
  const postRes = await fetch(`${GRADIO_API}/${fnName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  if (!postRes.ok) throw new Error(`Gradio POST failed: ${postRes.status}`);
  const { event_id } = await postRes.json();

  const getRes = await fetch(`${GRADIO_API}/${fnName}/${event_id}`);
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
  const raw = await callGradio<unknown[]>("ui_search", [query, topK]);
  // Gradio wraps results; adapt to your API shape
  if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
    return raw[0] as SearchResult[];
  }
  if (Array.isArray(raw)) return raw as SearchResult[];
  return [];
}

export async function getNodeDetail(
  id: string,
): Promise<NodeDetail | null> {
  try {
    const raw = await callGradio<unknown[]>("ui_node_detail", [id]);
    if (Array.isArray(raw) && raw.length > 0) {
      return raw[0] as NodeDetail;
    }
    return raw as unknown as NodeDetail;
  } catch {
    return null;
  }
}
