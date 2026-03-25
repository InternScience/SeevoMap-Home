import { Link } from "react-router-dom";
import StatsCounter from "../components/StatsCounter";
import CodeBlock from "../components/CodeBlock";

const FEATURES = [
  {
    title: "Explore the Graph",
    desc: "Navigate a living knowledge graph of 3,073 AI research execution records across pretraining, post-training, and compression domains.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    link: "/graph",
    linkText: "Open Graph Explorer",
  },
  {
    title: "Search Experiences",
    desc: "Find relevant execution records using semantic search. Discover what worked (and what didn't) before running your next experiment.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    link: "/search",
    linkText: "Search Records",
  },
  {
    title: "Integrate the Loop",
    desc: "Plug SeevoMap into Claude Code, manual experiment loops, or framework-level optimizers. Treat community execution data as memory for your next run.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    link: "/docs/integration",
    linkText: "Open Integration Docs",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Search Before You Build",
    desc: "Query the graph with your task description. SeevoMap finds semantically similar experiments from 3,000+ records.",
  },
  {
    num: "02",
    title: "Inject into Your Agent",
    desc: "Pipe community context into your AI agent's prompt. It sees what worked, what failed, and why.",
  },
  {
    num: "03",
    title: "Run Your Experiment",
    desc: "Your agent designs a better experiment informed by real execution data, not just paper abstracts.",
  },
  {
    num: "04",
    title: "Submit Results Back",
    desc: "Push your execution record to the graph. The next researcher starts from a higher baseline.",
  },
];

