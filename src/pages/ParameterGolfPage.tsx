import { useState } from "react";
import CodeBlock from "../components/CodeBlock";
import DocsShell from "../components/DocsShell";

type ExampleKey = "parameter-golf" | "math000";

const EXAMPLE_OPTIONS: Array<{
  id: ExampleKey;
  label: string;
  summary: string;
}> = [
  {
    id: "parameter-golf",
    label: "Parameter Golf",
    summary:
      "Competition-style metric optimization with concrete winning and failure records around val_bpb.",
  },
  {
    id: "math000",
    label: "Math_000",
    summary:
      "A scored benchmark-first case showing how SeevoMap helps drive a reproduction task toward a real official eval.",
  },
];

const PARAMETER_GOLF_METRICS = [
  {
    label: "Featured Run",
    value: "c005_sliding_window",
    toneClass: "section-tone-sage",
  },
  {
    label: "Best val_bpb",
    value: "1.17723334",
    toneClass: "section-tone-sky",
  },
  {
    label: "Artifact",
    value: "13,280,902 bytes",
    toneClass: "section-tone-clay",
  },
  {
    label: "Counterexample",
    value: "c003 at 3.56645742",
    toneClass: "section-tone-stone",
  },
];

const MATH000_METRICS = [
  {
    label: "Official Score",
    value: "32.75",
    toneClass: "section-tone-sage",
  },
  {
    label: "Pseudo-depth",
    value: "65",
    toneClass: "section-tone-sky",
  },
  {
    label: "DCM",
    value: "60",
    toneClass: "section-tone-clay",
  },
  {
    label: "Image",
    value: "20",
    toneClass: "section-tone-stone",
  },
];

const PARAMETER_GOLF_REQUEST = [
  "Help me improve OpenAI Parameter Golf in this repo.",
  "",
  "Use the FineWeb setup here, with the local dataset shards and tokenizer already downloaded.",
  "Keep the final artifact under 16MB.",
  "The goal is to improve val_bpb.",
  "Keep code changes inside the parameter-golf folder.",
].join("\n");

const MATH000_REQUEST = [
  "Help me run Math_000 in this repo and optimize for the official eval.",
  "",
  "Use the benchmark checklist and target figure.",
  "Keep the work reproducible and run the official scorer at the end.",
].join("\n");

function MetricGrid({
  items,
}: {
  items: Array<{ label: string; value: string; toneClass: string }>;
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`surface-card rounded-2xl px-5 py-5 ${item.toneClass}`}
        >
          <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-2">
            {item.label}
          </p>
          <p className="text-text-primary font-semibold">{item.value}</p>
        </div>
      ))}
    </section>
  );
}

