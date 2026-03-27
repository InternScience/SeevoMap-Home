# Graph Semantic Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current graph framing with a true semantic map stage that uses stable x/y semantics, Nobel reference beacons, and stage-only pan/zoom.

**Architecture:** Keep `GraphPage` and the existing drawer/detail UI, but move graph positioning into a semantic projection layer. Render the dense node/edge layer on canvas, while using an SVG overlay for axes, domain bands, Nobel beacons, and stage framing. Derive node positions from public-domain anchors and execution-maturity bands instead of raw force-layout coordinates.

**Tech Stack:** React, TypeScript, canvas 2D, SVG overlay, existing theme tokens, existing public-domain mapping

---

### Task 1: Add Semantic Layout Utilities

**Files:**
- Create: `src/utils/graphSemanticLayout.ts`
- Create: `scripts/graph-semantic-layout-check.ts`

- [ ] Define public x-axis anchors for the 9 public domains and four y-axis maturity bands in `src/utils/graphSemanticLayout.ts`.
- [ ] Add deterministic jitter helpers seeded by node id so the semantic map feels organic but remains stable across reloads.
- [ ] Export a `projectSemanticNode(node)` function that returns semantic `x`, `y`, public-domain label, and maturity band.
- [ ] Write `scripts/graph-semantic-layout-check.ts` first with assertions that:
  - `pretraining` projects into `Information Science`
  - `physics` projects into the `Physics` x-band
  - `status: "hypothesis"` projects into the top maturity band
  - execution-bearing nodes project into lower bands
- [ ] Run a TypeScript compile check on the script and confirm it fails before the helper exists or before exports line up.
- [ ] Implement the helper minimally until the check script compiles and passes.

### Task 2: Add Nobel Reference Data

**Files:**
- Create: `src/utils/nobelReferences.ts`
- Reference: `../ScivBook/frontend/src/data/nobelPrizes.json`

- [ ] Copy the Nobel records needed for the semantic map into a local `nobelReferences.ts` dataset so SeevoMap does not depend on the ScivBook project at runtime.
- [ ] Normalize each Nobel entry into:
  - `id`
  - `year`
  - `field`
  - `contribution`
  - `publicDomain`
  - `xBand`
  - `yBand`
- [ ] Keep the first implementation lightweight: beacons may be static reference marks and do not need full detail panels.

### Task 3: Refactor GraphVisualization Into a Semantic Stage

**Files:**
- Modify: `src/components/GraphVisualization.tsx`

- [ ] Replace the current "entire full-screen canvas is pannable" interaction with a bounded semantic stage.
- [ ] Restrict pan/zoom to pointer interactions that start inside the semantic stage.
- [ ] Render the stage boundary and axis frame in SVG so it remains crisp and synchronized with camera movement.
- [ ] Replace the current semantic overlay with:
  - x-axis macro/micro guide
  - y-axis execution-maturity guide
  - 9 public-domain labels along the x-axis
  - 4 maturity labels along the y-axis
- [ ] Use `projectSemanticNode()` for node positions instead of raw `node.x/node.y` when drawing the semantic map.
- [ ] Continue to use the existing hover and click behavior, but translate hit testing to semantic positions.
- [ ] Reduce edge density or edge prominence so the result reads as a map, not a wire cloud.

### Task 4: Nobel Beacon Overlay

**Files:**
- Modify: `src/components/GraphVisualization.tsx`
- Reference: `src/utils/nobelReferences.ts`

- [ ] Render Nobel beacons above the stage background and below the selected-node UI.
- [ ] Give beacons lighter visual weight than SeevoMap nodes so they guide reading without overpowering the map.
- [ ] Reuse the ScivBook-style reference idea:
  - beacons are semantic anchors
  - they are not part of graph filtering
  - they help users orient by field and maturity
- [ ] Spread Nobel beacons across the full semantic field using the scale-map coordinates as the primary signal, instead of collapsing them into tight domain-local stacks.
- [ ] Add a lightweight legend and hover introduction so users understand that the beacons are Nobel reference landmarks rather than regular graph nodes.

### Task 5: Verification

**Files:**
- Modify: none

- [ ] Run `npm run build`.
- [ ] Restart `npm run dev:local`.
- [ ] Verify locally on `/#/graph`:
  - only the stage area is draggable
  - the graph fills the stage more tightly
  - the x-axis shows both macro/micro direction and 9 public domains
  - the y-axis shows the 4 execution-maturity bands
  - Nobel beacons render as reference markers
  - drawer filtering, hover, and selected-node detail still work
