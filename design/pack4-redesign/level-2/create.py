import json
from pathlib import Path
OUT=Path(__file__).parent
W,H=16,70
g=[['0']*W for _ in range(H)]
def cells(r,cs,ch='1'):
 for c in cs:g[r][c]=ch
# Translate the image's lower lumpy landform. Short runs shift and split;
# the diagonal opening and detached crumbs give its silhouette breathing room.
land={
3:[2,3],4:[2,3,4],5:[1,2,3,4,5],6:[2,3,4,6],7:[2,3,5,6],
8:[3,4,5,6,7],9:[3,4,6,7],10:[4,5,6,7],11:[4,5,7,8],
12:[3,4,5,6,8],13:[3,4,5,7],14:[2,3,4,6,7],15:[2,3,4,5,6],
16:[1,2,4,5],17:[2,3,5,6],18:[2,3,4,6],19:[3,4,6],
20:[3,4,5],21:[4,5],22:[4,5,6],23:[5,6,7],24:[5,7],25:[6],
# A local bowl off its right shore, opened by the lower lever.
12:[3,4,5,6,8,12],13:[3,4,5,7,9,12,13],14:[2,3,4,6,7,9,13],
15:[2,3,4,5,6,9,13],16:[1,2,4,5,10,11,12,13],17:[2,3,5,6,10,12],18:[2,3,4,6,12],
}
for r,cs in land.items():cells(r,cs)
# A few satellite chips, rather than a border or rail.
for r,c,ch in [(5,12,'2'),(8,13,'1'),(10,1,'2'),(22,2,'2'),(24,10,'2'),(26,9,'1'),(28,8,'2'),(30,3,'1'),(31,4,'2'),(33,13,'1'),(35,5,'2'),(37,2,'2'),(39,10,'1'),(41,12,'2')]:g[r][c]=ch
# Upper arrangement: two different broken shores around a broad courtyard.
upper={
43:[3,4],44:[2,3,4,11],45:[2,3,11,12],46:[3,4,10,11,12],
47:[3,4,6,10,11,13],48:[2,3,5,10,11,12,13],49:[2,3,4,5,11,12],
50:[3,4,5,9,10,11,12],51:[2,3,5,9,10,12,13],52:[2,3,4,10,11,12],
53:[1,2,3,10,11],54:[2,3,11,12],55:[2,4,11,12],56:[3,4,8,9,10,11],
57:[3,4,10],58:[4,9,10],59:[5,9],60:[6,7],61:[6],62:[7],
}
for r,cs in upper.items():cells(r,cs)
for r,c in [(44,13),(46,1),(51,14),(55,14),(59,1),(62,12),(64,5)]:g[r][c]='2'
# Three focal rewards, two physical levers, and sparse optional gem clusters.
for r,c in [(17,11),(33,11),(57,8)]:g[r][c]='8'
for r,c in [(12,10),(45,5)]:g[r][c]='='
for r,c in [(7,10),(8,10),(20,1),(21,1),(29,11),(30,11),(40,6),(41,6),(53,6),(54,7)]:g[r][c]='4'
for c in [7,8]:g[66][c]='7'
# A notch consists of the two geometrical predecessors of its star. Thus its
# switch changes access to a reward without ever forming a full-width barrier.
switches={str(12*W+10):'A',str(45*W+5):'B'}
gates={str(16*W+11):'A',str(16*W+12):'A',str(56*W+8):'B',str(56*W+9):'B'}
level={'_type':'level','_id':'4003','_ns':'level','name':'Two Quiet Shores','width':W,'credits':'Anders Hafreager','published':1,'grid':{'data':''.join(''.join(r) for r in g)},'timers':{'data':{}},'switches':{'data':switches},'gates':{'data':gates}}
(OUT/'level.json').write_text(json.dumps(level,indent=2)+'\n')
(OUT/'map.txt').write_text('\n'.join(f'{r:02} '+''.join(g[r]) for r in range(H-1,-1,-1))+'\n')
