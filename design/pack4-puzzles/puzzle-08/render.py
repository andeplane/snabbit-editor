"""Deterministic real-JSON renderer using original game assets.
Only the separate comparison canvas scales the ImageGen concept; concept.png
itself is never changed. No debug/channel wall colors are added.
"""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,hashlib
P=Path(__file__).parent
world=Path('/Users/anderhaf/repos/snabbit/Resources/World/Space')
lever=Path('/Users/anderhaf/repos/snabbit/Resources/World/Switches')
L=json.loads((P/'level.json').read_text());V=json.loads((P/'validation.json').read_text())
W=L['width'];H=len(L['grid']['data'])//W;S=1.5;PAD=45
names={'1':[f'metal0{i}' for i in range(9)],'2':[f'rock0{i}' for i in range(10)],'3':[f'dirt0{i}' for i in range(10)],'4':[f'bluegem0{i}' for i in range(4)],'6':['life'],'8':['star'],'9':['diamond00']}
cache={}
def pos(r,c):return PAD+(c*32+(r%2)*16)*S,PAD+58+(H-1-r)*16*S

def render(selected=False):
 im=Image.new('RGBA',(int(W*32*S+PAD*2),int(H*16*S+PAD*2+95)),(12,20,31,255));d=ImageDraw.Draw(im)
 d.text((PAD,18),'ONE LEVER ONLY · 4014',fill='#edf1e9')
 d.text((PAD,39),'Real native JSON · initial state' if not selected else 'After choosing the first lever · later mouths shut',fill='#b7c3c6')
 for r in range(H):
  if r%5==0:d.text((10,pos(r,0)[1]-5),str(r),fill='#607583')
  for c in range(W):
   char=L['grid']['data'][r*W+c];idx=str(r*W+c);x,y=pos(r,c)
   if char=='0':continue
   if char=='7':
    for dx,dy,rad in [(-10,2,1.4),(-5,-2,1.8),(1,1,1.2),(8,-1,1.5)]:
     xx,yy=x+dx*S,y+dy*S;d.ellipse((xx-rad*S,yy-rad*S,xx+rad*S,yy+rad*S),fill='#ffda70')
    continue
   name=('switch-on' if selected else 'switch-off') if char=='=' else names[char][(r*3+c*7)%len(names[char])]
   path=(lever if char=='=' else world)/(name+'.png')
   if name not in cache:cache[name]=Image.open(path).convert('RGBA')
   spr=cache[name].copy();scale=1;alpha=1
   state=V['renderStates']['selected' if selected else 'initial'].get(idx,True)
   if selected:
    choice=next(e for e in V['firstChoiceReplay']['events'] if e['kind']=='lever-1')
    passed={(p['row']*W+p['col']) for p in V['firstChoiceReplay']['path'] if p['time']<=choice['time']}
    if int(idx) in passed and not V['renderStates']['initial'].get(idx,True):state=False
   if not state:scale=.4;alpha=.4
   size=(round(32*S*scale),round(32*S*scale));spr=spr.resize(size,Image.Resampling.LANCZOS)
   if char in ['1','2','3','4'] and (r*7+c*3)%2:spr=spr.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   if alpha<1:spr.putalpha(spr.getchannel('A').point(lambda a:round(a*alpha)))
   im.alpha_composite(spr,(round(x-spr.width/2),round(y-spr.height/2)))
 d=ImageDraw.Draw(im);d.text((PAD,im.height-45),'Upward motion · no permanent channel/debug colors',fill='#8b9ca5')
 return im
im=render();im.convert('RGB').save(P/'actual-map.png')
render(True).convert('RGB').save(P/'after-selection.png')
route=im.copy();d=ImageDraw.Draw(route)
path=V['winningReplay']['path']
for a,b in zip(path,path[1:]):
 if abs(a['col']-b['col'])<3:d.line((*pos(a['row'],a['col']),*pos(b['row'],b['col'])),fill='#8ce3ba',width=2)
route.convert('RGB').save(P/'route-review.png')
concept=Image.open(P/'concept.png').convert('RGB');actual=im.convert('RGB');concept.thumbnail((720,2100),Image.Resampling.LANCZOS);actual.thumbnail((850,2100),Image.Resampling.LANCZOS)
comp=Image.new('RGB',(concept.width+actual.width+70,max(concept.height,actual.height)+90),(17,24,35));d=ImageDraw.Draw(comp)
d.text((20,18),'ImageGen composition — original source retained unchanged',fill='white');d.text((concept.width+50,18),'REAL JSON · original sprites · compressed to visible commitments',fill='white')
comp.paste(concept,(20,55));comp.paste(actual,(concept.width+50,55));comp.save(P/'comparison.png')
print('Rendered actual-map.png, after-selection.png, route-review.png, comparison.png')
