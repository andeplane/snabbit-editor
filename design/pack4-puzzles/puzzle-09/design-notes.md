# No Credit · 4015

The trap promises three hearts later while the right choice supplies only one now. The toll must be paid before the cache can be reached. Initial health is three; crossing the three dirt blocks costs three. The immediate heart grows health to four well before the toll, leaving one life afterward. The right lever opens the later cache, but its future three hearts cannot pay an earlier fatal third collision.

## Image first, then model, then mechanics

The built-in ImageGen concept was generated before any JSON. `prompt.json` preserves its exact prompt, reference files and generated source path; `concept.png` is an unchanged copy. `composition-model.json` and `composition-map.png` preserve the first native-grid translation before adding the dirt toll. The native-sprite comparison was inspected before implementation. `level.json`, `actual-map.png`, `after-toggle.png` and `comparison.png` are the final implementation.

The translation retains the large chipped left crescent, small right lobe, two competing pickups near its foot, a three-cell earth throat, a separate upper-right heart pod and open upper sky. The generated hearts are pink; actual original game hearts are orange and are used unchanged. The illustrated three adjacent earth cells become three separated collisions in one narrow throat, so all three costs remain separately readable. The horn has more chunky texture and the top is airier in JSON. The conceptual green switch inside the cache is omitted: it would imply an unsupported second mechanic. The actual orange lever opens the cache's single metal entrance; `after-toggle.png` shows that real gate becoming small. No permanent debug markers appear on blocks.

## Discovery and route

The early heart and the orange lever are on the same row 10, at columns 7 and 12. Upward-only motion makes them mutually exclusive. The heart has an open approach in the left lobe. Both choices lead toward the visible earth throat. The curved asteroid mass spans the horizontal wrap seam and is thick enough to prevent slipping around it; the only affordable crossing is column 10. The upper cache is visibly later than the toll and has three original heart sprites behind a metal entrance.

Choose the modest heart, collect star 1 at row 17/column 10, and maintain the narrow throat through dirt at rows 20, 22 and 24/column 10. Leave the expensive cache shut. Collect star 2 at row 36/column 8 and star 3 at row 49/column 12, then finish at row 56. Full decision-level routes and resource events are in `validation.json`.

Heart pickup is processed leaving row 10: growth is pending at time 88 and health is four at time 96, well before the first toll. The authored replay finishes with three stars, one life, three crashes, score 1370 and time 480. A separate shared-core `solve({allowDamage:true})` search proves the score optimum on this board is 1395, with 11 turns and the same three crashes.

## Why the trick matters

Removing the immediate heart exhausts all resource-aware shared-core reachable states without any finish. An actual clean three-life prefix to the right lever also exhausts every continuation without the intended objective. This is not an assertion based on one failed steering sequence. The search includes both controls during collisions and horizontal wrap.

A separate counterfactual grants one borrowed life at the lever. That route now pays all three tolls, opens the actual cache gate and reaches row 39 with four lives: the three later hearts really are obtainable and valuable, merely too late to fund the toll. Its complete route is recorded. No loose-heart substitution, combo mechanic, wall recoloring, timer waiting or metadata-only effect is used.

The exhaustive reachability search imports the real typed shared core and omits score and elapsed time only from its deduplication key: this board has no timers, gems or speed changes, so neither value affects reachability. This proves the resource ordering in the core. Native authored-heart determinism and full collision health spending are being brought into parity by root; physical-device/native play acceptance remains root integration work.

Run `validation.ts` with the shared installed `tsx`. `render.py` uses the original native sprite PNGs and real flat JSON, with native staggered-row positions. `model.py` then `implement.py` reproduce the two-stage level authoring.
