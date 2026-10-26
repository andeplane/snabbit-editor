# 4014 — One Lever Only

This is an actual one-choice commitment puzzle. The three levers all toggle the
same existing channel A. Each bay mouth is initially an OFF metal gate. Selecting
one lever makes the *unvisited later mouths* solid. The selected bay's already
contacted mouth stays forced OFF behind the player, following native first-touch
freezing; this does not reopen any later option.

The earlier options are not merely forks that disappear because the player has
moved above them. The validation starts from the exact post-choice state and
asks whether each later lever is reachable. With the real mask they are not.
Changing only that mask back to zero, with every coordinate/row/resource and
wall unchanged, makes those same later levers reachable. This is proved for
1→2, 1→3, and 2→3.

## Discovery and the three choices

- Lower-left shallow bay: a lever followed by one heart. It offers at most four
  lives before the toll; selecting it closes both richer later options.
- Middle-right pocket: a lever followed by a visible group of three hearts.
  These grow the player from three to six lives before the obstacle shaft.
- Upper-left spur: a lever and a tempting diamond, with no extra health. It
  yields only three lives before the shaft. The diamond is a decoy, not a valid
  three-star completion reward.

All three are reachable without selecting another lever. The bays have distinct
shapes, sizes and rewards. Their visible pinched mouths demonstrate the shared
lockout effect using ordinary disappearing-block appearance, without invented
channel colors or letters on walls. The final initially-solid linked block
requires selecting some lever; avoiding all three leaves that block closed.

A short diagonal brown shaft then costs five ordinary dirt collisions. The
correct middle choice funds those five hits and leaves one life. There are eight
blue gems in the entire board, so a hidden twelve-gem combo cannot finance a bad
choice. No power-up or speed field is used. Two stars sit beyond the toll, so
merely reaching the first star does not satisfy the objective.

## Image first, then real JSON

`concept.png` was generated before any level JSON was written. `prompt.json`
records the exact built-in ImageGen prompt, inspected references and unchanged
source output path. The original pack-opening maps and original sprite sheet
were provided as image references.

The native translation preserves the staggered three-bay silhouette, asymmetric
white-metal crescent masses, a deeper right heart pocket, the upper-left diamond
spur and the compact brown shaft leading to an airy upper reward room. It uses
289 metal cells rather than full-width repeated wall strips. Sparse independent
gems replace the concept's small decorative trails; there is no constant gem rail.

Deliberate deviations: vertical spacing is compressed into 45 rows so the later
mouths and the richer nearby heart pocket remain useful look-ahead information.
The third star is placed in the upper crescent rather than on the dirt shaft.
The generated illustration's apparent rows/gate pairs are suggestions; actual
single-cell gate cutsets follow native hex movement, with no unsupported AND
logic. Full visibility of the entire final toll from the earliest first-lever
camera position is a physical camera-framing acceptance point, not proven by a
full-map render; local richer-pocket cues are visible earlier.

`actual-map.png` is rendered from real `level.json` with the original sprites at
native proportions and offset coordinates. `after-selection.png` shows the
first choice's actual lockout, retaining its already-passed mouth's frozen OFF
state. `route-review.png` separately marks the authored winning replay. No debug
markers are baked into the level or its actual map. `comparison.png` places the
unchanged concept alongside the native-grid translation.

## Authored route and proof

`authored-routes.json` stores the selected cell per row for four intended runs.
`validation.ts` uses the imported shared `nextCell` to obtain legal directions,
then replays every move/collision using imported `advanceRun`.

The authored middle route finishes at row 42, time 384, with 3 stars, 1 life,
5 crashes, 12 turns and 1,250 points. All three extra lives are granted by row 19,
well before the first dirt impact at row 27/time 224. This replay is not claimed
to maximize score.

An exhaustive 23,589-state decision-graph proof includes damage, lives, delayed
growth, combo timing, gate mask and first-touch obstacle HP. It establishes:

- Maximum number of selected levers on any reachable run: one.
- Maximum lives before the shaft for no choice / first / middle / third: 3/4/6/3.
- No choice, first choice and third choice have no finished three-star future.
- Only the middle choice has a finished three-star future (8 terminal logical
  states; 24 finished logical states in total, including fewer-star outcomes).
- No active run escaped the authored bounds without encountering the finish.
- All initially available lever and post-choice counterfactual reachability
  checks include real collision damage and resources; none assumes walls are
  impassable merely because they look solid.

The reachability proof intentionally folds score/multiplier because they do not
change the objective or transitions. It also folds absolute time because every
long OFF gate phase is constant throughout this finite level: even allowing all
four authored hearts, fewer than twelve gems, the automatic-finish horizon and
all survivable impacts bounds time below 1,000, far short of the 32,767 phase.
Actual explored time is at most 384. This is an exact objective proof, not a
limited A* result or a claim of optimal score.

Run from `snabbit-editor`:

```sh
/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsx design/pack4-puzzles/puzzle-08/validation.ts
/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsc -p design/pack4-puzzles/puzzle-08/tsconfig.validation.json --noEmit
python3 design/pack4-puzzles/puzzle-08/render.py
```

## Native integration constraints for root

Authored story hearts must be preserved. The inspected native `Run.getRow`
still applies survival heart-placement RNG to `B_LIFE` unless root's separate
fix is integrated. This level cannot be accepted with its three required hearts
randomly removed. Native queued turns can also shorten fractional collision
life drain; root's shared full-tock collision parity fix is required before
claiming the native health proof. Neither issue is faked with extra metadata or
an unauthorized local engine copy here. No new engine gate feature is needed.
