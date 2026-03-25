import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

const DOCS_LINKS = [
  { to: "/docs", label: "Docs Home" },
  { to: "/docs/quickstart", label: "Quickstart" },
  { to: "/docs/integration", label: "Autoresearch" },
  { to: "/docs/parameter-golf", label: "Parameter Golf" },
  { to: "/docs/reference", label: "Reference" },
];

interface DocsShellProps {
  eyebrow?: string;
  title: string;
  summary: string;
  children: ReactNode;
}

export default function DocsShell({
  eyebrow = "Docs",
  title,
  summary,
  children,
}: DocsShellProps) {
  const location = useLocation();

  return (
    <div className="pt-16 min-h-screen">
      <div className="relative overflow-hidden border-b border-border-subtle">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(6,182,212,0.06),transparent)]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <p className="text-cyan-primary text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] mb-3">
            {eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            {title}
          </h1>
          <p className="text-text-secondary max-w-3xl leading-relaxed text-sm sm:text-base">
            {summary}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {DOCS_LINKS.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    isActive
                      ? "bg-emerald-primary/10 text-emerald-primary border-emerald-primary/30"
                      : "bg-white/5 text-text-secondary border-border-subtle hover:text-text-primary hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {children}
      </div>
    </div>
  );
}
