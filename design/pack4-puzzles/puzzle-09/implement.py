from pathlib import Path
import json
p=Path(__file__).parent/'level.json';l=json.loads(p.read_text());g=list(l['grid']['data']);w=l['width']
for r,c in [(6,8),(7,8),(8,8),(9,7),(11,8),(12,8),(13,9),(14,9),(15,10),(16,10)]:g[r*w+c]='0'
for r,c in [(5,8),(11,7),(12,8),(13,8),(14,9),(15,9),(16,10),(32,12)]:g[r*w+c]='0'
g[30*w+13]='1';l['gates']['data']={str(30*w+12):'A'}
for r in [20,22,24]:g[r*w+10]='3'
l['grid']['data']=''.join(g);p.write_text(json.dumps(l,indent=2)+'\n')
