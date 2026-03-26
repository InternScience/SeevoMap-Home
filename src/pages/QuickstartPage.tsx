import { Link } from "react-router-dom";
import CodeBlock from "../components/CodeBlock";
import DocsShell from "../components/DocsShell";
import PromptGuidanceCards from "../components/PromptGuidanceCards";
import {
  AUTORESEARCH_HANDLES,
  USER_REQUEST_FIELDS,
} from "../utils/promptGuidance";

interface QuickstartStep {
  step: string;
  title: string;
  desc: string;
  code: string;
  language: string;
  showPromptGuidance?: boolean;
}

const CLAUDE_QUICKSTART_STEPS: QuickstartStep[] = [
  {
    step: "Step 1",
    title: "Install the Claude Code skill",
    desc: "This is the default first path. Install SeevoMap once, then let Claude Code treat community context as part of its normal loop.",
    code: ["pip install seevomap", "seevomap setup claude-code"].join("\n"),
    language: "bash",
  },
  {
    step: "Step 2",
    title: "Open your experiment repo in Claude Code",
    desc: "Run Claude Code from the repo that owns the training script, eval command, and experiment history.",
    code: ["cd ~/autoresearch", "claude"].join("\n"),
    language: "bash",
  },
  {
    step: "Step 3",
    title: "Ask it like this",
    desc: "Keep the request about your task. The installed skill should decide when to load SeevoMap context, synthesize several related runs, narrow the loop to one change, and judge the result.",
    code: [
      "/loop Help me improve OpenAI Parameter Golf in this repo.",
      "",
      "Use the FineWeb setup here, with the local dataset shards and tokenizer already downloaded.",
      "Keep the final artifact under 16MB.",
      "The goal is to improve val_bpb.",
      "Keep code changes inside the parameter-golf folder.",
    ].join("\n"),
    language: "text",
    showPromptGuidance: true,
  },
];

export default function QuickstartPage() {
  return (
    <DocsShell
      eyebrow="Docs / Quickstart"
      title="Quickstart"
      summary="Start with Claude Code. This is the shortest integrated path for running community-guided autoresearch with SeevoMap."
    >
      <section className="surface-card section-tone-sage rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Default Path: Claude Code
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-3xl">
          Quickstart should not try to explain every environment. It should give
          the fastest path that works well today. For SeevoMap, that default
          path is Claude Code with the installed skill.
        </p>
        <div className="space-y-4">
          {CLAUDE_QUICKSTART_STEPS.map((step) => (
            <div
              key={step.step}
              className="surface-card-deep rounded-2xl p-5"
            >
              <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-2">
                {step.step}
              </p>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-3xl">
                {step.desc}
              </p>
              <CodeBlock code={step.code} language={step.language} />
              {step.showPromptGuidance ? (
                <PromptGuidanceCards
                  intro="Replace only the task-specific fields on the left, including which local assets are already prepared and which folder the agent should stay inside. The installed SeevoMap skill should handle the loop mechanics on the right."
                  userItems={USER_REQUEST_FIELDS}
                  handledItems={AUTORESEARCH_HANDLES}
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/docs/integration"
          className="surface-link-card section-tone-sky rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Codex and Cursor
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            If you are not using Claude Code, open Autoresearch and choose your
            environment there.
          </p>
        </Link>
        <Link
          to="/docs/examples"
          className="surface-link-card section-tone-clay rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Examples
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Open the two public examples if you want complete cases rather than
            the shortest setup path.
          </p>
        </Link>
        <Link
          to="/docs/reference"
          className="surface-link-card section-tone-stone rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            CLI / SDK Reference
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Use Reference only when you need exact commands, flags, or manual
            fallback syntax.
          </p>
        </Link>
      </section>
    </DocsShell>
  );
}
