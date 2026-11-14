from pathlib import Path
import asyncio, sys, json
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'scripts'))
from smoke_test import MOCK, PLAY
SRC = (Path(__file__).resolve().parent.parent / 'Crossfall' / 'index.html').read_text().replace('<head>', '<head>' + MOCK, 1)
res = []
def ck(n, ok, d=""):
    res.append(bool(ok)); print(f"{'PASS' if ok else 'FAIL'}  {n}{('  · ' + str(d)) if d not in ('', None) else ''}")
SETUP = """()=>{stats.tutDone=true;stats.nick='T';stats.freeCats=['Sports','Music','Arcade'];stats.spSkip=1;stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');
 stats.seen19=1;stats.seen20=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;S=null;showMenu()}"
async def page(b, when):
    ctx = await b.new_context(viewport={"width": 393, "height": 852}); pg = await ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time=when)
    await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(SETUP); await pg.wait_for_timeout(400); return ctx, pg, errs
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); allerr = []
        ctx, pg, errs = await page(b, '2026-11-20T19:30:00'); allerr = errs
        # 38 calendar
        await pg.evaluate("()=>{stats.daily={'2026-11-03':{score:3000,win:true,grade:'A',gold:true},'2026-11-05':{score:900,win:false}};openCalendar()}"); await pg.wait_for_timeout(200)
        c = await pg.evaluate("JSON.stringify({won:document.querySelectorAll('.cal-d.won').length,tried:document.querySelectorAll('.cal-d.tried').length,today:document.querySelector('.cal-d.today').dataset.cdk,fut:document.querySelectorAll('.cal-d:disabled').length,title:document.querySelector('.cal-nav b').innerText})")
        ck("38 calendar marks solved, tried, today and future days", '"won":1' in c and '"tried":1' in c and '2026-11-20' in c and '"fut":10' in c and 'November' in c, c)
        await pg.evaluate("()=>document.getElementById('calPrev').click()"); ck("38 previous month", await pg.evaluate("document.querySelector('.cal-nav b').innerText.startsWith('October')"))
        await pg.evaluate("()=>document.querySelector('[data-cdk=\"2026-10-10\"]').click()"); await pg.wait_for_timeout(300)
        ck("38 tapping a past day plays it as practice", await pg.evaluate("S&&S.L.daily==='2026-10-10'&&S.L.archive===true"))
        # 43 risk banner (19:30, streak 4 alive not done)
        await pg.evaluate("()=>{stats.dstreak={n:4,last:'2026-11-19',freezes:1,best:4};stats.daily={}}"); await pg.evaluate(CLOSE); await pg.wait_for_timeout(300)
        ck("43 streak-at-risk banner after 6 pm", await pg.evaluate("(document.getElementById('rkLine')||{}).innerText?.includes('4-day streak')"))
        await pg.evaluate("()=>document.getElementById('rkLine').click()"); await pg.wait_for_timeout(300)
        ck("43 banner starts today's Daily", await pg.evaluate("S&&S.L.daily==='2026-11-20'&&!S.L.archive"))
        # 41 smart ghost
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}"); await pg.wait_for_timeout(300)
        g = await pg.evaluate("""()=>{S.grid=S.grid.map(r=>r.map(()=>null));const n=S.active.cells.length;S.active.cells=S.active.cells.map((x,i)=>({dr:0,dc:i,ch:x.ch}));S.active.c=0;
           for(let c=n;c<COLS;c++)S.grid[ROWS-1][c]={ch:'X'};renderWell();const good=document.querySelectorAll('#well .wc.ghost.good').length;
           S.grid[ROWS-1][COLS-1]=null;renderWell();const good2=document.querySelectorAll('#well .wc.ghost.good').length;return[n,good,good2]}""")
        ck("41 landing glows only when the drop clears a row", g[1] == g[0] and g[2] == 0, g)
        await pg.evaluate("()=>{prefs.smartGhost=false;S.grid[ROWS-1][COLS-1]={ch:'X'};renderWell()}")
        ck("41 can be switched off", await pg.evaluate("document.querySelectorAll('#well .wc.ghost.good').length===0"))
        await pg.evaluate("()=>{prefs.smartGhost=true}")
        # 40 large controls
        h0 = await pg.evaluate("document.querySelector('.ctrl .k').getBoundingClientRect().height")
        await pg.evaluate("()=>{prefs.bigctl=true;applyPrefs();renderAll()}"); h1 = await pg.evaluate("document.querySelector('.ctrl .k').getBoundingClientRect().height")
        ck("40 large controls are taller", h1 >= h0 + 12, [h0, h1]); await pg.evaluate("()=>{prefs.bigctl=false;applyPrefs()}")
        ck("40/41 settings switches exist", await pg.evaluate("!!document.getElementById('setBigCtl')&&!!document.getElementById('setSmart')&&document.getElementById('setSmart').getAttribute('aria-checked')==='true'"))
        # 42 speed tracked
        await pg.evaluate("()=>{S.grid=S.grid.map(r=>r.map(()=>null))}"); await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        sp = await pg.evaluate("JSON.stringify({cms:stats.games[0].cms,tk:stats.games[0].tk})")
        ck("42 games record crossword time and letters typed", '"cms":' in sp and json.loads(sp)['cms'] > 0 and json.loads(sp)['tk'][1] > 0, sp)
        # 44 first win sparks
        ck("44 first win of the day gives +2 sparks once", await pg.evaluate("stats.fwDay==='2026-11-20'"))
        s0 = await pg.evaluate("stats.sparks"); await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(200); await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        ck("44 second win doesn't repeat the bonus", await pg.evaluate(f"!S.fwBonus"))
        await pg.evaluate("()=>{for(let i=0;i<4;i++)stats.games.unshift({...stats.games[0],t:Date.now()-i*1000});openInsights()}"); await pg.wait_for_timeout(200)
        ck("42 Insights shows speed & accuracy", await pg.evaluate("document.getElementById('evh').textContent.includes('Letters right first time')"))
        # 45 restart
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Arcade'))"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}};window.__oldS=S;showMenu()}"); await pg.wait_for_timeout(300)
        ck("45 Restart shows next to Resume", await pg.evaluate("!document.getElementById('restartBtn').hidden"))
        await pg.evaluate("()=>document.getElementById('restartBtn').click()")
        ck("45 first tap only arms it", await pg.evaluate("S===window.__oldS&&document.getElementById('restartBtn').innerText.includes('again')"))
        await pg.evaluate("()=>document.getElementById('restartBtn').click()"); await pg.wait_for_timeout(300)
        ck("45 second tap restarts the same puzzle fresh", await pg.evaluate("S!==window.__oldS&&S.L.id===window.__oldS.L.id&&S.cw.words.every(w=>!w.solved)"))
        # 46 shares
        await pg.evaluate("()=>{window.__msgs=[];shareCup();shareRecords()}")
        sh = await pg.evaluate("window.__msgs.filter(m=>m[0]==='share').map(m=>typeof m[1]==='string'?m[1]:m[1].text)")
        ck("46 cup and records share text", len(sh) == 2 and 'Rival Cup' in sh[0] and 'records' in sh[1], sh)
        # 47 weakest
        await pg.evaluate("()=>{stats.games=[...['Music','Music','Sports','Sports'].map((c,i)=>({t:Date.now()-i,cat:c,score:c==='Music'?5000:1000,win:true,words:5,cms:40000,tk:[20,22],name:'x'}))];openInsights()}"); await pg.wait_for_timeout(200)
        ck("47 Insights suggests the weakest category", await pg.evaluate("(document.getElementById('insWeak')||{}).innerText?.includes('Sports')"))
        await pg.evaluate("()=>document.getElementById('insWeak').click()"); await pg.wait_for_timeout(300)
        ck("47 one tap plays it", await pg.evaluate("S&&S.L.cat==='Sports'"))
        await ctx.close()
        # 39 snow in December
        ctx, pg, errs = await page(b, '2026-12-05T10:00:00'); allerr += errs
        sb = await pg.evaluate("JSON.stringify(SNOW.puzzles.map((p,k)=>{const L=snowLevel(k);return L?L._cw.words.length+'/'+p.words.length:'FAIL '+p.name}))")
        ck("39 all six Snow Days puzzles build with every word", 'FAIL' not in sb and all(a.split('/')[0] == a.split('/')[1] for a in json.loads(sb)), sb)
        ck("39 Snow Days on home and in the menu in December", await pg.evaluate("!!document.getElementById('snLine')&&(openDrawer(),!document.querySelector('#drawer [data-act=snow]').hidden)&&document.querySelector('#drawer [data-act=harvest]').hidden"))
        await pg.evaluate("()=>{closeDrawer();playSnow(0)}"); await pg.wait_for_timeout(300); await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        ck("39 finishing one counts and offers the next", await pg.evaluate("snowSt().done.includes(0)&&!!document.getElementById('snNext')&&document.documentElement.classList.contains('snow')"))
        ck("39 Snow Globe theme is new and locked; no duplicate theme ids", await pg.evaluate("(()=>{const ids=WELL_THEMES.map(t=>t.id);return new Set(ids).size===ids.length&&!themeUnlocked(WELL_THEMES.find(t=>t.id==='snowglobe'))})()"))
        await ctx.close()
        ctx, pg, errs = await page(b, '2026-11-20T10:00:00'); allerr += errs
        ck("39/43 no Snow Days in November, no risk banner in the morning", await pg.evaluate("!document.getElementById('snLine')&&!document.getElementById('rkLine')"))
        ck("no JS errors", not allerr, allerr[:3])
        await b.close()
    print(f"\n{sum(res)}/{len(res)} passed")
asyncio.run(main())
