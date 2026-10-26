"""Image-first native translation. All writes stay in puzzle-04."""
from pathlib import Path
import json,sys
P=Path(__file__).parent
W,H=16,66
g=[['0']*W for _ in range(H)]
# Lower right crescent; small central seed hollow; upper left harp pocket.
knots=[(0,8,10),(3,7,11),(6,7,13),(8,7,14),(11,8,14),
 (14,8,14),(17,8,13),(20,8,11),(23,9,10),(24,9,10),
 (26,8,11),(28,7,11),(31,6,11),(34,6,10),(36,6,9),
 (37,5,9),(39,3,10),(41,2,10),(43,2,9),(45,4,9),
 (46,5,9),(48,7,8),(50,7,9),(53,7,10),(56,7,10),
 (59,8,9),(62,8,9),(65,8,9)]
bounds=[]
for r in range(H):
 a,b=next((a,b) for a,b in zip(knots,knots[1:]) if a[0]<=r<=b[0]);t=(r-a[0])/(b[0]-a[0])
 lo=round(a[1]+(b[1]-a[1])*t);hi=round(a[2]+(b[2]-a[2])*t);bounds.append((lo,hi))
 for c in range(W):
  d=lo-c if c<lo else c-hi if c>hi else 0
  if 0<d<=2+(1 if (r//5+c)%5==1 else 0):
   g[r][c]='2' if d>=2 and (r*7+c*11)%9<3 else '1'
# Small chipped central seed, lower tip, upper inner shoulder.
for r,cs in {4:[8],5:[8],27:[9],28:[9,10],29:[9,10],30:[10],
 39:[8],40:[8],41:[8],51:[9],52:[9]}.items():
 for c in cs:g[r][c]='1'
for r,c in [(8,10),(31,8),(42,5)]:
 assert g[r][c]=='0',(r,c);g[r][c]='8'
for r,c in [(3,10),(6,11),(10,12),(16,11),(21,10),(26,10),
 (33,8),(39,5),(43,5),(54,8)]:
 assert g[r][c]=='0',(r,c);g[r][c]='4'
g[56][9]='9'
switches={}
for r,c in [(12,12),(38,7)]:
 assert g[r][c]=='0',(r,c);g[r][c]='=';switches[str(r*W+c)]='A'
gates={}
for r in [24,48]:
 for c in range(bounds[r][0],bounds[r][1]+1):
  g[r][c]='1';gates[str(r*W+c)]='A'
for c in [8,9]:g[62][c]='7'
level={'_type':'level','_id':'4010','_ns':'level','name':'Reverse the Rhythm',
 'width':W,'credits':'Anders Hafreager','published':1,
 'grid':{'data':''.join(''.join(r) for r in g)},'timers':{'data':{}},
 'switches':{'data':switches},'gates':{'data':gates}}
if '--geometry-only' not in sys.argv:
 level['timers']['data']={index:'[1,64,64,0,0,32]' for index in gates}
(P/'level.json').write_text(json.dumps(level,indent=2)+'\n')
(P/'map.txt').write_text('\n'.join(f'{r:02} '+''.join(g[r]) for r in range(H-1,-1,-1))+'\n')
print('Geometry-only preview' if '--geometry-only' in sys.argv else 'Final native rhythm level authored')
