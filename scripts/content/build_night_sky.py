"""Build 70 Night Sky puzzles from night_sky.py and check each one with the game's own buildCrossword.
Keeps each slot's drop/find/speed/seed/gen so the game-play mix (and players' progress ids) stays the same.
Writes scripts/content/night_sky.json. Usage: python3 scripts/content/build_night_sky.py"""
import asyncio, json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).parent))
from night_sky import THEMES

def slots(src):
    out = []
    i = src.find('{name:"Night Sky",puzzles:['); j = src.find(']}\n];', i)
    base = src[i:j]
    for m in re.finditer(r'\{name:"[^"]+",drop:"(\w+)",find:"(\w+)",speed:(\d+),seed:(\d+),\s*words:\[(.*?)\]\],', base, re.S):
        out.append({"drop": m[1], "find": m[2], "speed": int(m[3]), "seed": int(m[4]), "n": m[5].count('["')})
    for m in re.finditer(r'"Night Sky":\[', src):
        k = m.end() - 1; d = 0
        for e in range(k, len(src)):
            if src[e] == '[': d += 1
            elif src[e] == ']':
                d -= 1
                if d == 0: break
        for p in json.loads(src[k:e + 1]):
            o = {x: p[x] for x in ("drop", "find", "speed", "seed") if x in p}
            if p.get("gen"): o["gen"] = p["gen"]
            o["n"] = len(p["words"]); out.append(o)
    return out

JS = """async ({themes, slots})=>{
  let s0=12345;const R=()=>{s0=(s0*1103515245+12345)%2147483648;return s0/2147483648};
  const sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const bag=w=>{const m={};for(const c of w)m[c]=(m[c]||0)+1;return m};
  const fits=(t,words)=>{const have=bag(words.join("")),need=bag(t);return Object.keys(need).every(c=>(have[c]||0)>=need[c])};
  const out=[];
  for(let i=0;i<slots.length;i++){const sl=slots[i],th=themes[i%themes.length],name=th[1][Math.floor(i/themes.length)],V=th[2];
    let made=null;
    for(let t=0;t<400&&!made;t++){const pick=sh(V).slice(0,Math.max(5,Math.min(7,sl.n)));
      const cw=buildCrossword(pick,sl.seed,40);if(!cw||cw.rows>9||cw.cols>9)continue;
      const rest=V.filter(v=>!pick.includes(v));
      const tg=sh(rest).find(v=>v[0].length>=3&&v[0].length<=6&&fits(v[0],pick.map(p=>p[0])));if(!tg)continue;
      const bonus=sh(rest.filter(v=>v!==tg)).slice(0,3);
      made={name,drop:sl.drop,find:sl.find,speed:sl.speed,seed:sl.seed,...(sl.gen?{gen:sl.gen}:{}),words:pick,target:tg,bonus}}
    out.push(made||{fail:name})}
  return out}"""

async def main():
    from playwright.async_api import async_playwright
    src = (ROOT / "web" / "crossfall.html").read_text()
    sl = slots(src); print("slots", len(sl))
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.set_content((ROOT / "Crossfall" / "index.html").read_text()); await pg.wait_for_timeout(800)
        res = await pg.evaluate(JS, {"themes": [[t[0], t[1], [list(w) for w in t[2]]] for t in THEMES], "slots": sl})
        await b.close()
    bad = [r for r in res if "fail" in r]
    names = [r.get("name") for r in res]
    print("built", len(res) - len(bad), "failed", [r["fail"] for r in bad], "dup names", len(names) - len(set(names)))
    for t in THEMES:
        for w, c in t[2]:
            assert re.fullmatch(r"[A-Z]{3,9}", w), w
    (Path(__file__).parent / "night_sky.json").write_text(json.dumps(res, ensure_ascii=False))
    return not bad

sys.exit(0 if asyncio.run(main()) else 1)
