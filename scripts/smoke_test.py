#!/usr/bin/env python3
"""Headless smoke test of the shipped game (Crossfall/index.html) with the native bridges mocked.

Checks: cold start with empty storage, first-run onboarding, a full puzzle played to the end,
every menu destination opens and closes, the settings screen, the privacy link, and that the
page makes no network requests of its own. Any uncaught JS error fails the test.

Usage: python3 scripts/smoke_test.py      (needs: pip install playwright && playwright install chromium)
Exit code 0 = pass, 1 = fail. Prints one line per check.
"""
import asyncio, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MOCK = """<script>window.__NATIVE_GC=true;window.__NATIVE_NOTIFY=true;window.__NATIVE_IAP=true;window.__NATIVE_TS=1;window.__msgs=[];
const H=n=>({postMessage(m){window.__msgs.push([n,m]);if(n==="notify")setTimeout(()=>window.__notify&&__notify({granted:true}),30)}});
window.webkit={messageHandlers:{theme:H("theme"),gc:H("gc"),share:H("share"),haptic:H("haptic"),notify:H("notify"),status:H("status"),iap:H("iap"),say:H("say"),locate:H("locate")}};</script>"""
PLAY = """async()=>{for(let i=0;i<500;i++){const st=S&&S.phase;
 if(st==='cross'){const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}
 else if(st==='drop')hardDrop();
 else if(st==='rush'){if(S.rush.mode==='tap'){const o=occurrences(S.rush.word)[0];if(o)o.forEach(([r,c])=>rushTap(r,c))}else for(const ch of S.rush.word)typeLetter(ch);await new Promise(r=>setTimeout(r,900))}
 else if(st==='done'||st==='over')return st;else await new Promise(r=>setTimeout(r,150))}return S&&S.phase}"""

async def main():
    from playwright.async_api import async_playwright
    results, errors, external = [], [], []
    def check(name, ok, detail=""):
        results.append(ok); print(f"{'PASS' if ok else 'FAIL'}  {name}{('  · ' + detail) if detail else ''}")
    html = (ROOT / "Crossfall" / "index.html").read_text(encoding="utf-8")
    html = html.replace("<head>", "<head>" + MOCK, 1)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 393, "height": 852})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        async def route(r):
            u = r.request.url
            if u.startswith(("http://", "https://")): external.append(u); await r.abort()
            else: await r.continue_()
        await pg.route("**/*", route)
        await pg.set_content(html); await pg.wait_for_timeout(1200)
        check("cold start renders", await pg.evaluate("typeof S!=='undefined'&&!!document.getElementById('menu')"))
        check("first-run onboarding or tour shown", await pg.evaluate("!document.getElementById('onb').hidden||!!(S&&S.tut)"))
        await pg.evaluate("""()=>{stats.tutDone=true;stats.seen16=1;stats.nick='Tester';stats.freeCats=['Sports','Music','Arcade'];stats.spSkip=1;
            stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');document.getElementById('onb').hidden=true;S=null;showMenu()}""")
        await pg.wait_for_timeout(400)
        await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(200)
        end = await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        check("a full puzzle plays to the end", end in ("done", "over"), end)
        check("result screen shown", await pg.evaluate("!document.getElementById('result').hidden"))
        acts = await pg.evaluate("[...document.querySelectorAll('#drawer [data-act]')].map(b=>b.dataset.act)")
        bad = []
        for a in acts:
            if a in ("pro",): continue
            n0 = len(errors)
            await pg.evaluate("""(a)=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});document.getElementById('cele').hidden=true;
                S=null;showMenu();openDrawer();document.querySelector('#drawer [data-act="'+a+'"]').click()}""", a)
            await pg.wait_for_timeout(250)
            if len(errors) > n0: bad.append(a)
        check(f"all {len(acts)} menu destinations open without errors", not bad, ",".join(bad))
        await pg.evaluate("document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});document.getElementById('settings').hidden=false")
        check("privacy policy link in Settings", await pg.evaluate("[...document.querySelectorAll('#settings a')].some(a=>/PRIVACY\\.md$/.test(a.href))"))
        check("support link in Settings", await pg.evaluate("[...document.querySelectorAll('#settings a')].some(a=>/SUPPORT\\.md$/.test(a.href))"))
        check("restore purchase reachable", await pg.evaluate("document.body.innerHTML.includes('Restore purchase')"))
        # Shared codes come from other people: HTML in a title, clue or nickname must never run.
        X = '<img src=x onerror="window.__pwn=1">'
        await pg.evaluate("""(X)=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});S=null;showMenu();
            const spec={t:'T '+X,w:[['APPLE','fruit '+X],['PEAR','green '+X],['PLUM','purple'],['LEMON','sour'],['MANGO','tropical']],d:'bar',f:'clue',s:7};
            const r=buildCustom(readCustomCode(customCode(spec)));startLevel(r.L)}""", X)
        await pg.wait_for_timeout(300); await pg.evaluate(PLAY); await pg.wait_for_timeout(600)
        await pg.evaluate("(X)=>{const c=readChalCode('CFC.'+b64e(JSON.stringify({p:LEVELS[0].id,s:5,n:X,g:X})));if(c){S=null;showMenu();playChallenge(c)}}", X)
        await pg.wait_for_timeout(400)
        check("shared puzzle and challenge codes can't inject HTML", not await pg.evaluate("!!window.__pwn"))
        check("no network requests made by the page", not external, ", ".join(sorted(set(external))[:5]))
        check("no uncaught JavaScript errors", not errors, " | ".join(errors[:3]))
        await b.close()
    return all(results)

if __name__ == "__main__":
    sys.exit(0 if asyncio.run(main()) else 1)
