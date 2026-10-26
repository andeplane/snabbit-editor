# Earn the Way Through — 4012

The discovery is **earn usable health before spending it**. Twelve blue gems form a combo heart. The heart is the only extra life in this map and is required for the three-impact brown plug protecting the final star, diamond and finish. There are no loose hearts, replacement rewards, unsupported metadata or invented block types.

## Composition and choice

ImageGen was called first, using the original three opening-pack reference sheets and source-sprite sheet. The unchanged generated PNG is `concept.png`; `prompt.json` records the exact prompt, reference paths and generated source. JSON was authored afterward. `actual-map.png` is a deterministic rendering of that JSON with the repository's original Space PNG sprites, and `comparison.png` compares it with the concept.

The organic left crescent, airy middle, detached small asteroids, three separated gem pockets and upper reward hollow translate the concept. Deliberate mechanical changes: the concept's horizontal brown plug becomes a three-cell-deep diagonal throat (a horizontal row would cost only one hit); the upper hollow is fully enclosed so wrapping or approaching from the side cannot bypass the plug. The four gems in each concept pocket become a short collectible four-row arc on the real staggered grid. Two-gem alternatives were added opposite each four-gem arc, creating resource choices rather than a constant gem trail. The exact outline is hand-authored, asymmetric, and uses no permanent debug markings or painted gate colors.

Each gem band offers a complete four-gem pocket and an incompatible two-gem pocket. A player who chases the nearest isolated gems can reach the upper wall with only ten gems. There are eighteen blue gems on the map but at most four collectible per band. All twelve needed gems must therefore come from the three complete pockets; the alternatives cannot compensate for a missed pocket. No continuous gems connect the pockets. The final twelve-gem pickup occurs at row25; earned growth is applied at row27, four movement rows before first impact. At speed2 the inter-pocket pickup gaps are fifty frames, below the native 120-frame combo expiry.

The first and second stars sit in open lower and middle hollows. The third star and diamond are visibly enclosed above a legible three-deep brown throat. Existing combo sound/progress gives local feedback; no new labels or markers are placed on the map. The full-map comparison establishes composition, not native camera visibility. At the 49-row level height, all choices and the final cost are not simultaneously visible on an iPhone; a native camera replay still needs to check how early the upper cost becomes visible. The gem alternatives themselves are within their local preview. No claim of verified native advance visibility is made.

## Authored route

`authored-route.json` records cell-by-cell decisions. From native start row0,col9/right: continue right through row5; left through row9 (first four-gem pocket); right through row17 (second pocket); left through row25 (third pocket); right through row36 (including all three brown impacts); left through row40 to collect the diamond; right to the finish at row44. First star row3,col10; second row19,col12; final row37,col14. Dirt cells are (31,12), (32,13), (33,13). No switches or timers are used in this resource lesson.

## Actual shared-core validation

`validation.ts` strictly imports `importLevel`, `validateLevel`, `startRun`, and `advanceRun` from the actual shared core. No simulation is copied. The authored win is replayed first: finished, three stars, one diamond, twelve collected gems, three crashes, one remaining life, score3300, time384, six turns. The twelve-gem combo occurs at time208; life grows from3 to4 at time216; impacts complete at times256,272,288, reducing life to3,2,1. There are no switch events (mask0 throughout).

The same route with only earned combo growth disabled dies at the third dirt impact, with two stars and no diamond. A full decision-graph reachability traversal then proves no route can finish or reach the protected third star without combo growth. It imports and calls the real transition function, includes wrapped horizontal movement, both directions and damage, and deduplicates on every future-relevant state (absolute time is irrelevant because this board has no timers). This is exhaustive, not a capped solver result. Removing only the four-gem middle pocket, while preserving its two-gem alternative, is also exhaustively unable to reach the objective. A wrong-choice replay through the first two-gem pocket collects only ten gems and dies at the plug.

## Native engine limitation — requires parent integration

The frame-level native `Run.m` currently permits turning during collision before the full life drain completes. At speed2 a player can contact a dirt block (HP becomes0), turn into the adjacent metal after one frame, then reverse into the cleared dirt after another frame, paying approximately0.2 life instead of1. Merely putting metal beside the throat does not fix this. No health-margin level can simultaneously make three normal hits survivable only with one earned heart and make this shortened-hit path fatal.

Therefore the resource requirement is proven for the imported decision-boundary core, but **native frame-level causal acceptance remains pending the parent's collision-drain fix and replay**. The precise missing contract is that a confirmed collision must charge its full life/time cost before queued steering can resolve a different target, or an equivalent correction preserving the intended full-impact cost. Story loose-heart random filtering is separate and has no effect on this map (zero loose hearts). Do not call the native puzzle accepted solely from the core proof.

Reproduce with `python3 design/pack4-puzzles/puzzle-06/author.py`, then `/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsx design/pack4-puzzles/puzzle-06/validation.ts`, then `python3 design/pack4-puzzles/puzzle-06/render.py`. Strict typing: `/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsc -p design/pack4-puzzles/puzzle-06/tsconfig.json --noEmit`.
