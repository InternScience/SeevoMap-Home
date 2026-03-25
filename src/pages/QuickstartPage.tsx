import CodeBlock from "../components/CodeBlock";
import DocsShell from "../components/DocsShell";

const QUICKSTART_STEPS = [
  {
    title: "Install",
    desc: "Install the package once. Everything below works with the same CLI and Python SDK.",
  },
  {
    title: "Search",
    desc: "Look up similar runs before your next experiment. This is the memory lookup step.",
  },
  {
    title: "Inject",
    desc: "Turn the top search hits into prompt-ready context for your agent or loop runner.",
  },
  {
    title: "Submit",
    desc: "Push the resulting experiment back into the graph so the next loop starts higher.",
  },
];

export default function QuickstartPage() {
  return (
    <DocsShell
      eyebrow="Docs / Quickstart"
      title="Quickstart"
      summary="Use the CLI once to prove the full loop works locally: install, search, inject, and submit. This is the shortest path to a working SeevoMap integration."
    >
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICKSTART_STEPS.map((step, index) => (
          <div
            key={step.title}
            className="rounded-2xl border border-border-subtle bg-bg-card px-5 py-5"
          >
            <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-2">
              Step {index + 1}
            </p>
            <h2 className="text-text-primary font-semibold mb-2">{step.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-border-subtle bg-bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          5-Minute Loop
        </h2>
        <CodeBlock
          code={`pip install seevomap

# Search relevant execution records
seevomap search "optimize transformer pretraining" --top-k 5

# Generate prompt-ready context for your agent
seevomap inject "minimize bpb for compact language model" --top-k 10 > context.txt

# Inspect one node if needed
seevomap get node a30044c5

# Submit your result back
seevomap submit my_experiment.json`}
          language="bash"
        />
        <p className="text-sm text-text-secondary mt-4 leading-relaxed">
          If you only remember one concept, remember this: <code>search</code>{" "}
          is for exploration, <code>inject</code> is for the next agent prompt,
          and <code>submit</code> closes the loop.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            What you get back
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Search results are real execution records: method tags, metrics,
            analysis, and sometimes failure cases. Inject packages the same data
            into agent-friendly context.
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Where to go next
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            If you are evaluating SeevoMap as part of an agent workflow, go
            straight to <code>Autoresearch</code>. If you want one concrete
            example, open <code>Parameter Golf</code>.
          </p>
        </div>
      </section>
    </DocsShell>
  );
}
