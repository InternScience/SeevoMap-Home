import { SEEVOMAP_DEFAULT_OAUTH_CLIENT_ID } from "./auth/oauthBrowser";

export const DEFAULT_GRAPH_ID = "public";
export const LAB_GRAPH_ID = "lab";

export const SPACE_URL =
  import.meta.env.VITE_SEEVOMAP_SPACE_URL || "https://akiwatanabe-seevomap.hf.space";
export const SPACE_API_URL = `${SPACE_URL}/api`;
export const GRADIO_API = `${SPACE_URL}/gradio_api/call`;
export const MAP_URL =
  "https://huggingface.co/datasets/akiwatanabe/seevomap-graph/resolve/main/map.json";

export const HF_OAUTH_CLIENT_ID = import.meta.env.VITE_SEEVOMAP_HF_CLIENT_ID || SEEVOMAP_DEFAULT_OAUTH_CLIENT_ID;
export const HF_OAUTH_AUTHORIZE_URL = "https://huggingface.co/oauth/authorize";
export const HF_OAUTH_TOKEN_URL = "https://huggingface.co/oauth/token";

export function getGraphLabel(graphId: string): string {
  if (graphId === DEFAULT_GRAPH_ID) return "Public Graph";
  if (graphId === LAB_GRAPH_ID) return "Lab Graph";
  return graphId || "Unknown Graph";
}
