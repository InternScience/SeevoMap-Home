import { useState } from "react";
import CodeBlock from "../components/CodeBlock";

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-border-subtle last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <h2 className="text-xl font-semibold text-text-primary group-hover:text-emerald-primary transition-colors">
          {title}
        </h2>
        <span className="text-text-muted text-xl transition-transform duration-200" style={{ transform: open ? "rotate(45deg)" : "none" }}>
          +
        </span>
      </button>
      {open && <div className="pb-8 prose-dark">{children}</div>}
    </section>
  );
}

export default function GuidePage() {
  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="animate-fade-in text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Guide
          </h1>
          <p className="animate-slide-up delay-100 text-text-secondary">
            Three commands to get started. Everything else is optional.
          </p>
        </div>

        {/* ---- Quick Start (always open) ---- */}
        <Section title="Quick Start" defaultOpen>
          <CodeBlock
            code={`pip install seevomap

# Search for related experiments
seevomap search "optimize transformer pretraining" --top-k 5

# Get prompt-ready context for your agent
seevomap inject "minimize bpb for compact LM" --top-k 10 > context.txt

# Submit your result back
seevomap submit my_experiment.json`}
            language="bash"
          />
          <p className="mt-4 text-text-secondary text-sm">
            That's it. <code>search</code> finds similar experiments.{" "}
            <code>inject</code> formats them for your agent's prompt.{" "}
            <code>submit</code> contributes your result back.
          </p>
        </Section>

        {/* ---- CLI Reference ---- */}
        <Section title="CLI Reference">
          <h3>seevomap search</h3>
          <p>Semantic search across 3,000+ execution records. Returns results ranked by relevance.</p>
          <CodeBlock
            code={`seevomap search "GNN molecular property prediction" --top-k 5`}
            language="bash"
          />

          <h3>seevomap inject</h3>
          <p>Same search, but formatted as prompt context. Pipe into a file or directly into your agent.</p>
          <CodeBlock
            code={`seevomap inject "training stability for small LMs" --top-k 12 > context.txt`}
            language="bash"
          />

          <h3>seevomap get</h3>
          <p>Inspect a single node by ID, or download the full graph map.</p>
          <CodeBlock
            code={`seevomap get node a30044c5
seevomap get map -o map.json`}
            language="bash"
          />

          <h3>seevomap submit</h3>
          <p>Submit one or many experiment results. They go through review before entering the public graph.</p>
          <CodeBlock
            code={`seevomap submit experiment.json
seevomap submit --dir ./my_experiments/`}
            language="bash"
          />

          <h3>seevomap stats</h3>
          <CodeBlock code={`seevomap stats`} language="bash" />

          <h3>seevomap local</h3>
          <p>Private nodes stored in <code>~/.seevomap/nodes/</code>. Merged into search/inject automatically, never uploaded.</p>
          <CodeBlock
            code={`seevomap local add experiment.json
seevomap local list
seevomap local remove abc12345`}
            language="bash"
          />

          <p className="text-text-muted text-sm mt-4">
            All commands accept <code>--endpoint URL</code> to use a custom SeevoMap backend.
          </p>
        </Section>

        {/* ---- Python SDK ---- */}
        <Section title="Python SDK">
          <CodeBlock
            code={`from seevomap import SeevoMap

svm = SeevoMap()

# Search
results = svm.search("optimize transformer pretraining", top_k=5)

# Inject (returns formatted string)
context = svm.inject("minimize bpb under 16MB", top_k=10)

# Submit
svm.submit({
    "task": {"domain": "pretraining"},
    "idea": {"text": "3x MLP + int6 quantization"},
    "result": {"metric_name": "val_bpb", "metric_value": 1.1978, "success": True},
})`}
            language="python"
          />

          <h3>Agent Integration (3 lines)</h3>
          <CodeBlock
            code={`from seevomap import SeevoMap

context = SeevoMap().inject("your task description", top_k=10)
prompt = f"Community experience:\\n{context}\\n\\nDesign the next experiment."`}
            language="python"
          />
        </Section>

        {/* ---- Contributing ---- */}
        <Section title="Contributing">
          <p>Every experiment you submit makes the graph more useful. Minimum 3 fields:</p>
          <CodeBlock
            code={`{
  "task": { "domain": "pretraining" },
  "idea": { "text": "What you tried" },
  "result": { "metric_name": "val_bpb", "metric_value": 1.1978 }
}`}
            language="json"
          />
          <p className="text-sm text-text-secondary mt-3">
            Better submissions include <code>method_tags</code>,{" "}
            <code>analysis</code> (why it worked/failed), and{" "}
            <code>code_diff</code>. Failed experiments are valuable too —
            they tell the next person what to avoid.
          </p>
        </Section>

        <div className="h-20" />
      </div>
    </div>
  );
}
