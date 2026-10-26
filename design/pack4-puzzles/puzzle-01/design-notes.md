# 4007 — Three Switches, One Door

## The discovery

The switches toggle; they do not all mean “open”. The player passes an
unavoidable first switch, then chooses whether to take a middle switch on the
left of a sculpted asteroid sail. A roomy right branch skips it. Both branches
converge on an unavoidable last switch, with one two-cell door above it. The
correct choice is to take the apparently optional middle switch: three toggles
leave the door open. Taking only the two compulsory switches closes it.

This is a state puzzle. The middle switch is not required by a star, a wall
hidden beside it, an extra channel, or an arbitrary gem reward. The central fork
really has a clean bypass. Neither branch has a health cost; no health exploit,
timer wait, turn-during-impact trick, or unsupported multi-channel gate is used.

## Visible information and commitment

All three switches use the same chunky original lever art and channel A. The
first switch visibly changes the final door to its native small/off state.
The middle switch changes that same door back to large/on; the compulsory last
switch changes it back to small/off. Native art supplies the feedback: there are
no permanent colored wall outlines, letters or hidden on-board instructions.

At the middle decision (row 24) the final compulsory switch (row 38) and door
(row 44) are only 14 and 20 rows ahead. At 16 points per row, they sit 224 and
320 points ahead respectively, making the crucial layout compact. The central
sail makes the left/right alternatives obvious. The upper neck visibly narrows
to one lever cell before the door. Preview/render evidence shows this spatial
relationship; actual simulator viewport visibility remains for root's native QA.

## Image-first workflow and translation

Read the first three original levels of packs 10/20/30 and inspected their real
opening-level contact sheets. Also inspected accepted introductory level maps.
Before writing JSON, called builtin ImageGen once with all three pack-opening
contact sheets, the original sprite/lever sheet, and the accepted First Light
map. `prompt.json` contains the exact prompt, reference paths and generated
source path. `concept.png` is the unchanged 976 × 1609 generated output.

Preserved the concept's hollow-lantern silhouette, unequal chipped arms,
pointed central sail, low compulsory switch, optional left switch, upper
compulsory switch, small final bowl, three separated stars and sparse gems.
`comparison.png` shows the unchanged concept beside the real JSON rendered
with original source sprites on the correct 32 × 16 offset-hex spacing.

Deliberate changes needed for native play:

- Replaced the concept's invented rectangular door tiles with two original
  silver metal sprites. They shrink normally when switched off.
- Thickened collision-critical inner edges to keep the first and last levers
  compulsory and prevent horizontal-wrap escapes. The outer chips remain varied.
- Moved the middle star from the image's right branch to just above the last
  compulsory switch. Thus three-star collection does not force a branch before
  the player solves parity.
- Kept rocky flecks decorative; no dirt toll or health puzzle is introduced.
- Adapted to 16 columns × 56 rows, with explicit finish at row 50 and empty
  space above. The image is a composition reference, not an exact cell map.

`actual-map.png` has no route or debug wall markers. `door-open-map.png` shows
the ordinary native gate-off scale. `route-review.png` is a separate review
overlay, not game data. Finish sparkle marks approximate native goal particles.

## Intended route

Native start is row 0, column 9, right. Pass the first neck switch `(10,9)`,
collect the first star `(15,8)`, and take the left side of the central sail to
the middle switch `(24,5)`. Sweep right after the sail, converge on the upper
neck switch `(38,9)`, collect the second star `(41,9)`, pass the now-open door at
row 44, columns 8–9, collect the third star `(48,9)`, and finish at row 50,
columns 8–10. The optimal replay uses 8 turns with unequal sweep lengths.

## Proof and replay

`validation.ts` is strictly typechecked. It imports the actual shared
`importLevel`, `startRun`, `advanceRun`, `obstacleHP` and `solve`; it does not
copy movement, collision, toggle or scoring code. It first establishes an
authored waypoint route using actual transitions, then solves and replays the
optimal route with the same core. `validation.json` preserves every replay
point, score, health, time, stars and switch event.

Winning replay: **finished, 3 stars, 3 lives, 0 crashes, 8 turns, score 1350**,
time 408 eighth-tock units. No-damage solver is **optimal**, expanding 425 states.

The recorded switch events are:

| Leaving switch | Time | Mask | Final door |
| --- | ---: | --- | --- |
| `(10,9)` first | 88 | 0 → 1 | Open |
| `(24,5)` middle | 200 | 1 → 0 | Closed |
| `(38,9)` last | 312 | 0 → 1 | Open |

Complete no-damage reachability enumeration, using `advanceRun` for every
transition, produces these counterexamples:

- Forbid entering first switch: finish unreachable (47 states).
- Forbid entering last switch: finish unreachable (379 states).
- Forbid entering middle switch: finish unreachable (340 states).
- Replace only middle switch's toggle with empty: finish unreachable (344 states).
- Remove only the final door and forbid the middle: finish reachable. This
  proves the middle is optional geometrically, while parity makes it necessary.

Replaying the winning directions with the middle toggle removed reaches the
door from `(43,9)` at time 352 with mask 0 and collides with **200-HP metal**.
The inner enclosing boundaries are likewise metal, with no heart or 12-gem
reward available; a 3-life player cannot buy a closed-door or wall bypass.
No exhaustive damage-enabled search is claimed; the strict search is complete
and the damage-bypass exclusion follows the 200-HP boundary construction.

Reproduce locally with the provided `author.py`, `validation.ts`, `tsconfig.json`
and `render.py`. Root owns native integration, simulator/physical play, batch
tests, source/data changes and release actions. This worker edited only this
`puzzle-01` directory and did not commit, push, install or alter accepted levels.
