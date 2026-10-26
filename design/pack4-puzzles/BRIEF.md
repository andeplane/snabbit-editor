# Pack 4: ten actual puzzles

User requires this order for EVERY level:
1. Use built-in ImageGen to suggest its visual composition.
2. Model the image as native JSON in the editor; compare actual game rendering with the image.
3. Implement the trick in the level, prove it is meaningful, and replay a winning path.

Preserve the five accepted introductory levels (4002–4006); these ten follow them,
IDs4007–4016. Keep the original diagnostic4001 last. Each worker writes ONLY its
assigned `design/pack4-puzzles/puzzle-NN/` directory. Root integrates JSON, updates
native/hosted resources, tests, commits and PRs. No worker may edit shared source,
pack files, existing levels, root test files, or install/push.

## Visual direction

Study actual opening levels from packs10/20/30 and the accepted redesigns. Use:
- `design/pack4-redesign/references/pack{1,2,3}-openings.png`
- `design/pack4-redesign/level-1/source-sprites.png`
- actual sprites in `/Users/anderhaf/repos/snabbit/Resources/World/Space/`
- chunky lever `/Users/anderhaf/repos/snabbit/Resources/World/Switches/switch-off.png`
  and `switch-on.png`

Inspect image refs with view_image before image_gen. Read imagegen skill at
`/Users/anderhaf/.codex/skills/.system/imagegen/SKILL.md`. Use built-in image_gen,
one call per map. No CLI fallback. Save unchanged high-resolution concept.png,
exact prompt.json including reference paths and saved generated source path.
Image must be created BEFORE authoring JSON, not a post-hoc illustration.

Organic asymmetric asteroid masses, chipped crescents, varied hollows and airy
negative space. Avoid repeated full-width wall strips, identical chambers,
regular zigzags or constant gem rails. User rejected those. Existing game art,
not a new art style. No permanent colored/debug markers on actual wall blocks.
Puzzle information must be visible before commitment, through composition and
locally demonstrated cause/effect. Concepts may explain in notes, not on-board
letter/color coding absent from game. Distinct silhouettes across ten levels.

## Actual mechanics

Read native `Run.m`, `Track.m`, `GameConfig.h` in
`/Users/anderhaf/repos/snabbit-pack4-levels/Classes/` and shared typed core:
`src/core/{simulation,serialization,solver,timer}.ts` in snabbit-editor.

- Start row0,col9 wrapped to width, directionright, 3 lives, speed2.
- Snake advances upward only; chooses left/right. Horizontal edges wrap.
- No backtracking, standing still or longer same-row detour to consume time.
- Timer time advances8 per movement/collision tock. Turbo/focus affects real
  pacing, not normal per-row arrival phase. A brown dirt collision adds a tock.
- Dirt char3 HP1, rock2 HP2, metal1 HP200. Ordinary hit costs health and time.
  Native queued turning during collision can shorten life drain: avoid fragile
  exact-budget tricks based on turning during impact; root checks native parity.
- Hearts char6 grow health one decision after pickup. Twelve blue gems char4
  produce a heart through combo, also delayed. Combo expires after120frames
  without a gem; FPT determines frame cost. Prove resource available BEFORE use.
- Stars8, three per level; diamond9 optional; finish7 should fit composition.
- '=' lever; switches.data flatindex -> channel A-H; defaultA.
- gates.data maps obstacle index to ONE channel; each gate=timerState XOR bit.
  Initial bits0. Same-channel switches toggle, not set-on. All independent gates
  can be composed via geometry; do not assume native multi-channel AND blocks.
- Initially-off gates can use long timer state0 (e.g. valid durations32767).
  Timer params are [startState,onDuration,offDuration,rowDelay,colDelay,ownDelay].
- Gate collision state FREEZES when first touched. Never propose waiting against
  a contacted timed gate until it opens. Delay must precede a DIFFERENT gate.
- Controls, mode and sources strongly typed. No copied/rewritten simulation.

Small local validation can use:
`/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsx YOUR/validate.ts`
Pure shared-core imports work without node_modules in standalone checkout.
Heavy all-level search/test suites root batches on home-mini via codex-home.
Use solve({allowDamage:true,maxStates:...}) for resource puzzles; state space can
be large. Establish/replay an authored intended route FIRST; root can run costly
search. Do not mislabel limited searches as optimal or test only intended route.

## Mandatory deliverables

- concept.png, prompt.json, level.json (validated native format)
- design-notes.md: intended discovery, visible cues, original-image translation,
  any deliberate deviation, intended route, exactly why the special trick matters
- validation.ts (strict typed imports actual shared core), validation.json:
  winning replay3stars/finished with lives/score/time/crashes/switch events,
  wrong-choice or counterfactual proof (remove combo reward, choose wrong lever,
  skip required toggle, remove delay etc.) showing intended objective unavailable
- actual-map.png and comparison.png rendered from REAL JSON with original sprites
  (a deterministic renderer is allowed; never edit the generated concept image)
- If engine feature truly missing, describe exact missing behavior and notifyroot;
  do NOT silently fake it with metadata or unsupported JSON.

## Assignments

01 /4007 Three Switches, One Door: parity. First+last toggles compulsory, middle
optional; all3needed to leave final gate open. Distinct sculpted route, not3strips.
02 /4008 Borrowed Passage: early toggle opens near crossing but closes a later
opposite-state crossing; choose branch with reset before it becomes inaccessible.
03 /4009 Buy One Beat: an intentional dirt hit shifts arrival at a later untouched
alive gate into safe phase. Heart funds hit; clean detour same rows cannot wait.
04 /4010 Reverse the Rhythm: switch inversion combines with different timer phases
at successive crossings; choose whether/when to reset rather than 'opens forever'.
05 /4011 Program the Exit: choose initial2channel state accounting for unavoidable
futuretoggle. Solve backward; final required state different from preparation.
06 /4012 Earn the Way Through: USER EXPLICIT EXAMPLE. Collect enough blue gems for
combo-heart, REQUIRED to survive brown-wall passage to reward. No loose heart
substitution. Choice of reachable gem clusters matters. Prove disabling combo
reward loses intended objective; make all costs legible before commitment.
07 /4013 Leave the Refund: tempting heart lies on another same-channel switch;
taking it corrupts needed state and forces an unaffordable dirt bypass. Skipgift.
08 /4014 One Lever Only: USER EXPLICIT EXAMPLE. Choose lever1/2/3; selection actually
closes access to later alternatives (not merely different bits). Best choice opens
costly downstream obstacle; other choices offer inferior/blocked resource futures.
Use existing single-channel gates composed spatially, or report needed feature.
09 /4015 No Credit: choose heartnow or switch promising rich heartcachelater;
brown toll occurs BEFORE future reward. Resource ordering, not just total health.
10 /4016 Spend a Heart, Save Turns: comparable star routes, one safe with many
turns, one dirt shortcut funded by heart/gems. Health buys fewer score penalties.
Prove score/reward advantage and survival, not an arbitrary forced damage tax.
