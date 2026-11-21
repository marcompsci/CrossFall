"""Phases 73-82 (19 Nov 2026): keyboard feel, Tetris feel, Bay City retired, Night Sky reborn. Run after scripts/build_index.py."""
from pathlib import Path
import asyncio, sys
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from smoke_test import MOCK, PLAY
SRC = (ROOT / 'Crossfall' / 'index.html').read_text().replace('<head>', '<head>' + MOCK, 1)
res = []
def ck(n, ok, d=""):
    res.append(bool(ok)); print(f"{'PASS' if ok else 'FAIL'}  {n}{('  · ' + str(d)) if d not in ('', None) else ''}")
SETUP = """()=>{stats.tutDone=true;stats.nick='T';stats.freeCats=['Sports','Music','Arcade'];stats.spSkip=1;stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');
 stats.seen19=1;stats.seen20=1;stats.seen21=1;stats.seen22=1;stats.seen23=1;stats.seen24=1;stats.seen25=1;stats.seen26=1;stats.seen27=1;stats.seen28=1;stats.seen29=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;S=null;showMenu()}"
TO_DROP = "()=>{const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}return S.phase}"

async def page(b, when, setup=SETUP, pre=None):
    ctx = await b.new_context(viewport={"width": 393, "height": 852}, has_touch=True); pg = await ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time=when)
    html = SRC if not pre else SRC.replace('<head>' + MOCK, '<head>' + MOCK + f'<script>{pre}</script>', 1)
    await pg.set_content(html); await pg.wait_for_timeout(900); await pg.evaluate(setup); await pg.wait_for_timeout(400); return ctx, pg, errs

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await page(b, '2026-11-20T10:00:00')
        # 79 Bay City retired
        bc = await pg.evaluate("[CATEGORIES.some(c=>c.name==='Bay City'),LEVELS.some(l=>l.cat==='Bay City'),EVENTS.some(e=>e.cat==='Bay City'),CATEGORIES.length,document.documentElement.innerHTML.includes('Arcade, Bay City')||JSON.stringify(stats.freeCats).includes('Bay City')]")
        ck("79 Bay City is gone from categories, puzzles, events and text", bc[:3] == [False, False, False] and not bc[4], bc)
        ck("79 daily puzzle still builds without it", await pg.evaluate("(()=>{for(let i=0;i<20;i++){const L=dailyLevel(addDays('2026-11-01',i));if(!L||!L.words||L.words.length<5)return false}return true})()"))
        # 80 Night Sky
        ns = await pg.evaluate("""(()=>{const c=CATEGORIES.find(c=>c.name==='Night Sky');const ok=c.puzzles.every((p,i)=>!!crosswordFor(LEVELS.indexOf(p)));
            const old=['Space','Planets','Stargazing','Moon Phases','Moon Landing'].some(n=>c.puzzles.some(p=>p.name===n));
            const all=c.puzzles.flatMap(p=>[...p.words,...p.bonus,p.target].map(w=>w[0]));const want=['SOUL','LOGOS','POLARIS','ANCESTOR','STARDUST','ZODIAC','KARMA','SPIRIT','ONENESS','ORIGIN'].filter(w=>all.includes(w));
            const bag=w=>{const m={};for(const ch of w)m[ch]=(m[ch]||0)+1;return m};const tgt=c.puzzles.every(p=>{const have=bag(p.words.map(w=>w[0]).join('')),need=bag(p.target[0]);return Object.keys(need).every(k=>(have[k]||0)>=need[k])});
            return {n:c.puzzles.length,ok,old,want:want.length,tgt,tag:CAT_LOOK['Night Sky'].tag,ids:c.puzzles.map(p=>p.id).slice(0,2)}})()""")
        ck("80 Night Sky has 70 puzzles and every crossword builds", ns['n'] == 70 and ns['ok'], ns)
        ck("80 the old space puzzles are replaced with astronomy, philosophy and spirit words", not ns['old'] and ns['want'] == 10, ns['want'])
        ck("80 every target can be spelled from its puzzle's words", ns['tgt'])
        ck("80 progress keeps its place (same ids)", ns['ids'] == ["Night Sky:0", "Night Sky:1"] and "where we come from" in ns['tag'], ns['ids'])
        # 81 + 82 a word to carry, starry well
        await pg.evaluate("stats.freeCats=['Sports','Music','Night Sky'];startLevel(LEVELS.findIndex(l=>l.cat==='Night Sky'))"); await pg.wait_for_timeout(200)
        ck("82 a Night Sky game gets the starry well", await pg.evaluate("document.documentElement.classList.contains('nightsky')"))
        await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        sw = await pg.evaluate("(document.querySelector('#result .sw-panel')||{}).textContent||''")
        ck("81 result shows a word to carry, with its source", "A word to carry" in sw and ("Psalm" in sw or "Plato" in sw or "Whitman" in sw or "Kant" in sw or "Emerson" in sw or "Lao Tzu" in sw or "Marcus" in sw or "Job" in sw or "Delphi" in sw or "Socrates" in sw), sw[:90])
        await pg.evaluate(CLOSE)
        ck("82 the starry well goes away on the menu", await pg.evaluate("!document.documentElement.classList.contains('nightsky')"))
        await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(200)
        ck("81 other categories don't show it", await pg.evaluate("starWordHTML()===''&&!document.documentElement.classList.contains('nightsky')"))
        # 73 keyboard feel
        kf = await pg.evaluate("""()=>{const b=document.querySelector('#pad .k[data-ch="E"]');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const p=document.getElementById('kpop');
            const a=[b.classList.contains('down'),p&&p.classList.contains('on'),p&&p.textContent];b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));return a}""")
        ck("73 pressing a key shows a letter preview and a soft press", kf == [True, True, "E"], kf)
        await pg.wait_for_timeout(150)
        ck("73 preview hides when you let go", await pg.evaluate("!document.getElementById('kpop').classList.contains('on')&&!document.querySelector('#pad .k.down')"))
        tp = await pg.evaluate("""()=>{const w=curWord();const k=w.cells.find(k=>!S.cw.cells.get(k).lock);S.sel.key=k;typeLetter('Q');return !!document.querySelector('#cw .cc.typed')}""")
        ck("73 typed letters pop into the grid", tp)
        ck("73 keys are softer (no hard bottom border)", await pg.evaluate("getComputedStyle(document.querySelector('#pad .kr .k')).borderBottomWidth==='0px'&&parseFloat(getComputedStyle(document.querySelector('#pad .kr .k')).borderRadius)>=8"))
        # 74 pad transition
        ph = await pg.evaluate(TO_DROP); await pg.wait_for_timeout(50)
        ck("74 keypad eases in when it switches to drop controls", ph == "drop" and await pg.evaluate("document.getElementById('pad').classList.contains('pad-in')"), ph)
        # 75 drag on the well
        await pg.wait_for_timeout(400)
        dr = await pg.evaluate("""async()=>{const w=document.getElementById('well'),cw=wellCell(),r=w.getBoundingClientRect();const c0=S.active.c;S.active.c=0;renderWell();const cs=S.active.c;
            const x=r.left+r.width/2,y=r.top+40;const ev=(t,dx,dy)=>w.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerId:7,clientX:x+dx,clientY:y+dy,pointerType:'touch'}));
            ev('pointerdown',0,0);ev('pointermove',cw*2.1,0);ev('pointerup',cw*2.1,0);const moved=S.active.c-cs;
            const k0=JSON.stringify(S.active.cells);ev('pointerdown',0,0);ev('pointerup',1,1);const turned=JSON.stringify(S.active.cells)!==k0||S.active.cells.length===1;
            const lk=S.lockCount;w.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:8,clientX:x,clientY:y,pointerType:'touch'}));
            await new Promise(r=>setTimeout(r,60));w.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:8,clientX:x,clientY:y+cw*5,pointerType:'touch'}));
            return {moved,turned,slammed:S.lockCount>lk||S.phase!=='drop'}}""")
        ck("75 dragging moves the word column by column", dr['moved'] == 2, dr)
        ck("75 a tap turns it", dr['turned'], dr)
        ck("75 a flick down slams it", dr['slammed'], dr)
        await pg.evaluate(CLOSE)
        # 76 handling
        await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(150)
        await pg.evaluate(TO_DROP)
        lr = await pg.evaluate("""()=>{if(!S.active)return 'no piece';while(!collides(absCells(S.active,1,0)))S.active.r++;S.landT=100;S.lockResets=0;const c=S.active.c;
            move(c>0?-1:1);const a=[S.landT,S.lockResets];S.lockResets=15;S.landT=100;move(c>0?1:-1);a.push(S.landT);return a}""")
        ck("76 moving a landed word resets the lock delay, up to 15 times", lr == [0, 1, 100], lr)
        kick = await pg.evaluate("""()=>{S.grid=S.grid.map(r=>r.map(()=>null));S.active={cells:[{dr:0,dc:0,ch:'A'},{dr:0,dc:1,ch:'B'},{dr:0,dc:2,ch:'C'}],r:ROWS-1,c:2};
            rotate();return S.active.cells.some(x=>x.dr>0)&&absCells(S.active).every(x=>x.r<ROWS)}""")
        ck("76 a word on the floor can still turn (kicks up a row)", kick)
        sd = await pg.evaluate("()=>{S.active={cells:[{dr:0,dc:0,ch:'A'}],r:0,c:3};const p=S.pts.drop||0;softDrop();return (S.pts.drop||0)-p}")
        ck("76 soft drops earn a point per row", sd == 1, sd)
        ck("76 faster auto-repeat on held arrows (170 ms, then every 55 ms)", "t2=setInterval(fire,a===\"D\"?40:55)},170)" in SRC)
        # 77 levels, perfect clear
        lv = await pg.evaluate("""()=>{S.linesCleared=0;const f1=fallMs();S.linesCleared=10;const f3=fallMs();S.linesCleared=200;const fmax=fallMs();S.linesCleared=0;return [wellLevel(),Math.round(f3/f1*100),Math.round(fmax/f1*100)]}""")
        ck("77 every 5 rows is a level and pieces fall faster (floor at half speed)", lv[1] == 85 and lv[2] == 50, lv)
        pc = await pg.evaluate("""()=>{S.grid=S.grid.map(r=>r.map(()=>null));S.linesCleared=5;S._lcSeen=4;const p=S.pts.perfect||0;afterSettle();return [(S.pts.perfect||0)-p,document.getElementById('wellLv').textContent]}""")
        ck("77 clearing the well empty is a Perfect Clear (+1000) and the level shows", pc[0] == 1000 and pc[1].startswith("LV 2"), pc)
        ck("77 four rows at once is a CROSSFALL", await pg.evaluate("(()=>{let said='';const o=popCall;popCall=(t)=>{said+=t+'|'};try{juiceClear(4,1)}finally{popCall=o}return said.includes('CROSSFALL!')})()"))
        # 78 trail
        await pg.evaluate("()=>{S.phase='drop';S.grid=S.grid.map(r=>r.map(()=>null));S.active={cells:[{dr:0,dc:0,ch:'A'},{dr:0,dc:1,ch:'B'}],r:0,c:2};renderWell()}")
        await pg.wait_for_timeout(400)
        tr = await pg.evaluate("()=>{prefs.calm=false;hardDrop();return document.querySelectorAll('#well .drop-trail').length}")
        await pg.wait_for_timeout(400)
        tr2 = await pg.evaluate("document.querySelectorAll('#well .drop-trail').length")
        if tr != 2:  # retry once: under heavy load the first slam can land before the well has drawn
            await pg.evaluate("()=>{S.paused=false;S.freezeUntil=0;S.phase='drop';S.grid=S.grid.map(r=>r.map(()=>null));S.active={cells:[{dr:0,dc:0,ch:'A'},{dr:0,dc:1,ch:'B'}],r:0,c:2};renderWell()}")
            await pg.wait_for_timeout(400)
            tr = await pg.evaluate("()=>{prefs.calm=false;hardDrop();return document.querySelectorAll('#well .drop-trail').length}")
            await pg.wait_for_timeout(400)
            tr2 = await pg.evaluate("document.querySelectorAll('#well .drop-trail').length")
        ck("78 a slam leaves a short trail that fades", tr == 2 and tr2 == 0, (tr, tr2))
        await pg.evaluate(CLOSE)
        # settings
        await pg.evaluate("()=>{renderPaceInfo();document.getElementById('setWellDrag').click()}")
        ck("75 drag can be switched off in Settings", await pg.evaluate("prefs.wellDrag===false&&document.getElementById('setWellDrag').getAttribute('aria-checked')==='false'"))
        await ctx.close()
        # 79 migration of a player who picked Bay City
        ctx, pg, e2 = await page(b, '2026-11-20T10:00:00', "()=>{}")
        mg = await pg.evaluate("()=>{stats.catMig=null;stats.freeCats=['Bay City','Music','Arcade'];stats.diff={'Bay City':'easy',Music:'medium'};migrateCats();return [stats.freeCats,Object.keys(stats.diff)]}")
        ck("79 a free Bay City pick is replaced by another category", mg[0] == ['Music', 'Arcade', 'Night Sky'] and 'Bay City' not in mg[1], mg)
        errs += e2
        await ctx.close()
        ctx, pg, e3 = await page(b, '2026-11-20T10:00:00', SETUP.replace("stats.seen22=1;stats.seen23=1;stats.seen24=1;stats.seen25=1;stats.seen26=1;stats.seen27=1;stats.seen28=1;stats.seen29=1;", "")); errs += e3
        await pg.evaluate("()=>{S=null;showMenu()}"); await pg.wait_for_timeout(900)
        wn = await pg.evaluate("[document.getElementById('evh').textContent.includes('Night Sky, reborn'),document.querySelectorAll('#evh > .wn').length,!!document.querySelector('#evh details.wn-more')]")
        ck("What's new leads with the 4 newest items and folds the rest", wn == [True, 4, True], wn)
        ck("no JS errors", not errs, " | ".join(errs[:3]))
        await b.close()
    print(f"{sum(res)}/{len(res)} passed"); return all(res)
sys.exit(0 if asyncio.run(main()) else 1)
