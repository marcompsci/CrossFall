"""Phases 178-207 (20 Nov 2026, late). Run after scripts/build_index.py."""
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
 stats.seen19=1;stats.seen20=1;stats.seen21=1;stats.seen22=1;stats.seen23=1;stats.seen24=1;stats.seen25=1;stats.seen26=1;stats.seen27=1;stats.seen28=1;stats.seen29=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,drag:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;const p=document.getElementById('pauseOv');if(p)p.hidden=true;S=null;showMenu()}"
TO_DROP = "async()=>{for(let i=0;i<20&&S.phase==='cross';i++){const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}await new Promise(r=>setTimeout(r,50));return S.phase}"
PROFILE = "()=>{goPage('Profile');renderProfile()}"

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 393, "height": 852}, has_touch=True); pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time='2026-11-20T21:30:00')
        await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(SETUP); await pg.wait_for_timeout(300)
        # play two games
        for c in ["Sports", "Music"]:
            await pg.evaluate(CLOSE); await pg.evaluate(f"startLevel(LEVELS.findIndex(l=>l.cat==='{c}'))"); await pg.wait_for_timeout(100)
            await pg.evaluate(PLAY); await pg.wait_for_timeout(800)
        rs = await pg.evaluate("(document.querySelector('#result .rs-extra')||{}).textContent||''")
        ck("196 results show the XP you earned", "XP" in rs, rs[:80])
        ck("182 results show the monthly challenge progress", "November" in rs, rs[:80])
        nb = await pg.evaluate("!!document.getElementById('nextCat')")
        await pg.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'n'}))"); await pg.wait_for_timeout(150)
        ck("197 N goes to the next puzzle in the category", (not nb) or await pg.evaluate("!!S&&S.phase==='cross'"))
        # 178-181 find
        await pg.evaluate(CLOSE); await pg.evaluate("goPage('Play');renderDailyCard()"); await pg.wait_for_timeout(100)
        ck("206 a Find button above the categories", await pg.evaluate("!!document.getElementById('findLink')"))
        await pg.evaluate("document.getElementById('findLink').click()"); await pg.wait_for_timeout(100)
        f0 = await pg.evaluate("[document.querySelectorAll('#fpList .fp-row').length,(document.getElementById('fpRecent')||{}).textContent||'']")
        ck("178 Find a puzzle lists puzzles", f0[0] >= 20, f0[0])
        ck("181 with what you played recently", "Recently played" in f0[1], f0[1][:40])
        sr = await pg.evaluate("()=>{const q=document.getElementById('fpQ');q.value='night sky';q.dispatchEvent(new Event('input'));return [...document.querySelectorAll('#fpList .fp-row .sub')].map(x=>x.textContent).slice(0,40)}")
        ck("178 search by category", len(sr) > 0 and all(x.startswith("Night Sky") for x in sr), sr[:2])
        fl = await pg.evaluate("()=>{const q=document.getElementById('fpQ');q.value='';q.dispatchEvent(new Event('input'));document.querySelector('[data-ff=partial]').click();return [...document.querySelectorAll('#fpList .fp-st')].map(x=>x.textContent)}")
        ck("179 filter to puzzles with 1–2 stars", len(fl) >= 1 and all(1 <= x.count("★") <= 2 for x in fl), fl[:4])
        await pg.evaluate("()=>{document.querySelector('[data-ff=all]').click();const q=document.getElementById('fpQ');q.value='sports';q.dispatchEvent(new Event('input'));document.getElementById('fpRand').click()}"); await pg.wait_for_timeout(150)
        ck("180 surprise me from the list starts a puzzle", await pg.evaluate("!!S&&S.phase==='cross'"))
        await pg.evaluate(CLOSE)
        ck("Menu has Find a puzzle and What's new", await pg.evaluate("!!document.querySelector('#drawer [data-act=find]')&&!!document.querySelector('#drawer [data-act=wnew]')"))
        await pg.evaluate("document.querySelector('#drawer [data-act=wnew]').click()"); await pg.wait_for_timeout(150)
        ck("205 What's new opens from the Menu any time", await pg.evaluate("document.getElementById('evh').textContent.includes('Find a puzzle')&&stats.seen29===1"))
        await pg.evaluate(CLOSE)
        # 182 183 monthly challenge
        await pg.evaluate("goPage('Play');renderDailyCard()"); await pg.wait_for_timeout(100)
        mc = await pg.evaluate("(document.querySelector('#homeTiles .ht-mc')||{}).textContent||''")
        ck("182 the monthly challenge is on Play", "November challenge" in mc and " of " in mc, mc[:70])
        done = await pg.evaluate("()=>{const p=mcProgress();if(p.k==='stars'){stats.mcExtra={[p.ym]:999}}else{stats.mon[p.ym][p.k]=999}mcCheck();return [mcProgress().done,(stats.mcDone||[]).includes(p.ym),!!stats.badges['mc-'+p.ym]]}")
        ck("183 finishing it gives a badge and XP", done == [True, True, True], done)
        # 185 189
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(100)
        pt = await pg.evaluate("()=>{prefs.cluePat=true;const w=S.cw.words.find(w=>!w.solved);selectWord(w);const k=w.cells.find(k=>!S.cw.cells.get(k).lock);S.sel.key=k;typeLetter(S.cw.cells.get(k).ans);renderAll();return document.getElementById('clueNum').textContent}")
        ck("185 the clue shows the letters you have so far", "_" in pt, pt)
        said = await pg.evaluate("""async()=>{const said=[];const o=speakText;speakText=t=>{said.push(t);return true};prefs.sayWord=true;const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock&&!c.val){S.sel.key=k;typeLetter(c.ans)}}
            await new Promise(r=>setTimeout(r,400));speakText=o;prefs.sayWord=false;return [said,w.ans.toLowerCase()]}""")
        ck("189 the solved word is spoken", said[1] in said[0], said)
        # 201 202
        ph = await pg.evaluate(TO_DROP)
        await pg.evaluate("()=>{S.queue=[];renderAll();renderQueue()}")
        ck("201 the last piece is flagged", ph == "drop" and await pg.evaluate("document.getElementById('queue').classList.contains('last')"))
        await pg.evaluate("pauseWell()")
        ck("202 the pause card has a tip", "Tip:" in await pg.evaluate("(document.querySelector('.pz-tip')||{}).textContent||''"))
        await pg.evaluate(CLOSE)
        # 186 187 188 199
        cl = await pg.evaluate("()=>{prefs.boldFocus=true;prefs.tint='warm';prefs.skin='neon';applyLook178();const h=document.documentElement;const r=['boldfocus','tint-warm','skin-neon'].filter(c=>h.classList.contains(c));prefs.tint='auto';applyLook178();r.push(h.classList.contains('tint-warm')?'auto-warm':'auto-off');return r}")
        ck("186/187/199 bold focus, warm tint and well skins", cl[:3] == ["boldfocus", "tint-warm", "skin-neon"], cl)
        ck("188 the tint turns on by itself at 9:30 pm", cl[3] == "auto-warm", cl)
        # profile 190-195
        await pg.evaluate("()=>{stats.dstreak={n:4,last:todayKey(),freezes:0,best:4};stats.xpBonus=(stats.xpBonus||0)+40000}")
        await pg.evaluate(PROFILE); await pg.wait_for_timeout(150)
        pf = await pg.evaluate("""()=>{const hs=[...document.querySelectorAll('#profile .pp-h')].map(h=>h.textContent);return {hs,mg:document.querySelectorAll('.mg span:not(.x)').length,yr:(document.querySelector('#pfYear')||{}).textContent||'',lit:!!document.querySelector('.pp-tile.fire.lit'),fr:(document.querySelector('.pp-top .pf-av')||{}).className||''}}""")
        ck("190 your month as a calendar", any(h.startswith("November") for h in pf['hs']) and pf['mg'] == 30, pf['mg'])
        ck("191 your year so far", any("so far" in h for h in pf['hs']), pf['hs'])
        ck("192 share my year so far", "Share my year" in pf['yr'])
        ck("193 the streak tile is lit at 3+ days", pf['lit'])
        ck("194 an avatar frame from level 10", "fr-" in pf['fr'], pf['fr'])
        yr = await pg.evaluate("()=>{let t='';const o=shareOut;shareOut=x=>{t=x};document.getElementById('pfYear').click();shareOut=o;return t}")
        ck("192 the shared text has your puzzles and days", "puzzles" in yr and "days played" in yr, yr[:60])
        nc = await pg.evaluate("()=>{document.getElementById('pfEdit').click();const i=document.getElementById('nickIn');i.value='Omari The Great';i.dispatchEvent(new Event('input'));return document.getElementById('nickLeft').textContent}")
        ck("195 the name field shows letters left", nc == "1 left", nc)
        await pg.evaluate(CLOSE)
        # 198 daily streak line
        await pg.evaluate("playDaily(todayKey())"); await pg.wait_for_timeout(150); await pg.evaluate(PLAY); await pg.wait_for_timeout(800)
        ck("198 a finished Daily shows your streak", "Daily streak" in await pg.evaluate("(document.querySelector('#result .rs-extra')||{}).textContent||''"))
        await pg.evaluate(CLOSE)
        # 203 207 word to know
        await pg.evaluate("()=>{for(const w of ['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT'])stats.bank[w]=stats.bank[w]||{c:'Clue for '+w,t:Date.now(),box:2}}")
        await pg.evaluate("goPage('Play');renderDailyCard()"); await pg.wait_for_timeout(100)
        wk = await pg.evaluate("[(document.querySelector('.ht-wtk .wtk-c')||{}).textContent||'',document.getElementById('wtkA')&&document.getElementById('wtkA').hidden]")
        ck("203 a word to know shows its clue first", len(wk[0]) > 3 and wk[1] is True, wk)
        await pg.evaluate("document.getElementById('wtkShow').click()")
        ck("207 tap to see the word, then say if you knew it", await pg.evaluate("!document.getElementById('wtkA').hidden&&!!document.getElementById('wtkGot')&&!!document.getElementById('wtkStudy')"))
        await pg.evaluate("document.getElementById('wtkGot').click()")
        ck("207 knowing it is counted", await pg.evaluate("stats.wtkOk===1"))
        # 200 204 settings
        await pg.evaluate("renderPaceInfo();document.getElementById('settings').hidden=false"); await pg.wait_for_timeout(50)
        st = await pg.evaluate("['setSkin','skinPrev','setTint','setPat','setSay','setFocus','setWtk','setResetLook'].filter(id=>!document.getElementById(id))")
        ck("200 skins with a preview, and the new switches", st == [], st)
        await pg.evaluate("document.querySelector('[data-sk=paper]').click()")
        ck("199 picking a skin applies it", await pg.evaluate("document.documentElement.classList.contains('skin-paper')&&prefs.skin==='paper'"))
        rr = await pg.evaluate("()=>{prefs.hcWell=true;prefs.lefty=true;const b=document.getElementById('setResetLook');b.click();const once=prefs.skin;document.getElementById('setResetLook').click();return [once,prefs.skin,prefs.hcWell,prefs.lefty,document.documentElement.classList.contains('skin-paper')]}")
        ck("204 reset look settings needs two taps and clears them", rr[0] == "paper" and rr[1] is None and rr[2] is None and rr[3] is None and rr[4] is False, rr)
        await pg.evaluate(CLOSE)
        wn = await pg.evaluate("async()=>{stats.seen27=0;stats.seen28=0;stats.seen29=0;maybeWhatsNew();await new Promise(r=>setTimeout(r,50));const t=document.getElementById('evh').textContent;return [t.includes('Find a puzzle'),document.querySelectorAll('#evh > .panel.wn').length,!!stats.seen27]}")
        ck("What's New leads with this update", wn == [True, 4, True], wn)
        ck("no page errors", not errs, errs[:3])
        await ctx.close(); await b.close()
    print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)

asyncio.run(main())
