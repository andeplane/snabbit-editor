# Ten puzzle levels: concept → playable JSON → proof

These ten levels follow the five Pack 4 introductions. The original diagnostic
fixture remains last. Native/editor campaign order is 4002–4016, then 4001.

Run `npm run dev` and open `/snabbit-editor/puzzle-review.html` for the interactive
comparison. Every level has its untouched ImageGen concept beside the actual
editor renderer; play/pause, reset and scrub a verified solution. The review
uses an isolated injected store and never changes saved editor drafts. Each
`puzzle-XX` folder contains the prompt/provenance, authored JSON, a static
comparison, design translation notes, a typed validator and its proof report.
The original concept suggests composition; the playable version adapts it to
the game's offset grid, collision rules and three-star objective.

| ID | Level | What makes the puzzle work |
|---|---|---|
|4007|Three Switches, One Door|Optional middle switch changes parity; skipping it leaves the final door closed.|
|4008|Borrowed Passage|Open the near passage, then use the reachable reset before the opposite-state far gate.|
|4009|Buy One Beat|Spend an extra collision to change arrival time at a timed wall. Its state freezes at first contact.|
|4010|Reverse the Rhythm|Two identical timer cycles need opposite switch states at their different arrival times.|
|4011|Program the Exit|Set two channels in advance of an unavoidable toggle; only the correct prepared state opens the exit.|
|4012|Earn the Way Through|Collect twelve gems without breaking the combo; the earned heart funds three brown-block hits.|
|4013|Leave the Refund|A tempting heart comes with a switch that closes the useful passage; its detour leaves too little health for the final toll.|
|4014|One Lever Only|Selecting one of three lever bays closes the later bays. Only the middle reward funds five brown-block hits.|
|4015|No Credit|A cache after the toll is too late to pay for it. Take the earlier heart instead of the promising lever.|
|4016|Spend a Heart, Save Turns|A funded brown shortcut scores 1175 with six turns; the safe twelve-turn route scores 1145.|

## Validation

- `npm run typecheck` checks the editor, tests and all ten validators strictly.
- `npm run test:puzzles` replays intended solutions and counterfactuals. Removing
  a required heart, resetting the wrong channel or taking a tempting branch must
  change the result. Exhaustive reachability searches prove the key exclusions;
  exact state counts and assumptions are in each `validation.json`.
- `npm run test:coverage`: 231 strongly typed tests; 100% statements, lines and
  functions, 98.54% branches across production editor/server code.
- Browser checks exercise A*, animated replay, earned-heart growth, JSON export,
  keyboard menus, and all ten concept/replay comparisons in the production build.
- `native-parity.json`: all ten solutions match real Objective-C Run methods at
  **493 decision boundaries / 4930 frames**, including health, score, timer phase,
  switch mask, combo, growth and collision state. The harness extracts production
  method bodies and injects renderer/audio/service doubles.

The native fix requires a full collision tock before applying a queued turn;
otherwise rapid tapping could evade the resource cost used by these puzzles.
Normal story loading already keeps authored hearts; its lazy fallback now states
that policy explicitly, while survival keeps its probability/spacing behavior.

Re-run the native proof from the game checkout:

```sh
python3 tests/run_resource_regressions.py \
  --puzzle-root design/pack4-puzzles \
  --editor-root /absolute/path/to/snabbit-editor \
  --json-report /tmp/snabbit-native-parity.json
```

The iPhone build passed resource/signature checks and was installed with all
sixteen Pack 4 entries. Cold-launch verification was blocked by the locked
phone; physical puzzle play remains a separate acceptance check.
