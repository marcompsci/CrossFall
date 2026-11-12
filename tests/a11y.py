#!/usr/bin/env python3
"""axe-core (WCAG 2 A/AA) scan of the home screen and every menu destination, light and dark.
Needs axe-core: npm i axe-core (looked up in ./node_modules, ../node_modules or AXE_PATH)."""
import asyncio, os, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from smoke_test import MOCK
cands = [os.environ.get("AXE_PATH", ""), ROOT / "node_modules/axe-core/axe.min.js", ROOT.parent / "node_modules/axe-core/axe.min.js"]
AXE = next((Path(c) for c in cands if c and Path(c).exists()), None)
if not AXE: print("SKIP: axe-core not installed (npm i axe-core)"); sys.exit(2)

async def main():
    from playwright.async_api import async_playwright
    html = (ROOT / "Crossfall/index.html").read_text(encoding="utf-8").replace("<head>", "<head>" + MOCK, 1)
    axe = AXE.read_text(); bad = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for scheme in ("light", "dark"):
            pg = await b.new_page(viewport={"width": 393, "height": 852}, color_scheme=scheme, reduced_motion="reduce")
            await pg.route("**/*", lambda r: r.abort() if r.request.url.startswith("http") else r.continue_())
            await pg.set_content(html); await pg.wait_for_timeout(1000); await pg.add_script_tag(content=axe)
            await pg.evaluate("""()=>{stats.tutDone=true;stats.seen19=1;stats.nick='Tester';stats.freeCats=['Sports','Music','Arcade'];stats.spSkip=1;stats.fullHome=1;
                stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');document.getElementById('onb').hidden=true;S=null;showMenu()}""")
            acts = ["home"] + await pg.evaluate("[...document.querySelectorAll('#drawer [data-act]')].map(b=>b.dataset.act)")
            for a in acts:
                await pg.evaluate("""(a)=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});document.getElementById('cele').hidden=true;
                    S=null;showMenu();if(a!=='home'){openDrawer();document.querySelector('#drawer [data-act="'+a+'"]').click()}}""", a)
                await pg.wait_for_timeout(450)
                r = await pg.evaluate("""async()=>{const r=await axe.run(document,{runOnly:['wcag2a','wcag2aa'],resultTypes:['violations']});
                    return r.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>v.id+' ('+v.nodes.length+') '+v.nodes[0].target.join(' '))}""")
                if r: bad[f"{scheme}/{a}"] = r
            await pg.close()
        await b.close()
    for k, v in bad.items(): print("FAIL", k, "·", "; ".join(v[:3]))
    print(f"a11y: {len(acts)} screens x 2 schemes, {len(bad)} with serious/critical violations")
    return not bad
sys.exit(0 if asyncio.run(main()) else 1)
