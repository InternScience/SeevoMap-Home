const NODES = [
  { id: "n1", x: 9, y: 22, r: 3.2, delay: "0s", duration: "15s" },
  { id: "n2", x: 18, y: 46, r: 2.4, delay: "-2s", duration: "12s" },
  { id: "n3", x: 29, y: 18, r: 2.6, delay: "-4s", duration: "14s" },
  { id: "n4", x: 37, y: 58, r: 3.5, delay: "-1s", duration: "16s" },
  { id: "n5", x: 49, y: 28, r: 2.8, delay: "-3s", duration: "13s" },
  { id: "n6", x: 57, y: 63, r: 2.4, delay: "-5s", duration: "17s" },
  { id: "n7", x: 68, y: 33, r: 3.6, delay: "-2.5s", duration: "14s" },
  { id: "n8", x: 76, y: 16, r: 2.2, delay: "-6s", duration: "12s" },
  { id: "n9", x: 84, y: 52, r: 3.2, delay: "-1.5s", duration: "18s" },
  { id: "n10", x: 92, y: 27, r: 2.5, delay: "-4.5s", duration: "13s" },
];

const LINKS = [
  ["n1", "n2"],
  ["n1", "n3"],
  ["n2", "n4"],
  ["n3", "n5"],
  ["n4", "n5"],
  ["n4", "n6"],
  ["n5", "n7"],
  ["n7", "n8"],
  ["n7", "n9"],
  ["n8", "n10"],
  ["n6", "n9"],
  ["n5", "n8"],
];

const NODE_MAP = Object.fromEntries(NODES.map((node) => [node.id, node]));

export default function HeroGraphField() {
  return (
    <div className="hero-graph-shell" aria-hidden="true">
      <svg
        className="hero-graph-svg"
        viewBox="0 0 100 80"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="hero-node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--hero-graph-node-core)" />
            <stop offset="100%" stopColor="var(--hero-graph-node-glow)" />
          </radialGradient>
          <linearGradient id="hero-link-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--hero-graph-link-start)" />
            <stop offset="100%" stopColor="var(--hero-graph-link-end)" />
          </linearGradient>
        </defs>

        <g className="hero-graph-cluster hero-graph-cluster-a">
          {LINKS.map(([from, to], index) => {
            const a = NODE_MAP[from];
            const b = NODE_MAP[to];
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="hero-graph-link"
                style={{
                  animationDelay: `${-index * 0.4}s`,
                  animationDuration: `${10 + (index % 4)}s`,
                }}
              />
            );
          })}

          {NODES.map((node, index) => (
            <g
              key={node.id}
              className={`hero-graph-node hero-graph-node-${
                index % 2 === 0 ? "primary" : "secondary"
              }`}
              style={{
                animationDelay: node.delay,
                animationDuration: node.duration,
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r * 1.8}
                fill="url(#hero-node-glow)"
                className="hero-graph-node-glow"
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                className="hero-graph-node-core"
              />
            </g>
          ))}
        </g>
      </svg>

      <div className="hero-graph-orb hero-graph-orb-a" />
      <div className="hero-graph-orb hero-graph-orb-b" />
      <div className="hero-graph-orb hero-graph-orb-c" />
    </div>
  );
}
