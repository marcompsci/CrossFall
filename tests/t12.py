"""Phases 48-57 (13 Nov 2026). Run after scripts/build_index.py."""
from pathlib import Path
import asyncio, sys, json, datetime, importlib.util, io, contextlib
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from smoke_test import MOCK, PLAY
SRC = (ROOT / 'Crossfall' / 'index.html').read_text().replace('<head>', '<head>' + MOCK, 1)
res = []
def ck(n, ok, d=""):
    res.append(bool(ok)); print(f"{'PASS' if ok else 'FAIL'}  {n}{('  · ' + str(d)) if d not in ('', None) else ''}")
SETUP = """()=>{stats.tutDone=true;stats.nick='T';stats.freeCats=['Sports','Music','Arcade'];stats.spSkip=1;stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');
 stats.seen19=1;stats.seen20=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;S=null;showMenu()}"

# Python reference for the widget puzzle (loaded from qdsim without running its 1,500-day loop output)
qsrc = (ROOT / 'tests' / 'qdsim.py').read_text().split('bad=0;fb=0')[0]
Q = {'__file__': str(ROOT / 'tests' / 'qdsim.py')}; exec(qsrc, Q)

async def page(b, when, setup=SETUP):
    ctx = await b.new_context(viewport={"width": 393, "height": 852}); pg = await ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time=when)
    await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(setup); await pg.wait_for_timeout(400); return ctx, pg, errs

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); allerr = []
        ctx, pg, errs = await page(b, '2026-11-20T10:00:00'); allerr = errs
        # 48 clue list
        await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(300)
        ck("48 All clues button in the clue bar during the crossword", await pg.evaluate("!!document.getElementById('clAll')&&!document.getElementById('clAll').hidden"))
        await pg.evaluate("()=>document.getElementById('clAll').click()"); await pg.wait_for_timeout(200)
        n = await pg.evaluate("[document.querySelectorAll('#evh [data-cw]').length,S.cw.words.length]")
        ck("48 lists every clue", n[0] == n[1] and n[0] > 0, n)
        j = await pg.evaluate("""()=>{const ws=S.cw.words;const w=ws[ws.length-1];document.querySelector('#evh [data-cw="'+(ws.length-1)+'"]').click();return curWord()===w&&document.getElementById('evh').hidden}""")
        ck("48 tapping a clue jumps to it and closes the list", j)
        # 49 pencil
        r = await pg.evaluate("""()=>{prefs.autocheck=true;S.pen=true;const w=curWord();const k=w.cells.find(k=>!S.cw.cells.get(k).lock);S.sel.key=k;const c=S.cw.cells.get(k);
            const wrong=c.ans==='Z'?'Y':'Z';typeLetter(wrong);const d=document.querySelector('#cw [data-k="'+k+'"]');
            const a=[c.pen,S.bad.has(k),d.classList.contains('pen'),S.assist];S.sel.key=k;S.pen=false;typeLetter(wrong);const d2=document.querySelector('#cw [data-k="'+k+'"]');
            a.push(c.pen,S.bad.has(k),d2.classList.contains('pen'));prefs.autocheck=false;return a}""")
        ck("49 pencil letters look unsure and Autocheck leaves them alone", r[:3] == [True, False, True] and r[3] is not True, r)
        ck("49 writing in ink again clears pencil and Autocheck applies", r[4:] == [False, True, False], r)
        await pg.evaluate("()=>{S.pen=true;renderClue()}")
        ck("49 clue bar shows pencil mode", await pg.evaluate("document.getElementById('clueNum').textContent.includes('✎')"))
        await pg.evaluate("()=>{S.pen=false;S.bad=new Set();S.assist=false}")
        # 54 bigger text from the clue list
        ts0 = await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ts')")
        await pg.evaluate("()=>{openClueList();document.getElementById('clBig').click()}"); await pg.wait_for_timeout(100)
        ts1 = await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ts')")
        ck("54 Bigger text works from inside a game", float(ts1) > float(ts0) and await pg.evaluate("prefs.big===true"), (ts0, ts1))
        await pg.evaluate("()=>{setBigText(false);closeEvents()}")
        # play it out -> 50 recap, 51 goal, 56 up next
        await pg.evaluate("()=>{stats.goal=1;stats.goalLog={};stats.goalPaid=null;stats.sparks=3}")
        end = await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        rc = await pg.evaluate("[document.querySelectorAll('#result .rcp-row').length,S.cw.words.length]")
        ck("50 result screen lists every word with its clue", rc[0] == rc[1] and rc[0] > 0, rc)
        st = await pg.evaluate("""()=>{const b=document.querySelector('#result [data-study]');const w=b.dataset.study;stats.bank[w]&&(stats.bank[w].box=3);b.click();return [w,stats.bank[w].box,stats.bank[w].sl,b.textContent]}""")
        ck("50 Study later puts the word at the front of Review", st[1] == 0 and st[2] == 1 and 'Review' in st[3], st)
        g = await pg.evaluate("[goalToday(),stats.sparks,stats.goalPaid]")
        ck("51 a finished puzzle counts toward the daily goal and pays 1 spark once", g[0] == 1 and g[1] >= 4 and g[2] == '2026-11-20', g)
        un = await pg.evaluate("(document.getElementById('unGo')||{}).textContent||''")
        ck("56 Up next suggests today's Daily first", "Daily" in un, un)
        await pg.evaluate("()=>document.getElementById('unGo').click()"); await pg.wait_for_timeout(300)
        ck("56 Up next starts it", await pg.evaluate("S&&S.L.daily==='2026-11-20'&&!S.L.archive"))
        # 51 goal sheet, streak, off
        await pg.evaluate(CLOSE)
        await pg.evaluate("()=>{stats.goal=3;stats.goalLog={'2026-11-17':3,'2026-11-18':4,'2026-11-19':3,'2026-11-20':1}}")
        ck("51 goal streak counts days met before today", await pg.evaluate("goalStreak()===3"))
        await pg.evaluate("()=>{renderDailyCard()}"); await pg.wait_for_timeout(100)
        ck("51 home shows the goal ring and progress", await pg.evaluate("(document.getElementById('glLine')||{}).textContent?.includes('1 of 3')&&!!document.querySelector('#glLine .gl-ring')"))
        await pg.evaluate("()=>{openGoal();document.querySelector('[data-gl=\"0\"]').click();closeEvents();renderDailyCard()}")
        ck("51 goal can be switched off", await pg.evaluate("!document.getElementById('glLine')&&stats.goal===0"))
        await pg.evaluate("()=>{stats.goal=3}")
        # 53 spotlight
        sp = await pg.evaluate("""()=>{const c=spotCat();const wk=weekKeyOf(Date.now());stats.spot={wk,n:0};const L=c.puzzles.find(l=>!lockReason(l));startLevel(LEVELS.indexOf(L));const xp0=stats.xpBonus||0;spotAfter(true);spotAfter(true);const a=[c.name,stats.spot.n,(stats.xpBonus||0)-xp0];
            stats.spot.n=5;const x1=stats.xpBonus;spotAfter(true);a.push(stats.xpBonus-x1);return a}""")
        ck("53 spotlight wins give +150 XP each, up to 5 a week", sp[1] == 2 and sp[2] == 300 and sp[3] == 0, sp)
        same = await pg.evaluate("spotCat().name")
        ck("53 spotlight category is the same all week", same == sp[0])
        await pg.evaluate(CLOSE)
        ck("53 home shows the spotlight", await pg.evaluate("(document.getElementById('slLine')||{}).textContent?.includes('Spotlight')"))
        # 55 export
        await pg.evaluate("()=>{window.__msgs=[];openRecords()}"); await pg.wait_for_timeout(100)
        await pg.evaluate("()=>document.getElementById('rcExport').click()"); await pg.wait_for_timeout(100)
        ex = await pg.evaluate("(window.__msgs.find(m=>m[0]==='share')||[])[1]||''")
        lines = ex.split("\n") if isinstance(ex, str) else []
        ck("55 Export my data shares a CSV of games", isinstance(ex, str) and lines[0].startswith("Crossfall · my data") and lines[3].startswith("date,category,puzzle") and len(lines) >= 5, lines[:4])
        ck("55 CSV quotes commas and quotes", await pg.evaluate("""(()=>{stats.games.unshift({t:Date.now(),cat:'Books',name:'A "big", test',score:1,stars:0,win:false,words:0});const c=exportCSV();stats.games.shift();return c.includes('"A ""big"", test"')})()"""))
        await pg.evaluate(CLOSE)
        # 57 word book search
        await pg.evaluate("()=>{stats.wb=stats.wb||{};stats.wb.ZEBRA={k:'Nature',t:Date.now(),n:2,o:1,c:'Striped horse'};openWordBook()}"); await pg.wait_for_timeout(100)
        await pg.fill("#wbQ", "striped"); await pg.wait_for_timeout(100)
        ck("57 word book search finds a word by its clue", await pg.evaluate("document.getElementById('wbHits').textContent.includes('ZEBRA')"))
        await pg.fill("#wbQ", "qqxx"); await pg.wait_for_timeout(100)
        ck("57 says when nothing matches", await pg.evaluate("document.getElementById('wbHits').textContent.includes('No words found')"))
        await pg.evaluate("()=>{document.getElementById('wbk').hidden=true}")
        # 52 Quick Daily: same puzzle as the widget
        bad = []
        d0 = datetime.date(2026, 11, 1)
        for k in range(0, 400, 3):
            day = str(d0 + datetime.timedelta(days=k)); ws = Q['fresh'](day)
            jsr = await pg.evaluate("(d)=>{const w=qdWords(d).map(x=>x[0]);return {w,t:w.map((x,i)=>qdTiles(d,i,x).join('')),g:qdWell(d,w).map(r=>r.join(',')).join('/')}}", day)
            pg_ = Q['well'](day, ws)[0]
            if jsr['w'] != ws or jsr['t'] != [''.join(Q['tiles'](day, i, w)) for i, w in enumerate(ws)] or (pg_ and jsr['g'] != '/'.join(','.join(r) for r in pg_)):
                bad.append(day)
        ck("52 in-app Quick Daily matches the widget's puzzle (words, tiles, well) on 134 days", not bad, bad[:3])
        await pg.evaluate(CLOSE)
        ck("52 Quick Daily on the home screen", await pg.evaluate("!!document.getElementById('qdLine')"))
        await pg.evaluate("()=>document.getElementById('qdLine').click()"); await pg.wait_for_timeout(150)
        play = await pg.evaluate("""()=>{const s=qdState();qdTap(s.tiles.findIndex((t,i)=>t!==s.words[0][0]));const m=s.mistakes;
            for(let wi=0;wi<3;wi++){const w=s.words[s.wi];for(const ch of w){const i=s.tiles.findIndex((t,j)=>t===ch&&!s.used.includes(j));qdTap(i)}}
            const ph=s.phase,well=document.querySelectorAll('#evh .qd-well span').length;
            const gaps=[3,4,5].map(r=>s.grid[r].indexOf(''));for(let i=0;i<3;i++){const target=s.grid.findIndex((row,ri)=>ri>=1&&row.includes('#')&&row.filter(x=>x==='').length===s.words[s.wi].length);
              const st=s.grid[target].indexOf('');s.col=st;qdDrop()}
            return {m,ph,well,phase:s.phase,cleared:s.cleared,score:qdScore(s),streak:s.streak,txt:document.getElementById('evh').textContent}}""")
        ck("52 tapping letters fills the words; a wrong letter is a mistake", play['m'] == 1 and play['ph'] == 1 and play['well'] == 36, play)
        ck("52 dropping each word in its gap clears all 3 rows", play['phase'] == 2 and play['cleared'] == 3 and play['score'] == 780 and play['streak'] == 1, {k: play[k] for k in ('phase', 'cleared', 'score', 'streak')})
        ck("52 shows the result", "Solved" in play['txt'])
        await pg.evaluate(CLOSE)
        ck("52 home tile shows today's score", await pg.evaluate("document.getElementById('qdLine').textContent.includes('780')"))
        # customize home includes the new tiles
        await pg.evaluate("()=>openHomeEdit()")
        ck("home: the 3 new tiles can be hidden", await pg.evaluate("['glLine','slLine','qdLine'].every(id=>!!document.querySelector('[data-hid=\"'+id+'\"]'))"))
        await pg.evaluate(CLOSE)
        # what's new
        await ctx.close()
        ctx, pg, errs2 = await page(b, '2026-11-20T10:00:00', SETUP.replace("stats.seen20=1;", "")); allerr += errs2
        await pg.evaluate("()=>{stats.tot.games=5;S=null;showMenu()}"); await pg.wait_for_timeout(900)
        wn = await pg.evaluate("[document.getElementById('evh').textContent.includes('Quick Daily, in the app'),document.querySelectorAll('#evh > .wn').length,!!document.querySelector('#evh details.wn-more')]")
        ck("What's new leads with the 4 newest items and folds the rest", wn == [True, 4, True], wn)
        ck("no JS errors", not allerr, " | ".join(allerr[:3]))
        await b.close()
    print(f"{sum(res)}/{len(res)} passed"); return all(res)
sys.exit(0 if asyncio.run(main()) else 1)
