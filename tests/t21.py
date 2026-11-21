"""Phases 233-247 (21 Nov 2026, morning). Run after scripts/build_index.py."""
from pathlib import Path
import asyncio, sys, re, collections
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from smoke_test import MOCK, PLAY
SRC = (ROOT / 'Crossfall' / 'index.html').read_text().replace('<head>', '<head>' + MOCK, 1)
res = []
def ck(n, ok, d=""):
    res.append(bool(ok)); print(f"{'PASS' if ok else 'FAIL'}  {n}{('  · ' + str(d)) if d not in ('', None) else ''}")
SETUP = """()=>{stats.tutDone=true;stats.nick='Omari';stats.freeCats=['Sports','Music','Night Sky'];stats.spSkip=1;stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');
 for(let i=19;i<=29;i++)stats['seen'+i]=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,drag:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;const p=document.getElementById('pauseOv');if(p)p.hidden=true;const r=document.getElementById('review');if(r)r.hidden=true;un=null;S=null;showMenu()}"
TO_DROP = "async()=>{for(let i=0;i<20&&S.phase==='cross';i++){const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}await new Promise(r=>setTimeout(r,50));return S.phase}"
BANK = "()=>{stats.bank=stats.bank||{};const W=['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GOLF','HOTEL','INDIA','JULIET'];W.forEach((w,i)=>stats.bank[w]={c:'Clue for '+w,t:Date.now()-i*1000,box:i<3?0:i<6?2:5,k:'Test'})}"
SOLVE_UN = "()=>{const w=un.list[un.i][0];document.getElementById('unIn').value=w;document.getElementById('unForm').dispatchEvent(new Event('submit',{cancelable:true}))}"

async def main():
    src = (ROOT / 'web' / 'crossfall.html').read_text()
    dup = [k for k, v in collections.Counter(re.findall(r'^function ([A-Za-z0-9_]+)\(', src, re.M)).items() if v > 1]
    ck("no function is declared twice", not dup, dup)
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 393, "height": 852}, has_touch=True); pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time='2026-11-21T09:00:00')
        await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(SETUP); await pg.wait_for_timeout(300)
        await pg.evaluate(BANK)
        # 233 234 daily unscramble
        await pg.evaluate("goPage('Play');renderDailyCard()"); await pg.wait_for_timeout(100)
        ck("234 Daily Unscramble is on Play", "Daily Unscramble" in await pg.evaluate("(document.getElementById('htUns')||{}).textContent||''"))
        l1 = await pg.evaluate("unDailyList().map(x=>x[0]).join(',')"); l2 = await pg.evaluate("unDailyList().map(x=>x[0]).join(',')")
        ck("233 the daily words are the same all day", l1 == l2 and l1.count(",") == 4, l1)
        await pg.evaluate("document.getElementById('htUns').click()"); await pg.wait_for_timeout(100)
        ck("233 it opens as Daily Unscramble", "DAILY" in await pg.evaluate("document.querySelector('#evh h1').textContent"))
        for _ in range(5): await pg.evaluate(SOLVE_UN)
        du = await pg.evaluate("[document.querySelector('#evh .pts').textContent,(stats.unDaily||{}).n,unDailyDone(),document.querySelector('#evh .sub').textContent]")
        ck("233 finishing it starts a streak", du[0] == "5/5" and du[1] == 1 and du[2], du)
        await pg.evaluate("document.getElementById('evDone').click()")
        await pg.evaluate("openUnDaily()")
        ck("233 only once a day", await pg.evaluate("document.getElementById('evh').hidden"))
        # 235 speed
        await pg.evaluate("openUnSpeed()"); await pg.wait_for_timeout(100)
        sp = await pg.evaluate("[document.querySelector('#evh h1').textContent,(document.getElementById('unTimer')||{}).textContent||'']")
        ck("235 Speed Unscramble has a 60-second timer", "SPEED" in sp[0] and sp[1].endswith("s"), sp)
        for _ in range(3): await pg.evaluate(SOLVE_UN)
        await pg.evaluate("un.end=Date.now()-1"); await pg.wait_for_timeout(400)
        ss = await pg.evaluate("[document.querySelector('#evh .pts').textContent,stats.unSpeed]")
        ck("235 time's up shows words solved and saves a best", ss == ["3", 3], ss)
        await pg.evaluate(CLOSE)
        # 237 238 learn
        await pg.evaluate("goPage('Learn');renderLearn()"); await pg.wait_for_timeout(100)
        ck("Learn has Daily and Speed Unscramble", await pg.evaluate("!!document.getElementById('lnUnD')&&!!document.getElementById('lnUnS')"))
        await pg.evaluate("document.getElementById('lsMastered').click()"); await pg.wait_for_timeout(100)
        mw = await pg.evaluate("[...document.querySelectorAll('#evh [data-mw]')].map(b=>b.textContent)")
        ck("237 Mastered words lists words known 4+ times", sorted(mw) == ["GOLF", "HOTEL", "INDIA", "JULIET"], mw)
        sh = await pg.evaluate("()=>{let t='';const o=shareOut;shareOut=x=>{t=x};document.getElementById('mwShare').click();shareOut=o;return t}")
        ck("238 share my word list", "4 mastered of 10" in sh and "GOLF" in sh, sh[:60])
        await pg.evaluate(CLOSE)
        # play
        for c in ["Sports", "Music"]:
            await pg.evaluate(CLOSE); await pg.evaluate(f"startLevel(LEVELS.findIndex(l=>l.cat==='{c}'))"); await pg.wait_for_timeout(100)
            await pg.evaluate(PLAY); await pg.wait_for_timeout(800)
        # 240 notes
        nt = await pg.evaluate("""async()=>{document.getElementById('ntEdit').click();document.getElementById('ntIn').value='Remember the bassist';document.getElementById('ntForm').dispatchEvent(new Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,30));return [stats.notes[S.L.id],(document.querySelector('.nt-cur')||{}).textContent||'',S.L.id]}""")
        ck("240 add a note to a puzzle from its results", nt[0] == "Remember the bassist" and "bassist" in nt[1], nt[:2])
        # 241 242 find
        await pg.evaluate(CLOSE); await pg.evaluate("openFind('The Band')"); await pg.wait_for_timeout(100)
        fr = await pg.evaluate("(document.querySelector('#fpList .fp-row')||{}).textContent||''")
        ck("241 Find shows your best score and your note", "best" in fr and "bassist" in fr, fr[:90])
        so = await pg.evaluate("()=>{const q=document.getElementById('fpQ');q.value='';const s=document.getElementById('fpSort');s.value='name';s.dispatchEvent(new Event('change'));return [...document.querySelectorAll('#fpList .fp-row b')].slice(0,30).map(b=>b.textContent)}")
        ck("242 sort puzzles A–Z", so == sorted(so, key=str.lower) and len(so) > 5, so[:4])
        await pg.evaluate(CLOSE)
        # 239 236 profile
        await pg.evaluate("goPage('Profile');renderProfile()"); await pg.wait_for_timeout(150)
        pf = await pg.evaluate("[document.querySelectorAll('.cy .cy-r').length,(document.querySelector('.pr-row')||{}).textContent||'']")
        ck("239 puzzles by category this year", pf[0] >= 2, pf[0])
        ck("236 Unscramble bests in your records", "best Unscramble" in pf[1] and "Speed Unscramble" in pf[1], pf[1][-80:])
        await pg.evaluate(CLOSE)
        # 243 pause target
        await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); ph = await pg.evaluate(TO_DROP)
        await pg.evaluate("pauseWell()")
        tg = await pg.evaluate("[[...document.querySelectorAll('.pz-target b')].map(b=>b.textContent).join(''),S.L.target[0]]")
        ck("243 the pause card shows the target word", ph == "drop" and tg[0] == tg[1], tg)
        await pg.evaluate(CLOSE)
        # 244 tiles
        await pg.evaluate("()=>{prefs.hideHt={uns:true,mc:true};goPage('Play');renderDailyCard()}"); await pg.wait_for_timeout(100)
        ck("244 hide Play cards you don't want", await pg.evaluate("!document.querySelector('#dailyCard .ht-uns')&&!document.querySelector('#dailyCard .ht-mc')"))
        await pg.evaluate("()=>{prefs.hideHt={};renderDailyCard()}")
        ck("244 and bring them back", await pg.evaluate("!!document.querySelector('#dailyCard .ht-mc')"))
        await pg.evaluate("renderPaceInfo();document.getElementById('settings').hidden=false"); await pg.wait_for_timeout(50)
        ck("244 Settings lists the Play cards", await pg.evaluate("document.querySelectorAll('#setHt [data-ht]').length===9"))
        await pg.evaluate("document.querySelector('[data-ht=wknd]').click()")
        ck("244 switching one off is saved", await pg.evaluate("prefs.hideHt.wknd===true"))
        await pg.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))")
        ck("247 Escape closes Settings", await pg.evaluate("document.getElementById('settings').hidden"))
        # 245
        q = await pg.evaluate("()=>{prefs.quietCele=true;const n=celeQ.length;queueCele({kind:'xp',title:'+50 XP',sub:'x'});const a=celeQ.length===n;queueCele({kind:'xp',title:'November challenge done',sub:'x'});const b=celeQ.length===n+1;prefs.quietCele=false;return [a,b]}")
        ck("245 fewer celebrations keeps only the big ones", q == [True, True], q)
        # 246
        await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))")
        rc = await pg.evaluate("()=>{const said=[];const o=speakText;speakText=t=>{said.push(t);return true};prefs.readClue=true;selectWord(S.cw.words[1]);selectWord(S.cw.words[1]);selectWord(S.cw.words[2]);speakText=o;prefs.readClue=false;return said}")
        ck("246 each new word's clue is read aloud once", len(rc) == 2 and "letters" in rc[0], rc)
        await pg.evaluate(CLOSE)
        # 247 review escape
        await pg.evaluate("openReview()"); await pg.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))")
        ck("247 Escape closes the review", await pg.evaluate("document.getElementById('review').hidden"))
        wn = await pg.evaluate("async()=>{stats.seen29=0;maybeWhatsNew();await new Promise(r=>setTimeout(r,50));const t=document.getElementById('evh').textContent;return [t.includes('Daily and Speed Unscramble'),document.querySelectorAll('#evh > .panel.wn').length,!!stats.seen29]}")
        ck("What's New leads with this update", wn == [True, 4, True], wn)
        ck("no page errors", not errs, errs[:3])
        await ctx.close(); await b.close()
    print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)

asyncio.run(main())
