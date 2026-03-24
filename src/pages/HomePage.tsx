import { Link } from "react-router-dom";
import StatsCounter from "../components/StatsCounter";
import CodeBlock from "../components/CodeBlock";

const FEATURES = [
  {
    title: "Explore the Graph",
    desc: "Navigate a living knowledge graph of 3,000+ AI research execution records. See how ideas connect across pretraining, post-training, and compression domains.",
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
    title: "Use the CLI",
    desc: "Install the Python SDK and inject prior experiences directly into your AI agent's context. Turn community wisdom into better experiments.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    link: "/guide",
    linkText: "Read the Guide",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Run Experiment",
    desc: "Execute your AI research experiment and record the results, code diffs, and metrics.",
  },
  {
    num: "02",
    title: "Submit to SeevoMap",
    desc: "Push your execution record to the shared knowledge graph using the CLI or API.",
  },
  {
    num: "03",
    title: "Search Before You Build",
    desc: "Before starting a new experiment, search the graph for similar prior work and results.",
  },
  {
    num: "04",
    title: "Inject into Your Agent",
    desc: "Feed relevant experiences into your AI coding agent to improve experiment design.",
  },
];

export default function HomePage() {
  return (
    <div className="pt-16">
      {/* ──── Hero ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(6,182,212,0.06),transparent)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          {/* Title */}
          <h1 className="animate-fade-in text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-text-primary">S</span>
            <span className="brand-evo">eevo</span>
            <span className="text-text-primary">Map</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up delay-100 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            A community-driven knowledge graph of AI research execution records.
            Search, learn from, and inject prior experimental wisdom into your workflow.
          </p>

          {/* Stats */}
          <div className="animate-slide-up delay-200 flex justify-center gap-12 sm:gap-16 mb-12">
            <StatsCounter value={3073} label="Execution Records" />
            <StatsCounter value={13} label="Research Domains" />
            <StatsCounter value={15260} label="Connections" />
          </div>

          {/* Install command */}
          <div className="animate-slide-up delay-300 max-w-md mx-auto mb-10">
            <CodeBlock code="pip install seevomap" language="bash" />
          </div>

          {/* CTA buttons */}
          <div className="animate-slide-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/graph"
              className="px-6 py-3 bg-emerald-primary hover:bg-emerald-dark text-white font-medium rounded-xl transition-colors duration-200 text-sm"
            >
              Explore the Graph
            </Link>
            <Link
              to="/search"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-text-primary border border-border-subtle rounded-xl transition-colors duration-200 text-sm"
            >
              Search Records
            </Link>
          </div>
        </div>
      </section>

      {/* ──── Features ─────────────────────────────────── */}
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

      {/* ──── How It Works ─────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="animate-fade-in text-3xl font-bold text-text-primary text-center mb-4">
          How It Works
        </h2>
        <p className="animate-fade-in delay-100 text-text-secondary text-center max-w-xl mx-auto mb-16">
          SeevoMap turns scattered experimental knowledge into a searchable, injectable resource for the AI research community.
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

      {/* ──── Footer ───────────────────────────────────── */}
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
