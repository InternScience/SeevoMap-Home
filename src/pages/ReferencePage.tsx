import CodeBlock from "../components/CodeBlock";
import DocsShell from "../components/DocsShell";

export default function ReferencePage() {
  return (
    <DocsShell
      eyebrow="Docs / Reference"
      title="CLI and SDK Reference"
      summary="Exact commands and method calls. This page is supporting documentation for the workflow pages, not the primary narrative of the product."
    >
      <section className="rounded-3xl border border-border-subtle bg-bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-5">
          CLI
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              seevomap search
            </h3>
            <CodeBlock
              code={`seevomap search "your query here" --top-k 10`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              seevomap inject
            </h3>
            <CodeBlock
              code={`seevomap inject "improve training stability for small language models" --top-k 12 > context.txt`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              seevomap get
            </h3>
            <CodeBlock
              code={`seevomap get node a30044c5
seevomap get map -o map.json`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              seevomap submit
            </h3>
            <CodeBlock
              code={`seevomap submit experiment.json
seevomap submit --dir ./trajectory_nodes/`}
              language="bash"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              seevomap local
            </h3>
            <CodeBlock
              code={`seevomap local add experiment.json
seevomap local list
seevomap local remove abc12345`}
              language="bash"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border-subtle bg-bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-5">
          Python SDK
        </h2>
        <CodeBlock
          code={`from seevomap import SeevoMap

svm = SeevoMap()

results = svm.search("optimize transformer pretraining", top_k=5)
context = svm.inject("minimize bits-per-byte under 16MB", top_k=10)
node = svm.get_node("a30044c5")
stats = svm.stats()

svm.submit({
    "task": {"domain": "pretraining", "description": "Parameter Golf"},
    "idea": {"text": "Sliding window eval for bpb measurement"},
    "result": {"metric_name": "val_bpb", "metric_value": 1.1978, "success": True},
})`}
          language="python"
        />
      </section>
    </DocsShell>
  );
}
