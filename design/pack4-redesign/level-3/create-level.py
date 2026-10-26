import json
from pathlib import Path
out=Path(__file__).parent
W,H=16,74
g=[['0']*W for _ in range(H)]
def put(r,cs,ch='1'):
 for c in cs:
  assert 0<=c<W and g[r][c]=='0',(r,c,g[r][c]);g[r][c]=ch
# Faithful reduction of the generated concept: the starting crescent sits to
# the left; three progressively higher coves and loose asteroid fragments.
for r,cs in {
0:[6],1:[5],2:[2,3,4],3:[1,2,4],4:[1,3],5:[0,2,3],6:[0,1,3],7:[1,2],8:[0,1],9:[0,2],10:[1],11:[1,2],12:[2,3],13:[2,4],14:[3],
# right hand star cove, a generous open mouth faces left
11:[1,2,11,12,13],12:[2,3,11,13,14],13:[2,4,12,14],14:[3,13,14],15:[14],16:[14,15],17:[14],18:[14],19:[13,14],20:[14,15],21:[13,14],
# middle left cove (asymmetric, open toward upper right)
31:[4,5],32:[3,4,6],33:[3,6],34:[2,4,5],35:[3,4],36:[2,3,4],37:[3],38:[3],39:[3,6],40:[3,4],41:[4,5],
# little fragment on the right of the middle cove
30:[9],31:[9],32:[10],33:[10,11],34:[9,10,11],35:[10],
# upper final island: long ragged left side, broken right hook
53:[7,8],54:[6,7],55:[6],56:[5,6],57:[5],58:[5,6],59:[6],60:[6,11,12],61:[5,6,12],62:[5,11,12],63:[6,11,12],64:[6,7,10,11],65:[7,8,11],66:[7,8,10],
}.items():put(r,cs)
# Loose fragments are individual authored accents, not a repeating scatter.
for r,cs in {3:[9],4:[8],7:[6],8:[10],9:[10],15:[8],19:[12],22:[8,9],23:[8],24:[9],25:[13],26:[14],27:[13,14],28:[7],29:[6],32:[7],36:[8],39:[7],43:[6],44:[9],45:[9,10],46:[8],47:[5],48:[6],49:[5],50:[8],51:[10],52:[11],54:[11],55:[12],57:[13],59:[14],62:[4]}.items():put(r,cs)
# Texture contrast uses a handful of darker rocks, as in the concept.
for r,c in [(5,1),(8,0),(12,13),(14,13),(17,14),(20,14),(32,3),(34,10),(36,3),(39,6),(53,7),(56,5),(60,12),(64,7)]:
 if g[r][c]=='1':g[r][c]='2'
# Two small switch-linked mouths plus a separate breathing-petal cluster.
switches={};gates={};timers={}
for r,c,ch in [(10,10,'A'),(33,5,'B')]:
 assert g[r][c]=='0';g[r][c]='=';switches[str(r*W+c)]=ch
for r,c,ch in [(12,10,'A'),(13,10,'A'),(34,5,'B'),(35,4,'B')]:
 assert g[r][c]=='0';g[r][c]='1';gates[str(r*W+c)]=ch
 # Start ON at the native row arrival; hitting the preceding lever opens it.
 timers[str(r*W+c)]='[1,40,40,8,0,0]'
for r,c in [(47,2),(48,1),(49,2),(50,1),(51,2)]:
 put(r,[c]);timers[str(r*W+c)]='[0,32,40,0,4,8]'
# A few gem glints lead into coves without forming collectible rails.
for r,c in [(15,11),(17,11),(31,7),(35,7),(37,7),(57,9),(59,8)]:put(r,[c],'4')
for r,c in [(17,12),(38,5),(61,9)]:put(r,[c],'8')
# Three unobtrusive finish cells in the concept's short top opening.
put(67,[8,9,10],'7')
l={'_type':'level','_ns':'level','_id':'4004','name':'Breathing Cove','width':W,'credits':'Anders Hafreager','published':1,'grid':{'data':''.join(''.join(r) for r in g)},'timers':{'data':timers},'switches':{'data':switches},'gates':{'data':gates}}
(out/'level.json').write_text(json.dumps(l,indent=2)+'\n')
(out/'map.txt').write_text('\n'.join(f'{r:02} '+''.join(g[r]) for r in range(H-1,-1,-1))+'\n')
