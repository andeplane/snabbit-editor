from PIL import Image,ImageDraw
import json
from pathlib import Path
p=Path(__file__).parent
l=json.loads((p/'level.json').read_text());W=l['width'];H=len(l['grid']['data'])//W
assets=Path('/Users/anderhaf/repos/snabbit-editor/public/assets')
im=Image.new('RGBA',(W*40+80,H*20+90),'#101a2e');d=ImageDraw.Draw(im)
for r in range(H):
 if r%10==0:d.text((8,(H-r)*20+30),str(r),fill='#63708a')
 for c in range(W):
  ch=l['grid']['data'][r*W+c]
  if ch=='0':continue
  x=40+c*40+r%2*20;y=(H-r)*20+30
  if ch=='7':d.ellipse((x-2,y-2,x+2,y+2),fill='#c4ebef');continue
  f='switches/switch-off.png' if ch=='=' else 'world/'+{'1':f'metal0{(r+c)%9}.png','2':f'rock0{(r+c)%10}.png','4':'bluegem00.png','8':'star.png'}[ch]
  s=Image.open(assets/f).convert('RGBA');s.thumbnail((25,25) if ch!='=' else (34,34))
  if str(r*W+c) in l['timers']['data']:
   a=s.getchannel('A').point(lambda v:int(v*.50));s.putalpha(a)
  im.alpha_composite(s,(x-s.width//2,y-s.height//2))
im.convert('RGB').save(p/'native-map.png')
