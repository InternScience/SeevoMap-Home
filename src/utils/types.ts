export interface MapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  domain: string;
  task_name?: string;
  method_tags?: string[];
  metric_name: string;
  metric_value: number;
  success?: boolean;
  source?: string;
  idea?: string;
  status?: "approved" | "pending" | "rejected" | "hypothesis";
  model?: string;
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
  label: string;   // title: question (ScivBook) or task description (AI Core)
  idea: string;     // content: methodology (ScivBook) or [Experiment]... (AI Core)
  domain: string;
  metric_name: string;
  metric_value: number;
  score: number;
  status: string;
}

export interface RelatedNode {
  id: string;
  title: string;
  domain?: string;
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
  neighbors: RelatedNode[];
  // enriched fields
  source?: string;
  task_name?: string;
  method_tags?: string[];
  success?: boolean;
  label?: string;
}

export interface UsageSessionPayload {
  status: string;
  session_id: string;
  query: string;
  task_id?: string;
  source_type?: string;
  results: SearchResult[];
  prompt_text: string;
  injected_node_ids?: string[];
  message?: string;
}

export type LeaderboardBoard = "model" | "node" | "usage";

export interface UsageLeaderboardRow {
  node_id: string;
  title: string;
  domain: string;
  usage_score: number;
  retrieved_count: number;
  injected_count: number;
  helpful_count: number;
  not_helpful_count: number;
  feedback_sessions: number;
  feedback_coverage: string;
  last_used_at?: string | null;
}

export interface ScoreAdjustment {
  target: string;
  delta: number;
  reason?: string | null;
  scope?: string | null;
}

export interface ModelLeaderboardRow {
  generator_model: string;
  generator_family?: string | null;
  idea_count: number;
  scored_idea_count: number;
  raw_model_total_score?: number | null;
  model_total_score: number | null;
  raw_model_idea_gen_score?: number | null;
  model_idea_gen_score: number | null;
  model_execution_score: number | null;
  model_usage_score: number | null;
  score_confidence: number;
  top_node_ids: string[];
  last_generated_at?: string | null;
  score_adjustments?: ScoreAdjustment[];
}

export interface NodeLeaderboardRow {
  node_id: string;
  question: string;
  generator_model?: string | null;
  field?: string | null;
  raw_node_total_score?: number | null;
  node_total_score: number | null;
  raw_node_agent_score?: number | null;
  node_agent_score: number | null;
  node_execution_score: number | null;
  node_usage_score: number | null;
  linked_seevomap_node_id?: string | null;
  detail_node_id?: string | null;
  score_adjustments?: ScoreAdjustment[];
}

export type LeaderboardRow =
  | UsageLeaderboardRow
  | ModelLeaderboardRow
  | NodeLeaderboardRow;

export interface LeaderboardResponse<T extends LeaderboardRow = LeaderboardRow> {
  status: string;
  board: LeaderboardBoard;
  updated_at?: string;
  total_rows: number;
  rows: T[];
  message?: string;
}

export interface FeedbackResponse {
  status: string;
  session_id?: string;
  feedback?: Record<string, string>;
  leaderboard_rows?: number;
  message?: string;
}

export interface AccessRequestRecord {
  request_id: string;
  user_id: string;
  requested_role: string;
  current_role: string;
  requested_graph?: string;
  reason?: string;
  status: string;
  created_at?: string;
  reviewed_at?: string | null;
  reviewer_user_id?: string;
}

export interface Principal {
  user_id: string;
  hf_sub: string;
  hf_username: string;
  role: string;
  granted_graphs: string[];
  access_token_present: boolean;
  pending_access_request?: AccessRequestRecord | null;
}

export interface GraphRecord {
  graph_id: string;
  repo_id: string;
  visibility: string;
  min_role: string;
}

export interface GraphListResponse {
  graphs: GraphRecord[];
}

export interface AccessRequestCreatePayload {
  requested_role: string;
  reason?: string;
  requested_graph?: string;
}
