from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
P=Path(__file__).parent;A=Path('/Users/anderhaf/repos/snabbit-editor/public/assets')
lv=json.loads((P/'level.json').read_text());w=lv['width'];s=lv['grid']['data'];h=len(s)//w
im=Image.new('RGBA',(w*32+64,h*16+96),(14,24,43,255));d=ImageDraw.Draw(im)
d.text((20,15),'Reverse the Rhythm - actual native JSON',fill='#dce9f2')
xy=lambda r,c:(32+c*32+(r%2)*16,54+(h-1-r)*16)
cache={}
snapshot=json.loads((P/'render-state.json').read_text()) if (P/'render-state.json').exists() else None
for r in range(h):
 for c in range(w):
  ch=s[r*w+c]
  if ch=='0':continue
  x,y=xy(r,c)
  if ch=='7':d.line((x-14,y,x+14,y),fill='#d6ffeb',width=2);continue
  name={'1':f'metal0{(r*3+c*7)%9}','2':f'rock0{(r*3+c*7)%10}',
   '4':f'bluegem0{(r+c)%4}','8':'star','9':'diamond00','=':'switch-off'}[ch]
  if name not in cache:
   a=Image.open(A/('switches' if ch=='=' else 'world')/(name+'.png')).convert('RGBA')
   cache[name]=a.resize((32,32) if ch=='=' else (a.width//2,a.height//2),Image.Resampling.LANCZOS)
  a=cache[name]
  if snapshot and str(r*w+c) in snapshot['visibleGates'] and not snapshot['visibleGates'][str(r*w+c)]:
   a=a.resize((round(a.width*.4),round(a.height*.4)),Image.Resampling.LANCZOS)
   a.putalpha(a.getchannel('A').point(lambda x:round(x*.36)))
  im.alpha_composite(a,(int(x-a.width/2),int(y-a.height/2)))
im.convert('RGB').save(P/'actual-map.png')
concept=Image.open(P/'concept.png').convert('RGB')
# Make a comparison sheet without ever modifying the saved concept image.
cw,ch=concept.size; nh=1200
left=concept.resize((round(cw*nh/ch),nh),Image.Resampling.LANCZOS)
right=im.convert('RGB').resize((round(im.width*nh/im.height),nh),Image.Resampling.LANCZOS)
sheet=Image.new('RGB',(left.width+right.width+60,nh+60),'#101b2c');z=ImageDraw.Draw(sheet)
z.text((16,15),'IMAGEGEN CONCEPT (unchanged source)',fill='white');z.text((left.width+40,15),'ACTUAL JSON / ORIGINAL SPRITES',fill='white')
sheet.paste(left,(10,45));sheet.paste(right,(left.width+40,45));sheet.save(P/'comparison.png')
