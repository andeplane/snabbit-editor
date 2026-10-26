"""Hand-authored interpretation of concept.png; run only inside this design folder."""
import json
from pathlib import Path

OUT = Path(__file__).parent
W, H = 16, 55
grid = [['0'] * W for _ in range(H)]

# Individual authored silhouettes. Each string gives the nonempty cells of one
# horizontal hex row. Large areas have deliberate holes, bites and protrusions.
left = {
  1: [2,3], 2: [1,2,3], 3: [2,3,4], 4: [2,3,4,5],
  5: [3,4,5,6], 6: [2,3,4,5,6], 7: [1,2,3,5,6],
  8: [2,3,4,5,6,7], 9: [3,4,5,6,7], 10: [2,3,4,5,7],
  11: [1,2,3,4,5,6], 12: [1,2,3,4,5], 13: [1,2,4,5],
  14: [1,2,3,4], 15: [2,3,4], 16: [2,3,4,5],
  17: [3,4,5], 18: [3,4,5,6], 19: [4,5,6],
  20: [3,4,5,6], 21: [2,3,4,5], 22: [2,3,4,5],
  23: [2,3,4], 24: [3,4], 25: [3,4,5], 26: [6],
  27: [6], 28: [7], 29: [7,8], 30: [8], 31: [8],
  32: [4,5,6,7], 33: [3,4,5,6,7], 34: [2,3,4,5,7],
  35: [2,3,4,5,6], 36: [2,3,4,5,6], 37: [2,3,4,5],
  38: [1,2,3,4], 39: [2,3,4], 40: [2,3,4],
  41: [3,4], 42: [3,4,5], 43: [4,5], 44: [4,5,6],
  45: [5,6], 46: [5,6], 47: [6], 48: [6,7],
  49: [6], 50: [5],
}
right = {
  2: [13], 3: [12,13], 4: [12], 5: [13],
  10: [14], 11: [13], 12: [13,14], 13: [12,13,14],
  14: [11,12,13,14], 15: [12,13,14], 16: [13,14],
  17: [13,14,15], 18: [13,14], 19: [12,13,14],
  20: [12,13], 21: [12], 22: [10,11,12,13],
  23: [10,12,13,14], 24: [11,12,13], 25: [12,13,14],
  26: [13,14,15], 27: [12,13,14], 28: [13,14,15],
  29: [12,13,14,15], 30: [11,12,13,14], 31: [11,12,13],
  32: [11,12,13], 33: [11,12], 34: [12,13],
  35: [13,14], 36: [13,14], 37: [14,15], 38: [14,15],
  39: [14], 40: [13,14], 41: [13,14], 42: [12,13],
  43: [12,13,14], 44: [12,13], 45: [11,12,13],
  46: [11,12], 47: [10,11], 48: [10,11], 49: [10],
  50: [9],
}
for shape in [left, right]:
    for r, cols in shape.items():
        for c in cols: grid[r][c] = '1'
# A few dark stones and warm dust flecks, anchored in the original artwork.
for r,c in [(6,3),(10,4),(15,3),(19,5),(34,4),(37,3),(14,13),(28,14),(43,13)]: grid[r][c] = '2'
for r,c in [(7,2),(8,3),(22,12),(23,12)]: grid[r][c] = '3'
# Detached pebbles make this a floating garden, without closing its open bays.
for r,c in [(3,0),(7,15),(12,0),(24,0),(25,1),(38,0),(45,2),(46,2),(46,3),(52,14)]: grid[r][c] = '1'
# Three deliberate discoveries, not a continuous gem trail.
for r,c in [(15,9),(35,9),(43,9)]: grid[r][c] = '8'
for r,c in [(5,10),(12,11),(21,8),(27,10),(40,10),(46,9)]: grid[r][c] = '4'
grid[18][11] = '='
gate_cells = [(32,8),(32,9),(32,10)]
for r,c in gate_cells: grid[r][c] = '1'
for c in [8,9]: grid[48][c] = '7'
level = {
 '_type':'level', '_ns':'level', '_id':'4002', 'name':'First Light',
 'width':W, 'creator':'codex', 'credits':'Pack 4 · First Light', 'published':1,
 'grid':{'data':''.join(''.join(r) for r in grid)}, 'timers':{'data':{}},
 'switches':{'data':{str(18*W+11):'A'}},
 'gates':{'data':{str(r*W+c):'A' for r,c in gate_cells}},
}
(OUT/'level.json').write_text(json.dumps(level,indent=2)+'\n')
(OUT/'map.txt').write_text('\n'.join(f'{r:02} '+''.join(grid[r]).replace('0','·') for r in range(H-1,-1,-1))+'\n')
