# Two Quiet Shores — level 4003

The built-in image generator was used before writing the grid. `concept.png` is the unchanged high-resolution result; `prompt.json` records the exact prompt, source references and tool mode. The actual translated board is `level.json`, with original-sprite `map.png` and a separate `route.png` overlay. `create.py` and `render.py` make those deterministic deliverables reproducible.

The reference study used the real first three levels of each earlier pack from `game-resources/Levels/data/storyData.txt`: pack 10 IDs 168/205/138; pack 20 IDs 214/141/163; pack 30 IDs 236/238/240. The design takes the irregular holes, detached chips and asymmetric shorelines visible in the first two packs, with the calm spaces between interactions from the third. It deliberately does not copy pack 30's repeated barrier, zigzag or diamond patterns.

The lower arrangement is an uneven long island with a broken diagonal shoulder and a small detached reward pocket. The upper arrangement is two unequal fragmented shores around a broad courtyard. The large middle breathing space, distant second star and sparse pebble satellites preserve the generated composition. The 16-column grid simplifies the generated image's small subcell rock chips into actual native cells. Only two gate cells at each pocket change state; all ordinary landforms remain natural clusters rather than switch walls.

Intended journey, using row 0 at the bottom:

- Start at native row 0, column 9, heading right. Curve left briefly around the lower island's foot, then approach lever A at (12,10) from the open right shore.
- Lever A removes the two local predecessor boulders at (16,11)/(16,12), allowing the first star at (17,11). Leaving A alone remains a viable lower-reward finish choice.
- Drift out across the open middle courtyard, choosing which side of isolated chips to pass. The second star sits at (33,11), away from the lower pocket. Small cyan gem pairs offer optional deviations and do not form a rail.
- Sweep left toward lever B at (45,5), then arc into the upper courtyard. B removes the local two-cell breach at (56,8)/(56,9) before the sheltered third star at (57,8).
- Leave the broken upper shores for the small goal at row 66, columns 7/8. There is no full-width finish stripe.

`validation.json` contains the complete solver route and replay evidence. The shared core's `importLevel`, `solve`, `startRun` and `advanceRun` report an optimal 1,510-point route, 3 stars, zero crashes, 3 lives and both channels active (mask 3), after 1,291 expanded states. The route uses 9 turns. Disabling either lever independently leaves a finish route but reduces the attainable star count to 2, establishing both local reward effects without artificial full-map barriers.

Validation ran with the existing dependency runtime at `/Users/anderhaf/repos/snabbit/editor/node_modules/.bin/tsx`; no installation occurred. Strict TypeScript checking passed with the adjacent `tsconfig.json`, using the same runtime's `tsc`. These are shared-core and source-sprite rendering checks; native integration and playtesting remain with the parent task.
