import CodeBlock from "../components/CodeBlock";
import DocsShell from "../components/DocsShell";

const METRICS = [
  { label: "Featured Run", value: "c002_3xmlp_int6", toneClass: "section-tone-sage" },
  { label: "Score", value: "1.19781683 val_bpb", toneClass: "section-tone-sky" },
  { label: "Artifact", value: "15,646,370 bytes", toneClass: "section-tone-clay" },
  { label: "Techniques", value: "3x MLP + mixed int6", toneClass: "section-tone-stone" },
];

export default function ParameterGolfPage() {
  return (
    <DocsShell
      eyebrow="Docs / Example"
      title="Example: Parameter Golf"
      summary="A concrete example of SeevoMap inside an autoresearch loop: baseline, inject community context, apply one low-risk change, rerun, compare, and submit."
    >
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((item) => (
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

      <section className="surface-card section-tone-sage rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          1. Start from the upstream baseline
        </h2>
        <CodeBlock
          code={`cd parameter-golf
python3 data/cached_challenge_fineweb.py --variant sp1024 --train-shards 1

RUN_ID=baseline_sp1024 \\
DATA_PATH=./data/datasets/fineweb10B_sp1024/ \\
TOKENIZER_PATH=./data/tokenizers/fineweb_1024_bpe.model \\
VOCAB_SIZE=1024 \\
torchrun --standalone --nproc_per_node=1 train_gpt.py`}
          language="bash"
        />
      </section>

      <section className="surface-card section-tone-sky rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          2. Pull community context
        </h2>
        <CodeBlock
          code={`seevomap search "OpenAI Parameter Golf 16MB artifact val_bpb" --top-k 5

seevomap inject "OpenAI Parameter Golf: minimize val_bpb under a 16MB artifact and 10 minute training budget" --top-k 12 > pgolf_context.md`}
          language="bash"
        />
        <p className="text-sm text-text-secondary mt-4 leading-relaxed">
          The current public reference for this example is the compliant
          community run <code>c002</code>. The point is not that SeevoMap has
          solved the competition. The point is that it gives your next loop a
          stronger starting point than the naive baseline.
        </p>
      </section>

      <section className="surface-card section-tone-clay rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          3. Choose a workflow
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Claude Code
            </h3>
            <CodeBlock
              code={`claude

# Prompt:
Read train_gpt.py and pgolf_context.md.
You are working on OpenAI's Parameter Golf challenge.
Goal: reduce val_bpb while keeping the artifact under 16MB.
Start from the current baseline, propose one low-risk change only, edit the code, run the training command, and report val_bpb plus artifact size.`}
              language="text"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">
              Manual loop
            </h3>
            <CodeBlock
              code={`sed -n '1,200p' pgolf_context.md

# Make one change in train_gpt.py, rerun the same baseline command,
# and compare the final val_bpb against 1.19781683.`}
              language="bash"
            />
          </div>
        </div>
      </section>

      <section className="surface-card section-tone-stone rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          4. Submit the result back
        </h2>
        <CodeBlock
          code={`{
  "task": {
    "domain": "pretraining",
    "description": "OpenAI Parameter Golf"
  },
  "idea": {
    "text": "3x MLP + mixed int6 quantization for 16MB artifact",
    "method_tags": ["architecture", "quantization", "compression"]
  },
  "result": {
    "metric_name": "val_bpb",
    "metric_value": 1.1978,
    "success": true
  }
}`}
          language="json"
        />
      </section>
    </DocsShell>
  );
}
