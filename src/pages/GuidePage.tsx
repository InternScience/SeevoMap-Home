import CodeBlock from "../components/CodeBlock";

export default function GuidePage() {
  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose-dark">
        <div className="text-center mb-12">
          <h1 className="animate-fade-in text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Guide
          </h1>
          <p className="animate-slide-up delay-100 text-text-secondary">
            Use the current SeevoMap CLI and SDK without guessing the API.
          </p>
        </div>

        <section className="animate-slide-up delay-200">
          <h2>Quick Start</h2>
          <p>
            Install the package, search the graph, then inject formatted context
            into your next agent run.
          </p>
          <CodeBlock
            code={`# Install from PyPI
pip install seevomap

# Search execution-grounded experience
seevomap search "optimize transformer pretraining" --top-k 5

# Generate prompt-ready context
seevomap inject "minimize bpb for compact language model" --top-k 10 > context.txt

# Inspect one node
seevomap get node a30044c5

# Check endpoint reachability + local node count
seevomap stats`}
            language="bash"
          />
        </section>

        <section className="animate-slide-up delay-300">
          <h2>CLI Reference</h2>

          <h3>seevomap search</h3>
          <p>
            Search public graph results plus your own private local nodes,
            merged and ranked by score.
          </p>
          <CodeBlock
            code={`seevomap search "your query here" --top-k 10

# Global option:
#   --endpoint  Custom SeevoMap Space URL`}
            language="bash"
          />

          <h3>seevomap inject</h3>
          <p>
            Format the top search hits as prompt-ready context for an LLM agent
            or evolutionary search loop.
          </p>
          <CodeBlock
            code={`seevomap inject "improve training stability for small language models" --top-k 12 > context.txt

# Then pass the file into your prompt or loop runner`}
            language="bash"
          />

          <h3>seevomap get</h3>
          <p>
            Inspect a specific node or download the latest map artifact.
          </p>
          <CodeBlock
            code={`seevomap get node a30044c5
seevomap get map -o map.json`}
            language="bash"
          />

          <h3>seevomap submit</h3>
          <p>
            Submit one JSON node or batch submit a directory of nodes. Public
            submissions go through review before entering the shared graph.
          </p>
          <CodeBlock
            code={`seevomap submit experiment.json
seevomap submit --dir ./trajectory_nodes/`}
            language="bash"
          />

          <h3>seevomap local</h3>
          <p>
            Keep private nodes on your own machine. They are searched alongside
            public results but never uploaded unless you explicitly submit them.
          </p>
          <CodeBlock
            code={`seevomap local add experiment.json
seevomap local list
seevomap search "training stability" --top-k 10
seevomap local remove abc12345`}
            language="bash"
          />
        </section>

        <section className="animate-slide-up delay-400">
          <h2>Python SDK</h2>
          <p>
            Use SeevoMap programmatically in Python scripts, notebooks, or loop
            runners.
          </p>
          <CodeBlock
            code={`from seevomap import SeevoMap

svm = SeevoMap()

# Search
results = svm.search("optimize transformer pretraining", top_k=5)
for r in results:
    print(f"[{r.get('source')}] score={r.get('score')} {r.get('domain')}")

# Inject prompt-ready context
context = svm.inject("minimize bits-per-byte under 16MB", top_k=10)
print(context)

# Inspect a node and endpoint stats
node = svm.get_node("a30044c5")
stats = svm.stats()
print(node.get("idea", {}).get("text", ""))
print(stats)

# Submit a result
svm.submit({
    "task": {"domain": "pretraining", "description": "Parameter Golf"},
    "idea": {"text": "Sliding window eval for bpb measurement"},
    "result": {"metric_name": "val_bpb", "metric_value": 1.1978, "success": True},
})`}
            language="python"
          />

          <h3>Agent Integration</h3>
          <CodeBlock
            code={`from seevomap import SeevoMap

svm = SeevoMap()
task = "optimize transformer pretraining for a compact language model"
community_context = svm.inject(task, top_k=10)

prompt = f"""
You are designing the next experiment.

Task:
{task}

Relevant community experience:
{community_context}
"""

print(prompt)`}
            language="python"
          />
        </section>

        <section className="animate-slide-up delay-500">
          <h2>Contributing</h2>
          <p>
            SeevoMap is community-driven. Every submitted execution record makes
            the graph more useful for the next researcher.
          </p>

          <h3>Minimum JSON schema</h3>
          <CodeBlock
            code={`{
  "task": {
    "domain": "pretraining",
    "description": "Compact language model optimization"
  },
  "idea": {
    "text": "Sliding window evaluation with stride=64"
  },
  "result": {
    "metric_name": "val_bpb",
    "metric_value": 1.1978,
    "success": true
  }
}`}
            language="json"
          />
          <p>
            Better submissions also include method tags, context, and analysis
            so others can judge whether a technique is transferable or a pitfall.
          </p>
        </section>

        <section className="animate-slide-up delay-600">
          <h2>Local Mode</h2>
          <p>
            Local nodes live in <code>~/.seevomap/nodes/</code>. Search and
            inject automatically merge them with public results, which is useful
            when you want private memory before publishing.
          </p>
          <CodeBlock
            code={`# Store a private node
seevomap local add experiment.json

# List what you have stored locally
seevomap local list

# Local nodes are merged into search/inject automatically
seevomap inject "training stability for small models" --top-k 8

# Remove one private node
seevomap local remove abc12345`}
            language="bash"
          />
        </section>

        <div className="h-20" />
      </div>
    </div>
  );
}
