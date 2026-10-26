# The Hollow Orchard — Pack 4 level 4

Final native ID: **4005**. Width 16, height 109; row 0 is the bottom. The native start is `(row 0, col 9, right)`.

## Image first

`concept.png` is the unchanged output of the built-in image_gen tool. `prompt.json` records the exact prompt sent to it. Generated source: `/Users/anderhaf/.codex/generated_images/01a174df-094e-7900-8ebd-617656587466/exec-c4a4f341-26a0-478b-8bbd-bc9e6c3fa056.png`.

The image was made before native level authoring. Its faceted hollow courtyards, small arch mouths, loose stone islands and sparse jewel clusters drove the JSON translation. The translation stretches the composition into the game's true staggered-grid proportions and raises the two upper side pockets into successive playable heights. The upper three pockets lean left by unequal amounts rather than repeating the lower right/left sweep. Native movement always advances upward, with diagonal left/right choices and horizontal wrap.

## Original levels studied

Read the actual first three level objects from **each** original storyData pack: Pack 10 (`Easy lab`, `Easy Early`, `1-8`), Pack 20 (`Dirtrock`, `Cool dirtcrash`, `Dirty Lab`), Pack 30 (`Its alive!`, `Angled timing`, `Timegrid 2`). Also viewed the contact sheets for all three packs and the real source-sprite sheet before translation. The main compositional lessons were Pack 10's big irregular negative spaces, Pack 20's loose walls/islands and jewel clusters, and Pack 30's very short obstacle openings. No rejected level scripts or prior Pack 4 layouts were consulted.

## Play structure

Five different lever channels A–E unlock five short arch mouths in succession. The levers sit in open pockets where a player can see them and steer toward them; each next mouth remains sealed until its lever is hit. White shell walls stay continuous so the outside of the landform cannot bypass the gates. Dark grey stones sit in the outer shoulders. Several small interior crags make the rooms unequal and leave visual breathing space.

The first star is in the lower-left hollow, the second on the approach to the small crooked middle pocket, and the third in the broad summit garden. The late diamond sits on a reachable approach to that last star. Gems form short irregular knots with quiet gaps, not a cell-by-cell rail. The finish is a three-cell summit opening.

## Verification

`validate.ts` uses the **actual shared** typed `importLevel`, `solve`, `startRun` and `advanceRun`; it does not copy or reimplement their logic. Local small check ran with `/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsx` and passed. `validation.json` saves the complete route and replay evidence.

- Solver: **optimal**, 950 expanded states, score **3885**, **10 turns**.
- Replay: finished, **3 stars**, **0 crashes**, all **3 lives**, **1 diamond**, **7 gems**, switch mask **31** (all five channels activated).
- Independently remove A, B, C, D or E's lever: in **every** case the zero-damage finish becomes **unreachable**, proving all five required levers matter.
- `native-map.png` is an original-sprite render of the saved JSON plus a subtle verified route. This checks shape and positions, not physical device acceptance or a deployed build.

`author.py` and `render.py` are confined to this directory for reproducibility. No shared story data, source files, commits, push or release changes were made here. Root integration and the home-mini batch suite remain separate steps.
