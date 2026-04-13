import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { graphAccessSummary, useAuth } from "../auth/AuthContext";
import { getGraphLabel } from "../config";

export default function AccountPage() {
  const location = useLocation();
  const {
    canSignIn,
    error,
    isAuthenticated,
    loading,
    principal,
    requestLabAccess,
    selectedGraph,
    signInConfigurationMessage,
    signIn,
    signOut,
  } = useAuth();
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const pendingRequest = principal.pending_access_request || null;
  const canRequestLab = isAuthenticated && principal.role === "member" && !pendingRequest;
  const summary = useMemo(() => graphAccessSummary(principal), [principal]);

  async function handleRequestAccess() {
    setRequestLoading(true);
    setRequestMessage(null);
    try {
      const created = await requestLabAccess();
      setRequestMessage(`Access request ${created.request_id} submitted for ${getGraphLabel("lab")}.`);
    } catch (caughtError) {
      setRequestMessage(caughtError instanceof Error ? caughtError.message : "Request failed");
    } finally {
      setRequestLoading(false);
    }
  }

  return (
    <div className="pt-16 min-h-screen overflow-hidden">
      <section className="relative border-b border-border-subtle">
        <div className="absolute inset-0 hero-field" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-text-muted text-xs uppercase tracking-[0.18em] mb-5">
            Account
          </p>
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
              SeevoMap account and graph access
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Keep one public entrypoint, sign in with Hugging Face, and switch
              into higher-tier graphs only when your role allows it.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {error && (
          <div className="surface-card rounded-2xl p-5 border border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="surface-card section-tone-stone rounded-3xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
              Identity
            </p>
            {loading ? (
              <p className="text-text-secondary text-sm">Refreshing account state...</p>
            ) : isAuthenticated ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-text-primary">
                    @{principal.hf_username || principal.user_id}
                  </h2>
                  <p className="text-sm text-text-secondary mt-2">{summary}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="surface-note rounded-2xl p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
                      Role
                    </p>
                    <p className="text-lg font-semibold text-text-primary">{principal.role}</p>
                  </div>
                  <div className="surface-note rounded-2xl p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted mb-2">
                      Active map
                    </p>
                    <p className="text-lg font-semibold text-text-primary">
                      {getGraphLabel(selectedGraph.graph_id)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="surface-pill rounded-full border px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-text-secondary text-sm leading-relaxed">
                  You are browsing anonymously. Public map routes stay open by
                  default, and signing in only adds account state plus access
                  upgrade paths.
                </p>
                {!canSignIn ? (
                  <p className="text-text-muted text-sm leading-relaxed">
                    {signInConfigurationMessage || "This deployment does not have Hugging Face sign-in configured yet."}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => void signIn(location.pathname)}
                  disabled={!canSignIn}
                  className="surface-pill rounded-full border px-4 py-2 text-sm text-text-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Sign in with Hugging Face
                </button>
              </div>
            )}
          </section>

          <section className="surface-card section-tone-sage rounded-3xl p-6">
            <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
              Graph grants
            </p>
            <div className="space-y-3">
              {principal.granted_graphs.map((graphId) => (
                <div key={graphId} className="surface-note rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {getGraphLabel(graphId)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {graphId === "public" ? "Always visible" : "Granted by role"}
                    </p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs text-emerald-primary bg-emerald-primary/10 border border-emerald-primary/20">
                    active
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="surface-card section-tone-clay rounded-3xl p-6">
          <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
            Lab access
          </p>
          {principal.role === "lab" || principal.role === "maintainer" ? (
            <p className="text-text-secondary text-sm leading-relaxed">
              Your role already includes {getGraphLabel("lab")}. Use the map
              selector in the navbar to switch views explicitly.
            </p>
          ) : pendingRequest ? (
            <p className="text-text-secondary text-sm leading-relaxed">
              Pending request {pendingRequest.request_id} for {getGraphLabel("lab")}.
            </p>
          ) : canRequestLab ? (
            <div className="space-y-4">
              <p className="text-text-secondary text-sm leading-relaxed">
                Lab graph access stays gated. Request it when you need the
                private research layer rather than the public community graph.
              </p>
              <button
                type="button"
                onClick={() => void handleRequestAccess()}
                disabled={requestLoading}
                className="surface-pill rounded-full border px-4 py-2 text-sm text-text-primary disabled:opacity-60"
              >
                {requestLoading ? "Submitting..." : "Request Lab Access"}
              </button>
            </div>
          ) : (
            <p className="text-text-secondary text-sm leading-relaxed">
              Sign in first to request access upgrades.
            </p>
          )}
          {requestMessage ? (
            <p className="text-sm text-text-secondary mt-4">{requestMessage}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
