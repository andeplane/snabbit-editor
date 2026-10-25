# Level 5 — Twin Moon Garden (`4006`)

This is a new image-led composition, not a modification of the rejected Pack 4 generator. `prompt.json` contains the exact built-in ImageGen prompt and reference paths. `concept.png` is the unchanged generated output. The concept was generated before `author.py` or `level.json` was written.

## Source study and composition

I inspected serialized openings in all three original packs (`10`, `20`, `30`) and the rendered original-opening sheets. Specifically, the first five serialized levels of each pack were examined: 168/205/138/228/206; 214/141/163/164/143; 236/238/240/258/242. The first three full-map sprite sheets for each pack were also viewed. The useful cues were chipped continuous masses and negative-space flow from pack 1, weathered mixed-material fragments and local reward pockets from pack 2, and small mechanic clusters separated by breathing room from pack 3. I viewed the actual stone/gem/star/diamond/chunky lever sprite reference before ImageGen.

The real map translates the generated lower-left and upper-right opposing crescent composition onto the native 16-column staggered hex lattice. The lower crescent is squat and broad with a compact gate lip; the upper one has a longer falling tail and a more fragmented hooked crown. The islands are unequal, offset, and separated by a broad navigable diagonal. Original-style chipped holes, weathered rock faces and sparse satellites prevent smooth geometric repetition. Both levers remain outside the main body where their significance is legible. The optional diamond sits in the outer eddy of the upper island.

The concept's rounded forms are intentionally chipped and more angular in the discrete playable grid. The finish uses three offset cells between small floating tufts rather than a long bar. There are no repeated width bands or twin corridor rails. The 68-row map has 869 empty cells of 1,088 (79.9%); all 204 obstacle cells form the two compositions and sparse satellites. The authored finish is reached at row 64.

`map-render.png` was rendered from the actual JSON with original source PNGs and inspected beside `concept.png`; `route-review.png` shows the proven route on that same render. Thin amber gate circles and the route line are review annotations, not additions to game artwork.

## Mechanical design

Exactly three stars: `(20,4)`, `(45,11)`, `(59,10)` (row, column). Exactly two switches: A `(13,7)` and B `(37,7)`. Channel A opens the lower crescent's diagonal lip `(16,6)`, `(17,5)`, `(18,4)`; B opens the small upper hollow floor `(43,10..12)`. Both groups use obstacle gates, not collectible visibility. There are no timers: this short finale combines the two switch decisions without a new timing demand.

The first star is in the lower hollow behind A. The second star is in the upper hollow behind B. The third is in clear space above the islands. The top-right diamond `(51,14)` is optional; removing its reward still yields a zero-damage three-star route. The levers influence local passages and rewards; finishing without all stars remains a valid player choice.

## Shared-core proof

`validate.ts` imports the real `importLevel`, `solve`, `startRun` and `advanceRun` from `src/core`. It uses the native `(row0,col9,directionRight)` start, upward-only left/right movement and horizontal wrap. Every returned step was replayed through `advanceRun`, with exact row/column agreement and no collisions. Local small validation completed successfully; broad tests are owned by the integrating agent.

Result: `optimal`, 1,082 expanded states; **3 stars, 1 diamond, 0 crashes, 9 turns, finished**, score 3,485. Both switches are actually visited, and replay mask progresses `0 → A → A+B`. Finish triggers when leaving the authored finish at `(64,10)`, time 520. `validation.json` preserves every route point and mutation-check results.

The intended successful route is:

- Begin right to `(4,11)`, then gently cross left toward the first lever `(13,7)`.
- Turn left off A, crossing its local diagonal gate into the lower crescent's first star `(20,4)`.
- Sweep right through the middle to `(30,9)`, bend left briefly, then take B `(37,7)` and continue right through the upper hollow's opened floor to star `(45,11)`.
- Continue to the optional diamond `(51,14)`, then turn left across the open upper sky through star `(59,10)`.
- Make the small final adjustment into the floating finish tuft opening at `(64,10)`.

A deletion check removes each physical lever in turn and re-solves with the actual core: removing A reduces the best completed route to two stars; removing B reduces it to one star. A separate reward-prioritized solve (stars temporarily valued as diamonds; original diamond reward removed) confirms those reachable-star counts for those modified boards. These are editor-core results, not claims of physical-device playtesting.

The small validator also passed strict TypeScript checking against the actual shared core using the already installed editor dependencies, with `--strict --noEmit --moduleResolution bundler`, explicit dependency type roots/base URL. No install or shared-file changes were made.
