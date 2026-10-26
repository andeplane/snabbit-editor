import json
from pathlib import Path
p=Path(__file__).parent
W,H=16,68
g=[['0']*W for _ in range(H)]
def put(r,cols,ch='1'):
 for c in cols:g[r][c]=ch
# Lower crescent: broad lower sweep, compact left body, a chipped upper horn.
rows={
5:[4],6:[2,3,4,5],7:[1,2,3,4,5,6],8:[0,1,2,3,4,5,6],
9:[1,2,3,4,5,6,7],10:[0,1,2,3,4,5,6],11:[0,1,2,3,4,5],
12:[0,1,2,3,4],13:[0,1,2,3],14:[0,1,2,3],15:[0,1,2,3,4],
16:[0,1,2,3,4,5],17:[0,1,2,3,4,6,7],18:[0,1,2,6],19:[0,1,2,6],
20:[1,2,6],21:[0,1,2],22:[0,1,2,3],23:[0,1,2,3],
24:[1,2,3,4],25:[1,2,3,4,5],26:[2,3,4,5,6],27:[3,4,5,6],28:[4,5],
# Unequal upper crescent: long lower tail and a narrow upper hook, facing left.
31:[10],32:[10,11],33:[10,11,12],34:[11,12,13],35:[12,13,14],36:[12,13,14,15],
37:[13,14,15],38:[13,14,15],39:[14,15],40:[13,14,15],41:[13,14,15],
42:[12,13,14,15],43:[9,13,14,15],44:[9,13,14,15],45:[9,13,14,15],46:[9,13,14,15],
47:[13,14,15],48:[12,14,15],49:[11,12,14,15],50:[10,11,12,15],
51:[9,10,11,15],52:[9,10,11],53:[8,9,10],54:[8,9],55:[9],
# Small floating finish tufts, with an asymmetrical chipped top.
62:[7,12],63:[6,7,12,13],64:[7,12],65:[7],66:[12],
}
for r,cs in rows.items():put(r,cs)
# Sparse silhouette chips and greyer weathered cells retain original authored texture.
for r,c in [(8,1),(10,3),(12,1),(15,1),(23,1),(25,3),(26,4),(36,13),(38,14),(42,14),(48,14),(52,10)]:g[r][c]='0'
for r,c in [(7,1),(10,0),(13,0),(16,1),(19,0),(22,0),(26,2),(27,6),(35,14),(36,15),(39,15),(42,15),(46,14),(49,15),(53,10)]:g[r][c]='2'
for r,c in [(3,5),(5,1),(11,8),(24,7),(29,3),(30,12),(34,8),(38,11),(41,0),(50,6),(54,14),(57,13)]:g[r][c]='2' if r%3==0 else '1'
# Two authored little doorways. Gate A is a diagonal lip, B is the upper hollow's floor.
gates={}
for r,c in [(16,6),(17,5),(18,4)]:g[r][c]='3';gates[str(r*W+c)]='A'
for r,c in [(43,10),(43,11),(43,12)]:g[r][c]='3';gates[str(r*W+c)]='B'
switches={}
for r,c,ch in [(13,7,'A'),(37,7,'B')]:g[r][c]='=';switches[str(r*W+c)]=ch
for r,c in [(20,4),(45,11),(59,10)]:g[r][c]='8'
# Individual lures rather than gem rails; optional diamond sits in the crescent's outside eddy.
for r,c in [(4,11),(9,9),(27,7),(32,7),(39,8),(55,6)]:g[r][c]='4'
g[51][14]='9'
for r,c in [(63,9),(64,10),(63,11)]:g[r][c]='7'
level={'_type':'level','_id':'4006','_ns':'level','name':'Twin Moon Garden','width':W,'credits':'Anders Hafreager','published':1,'grid':{'data':''.join(''.join(row) for row in g)},'timers':{'data':{}},'switches':{'data':switches},'gates':{'data':gates}}
p.joinpath('level.json').write_text(json.dumps(level,indent=2)+'\n')
p.joinpath('grid.txt').write_text('\n'.join(f'{r:02d} '+''.join(row) for r,row in enumerate(g))+'\n')
