import { useState, useCallback } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = "bash" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border-subtle">
      {/* Language badge */}
      {language && (
        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-border-subtle">
          <span className="text-xs text-text-muted font-mono">{language}</span>
          <button
            onClick={handleCopy}
            className="text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      )}

      <pre className="p-4 overflow-x-auto bg-[#080c14]">
        <code className="text-sm font-mono text-emerald-light leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}
