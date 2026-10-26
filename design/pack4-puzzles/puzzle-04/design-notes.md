# Reverse the Rhythm — 4010

Native size: **16 × 66**. Start row0,col9,right; 3 lives, speed2. Only upward left/right movement and the native horizontal wrap are used.

## Intended discovery

The first lever teaches that the living stone arch's rhythm can be inverted. The next arch belongs to that same rhythm, but normal upward travel reaches it in the opposite half of the cycle. Keeping the first inversion makes the later crossing solid. The player must take the second, same-channel lever to reset the rhythm **between** the crossings.

The first lever sits in the lower-right crescent, twelve rows before its arch. The second lies on the inner shoulder of the upper-left pocket, ten rows before the later arch. Both arch openings and their locally accessible levers fit within nearby rising views. Ordinary grey/orange/green lever art and the game's existing living-block animation provide the cause/effect; no color-coded gate art, letters, debug diamonds or route rails were added. The third star pulls the player left through the upper hollow and then toward the narrow exit. Visual readability during actual device play remains untested.

## Image-first translation

Read the brief and inspected all three original opening contact sheets, the original source-sprite sheet and accepted introductory level4. Built-in **image_gen** then created `concept.png` **before** the native JSON. `prompt.json` saves the exact prompt, all reference paths and the returned source path. The source was copied unchanged.

The image suggested a lower-right chipped crescent, a smaller central seed hollow, a large upper-left harp pocket and a little summit tip. Native geometry keeps that asymmetric silhouette and the interior seed. Grid conversion widens the upper neck into a short summit pocket to fit the diamond/finish, and moves the second lever below the upper crossing so it is actionable before commitment. Ten native gems replace the concept's more numerous jewels; they remain irregular clusters with gaps and cannot form a twelve-gem combo heart. Native levers use the real one-cell footprint rather than the concept's enlarged illustration size.

First authored the geometry and rendered `comparison.png` from the real JSON/original sprites, then viewed the concept and actual map side by side. Only after that comparison did `apply-mechanics.py` add the timer trick. Final `actual-map.png` / `comparison.png` were regenerated after validation. The static preview uses native shared-core visibility at clock64, mask0, when all four timed gate cells are visible. No timer or switch annotations are painted onto the board.

## Exact native trick

Both levers are channel **A**, at (12,12) and (38,7). The first changes mask0→1 on departure at time104; the second changes mask1→0 at time312. Both two-cell crossings use the **identical real timer** `[1,64,64,0,0,32]`; Track computes delay−96. This is a live 128-tick cycle, not a long-duration permanent gate.

| Crossing | Arrival | Native intrinsic phase | Required bit | Effective obstacle |
| --- | --- | --- | --- | --- |
| Row24, cols9–10 | time192 | ON, halfway through 64-tick ON half | 1 | OFF/passable |
| Row48, cols7–8 | time384 | OFF, halfway through 64-tick OFF half | 0 | OFF/passable |

At either crossing the wrong bit gives metal HP200. The next phase boundary is **32 ticks/four tocks** away. There are no hearts and only ten gems, so even deliberate earlier contacts cannot buy enough delay. More decisively, completed actual-core searches with damage allowed find **no surviving finish** after removing either required toggle. Native `Run.m` / `GameConfig.h` were also read: first contact freezes a gate's state, so holding against it cannot wait for it to open. Winning play never collides and does not depend on native queued-turn damage quirks, timer-speed changes, waiting, or backtracking.

## Winning route and proof

`validation.ts` imports the actual shared typed `importLevel`, `startRun`, `advanceRun`, `obstacleHP`, timer functions and `solve`. It first constructs and replays an authored route through these waypoints:

`(8,10) star → (12,12) invert → (24,9) first arch → (31,8) star → (38,7) reset → (42,5) star → (48,7) second arch → (56,9) diamond → (62,8) finish`.

The complete directions, per-step time/mask, switch events and counterfactuals are in `validation.json`.

- Authored replay: **finished, 3 stars, 3 lives, 0 crashes, 1 diamond**, score3445, time504.
- Independent zero-damage solver: **optimal**, score3450, 3 stars, 12 turns; 513 expanded states.
- Remove first inversion: clean finish unreachable; full damage-allowed search **unreachable**, 3400 states. Replaying the winning directions dies at row23/time216.
- Remove reset/keep inverted: clean finish unreachable; full damage-allowed search **unreachable**, 12534 states. Winning directions die at row47/time408.
- Replace timers with permanent ON gates: resetting now kills the authored route at the later arch; **keeping inversion** wins with 3 stars/0 crashes. This control proves the reset decision depends on the changing intrinsic phase rather than merely two compulsory permanent unlocks.

Local `tsx validation.ts` and strict `tsc -p tsconfig.json` both pass. These are shared-core replay/search checks plus a deterministic original-sprite render, not a claim of physical-device or native executable playtesting. Root owns final native parity/batch checks and shared-resource integration.

## Reproduce

`author.py` writes the final native level; `--geometry-only` recreates the pre-mechanics preview. `apply-mechanics.py` reapplies the timer parameters idempotently. Run `validation.ts`, then `render.py`. All files and generated outputs remain inside `puzzle-04`; no shared levels/source, installs, commits or pushes were changed by this worker.
