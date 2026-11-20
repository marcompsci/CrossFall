"""Phases 83-102 (20 Nov 2026): a deeper well, your sky, take a breath, settings search. Run after scripts/build_index.py."""
from pathlib import Path
import asyncio, sys
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from smoke_test import MOCK, PLAY
SRC = (ROOT / 'Crossfall' / 'index.html').read_text().replace('<head>', '<head>' + MOCK, 1)
res = []
def ck(n, ok, d=""):
    res.append(bool(ok)); print(f"{'PASS' if ok else 'FAIL'}  {n}{('  · ' + str(d)) if d not in ('', None) else ''}")
SETUP = """()=>{stats.tutDone=true;stats.nick='T';stats.freeCats=['Sports','Music','Night Sky'];stats.spSkip=1;stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');
 stats.seen19=1;stats.seen20=1;stats.seen21=1;stats.seen22=1;stats.seen23=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,drag:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;S=null;showMenu()}"
TO_DROP = "async()=>{for(let i=0;i<20&&S.phase==='cross';i++){const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}await new Promise(r=>setTimeout(r,50));return S.phase}"
EMPTY = "()=>{S.grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));S.freezeUntil=0;S.combo=0;S.pts={};S.score=0;S.linesCleared=0;S._lc2=0;S._pendClear=null}"
SINGLE = "(ch,c)=>{S.phase='drop';S.active={cells:[{dr:0,dc:0,ch}],r:0,c};renderWell()}"

async def page(b, when, setup=SETUP):
    ctx = await b.new_context(viewport={"width": 393, "height": 852}, has_touch=True); pg = await ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time=when)
    await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(setup); await pg.wait_for_timeout(400); return ctx, pg, errs

async def drop_game(pg, cat='Music'):
    await pg.evaluate(CLOSE); await pg.evaluate(f"startLevel(LEVELS.findIndex(l=>l.cat==='{cat}'))"); await pg.wait_for_timeout(150)
    ph = await pg.evaluate(TO_DROP); await pg.evaluate(EMPTY); return ph

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await page(b, '2026-11-20T10:00:00')
        ph = await drop_game(pg)
        ck("setup reaches the drop phase", ph == "drop", ph)
        # 83 clear preview
        await pg.evaluate("()=>{for(let c=1;c<COLS;c++)S.grid[ROWS-1][c]={ch:'Q'}}"); await pg.evaluate(f"({SINGLE})('Q',0)")
        n = await pg.evaluate("document.querySelectorAll(`#well .wc.willclear[data-r='${ROWS-1}']`).length")
        ck("83 the row a drop will clear lights up while you aim", n == 7, n)
        await pg.evaluate("prefs.clearHint=false;renderWell()")
        ck("83 the hint can be turned off", await pg.evaluate("document.querySelectorAll('#well .wc.willclear').length===0"))
        await pg.evaluate("prefs.clearHint=true")
        # 85 spin clear
        await pg.evaluate(EMPTY); await pg.evaluate("()=>{for(let c=2;c<COLS;c++)S.grid[ROWS-1][c]={ch:'Q'};S.phase='drop';S.active={cells:[{dr:0,dc:0,ch:'Q'},{dr:0,dc:1,ch:'Q'}],r:0,c:0};S.lastAct='rotate';hardDrop()}"); await pg.wait_for_timeout(450)
        sp = await pg.evaluate("[S.pts.spin||0,S.linesCleared,(stats.ws||{}).spins]")
        ck("85 a clear right after a turn scores a spin clear", sp[0] == 200 and sp[1] == 1 and sp[2] >= 1, sp)
        # 87 letter match
        await pg.evaluate(EMPTY); await pg.evaluate("()=>{S.grid[ROWS-1][0]={ch:'A'}}"); await pg.evaluate(f"({SINGLE})('A',0)")
        await pg.evaluate("S.lastAct='move';hardDrop()"); await pg.wait_for_timeout(100)
        ck("87 a letter landing on the same letter scores a match", await pg.evaluate("S.pts.match===20&&(stats.ws||{}).matches>=1"), await pg.evaluate("S.pts.match"))
        # 86 word link
        wl = await pg.evaluate(f"""async()=>{{({EMPTY})();const w=[...DICT].find(w=>w.length===4&&/^[A-Z]+$/.test(w)&&![...w].includes('Q'));const row=(w+'QQQ').split('');
            for(let c=0;c<COLS-1;c++)S.grid[ROWS-1][c]={{ch:row[c]}};S.active={{cells:[{{dr:0,dc:0,ch:row[COLS-1]}}],r:0,c:COLS-1}};S.phase='drop';S.lastAct='move';hardDrop();
            await new Promise(r=>setTimeout(r,450));return [w,S.pts.link||0,(stats.ws||{{}}).links||0]}}""")
        ck("86 a real word hidden in a cleared row scores a word link", wl[1] >= 150 and wl[2] >= 1, wl)
        # 84 danger zone
        await pg.evaluate(EMPTY); await pg.evaluate("()=>{for(let r=2;r<ROWS;r++)S.grid[r][r%COLS]={ch:'E'};S.phase='drop';renderWell()}")
        ck("84 the well warns you when the stack nears the top", await pg.evaluate("document.getElementById('well').classList.contains('danger')"))
        await pg.evaluate(EMPTY); await pg.evaluate("renderWell()")
        ck("84 the warning clears when the stack drops", await pg.evaluate("!document.getElementById('well').classList.contains('danger')"))
        # 101 combo badge
        await pg.evaluate("S.phase='drop';S.combo=3;renderWell()")
        cb = await pg.evaluate("(()=>{const b=document.getElementById('wellCombo');return b&&!b.hidden?b.textContent:''})()")
        ck("101 a combo meter shows on the well", cb == "COMBO ×3", cb)
        await pg.evaluate("S.combo=0;renderWell()")
        ck("101 it hides when the combo ends", await pg.evaluate("document.getElementById('wellCombo').hidden"))
        # 102 spawn animation
        await pg.evaluate("spawnPiece({cells:[{dr:0,dc:0,ch:'A'}]});renderWell()")
        ck("102 new pieces drop in", await pg.evaluate("!S.active||document.querySelectorAll('#well .wc.p.spawn').length>0"))
        # 88 countdown
        cd = await pg.evaluate("async()=>{document.getElementById('drawer').hidden=false;closeDrawer();await new Promise(r=>setTimeout(r,300));const c=document.getElementById('cdn');return [!!c&&!c.hidden,c&&c.textContent,S.freezeUntil>performance.now()]}")
        ck("88 coming back from the menu gives a 3-2-1 before the well moves", cd[0] and cd[1] in ("3", "2") and cd[2], cd)
        await pg.wait_for_timeout(2600)
        ck("88 the countdown goes away", await pg.evaluate("document.getElementById('cdn').hidden"))
        # 89 touch coach
        await pg.evaluate(EMPTY); await pg.evaluate("delete stats.tips.drag;spawnPiece({cells:[{dr:0,dc:0,ch:'A'}]})")
        tc = await pg.evaluate("[!!document.getElementById('tcoach'),(document.getElementById('tcoach')||{}).textContent||'',stats.tips.drag]")
        ck("89 the first drop shows how to play on the well", tc[0] and "Flick" in tc[1] and tc[2] == 1, tc[1][:60])
        await pg.evaluate("S.active=null;document.getElementById('tcoach')&&document.getElementById('tcoach').remove();spawnPiece({cells:[{dr:0,dc:0,ch:'A'}]})")
        ck("89 only once", await pg.evaluate("!document.getElementById('tcoach')"))
        # 90 + 91
        await pg.evaluate("prefs.bigWell=true;prefs.ghost='solid';applyWellLook()")
        ck("90 bigger well letters", await pg.evaluate("document.documentElement.classList.contains('bigwell')"))
        ck("91 solid landing guide", await pg.evaluate("document.documentElement.classList.contains('ghost-solid')"))
        await pg.evaluate("prefs.bigWell=false;prefs.ghost='off';applyWellLook()")
        ck("91 landing guide can be turned off", await pg.evaluate("document.documentElement.classList.contains('ghost-off')&&!document.documentElement.classList.contains('bigwell')"))
        await pg.evaluate("prefs.ghost='outline';applyWellLook()")
        # 92 share
        await pg.evaluate("()=>{S.grid[ROWS-1][0]={ch:'A'};S.grid[ROWS-1][1]={ch:'B',g:1}}")
        snap = await pg.evaluate("wellSnapshot()")
        ck("92 share my well makes an emoji picture of the stack", "🟧" in snap and "⬜" in snap and "⬛" in snap, snap.split("\n")[-1])
        # 93 + 94 medals and insights
        ach = await pg.evaluate("achCheck();['perfect','links','spins','groups','twists'].every(id=>ACH.some(a=>a.id===id))")
        ck("93 new medals for clean sweeps, word links, spins, Groups and Twists", ach)
        await pg.evaluate(CLOSE); await pg.evaluate("openInsights()"); await pg.wait_for_timeout(100)
        ins = await pg.evaluate("(document.querySelector('#evh .ws-ins')||{}).textContent||''")
        ck("94 Insights shows your well stats", "word links" in ins and "best level" in ins, ins[:70])
        # 95 level on results + 100 replay
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(150)
        await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        await pg.evaluate("()=>{if(!S.linesCleared){S.linesCleared=6;showResult(S.phase!=='over',1,'')}}"); await pg.wait_for_timeout(300)
        ws = await pg.evaluate("(document.querySelector('#result .ws-sum')||{}).textContent||''")
        ck("95 results show the level you reached", "Reached LV" in ws, ws[:50])
        ck("92 a share button for your well is on results", await pg.evaluate("!!document.getElementById('wsShare')"))
        await pg.evaluate("document.getElementById('wsReplay').click()"); await pg.wait_for_timeout(2500)
        rp = await pg.evaluate("[S&&S.dropOnly,S&&S.phase,S&&!!S.L.archive]")
        ck("100 replay the drop skips straight to the well as practice", rp[0] and rp[1] in ("drop", "anim", "rush") and rp[2], rp)
        # 96 + 97 sky
        await pg.evaluate(CLOSE); await pg.evaluate("openSkyMap()"); await pg.wait_for_timeout(100)
        n = await pg.evaluate("document.querySelectorAll('#evh .sky-c').length")
        ck("96 your sky shows ten constellations", n == 10, n)
        lit = await pg.evaluate("""()=>{const c=CATEGORIES.find(x=>x.name==='Night Sky');c.puzzles.forEach((p,i)=>{if(i%10===0)store[p.id]=Object.assign(store[p.id]||{},{stars:2})});openSkyMap();
            const b=document.querySelector('#evh [data-sky="0"]');b.click();return [b.classList.contains('lit'),document.querySelectorAll('#evh .sky-c.lit').length,document.getElementById('skyNote').textContent]}""")
        ck("96 finishing a theme lights its constellation", lit[0] and lit[1] == 1 and "Star Stuff" in lit[2], lit)
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Night Sky'))"); await pg.wait_for_timeout(150)
        await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        q0 = await pg.evaluate("QS.length")
        await pg.evaluate("document.getElementById('swSave').click()")
        sv = await pg.evaluate("[QS.length,QS.length?QS[QS.length-1].cat:'',document.getElementById('swSave').getAttribute('aria-pressed')]")
        ck("97 keep the word to carry on your quote shelf", sv[0] == q0 + 1 and sv[1] == "Night Sky" and sv[2] == "true", sv)
        ck("98 reflective results offer a breath", await pg.evaluate("!!document.getElementById('brOpen')&&!!document.getElementById('skyOpen')"))
        # 98 breath
        await pg.evaluate("document.getElementById('brOpen').click()"); await pg.wait_for_timeout(100)
        await pg.evaluate("document.getElementById('brGo').click()"); await pg.wait_for_timeout(100)
        br = await pg.evaluate("[document.getElementById('brCue').textContent,document.getElementById('brRing').className]")
        ck("98 take a breath guides you in", "Breathe in" in br[0] and "in" in br[1], br)
        await pg.wait_for_timeout(4200)
        ck("98 then hold", "Hold" in await pg.evaluate("document.getElementById('brCue').textContent"))
        await pg.evaluate("document.getElementById('evDone').click()")
        # drawer items
        await pg.evaluate(CLOSE)
        ck("Menu has Your sky and Take a breath", await pg.evaluate("!!document.querySelector('#drawer [data-act=sky]')&&!!document.querySelector('#drawer [data-act=breath]')"))
        await pg.evaluate("document.querySelector('#drawer [data-act=breath]').click()"); await pg.wait_for_timeout(100)
        ck("Menu › Take a breath opens", await pg.evaluate("!!document.getElementById('brGo')"))
        await pg.evaluate(CLOSE)
        # 99 settings search
        await pg.evaluate("renderPaceInfo();document.getElementById('settings').hidden=false"); await pg.wait_for_timeout(100)
        ss = await pg.evaluate("""()=>{const q=document.getElementById('setQ');q.value='landing';q.dispatchEvent(new Event('input'));const st=document.getElementById('settings');
            const vis=[...st.querySelectorAll('.setrow,.setgroup')].filter(r=>!r.classList.contains('set-hide')).length;q.value='zzqx';q.dispatchEvent(new Event('input'));const none=!document.getElementById('setNone').hidden;
            q.value='';q.dispatchEvent(new Event('input'));const all=[...st.querySelectorAll('.set-hide')].length;return [vis,none,all,!!document.getElementById('setBigWell'),!!document.getElementById('ghSeg')]}""")
        ck("99 settings search filters rows", ss[0] >= 1 and ss[1] and ss[2] == 0, ss)
        ck("90/91 settings have the new switches", ss[3] and ss[4])
        sw = await pg.evaluate("()=>{const b=document.getElementById('setBigWell');b.click();const on=document.documentElement.classList.contains('bigwell')&&prefs.bigWell;b.click();return on&&!prefs.bigWell}")
        ck("90 bigger well letters switch works both ways", sw)
        await pg.evaluate(CLOSE)
        # what's new + labels
        wn = await pg.evaluate("async()=>{stats.seen23=0;maybeWhatsNew();await new Promise(r=>setTimeout(r,50));const t=document.getElementById('evh').textContent;return [t.includes('Your sky'),t.includes('Take a breath'),document.querySelectorAll('#evh > .panel.wn').length,!!stats.seen23]}")
        ck("What's New leads with this update (4 panels, older ones folded)", wn[0] and wn[1] and wn[2] == 4 and wn[3], wn)
        ck("score breakdown names the new points", await pg.evaluate("PTS_LABEL.link==='Word links'&&PTS_LABEL.spin==='Spin clears'&&PTS_LABEL.match==='Letter matches'"))
        ck("no page errors", not errs, errs[:3])
        await ctx.close(); await b.close()
    print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)

asyncio.run(main())
