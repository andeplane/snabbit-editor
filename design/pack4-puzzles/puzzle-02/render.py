from PIL import Image,ImageDraw
from pathlib import Path
import json
out=Path(__file__).parent;l=json.loads((out/'level.json').read_text());w=l['width'];h=len(l['grid']['data'])//w
world=Path('/Users/anderhaf/repos/snabbit/Resources/World/Space');switch=Path('/Users/anderhaf/repos/snabbit/Resources/World/Switches');cache={}
def render(mask=0):
 im=Image.new('RGB',(820,1220),(15,23,38));d=ImageDraw.Draw(im)
 d.text((24,18),'Borrowed Passage · 4008',fill=(230,239,225))
 d.text((24,40),'REAL JSON · original sprites · initial state' if mask==0 else 'REAL JSON · after the first toggle',fill=(149,164,175))
 for r in range(h):
  for c in range(w):
   ch=l['grid']['data'][r*w+c];idx=str(r*w+c)
   if ch=='0':continue
   name={'1':f'metal0{(r*3+c*7)%9}','2':f'rock0{(r*3+c*7)%10}','3':f'dirt0{(r*3+c*7)%10}','4':'bluegem00','6':'life','8':'star','7':'milestone','=':'switch-on' if mask else 'switch-off'}[ch]
   fn=(switch if ch=='=' else world)/(name+'.png')
   if name not in cache:cache[name]=Image.open(fn).convert('RGBA')
   spr=cache[name].copy();size=45 if ch=='=' else 46
   if idx in l['gates']['data']:
    initially_on=idx not in l['timers']['data'];on=initially_on != bool(mask)
    if not on:size=round(size*.4);spr.putalpha(spr.getchannel('A').point(lambda a:round(a*.8)))
   spr.thumbnail((size,size))
   x=35+c*48+(r%2)*24;y=1148-r*24
   im.paste(spr,(int(x-spr.width/2),int(y-spr.height/2)),spr)
 d.text((24,1183),'Upward only · left/right control · horizontal wrap',fill=(149,164,175))
 return im
im=render();im.save(out/'actual-map.png');render(1).save(out/'after-toggle.png')
# Preserve generated image pixels: comparison is a separate labeled contact sheet.
concept=Image.open(out/'concept.png').convert('RGB');concept.thumbnail((650,1500));actual=im.copy();actual.thumbnail((1000,1500))
comp=Image.new('RGB',(concept.width+actual.width+80,max(concept.height,actual.height)+90),(23,29,39));d=ImageDraw.Draw(comp);d.text((20,20),'ImageGen composition (unaltered source)',fill='white');d.text((concept.width+60,20),'Native JSON, original sprites, native offset geometry',fill='white');comp.paste(concept,(20,55));comp.paste(actual,(concept.width+60,55));comp.save(out/'comparison.png')