export default function HomePage() {
  return (
    <div className="pt-16">
      {/* ---- Hero ---------------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(6,182,212,0.06),transparent)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <h1 className="animate-fade-in text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-text-primary">S</span>
            <span className="brand-evo">eevo</span>
            <span className="text-text-primary">Map</span>
          </h1>

          <p className="animate-slide-up delay-100 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            A community knowledge graph of AI research execution records.
            Search, learn from, and inject prior experimental wisdom into your agent.
          </p>

          <div className="animate-slide-up delay-200 flex justify-center gap-12 sm:gap-16 mb-12">
            <StatsCounter value={3073} label="Execution Records" />
            <StatsCounter value={13} label="Research Domains" />
            <StatsCounter value={15365} label="Connections" />
          </div>

          <div className="animate-slide-up delay-300 max-w-md mx-auto mb-10">
            <CodeBlock code="pip install seevomap" language="bash" />
          </div>

          <div className="animate-slide-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/graph"
              className="px-6 py-3 bg-emerald-primary hover:bg-emerald-dark text-white font-medium rounded-xl transition-colors duration-200 text-sm"
            >
              Explore the Graph
            </Link>
            <Link
              to="/docs"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-text-primary border border-border-subtle rounded-xl transition-colors duration-200 text-sm"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Features ------------------------------------ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => (
            <Link
              key={feat.title}
              to={feat.link}
              className={`card-hover animate-slide-up delay-${(i + 1) * 100} bg-bg-card border border-border-subtle rounded-xl p-6 block`}
            >
              <div className="text-emerald-primary mb-4">{feat.icon}</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                {feat.desc}
              </p>
              <span className="text-sm text-cyan-primary font-medium">
                {feat.linkText} &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- How It Works -------------------------------- */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="animate-fade-in text-3xl font-bold text-text-primary text-center mb-4">
          How It Works
        </h2>
        <p className="animate-fade-in delay-100 text-text-secondary text-center max-w-xl mx-auto mb-16">
          Every node is a real experiment — idea, code diff, metrics, and analysis. Not paper abstracts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`animate-slide-up delay-${(i + 2) * 100} relative`}
            >
              <div className="text-5xl font-extrabold text-white/[0.03] mb-2 font-mono">
                {step.num}
              </div>
              <h4 className="text-base font-semibold text-text-primary mb-2">
                {step.title}
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Live Example: Parameter Golf ---------------- */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-3xl border border-border-subtle bg-bg-card/80 backdrop-blur-sm p-8 sm:p-10">
          <p className="text-cyan-primary text-sm font-semibold uppercase tracking-[0.18em] mb-3">
            Live Example
          </p>
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            Parameter Golf: 1.2259 &rarr; 1.1978 bpb
          </h2>
          <p className="text-text-secondary max-w-2xl leading-relaxed mb-8">
            We used SeevoMap to beat the baseline on OpenAI's Parameter Golf
            challenge. Here's what actually happened.
          </p>

          {/* Before / After metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Baseline", value: "1.2259 bpb" },
              { label: "With SeevoMap", value: "1.1978 bpb", highlight: true },
              { label: "Improvement", value: "-0.0281 bpb" },
              { label: "Model Size", value: "15.6 MB / 16 MB" },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border px-4 py-4 ${
                  item.highlight
                    ? "border-emerald-primary/30 bg-emerald-primary/5"
                    : "border-white/8 bg-black/10"
                }`}
              >
                <p className="text-text-muted text-xs uppercase tracking-[0.14em] mb-2">
                  {item.label}
                </p>
                <p className={`font-semibold ${item.highlight ? "text-emerald-primary" : "text-text-primary"}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Step 1: inject */}
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            Step 1: Pull community experience
          </h3>
          <CodeBlock
            code={`$ seevomap inject "minimize bpb for compact language model under 16MB" --top-k 5`}
            language="bash"
          />
          <div className="mt-3 mb-6 rounded-xl bg-black/20 border border-white/5 p-4 text-sm font-mono text-text-secondary overflow-x-auto">
            <pre className="whitespace-pre-wrap">{`## Community Experience from SeevoMap (BotResearchNet)

[1] [OK] model_compression | val_bpb=1.1574 | score=0.76
    Int6 MLP3x Sliding Window
    Techniques: int6 post-training, 3x MLP, FP16 embed, sliding window

[2] [OK] model_compression | val_bpb=1.1458 | score=0.75
    Int6 MLP3x + SmearGate + BigramHash + OrthoInit + SWA
    Techniques: int6 QAT, SmearGate, 3x MLP, U-Net skip

[3] [OK] model_compression | val_bpb=1.1586 | score=0.76
    10L Int6 QAT + Zstd MLP2.6x + Muon0.99
    Techniques: int6 STE QAT, zstd-22, Muon 0.99, grad clip 0.3

[4] [FAIL] model_compression | val_bpb=1.2244 | score=0.76
    Naive Baseline — no optimizations

[5] [OK] model_compression | val_bpb=1.1428 | score=0.74
    10L Int5-MLP + BigramHash(10240) + SWA + WD=0.04`}</pre>
          </div>

          {/* Step 2: what we learned */}
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            Step 2: Agent reads this and decides
          </h3>
          <div className="rounded-xl bg-black/20 border border-white/5 p-4 text-sm text-text-secondary mb-6">
            <p className="mb-2"><strong className="text-text-primary">Pattern found:</strong> All top results use <code className="text-cyan-primary">3x MLP expansion</code> + <code className="text-cyan-primary">int6 quantization</code>.</p>
            <p className="mb-2"><strong className="text-text-primary">Pitfall avoided:</strong> Result [4] shows naive baseline scores 1.2244. Community records confirm single-technique changes are safer than stacking 4+ changes at once.</p>
            <p><strong className="text-text-primary">Decision:</strong> Apply 3x MLP + int6 mixed quantization (int5 MLP, int6 attention, FP16 embeddings).</p>
          </div>

          {/* Step 3: result */}
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            Step 3: Train and measure
          </h3>
          <div className="rounded-xl bg-black/20 border border-white/5 p-4 text-sm font-mono text-text-secondary mb-6">
            <pre className="whitespace-pre-wrap">{`step:1000  val_bpb:1.3706  train_loss:2.3584
step:5000  val_bpb:1.2318  train_loss:2.0345
step:10000 val_bpb:1.2032  train_loss:1.9901
step:12923 val_bpb:1.1967  train_loss:1.9793  (wallclock stop)

final_int8_zlib_roundtrip val_bpb:1.1978  artifact:15,646,370 bytes  [COMPLIANT]`}</pre>
          </div>

          {/* Step 4: submit */}
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            Step 4: Submit back to the graph
          </h3>
          <CodeBlock
            code={`$ seevomap submit result.json
Submitted successfully. Node ID: c002_3xmlp  (pending review)`}
            language="bash"
          />
          <p className="text-text-secondary text-sm mt-4 leading-relaxed">
            The next researcher who searches for "parameter golf" will find this
            result and build on it. That's the flywheel.
          </p>

          <div className="mt-6 text-center">
            <Link
              to="/docs/parameter-golf"
              className="inline-flex items-center justify-center px-5 py-3 bg-white/5 hover:bg-white/10 text-text-primary border border-border-subtle rounded-xl transition-colors duration-200 text-sm"
            >
              Full Walkthrough &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Footer -------------------------------------- */}
      <footer className="border-t border-border-subtle py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-text-muted text-sm">
            SeevoMap &mdash; Open-source AI research knowledge graph.
            Built by the community, for the community.
          </p>
        </div>
      </footer>
    </div>
  );
}
