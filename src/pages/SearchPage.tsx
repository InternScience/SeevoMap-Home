import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { getGraphLabel } from "../config";
import {
  searchNodes,
  getNodeDetail,
  browseByDomain,
  createInjectSession,
  submitLeaderboardFeedback,
} from "../utils/api";
import type { SearchResult, NodeDetail } from "../utils/types";
import SearchBox from "../components/SearchBox";
import NodeCard from "../components/NodeCard";
import NodeDetailPanel from "../components/NodeDetailPanel";

const MARKET_STATS = [
  {
    label: "Listed Records",
    value: "4,279",
    desc: "Execution assets searchable right now",
  },
  {
    label: "Research Domains",
    value: "9",
    desc: "Covered by the public graph",
  },
  {
    label: "Connections",
    value: "15,365",
    desc: "Links between related runs",
  },
];

const FILTERS = [
  { key: "information_science", label: "Information Science" },
  { key: "chemistry", label: "Chemistry" },
  { key: "life_science", label: "Life Science" },
  { key: "physics", label: "Physics" },
  { key: "mathematics", label: "Mathematics" },
  { key: "medicine", label: "Medicine" },
  { key: "earth_space", label: "Earth & Space" },
  { key: "engineering", label: "Engineering" },
  { key: "economics", label: "Economics" },
];

const CURATED_QUERIES = [
  {
    label: "Parameter Golf",
    title: "16MB compact LM optimization",
    query: "OpenAI Parameter Golf val_bpb under 16MB artifact",
  },
  {
    label: "Compression",
    title: "Mixed int6 quantization",
    query: "mixed int6 quantization for compact language models",
  },
  {
    label: "Autoresearch",
    title: "Training loop with community memory",
    query: "agent loop with execution-grounded context injection",
  },
  {
    label: "Evaluation",
    title: "Better benchmarking signals",
    query: "evaluation methodology for compact language models",
  },
];

