from pathlib import Path
import json, math
P=Path(__file__).parent
W,H=16,45
G=[['0']*W for _ in range(H)]
# One chipped asteroid, not repeated full-width barriers. Its three different
# lobes enclose a shallow left bay, a broad right heart pocket, and a thin spur.
for r in range(H-1):
 if r<5: left,right=6-(r//2),12+(r%3==1)
 elif r<11: left,right=3+(r%3==1),13-(r%4==0)
 elif r<19: left,right=5+(r%3==0),15-(r%3==1)
 elif r<26: left,right=3+(r%4==1),12+(r%3==0)
 elif r<33: left,right=6+(r%3==1),14+(r%4==0)
 else:left,right=7+(r%5==0),15-(r%4==0)
 for c in range(left,right+1):G[r][c]='1'
# Irregular peripheral voids and detached asteroid chips do not create routes.
for r,c in [(5,4),(6,4),(7,4),(12,14),(13,14),(15,14),(20,4),(21,4),(23,4),(34,14),(35,14),(37,14),(39,14)]:G[r][c]='0'
for r,c in [(1,3),(9,1),(16,3),(24,1),(30,3),(37,4),(40,14)]:G[r][c]='1'
open_rows={
0:[9],1:[8,9,10],2:[8,9,10],3:[7,8,9,10],4:[7,8,9,10],
5:[7,8,9,10],6:[7,9,10,11],7:[7,9,10,11],8:[7,9,10],
9:[7,8,9,10],10:[8,9,10],11:[8,9,10],12:[8,9],13:[8,9],
14:[8,9,10],15:[8,9,10],16:[8,9,10,11],17:[8,9,10,11],18:[8,9,10,11],19:[8,9,10],
20:[8,9,10],21:[7,9,10],22:[7,9,10],23:[7,8,9,10],24:[8,9,10],25:[8,9],
26:[9],27:[9],28:[10],29:[10],30:[11],31:[11],32:[12],
33:[11,12,13],34:[10,11,12,13],35:[10,11,12,13],36:[9,10,11,12,13],
37:[9,10,11,12],38:[9,10,11],39:[9,10,11],40:[9,10,11],41:[9,10],42:[10,11]
}
for r,cols in open_rows.items():
 for c in cols:G[r][c]='0'
# No fork's reward can be collected without passing that fork's lever cutset.
levers=[(8,7),(14,10),(22,7)]
for r,c in levers:G[r][c]='='
hearts=[(9,7),(15,10),(16,11),(17,11)]
for r,c in hearts:G[r][c]='6'
for r,c in [(2,9),(3,9),(6,10),(10,9),(16,9),(18,10),(24,9),(36,11)]:G[r][c]='4'
G[23][7]='9'
for r,c in [(27,9),(33,12),(39,10)]:G[r][c]='8'
for r,c in [(28,10),(29,10),(30,11),(31,11),(32,12)]:G[r][c]='3'
for c in [10,11]:G[42][c]='7'
mouths=[(5,7),(12,9),(20,8)]
for r,c in mouths:G[r][c]='1'
G[26][9]='1'
idx=lambda p:str(p[0]*W+p[1])
level={'_type':'level','_id':'4014','_ns':'level','name':'One Lever Only','width':W,'credits':'Snabbit Workshop','published':1,
 'grid':{'data':''.join(''.join(r) for r in G)},
 'switches':{'data':{idx(p):'A' for p in levers}},
 'gates':{'data':{idx(p):'A' for p in mouths+[(26,9)]}},
 'timers':{'data':{idx(p):'[0,32767,1,0,0,32767]' for p in mouths}}}
(P/'level.json').write_text(json.dumps(level,indent=2)+'\n')
# Cell-authored routes. The typed validation translates these cells to directions
# using the shared native nextCell function and actually replays each decision.
base=[9,9,10,9,9,9,10,9,9,9,9,8]
best=base+[9,9,10,10,11,11,11,10,10,9,9,9,10,9,9,9,10,10,11,11,12,12,13,12,12,11,11,10,10,10,11]
first=[9,8,8,7,7,7,7,7,7,7,8,8,8,8,8,8,9,9,9,9,9,9,9,9,10,9]+best[26:]
third=base+[8,8,9,9,9,8,8,8,8,7,7,7,8,8]+best[26:]
no_choice=base+[8,8,9,9,9,9,9,9,9,9,9,9,10,9]+best[26:]
assert all(len(x)==43 for x in [best,first,third,no_choice])
(P/'authored-routes.json').write_text(json.dumps({'best-middle':best,'first-poor':first,'third-diamond':third,'no-choice':no_choice},indent=2)+'\n')
(P/'map.txt').write_text('\n'.join(f'{r:02d} '+''.join(G[r]) for r in reversed(range(H)))+'\n')
print('Authored 4014:',W,H,'cells',W*H,'metal',sum(row.count('1') for row in G),'hearts',hearts,'levers',levers,'mouths',mouths)
