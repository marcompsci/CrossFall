"""Phases 123-147 (20 Nov 2026, evening). Run after scripts/build_index.py."""
from pathlib import Path
import asyncio, sys
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from smoke_test import MOCK, PLAY
SRC = (ROOT / 'Crossfall' / 'index.html').read_text().replace('<head>', '<head>' + MOCK, 1)
res = []
def ck(n, ok, d=""):
    res.append(bool(ok)); print(f"{'PASS' if ok else 'FAIL'}  {n}{('  · ' + str(d)) if d not in ('', None) else ''}")
SETUP = """()=>{stats.tutDone=true;stats.nick='Omari';stats.freeCats=['Sports','Music','Night Sky'];stats.spSkip=1;stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');
 stats.seen19=1;stats.seen20=1;stats.seen21=1;stats.seen22=1;stats.seen23=1;stats.seen24=1;stats.seen25=1;stats.seen26=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,drag:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;const p=document.getElementById('pauseOv');if(p)p.hidden=true;S=null;showMenu()}"
TO_DROP = "async()=>{for(let i=0;i<20&&S.phase==='cross';i++){const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}await new Promise(r=>setTimeout(r,50));return S.phase}"
PROFILE = "()=>{goPage('Profile');renderProfile()}"

async def page(b, when):
    ctx = await b.new_context(viewport={"width": 393, "height": 852}, has_touch=True); pg = await ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time=when)
    await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(SETUP); await pg.wait_for_timeout(300); return ctx, pg, errs

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # Monday evening so the weekly summary and tonight's sky show
        ctx, pg, errs = await page(b, '2026-11-23T20:30:00')
        # 126 clean solves
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(100)
        cl = await pg.evaluate("""()=>{let n=0;for(const w of S.cw.words.slice(0,4)){selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}n++;S.phase='cross';S.queue=[];S.active=null}return [S.clean,S.pts.clean||0,(document.getElementById('cleanChip')||{}).textContent||'']}""")
        ck("126 clean solves in a row count up and score from the third", cl[0] >= 3 and cl[1] >= 25, cl)
        ck("127 a Clean chip shows in the clue bar", "Clean ×" in cl[2], cl[2])
        wr = await pg.evaluate("""()=>{const w=S.cw.words.find(w=>!w.solved);if(!w)return 'none';selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans==='Q'?'Z':'Q')}}const r=S.clean;S.phase='cross';return r}""")
        ck("126 a wrong word resets the clean streak", wr in (0, 'none'), wr)
        ck("127 the best clean streak is kept as a record", await pg.evaluate("prRec().clean>=3"))
        # 123 pause
        ph = await pg.evaluate(TO_DROP)
        await pg.evaluate("renderWell()")
        ck("123 the well has a pause button", ph == "drop" and await pg.evaluate("!document.getElementById('wellPause').hidden"))
        await pg.evaluate("document.getElementById('wellPause').click()")
        ps = await pg.evaluate("[S.paused,S.freezeUntil===Infinity,!document.getElementById('pauseOv').hidden]")
        ck("123 pausing freezes the well and shows Resume", ps == [True, True, True], ps)
        await pg.evaluate("document.getElementById('pzResume').click()"); await pg.wait_for_timeout(100)
        rs = await pg.evaluate("[S.paused,S.freezeUntil>performance.now()&&S.freezeUntil<Infinity,document.getElementById('pauseOv').hidden]")
        ck("123 resume counts back in", rs == [False, True, True], rs)
        await pg.evaluate("()=>{S.freezeUntil=0;document.dispatchEvent(new KeyboardEvent('keydown',{key:'p'}))}")
        ck("123 P pauses from a keyboard", await pg.evaluate("S.paused===true"))
        await pg.evaluate("resumeWell()")
        # 125 landing sound pitch
        pit = await pg.evaluate("""()=>{const f=[];const o=blip;blip=(hz)=>f.push(hz);S.freezeUntil=0;S.active={cells:[{dr:0,dc:0,ch:'A'}],r:0,c:0};S.phase='drop';hardDrop();blip=o;return f}""")
        ck("125 landing plays a pitched thud", any(isinstance(x, (int, float)) and x >= 180 for x in pit), pit)
        # 124 138 139 141 140
        await pg.evaluate("prefs.wellGrid=true;prefs.lefty=true;prefs.spaced=true;prefs.noFlash=true;applyComfort2()")
        cls = await pg.evaluate("['wgrid','lefty','spaced','noflash'].filter(c=>document.documentElement.classList.contains(c))")
        ck("124/138/139/141 grid lines, left-handed, roomier clues, fewer flashes", len(cls) == 4, cls)
        ck("138 left-handed flips the control row", await pg.evaluate("(()=>{renderAll();const c=document.querySelector('#pad .ctrl');return !c||getComputedStyle(c).direction==='rtl'})()"))
        q = await pg.evaluate("()=>{prefs.quiet=true;const a=quietNow();prefs.quiet=false;return [a,quietNow()]}")
        ck("140 quiet hours mute sounds at night (it's 8:30 pm here: off)", q == [False, False], q)
        await pg.evaluate("prefs.wellGrid=false;prefs.lefty=false;prefs.spaced=false;prefs.noFlash=false;applyComfort2()")
        # finish a game for records + 143
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Sports'))"); await pg.wait_for_timeout(100)
        await pg.evaluate(PLAY); await pg.wait_for_timeout(800)
        nx = await pg.evaluate("(document.getElementById('nextCat')||{}).textContent||''")
        ck("143 results offer the next puzzle in the category", "Next in Sports" in nx, nx)
        await pg.evaluate("document.getElementById('nextCat').click()"); await pg.wait_for_timeout(150)
        ck("143 and it starts it", await pg.evaluate("!!S&&S.L.cat==='Sports'&&S.phase==='cross'"))
        ck("134 fastest crossword is recorded", await pg.evaluate("prRec().fastest>0&&!!(stats.catFast||{}).Sports"))
        # home tiles
        await pg.evaluate(CLOSE)
        await pg.evaluate("""()=>{const t=new Date('2026-11-17T12:00:00').getTime();stats.games.push({t,id:LEVELS[0].id,cat:LEVELS[0].cat,name:LEVELS[0].name,score:2222,win:true,stars:2});
            const l=LEVELS.find(l=>l.cat==='Music'&&!(store[l.id]||{}).stars);store[l.id]={stars:2};stats.daily=stats.daily||{};}""")
        await pg.evaluate("goPage('Play');renderDailyCard()"); await pg.wait_for_timeout(100)
        ht = await pg.evaluate("[!!document.getElementById('htWeek'),!!document.getElementById('htSky'),!!document.getElementById('htAlmost'),(document.getElementById('htSky')||{}).textContent||'']")
        ck("129 Monday shows last week's summary", ht[0], ht)
        ck("136 the evening shows Tonight's sky", ht[1] and "Tonight's sky" in ht[3], ht[3][:60])
        ck("130 a puzzle with two stars is suggested", ht[2])
        await pg.evaluate("document.getElementById('htWeekX').click()"); await pg.evaluate("renderDailyCard()")
        ck("129 dismissing the summary sticks", await pg.evaluate("!document.getElementById('htWeek')"))
        await pg.evaluate("document.getElementById('htSky').click()"); await pg.wait_for_timeout(100)
        ck("136 Tonight's sky starts a Night Sky puzzle", await pg.evaluate("!!S&&S.L.cat==='Night Sky'"))
        await pg.evaluate(CLOSE)
        # 128 beat yesterday
        yb = await pg.evaluate("""()=>{const y=addDays(todayKey(),-1);const o=dailyRecord;dailyRecord=k=>k===y?{score:4321}:null;renderDailyCard();const t=(document.querySelector('#dailyCard .dc-beat')||{}).textContent||'';dailyRecord=o;return t}""")
        ck("128 the Daily card shows yesterday's score to beat", "4,321" in yb, yb)
        # profile
        await pg.evaluate(PROFILE); await pg.wait_for_timeout(150)
        pr = await pg.evaluate("[(document.querySelector('.pr-row')||{}).textContent||'',!!document.getElementById('xpHelp'),!!document.getElementById('ppSort')]")
        ck("134 personal records on the profile", "fastest crossword" in pr[0] and "best combo" in pr[0], pr[0][:80])
        await pg.evaluate("document.getElementById('xpHelp').click()")
        ck("146 How to earn XP opens", await pg.evaluate("!document.getElementById('xpBox').hidden"))
        await pg.evaluate("document.querySelector('.pp-top .pf-av').click()"); await pg.wait_for_timeout(100)
        ck("145 tapping the avatar opens Avatar & title", await pg.evaluate("!document.getElementById('evh').hidden||!!document.querySelector('.ov:not([hidden]) #lookDone, #look:not([hidden])')"))
        await pg.evaluate(CLOSE); await pg.evaluate(PROFILE)
        mo = await pg.evaluate("""async()=>{document.getElementById('pfEdit').click();document.querySelector('[data-hc=ocean]').click();const g1=document.querySelector('.pp-hero').style.getPropertyValue('--g1');
            document.getElementById('mottoIn').value='Keep pushing';document.getElementById('nickForm').dispatchEvent(new Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,50));
            return [g1,prefs.heroCol,stats.motto,(document.querySelector('.pp-motto')||{}).textContent||'',document.querySelector('.pp-hero').style.getPropertyValue('--g1')]}""")
        ck("132 pick a card colour", mo[0] == "#2e8bd8" and mo[1] == "ocean" and mo[4] == "#2e8bd8", mo)
        ck("133 add a motto", mo[2] == "Keep pushing" and "Keep pushing" in mo[3], mo)
        fv = await pg.evaluate("""async()=>{const b=document.querySelector('button.pp-word');const w=b.textContent;b.click();document.getElementById('favBtn').click();await new Promise(r=>setTimeout(r,50));return [w,(stats.favW||[])[0],(document.querySelector('.pp-fw')||{}).textContent||'']}""")
        ck("131 love a word and it shows at the top", fv[0] == fv[1] and fv[0] in fv[2], fv)
        so = await pg.evaluate("""()=>{document.getElementById('ppSort').click();const v=[...document.querySelectorAll('.pp-cats .pp-cat .v')].map(x=>parseInt(x.textContent));return [prefs.catSort,v.every((x,i)=>i===0||v[i-1]>=x)]}""")
        ck("144 sort categories by most stars", so == ["most", True], so)
        fo = await pg.evaluate("""()=>{const s=[...document.querySelectorAll('.pp-sec')].find(s=>s.querySelector('.pp-h').textContent.startsWith('Rivals'));s.querySelector('.pp-fold').click();const a=s.classList.contains('folded');renderProfile();
            const s2=[...document.querySelectorAll('.pp-sec')].find(s=>s.querySelector('.pp-h').textContent.startsWith('Rivals'));return [a,s2.classList.contains('folded'),s2.querySelector('.pp-fold').getAttribute('aria-expanded')]}""")
        ck("147 fold a section and it stays folded", fo == [True, True, "false"], fo)
        # 135
        await pg.evaluate("openCatDeep('Sports')"); await pg.wait_for_timeout(100)
        ck("135 category details show your fastest crossword", "fastest Sports crossword" in await pg.evaluate("(document.querySelector('#evh .cd-fast')||{}).textContent||''"))
        await pg.evaluate(CLOSE)
        # 137 breathing
        await pg.evaluate("openBreath()"); await pg.wait_for_timeout(50)
        await pg.evaluate("document.querySelector('[data-bp=box]').click();document.querySelector('[data-bn=\"1\"]').click()")
        sub = await pg.evaluate("document.querySelector('#evh .sub').textContent")
        ck("137 choose box breathing and how many breaths", "1 slow breath" in sub and sub.count("4") == 4, sub)
        await pg.evaluate("document.getElementById('brGo').click()"); await pg.wait_for_timeout(12500)
        st = await pg.evaluate("document.getElementById('brCue').textContent")
        ck("137 box breathing goes in, hold, out, hold", st.startswith("Hold"), st)
        await pg.wait_for_timeout(4200)
        ck("137 and finishes after one breath", "Well done" in await pg.evaluate("document.getElementById('brCue').textContent"))
        await pg.evaluate(CLOSE)
        # 142
        await pg.evaluate("()=>{const l=LEVELS.find(l=>l.cat==='Sports');stats.games.unshift({t:Date.now(),id:l.id,cat:l.cat,name:l.name,score:1,win:true,stars:1})}")
        await pg.evaluate("openHistory()"); await pg.wait_for_timeout(100)
        ck("142 My games marks your best run on a puzzle", await pg.evaluate("document.querySelectorAll('#evh .hs-best').length>=1"))
        await pg.evaluate(CLOSE)
        # settings + what's new
        await pg.evaluate("renderPaceInfo();document.getElementById('settings').hidden=false"); await pg.wait_for_timeout(50)
        ck("Settings has the new comfort switches", await pg.evaluate("['setWGrid','setLefty','setSpaced','setNoFlash','setQuiet','setAutoPause'].every(id=>!!document.getElementById(id))"))
        await pg.evaluate("document.getElementById('setAutoPause').click()")
        ck("Pause when you leave can be turned off", await pg.evaluate("prefs.autoPause===false"))
        await pg.evaluate(CLOSE)
        wn = await pg.evaluate("async()=>{stats.seen25=0;stats.seen26=0;maybeWhatsNew();await new Promise(r=>setTimeout(r,50));const t=document.getElementById('evh').textContent;return [t.includes('Pause the well'),document.querySelectorAll('#evh > .panel.wn').length,!!stats.seen25]}")
        ck("What's New leads with this update", wn == [True, 4, True], wn)
        ck("score breakdown names clean solves", await pg.evaluate("PTS_LABEL.clean==='Clean solves'"))
        ck("no page errors", not errs, errs[:3])
        await ctx.close()
        # 140 at night
        ctx, pg, errs2 = await page(b, '2026-11-23T23:30:00')
        q = await pg.evaluate("()=>{prefs.quiet=true;const f=[];const o=AC;return quietNow()}")
        ck("140 quiet hours are on at 11:30 pm", q is True)
        ck("no page errors (night)", not errs2, errs2[:3])
        await ctx.close(); await b.close()
    print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)

asyncio.run(main())
