# ResearchClawBench Math_000 Example Redesign

## Goal

Make `ResearchClawBench Math_000` the first example on the examples page and rewrite its presentation so a first-time visitor can quickly understand:

- what the task is
- what the agent is required to do
- what the expected output is
- how much the community-guided run improved over the no-community baseline

The current issue is not lack of content. It is hierarchy. The hero uses too much headline text, the benchmark image is doing too much explanation work, and the key user-facing takeaway is visually delayed.

## Scope

Only redesign the `ResearchClawBench Math_000` example and the example ordering in `Choosing An Example`.

Keep these unchanged:

- `Parameter Golf` content structure and copy
- the existence of the benchmark diagram asset
- the three follow-on sections:
  - `1. What the user types`
  - `2. Before Vs After Community`
  - the measured-improvement section after that

## Information Architecture

### Example Ordering

In `Choose An Example`, move `ResearchClawBench Math_000` to the first position and keep `Parameter Golf` second.

### Top Section Direction

Use a dashboard-first layout for the `Math_000` hero instead of a poster-style editorial block.

The first screen should prioritize compact, scannable information blocks over one oversized sentence. The diagram remains present, but only as a supporting explainer card, not the main visual anchor.

### Required First-Screen Content

The top section should communicate these four things immediately:

1. `What this is`
   `ResearchClawBench Math_000` is a crowded multi-object tracking benchmark.
2. `Task requirement`
   The agent must convert frame-level detections into stable trajectories under occlusion and low-score conditions, then run the official evaluation workflow.
3. `Output`
   The deliverable is recovered tracks plus the official benchmark score and analysis outputs.
4. `Measured lift`
   The community-guided run improved the official score from `26.65` to `31.9`, a `+5.25` lift.

## Layout Plan

### Hero

Use a dense dashboard composition with:

- a compact title block
- a prominent score-lift card
- a small benchmark diagram card
- short task-definition cards for input, requirement, output, and benchmark type

Avoid long paragraph-first composition. The text should read like a task brief, not a manifesto.

### Section Order

For the `Math_000` example content, keep this order:

1. top dashboard hero with score lift and task explanation
2. `1. What the user types`
3. `2. Before Vs After Community`
4. measured-improvement explanation section

This preserves the existing page logic while making the benchmark understandable before the table and prompt details.

## Copy Direction

Use plain language. Avoid assuming the reader knows what `Math_000`, `SparseTrack`, `DCM`, or `pseudo-depth` mean.

The copy should explain the task at the level of:

- input: frames plus detections
- work: link detections into object tracks across time
- output: final trajectories and official scoring result

The benchmark diagram caption should explain what the reader is looking at, not repeat abstract benchmark language.

## Visual Direction

- Keep the existing site look and component language.
- Reduce giant headline text.
- Increase scannability with compact cards and stronger value grouping.
- Make the score lift the clearest visual fact on the page.
- Let the diagram support comprehension instead of dominating the section.

## Risks And Constraints

- A dashboard-heavy layout can become too dense if every fact is treated equally.
- The score lift must stay visually strong without making the benchmark explanation feel secondary.
- The diagram card must stay useful even when it is reduced in prominence.

## Verification

After implementation:

- `ResearchClawBench Math_000` appears first in the example selector
- the first screen explains task, requirement, and output clearly
- the benchmark image is visually secondary to the score/task summary
- the page still builds successfully
- the examples page remains readable on desktop and mobile
