import CodeBlock from "../components/CodeBlock";

export default function GuidePage() {
  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 prose-dark">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="animate-fade-in text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Guide
          </h1>
          <p className="animate-slide-up delay-100 text-text-secondary">
            Everything you need to get started with SeevoMap
          </p>
        </div>

        {/* Quick Start */}
        <section className="animate-slide-up delay-200">
          <h2>Quick Start</h2>
          <p>
            Install the SeevoMap CLI and run your first search in under a minute.
          </p>
          <CodeBlock
            code={`# Install from PyPI
pip install seevomap

# Search for relevant experiences
seevomap search "improve code generation accuracy"

# Get details on a specific node
seevomap detail node_abc123`}
            language="bash"
          />
        </section>

        {/* CLI Reference */}
        <section className="animate-slide-up delay-300">
          <h2>CLI Reference</h2>

          <h3>seevomap search</h3>
          <p>
            Semantic search across all execution records in the knowledge graph.
            Returns the top-K most relevant records ranked by similarity.
          </p>
          <CodeBlock
            code={`seevomap search "your query here" --top-k 10 --domain pretraining

# Options:
#   --top-k     Number of results (default: 10)
#   --domain    Filter by domain (pretraining, posttraining, compression, etc.)
#   --format    Output format: table, json, prompt (default: table)
#   --output    Save results to file`}
            language="bash"
          />

          <h3>seevomap detail</h3>
          <p>
            Retrieve full details for a specific execution record, including
            code diffs, analysis, and neighboring nodes.
          </p>
          <CodeBlock
            code={`seevomap detail <node_id>

# Options:
#   --format    Output format: json, markdown (default: markdown)
#   --include   Include sections: idea,metric,diff,analysis,neighbors (default: all)`}
            language="bash"
          />

          <h3>seevomap submit</h3>
          <p>
            Submit a new execution record to the community knowledge graph.
            Records are reviewed before being added to the main graph.
          </p>
          <CodeBlock
            code={`seevomap submit \\
  --idea "Brief description of the experiment" \\
  --domain pretraining \\
  --metric-name accuracy \\
  --metric-value 0.847 \\
  --diff ./changes.patch \\
  --analysis "What we learned from this experiment"`}
            language="bash"
          />

          <h3>seevomap inject</h3>
          <p>
            Generate a context prompt from search results that you can feed into
            your AI coding agent.
          </p>
          <CodeBlock
            code={`# Generate prompt for agent injection
seevomap search "improve training stability" --format prompt | pbcopy

# Or pipe directly into your agent
seevomap inject "improve training stability" --agent openai`}
            language="bash"
          />
        </section>

        {/* Python SDK */}
        <section className="animate-slide-up delay-400">
          <h2>Python SDK</h2>
          <p>
            Use SeevoMap programmatically in your Python scripts and notebooks.
          </p>
          <CodeBlock
            code={`from seevomap import SeevoMap

# Initialize client
sm = SeevoMap()

# Search for relevant experiences
results = sm.search("improve code generation accuracy", top_k=5)
for r in results:
    print(f"[{r.domain}] {r.idea} — {r.metric_name}: {r.metric_value:.4f}")

# Get full details
detail = sm.get_detail("node_abc123")
print(detail.analysis)
print(detail.code_diff)

# Generate injection prompt
prompt = sm.inject_prompt("improve training stability")
print(prompt)  # Ready to paste into your agent`}
            language="python"
          />

          <h3>Async Support</h3>
          <CodeBlock
            code={`import asyncio
from seevomap import AsyncSeevoMap

async def main():
    sm = AsyncSeevoMap()
    results = await sm.search("reduce inference latency", top_k=10)
    for r in results:
        print(r.idea)

asyncio.run(main())`}
            language="python"
          />
        </section>

        {/* Contributing */}
        <section className="animate-slide-up delay-500">
          <h2>Contributing</h2>
          <p>
            SeevoMap is community-driven. Every submitted execution record makes
            the knowledge graph more valuable for everyone.
          </p>

          <h3>What makes a good submission?</h3>
          <ul>
            <li><strong>Clear idea description</strong> — What hypothesis were you testing?</li>
            <li><strong>Quantitative metric</strong> — What did you measure, and what was the result?</li>
            <li><strong>Code diff</strong> — What code changes did you make?</li>
            <li><strong>Analysis</strong> — What did you learn? Would you recommend this approach?</li>
          </ul>

          <h3>Submission workflow</h3>
          <ol>
            <li>Run your experiment and collect results</li>
            <li>Submit via <code>seevomap submit</code> or the Python SDK</li>
            <li>Your submission enters a review queue</li>
            <li>Once approved, it becomes part of the public knowledge graph</li>
          </ol>
        </section>

        {/* Local Mode */}
        <section className="animate-slide-up delay-600">
          <h2>Local Mode</h2>
          <p>
            Want to keep your execution records private? SeevoMap supports a
            local-only mode where all data stays on your machine.
          </p>
          <CodeBlock
            code={`# Initialize a local graph
seevomap init --local

# Submit to your local graph only
seevomap submit --local \\
  --idea "Private experiment" \\
  --metric-name loss \\
  --metric-value 0.023

# Search your local records
seevomap search "private experiment" --local

# Combine local + community results
seevomap search "training stability" --include-local`}
            language="bash"
          />
          <p>
            Local records are stored in <code>~/.seevomap/local.db</code> and never
            leave your machine unless you explicitly publish them.
          </p>
        </section>

        {/* Footer spacing */}
        <div className="h-20" />
      </div>
    </div>
  );
}
