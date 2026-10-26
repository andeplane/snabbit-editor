from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
P=Path(__file__).parent
ROOT=P.parents[2]
L=json.loads((P/'level.json').read_text());W=L['width'];H=len(L['grid']['data'])//W
S=2;PAD=45
im=Image.new('RGBA',(W*32*S+PAD*2,H*16*S+PAD*2),'#0b1421')
def pos(r,c):return PAD+(c*32+(r%2)*16)*S,PAD+(H-1-r)*16*S
names={'1':['metal00','metal01','metal02'],'2':['rock00','rock01'],'3':['dirt00','dirt01','dirt02'],'4':['bluegem00'],'8':['star'],'9':['diamond00']}
cache={}
for r in range(H):
 for c in range(W):
  ch=L['grid']['data'][r*W+c];x,y=pos(r,c)
  if ch in names:
   n=names[ch][(r*3+c*7)%len(names[ch])]
   if n not in cache:
    a=Image.open(ROOT/'game-resources/World/Space'/f'{n}.png').convert('RGBA')
    a=a.resize((int(a.width*S/2),int(a.height*S/2)),Image.Resampling.LANCZOS);cache[n]=a
   a=cache[n];im.alpha_composite(a,(round(x-a.width/2),round(y-a.height/2)))
  elif ch=='7':
   d=ImageDraw.Draw(im)
   for dx,dy in [(-12,0),(-5,-3),(2,2),(10,-1)]:
    xx=x+dx*S;yy=y+dy*S;d.line((xx-3,yy,xx+3,yy),fill='#f8dc75',width=2);d.line((xx,yy-3,xx,yy+3),fill='#f8dc75',width=2)
im.convert('RGB').save(P/'actual-map.png')
route=im.copy();d=ImageDraw.Draw(route)
v=json.loads((P/'validation.json').read_text())
points=v['winningReplay']['path']
for a,b in zip(points,points[1:]):
 if abs(a['col']-b['col'])<3:d.line((*pos(a['row'],a['col']),*pos(b['row'],b['col'])),fill='#8dddb9',width=3)
route.convert('RGB').save(P/'route-review.png')
canvas=Image.new('RGB',(1600,1180),'#101722');draw=ImageDraw.Draw(canvas)
draw.text((25,18),'ImageGen composition                                      Real native JSON / original sprites',fill='white')
for path,x in [(P/'concept.png',25),(P/'actual-map.png',815)]:
 a=Image.open(path).convert('RGB');a.thumbnail((755,1100),Image.Resampling.LANCZOS);canvas.paste(a,(x+(755-a.width)//2,55))
canvas.save(P/'comparison.png')
