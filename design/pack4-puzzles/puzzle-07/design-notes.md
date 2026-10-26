# 4013 · Leave the Refund

## Intended discovery and genuine decision

The second green lever is not another helpful activation. It reverses the same channel as the first. A heart sits one cell above it, in a narrow right-hand hollow whose only affordable entrance crosses that lever. The player can take the apparent refund, or cross one brown dirt cell on the left to leave it behind. Both are reachable alternatives.

The first lever at (6,9) opens the local metal crossing at row 10 and the valuable upper-left crossing at row 26. Taking the heart necessarily crosses the second A lever at (18,11), returning A to zero and closing the useful passage. A three-hit brown bypass remains on the right. The gift actually funds all three hits—but leaves only one life before the visible common final toll. The correct plan preserves A, pays one small brown cost on the left, and retains enough health for that future toll.

The upper left route has a broad curved open interior with different steering choices. The puzzle is the fork's state/resource consequence, not following a prescribed zigzag or gem rail. Four sparse gems are insufficient to produce a combo heart.

## Visible compact chamber

The first lever and nearby crossing demonstrate the effect locally. Both levers share the native global on/off appearance: the refund lever is already green after the first lever has been used. There are no invented channel labels, colored walls, debug markers, or unsupported wires. The heart immediately above the refund lever makes them a visible package.

All costs and state consequences of this decision occupy one compact composition: refund lever row 18, heart row 19, three brown bypass cells rows 25–27, useful gate row 26, second star row 31, and final common brown toll row 33. The decision-to-final-cost span is fifteen grid rows, 240 native layout points at 16 points per row, rather than a hidden long corridor. The original-sprite full-map rendering verifies the composition. Root retains the final native phone/simulator viewport acceptance check.

## Image first, flat refinement, and actual translation

The original built-in ImageGen concept was saved before any JSON authoring. Its isometric platform style did not match Snabbit. It and its exact prompt are preserved unchanged as `concept-v1.png` and `prompt-v1.json`.

The current `concept.png` is a built-in ImageGen edit/refinement. Its five explicit image inputs were the original concept, original pack-1 and pack-2 flat level openings, the original sprite sheet, and this level's actual native map. `prompt.json` records the exact refinement prompt, all absolute input paths, generated source path, and previous-version references. This is an image-first design iteration; no generated image was manually repainted.

Visual inspection confirms the platform floors, elevated cliffs, dimensional ground, trophy, and perspective camera have been removed. The refined composition uses independent small faceted white rock sprites, an empty navy passage, a lower lever, the right-hand heart/lever hollow, an upper short three-brown pocket, and the same asymmetric crescent idea. The image now belongs to the flat original-map visual language instead of a different platform game.

`actual-map.png` and refreshed `comparison.png` render real JSON with native offset geometry and original sprites. `after-toggle.png` shows the useful state with shrunken absent gates. The comparison shows sufficient silhouette and stylistic continuity to keep the already-proven native layout: right-hand heart/reset hollow, airy curved main interior, short upper-right brown alternative, sparse rewards and chipped white boundary masses.

Deliberate translation differences remain visible and explicit. Despite the refinement prompt's three-star constraint, the generated concept contains five decorative stars; the actual level retains exactly three reachable native stars. The concept stretches some separations and does not reliably depict the left one-hit cost or final common toll. Actual JSON retains those essential costs in its compact rows18–33 decision chamber. The renderer and transition proofs, not the generated illustration, establish mechanics. The lever art in the actual map uses the shipped chunky switch sprite from the supplied reference sheet.

The first native translation used a long brown sleeve to tolerate the old partial-collision-drain bug. The final actual layout instead uses the compact three-cell pocket requested by root, relying on the separately integrated full-collision damage correction. The visual refinement changes only concept/prompt/comparison/notes, not this final native geometry or its resource proof.

## Intended route and exact budget

`validation.json` stores the exact winning trail. Main waypoints are (6,9), (12,9), (17,8), (19,8), (22,9), (27,8), (31,10), (34,10), (36,10), and (40,10). Coordinates are native bottom-up row,column.

- Start at 3 lives. First lever leaves A on; collect the lower star.
- Choose left at the refund fork; one brown hit at row 18 reduces health to 2.
- Preserve A through row 26; collect the second star at (31,10).
- One common brown hit at row 33 reduces health to 1.
- Collect the third star at (36,10), then finish at row 40.

Winning replay: finished, 3 stars, 1 life, 2 crashes, 19 turns, score 1195, timer time 344. Only the first switch is collected. This is a winning route, not a claim of optimal score.

The wrong heart route reaches 4 lives before use, with A off. It pays all three bypass hits, collects the second star, and reaches (32,10) with 1 life. The final visible toll then kills it. The heart is not a fake pickup or unreachable branch; the mistake is spending its refund without planning the remaining cost.

## Actual shared-core proofs

`validation.ts` imports `validateLevel`/`importLevel` and `startRun`/`advanceRun`/`obstacleHP` from actual shared typed core files. No simulation is copied or rewritten. Standalone replay and strict TypeScript checking pass.

Exhaustive continuation after taking the actual heart visits all 161 reachable decision states, allowing damage and both directions. No continuation finishes; at most two stars are available. Three independent counterfactuals explain exactly why:

- Remove the final toll only: the same heart/bypass route finishes with 3 stars and 1 life. This proves future budget matters.
- Remove the three bypass costs only: the wrong-state heart route finishes with 3 stars and 3 lives. This proves the brown resource cost matters.
- Disable only the second toggle while retaining the heart: the heart route uses the open useful crossing and finishes with 3 stars and 3 lives. This proves the toggle matters.

All pickups are processed through real transition timing, including the delayed heart growth. Authored hearts are assumed guaranteed as directed; native story RNG correction is root integration work.

## Native dependency and scope

The proof assumes one full life per confirmed collision, matching the shared core and the native collision-damage fix being integrated separately by root. It does not claim acceptance against the older native queued-turn partial-drain bug. Root must verify the integrated native parity and viewport before release acceptance.

All worker writes are inside `puzzle-07/`. No shared source, pack, existing level, commit, push, or installation was changed by this worker.

## Reproduce

From the snabbit-editor root:

```sh
python3 design/pack4-puzzles/puzzle-07/author.py
python3 design/pack4-puzzles/puzzle-07/render.py
/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsx design/pack4-puzzles/puzzle-07/validation.ts
/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsc -p design/pack4-puzzles/puzzle-07/tsconfig.validation.json
```
