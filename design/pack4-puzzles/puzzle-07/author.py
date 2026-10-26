from pathlib import Path
import json
P=Path(__file__).parent;W,H=16,42
g=[['0']*W for _ in range(H)]
knots=[(0,8,10),(3,8,11),(5,9,10),(6,9,9),(8,9,10),(10,9,9),(12,8,10),(14,7,11),(18,7,11),(20,7,11),(23,7,12),(25,7,12),(28,8,12),(30,8,11),(33,9,11),(36,9,11),(39,10,11),(41,10,11)]
bounds=[]
for r in range(H):
 a,b=next((a,b) for a,b in zip(knots,knots[1:]) if a[0]<=r<=b[0]);t=(r-a[0])/(b[0]-a[0]);lo=round(a[1]+(b[1]-a[1])*t);hi=round(a[2]+(b[2]-a[2])*t);bounds.append((lo,hi))
 for c in range(W):
  depth=lo-c if c<lo else c-hi if c>hi else 0
  if 0<depth<=2+(r//6+c)%2:
   g[r][c]='2' if depth>=3 and (r+c)%4==0 else '1'
# Sculpt the refund hollow: two genuine ascending alternatives, reunited above.
for r in range(16,22):
 for c in range(9,11):g[r][c]='1'
 for c in [7,8,11]:g[r][c]='0'
# Funnel right entry to exactly the lever underneath the heart.
g[17][10]='0';g[18][11]='=';g[19][11]='6'
for c in [7,8]:g[18][c]='3'
# Upper fork: open broad left crescent versus a short three-hit right-hand brown pocket.
for r in range(25,29):
 for c in [10,11]:g[r][c]='1'
 g[r][12]='3' if 25<=r<=27 else '0'
 # Separate the three-hit pocket from the valuable crossing.
 g[r][13]='1'
# Two switch-linked crossings demonstrate state and then require its preservation.
switches={str(6*W+9):'A',str(18*W+11):'A'};g[6][9]='='
gates={}
for r,cols in [(10,[9]),(26,[7,8,9])]:
 for c in cols:g[r][c]='1';gates[str(r*W+c)]='A'
# Final common toll: resources saved earlier are used after the tempting branch.
for c in range(bounds[33][0],bounds[33][1]+1):g[33][c]='3'
for r,c in [(12,9),(31,10),(36,10)]:g[r][c]='8'
for r,c in [(3,10),(15,8),(24,8),(30,9)]:
 assert g[r][c]=='0',(r,c);g[r][c]='4'
for c in range(bounds[40][0],bounds[40][1]+1):g[40][c]='7'
level={'_type':'level','_id':'4013','_ns':'level','name':'Leave the Refund','width':W,'credits':'Anders Hafreager','published':1,'grid':{'data':''.join(map(''.join,g))},'timers':{'data':{}},'switches':{'data':switches},'gates':{'data':gates}}
(P/'level.json').write_text(json.dumps(level,indent=2)+'\n');(P/'map.txt').write_text('\n'.join(f'{r:02} '+''.join(g[r]) for r in reversed(range(H)))+'\n')
