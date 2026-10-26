"""Review render using genuine source PNGs. This is not the ImageGen concept."""
from PIL import Image, ImageDraw
from pathlib import Path
import json
P=Path(__file__).resolve().parents[3]
O=Path(__file__).parent
L=json.loads((O/'level.json').read_text());V=json.loads((O/'validation.json').read_text())
W=L['width'];H=len(L['grid']['data'])//W
S=2;PAD=56
img=Image.new('RGBA',(W*32*S+PAD*2,H*16*S+PAD*2),'#101a30')
d=ImageDraw.Draw(img)
def pos(r,c):return (PAD+(c*32+(r%2)*16)*S,PAD+(H-1-r)*16*S)
names={'1':[f'metal0{i}' for i in range(9)],'2':[f'rock0{i}' for i in range(10)],'3':[f'dirt0{i}' for i in range(10)],'4':['bluegem00','bluegem01','bluegem02','bluegem03'],'8':['star'],'9':['diamond00'],'=':['switch-off']}
cache={}
for r in range(H):
 for c in range(W):
  ch=L['grid']['data'][r*W+c];x,y=pos(r,c)
  if ch in names:
   n=names[ch][(r*3+c*7)%len(names[ch])]
   if n not in cache:
    base=P/'game-resources/World'/('Switches' if ch=='=' else 'Space')/f'{n}.png'
    a=Image.open(base).convert('RGBA')
    if ch=='=': a.thumbnail((36*S,36*S),Image.Resampling.LANCZOS)
    else: a=a.resize((int(a.width*S/2),int(a.height*S/2)),Image.Resampling.LANCZOS)
    cache[n]=a
   a=cache[n];img.alpha_composite(a,(round(x-a.width/2),round(y-a.height/2)))
   if str(r*W+c) in L['gates']['data']:
    q=13*S;d.ellipse((x-q,y-q,x+q,y+q),outline='#eab44b',width=2*S)
  elif ch=='7':
   for dx,dy in [(-12,0),(-5,-3),(2,2),(10,-1)]:
    xx=x+dx*S;yy=y+dy*S;d.line((xx-3,yy,xx+3,yy),fill='#f8dc75',width=2);d.line((xx,yy-3,xx,yy+3),fill='#f8dc75',width=2)
img.convert('RGB').save(O/'map-render.png')
route=img.copy();dr=ImageDraw.Draw(route)
path=V['result']['path']
for a,b in zip(path,path[1:]):
 if abs(a['col']-b['col'])<3:dr.line((pos(a['row'],a['col']),pos(b['row'],b['col'])),fill='#8ee6b2',width=3)
for p in path:
 x,y=pos(p['row'],p['col']);dr.ellipse((x-3,y-3,x+3,y+3),fill='#c2ffdd')
route.convert('RGB').save(O/'route-review.png')
