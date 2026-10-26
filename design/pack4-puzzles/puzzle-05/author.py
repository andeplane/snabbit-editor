from pathlib import Path
import json
O=Path(__file__).parent;W=16;H=47
g=[['0']*W for _ in range(H)]
def put(r,cs,ch='1'):
 for c in cs:g[r][c]=ch
lower={0:([3,4],[14]),1:([2,3,4,5],[13,14]),2:([2,3,4,5,6],[14,15]),3:([1,2,3,4,5],[13,14,15]),4:([1,2,3,4],[12,13,14]),5:([2,3,4,5],[12,13,14]),6:([1,2,3,4],[11,12,13,14]),7:([2,3,4],[11,12,13]),8:([2,3,4],[12,13,14]),9:([2,3,4],[13,14,15]),10:([1,2,3,4],[12,13,14,15]),11:([2,3,4],[12,13,14,15]),12:([3,4,5],[11,12,13,14]),13:([4,5,6],[12,13,14]),14:([5,6],[12,13,14]),15:([5,6],[11,12,13,14]),16:([4,5,6],[12,13,14,15]),17:([4,5,6],[12,13,14]),18:([3,4,5,6],[11,12,13,14]),19:([4,5,6],[11,12,13,14]),20:([3,4,5,6],[12,13,14]),21:([4,5,6],[11,12,13,14]),22:([4,5,6],[11,12,13,14])}
for r,(l,rt) in lower.items():put(r,l+rt)
# One continuous sculpted upper crown, with a changing inner hollow and chipped outer contour.
inside={23:(7,9),24:(7,9),25:(7,9),26:(7,8),27:(8,8),28:(8,9),29:(8,9),30:(8,9),31:(8,10),32:(8,10),33:(9,10),34:(9,11),35:(9,11),36:(8,11),37:(8,11),38:(7,11),39:(7,11),40:(7,11),41:(7,11),42:(7,10),43:(7,10)}
outer={23:(3,14),24:(2,14),25:(2,15),26:(1,14),27:(2,14),28:(1,15),29:(0,14),30:(0,14),31:(1,15),32:(0,14),33:(1,14),34:(1,15),35:(2,14),36:(2,14),37:(3,15),38:(3,14),39:(4,14),40:(3,14),41:(4,13),42:(3,13),43:(4,12)}
for r,(lo,hi) in outer.items():
 a,b=inside[r]
 put(r,list(range(lo,a))+list(range(b+1,hi+1)))
# Chipping affects the exterior texture only, never the protected inner boundary.
for r,c in [(2,3),(4,2),(6,12),(10,2),(12,13),(15,12),(17,5),(20,13),(24,3),(26,2),(28,2),(30,1),(32,1),(34,2),(35,13),(37,14),(39,13),(41,5),(42,12)]:g[r][c]='0'
for r,c in [(1,2),(3,1),(5,5),(7,2),(10,15),(12,3),(16,15),(19,14),(24,2),(27,2),(29,0),(31,15),(34,15),(36,2),(39,14),(42,3)]:g[r][c]='2'
for r,c in [(3,8),(8,0),(12,8),(18,1),(21,15),(25,0),(33,15),(38,0),(44,4),(44,12),(45,3),(46,13)]:g[r][c]='1'
# Optional A, optional B, then unavoidable A reset in the single-cell neck.
switches={}
for r,c,channel in [(9,5,'A'),(19,10,'B'),(27,8,'A')]:g[r][c]='=';switches[str(r*W+c)]=channel
# The first exit slit is initially absent, so A must be OFF after the forced toggle.
gates={};timers={}
for r,c in [(30,8),(30,9)]:
 g[r][c]='1';i=str(r*W+c);gates[i]='A';timers[i]='[0,32767,32767,0,0,0]'
# The right arch is normally solid, and requires B ON independently.
for r,c in [(33,9),(33,10)]:g[r][c]='1';gates[str(r*W+c)]='B'
for r,c in [(24,8),(31,9),(38,9)]:g[r][c]='8'
for r,c in [(7,5),(16,10),(35,10)]:g[r][c]='4'
for r,c in [(41,8),(41,9),(41,10)]:g[r][c]='7'
l={'_type':'level','_ns':'level','_id':'4011','name':'Program the Exit','width':W,'credits':'Anders Hafreager','published':1,'grid':{'data':''.join(''.join(row) for row in g)},'timers':{'data':timers},'switches':{'data':switches},'gates':{'data':gates}}
O.joinpath('level.json').write_text(json.dumps(l,indent=2)+'\n');O.joinpath('grid.txt').write_text('\n'.join(f'{r:02} '+''.join(row) for r,row in enumerate(g))+'\n')
