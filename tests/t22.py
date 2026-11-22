"""Phases 248-267 (21 Nov 2026, evening). Run after scripts/build_index.py."""
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
 for(let i=19;i<=30;i++)stats['seen'+i]=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,drag:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;const p=document.getElementById('pauseOv');if(p)p.hidden=true;const r=document.getElementById('review');if(r)r.hidden=true;un=null;S=null;showMenu()}"
BANK = "()=>{stats.bank=stats.bank||{};const W=['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GOLF','HOTEL','INDIA','JULIET'];W.forEach((w,i)=>stats.bank[w]={c:'Clue for '+w,t:Date.now()-i*1000,box:i<3?0:2,k:'Test'})}"

async def main():
    src = (ROOT / 'web' / 'crossfall.html').read_text()
    dup = [k for k, v in collections.Counter(re.findall(r'^function ([A-Za-z0-9_]+)\(', src, re.M)).items() if v > 1]
    ck("no function is declared twice", not dup, dup)
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 393, "height": 852}, has_touch=True); pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time='2026-11-22T11:00:00')
        await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(SETUP); await pg.wait_for_timeout(300)
        await pg.evaluate(BANK)
        # 248 249
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(100)
        c0 = await pg.evaluate("(()=>{renderAll();return document.getElementById('wordsChip').textContent})()")
        ck("249 the clue bar counts words solved", re.match(r"0/\d+", c0) is not None, c0)
        c1 = await pg.evaluate("""()=>{const ws=S.cw.words;ws.slice(0,ws.length-1).forEach(w=>w.solved=true);renderAll();const t=document.getElementById('wordsChip').textContent;ws.forEach(w=>w.solved=false);return t}""")
        ck("248 and calls out the last word", c1 == "Last word!", c1)
        # 250 251 265 perfect + new words
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Sports'))"); await pg.wait_for_timeout(100)
        await pg.evaluate(PLAY); await pg.wait_for_timeout(800)
        pl = await pg.evaluate("[(document.querySelector('#result .pf-line')||{}).textContent||'',stats.games[0].stars,stats.perfectN||0]")
        ck("265 results show new words added to your bank", "new word" in pl[0], pl[0][:80])
        ck("250 a clean three-star game is a Perfect puzzle", (pl[1] >= 3) == ("Perfect puzzle" in pl[0]) and (pl[1] < 3 or pl[2] == 1), pl)
        await pg.evaluate(CLOSE); await pg.evaluate("()=>{const i=LEVELS.findIndex(l=>l.cat==='Sports');stats.games.forEach(g=>{if(g.id===LEVELS[i].id)g.score=5});startLevel(i)}"); await pg.wait_for_timeout(100)
        await pg.evaluate(PLAY); await pg.wait_for_timeout(800)
        ck("251 a new best on a puzzle is called out", "New best on this puzzle" in await pg.evaluate("(document.querySelector('#result .pf-line')||{}).textContent||''"))
        # 252 253 your day
        await pg.evaluate(CLOSE); await pg.evaluate("goPage('Play');renderDailyCard()"); await pg.wait_for_timeout(100)
        dy = await pg.evaluate("(document.querySelector('#dailyCard .ht-day')||{}).textContent||''")
        ck("252 Your day lists the Daily, Unscramble and your goal", "Today's Daily" in dy and "Daily Unscramble" in dy and "puzzle" in dy, dy[:90])
        await pg.evaluate("()=>{stats.goal=1;stats.daily=stats.daily||{};stats.daily[todayKey()]={score:100,stars:2};stats.unDaily={last:todayKey(),n:1,score:400,best:1};dayCheck()}")
        ck("253 finishing all three pays out once", await pg.evaluate("stats.dayDone===todayKey()&&stats.dayDoneN===1"))
        await pg.evaluate("dayCheck()")
        ck("253 not twice", await pg.evaluate("stats.dayDoneN===1"))
        # 262 sunday, 264 missed yesterday
        await pg.evaluate("renderDailyCard()")
        sn = await pg.evaluate("[(document.querySelector('#dailyCard .ht-sun')||{}).textContent||'',!!document.getElementById('htMissY')]")
        ck("262 Sunday shows your week so far with share", "Your week so far" in sn[0] and "Share my week" in sn[0], sn[0][:60])
        ck("264 a missed Daily from yesterday can be played", sn[1])
        await pg.evaluate("document.getElementById('htMissY').click()"); await pg.wait_for_timeout(150)
        ck("264 it opens yesterday's Daily as practice", await pg.evaluate("!!S&&S.L.daily&&!!S.L.archive"))
        await pg.evaluate(CLOSE)
        # 256 257 tap tiles
        await pg.evaluate("openUnscramble()"); await pg.wait_for_timeout(100)
        tp = await pg.evaluate("""async()=>{const w=un.list[0][0];const tiles=[...document.querySelectorAll('.un-tiles .un-t')];const used=new Set();for(const ch of w){const t=tiles.find((b,i)=>b.textContent===ch&&!used.has(i));used.add(tiles.indexOf(t));t.click()}
            await new Promise(r=>setTimeout(r,50));return [un.got,un.i]}""")
        ck("256 tap the tiles to spell the word", tp == [1, 1], tp)
        mx = await pg.evaluate("()=>{const before=[...document.querySelectorAll('.un-t')].map(b=>b.textContent).sort().join('');document.getElementById('unMix').click();const after=[...document.querySelectorAll('.un-t')].map(b=>b.textContent).sort().join('');return before===after&&document.querySelectorAll('.un-t').length>0}")
        ck("257 shuffle keeps the same letters", mx)
        cl = await pg.evaluate("()=>{document.querySelector('.un-t').click();const a=document.getElementById('unIn').value.length;document.getElementById('unBk').click();return [a,document.getElementById('unIn').value,document.querySelectorAll('.un-t.used').length]}")
        ck("256 clear empties your answer", cl == [1, "", 0], cl)
        await pg.evaluate(CLOSE)
        # 258 find chips
        await pg.evaluate("openFind()"); await pg.wait_for_timeout(100)
        fc = await pg.evaluate("()=>{document.querySelector('#fpCats [data-fc=\"Music\"]').click();return [...document.querySelectorAll('#fpList .fp-row .sub')].map(x=>x.textContent)}")
        ck("258 category chips in Find", len(fc) > 0 and all(x.startswith("Music") for x in fc), fc[:2])
        await pg.evaluate(CLOSE)
        # 259 settings keywords
        await pg.evaluate("renderPaceInfo();document.getElementById('settings').hidden=false"); await pg.wait_for_timeout(50)
        kw = await pg.evaluate("()=>{const q=document.getElementById('setQ');q.value='vibrate';q.dispatchEvent(new Event('input'));const v=[...document.querySelectorAll('#settings .setrow,#settings .setgroup')].filter(r=>!r.classList.contains('set-hide')).map(r=>r.id);q.value='';q.dispatchEvent(new Event('input'));return v}")
        ck("259 settings search understands 'vibrate'", "setTypeHap" in kw, kw)
        await pg.evaluate(CLOSE)
        # 261 notes
        await pg.evaluate("()=>{stats.notes={[LEVELS[0].id]:'Tricky one'}}")
        await pg.evaluate("document.querySelector('#drawer [data-act=notes]').click()"); await pg.wait_for_timeout(100)
        nn = await pg.evaluate("(document.getElementById('evh').textContent)")
        ck("261 My notes lists your notes", "Tricky one" in nn)
        await pg.evaluate("document.querySelector('[data-nd]').click()")
        ck("261 a note can be deleted", await pg.evaluate("Object.keys(stats.notes).length===0"))
        await pg.evaluate(CLOSE)
        # 263 sticker dates
        await pg.evaluate("()=>{stickerCheck(true);openAlbum()}"); await pg.wait_for_timeout(100)
        sd = await pg.evaluate("()=>{const b=document.querySelector('#evh button.stk.on')||document.querySelector('#evh button.stk');b.click();return document.getElementById('stkNote').textContent}")
        ck("263 tapping a sticker says when or how", "collected" in sd or "win" in sd or "earn" in sd or "play every" in sd, sd)
        await pg.evaluate(CLOSE)
        # profile 254 255
        await pg.evaluate("()=>{stats.notes={[LEVELS[0].id]:'x'};goPage('Profile');renderProfile()}"); await pg.wait_for_timeout(150)
        pf = await pg.evaluate("[(document.querySelector('.pr-row')||{}).textContent||'',!!document.getElementById('pfNotes')]")
        ck("254/255 perfect puzzles and best month in records", "perfect puzzles" in pf[0] and "best month" in pf[0], pf[0][-80:])
        ck("261 My notes from the profile", pf[1])
        await pg.evaluate(CLOSE)
        # 266 267
        ck("266/267 Perfectionist and Unscrambler medals", await pg.evaluate("achCheck();['perfect2','unscr'].every(id=>ACH.some(a=>a.id===id))"))
        wn = await pg.evaluate("async()=>{stats.seen30=0;maybeWhatsNew();await new Promise(r=>setTimeout(r,50));const t=document.getElementById('evh').textContent;return [t.includes('Your day'),document.querySelectorAll('#evh > .panel.wn').length,!!stats.seen30]}")
        ck("What's New leads with this update", wn == [True, 4, True], wn)
        ck("no page errors", not errs, errs[:3])
        await ctx.close(); await b.close()
    print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)

asyncio.run(main())
