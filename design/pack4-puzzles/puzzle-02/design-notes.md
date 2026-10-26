# 4008 — Borrowed Passage

The discovery is that an opening is borrowed, not permanently earned. The first same-channel lever trades two local crossing states: the low metal pair disappears while an initially small/inactive pair at the upper knot becomes solid. The reset is on the left branch, and the fork makes access to it expire geometrically. The generous right branch and its loose heart are a viable lesser-reward choice, but do not fix the switch state. The puzzle is about planning the next toggle before passing the last route that reaches it.

ImageGen was called before `create.py` or `level.json` existed. `concept.png` is the unchanged generated source; `prompt.json` contains its exact prompt, all reference paths, and saved generated source path. I inspected original pack 10/20/30 opening contact sheets and the accepted introductory redesign before generating. Their chipped landforms, variable hollows and detached pebbles informed the silhouettes.

The native translation keeps the image's chipped low base, small right-shoulder opening, long forked hollow, reset on the left shore, optional resource on the right, and smaller upper knot. It compresses the concept's stretched vertical spacing into 46 real rows, keeping the fork and upper consequence close enough to inspect together. Subcell rock chips become normal native cells. The image generator drew a diamond where the prompt requested a heart; the JSON deliberately uses a heart so the temptation does not outweigh the three-star solution in the score objective. There are only three cyan gems, no guiding gem rail, and no debug/channel colors on actual blocks.

`actual-map.png` renders the real JSON using original game PNGs and the native 2:1 horizontal/vertical offset geometry. Initially-off gates appear at 0.4 scale with 80% opacity, as native block rendering does. `after-toggle.png` shows the real first-toggle consequences with the same source sprites. `comparison.png` is a separate contact sheet; the generated image is never edited.

## Intended route

1. Start at native (0,9), direction right. Reach the first lever at (8,8). It changes A from 0 to 1.
2. Cross the newly opened pair at row 14, columns 9/10; collect star 1 at (15,9).
3. Approach the fork at (17,8). Choose left into (18,8), then remain on the left branch to reach the reset at (24,5). The right option enters (18,9) and leaves that reset unreachable.
4. The reset changes A from 1 to 0. Curve upward into star 2 at (30,8).
5. Cross the upper pair at (33,6)/(33,7), now open again, and collect star 3 at (34,7). Finish at (41,8).

The upper pair uses valid long-duration initially-off timer entries `[0,32767,32767,0,0,0]`, independently inverted by A. It does not rely on multi-channel gates, waiting against a contacted gate, speed-to-phase changes, or collision-turn health quirks.

## Why the decision matters

At (17,8), native offset navigation gives the two successors (18,8) and (18,9). The reset is six rows later, at (24,5). Six upward steps can move at most three columns left. The left branch can reach column 5; the right branch can reach no farther left than column 6. Horizontal wrap is included and cannot cover the alternative distance. There is no later reset, backtracking or same-row detour.

A local exhaustive search of all real-core collision-free continuations after the wrong commitment expanded 269 states. It never reached the reset and never obtained three stars. A finish remained available, with one star; its maximum collected-star count before abandoning the closed upper region was two. Removing the reset from the entire board separately produced an optimal two-star finish. Removing the early lever also limited the optimal finish to two stars. Thus neither toggle is decorative and the reset branch is not merely a preferred gem route.

Damage cannot rescue the wrong channel state: each gate is metal HP 200. Starting health is 3, with one optional heart for a maximum of 4, and the three gems cannot create a combo heart. Extra collision time stays far below the first 32767-tick phase boundary. Collisions do not create additional horizontal movement before the reset row.

## Validation

`validation.ts` imports real shared-core `importLevel`, `startRun`, `advanceRun`, `obstacleHP` and `solve`, with strict TypeScript checking. An authored waypoint replay was established before score search. It finished with 3 stars, 3 lives, zero crashes and time 336. The score solver then proved an optimal 1,245-point route, 11 turns, 3 stars, zero crashes, with 331 expanded states; its full path was replayed successfully. Switch events occur while leaving (8,8) at time 72 and (24,5) at time 200.

`validation.json` preserves the full authored and solver paths, replay state, switch events, gate truth table, counterfactual results and damage-budget argument. Small local validation used the existing `/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/{tsc,tsx}` runtime, with no dependency installation. Native playtesting/integration and heavy all-level checks remain the parent task's scope.
