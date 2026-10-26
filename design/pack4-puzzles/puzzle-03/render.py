from pathlib import Path
import json
from PIL import Image,ImageDraw
P=Path(__file__).parent;A=Path('/Users/anderhaf/repos/snabbit-editor/public/assets/world')
l=json.loads((P/'level.json').read_text());W=l['width'];H=len(l['grid']['data'])//W
im=Image.new('RGBA',(W*36+74,H*18+86),'#101a2e');d=ImageDraw.Draw(im)
for r in range(H):
 if r%10==0:d.text((4,(H-r)*18+34),str(r),fill='#65728b')
 for c in range(W):
  ch=l['grid']['data'][r*W+c]
  if ch=='0':continue
  x=38+c*36+(r%2)*18;y=(H-r)*18+34
  if ch=='7':
   for dx,dy in [(-7,1),(0,-2),(6,1)]:d.ellipse((x+dx-1,y+dy-1,x+dx+1,y+dy+1),fill='#e2f2bd')
   continue
  file={'1':f'metal0{(r+c)%9}.png','2':f'rock0{(r*3+c)%10}.png','3':f'dirt0{(r+c)%10}.png','4':'bluegem00.png','6':'life.png','8':'star.png'}[ch]
  s=Image.open(A/file).convert('RGBA');s.thumbnail((28,28))
  if str(r*W+c) in l['timers']['data']:s.putalpha(s.getchannel('A').point(lambda v:int(v*.55)))
  im.alpha_composite(s,(x-s.width//2,y-s.height//2))
im.convert('RGB').save(P/'actual-map.png')
concept=Image.open(P/'concept.png').convert('RGB');actual=im.convert('RGB');h=1300
concept=concept.resize((round(concept.width*h/concept.height),h));actual=actual.resize((round(actual.width*h/actual.height),h))
o=Image.new('RGB',(concept.width+actual.width+32,h+50),'#101a2e');o.paste(concept,(0,50));o.paste(actual,(concept.width+32,50));dr=ImageDraw.Draw(o);dr.text((15,18),'Unchanged ImageGen composition',fill='white');dr.text((concept.width+48,18),'Real native JSON / original sprite renderer',fill='white');o.save(P/'comparison.png')
