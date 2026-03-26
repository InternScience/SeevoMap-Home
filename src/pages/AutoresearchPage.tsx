import { useState } from "react";
import CodeBlock from "../components/CodeBlock";
import DocsShell from "../components/DocsShell";
import PromptGuidanceCards from "../components/PromptGuidanceCards";
import {
  AUTORESEARCH_HANDLES,
  USER_REQUEST_FIELDS,
  type GuidanceItem,
} from "../utils/promptGuidance";

type WorkflowKey = "claude" | "codex" | "cursor";

interface WorkflowStep {
  step: string;
  title: string;
  desc: string;
  code: string;
  language: string;
  showPromptGuidance?: boolean;
  handledTitle?: string;
  guidanceIntro?: string;
}

const INTEGRATION_REQUEST_SUMMARY: GuidanceItem[] = [
  {
    label: "Task + metric",
    detail:
      "Say what you want to improve and which metric decides whether the run was better or worse.",
  },
  {
    label: "Dataset + local assets",
    detail:
      "Say which setup to use and what is already prepared locally, such as shards, tokenizers, checkpoints, or caches.",
  },
  {
    label: "Constraint",
    detail:
      "State the hard limit up front, such as model size, latency, wall-clock time, or budget.",
  },
  {
    label: "Folder boundary",
    detail:
      "Tell the agent which folder or subdirectory it should stay inside, instead of leaving the edit scope ambiguous.",
  },
];

const INTEGRATION_SYSTEM_SUMMARY: GuidanceItem[] = [
  {
    label: "Multi-run retrieval",
    detail:
      "Pull several similar SeevoMap runs, not just one example, before making a recommendation.",
  },
  {
    label: "Synthesis",
    detail:
      "Compare shared wins, disagreements, and failure patterns before deciding the next step.",
  },
  {
    label: "One-change loop",
    detail:
      "Keep each iteration to one cautious code or config change so the eval result stays interpretable.",
  },
  {
    label: "Evaluation + decision",
    detail:
      "Use the repo's normal eval path and end with a keep-or-discard recommendation tied to the metric.",
  },
];

const WORKFLOW_OPTIONS: Array<{
  id: WorkflowKey;
  label: string;
  summary: string;
}> = [
  {
    id: "claude",
    label: "Claude Code",
    summary:
      "Default first path. Install the skill and run the loop directly inside Claude Code.",
  },
  {
    id: "codex",
    label: "Codex",
    summary:
      "Native setup path for Codex if this is already your main coding environment.",
  },
  {
    id: "cursor",
    label: "Cursor",
    summary:
      "Rules-first integration. Keep the primary user experience short and reserve CLI for fallback.",
  },
];

const FILLED_TASK_REQUEST_LINES = [
  "Help me improve OpenAI Parameter Golf in this repo.",
  "",
  "Use the FineWeb setup here, with the local dataset shards and tokenizer already downloaded.",
  "Keep the final artifact under 16MB.",
  "The goal is to improve val_bpb.",
  "Keep code changes inside the parameter-golf folder.",
];

const CLAUDE_STEPS: WorkflowStep[] = [
  {
    step: "Step 1",
    title: "Install the skill",
    desc: "Use the native SeevoMap setup path for Claude Code so the agent can treat SeevoMap as part of its default workflow.",
    code: ["pip install seevomap", "seevomap setup claude-code"].join("\n"),
    language: "bash",
  },
  {
    step: "Step 2",
    title: "Open your experiment repo",
    desc: "Start Claude Code inside the repo where your training loop, logs, and history already live.",
    code: ["cd ~/autoresearch", "claude"].join("\n"),
    language: "bash",
  },
  {
    step: "Step 3",
    title: "Ask it like this",
    desc: "Keep the request focused on your task. The installed skill should fetch community context, synthesize several related runs, and manage the loop logic in the background.",
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
    handledTitle: "What The Skill Handles",
    guidanceIntro:
      "Use the filled request as a model for your own task description. Tell the agent which local assets are ready and which folder to stay inside; let the SeevoMap skill handle the loop mechanics behind it.",
  },
];

const CODEX_STEPS: WorkflowStep[] = [
  {
    step: "Step 1",
    title: "Install the skill",
    desc: "SeevoMap already supports a native Codex setup path, so Codex can discover the workflow guidance directly.",
    code: ["pip install seevomap", "seevomap setup codex"].join("\n"),
    language: "bash",
  },
  {
    step: "Step 2",
    title: "Open Codex in your repo",
    desc: "Launch Codex from the repo that owns the experiment loop and evaluation command.",
    code: ["cd ~/autoresearch", "codex"].join("\n"),
    language: "bash",
  },
  {
    step: "Step 3",
    title: "Ask it like this",
    desc: "Use a filled example instead of an abstract template. The installed Codex skill should load SeevoMap context, synthesize several related runs, and keep the iteration disciplined.",
    code: FILLED_TASK_REQUEST_LINES.join("\n"),
    language: "text",
    showPromptGuidance: true,
    handledTitle: "What The Skill Handles",
    guidanceIntro:
      "Keep the request about the task, not about internal loop steps. Tell Codex which local assets are ready and which folder it should edit; let the skill take care of the generic SeevoMap workflow.",
  },
];

