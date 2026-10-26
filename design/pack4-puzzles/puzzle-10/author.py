from pathlib import Path
import json
D=Path(__file__).parent
W,H=16,34
g=[['0']*W for _ in range(H)]
# One chipped, asymmetric crescent silhouette, sculpted outside the playable hollow.
spans={0:[],1:[(7,10)],2:[(6,11)],3:[(5,11)],4:[(4,11)],5:[(3,12)],6:[(2,12)],7:[(2,12)],8:[(1,13)],9:[(1,12)],10:[(1,12)],11:[(0,12)],12:[(0,12)],13:[(0,12)],14:[(0,12)],15:[(1,12)],16:[(1,13)],17:[(1,12)],18:[(1,12)],19:[(2,12)],20:[(2,11)],21:[(3,11)],22:[(3,10)],23:[(4,10)],24:[(5,11)],25:[(6,11)],26:[(6,10)],27:[(7,10)],28:[(7,11)],29:[(8,10)]}
for r,ss in spans.items():
 for a,b in ss:
  for c in range(a,b+1):g[r][c]='1'
# Non-repeating chipped periphery and a few native boulder fragments.
for r,c in [(8,1),(11,0),(17,12),(20,2),(23,4),(25,11),(27,10),(10,12),(14,0)]:g[r][c]='0'
for r,c in [(3,13),(9,14),(17,14),(24,2),(28,12),(30,9)]:g[r][c]='1'
# Chipped facets and isolated hollows keep the single crescent airy.
for r,c in [(11,1),(12,0),(14,1),(15,2),(18,1),(9,12),(16,13),(19,12),(21,11),(24,11),(28,11),(14,6),(15,6),(16,6),(17,10),(18,10),(19,10)]:g[r][c]='0'
def path(r,c,dirs):
 pts=[(r,c)]
 for d in dirs:
  c=(c+((1 if d=='R' else 0) if r%2 else (-1 if d=='L' else 0)))%W;r+=1
  pts.append((r,c))
 return pts
approach='L'*6
short='R'*8+'L'*8
safe='LLLRLLRLRRLRRLRR'
assert safe.count('L')==8
approachpts=path(0,9,approach)
shortpts=path(6,6,short)
safepts=path(6,6,safe)
assert shortpts[-1]==safepts[-1]
tail='RRRRLLLLRR'
tailpts=path(22,6,tail)
for pts in [approachpts,shortpts,safepts,tailpts]:
 for r,c in pts:g[r][c]='0'
for j in [6,7,8]:
 r,c=shortpts[j];g[r][c]='3'
for r,c,ch in [(3,7,'6'),(5,6,'8'),(23,6,'8'),(27,7,'8'),(31,6,'7')]:g[r][c]=ch
# Three sparse cue gems in the shared approach, not a combo-health rail.
for r,c in [(1,8),(2,8),(4,7)]:g[r][c]='4'
# Trim trailing height to leave finish room, native fallback remains only a fallback.
level={'_type':'level','_id':'4016','_ns':'level','name':'Spend a Heart, Save Turns','width':W,'credits':'Pack 4 puzzle design','published':1,'grid':{'data':''.join(''.join(x) for x in g)},'timers':{'data':{}}}
(D/'level.json').write_text(json.dumps(level,indent=2)+'\n')
(D/'routes.json').write_text(json.dumps({'shortcut':approach+short+tail,'safe':approach+safe+tail,'fork':[6,6],'merge':list(shortpts[-1]),'dirt':[list(shortpts[j]) for j in [6,7,8]]},indent=2)+'\n')
(D/'map.txt').write_text('\n'.join(f'{r:02d} '+''.join(g[r]) for r in range(H-1,-1,-1))+'\n')
print((D/'map.txt').read_text())
