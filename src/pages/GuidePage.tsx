import { Link } from "react-router-dom";
import DocsShell from "../components/DocsShell";

const DOC_PATHS = [
  {
    title: "Quickstart",
    desc: "The default first path: install the Claude Code skill, open your repo, and trigger one loop iteration.",
    to: "/docs/quickstart",
    toneClass: "section-tone-sage",
  },
  {
    title: "Autoresearch Integration",
    desc: "Choose Claude Code, Codex, or Cursor and read only the workflow for that environment.",
    to: "/docs/integration",
    toneClass: "section-tone-sky",
  },
  {
    title: "Example: Parameter Golf",
    desc: "The full example page: baseline 1.2259, community c002 at 1.1978, and the c003 failure lesson.",
    to: "/docs/parameter-golf",
    toneClass: "section-tone-clay",
  },
  {
    title: "CLI / SDK Reference",
    desc: "Full command and SDK reference, including setup, run, local storage, and maintainer review commands.",
    to: "/docs/reference",
    toneClass: "section-tone-stone",
  },
];

export default function GuidePage() {
  return (
    <DocsShell
      eyebrow="Docs"
      title="Documentation"
      summary="These docs are organized as four roles: one Claude Code-first Quickstart, one environment selector for Autoresearch, one full Example page, and one complete CLI / SDK Reference."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DOC_PATHS.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className={`surface-link-card rounded-2xl p-6 ${item.toneClass}`}
          >
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {item.title}
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {item.desc}
            </p>
            <span className="text-sm text-cyan-primary font-medium">
              Open &rarr;
            </span>
          </Link>
        ))}
      </section>

      <section className="surface-card section-tone-stone rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          How To Read These Docs
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          Start with <code>Quickstart</code> if you want the default Claude
          Code path. Then open <code>Autoresearch Integration</code> only for
          the specific environment you actually use, or open <code>Example</code>{" "}
          for the full public case. Treat <code>Reference</code> as the syntax
          appendix, not as the first read.
        </p>
      </section>
    </DocsShell>
  );
}
