import CodeBlock from "../components/CodeBlock";
import DocsShell from "../components/DocsShell";

const LOOP_STEPS = [
  {
    title: "Describe the task",
    desc: "State the optimization target in plain language, not just a benchmark name.",
  },
  {
    title: "Inject context",
    desc: "Use SeevoMap to pull related execution records and format them for the next prompt.",
  },
  {
    title: "Run the loop",
    desc: "Your agent or framework proposes one change, runs the experiment, and records the metric.",
  },
  {
    title: "Feed the result back",
    desc: "Package the outcome as a node so the next iteration sees both wins and failures.",
  },
];

const EXPECTATIONS = [
  "The agent sees real prior runs before changing code.",
  "The loop stays disciplined: one change, one measurement, one lesson.",
  "The best result becomes part of the community graph instead of staying local only.",
];

const CLAUDE_WORKFLOW_SNIPPET = [
  "cd your-project",
  'seevomap inject "describe your optimization target here" --top-k 10 > context.txt',
  "claude",
  "",
  "# Prompt:",
  "Read context.txt and the current codebase.",
  "Use the community context to propose one low-risk experiment change only.",
  "Run the evaluation command, report the metric, and explain whether the change should be kept.",
].join("\n");

const MANUAL_LOOP_SNIPPET = [
  'seevomap search "training stability for compact language model" --top-k 5',
  'seevomap inject "improve training stability for compact language model" --top-k 10 > context.txt',
  "",
  "# Read context.txt, make one code or config change, then rerun the same eval command.",
  "# Compare the metric and keep a short analysis note for submission.",
].join("\n");

const WECO_INTEGRATION_SNIPPET = [
  "weco run \\",
  "  --source module.py \\",
  '  --eval-command "python evaluate.py --path module.py" \\',
  "  --metric speedup \\",
  "  --goal maximize \\",
  `  --additional-instructions "$(seevomap inject 'make the forward pass faster while preserving correctness')"`,
].join("\n");

const PYTHON_LOOP_SNIPPET = [
  "from seevomap import SeevoMap",
  "",
  "svm = SeevoMap()",
  'task = "minimize val_bpb under a 16MB artifact budget"',
  "community_context = svm.inject(task, top_k=10)",
  "",
  'prompt = f"""',
  "Task:",
  "{task}",
  "",
  "Relevant community experience:",
  "{community_context}",
  '"""',
  "",
  "# Feed prompt into your planner / coder / evaluator loop.",
].join("\n");

export default function AutoresearchPage() {
  return (
    <DocsShell
      eyebrow="Docs / Autoresearch"
      title="Autoresearch Integration"
      summary="SeevoMap is not just a pip package. It is a memory and context layer for autoresearch systems: agent IDEs, manual experiment loops, and framework-level optimizers."
    >
      <section className="rounded-3xl border border-border-subtle bg-bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Where SeevoMap fits in the loop
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {LOOP_STEPS.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/8 bg-black/10 px-4 py-4"
            >
              <h3 className="text-text-primary font-semibold mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
        <CodeBlock
          code={`task description
  -> seevomap inject
  -> agent / planner
  -> experiment run
  -> metric + analysis
  -> seevomap submit`}
          language="text"
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Prerequisites
          </h2>
          <ul className="text-sm text-text-secondary leading-relaxed space-y-2 list-disc pl-5">
            <li><code>seevomap</code> installed locally.</li>
            <li>Your target repo cloned and runnable.</li>
            <li>One agent or loop environment ready to consume prompt context.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            What to expect
          </h2>
          <ul className="text-sm text-text-secondary leading-relaxed space-y-2 list-disc pl-5">
            {EXPECTATIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-border-subtle bg-bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Workflow 1: Claude Code
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          This is the cleanest path when you want an agent IDE to read context,
          touch code, run one experiment, and report the result.
        </p>
        <CodeBlock code={CLAUDE_WORKFLOW_SNIPPET} language="bash" />
      </section>

      <section className="rounded-3xl border border-border-subtle bg-bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Workflow 2: CLI / Manual Loop
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          Use this when you are running experiments directly from the terminal
          and want SeevoMap as a planning aid rather than an IDE integration.
        </p>
        <CodeBlock code={MANUAL_LOOP_SNIPPET} language="bash" />
      </section>

      <section className="rounded-3xl border border-border-subtle bg-bg-card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Workflow 3: Framework Integration
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-5">
          This is the path that matters most for autoresearch systems. SeevoMap
          becomes one more operator in the loop: fetch memory before proposing
          the next change.
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Weco-style CLI integration
            </h3>
            <CodeBlock code={WECO_INTEGRATION_SNIPPET} language="bash" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Python loop runner integration
            </h3>
            <CodeBlock code={PYTHON_LOOP_SNIPPET} language="python" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Planner / evaluator pipeline
            </h3>
            <CodeBlock
              code={`plan_task -> seevomap.inject(task) -> propose_change -> run_eval -> analyze_result -> seevomap.submit(result)`}
              language="text"
            />
          </div>
        </div>
      </section>
    </DocsShell>
  );
}
