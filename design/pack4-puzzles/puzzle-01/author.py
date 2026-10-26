"""Hand-sculpted hex interpretation of the prior ImageGen composition."""
import json
from pathlib import Path
O=Path(__file__).parent
W,H=16,56
G=[['0']*W for _ in range(H)]
# Accessible hollow, row by row. Broad branch choices sit inside unequal arms.
# Each tuple is (leftmost open cell, rightmost open cell, left/right wall depth).
profile=[
 (8,11,2,2),(7,11,2,3),(7,12,3,2),(7,12,2,2),
 (8,12,3,2),(8,11,2,3),(8,11,3,2),(8,10,2,3),
 (9,10,3,2),(9,10,2,3),(9,9,3,2),
 (8,10,2,3),(8,11,3,2),(7,11,2,3),(7,12,3,2),
 (6,12,3,3),(5,13,2,2),(4,13,3,2),
 (4,13,2,2),(3,13,2,2),(3,14,2,1),(3,14,3,1),
 (3,14,2,1),(4,14,3,1),(4,13,2,2),(4,13,3,2),
 (4,13,2,2),(5,13,3,2),(5,13,2,2),(5,12,3,2),
 (6,12,2,3),(6,12,3,2),(6,12,2,3),(7,12,3,2),
 (7,11,2,3),(8,11,3,2),(8,10,2,3),(9,10,3,2),
 (9,9,2,3),(8,10,3,2),(8,10,2,3),(8,10,3,2),
 (8,10,2,3),(8,9,3,2),(8,9,2,3),
 (7,10,3,2),(7,11,2,3),(7,11,3,2),(8,10,2,3),
 (8,10,3,2),(8,10,2,2),
]
for r,(lo,hi,ld,rd) in enumerate(profile):
 for c in range(max(0,lo-ld),lo):G[r][c]='1'
 for c in range(hi+1,min(W,hi+rd+1)):G[r][c]='1'
# The central sail is one pointed, irregular asteroid rather than a third rail.
sail={18:[8],19:[8,9],20:[7,8,9],21:[7,8,9],22:[7,8,9],
      23:[7,8,9],24:[7,8,9],25:[7,8,9],26:[7,8,9],
      27:[8,9],28:[8,9],29:[8,9],30:[9],31:[9]}
for r,cols in sail.items():
 for c in cols:G[r][c]='1'
# Chipped contours and satellites are outside the collision-critical inner edge.
for r,c in [(1,14),(5,5),(12,4),(14,15),(18,0),(25,0),(29,15),(34,3),(40,13),(48,4)]:G[r][c]='1'
for r,c in [(2,4),(6,13),(14,5),(18,15),(22,1),(26,15),(27,2),(33,14),(40,6),(47,13)]:G[r][c]='2'
for r,c in [(4,6),(13,13),(22,8),(25,8),(30,4),(46,5)]:G[r][c]='2'
# Stars and sparse gem accents; neither branch receives an arbitrary score bribe.
for r,c in [(15,8),(41,9),(48,9)]:G[r][c]='8'
for r,c in [(4,10),(13,10),(20,5),(21,12),(29,6),(33,10),(46,9)]:G[r][c]='4'
switches=[(10,9),(24,5),(38,9)]
for r,c in switches:G[r][c]='='
gates=[(44,8),(44,9)]
for r,c in gates:G[r][c]='1'
for c in [8,9,10]:G[50][c]='7'
L={'_type':'level','_ns':'level','_id':'4007','name':'Three Switches, One Door',
   'width':W,'creator':'codex','credits':'Pack 4 · Three Switches, One Door',
   'published':1,'grid':{'data':''.join(''.join(r) for r in G)},
   'timers':{'data':{}},'switches':{'data':{str(r*W+c):'A' for r,c in switches}},
   'gates':{'data':{str(r*W+c):'A' for r,c in gates}}}
(O/'level.json').write_text(json.dumps(L,indent=2)+'\n')
(O/'map.txt').write_text('\n'.join(f'{r:02} '+''.join(G[r]).replace('0','·') for r in range(H-1,-1,-1))+'\n')
