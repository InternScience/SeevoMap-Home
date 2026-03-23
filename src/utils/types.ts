export interface MapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  domain: string;
  idea: string;
  metric_name: string;
  metric_value: number;
  status: "approved" | "pending" | "rejected";
}

export interface MapEdge {
  source: string;
  target: string;
  weight: number;
}

export interface MapData {
  nodes: MapNode[];
  edges: MapEdge[];
}

export interface SearchResult {
  id: string;
  idea: string;
  domain: string;
  metric_name: string;
  metric_value: number;
  score: number;
  status: string;
}

export interface NodeDetail {
  id: string;
  idea: string;
  domain: string;
  metric_name: string;
  metric_value: number;
  analysis: string;
  code_diff: string;
  status: string;
  neighbors: string[];
}
