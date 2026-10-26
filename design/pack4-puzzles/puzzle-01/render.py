"""Render actual JSON with original source PNGs; concept.png stays untouched."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
O=Path(__file__).parent
R=Path('/Users/anderhaf/repos/snabbit/Resources/World')
L=json.loads((O/'level.json').read_text());V=json.loads((O/'validation.json').read_text())
W=L['width'];H=len(L['grid']['data'])//W;S=2;PAD=54
names={'1':[f'metal0{i}' for i in range(9)],'2':[f'rock0{i}' for i in range(10)],'3':[f'dirt0{i}' for i in range(10)],'4':['bluegem00','bluegem01','bluegem02','bluegem03'],'8':['star'],'9':['diamond00'],'=':['switch-off']}
cache={}
def pos(r,c):return PAD+(c*32+(r%2)*16)*S,PAD+(H-1-r)*16*S
def render(mask=0):
 img=Image.new('RGBA',(W*32*S+2*PAD,H*16*S+2*PAD),'#101a30');d=ImageDraw.Draw(img)
 for r in range(H):
  for c in range(W):
   i=r*W+c;ch=L['grid']['data'][i];x,y=pos(r,c)
   if ch in names:
    n='switch-on' if ch=='=' and mask else names[ch][(r*3+c*7)%len(names[ch])]
    key=(n, bool(str(i) in L['gates']['data'] and mask))
    if key not in cache:
     a=Image.open(R/('Switches' if ch=='=' else 'Space')/f'{n}.png').convert('RGBA')
     if ch=='=':a.thumbnail((34*S,34*S),Image.Resampling.LANCZOS)
     else:a=a.resize((round(a.width*S/2),round(a.height*S/2)),Image.Resampling.LANCZOS)
     if key[1]:a=a.resize((round(a.width*.4),round(a.height*.4)),Image.Resampling.LANCZOS)
     cache[key]=a
    a=cache[key];img.alpha_composite(a,(round(x-a.width/2),round(y-a.height/2)))
   elif ch=='7':
    for dx,dy in [(-12,0),(-5,-3),(2,2),(10,-1)]:
     xx=x+dx*S;yy=y+dy*S
     d.line((xx-3,yy,xx+3,yy),fill='#f8dc75',width=2);d.line((xx,yy-3,xx,yy+3),fill='#f8dc75',width=2)
 return img
actual=render();actual.convert('RGB').save(O/'actual-map.png')
openmap=render(1);openmap.convert('RGB').save(O/'door-open-map.png')
route=openmap.copy();d=ImageDraw.Draw(route)
path=V['authoredRoute']['path']
for a,b in zip(path,path[1:]):
 if abs(a['col']-b['col'])<3:d.line((pos(a['row'],a['col']),pos(b['row'],b['col'])),fill='#90d6bd',width=3)
route.convert('RGB').save(O/'route-review.png')
# Comparison is a separate artifact; neither input file is altered.
concept=Image.open(O/'concept.png').convert('RGB');actual=actual.convert('RGB')
height=1500;gutter=32
ims=[]
for a in [concept,actual]:
 b=a.copy();b.thumbnail((1100,height),Image.Resampling.LANCZOS);ims.append(b)
cmp=Image.new('RGB',(sum(i.width for i in ims)+3*gutter,height+80),'#0b1425');d=ImageDraw.Draw(cmp)
x=gutter
for label,a in zip(['ImageGen concept (unchanged source)','Actual JSON / original game sprites'],ims):
 d.text((x,18),label,fill='white');cmp.paste(a,(x,58));x+=a.width+gutter
cmp.save(O/'comparison.png')
