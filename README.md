[Open Snabbit Workshop](https://andeplane.github.io/snabbit-editor/) · [CI/CD](https://github.com/andeplane/snabbit-editor/actions)

# Snabbit Workshop

## Jobs to be done

1. **Understand a level before changing it.** Browse the story packs and Pack 4 fixture, see the
   original graphics and upward travel, inspect coordinates and timer phases.
2. **Build an idea without fighting tools.** Paint continuous strokes, erase,
   draw lines/rectangles, select and repeat sections, and undo a whole gesture.
   Numbered menus show the available next keys; text inputs own their keys.
3. **Design a timed passage with confidence.** Arrival view freezes each block
   at its own collision time, `8 × row`, for an uninterrupted run. Live view
   shows one global time. A collision adds time; playtesting exposes that change.
4. **Understand the best route.** A scoring-aware A\* search runs off the UI
   thread. Its result states whether optimality was proved. Cancellation and
   edits cannot leave an outdated route on screen.
5. **Try, adjust, repeat.** Enter playtest with one key, steer with arrows,
   pause/step/restart, see success/death, then return to the exact editing view.
6. **Keep and deliver work.** Browser drafts survive reload and level changes.
   Export single levels or a complete pack collection without stripping metadata.
   Source files are never silently overwritten.

## Implementation plan

- Establish validated level serialization, a bundled asset/library build step,
  draft recovery, and metadata-preserving exports.
- Port movement, horizontal wrap, collision timing, score multiplier, pickups,
  speed, hearts, and combo rules from `Run.m`, `Track.m`, and `GameConfig.h`.
- Build frozen arrival/live/layout views, a cancellable A\* worker, and playtest
  using the same core rules.
- Replace the prototype UI with a level library, tool/palette menus, canvas
  navigation, grouped history, selection operations, timer inspector, and help.
- Validate core rules and solver against independent fixtures, all bundled
  levels, production build, and browser interaction/visual checks.

## Run

From `editor/`: `npm ci`, then `npm run dev`. Open the printed local URL.
`npm run build` makes a standalone `dist/`; `npm run preview` serves it.
`npm test` runs the rule/solver/serialization/history regression suite.
`npm run test:ui` runs the typed DOM interaction tests. `npm run test:coverage`
requires at least 98% statements, branches, functions, and lines across all
application TypeScript/TSX and the repository save service. Type declarations
contain no executable code and are excluded. `npm run typecheck` also checks
the tests under strict TypeScript settings. Real-browser visuals and interaction
are checked separately; coverage alone does not establish UX quality.

`predev` / `prebuild` copy the original artwork and story data from this checkout
into ignored `public/assets/`. This works in isolated home-worker checkouts and
includes the artwork in the production build without relying on symlinks.

## Rules and boundaries

The playtest models decisions at game tock boundaries. Left/right choose the
next diagonal; holding a direction does not repeatedly turn. Both edges wrap.
The starting cell is row 0, column 9 (wrapped for narrow custom levels), heading
right, at speed 2. Score starts with multiplier 0, each turn halves the current
multiplier, and moving resets it to `0.15 × previous speed + 0.7`. Stars add
300; diamonds add 2,000. Gems grow a combo, with a life after 12 gems and a
120-frame timeout. Timed collision states freeze when first touched, as in the
game. Only obstacle collisions consult timers; collectible timers are visual.

The browser preview reproduces game rules at these decision boundaries; native
sub-frame tap buffering, particle simulation, blinking, and audio are not an
emulation of Cocos2D. Native/device acceptance remains the final check for a
released level. Original artwork is rendered upright using its source size;
block flips use stable variants because the native game randomizes them.

Drafts live in this browser's local storage. Download exports for durable copies.
Import accepts the game's JSON format; `.gz` story files can be decompressed
before import. Imported unknown metadata is preserved. Switches use `=` plus `switches.data` index-to-channel mappings (default A);
`gates.data` links ordinary obstacles to channels A–H. A switch flips a per-run
bit, XORed with the gate’s timer state. Channel links, timing, score search,
playtest and restart all use the same level JSON as the native Pack 4 fixture.

## Dependency boundaries

`createEditorStore` accepts storage, ID generation and scheduling ports. The
repository service accepts fetch/download ports, the server accepts filesystem
and clock ports, the solver hook accepts a worker port, canvas animation accepts
frame/resize ports, and rendering accepts a small drawing port and image assets.
Typed tests exercise those contracts with deterministic dependencies. Original
level and pack metadata survives an import/export round trip.

## Save to the checkout

When running `npm run dev`, the library loads the current paid story JSON directly
from `game-resources/Levels/data/storyData.txt`. **Save to repo** (`⌘S`) writes both
that JSON and its gzip, creates a previous-file backup in `.editor-backups/`, and
rejects stale saves if another process changed the file. It does not write the
free-version data. A standalone build loads its bundled snapshot and offers JSON
downloads. Local browser drafts never overwrite source files automatically.

## Deployment

Pushes to `main` run strict type checking, the complete typed test suite with
98% minimum coverage for every aggregate metric, and a production build under
`/snabbit-editor/`. Browser smoke tests use the runner’s preinstalled Chrome and verify images, the A\* worker, animated
playtest completion, keyboard menus, Pack4 and JSON downloads. Only then does
the verified build deploy to GitHub Pages. Pull requests run the same checks
without deploying. Test and coverage reports are retained as Actions artifacts.

The deployed site keeps drafts in your browser and downloads JSON. Local source
saving is available with `npm run dev`; in this standalone repository it updates
the resource snapshot under `game-resources/`. Transfer the exported level JSON
into the native Snabbit checkout when preparing a game build. The original
monorepo editor can still target its sibling native `Resources/` directory.

To run the browser checks locally: `npm run build -- --base=/snabbit-editor/`,
`npx playwright install chromium`, then `npm run test:browser`.
