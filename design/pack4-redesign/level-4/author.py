"""Hand-shaped translation of concept.png; no shared game data writes."""
import json, math
from pathlib import Path

OUT=Path(__file__).parent
W,H=16,109
grid=[['0']*W for _ in range(H)]
# Unequal hollow lobes, short necks and a large summit crown. These knots were
# hand placed after viewing imagegen's concept, not reused from prior attempts.
knots=[(0,8,10),(2,7,12),(4,6,13),(7,6,14),(10,7,14),
 (12,8,14),(14,8,13),(16,7,11),(18,7,9),
 (19,6,9),(21,4,10),(23,2,10),(25,1,10),(27,1,9),
 (29,2,9),(31,2,8),(33,3,8),(35,4,8),(37,7,9),(38,8,9),
 (40,8,12),(42,7,14),(44,6,14),(46,6,14),(48,6,13),
 (50,7,13),(52,8,12),(54,8,11),(55,8,10),
 (56,7,10),(58,5,11),(60,3,11),(62,2,9),(64,2,8),
 (66,3,7),(68,4,7),(70,4,8),(72,5,7),
 (74,4,8),(76,2,10),(78,1,11),(80,1,11),(82,2,10),
 (84,2,9),(86,3,7),(87,3,5),
 (89,2,7),(92,2,10),(94,2,12),(96,2,13),(98,3,13),
 (100,4,12),(102,6,10),(104,7,9),(108,7,9)]
bounds=[]
for r in range(H):
    a,b=next((a,b) for a,b in zip(knots,knots[1:]) if a[0]<=r<=b[0])
    t=(r-a[0])/(b[0]-a[0]); lo=round(a[1]+(b[1]-a[1])*t); hi=round(a[2]+(b[2]-a[2])*t)
    bounds.append((lo,hi))
    # Continuous white inner shells keep every lever arch meaningful. Unequal
    # rocky shoulders and small external holes prevent two ruler-straight rails.
    for c in range(W):
        d=lo-c if c<lo else c-hi if c>hi else 0
        if d and d<=2+(1 if (r//7+c)%4==0 else 0):
            grid[r][c]='1'
            if d>=2 and (r*11+c*7)%13<3: grid[r][c]='2'

# Compact islands echo the concept's crescent crags and leave alternate routes.
for r,cells in {
 6:[8],7:[8],8:[8],
 25:[8],26:[8],27:[8],
 43:[9],44:[9,10],45:[9,10],46:[10],47:[10],48:[10],49:[10],
 60:[7],61:[7,8],62:[8],
 77:[7],78:[7,8],79:[8],80:[8],81:[7],82:[7],
 94:[6],95:[6,7],96:[6],98:[11],99:[11],
}.items():
    for c in cells: grid[r][c]='1'

switches={}
gates={}
lever_points=[(10,12,'A'),(32,5,'B'),(47,12,'C'),(65,4,'D'),(80,3,'E')]
gate_rows=[(18,'A'),(38,'B'),(55,'C'),(72,'D'),(87,'E')]
for r,c,g in lever_points:
    assert grid[r][c]=='0',(r,c)
    grid[r][c]='=';switches[str(r*W+c)]=g
for r,g in gate_rows:
    lo,hi=bounds[r]
    for c in range(lo,hi+1):
        grid[r][c]='1';gates[str(r*W+c)]=g

for r,c in [(28,4),(59,6),(97,8)]:
    assert grid[r][c]=='0',(r,c)
    grid[r][c]='8'
for r,c in [(4,10),(5,11),(7,12),(12,11),
 (23,6),(24,5),(30,4),(34,6),
 (42,11),(44,12),(51,11),
 (61,5),(62,4),(67,5),
 (75,5),(77,4),(82,4),
 (90,5),(92,6),(99,9)]:
    assert grid[r][c]=='0',(r,c)
    grid[r][c]='4'
grid[95][8]='9'
# A little finish opening, rather than a track-wide finish strip.
for c in [7,8,9]:grid[104][c]='7'
level={'_type':'level','_id':'4005','_ns':'level','name':'The Hollow Orchard',
 'width':W,'credits':'Anders Hafreager','published':1,
 'grid':{'data':''.join(''.join(r) for r in grid)},'timers':{'data':{}},
 'switches':{'data':switches},'gates':{'data':gates}}
(OUT/'level.json').write_text(json.dumps(level,indent=2)+'\n')
(OUT/'map.txt').write_text('\n'.join(f'{r:03} '+''.join(grid[r]) for r in range(H-1,-1,-1))+'\n')
print('wrote',OUT/'level.json')
