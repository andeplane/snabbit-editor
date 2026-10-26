from pathlib import Path
import json
out=Path(__file__).parent;w,h=16,46;g=[['0']*w for _ in range(h)]
# The generated teardrop's chipped lower base and small right shoulder.
shapes={
2:[3,4,5],3:[2,3,4,5,6],4:[2,3,5,6,7],5:[3,4,5,6,7,8],6:[3,4,6],7:[4,5,6],8:[4,5,6],9:[4,5,7],10:[5,6,7],11:[6,7],12:[7,10],13:[7,10,11],14:[8,9,10,11],15:[8,10],16:[7,10],
# The fork's uneven central tongue. Its left edge sits beside the reachable
# reset trajectory, not on it. No row spans the playfield.
18:[8,9],19:[8,9,10],20:[7,8,9],21:[7,8,9],22:[6,7,8],23:[6,7],24:[6,7],25:[7],
# Left outer shore around the reset; unlike the central tongue it breaks apart.
18:[3,4,8,9],19:[3,8,9,10],20:[2,3,7,8,9],21:[2,3,7,8,9],22:[2,4,6,7,8],23:[3,4,6,7],24:[3,6,7],25:[3,4,7],26:[4,5],27:[4,5,6],28:[5,6],
# Right broad shore of the teardrop; lumpy and porous, not a rail corridor.
17:[12],18:[8,9,12,13],19:[8,9,10,13],20:[7,8,9,12,13],21:[7,8,9,13,14],22:[6,7,8,12,13],23:[6,7,12,13],24:[6,7,13],25:[7,12,13],26:[4,5,11,12],27:[4,5,6,11,12],28:[5,6,10,11],29:[6,10,11],30:[6,10],31:[6,10],
# Small upper crossing knot, deliberately much smaller than the fork.
32:[5,6,9],33:[5,6,7,8,9],34:[5,8,9],35:[5,6,8],36:[6,8],37:[6],38:[5,6],39:[5],
}
for r,cs in shapes.items():
 for c in cs:g[r][c]='1'
# Keep both fork mouths open; the central tongue separates them one row later.
for r,c in [(18,8),(18,9),(19,9),(19,10),(20,7),(22,6),(27,6)]:g[r][c]='0'
# Airy detached chips echo the high-resolution composition.
for r,c,ch in [(3,11,'2'),(7,12,'2'),(10,2,'2'),(13,13,'1'),(16,4,'2'),(18,1,'2'),(21,15,'2'),(24,1,'2'),(27,14,'2'),(29,2,'2'),(31,12,'2'),(35,2,'2'),(38,11,'2'),(41,5,'1')]:g[r][c]=ch
# Three sparse incidentals, not a route rail or combo supply.
for r,c in [(5,10),(6,10),(36,3)]:g[r][c]='4'
for r,c in [(15,9),(30,8),(34,7)]:g[r][c]='8'
for r,c in [(8,8),(24,5)]:g[r][c]='='
g[24][11]='6'
g[41][8]='7'
gates={str(14*w+9):'A',str(14*w+10):'A',str(33*w+6):'A',str(33*w+7):'A'}
# startState=0 remains off for the entire level, then channel inversion closes
# this otherwise-open upper crossing. No fake multi-channel/AND metadata.
timers={str(33*w+c):'[0,32767,32767,0,0,0]' for c in [6,7]}
l={'_type':'level','_id':'4008','_ns':'level','name':'Borrowed Passage','width':w,'credits':'Pack 4 puzzle design','published':1,'grid':{'data':''.join(''.join(r) for r in g)},'timers':{'data':timers},'switches':{'data':{str(8*w+8):'A',str(24*w+5):'A'}},'gates':{'data':gates}}
(out/'level.json').write_text(json.dumps(l,indent=2)+'\n')
(out/'map.txt').write_text('\n'.join(f'{r:02} '+''.join(g[r]) for r in range(h-1,-1,-1))+'\n')
