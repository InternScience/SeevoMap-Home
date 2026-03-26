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
    <div className="code-shell relative group rounded-xl overflow-hidden">
      {/* Language badge */}
      {language && (
        <div className="code-shell-header flex items-center justify-between px-4 py-2">
          <span className="text-xs font-mono">{language}</span>
          <button
            onClick={handleCopy}
            className="code-shell-copy text-xs transition-colors flex items-center gap-1"
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

      <pre className="code-shell-body p-4 overflow-x-auto">
        <code className="code-shell-text text-sm font-mono leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}
