# Program the Exit — 4011

The discovery is to program the state needed **before** a compulsory future toggle, rather than simply arranging the exit to look open now. Prepare A on and B on; the unavoidable middle A lever then leaves A off and B on. Two ordinary, independent single-channel gates compose the final requirement through geometry. No multi-channel block, new engine feature, invisible route constraint or debug marker is used.

## Image-first workflow and translation

`concept.png` is the unchanged high-resolution built-in ImageGen result, made before the grid authoring script or JSON. `prompt.json` preserves the exact prompt, references and generated source path. I viewed all three original-pack opening sheets and the actual sprite/lever sheet before generating. Native `Run.m`, `Track.m`, `GameConfig.h` and the actual shared timer/simulation/serialization/solver implementations were read for the mechanics.

The concept suggests a broken comet crown: unequal lower shoulders carrying the two setup levers, an ascending crooked hollow, a single-lever neck, and a broader split crown with two localized checks. The actual 16-by-47 map preserves that silhouette, a chipped left bulge, an elongated right shoulder, the high open crown and three distinct star pockets. It uses original metal/rock/gem/star/lever PNGs. Chipped outer voids and scattered fragments vary the mass; the internal boundary remains coherent so the puzzle cannot be bypassed from the wrapped exterior.

A deliberate deviation is vertical staggering of the first two levers. The generated near-horizontal opposing alcoves would make visiting both impossible with upward-only movement. In the native map A is `(9,5)` and B is `(19,10)`, exactly far enough apart for a long clean diagonal. The comet neck and final checks are compressed vertically so their implications remain visible while preparing. The real ghosted gate appearance is the game's small dim stone; the concept used larger ghost rocks.

`actual-map.png` is rendered from the real `level.json`, in the initial state, using original sprites, with no wall labels or overlays. `comparison.png` puts it beside the generated image for review. `prepared-map.png` shows mask 3, when the A slit is closed and B arch open; `final-map.png` shows mask 2, with both open. `route-review.png` adds a review-only path to the latter. No route line or A/B label is embedded in the level.

## Legible decision and cause/effect

The setup A lever is on the left shoulder and the future compulsory A lever remains on the same left side of the hollow. B sits on the right shoulder. The compulsory lever is a full-sized original chunky stone lever, occupying the only traversable cell of its neck. It is visually a future intervention rather than a hidden automatic event.

The two final checks sit close above it: the initially ghosted A slit at row 30, then the solid B arch at row 33. At the last setup decision, B at row 19, the forced lever is 8 rows / 128 world points above; the A check is 11 rows / 176 points above; the B check is 14 rows / 224 points above. They are arranged in the same open central view before entering the neck. Pressing the early A lever closes the visibly ghosted A slit; pressing B opens the solid right arch. The player therefore sees that the currently closed left slit must be reopened by the compulsory later lever. Spatial left/right association and live original gate feedback provide the information; channel letters appear only in these notes and validator output.

This is editor-rendered visibility evidence. Native viewport/framing acceptance remains part of the integrating agent's app checks; this worker does not claim physical-device playtesting.

## Native cells and intended route

Coordinates are `(row,column)`, row 0 at the bottom. The start is the native `(0,9)`, direction right. The winning route begins by turning left.

- Optional A `(9,5)` toggles 0 → 1. The original off-state left slit becomes closed.
- Optional B `(19,10)` toggles 1 → 3. The right arch opens.
- First star `(24,8)` is below the narrow compulsory lever neck.
- Compulsory A `(27,8)` toggles 3 → 2. A becomes off again while B stays on.
- A-off check: metal cells `(30,8)` and `(30,9)` linked only to A, each with native timer `[0,32767,32767,0,0,0]`. The timer stays in its initial off phase throughout play, so A inverts the off base state. A must be off to pass.
- Second star `(31,9)` sits between the checks.
- B-on check: ordinary metal cells `(33,9)` and `(33,10)` linked only to B. B must be on to pass.
- Third star `(38,9)` and the short sparkling finish `(41,8..10)` complete the crown.

The optional setup levers can each be missed through open space. The compulsory lever is the only usable cell at its row in the protected hollow; side-entry alternatives above it are blocked by metal. Both exit checks are only two cells wide and form local features of the sculpted crown rather than full-width wall strips.

## Proof and replay

`validation.ts` imports the actual shared `importLevel`, `startRun`, `advanceRun`, `obstacleHP` and `solve`; it contains search orchestration only. The authored route was established with shared-core reachability. The winning solver route was then replayed step for step through the same `advanceRun`, checking position agreement and no collision.

Winning result: **finished, 3 stars, 3 lives, 0 crashes, 8 turns, score 1265, time 336**, final mask 2. The no-damage score solver returns `optimal` after 405 expanded states. Switch event masks and gate states are preserved in `validation.json`:

| Prepared A/B | After forced A | A slit | B arch | Three-star authored finish |
|---|---|---|---|---|
| off / off | on / off | closed | closed | unreachable |
| on / off | off / off | open | closed | unreachable |
| off / on | on / on | closed | open | unreachable |
| on / on | off / on | open | open | reachable |

Each wrong-state result exhausts complete shared-core reachability, permitting damage and native frozen collision states. The wrong states expand 1,540 / 1,684 / 1,514 states respectively; none is a limited search. There are no hearts or enough gems for a combo reward, and the protected checks and inner boundaries are metal, so health cannot buy a bypass.

Two counterfactuals establish that this is planning around the future toggle:

1. Remove the compulsory A lever's physical toggle. The otherwise correct prepared mask 3 can no longer finish with three stars. Prepared mask 2, B alone, now succeeds. Thus the required preparation changes specifically because of the future intervention.
2. Remove only the two exit checks. All three previously wrong prepared states can now finish with three stars. The failure was the state checks rather than an unreachable optional lever route.

The search objective is a three-star finish at the authored finish, with exact native upward/wrap motion. Merely escaping outside the sculpture and eventually encountering native automatic end-of-data completion cannot collect its protected stars and is not counted as solving the puzzle.

Strict TypeScript checking of `validation.ts` and its actual shared-core imports passed with the already installed editor compiler/dependencies (`--strict --noEmit`, no install). The integrating agent owns broad suite execution and native parity/framing checks.
