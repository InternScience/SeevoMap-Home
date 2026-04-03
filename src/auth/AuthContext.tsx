/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  DEFAULT_GRAPH_ID,
  getGraphLabel,
  HF_OAUTH_CLIENT_ID,
  LAB_GRAPH_ID,
} from "../config";
import {
  createAccessRequest,
  fetchVisibleGraphs,
  fetchWhoAmI,
} from "../utils/api";
import type {
  AccessRequestCreatePayload,
  AccessRequestRecord,
  GraphRecord,
  Principal,
} from "../utils/types";
import { finishHfLogin, startHfLogin } from "./hfAuth";
import {
  getWebsiteSignInConfigurationMessage,
  isWebsiteSignInConfigured,
} from "./oauthBrowser";

const ACCESS_TOKEN_STORAGE_KEY = "seevomap.auth.access_token";
const SELECTED_GRAPH_STORAGE_KEY = "seevomap.selected_graph_id";

const FALLBACK_PRINCIPAL: Principal = {
  user_id: "anonymous",
  hf_sub: "",
  hf_username: "",
  role: "anonymous",
  granted_graphs: [DEFAULT_GRAPH_ID],
  access_token_present: false,
  pending_access_request: null,
};

const FALLBACK_GRAPHS: GraphRecord[] = [
  {
    graph_id: DEFAULT_GRAPH_ID,
    repo_id: "",
    visibility: "public",
    min_role: "anonymous",
  },
];

interface AuthContextValue {
  accessToken: string;
  principal: Principal;
  graphs: GraphRecord[];
  selectedGraphId: string;
  selectedGraph: GraphRecord;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  canSignIn: boolean;
  signInConfigurationMessage: string | null;
  signIn: (nextPath?: string) => Promise<void>;
  completeSignIn: () => Promise<string>;
  signOut: () => void;
  refreshSession: (tokenOverride?: string | null) => Promise<void>;
  setSelectedGraphId: (graphId: string) => void;
  requestLabAccess: (reason?: string) => Promise<AccessRequestRecord>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeSelectedGraph(graphs: GraphRecord[], preferred: string | null | undefined): string {
  const candidate = String(preferred || "").trim();
  if (candidate && graphs.some((graph) => graph.graph_id === candidate)) {
    return candidate;
  }
  return graphs[0]?.graph_id || DEFAULT_GRAPH_ID;
}

function persistSelectedGraph(graphId: string): void {
  window.localStorage.setItem(SELECTED_GRAPH_STORAGE_KEY, graphId);
}

function persistAccessToken(accessToken: string): void {
  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState("");
  const [principal, setPrincipal] = useState<Principal>(FALLBACK_PRINCIPAL);
  const [graphs, setGraphs] = useState<GraphRecord[]>(FALLBACK_GRAPHS);
  const [selectedGraphId, setSelectedGraphIdState] = useState(DEFAULT_GRAPH_ID);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canSignIn = isWebsiteSignInConfigured(HF_OAUTH_CLIENT_ID);
  const signInConfigurationMessage = getWebsiteSignInConfigurationMessage(
    HF_OAUTH_CLIENT_ID,
    typeof window !== "undefined" ? window.location.origin : "",
    typeof window !== "undefined" ? window.location.pathname : "/",
  );

  const refreshSession = useCallback(async (tokenOverride?: string | null) => {
    const nextToken = String(
      tokenOverride ?? window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? "",
    ).trim();

    setLoading(true);
    try {
      const [nextPrincipal, visibleGraphsPayload] = await Promise.all([
        fetchWhoAmI(nextToken || null),
        fetchVisibleGraphs(nextToken || null),
      ]);
      const nextGraphs = visibleGraphsPayload.graphs.length > 0
        ? visibleGraphsPayload.graphs
        : FALLBACK_GRAPHS;
      const preferredGraph = window.localStorage.getItem(SELECTED_GRAPH_STORAGE_KEY);
      const resolvedGraphId = normalizeSelectedGraph(nextGraphs, preferredGraph);

      persistAccessToken(nextToken);
      persistSelectedGraph(resolvedGraphId);
      setAccessToken(nextToken);
      setPrincipal(nextPrincipal);
      setGraphs(nextGraphs);
      setSelectedGraphIdState(resolvedGraphId);
      setError(null);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Failed to refresh account session";
      persistAccessToken("");
      persistSelectedGraph(DEFAULT_GRAPH_ID);
      setAccessToken("");
      setPrincipal(FALLBACK_PRINCIPAL);
      setGraphs(FALLBACK_GRAPHS);
      setSelectedGraphIdState(DEFAULT_GRAPH_ID);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(async (nextPath = "/account") => {
    if (!canSignIn) {
      setError(signInConfigurationMessage || "Sign-in is not configured on this deployment yet.");
      return;
    }
    setError(null);
    await startHfLogin(nextPath);
  }, [canSignIn, signInConfigurationMessage]);

  const completeSignIn = useCallback(async () => {
    const { accessToken: freshToken, returnPath } = await finishHfLogin();
    await refreshSession(freshToken);
    return returnPath;
  }, [refreshSession]);

  const signOut = useCallback(() => {
    persistAccessToken("");
    persistSelectedGraph(DEFAULT_GRAPH_ID);
    setAccessToken("");
    setPrincipal(FALLBACK_PRINCIPAL);
    setGraphs(FALLBACK_GRAPHS);
    setSelectedGraphIdState(DEFAULT_GRAPH_ID);
    setError(null);
  }, []);

  const setSelectedGraphId = useCallback((graphId: string) => {
    const resolvedGraphId = normalizeSelectedGraph(graphs, graphId);
    persistSelectedGraph(resolvedGraphId);
    setSelectedGraphIdState(resolvedGraphId);
  }, [graphs]);

  const requestLabAccess = useCallback(async (reason?: string) => {
    if (!accessToken) {
      throw new Error("Sign in before requesting lab access");
    }
    const payload: AccessRequestCreatePayload = {
      requested_role: "lab",
      requested_graph: LAB_GRAPH_ID,
      reason: reason || "Requested from the SeevoMap website account page",
    };
    const created = await createAccessRequest(payload, accessToken);
    await refreshSession(accessToken);
    return created;
  }, [accessToken, refreshSession]);

  const selectedGraph = useMemo(() => {
    return graphs.find((graph) => graph.graph_id === selectedGraphId) || FALLBACK_GRAPHS[0];
  }, [graphs, selectedGraphId]);

  const value = useMemo<AuthContextValue>(() => ({
    accessToken,
    principal,
    graphs,
    selectedGraphId,
    selectedGraph,
    isAuthenticated: Boolean(accessToken && principal.user_id !== "anonymous"),
    loading,
    error,
    canSignIn,
    signInConfigurationMessage,
    signIn,
    completeSignIn,
    signOut,
    refreshSession,
    setSelectedGraphId,
    requestLabAccess,
  }), [
    accessToken,
    principal,
    graphs,
    selectedGraphId,
    selectedGraph,
    loading,
    error,
    canSignIn,
    signInConfigurationMessage,
    signIn,
    completeSignIn,
    signOut,
    refreshSession,
    setSelectedGraphId,
    requestLabAccess,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function graphAccessSummary(principal: Principal): string {
  if (principal.role === "anonymous") return "Anonymous public access";
  if (principal.role === "member") return "Signed in with public graph access";
  return `${principal.role} access to ${principal.granted_graphs.map(getGraphLabel).join(", ")}`;
}
