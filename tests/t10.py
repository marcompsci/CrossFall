from pathlib import Path
import asyncio, sys, json
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'scripts'))
from smoke_test import MOCK, PLAY
SRC = (Path(__file__).resolve().parent.parent / 'Crossfall' / 'index.html').read_text().replace('<head>', '<head>' + MOCK, 1)
res = []
def ck(n, ok, d=""):
    res.append(bool(ok)); print(f"{'PASS' if ok else 'FAIL'}  {n}{('  · ' + str(d)) if d not in ('', None) else ''}")
SETUP = """()=>{stats.tutDone=true;stats.nick='T';stats.freeCats=['Sports','Music','Arcade'];stats.spSkip=1;stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');
 stats.seen17=1;stats.seen18=1;stats.seen19=1;stats.seen20=1;stats.fullHome=1;stats.recapSeen='2026-10';stats.tot.games=12;document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;S=null;showMenu()}"
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={"width": 393, "height": 852}); pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.clock.install(time='2026-11-04T12:00:00')
        await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(SETUP); await pg.wait_for_timeout(500)
        # 28
        ck("28 Customize home button on Play", await pg.evaluate("!!document.getElementById('pzEdit')"))
        await pg.evaluate("()=>document.getElementById('pzEdit').click()"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{document.querySelector('[data-hid=qLine]').click();document.querySelector('[data-hid=pzChunks]').click();closeEvents()}"); await pg.wait_for_timeout(300)
        ck("28 hidden tiles are gone from home, others stay", await pg.evaluate("!document.getElementById('qLine')&&!document.getElementById('pzChunks')&&!!document.getElementById('pzMini')&&!!document.getElementById('trLine')"))
        await pg.evaluate("()=>{openHomeEdit();document.getElementById('heAll').click();closeEvents()}"); await pg.wait_for_timeout(300)
        ck("28 Show everything restores them", await pg.evaluate("!!document.getElementById('qLine')&&!!document.getElementById('pzChunks')"))
        # 29 tips
        await pg.evaluate("()=>{stats.tot.games=2;stats.tips={};startLevel(LEVELS.findIndex(l=>l.cat==='Music'))}"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}"); await pg.wait_for_timeout(400)
        ck("29 first drop shows the target tip", await pg.evaluate("!document.getElementById('jit').hidden&&document.getElementById('jit').innerText.includes('target')&&stats.tips.target===1"))
        await pg.evaluate("()=>document.getElementById('jitOk').click()"); await pg.wait_for_timeout(300)
        ck("29 Got it dismisses", await pg.evaluate("document.getElementById('jit').hidden"))
        await pg.evaluate("()=>{S.tut=null;startRush()}"); await pg.wait_for_timeout(700)
        ck("29 first rush explains its mode", await pg.evaluate("stats.tips['rush-'+(S.rush?S.rush.mode:'x')]===1||Object.keys(stats.tips).some(k=>k.startsWith('rush-'))"), await pg.evaluate("JSON.stringify(stats.tips)"))
        await pg.evaluate("jitHide()")
        await pg.evaluate("()=>{stats.tot.games=40;stats.tips={target:1};}")
        ck("29 veterans don't get basic tips", await pg.evaluate("(()=>{jit('rush-clue');return document.getElementById('jit').hidden&&stats.tips['rush-clue']===1})()"))
        # 30 second chance
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Arcade'))"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{stats.sparks=9;const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}"); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{gameOver('The well filled to the top.')}"); await pg.wait_for_timeout(200)
        ck("30 well full offers a second chance", await pg.evaluate("S.phase==='save'&&!document.getElementById('textbox').hidden&&!!document.getElementById('svGo')&&S.final==null"))
        await pg.evaluate("()=>{for(let r=0;r<ROWS;r++)S.grid[r]=S.grid[r].map((x,c)=>c%2?{ch:'A'}:x);document.getElementById('svGo').click()}"); await pg.wait_for_timeout(900)
        sv = await pg.evaluate("JSON.stringify({sp:stats.sparks,saved:S.saved,phase:S.phase,top:S.grid.slice(0,MID+1).every(r=>r.every(x=>!x)),final:S.final})")
        ck("30 Keep going costs 5 sparks, clears the top and resumes", '"sp":4' in sv and '"saved":true' in sv and '"top":true' in sv and '"final":null' in sv and ('"phase":"drop"' in sv or '"phase":"cross"' in sv), sv)
        await pg.evaluate("()=>gameOver('The well filled to the top.')"); await pg.wait_for_timeout(500)
        ck("30 only once a game: the next top-out ends it", await pg.evaluate("S.phase==='over'&&!document.getElementById('result').hidden"))
        await pg.evaluate(CLOSE); await pg.evaluate("()=>{stats.sparks=9;playDaily(todayKey())}"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>gameOver('x')"); await pg.wait_for_timeout(400)
        ck("30 never in the official Daily", await pg.evaluate("S.phase==='over'"))
        # 31 cpu
        await pg.evaluate(CLOSE); await pg.evaluate("()=>{const L=LEVELS.find(l=>l.cat==='Music'&&!(store[l.id]||{}).stars);raceRival(1,L)}"); await pg.wait_for_timeout(400)
        cp = await pg.evaluate("JSON.stringify({k:S.pace&&S.pace.kind,n:S.pace&&S.pace.n,s:S.pace&&S.pace.s,mono:S.pace&&S.pace.h.every((v,i,a)=>!i||v>=a[i-1]),last:S.pace&&S.pace.h[S.pace.h.length-1]*10,pill:!!document.getElementById('pacePill')})")
        ck("31 racing Rook shows a live CPU score", '"k":"cpu"' in cp and 'Rook (CPU)' in cp and '"mono":true' in cp and '"pill":true' in cp, cp)
        d = json.loads(cp); ck("31 the pace ends at the rival's final score", d['last'] == d['s'], cp)
        await pg.evaluate("()=>{S.pace.s=1;}"); await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        ck("31 beating it is recorded", await pg.evaluate("stats.cpu.Rook.w===1&&document.getElementById('result').innerText.includes('You beat')"))
        ck("37 Rival Slayer medal track exists and updated", await pg.evaluate("ACH.some(a=>a.id==='rivals')&&stats.ach.rivals>=1"))
        # 32 your best
        lid = await pg.evaluate("S.L.id")
        ck("32 a win saves your best run for that puzzle", await pg.evaluate(f"!!(stats.pb&&stats.pb['{lid}']&&stats.pb['{lid}'].h.length>1)"))
        await pg.evaluate(CLOSE); await pg.evaluate(f"startLevel(LEVELS.findIndex(l=>l.id==='{lid}'))"); await pg.wait_for_timeout(300)
        ck("32 replaying shows your-best ghost", await pg.evaluate("S.pace&&S.pace.kind==='self'&&document.getElementById('pacePill').innerText.includes('Your best')"))
        await pg.evaluate("()=>document.getElementById('pacePill').click()"); await pg.wait_for_timeout(200)
        ck("32 tapping the ghost hides it", await pg.evaluate("!S.pace&&!document.getElementById('pacePill')"))
        await pg.evaluate(CLOSE); await pg.evaluate("()=>{const L=LEVELS.find(l=>l.cat==='Sports');startLevel(LEVELS.indexOf(L))}"); await pg.wait_for_timeout(200)
        # 33 cup
        await pg.evaluate(CLOSE); await pg.evaluate("openModes('mdRiv')"); await pg.wait_for_timeout(300)
        cup = await pg.evaluate("JSON.stringify([cupPuzzles().map(l=>l.cat+':'+l.name),cupState()])")
        ck("33 three cup puzzles from different categories", len(set(x.split(':')[0] for x in json.loads(cup)[0])) == 3, cup)
        for k in range(3):
            await pg.evaluate("()=>document.getElementById('cupPlay')?document.getElementById('cupPlay').click():playCup()"); await pg.wait_for_timeout(300)
            await pg.evaluate("()=>{S.pace.s=1}"); await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
            await pg.evaluate(CLOSE); await pg.evaluate("openModes('mdRiv')"); await pg.wait_for_timeout(200)
        ck("33 beating all three wins the cup + badge", await pg.evaluate("cupState().done&&!!(stats.badges||{})['cup-'+cupWeek()]&&document.getElementById('mdCup').innerText.includes('Cup won')"))
        # 34 loved
        await pg.evaluate(f"()=>{{stats.fb={{'{lid}':1}};openModes('mdLoved')}}"); await pg.wait_for_timeout(200)
        ck("34 loved puzzles listed with a play button", await pg.evaluate("document.querySelectorAll('#mdLoved [data-lv]').length===1"))
        await pg.evaluate("()=>document.querySelector('#mdLoved [data-lv]').click()"); await pg.wait_for_timeout(300)
        ck("34 tapping one starts it", await pg.evaluate(f"S&&S.L.id==='{lid}'"))
        # 35 report
        await pg.evaluate(PLAY); await pg.wait_for_timeout(900); await pg.evaluate("()=>{const c=document.getElementById('cele');if(c)c.hidden=true;document.getElementById('rpOpen').click()}"); await pg.wait_for_timeout(200)
        rp = await pg.evaluate("[...document.querySelectorAll('#textbox .rp-row')].map(a=>[a.href,a.target])")
        ck("35 report lists every clue as a link to a prefilled GitHub issue", len(rp) > 3 and all(h.startswith('https://github.com/marcompsci/CrossFall/issues/new?title=Clue%20report') and t == '_blank' for h, t in rp), rp[:1])
        # 36 history
        await pg.evaluate(CLOSE); await pg.evaluate("openHistory()"); await pg.wait_for_timeout(200)
        n = await pg.evaluate("[document.querySelectorAll('#evh [data-hg]').length,stats.games.length]")
        ck("36 My games lists every saved game", n[0] == n[1] and n[0] >= 5, n)
        await pg.evaluate("()=>document.querySelector('#evh [data-hf=losses]').click()"); await pg.wait_for_timeout(100)
        ck("36 filter: losses", await pg.evaluate("[...document.querySelectorAll('#evh [data-hg]')].every(b=>!stats.games[+b.dataset.hg].win)"))
        await pg.evaluate("()=>{document.querySelector('#evh [data-hf=all]').click();document.querySelector('#evh [data-hg]').click()}"); await pg.wait_for_timeout(300)
        ck("36 tapping a game replays it", await pg.evaluate("!!S&&!!S.L&&document.getElementById('evh').hidden"))
        # 37 medals silent for existing players
        ctx2 = await b.new_context(); pg2 = await ctx2.new_page(); pg2.on("pageerror", lambda e: errs.append(str(e))); await pg2.set_content(SRC); await pg2.wait_for_timeout(800)
        r = await pg2.evaluate("()=>{stats.achInit=1;stats.gym={best:4000};celeQ.length=0;achCheck();return [stats.ach.gym,celeQ.length,ACH.length]}")
        ck("37 new medal tracks start silently at the earned tier", r == [2, 0, 18], r)
        await pg.evaluate(CLOSE); await pg.evaluate("()=>{openDrawer();['rivals','history','home'].forEach(a=>{})}")
        ck("drawer has the three new items", await pg.evaluate("['rivals','history','home'].every(a=>!!document.querySelector('#drawer [data-act='+a+']'))"))
        ck("no JS errors", not errs, errs[:3])
        await b.close()
    print(f"\n{sum(res)}/{len(res)} passed")
asyncio.run(main())
