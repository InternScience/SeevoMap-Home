import { useState, useCallback } from "react";
import { searchNodes, getNodeDetail } from "../utils/api";
import type { SearchResult, NodeDetail } from "../utils/types";
import SearchBox from "../components/SearchBox";
import NodeCard from "../components/NodeCard";
import NodeDetailPanel from "../components/NodeDetailPanel";

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail panel
  const [selectedNode, setSelectedNode] = useState<NodeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchNodes(query, 10);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback(async (node: SearchResult) => {
    setDetailLoading(true);
    setSelectedNode(null);
    const detail = await getNodeDetail(node.id);
    setSelectedNode(detail);
    setDetailLoading(false);
  }, []);

  const handleCopyAsPrompt = useCallback(() => {
    const prompt = results
      .map(
        (r, i) =>
          `[${i + 1}] Domain: ${r.domain}\nIdea: ${r.idea}\nMetric: ${r.metric_name} = ${r.metric_value}\n`,
      )
      .join("\n");
    navigator.clipboard.writeText(
      `Here are relevant prior execution records from SeevoMap:\n\n${prompt}`,
    );
  }, [results]);

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="animate-fade-in text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Search Experiences
          </h1>
          <p className="animate-slide-up delay-100 text-text-secondary">
            Find relevant execution records from the community knowledge graph
          </p>
        </div>

        {/* Search */}
        <div className="animate-slide-up delay-200 mb-10">
          <SearchBox onSearch={handleSearch} loading={loading} />
        </div>

        {/* Error */}
        {error && (
          <div className="text-center py-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-bg-card border border-border-subtle rounded-xl p-5">
                <div className="skeleton h-5 w-24 mb-4" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-3/4 mb-4" />
                <div className="skeleton h-2 w-full mb-2" />
                <div className="skeleton h-3 w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-text-muted text-sm">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={handleCopyAsPrompt}
                className="text-sm text-cyan-primary hover:text-cyan-light transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy as Prompt
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((node) => (
                <div key={node.id} className="animate-slide-up">
                  <NodeCard node={node} onClick={() => handleNodeClick(node)} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg mb-2">No results found</p>
            <p className="text-text-muted text-sm">Try a different search query</p>
          </div>
        )}

        {/* Initial state */}
        {!searched && !loading && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-20">&#128269;</div>
            <p className="text-text-muted text-lg">
              Search the community's 3,054 execution records
            </p>
          </div>
        )}
      </div>

      {/* Node detail panel */}
      {(detailLoading || selectedNode) && (
        <NodeDetailPanel
          node={selectedNode}
          loading={detailLoading}
          onClose={() => {
            setSelectedNode(null);
            setDetailLoading(false);
          }}
        />
      )}
    </div>
  );
}
