# First Light — Pack 4, level 1, ID 4002

The visual starting point was **builtin ImageGen**, before the level grid was
authored. `concept.png` is its unchanged 967 × 1626 output; `prompt.json` preserves
the exact call. The original output remains at
`/Users/anderhaf/.codex/generated_images/01a174de-86fe-75a2-8fe7-ebc9328aa15c/exec-9623e6f3-d9df-4ec9-a1c4-d31e8b0ff530.png`.
The earlier, taller concept and exact prompt are preserved as `concept-v1.png`
and `prompt-v1.json`. No rejected Pack 4 generator was used.

## Composition and source study

Before generation I read the real first three levels of packs **10, 20, 30**
from `game-resources/Levels/data/storyData.txt`: Easy lab, Easy Early, 1-8;
Dirtrock, Cool dirtcrash, Dirty Lab; Its alive!, Angled timing, Timegrid 2.
I inspected original-sprite maps of all three pack openings and all three full
opening contact sheets supplied by the parent. ImageGen received those three
sheets, my first-level contact sheet, and the original sprite/lever reference.

The lesson taken from these originals is unequal asteroid masses and plenty of
quiet space, with each new mechanism expressed as one legible event. The
original metal, rock and dirt textures are kept; there is no new terrain art.

The implemented 16 × 55 board interprets the compact concept rather than
pretending generated pixels are exact cell coordinates. The large, rough lower
left crescent is balanced by a smaller right lever shoulder. The stone garden
then narrows to one three-cell gate before opening into a sheltered upper cove.
Three separated stars mark discoveries; six scattered gems are accents rather
than a rail. The finish occupies only two cells and has breathing room beyond it.
The lever has a passable cell and clear approach/departure space. A handful of
loose satellite pebbles retain the concept's floating composition.

## Intended play

Start at native `(row 0, col 9, right)`. The first broad sweep brings the player
back to the welcoming star at `(15,9)`. A short right turn reaches the chunky
lever `(18,11)`; collecting it flips channel A. Turn left into the broad bay,
then sweep right through the now-open local gate at row 32, columns 8–10. The
second star at `(35,9)` confirms the switch's reward. A last easy arc collects
the third star `(43,9)` and reaches the small finish at row 48, columns 8–9.

`validation.json` contains the complete solved route, including direction and
switch mask at every step. Its eight turns are unequal sweeps and brief reward
approaches. There are no repeated full-width wall rows, repeated strip gates,
or a prescribed continuous gem lane. `route-review.png` overlays the solver's
route for review; that overlay is not part of the game artwork or level data.

## Verification

`validate.ts` imports the shared typed `importLevel`, `solve`, `startRun` and
`advanceRun` from `src/core/`. The strict no-damage solver proves an optimal
three-star solution after 401 expanded states. Replaying all 49 decisions
finishes with **3 stars, 0 crashes, 3 lives, channel A on**, eight turns and score
1330. The run takes 392 simulation time units (eighths of a tock).

For a causal check, validation relinks the lever to unused channel B while
leaving the A gate closed. The same no-damage solver reports the finish
unreachable. The lever therefore opens the actual route, not just decoration.

This is JSON/simulation and original-sprite review evidence. Parent integration,
native build, simulator play and physical-device play remain separate checks.

Reproduce these small checks with:

```
python3 design/pack4-redesign/level-1/author.py
/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsx design/pack4-redesign/level-1/validate.ts
python3 design/pack4-redesign/level-1/render.py
```

`map-render.png` is a deterministic composition of real source sprites, using
the correct 32 × 16 offset-hex spacing. Gate outlines are review annotations,
and finish sparkle marks approximate the native particle-only goal.
