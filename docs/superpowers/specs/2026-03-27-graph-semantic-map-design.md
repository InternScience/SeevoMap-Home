# Graph Semantic Map Redesign

## Goal

Redesign the `Graph` page from a force-directed graph with decorative semantic overlays into a true semantic map. The new experience should visually track closer to the `ScivBook` homepage map while preserving SeevoMap's node density, public-domain taxonomy, and graph exploration workflow.

This redesign must solve four user-facing problems:

1. The current graph feels visually empty because the content sits inside a full-screen canvas without a strong stage.
2. The current semantic axes feel pasted on rather than structurally meaningful.
3. Dragging and zooming the whole full-screen canvas makes the graph feel tiny and unstable.
4. The graph does not yet communicate domain structure and research maturity in a way that users can read at a glance.

## User Experience

### Core Interaction Model

The page remains full-screen, but the graph itself is rendered inside a fixed semantic stage. Only the content inside that stage is pannable and zoomable. The surrounding canvas remains atmospheric background rather than interactive graph territory.

The graph becomes a semantic research map with:

- A stable stage boundary
- A semantic x-axis and y-axis
- Nine public domain labels placed along the x-axis
- Reference Nobel prize beacons overlaid as orientation markers
- SeevoMap nodes repositioned into semantic coordinates rather than raw force-layout positions

### Reading Order

The map is read as:

- Left to right: `micro / abstract / method-oriented` to `macro / systems / real-world context`
- Top to bottom: `Hypothesis-Led` to `Execution-Ready`

The y-axis uses four explicit levels:

1. `Hypothesis-Led`
2. `Mechanism Proposal`
3. `Experiment Loop`
4. `Execution-Ready`

### Domain Layer

The x-axis keeps the micro-to-macro framing, but also carries the public domain vocabulary already established elsewhere in SeevoMap.

The nine public domains remain:

1. `Information Science`
2. `Mathematics`
3. `Physics`
4. `Chemistry`
5. `Life Science`
6. `Medicine`
7. `Engineering`
8. `Earth & Space`
9. `Economics`

These labels appear as semantic bands or tick labels along the x-axis rather than as separate side taxonomies.

## Semantic Positioning

### X-Axis Positioning

Each public domain is assigned a fixed anchor on the x-axis. These anchors are not inferred from current force-layout coordinates. They are part of the semantic design.

Recommended ordering:

- `Information Science`
- `Mathematics`
- `Physics`
- `Chemistry`
- `Life Science`
- `Medicine`
- `Engineering`
- `Earth & Space`
- `Economics`

This ordering preserves the user's chosen left-to-right reading: more abstract and micro-oriented work on the left, broader systems and macro-oriented work on the right.

Each node receives its x-position from its public-domain anchor plus a small deterministic local offset so clusters remain readable without losing the semantic category structure.

### Y-Axis Positioning

Each node is assigned to one of four execution-maturity bands.

Recommended mapping rules:

- `Hypothesis-Led`
  - `status === "hypothesis"` or concept-like nodes with no clear execution signal
- `Mechanism Proposal`
  - proposed method changes, structured plans, or analysis-heavy nodes without a strong execution artifact
- `Experiment Loop`
  - nodes with experiment framing, metric-bearing review content, or partial execution evidence
- `Execution-Ready`
  - concrete execution assets, reproducible runs, usable results, or clearly reusable artifacts

This layer should use explicit heuristics rather than hand placement. The heuristics should be local and deterministic so the graph remains stable across reloads.

### Local Jitter / Packing

Nodes should not stack on a perfect grid. After semantic band placement:

- apply deterministic jitter seeded by node id
- optionally run light local packing inside each semantic cell
- preserve readable clusters without reintroducing a free-force layout

The output should feel map-like, not spreadsheet-like.

## Nobel Reference Layer

The graph adds a second, lighter layer of `reference beacons` sourced from the ScivBook Nobel dataset.

### Source

Use:

