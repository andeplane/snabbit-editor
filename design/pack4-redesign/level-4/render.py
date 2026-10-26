from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
P=Path(__file__).parent
ROOT=P.parents[2]
lv=json.loads((P/'level.json').read_text()); w=lv['width'];s=lv['grid']['data'];h=len(s)//w
im=Image.new('RGBA',(w*32+64,h*16+100),(14,24,43,255));d=ImageDraw.Draw(im)
d.text((20,14),'The Hollow Orchard - native grid',fill='#d8e6f2')
assets=ROOT/'public/assets'
sprites={}
def draw(name,x,y):
 if name not in sprites:
  f=assets/('switches' if name.startswith('switch') else 'world')/(name+'.png')
  a=Image.open(f).convert('RGBA');sprites[name]=a.resize((32,32) if name.startswith('switch') else (a.width//2,a.height//2),Image.Resampling.LANCZOS)
 a=sprites[name];im.alpha_composite(a,(int(x-a.width/2),int(y-a.height/2)))
path=json.loads((P/'validation.json').read_text())['result']['path']
xy=lambda r,c:(32+c*32+(r%2)*16,60+(h-1-r)*16)
for a,b in zip(path,path[1:]):d.line([xy(a['row'],a['col']),xy(b['row'],b['col'])],fill='#284f66',width=2)
for r in range(h):
 for c in range(w):
  ch=s[r*w+c]
  if ch=='0':continue
  if ch=='7':
   x,y=xy(r,c);d.line((x-14,y,x+14,y),fill='#c9f3e7',width=2);continue
  name=({'1':f'metal0{(r*3+c*7)%9}','2':f'rock0{(r*3+c*7)%10}',
   '4':f'bluegem0{(r+c)%4}','8':'star','9':'diamond00','7':'milestone','=':'switch-off'}).get(ch)
  if name:draw(name,*xy(r,c))
  if str(r*w+c) in lv['gates']['data']:
   x,y=xy(r,c);d.ellipse((x-11,y-11,x+11,y+11),outline='#3a9ebc',width=1)
im.convert('RGB').save(P/'native-map.png')
