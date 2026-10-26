from pathlib import Path
import json,math
out=Path(__file__).parent
w,h=20,62;g=['0']*(w*h)
def put(r,c,ch='1'):g[r*w+c]=ch
# Image-first translation: a broad chipped crescent, two lower lobes and open sky.
for c in range(w):
 low=23+round(3*math.cos(c*2*math.pi/w));thick=5+(c%5==0)+(c<5)*2
 for r in range(low,low+thick):put(r,c)
# Left crescent tail and upper rising horn; vary both edges and cut hollows.
for r in range(5,48):
 center=4+round(2.4*math.sin(r/6));radius=2+(r//6)%2
 for c in range(max(0,center-radius),min(w,center+radius+1)):
  if (r*7+c*3)%19!=0:put(r,c)
for r in range(6,20):
 center=16-round((r-6)/5)
 for c in range(center-1,min(w,center+3)):
  if (r+c)%11!=0:put(r,c)
# Enforce a geometrically sealed curved dividing mass, continuous at wrap seam.
for c in range(w):
 low=23+round(3*math.cos(c*2*math.pi/w))
 for r in range(low,low+5):put(r,c)
# One throat with a distinct curved lip. Initially model image geometry with empty throat.
for r in range(18,31):put(r,10,'0')
# Keep lower decisions airy, both mutually exclusive choices at the same height.
put(10,7,'6');put(10,12,'=')
for r in range(8,14):
 for c in range(8,13):
  if c!=7:put(r,c,'0')
put(10,7,'6');put(10,12,'=')
# Three stars do not form a rail; broad post-throat sky supports steering.
for r,c in [(17,10),(36,8),(49,12)]:put(r,c,'8')
# Rich cache on right, separated from the exit by a broken pod rim.
for r,c in [(30,12),(31,11),(32,11),(33,11),(34,11),(35,12),(36,12),(37,13),(38,14),(37,15),(36,15),(35,15),(34,14),(33,14),(32,13)]:put(r,c)
for r,c in [(33,12),(35,13),(37,14)]:put(r,c,'6')
put(32,12,'1')
for r,c in [(52,3),(53,3),(53,4),(44,17),(45,17),(46,18),(4,1),(5,1),(56,6),(57,6),(58,7)]:put(r,c)
for c in range(8,17):put(56,c,'7')
l={'_type':'level','_ns':'level','_id':'4015','name':'No Credit','width':w,'creator':'codex','credits':'Pack 4 · No Credit','published':1,'grid':{'data':''.join(g)},'timers':{'data':{}},'switches':{'data':{str(10*w+12):'A'}},'gates':{'data':{str(32*w+12):'A'}}}
(out/'level.json').write_text(json.dumps(l,indent=2)+'\n')
(out/'composition-model.json').write_text(json.dumps(l,indent=2)+'\n')