- `ScivBook/frontend/src/data/nobelPrizes.json`
- selected scaling ideas from `ScivBook/frontend/src/data/scaleMap.ts`

### Behavior

Nobel beacons are not SeevoMap nodes. They are semantic references only.

They should:

- render above the background but below the main selected-node UI
- use lighter visual weight than SeevoMap nodes
- be non-filtering by default
- help users read the semantic landscape

They may be clickable later, but the first version only needs hover-level or static reference value.

## Visual Design

### Stage

The graph sits inside a bounded semantic stage:

- rounded rectangle or softly bounded map area
- fixed internal draggable region
- clear distinction between `interactive map stage` and `ambient page background`

This stage must visually solve the current problem where the graph appears too small inside a huge empty viewport.

### Boundary Language

Borrow from ScivBook's visual logic:

- soft territory envelopes
- subtle internal guide lines
- a map-like frame rather than chart axes pasted on a raw graph

Avoid:

- a pure scatter-plot look
- full-screen free drag
- heavy data-chart grid language

### Node Layer

Keep the current SeevoMap glow language and public-domain colors, but tighten them inside the semantic map:

- SeevoMap nodes stay as the primary colored marks
- Nobel beacons are lighter reference marks
- edges should be reduced or localized so they support context without turning the map back into a wire cloud

## Interaction

### Pan / Zoom

Only the semantic stage responds to drag and zoom.

Behavior:

- drag inside stage: pan
- drag outside stage: no graph pan
- zoom should keep the stage-centered composition stable
- camera movement must be clamped so users do not lose the graph into large empty space

### Drawer / Detail / Hover

Keep the current Graph page shell:

- top-left compact drawer trigger
- public domain drawer
- hover tooltip
- selected-node detail panel

These should continue to work with semantic node positions without changing their mental model.

## Architecture

### Data Model

Do not mutate `map.json`.

Introduce a semantic projection layer in the frontend:

- input: raw `MapNode`
- derive:
  - public domain group
  - semantic x-band
  - maturity y-band
  - deterministic local offset
- output:
  - semantic screen-space world coordinates for the map renderer

### Rendering Strategy

Keep the high-density rendering split:

- canvas for dense node and edge rendering
- SVG overlay for stage frame, axis labels, guide lines, and Nobel reference layer

This hybrid approach preserves performance while allowing cleaner semantic structure.

### File Scope

Primary implementation should stay within:

- `src/components/GraphVisualization.tsx`

Supporting additions are allowed in:

- `src/utils/publicDomains.ts`
- a new small utility file if semantic layout helpers become too large

Avoid broad page-shell refactors for this pass.

## Error Handling

If Nobel data cannot load or is temporarily unavailable:

- render the semantic stage and SeevoMap nodes normally
- skip the Nobel reference layer
- do not block the Graph page

If a node cannot be classified cleanly into a maturity band:

- fall back to `Experiment Loop`

This keeps the graph stable without inventing obviously wrong extremes.

## Testing

### Functional Checks

1. `npm run build` must pass.
2. Local preview must render `/#/graph` without runtime errors.
3. Dragging outside the stage must not pan the graph.
4. Dragging inside the stage must pan the graph.
5. Zoom must stay centered on the semantic stage and preserve graph readability.
6. Drawer filtering must still work with semantic placement.
7. Hover and detail panels must still resolve the correct node.

### Visual Checks

1. The graph should visually fill the semantic stage instead of shrinking into the center of a full-screen canvas.
2. The x-axis should read as both:
   - micro → macro
   - public-domain sequence
3. The y-axis should clearly communicate execution maturity.
4. Nobel beacons should add orientation without overpowering SeevoMap nodes.
5. The result should feel map-like rather than like a scatter plot with decorations.

## Non-Goals

- Do not change the deployed data format.
- Do not add a new graph page route.
- Do not expose internal `ai4s / science` taxonomy again.
- Do not turn the graph into a general-purpose chart with numeric ticks.
- Do not implement full Nobel-detail workflows in the first pass.
