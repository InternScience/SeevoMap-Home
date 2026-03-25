import { Link } from "react-router-dom";
import CodeBlock from "../components/CodeBlock";
import DocsShell from "../components/DocsShell";

const QUICKSTART_SNIPPET = [
  "pip install seevomap",
  "",
  "# Search for related experiments",
  'seevomap search "optimize transformer pretraining" --top-k 5',
  "",
  "# Get prompt-ready context for your agent",
  'seevomap inject "minimize bpb for compact LM" --top-k 10 > context.txt',
  "",
  "# Submit your result back",
  "seevomap submit my_experiment.json",
].join("\n");

const DOC_PATHS = [
  {
    title: "Quickstart",
    desc: "Prove SeevoMap works locally in five minutes: install, search, inject, submit.",
    to: "/docs/quickstart",
  },
  {
    title: "Autoresearch Integration",
    desc: "The main path: use SeevoMap as a memory and context layer for Claude Code, manual loops, and framework integrations.",
    to: "/docs/integration",
  },
  {
    title: "Parameter Golf",
    desc: "A concrete example anchored to the current public result and a real optimization loop.",
    to: "/docs/parameter-golf",
  },
  {
    title: "CLI / SDK Reference",
    desc: "Exact commands and Python methods once you know which workflow you want.",
    to: "/docs/reference",
  },
];

export default function GuidePage() {
  return (
    <DocsShell
      eyebrow="Docs"
      title="Documentation"
      summary="SeevoMap has two stories: the short local proof that the CLI works, and the more important workflow where community execution records improve an autoresearch loop. Start with the path that matches your goal."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DOC_PATHS.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="rounded-2xl border border-border-subtle bg-bg-card p-6 transition-colors hover:bg-white/5"
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

      <section className="rounded-3xl border border-border-subtle bg-bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          If you only want the shortest possible proof
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          The CLI still matters. It is just no longer the whole story. This is
          the minimum loop:
        </p>
        <CodeBlock code={QUICKSTART_SNIPPET} language="bash" />
        <p className="mt-4 text-text-secondary text-sm leading-relaxed">
          If your real goal is agent integration rather than trying one command
          manually, go directly to <code>Autoresearch Integration</code>.
        </p>
      </section>

      <section className="rounded-3xl border border-border-subtle bg-bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Recommended reading order
        </h2>
        <ol className="text-sm text-text-secondary leading-relaxed space-y-2 list-decimal pl-5">
          <li>Quickstart if you want to validate installation and the basic loop.</li>
          <li>Autoresearch Integration if you are wiring SeevoMap into an agent system.</li>
          <li>Parameter Golf if you want one real workflow end-to-end.</li>
          <li>Reference after you already know which workflow you want.</li>
        </ol>
      </section>
    </DocsShell>
  );
}
