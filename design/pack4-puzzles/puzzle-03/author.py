from pathlib import Path
import json
P=Path(__file__).parent
W,H=18,63
G=[['0']*W for _ in range(H)]
# Irregular lower bulb and long taper; only the hollow is used for play.
# Each row stores the visibly carved interior, not a drawn path.
openings={
0:[9,10],1:[9,10],2:[9,10,11],3:[9,10,11],4:[9,10,11],
5:list(range(8,13)),6:list(range(8,13)),7:list(range(8,13)),8:list(range(8,13)),9:list(range(8,13)),10:list(range(8,13)),11:list(range(8,12)),12:list(range(9,12)),13:[9,10,11],
14:[10],15:[9,10],16:[9,10],17:[9],18:[8,9,10],19:[8,9,10],20:list(range(7,12)),21:list(range(7,12)),22:list(range(6,12)),23:list(range(6,12)),24:list(range(6,12)),25:list(range(6,12)),26:list(range(6,11)),27:list(range(6,11)),28:[7,8,9],29:[8,9],30:[8,9],31:[7,8,9],32:[7,8,9],33:[7,8,9],34:[7,8,9],35:[8],36:[7,8],
37:list(range(6,11)),38:list(range(6,10)),39:list(range(6,10)),40:list(range(5,10)),41:list(range(5,9)),42:list(range(4,9)),43:list(range(4,9)),44:list(range(4,8)),45:list(range(4,8)),46:list(range(3,8)),47:list(range(3,8)),48:list(range(3,7)),49:list(range(3,7)),50:list(range(3,7)),51:list(range(3,7)),52:list(range(3,7)),53:list(range(3,7)),54:[4,5],55:[4,5],56:[4,5],57:[4],58:[4],59:[4],60:[4],61:[4],62:[4],
}
# Main rock mass wraps the hollow, but chipped exterior never cuts through
# the inner shell: objectives cannot be entered from the surrounding space.
for r,inside in openings.items():
 if r<3: L,R=10,16
 elif r<10:L,R=5+(r%3==0),16
 elif r<18:L,R=6,14+(r%2)
 elif r<28:L,R=3+(r%4==0),14
 elif r<36:L,R=4+(r%3==1),13
 elif r<46:L,R=2,13-(r%3==0)
 else:L,R=max(0,min(inside)-3),max(inside)+3+(r%3==0)
 for c in range(max(0,L),min(W,R+1)):
  if c in inside:continue
  # Articulate the outside edge, retaining the two-cell inner shell.
  near=min(abs(c-x) for x in inside)
  if near>2 and (r*17+c*23)%9<3:continue
  G[r][c]='2' if near>1 and (r*7+c*11)%8==0 else '1'
# Entrance is the only lower access; final small opening sits at the tip.
for r,c in [(8,9)]:G[r][c]='6'
for r,c in [(14,10),(17,9),(29,8)]:G[r][c]='3'
for r,c in [(23,9),(39,8),(51,4)]:G[r][c]='8'
G[35][8]='1'
for r,c in [(6,11),(21,10),(26,7),(42,7),(48,5)]:G[r][c]='4'
for c in [4,5]:G[57][c]='7'
# Exterior stray fragments, asymmetrically spaced.
for r,c in [(1,17),(4,3),(10,4),(19,15),(24,2),(32,15),(41,15),(47,1),(56,8),(61,2)]:
 if G[r][c]=='0':G[r][c]='1'
l={'_type':'level','_ns':'level','_id':'4009','name':'Buy One Beat','width':W,'credits':'Anders Hafreager','published':1,'grid':{'data':''.join(''.join(row) for row in G)},'timers':{'data':{str(35*W+8):'[1,56,8,8,0,32]'}}}
(P/'level.json').write_text(json.dumps(l,indent=2)+'\n')
(P/'map.txt').write_text('\n'.join(f'{r:02} '+''.join(G[r]) for r in reversed(range(H)))+'\n')
