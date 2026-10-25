from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
OUT=Path(__file__).parent
l=json.loads((OUT/'level.json').read_text());w=l['width'];h=len(l['grid']['data'])//w
im=Image.new('RGB',(704,1640),(15,23,38));d=ImageDraw.Draw(im)
d.text((26,18),'Two Quiet Shores  ·  4003',fill=(231,239,221))
d.text((26,40),'Actual JSON · 16 columns · upward travel',fill=(145,164,172))
world=Path('/Users/anderhaf/repos/snabbit-editor/game-resources/World/Space')
switch=Path('/Users/anderhaf/repos/snabbit-editor/game-resources/World/Switches')
cache={}
for r in range(h):
 for c in range(w):
  ch=l['grid']['data'][r*w+c]
  if ch=='0':continue
  name= {'1':f'metal0{(r*3+c*7)%9}','2':f'rock0{(r*3+c*7)%10}','3':f'dirt0{(r*3+c*7)%10}','4':'bluegem00','8':'star','7':'milestone','=':'switch-off'}[ch]
  fn=(switch if ch=='=' else world)/(name+'.png')
  if name not in cache:cache[name]=Image.open(fn).convert('RGBA')
  spr=cache[name].copy();spr.thumbnail((43,43) if ch=='=' else (39,39))
  x=32+c*40+(r%2)*20;y=1585-r*21
  im.paste(spr,(int(x-spr.width/2),int(y-spr.height/2)),spr)
  if str(r*w+c) in l.get('gates',{}).get('data',{}):
   group=l['gates']['data'][str(r*w+c)];d.ellipse((x-17,y-17,x+17,y+17),outline=(125,226,125) if group=='A' else (183,150,254),width=2)
d.text((23,1607),'Start r0 c9 →     A opens lower star pocket; B opens upper courtyard',fill=(145,164,172))
im.save(OUT/'map.png')
# Route overlay is a separate artifact and leaves the actual map untouched.
v=json.loads((OUT/'validation.json').read_text());pts=[(32+p['col']*40+(p['row']%2)*20,1585-p['row']*21) for p in v['solver']['path']]
for a,b in zip(pts,pts[1:]):
 if abs(a[0]-b[0])<100:d.line((a,b),fill=(74,186,208),width=2)
im.save(OUT/'route.png')