function ExampleSelector({
  activeExample,
  onSelect,
}: {
  activeExample: ExampleKey;
  onSelect: (value: ExampleKey) => void;
}) {
  return (
    <section className="surface-card section-tone-clay rounded-3xl p-6 sm:p-8">
      <h2 className="text-2xl font-semibold text-text-primary mb-4">
        Choose An Example
      </h2>
      <p className="text-sm text-text-secondary leading-relaxed mb-5 max-w-3xl">
        These are public examples of the same core story: the user prompt stays
        short, while SeevoMap carries the heavier community analysis behind the
        scenes.
      </p>
      <div className="flex flex-wrap gap-3 mb-6">
        {EXAMPLE_OPTIONS.map((option) => {
          const isActive = option.id === activeExample;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
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
            EXAMPLE_OPTIONS.find((option) => option.id === activeExample)?.label
          }
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
          {
            EXAMPLE_OPTIONS.find((option) => option.id === activeExample)
              ?.summary
          }
        </p>
      </div>
    </section>
  );
}

function ParameterGolfExample() {
  return (
    <>
      <MetricGrid items={PARAMETER_GOLF_METRICS} />

      <section className="surface-card section-tone-sage rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          1. What the user types
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-3xl">
          Keep the request task-focused. The skill should retrieve the strongest
          community wins, failures, and evaluation-path tricks automatically.
        </p>
        <CodeBlock code={PARAMETER_GOLF_REQUEST} language="text" />
      </section>

      <section className="surface-card section-tone-sky rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          2. What the community layer contributed
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-3xl">
          This example is useful because the graph preserved both a strong run
          and a destructive run. That is exactly what an optimization loop needs
          when every change must be judged by one metric.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="surface-card-deep rounded-2xl p-5">
            <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-2">
              Adopt / Adapt
            </p>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              c005_sliding_window
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Stable recipe plus sliding-window evaluation, ending at
              <code> 1.17723334 val_bpb</code>.
            </p>
          </div>
          <div className="surface-card-deep rounded-2xl p-5">
            <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-2">
              Caution
            </p>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              c003_insight_opt
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Stacked several speculative knobs and collapsed to
              <code> 3.56645742 val_bpb</code>.
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card section-tone-clay rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          3. How to use it
        </h2>
        <CodeBlock
          code={`seevomap search "OpenAI Parameter Golf 16MB artifact val_bpb" --top-k 5

seevomap inject "OpenAI Parameter Golf: minimize val_bpb under a 16MB artifact and 10 minute training budget" --top-k 12 > pgolf_context.md`}
          language="bash"
        />
        <p className="text-sm text-text-secondary mt-4 leading-relaxed max-w-3xl">
          The community contribution here is empirical memory: which path
          improved the metric, which path failed badly, and which evaluation
          method changed the reported number in a meaningful way.
        </p>
      </section>
    </>
  );
}

function Math000Example() {
  return (
    <>
      <MetricGrid items={MATH000_METRICS} />

      <section className="surface-card section-tone-sage rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          1. What the user types
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-3xl">
          The user prompt stays short. The installed skill should read the
          rubric, extract the must-hit artifacts, and choose a disciplined plan
          before coding.
        </p>
        <CodeBlock code={MATH000_REQUEST} language="text" />
      </section>

      <section className="surface-card section-tone-sky rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          2. What the skill handled internally
        </h2>
        <CodeBlock
          code={`Community Idea Extraction

- read the benchmark rubric, checklist, target figure, and eval path
- split the task into mechanism questions, artifact questions, and execution blockers
- fan out multiple community queries instead of relying on one paper-name query
- build a Community Idea Slate
- choose the highest-weight artifact first and execute in slices`}
          language="text"
        />
        <p className="text-sm text-text-secondary mt-4 leading-relaxed max-w-3xl">
          In this benchmark, the biggest contribution from SeevoMap was not a
          direct SparseTrack answer. It was a rubric-first execution prior that
          kept the run moving toward a scorable artifact.
        </p>
      </section>

      <section className="surface-card section-tone-clay rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          3. What the score means
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4 max-w-3xl">
          This run finished with an official third-party score of
          <code> 32.75</code>. The strong part was the text coverage for
          pseudo-depth and DCM. The weak part was the image item, which missed
          the expected trend around <code>4-6</code> levels.
        </p>
        <div className="surface-card-deep rounded-2xl p-5">
          <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-2">
            Honest takeaway
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            This is a scored benchmark-first example, not a perfect scientific
            reproduction. It shows that SeevoMap can improve evaluator
            alignment, completion, and report quality, while still leaving a
            real gap on the figure-level scientific claim.
          </p>
        </div>
      </section>
    </>
  );
}

export default function ParameterGolfPage() {
  const [activeExample, setActiveExample] =
    useState<ExampleKey>("parameter-golf");

  return (
    <DocsShell
      eyebrow="Docs / Examples"
      title="Examples"
      summary="Two public examples of the same pattern: keep the user request short, let SeevoMap handle the community analysis internally, and use the result to drive a real optimization loop or benchmark run."
    >
      <ExampleSelector
        activeExample={activeExample}
        onSelect={setActiveExample}
      />

      {activeExample === "parameter-golf" ? (
        <ParameterGolfExample />
      ) : (
        <Math000Example />
      )}
    </DocsShell>
  );
}
