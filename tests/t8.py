from pathlib import Path
import asyncio, sys, json
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'scripts'))
from smoke_test import MOCK, PLAY
SRC = (Path(__file__).resolve().parent.parent / 'Crossfall' / 'index.html').read_text().replace('<head>', '<head>' + MOCK, 1)
res = []
def ck(name, ok, detail=""):
    res.append(ok); print(f"{'PASS' if ok else 'FAIL'}  {name}{('  · ' + str(detail)) if detail else ''}")

NEW = """()=>{stats.tutDone=true;stats.nick='T';stats.freeCats=['Sports','Music','Arcade'];stats.spSkip=1;stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');
 document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;S=null;showMenu()}"

async def page(b, when=None):
    ctx = await b.new_context(viewport={"width": 393, "height": 852}); pg = await ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    if when: await pg.clock.install(time=when)
    await pg.set_content(SRC); await pg.wait_for_timeout(900)
    return ctx, pg, errs

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # ---- 18 first-run focus
        ctx, pg, errs = await page(b, '2026-10-28T12:00:00')
        await pg.evaluate(NEW); await pg.wait_for_timeout(400)
        ck("18 new player sees Start here, not the full hub", await pg.evaluate("!!document.getElementById('frPanel')&&!document.getElementById('pzMini')"))
        ck("18 starter button names a real puzzle", await pg.evaluate("(()=>{const b=document.getElementById('frPlay');return !!b&&LEVELS[+b.dataset.l]&&!lockReason(LEVELS[+b.dataset.l])})()"))
        for i in range(3):
            await pg.evaluate(CLOSE); await pg.wait_for_timeout(200)
            await pg.evaluate("()=>document.getElementById('frPlay').click()"); await pg.wait_for_timeout(300)
            await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        await pg.evaluate(CLOSE); await pg.wait_for_timeout(400)
        ck("18 after 3 games the full hub appears", await pg.evaluate("!document.getElementById('frPanel')&&!!document.getElementById('pzMini')&&stats.homeOpened===1"), await pg.evaluate("stats.tot.games"))
        ck("18 Cipher card is the 4th Today's Puzzle", await pg.evaluate("document.querySelectorAll('.pzrow .pzc').length===4&&!!document.getElementById('pzCipher')"))
        ck("25 Surprise me tile on home", await pg.evaluate("!!document.getElementById('svLine')"))
        # ---- 26/27 records + month data from those 3 games
        ck("26 records tracked", await pg.evaluate("!!(stats.rec&&stats.rec.score&&stats.rec.words)"), await pg.evaluate("JSON.stringify(Object.keys(stats.rec||{}))"))
        ck("27 month totals tracked once per game", await pg.evaluate("(stats.mon||{})['2026-10']&&stats.mon['2026-10'].games===3"), await pg.evaluate("JSON.stringify(stats.mon)"))
        await pg.evaluate("()=>openRecords()"); await pg.wait_for_timeout(200)
        ck("26 records screen opens", await pg.evaluate("document.getElementById('evh').innerText.includes('MY RECORDS')||document.getElementById('evh').innerText.includes('RECORDS')"))
        # ---- 24 rate on result
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'&&!(store[l.id]||{}).stars))"); await pg.wait_for_timeout(200)
        await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        ck("24 rate buttons on result", await pg.evaluate("!!document.querySelector('#rate [data-rt=\"1\"]')"))
        await pg.evaluate("()=>document.querySelector('#rate [data-rt=\"1\"]').click()")
        ck("24 loved it saved", await pg.evaluate("stats.fb[S.L.id]===1&&stats.fbCat.Music===1&&document.querySelector('#rate [data-rt=\"1\"]').getAttribute('aria-pressed')==='true'"))
        await pg.evaluate("()=>document.querySelector('#rate [data-rt=\"1\"]').click()")
        ck("24 tapping again clears it", await pg.evaluate("!stats.fb[S.L.id]&&stats.fbCat.Music===0"))
        await pg.evaluate("()=>document.querySelector('#rate [data-rt=\"1\"]').click()")
        ck("24 For you moves off a category marked Not for me twice", await pg.evaluate("(()=>{stats.fbCat.Sports=-2;const f=pickForYou();const ok=f&&f.L.cat!=='Sports';stats.fbCat.Sports=0;return ok})()"), await pg.evaluate("JSON.stringify(pickForYou()&&[pickForYou().L.cat,pickForYou().why])"))
        # ---- 25 surprise
        ok = await pg.evaluate("(()=>{for(let i=0;i<40;i++){const L=surprisePick();if(!L||lockReason(L)||L.cat==='Language'||(store[L.id]||{}).stars===3)return false}return true})()")
        ck("25 surprise picks only playable, unmastered puzzles", ok)
        await pg.evaluate(CLOSE); await pg.evaluate("surprise()"); await pg.wait_for_timeout(300)
        ck("25 surprise starts a game", await pg.evaluate("!!(S&&S.L&&S.phase)"))
        # ---- 19 rewind
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Arcade'))"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{stats.sparks=12;const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}"); await pg.wait_for_timeout(300)
        st = await pg.evaluate("""()=>{if(S.phase!=='drop')return 'phase '+S.phase;S.grid=S.grid.map(r=>r.map(()=>null));const g0=JSON.stringify(S.grid),sc0=S.score,q0=S.queue.length;hardDrop();
          if(S.phase!=='drop')return 'after drop '+S.phase;const full=S.rwSnap&&S.rwSnap.clean;if(!full)return 'snap not clean';const sp=stats.sparks;usePower('rewind');
          return JSON.stringify({same:JSON.stringify(S.grid)===g0,score:S.score===sc0,sparks:sp-stats.sparks,active:!!S.active,phase:S.phase,used:S.pwUsed})}""")
        ck("19 rewind restores the well and costs 3 sparks", '"same":true' in st and '"score":true' in st and '"sparks":3' in st and '"active":true' in st, st)
        st2 = await pg.evaluate("()=>{const sp=stats.sparks;usePower('rewind');return sp-stats.sparks}")
        ck("19 nothing to rewind twice in a row", st2 == 0)
        ck("19 Rewind button in the power-up bar", await pg.evaluate("!!document.querySelector('[data-a=\"P:rewind\"]')"))
        # rewind refused after a row clear
        r3 = await pg.evaluate("""()=>{S.grid=S.grid.map(r=>r.map(()=>null));S.grid[S.grid.length-1]=Array(COLS).fill(null).map((_,c)=>c===0?null:{ch:'A'});S.active.cells=[{dr:0,dc:0,ch:'Z'}];S.active.c=0;S.active.base=S.active.cells;
          hardDrop();return S.rwSnap?S.rwSnap.clean:'none'}""")
        ck("19 a piece that cleared a row can't be rewound", r3 is False, r3)
        # ---- 20 cipher
        cp = await pg.evaluate("""()=>{let bad=[];for(let i=0;i<90;i++){const dk=addDays('2026-10-28',i),P=cipherPuzzle(dk),Q=cipherPuzzle(dk);
            if(JSON.stringify(P)!==JSON.stringify(Q))bad.push('nondet '+dk);if(CP_AZ.split('').some(c=>P.enc[c]===c))bad.push('fixed '+dk);
            if([...P.text].map(ch=>/[A-Z]/.test(ch)?P.dec[P.enc[ch]]:ch).join('')!==P.text)bad.push('roundtrip '+dk);if(P.give.length<1)bad.push('give '+dk)}
          const used=new Set();for(let i=0;i<CP_QUOTES.length;i++)used.add(cipherPuzzle(addDays('2026-10-28',i)).text);return JSON.stringify({bad,distinct:used.size,total:CP_QUOTES.length})}""")
        ck("20 90 days of ciphers: deterministic, no letter maps to itself, decodes", '"bad":[]' in cp, cp)
        ck("20 every quote is used once per cycle", json.loads(cp)['distinct'] == json.loads(cp)['total'], cp)
        await pg.evaluate(CLOSE); await pg.evaluate("openCipher()"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{cpCheck()}")
        await pg.evaluate("()=>{const P=CP.P;const order=cpOrder().filter(c=>!CP.lock.has(c));for(const c of order){CP.sel=c;cpType(P.dec[c])}}"); await pg.wait_for_timeout(300)
        ck("20 typing the right letters solves the Cipher", await pg.evaluate("CP&&CP.done&&!!document.getElementById('cpShare')&&pzStore('cipher').days[todayKey()].done&&pzStreak('cipher').n===1"))
        ck("20 a Check counts against Codebreaker", await pg.evaluate("cpRank()!=='Codebreaker!'"), await pg.evaluate("cpRank()"))
        await pg.evaluate("closePz()"); await pg.wait_for_timeout(200)
        ck("20 home card shows the solve", await pg.evaluate("(document.getElementById('pzCipher')||{}).innerText.includes('✓')"))
        await pg.evaluate("()=>openScoreboard('cipher')"); await pg.wait_for_timeout(100)
        ck("20 Cipher scoreboard tab", await pg.evaluate("document.getElementById('sb').innerHTML.includes('Codebreakers')"))
        await pg.evaluate("()=>{document.getElementById('sb').hidden=true;openArchive('cipher')}"); await pg.wait_for_timeout(100)
        ck("20 Cipher in past puzzles", await pg.evaluate("document.querySelector('#archive [data-ak=\"cipher\"]').getAttribute('aria-selected')==='true'&&document.querySelectorAll('#archive [data-dk]').length>0"))
        await pg.evaluate("()=>{document.querySelectorAll('#archive [data-dk]')[1].click()}"); await pg.wait_for_timeout(200)
        ck("20 past Cipher opens as practice", await pg.evaluate("CP&&CP.archive===true"))
        # cipher swap rule: typing a letter used elsewhere moves it
        sw = await pg.evaluate("()=>{const o=cpOpenLetters();if(o.length<2)return 'skip';CP.sel=o[0];cpType('Q');CP.sel=o[1];cpType('Q');return (CP.g[o[0]]||'')+'|'+CP.g[o[1]]}")
        ck("20 a letter can only stand for one code letter", sw.endswith('|Q') and not sw.startswith('Q'), sw)
        h0 = await pg.evaluate("()=>{const h=CP.hints;cpHint();return CP.hints-h}")
        ck("20 reveal a letter", h0 == 1)
        await pg.evaluate("closePz()")
        # ---- 21 rush gym
        await pg.evaluate(CLOSE); await pg.evaluate("openGym()"); await pg.wait_for_timeout(200)
        for i in range(3):
            await pg.evaluate("()=>{for(const ch of gymCur().w)gymKey(ch)}"); await pg.wait_for_timeout(600)
        g = await pg.evaluate("()=>[RG.right,RG.score,RG.combo]")
        ck("21 three words solved in the gym", g[0] == 3 and g[1] > 0, g)
        await pg.evaluate("()=>{gymSkip()}"); await pg.wait_for_timeout(1200)
        ck("21 skip breaks the streak and shows the answer", await pg.evaluate("RG.combo===0&&RG.skips===1"))
        await pg.evaluate("()=>gymEnd()"); await pg.wait_for_timeout(200)
        ck("21 gym saves the best and gives XP once a day", await pg.evaluate("stats.gym.best>0&&stats.gym.xpDay===todayKey()&&document.getElementById('lr').innerText.includes('NEW BEST')"))
        await pg.evaluate("()=>document.getElementById('rgDone').click()")
        # ---- 23 mastery
        mt = await pg.evaluate("""()=>{const c=CATEGORIES.find(c=>c.name==='Kitchen');const need=Math.ceil(.25*c.puzzles.length*3);let got=0;
           for(const p of c.puzzles){if(got>=need)break;store[p.id]={stars:3,best:1};got+=3}celeQ.length=0;masteryCheck();
           return JSON.stringify({t:stats.mast.Kitchen,q:celeQ.map(x=>x.sub)})}""")
        ck("23 reaching a quarter of the stars gives Bronze + XP", '"t":0' in mt and 'Bronze' in mt, mt)
        await pg.evaluate(CLOSE); await pg.wait_for_timeout(300)
        ck("23 chip on the category card", await pg.evaluate("[...document.querySelectorAll('.gcard .mst')].some(x=>x.innerText.includes('Bronze'))"))
        # ---- 27 recap at month change
        await ctx.close()
        ctx, pg, errs2 = await page(b, '2026-11-02T10:00:00'); errs += errs2
        await pg.evaluate("""()=>{stats.tot.games=10;stats.seen17=1;stats.seen18=1;stats.seen19=1;stats.fullHome=1;stats.monInit=1;delete stats.recapSeen;stats.mon={'2026-10':{games:12,wins:9,score:40000,words:80,best:6100,bestName:'Music · Piano',gold:2,targets:5,cats:{Music:7,Sports:5}},'2026-09':{games:6,wins:4,score:15000,words:30,best:3000,bestName:'x',gold:0,targets:1,cats:{}}};
          stats.days=['2026-10-30','2026-10-29','2026-10-02'];document.getElementById('onb').hidden=true;S=null;showMenu()}""")
        await pg.wait_for_timeout(900)
        ck("27 recap opens at the start of a new month", await pg.evaluate("document.getElementById('evh').innerText.includes('OCTOBER RECAP')&&stats.recapSeen==='2026-10'"))
        ck("27 recap compares with the month before", await pg.evaluate("document.getElementById('evh').innerText.includes('100% more games than September')"), await pg.evaluate("document.querySelector('.rc-hero').innerText"))
        await pg.evaluate(CLOSE); await pg.wait_for_timeout(900)
        ck("27 recap shows only once", await pg.evaluate("!document.getElementById('evh').innerText.includes('RECAP')||document.getElementById('evh').hidden"))
        # ---- 22 harvest off/on season
        ck("22 Harvest hidden on 2 Nov (Spooky's last day)", await pg.evaluate("openDrawer(),document.querySelector('#drawer [data-act=\"harvest\"]').hidden&&!document.querySelector('#drawer [data-act=\"spooky\"]').hidden"))
        await ctx.close()
        ctx, pg, errs2 = await page(b, '2026-11-10T10:00:00'); errs += errs2
        await pg.evaluate("()=>{stats.tot.games=10;stats.seen17=1;stats.seen18=1;stats.seen19=1;stats.fullHome=1;stats.recapSeen='2026-10';document.getElementById('onb').hidden=true;S=null;showMenu()}"); await pg.wait_for_timeout(500)
        hv = await pg.evaluate("JSON.stringify(HARVEST.puzzles.map((p,k)=>{const L=harvestLevel(k);return L?L._cw.words.length+'/'+p.words.length:'FAIL '+p.name}))")
        ck("22 all six Harvest puzzles build with every word", 'FAIL' not in hv and all(a.split('/')[0] == a.split('/')[1] for a in json.loads(hv)), hv)
        ck("22 Harvest on home and in the menu on 10 Nov", await pg.evaluate("!!document.getElementById('hvLine')&&(openDrawer(),!document.querySelector('#drawer [data-act=\"harvest\"]').hidden)&&document.querySelector('#drawer [data-act=\"spooky\"]').hidden"))
        await pg.evaluate("()=>{closeDrawer&&closeDrawer();openHarvest()}"); await pg.wait_for_timeout(200)
        ck("22 Harvest screen", await pg.evaluate("document.getElementById('evh').innerText.includes('HARVEST')&&document.querySelectorAll('#evh [data-hk]').length===6"))
        await pg.evaluate("playHarvest(0)"); await pg.wait_for_timeout(300)
        ck("22 Harvest well tint", await pg.evaluate("document.documentElement.classList.contains('harvest')"))
        await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        ck("22 finishing a Harvest puzzle counts", await pg.evaluate("harvestSt().done.includes(0)&&!!document.getElementById('hvNext')"))
        await pg.evaluate("()=>document.getElementById('hvNext').click()"); await pg.wait_for_timeout(300)
        ck("22 next autumn puzzle button", await pg.evaluate("S&&S.L&&S.L.harvest&&S.L.hk===1"))
        ck("22 Harvest well theme exists and is locked until earned", await pg.evaluate("(()=>{const t=WELL_THEMES.find(t=>t.id==='maple');return t&&!themeUnlocked(t)})()"))
        # ---- what's new for a build-17 tester
        await ctx.close()
        ctx, pg, errs2 = await page(b, '2026-10-28T12:00:00'); errs += errs2
        await pg.evaluate("()=>{stats.tot.games=5;stats.seen17=1;stats.seen18=1;stats.fullHome=1;document.getElementById('onb').hidden=true;S=null;showMenu()}"); await pg.wait_for_timeout(900)
        wn = await pg.evaluate("[document.getElementById('evh').textContent.includes('Snow Days'),document.querySelectorAll('#evh > .wn').length,!!document.querySelector('#evh details.wn-more')]")
        ck("What's new leads with the 4 newest items and folds the rest", wn == [True, 4, True], wn)
        await ctx.close()
        ctx, pg, errs2 = await page(b, '2026-10-28T12:00:00'); errs += errs2
        await pg.evaluate("()=>{stats.tot.games=5;stats.fullHome=1;document.getElementById('onb').hidden=true;S=null;showMenu()}"); await pg.wait_for_timeout(900)
        ck("What's new folds older 1.1 items for someone coming from 1.0", await pg.evaluate("!!document.querySelector('#evh details.wn-more')"))
        ck("no JS errors", not errs, " | ".join(errs[:3]))
        await b.close()
    print(f"\n{sum(res)}/{len(res)} passed")
    return all(res)
asyncio.run(main())
