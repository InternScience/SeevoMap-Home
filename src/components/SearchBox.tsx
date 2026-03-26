import { useState, useCallback } from "react";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  buttonLabel?: string;
}

export default function SearchBox({
  onSearch,
  loading = false,
  placeholder = "Search execution assets... e.g. 'int6 quantization for compact language models'",
  buttonLabel = "Search",
}: SearchBoxProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim() && !loading) onSearch(query.trim());
    },
    [query, loading, onSearch],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="glow-border surface-card-deep relative flex items-center gap-3 rounded-2xl px-4 py-3">
        <div className="surface-badge flex h-10 w-10 items-center justify-center rounded-xl text-text-muted">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none text-sm sm:text-base"
        />

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="theme-primary-button shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-40 flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            buttonLabel
          )}
        </button>
      </div>
    </form>
  );
}