const CURSOR_TRIGGER = FILLED_TASK_REQUEST_LINES.join("\n");

const CURSOR_STEPS: WorkflowStep[] = [
  {
    step: "Step 1",
    title: "Encode the contract in project instructions",
    desc: "Cursor's official model is Rules plus tool integrations, not a SeevoMap-specific setup command. Put the generic loop behavior into repo rules so the user can keep requests short.",
    code: [
      "# SeevoMap Workflow",
      "",
      "- Before proposing a change, pull several similar experiments from SeevoMap.",
      "- Synthesize the strongest shared signals, disagreements, and failure patterns.",
      "- Keep each loop to one small change only.",
      "- Keep code changes inside the user-specified folder or subdirectory.",
      "- Use the repo's normal evaluation command to judge the result.",
      "- Finish with the updated metric and a keep-or-discard decision.",
    ].join("\n"),
    language: "markdown",
  },
  {
    step: "Step 2",
    title: "Ask it like this",
    desc: "Once the rule is installed, keep the user request short and task-focused. Cursor Agent should read the rule, synthesize several related runs, and handle the generic SeevoMap loop behind the scenes.",
    code: CURSOR_TRIGGER,
    language: "text",
    showPromptGuidance: true,
    handledTitle: "What The Rules Handle",
    guidanceIntro:
      "Cursor should work the same way: you describe the task, including local assets and the folder boundary, while the project rule carries the SeevoMap workflow.",
  },
];

const CURSOR_FALLBACK_COMMAND =
  'seevomap inject "OpenAI Parameter Golf: minimize val_bpb under a 16MB artifact and 10 minute training budget" --top-k 12 > pgolf_context.md';

function WorkflowStepCards({ steps }: { steps: WorkflowStep[] }) {
  const toneClasses = [
    "section-tone-sage",
    "section-tone-sky",
    "section-tone-clay",
    "section-tone-stone",
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div
          key={`${step.step}-${step.title}`}
          className={`surface-card-deep rounded-2xl p-5 ${toneClasses[index % toneClasses.length]}`}
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
              intro={step.guidanceIntro}
              userItems={USER_REQUEST_FIELDS}
              handledItems={AUTORESEARCH_HANDLES}
              handledTitle={step.handledTitle}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function AutoresearchPage() {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowKey>("claude");

  return (
    <DocsShell
      eyebrow="Docs / Autoresearch"
      title="Autoresearch Integration"
      summary="Choose the environment you actually use. This page explains how SeevoMap becomes a default part of each autoresearch iteration in Claude Code, Codex, or Cursor."
    >
      <section className="surface-card section-tone-stone rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Integration Contract
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-5 max-w-3xl">
          Keep this section short. The user should describe the task, local
          setup, and edit boundary; the environment should handle multi-run
          retrieval, synthesis, and the loop mechanics in the background.
        </p>
        <PromptGuidanceCards
          eyebrow="At A Glance"
          intro="This is the whole contract. The page should not make the user read an internal process diagram before they can pick an environment."
          userItems={INTEGRATION_REQUEST_SUMMARY}
          handledItems={INTEGRATION_SYSTEM_SUMMARY}
          handledTitle="What The Environment Handles"
        />
      </section>

      <section className="surface-card section-tone-clay rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Choose Your Environment
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-5 max-w-3xl">
          Start with Claude Code unless you already have a strong reason to use
          another environment.
        </p>
        <div className="flex flex-wrap gap-3 mb-6">
          {WORKFLOW_OPTIONS.map((option) => {
            const isActive = option.id === activeWorkflow;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveWorkflow(option.id)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "surface-pill-active text-emerald-primary"
                    : "surface-pill text-text-secondary hover:text-text-primary"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="surface-card-deep rounded-2xl p-5">
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {
              WORKFLOW_OPTIONS.find((option) => option.id === activeWorkflow)
                ?.label
            }
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-5 max-w-3xl">
            {
              WORKFLOW_OPTIONS.find((option) => option.id === activeWorkflow)
                ?.summary
            }
          </p>

          {activeWorkflow === "claude" && <WorkflowStepCards steps={CLAUDE_STEPS} />}
          {activeWorkflow === "codex" && <WorkflowStepCards steps={CODEX_STEPS} />}
          {activeWorkflow === "cursor" && (
            <div className="space-y-6">
              <WorkflowStepCards steps={CURSOR_STEPS} />
              <div className="surface-card section-tone-sky rounded-2xl p-5">
                <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-2">
                  Optional Fallback
                </p>
                <h4 className="text-lg font-semibold text-text-primary mb-2">
                  Pre-generate a context file only when automation is unavailable
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-3xl">
                  If your Cursor setup cannot call the CLI by itself, generate a
                  prompt-ready file from the terminal and point Cursor Agent at
                  that file. This is the backup path, not the default story.
                </p>
                <CodeBlock code={CURSOR_FALLBACK_COMMAND} language="bash" />
              </div>
            </div>
          )}
        </div>
      </section>
    </DocsShell>
  );
}
