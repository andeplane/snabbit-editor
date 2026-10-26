"""Called after the first actual-render comparison; add the native XOR rhythm."""
from pathlib import Path
import json
P=Path(__file__).parent
p=P/'level.json';lv=json.loads(p.read_text())
lv['timers']['data']={index:'[1,64,64,0,0,32]' for index in lv['gates']['data']}
p.write_text(json.dumps(lv,indent=2)+'\n')