export default function SearchPage() {
  const { accessToken, selectedGraphId } = useAuth();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [shouldScrollToResults, setShouldScrollToResults] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [injectSessionId, setInjectSessionId] = useState<string | null>(null);
  const [injectMessage, setInjectMessage] = useState<string | null>(null);
  const [feedbackHelpful, setFeedbackHelpful] = useState("");
  const [feedbackNotHelpful, setFeedbackNotHelpful] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setLastQuery(query);
    setActiveFilter("all");
    setShouldScrollToResults(true);
    setInjectSessionId(null);
    setInjectMessage(null);
    setFeedbackHelpful("");
    setFeedbackNotHelpful("");
    setFeedbackLoading(false);
    setFeedbackMessage(null);
    setFeedbackError(null);
    try {
      const data = await searchNodes(query, 10, {
        graphId: selectedGraphId,
        accessToken,
      });
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, selectedGraphId]);

  useEffect(() => {
    if (!loading && searched && shouldScrollToResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      setShouldScrollToResults(false);
    }
  }, [loading, searched, shouldScrollToResults]);

  const loadNodeDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setSelectedNode(null);
    setError(null);
    try {
      const detail = await getNodeDetail(id, {
        graphId: selectedGraphId,
        accessToken,
      });
      if (!detail) {
        setError("Failed to load node detail");
        return;
      }
      setSelectedNode(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load node detail");
    } finally {
      setDetailLoading(false);
    }
  }, [accessToken, selectedGraphId]);

  const handleNodeClick = useCallback(async (node: SearchResult) => {
    await loadNodeDetail(node.id);
  }, [loadNodeDetail]);

  const handleRelatedNodeClick = useCallback(async (id: string) => {
    await loadNodeDetail(id);
  }, [loadNodeDetail]);

  const handleCopyAsPrompt = useCallback(() => {
    if (!lastQuery.trim()) return;
    setInjecting(true);
    setInjectMessage(null);
    setFeedbackMessage(null);
    setFeedbackError(null);

    void createInjectSession(lastQuery, 10, "", "community_real", {
      graphId: selectedGraphId,
      accessToken,
    })
      .then(async (payload) => {
        setInjectSessionId(payload.session_id);
        await navigator.clipboard.writeText(payload.prompt_text);
        setInjectMessage(
          `Agent context copied. Session ID: ${payload.session_id}`,
        );
      })
      .catch((e) => {
        setInjectMessage(
          e instanceof Error ? e.message : "Failed to create inject session",
        );
      })
      .finally(() => {
        setInjecting(false);
      });
  }, [accessToken, lastQuery, selectedGraphId]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!injectSessionId) {
      setFeedbackError("Create an inject session first.");
      setFeedbackMessage(null);
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError(null);
    setFeedbackMessage(null);
    try {
      const helpful = feedbackHelpful
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const notHelpful = feedbackNotHelpful
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      await submitLeaderboardFeedback(injectSessionId, helpful, notHelpful, {
        graphId: selectedGraphId,
        accessToken,
      });
      setFeedbackMessage(`Feedback saved for session ${injectSessionId}.`);
      setFeedbackHelpful("");
      setFeedbackNotHelpful("");
    } catch (e) {
      setFeedbackError(
        e instanceof Error ? e.message : "Failed to submit feedback",
      );
    } finally {
      setFeedbackLoading(false);
    }
  }, [accessToken, feedbackHelpful, feedbackNotHelpful, injectSessionId, selectedGraphId]);

  const handleFilterClick = useCallback(async (key: string) => {
    setActiveFilter(key);
    if (key === "all") {
      if (!searched) { setResults([]); }
      return;
    }
    setLoading(true);
    setSearched(true);
    const filterLabel = FILTERS.find((filter) => filter.key === key)?.label || key;
    const domain = key;
    const label = filterLabel;
    setLastQuery(label);
    setShouldScrollToResults(true);
    try {
      const data = await browseByDomain(domain, 30, "", {
        graphId: selectedGraphId,
        accessToken,
      });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, searched, selectedGraphId]);

  useEffect(() => {
    setResults([]);
    setSelectedNode(null);
    setInjectSessionId(null);
    setInjectMessage(null);
    setFeedbackHelpful("");
    setFeedbackNotHelpful("");
    setFeedbackMessage(null);
    setFeedbackError(null);
    setSearched(false);
    setActiveFilter("all");
    setError(null);
  }, [selectedGraphId]);

  const filteredResults =
    activeFilter === "all"
      ? results
      : results;

  return (
    <div className="pt-16 min-h-screen overflow-hidden">
      <section className="relative border-b border-border-subtle">
        <div className="absolute inset-0 hero-field" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <p className="text-text-muted text-xs uppercase tracking-[0.18em] mb-5">
            Search Market
          </p>
          <div className="max-w-3xl mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
              Search the research market
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Browse execution assets, discover reusable experiment patterns,
              and pull agent-ready context from the SeevoMap graph in one place.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border-subtle px-4 py-2 text-sm text-text-secondary">
              <span className="text-text-muted">Active map</span>
              <span className="font-semibold text-text-primary">
                {getGraphLabel(selectedGraphId)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {MARKET_STATS.map((item, i) => (
              <div
                key={item.label}
                className={`surface-card rounded-2xl px-5 py-5 ${
                  i % 4 === 0
                    ? "section-tone-sky"
                    : i % 4 === 1
                      ? "section-tone-sage"
                      : i % 4 === 2
                        ? "section-tone-clay"
                        : "section-tone-stone"
                }`}
              >
                <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
                  {item.label}
                </p>
                <p className="text-2xl sm:text-3xl font-semibold text-text-primary mb-2">
                  {item.value}
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3 mb-8">
            {/* All button */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => handleFilterClick("all")}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  activeFilter === "all"
                    ? "surface-pill-active text-emerald-primary"
                    : "surface-pill text-text-secondary hover:text-text-primary"
                }`}
              >
                All
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    onClick={() => handleFilterClick(filter.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      isActive
                        ? "surface-pill-active text-emerald-primary"
                        : "surface-pill text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-10">
            <SearchBox
              onSearch={handleSearch}
              loading={loading}
              placeholder="Search execution assets by task, technique, or metric..."
              buttonLabel="Search"
            />
          </div>

          {!searched && (
            <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6 items-start">
              <div className="surface-card section-tone-stone rounded-3xl p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-text-primary mb-2">
                    Curated discovery
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Start with one focused query instead of a blank input box.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CURATED_QUERIES.map((item) => (
                    <button
                      key={item.query}
                      onClick={() => handleSearch(item.query)}
                      className="surface-link-card section-tone-sky rounded-2xl p-5 text-left"
                    >
                      <span className="mb-4 inline-flex rounded-full border border-cyan-primary/20 bg-cyan-primary/10 px-2.5 py-1 text-xs font-medium text-cyan-light">
                        {item.label}
                      </span>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {item.query}
                      </p>
                      <div className="mt-4 text-xs text-cyan-light">
                        Run this search
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="surface-card section-tone-sage rounded-3xl p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  How to use this page
                </h2>
                <ol className="space-y-3 text-sm text-text-secondary leading-relaxed list-decimal pl-5">
                  <li>Search by task, technique, or metric target.</li>
                  <li>Open a result card to inspect analysis and code diff.</li>
                  <li>Copy the result set as prompt context for your next loop.</li>
                  <li>Feed the outcome back into SeevoMap after evaluation.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </section>

      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="text-center py-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface-card-deep rounded-2xl p-5">
                <div className="skeleton h-5 w-24 mb-4" />
                <div className="skeleton h-6 w-full mb-3" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-3/4 mb-5" />
                <div className="skeleton h-2 w-full mb-4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-2">
                  Result Feed
                </p>
                <h2 className="text-2xl font-semibold text-text-primary mb-2">
                  {filteredResults.length} asset{filteredResults.length !== 1 ? "s" : ""} matched
                </h2>
                <p className="text-sm text-text-secondary">
                  Query: <code>{lastQuery}</code>
                </p>
              </div>
              <button
                onClick={handleCopyAsPrompt}
                className="surface-pill inline-flex items-center gap-2 rounded-full border border-cyan-primary/20 bg-cyan-primary/10 px-4 py-2 text-sm text-cyan-light transition-colors hover:text-text-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {injecting ? "Preparing..." : "Create Inject Session"}
              </button>
            </div>

            {(injectMessage || injectSessionId || feedbackMessage || feedbackError) && (
              <div className="mb-6 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
                <div className="surface-card section-tone-sky rounded-3xl p-6">
                  <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
                    Inject Session
                  </p>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Session-bound prompt generation
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    This creates one leaderboard-eligible inject session and copies
                    backend-formatted agent context to your clipboard.
                  </p>
                  {injectSessionId && (
                    <p className="text-sm text-text-primary mb-2">
                      Session ID: <code>{injectSessionId}</code>
                    </p>
                  )}
                  {injectMessage && (
                    <p className="text-sm text-cyan-light">{injectMessage}</p>
                  )}
                </div>

                <div className="surface-card section-tone-stone rounded-3xl p-6">
                  <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-3">
                    Optional Feedback
                  </p>
                  <div className="space-y-3">
                    <input
                      value={feedbackHelpful}
                      onChange={(event) => setFeedbackHelpful(event.target.value)}
                      placeholder="Helpful node IDs: comma,separated"
                      className="w-full rounded-2xl border border-border-subtle bg-transparent px-4 py-3 text-sm text-text-primary"
                    />
                    <input
                      value={feedbackNotHelpful}
                      onChange={(event) => setFeedbackNotHelpful(event.target.value)}
                      placeholder="Not helpful node IDs: comma,separated"
                      className="w-full rounded-2xl border border-border-subtle bg-transparent px-4 py-3 text-sm text-text-primary"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSubmitFeedback()}
                      disabled={feedbackLoading}
                      className="w-full rounded-2xl bg-emerald-primary px-4 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-60"
                    >
                      {feedbackLoading ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </div>
                  {feedbackMessage && (
                    <p className="mt-3 text-sm text-emerald-primary">{feedbackMessage}</p>
                  )}
                  {feedbackError && (
                    <p className="mt-3 text-sm text-red-400">{feedbackError}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredResults.map((node) => (
                <div key={node.id} className="animate-slide-up">
                  <NodeCard node={node} onClick={() => handleNodeClick(node)} />
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && searched && filteredResults.length === 0 && results.length === 0 && !error && (
          <div className="surface-card section-tone-stone rounded-3xl py-20 text-center">
            <p className="text-text-primary text-lg mb-2">No assets matched this view</p>
            <p className="text-text-muted text-sm">
              Try a broader query or switch the active filter.
            </p>
          </div>
        )}

        {!searched && !loading && (
          <div className="surface-card section-tone-stone rounded-3xl py-20 text-center">
            <div className="text-5xl mb-4 opacity-20">&#128269;</div>
            <p className="text-text-primary text-lg mb-2">
              Search the community&apos;s execution assets
            </p>
            <p className="text-text-muted text-sm">
              Start with a curated query above, or type your own task.
            </p>
          </div>
        )}
      </div>

      {(detailLoading || selectedNode) && (
        <NodeDetailPanel
          node={selectedNode}
          loading={detailLoading}
          onOpenNode={handleRelatedNodeClick}
          onClose={() => {
            setSelectedNode(null);
            setDetailLoading(false);
          }}
        />
      )}
    </div>
  );
}
