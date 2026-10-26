from PIL import Image,ImageDraw
from pathlib import Path
import json
O=Path(__file__).parent
R=Path('/Users/anderhaf/repos/snabbit/Resources/World')
L=json.loads((O/'level.json').read_text());V=json.loads((O/'validation.json').read_text());W=L['width'];H=len(L['grid']['data'])//W
S=2;P=54
names={'1':[f'metal0{i}' for i in range(9)],'2':[f'rock0{i}' for i in range(10)],'3':[f'dirt0{i}' for i in range(10)],'4':['bluegem00'],'8':['star'],'9':['diamond00'],'=':['switch-off']}
def pos(r,c):return(P+(c*32+(r%2)*16)*S,P+(H-1-r)*16*S)
def render(mask):
 im=Image.new('RGBA',(W*32*S+P*2,H*16*S+P*2),'#101a30');d=ImageDraw.Draw(im)
 for r in range(H):
  for c in range(W):
   idx=r*W+c;ch=L['grid']['data'][idx];x,y=pos(r,c)
   if ch in names:
    name=names[ch][(r*3+c*7)%len(names[ch])]
    if ch=='=':
     bit=1<<(ord(L['switches']['data'][str(idx)])-65)
     name='switch-on' if mask&bit else 'switch-off'
    sp=Image.open(R/('Switches' if ch=='=' else 'Space')/(name+'.png')).convert('RGBA')
    if ch=='=':sp.thumbnail((36*S,36*S),Image.Resampling.LANCZOS)
    else:sp=sp.resize((int(sp.width*S/2),int(sp.height*S/2)),Image.Resampling.LANCZOS)
    if str(idx) in L['gates']['data']:
     bit=1<<(ord(L['gates']['data'][str(idx)])-65);on=(False if str(idx) in L['timers']['data'] else True) ^ bool(mask&bit)
     if not on:
      sp=sp.resize((int(sp.width*.4),int(sp.height*.4)),Image.Resampling.LANCZOS);sp.putalpha(sp.getchannel('A').point(lambda x:int(x*.8)))
    im.alpha_composite(sp,(round(x-sp.width/2),round(y-sp.height/2)))
   elif ch=='7':
    for dx,dy in [(-12,0),(-5,-3),(2,2),(10,-1)]:
     xx=x+dx*S;yy=y+dy*S;d.line((xx-3,yy,xx+3,yy),fill='#f8dc75',width=2);d.line((xx,yy-3,xx,yy+3),fill='#f8dc75',width=2)
 return im
im=render(0);im.convert('RGB').save(O/'actual-map.png')
render(3).convert('RGB').save(O/'prepared-map.png');render(2).convert('RGB').save(O/'final-map.png')
route=render(2);d=ImageDraw.Draw(route)
for a,b in zip(V['winningReplay'],V['winningReplay'][1:]):
 if abs(a['col']-b['col'])<3:d.line((pos(a['row'],a['col']),pos(b['row'],b['col'])),fill='#94e6ba',width=3)
route.convert('RGB').save(O/'route-review.png')
# Side-by-side comparison preserves generated source pixels; resize only for review.
con=Image.open(O/'concept.png').convert('RGB');native=im.convert('RGB');targetH=1500
con=con.resize((round(con.width*targetH/con.height),targetH),Image.Resampling.LANCZOS);native=native.resize((round(native.width*targetH/native.height),targetH),Image.Resampling.LANCZOS)
out=Image.new('RGB',(con.width+native.width+60,targetH+70),'#101a30');out.paste(con,(20,50));out.paste(native,(con.width+40,50));d=ImageDraw.Draw(out);d.text((20,20),'Unchanged ImageGen concept (scaled for comparison)',fill='white');d.text((con.width+40,20),'Native JSON / original sprites / initial state',fill='white');out.save(O/'comparison.png')
