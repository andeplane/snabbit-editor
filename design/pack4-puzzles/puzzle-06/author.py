from pathlib import Path
import json, math
P=Path(__file__).parent
W,H=20,49
g=[['0']*W for _ in range(H)]
def put(r,c,ch='1'):
 if 0<=r<H and 0<=c<W:g[r][c]=ch
# Hand-shaped asymmetric lower crescent. This is scenery around open choices,
# never a copied full-width barrier or a forced gem-following tunnel.
for r in range(0,31):
 center=5.1+1.6*math.sin((r-7)/5)
 radius=2.8+0.6*math.sin(r/3)
 for c in range(W):
  if abs(c-center)<radius and (r+c*3)%17!=0:put(r,c)
for r in range(7,30):
 center=16+0.9*math.sin(r/4)
 for c in range(W):
  if abs(c-center)<1.2+0.45*math.sin(r/5) and (r*2+c)%19!=0:put(r,c)
# Unequal hollows / chips and isolated asteroids, not regular chambers.
for r,c in [(3,5),(4,5),(11,4),(12,4),(13,5),(22,7),(23,7),(24,8),(27,4),(28,5)]:put(r,c,'0')
for r,c in [(2,1),(3,1),(9,1),(15,2),(16,2),(20,19),(25,1),(26,1),(30,18),(43,4),(44,4),(46,17)]:put(r,c)
# Concept's upper neck is translated into a genuinely three-IMPACT-deep plug.
# A ring encloses the reward; outside travel cannot enter from its sides.
for r in range(29,45):
 left=9 if r<34 else 10 if r<40 else 11
 right=16 if r<34 else 17 if r<40 else 16
 for c in range(left,right+1):put(r,c)
holes={29:[10,11],30:[11],31:[11],32:[12],33:[12],34:[13],35:[13,14],36:[13,14,15],37:[13,14,15],38:[12,13,14,15],39:[12,13,14],40:[12,13,14],41:[12,13,14],42:[13,14],43:[13,14],44:[14]}
for r,cols in holes.items():
 for c in cols:put(r,c+1,'0')
for r,c in [(31,12),(32,13),(33,13)]:put(r,c,'3')
# Authored decisions: three compact gem arcs separated by open space.
dirs=[]
for r in range(44):
 d=1 if r<5 else -1 if r<9 else 1 if r<17 else -1 if r<25 else 1 if r<36 else -1 if r<40 else 1
 dirs.append(d)
route=[{'row':0,'col':9,'direction':1}];c=9
for r,d in enumerate(dirs):
 c=(c+(1 if r%2 and d>0 else -1 if not r%2 and d<0 else 0))%W
 route.append({'row':r+1,'col':c,'direction':d})
# Carve a two-choice airy approach. Only protected shell is single-file.
for p in route:
 r,c=p['row'],p['col']
 if r<29:
  for dc in [-1,0,1]:put(r,c+dc,'0')
for r in list(range(6,10))+list(range(14,18))+list(range(22,26)):
 put(r,route[r]['col'],'4')
# Each four-gem arc has an exclusive poorer pocket across the hollow.
# Its two gems occupy the same row band; a snake cannot collect both pockets.
# Counting a complete reachable cluster matters, rather than following all gems.
for r,c in [(6,12),(8,13),(14,11),(16,10),(22,12),(24,13)]:put(r,c,'4')
for r in [3,19,37]:put(r,route[r]['col'],'8')
put(39,route[39]['col'],'9')
put(44,route[44]['col'],'7')
level={'_type':'level','_ns':'level','_id':'4012','name':'Earn the Way Through','width':W,'creator':'codex','credits':'Pack 4 · Earn the Way Through','published':1,'grid':{'data':''.join(''.join(r) for r in g)},'timers':{'data':{}},'switches':{'data':{}},'gates':{'data':{}}}
(P/'level.json').write_text(json.dumps(level,indent=2)+'\n')
(P/'authored-route.json').write_text(json.dumps(route,indent=2)+'\n')
(P/'map.txt').write_text('\n'.join(f'{r:02} '+''.join(g[r]) for r in range(H-1,-1,-1))+'\n')
print('route',[(p['row'],p['col']) for p in route if p['row'] in [3,6,9,14,17,19,22,25,29,30,31,32,33,34,37,39,44]])
