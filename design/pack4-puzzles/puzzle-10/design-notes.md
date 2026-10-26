# 4016 — Spend a Heart, Save Turns

A short chipped crescent offers a scoring decision. The heart in its lower hollow is spare health the player can spend to preserve momentum. The left opening snakes around an island; the right opening has three visible brown dirt cells but requires fewer reversals. Neither branch has exclusive star rewards: star 1 precedes the fork and stars 2 and 3 follow the merge.

## Discovery and visible cues

Travel upward from the native row 0, column 9 start. Three sparse cyan gems lead through the common approach, with a heart at row 3, column 7 and the first star at row 5, column 6. The branch starts at row 6, column 6. The smooth right-hand diagonal has three contiguous dirt cells at rows 12–14; their appearance communicates three hits. The visibly wrinkled left opening is completely safe. Both branches converge at row 22, column 6, directly below the second star. The third star and native finish sit in the upper broken tip.

The heart is collected when leaving row 3. Its delayed growth is credited on the following decision at row 5. All four lives are therefore available long before the first brown collision. Three brown impacts leave one life. The three gems never make a combo heart and are shared by both routes.

## Image-first composition and translation

Built-in ImageGen was called once before authoring the map. `prompt.json` preserves its exact prompt, reference paths and generated source path; `concept.png` is an unchanged copy of that source. The concept establishes a dark navy field, one large chipped crescent, an internal island, a heart in the lower hollow, a central dirt option, sparse gems and a broken upper tip with stars and finish. `actual-map.png` renders the authored JSON on the real staggered grid using the original game sprite PNGs. `comparison.png` places the unchanged concept beside that real rendering. No conceptual painted blocks are used as the actual game map.

Deliberate translation: the generated concept has too many dirt cells for native health and places stars on separate paths. The native version uses precisely three contiguous dirt cells and three shared stars. The silhouette is shorter and broader on the 16-column native grid. Its safe opening has irregular run lengths to demand turns. The native life sprite is orange-red rather than the generated pink heart. Small isolated hollows, chipped boundaries and drifting fragments retain the asteroid composition. The finished comparison was inspected after rendering. Finish sparkles are deterministic preview marks for native `7`; wall, dirt, heart, gem and star pixels are original sprites.

## Intended steering

`routes.json` contains the exact direction strings. `L`/`R` selects direction on each upward advance; an impacted brown cell holds the same steering through its full collision before proceeding.

- Common approach: `LLLLLL`.
- Funded shortcut: `RRRRRRRRLLLLLLLL`.
- Safe alternative: `LLLRLLRLRRLRRLRR`.
- Shared finish approach: `RRRRLLLLRR`.

`route-review.png` is an optional review overlay: blue is the safe replay; gold is the funded replay. `actual-map.png` and the native JSON have no route traces or debug markers.

## Causal proof from the real shared core

`validation.ts` imports `validateLevel`, `importLevel`, `startRun`, `advanceRun`, and `solve` from the actual editor core. It neither copies nor rewrites those mechanics. The typed validation, both intended replays, and three exhaustive searches pass.

| Core result | Stars | Score | Turns | Crashes | Lives | Time |
|---|---:|---:|---:|---:|---:|---:|
| Funded shortcut | 3 | 1175 | 6 | 3 | 1 | 280 |
| Safe route | 3 | 1145 | 12 | 0 | 4 | 256 |
| Shortcut with heart removed | 1 | 415 | 2 | 3 | 0 | 136 |

Every reversal halves the next movement's multiplier. The six extra safe-route reversals cost 30 points at speed 2. The dirt route incurs three collision tocks, so it takes more game time; its benefit is the higher score from fewer turns. The puzzle makes no claim that dirt speeds up the clock. There are no timer phases, waiting moves, artificial delays, switches or exclusive reward bribes.

The native-format level's damage-enabled score search is **optimal**, 922 states, 1175 points and 3 stars. Replacing the heart with empty space gives an **optimal** damage-enabled search, 555 states, 1145 points and 3 stars: the best score falls to the safe route. Replacing the dirt shortcut with permanent metal gives an **optimal** no-damage search, 73 states, also 1145 points and 3 stars. All solver paths are replayed through `advanceRun`, and the replay results are saved. Thus health causally buys the best score; the safe all-star completion remains available.

The root agent owns the native fixes making authored story hearts deterministic and collision turning consume full damage. This puzzle's health proof assumes those fixes and full collision damage. Native GUI/device acceptance is separate from this deterministic original-sprite JSON render and typed-core evidence.

## Reproduction

From this directory, `python3 author.py` writes the native JSON and route strings. Run `/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsx validation.ts`, then `python3 render.py`. Strict type validation uses `/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsc -p tsconfig.json`. No dependencies were installed, and no shared files, packs, native resources or Git state were changed by this worker.
