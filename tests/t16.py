"""Profile redesign + phases 103-122 (20 Nov 2026). Run after scripts/build_index.py."""
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
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;S=null;showMenu()}"
TO_DROP = "async()=>{for(let i=0;i<20&&S.phase==='cross';i++){const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}await new Promise(r=>setTimeout(r,50));return S.phase}"
PROFILE = "()=>{goPage('Profile');renderProfile()}"

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 393, "height": 852}, has_touch=True); pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time='2026-11-20T09:30:00')
        await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(SETUP); await pg.wait_for_timeout(300)
        # play two Sports games so there's history
        for _ in range(2):
            await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Sports'))"); await pg.wait_for_timeout(100)
            await pg.evaluate(PLAY); await pg.wait_for_timeout(700)
        rl = await pg.evaluate("(document.querySelector('#result .rx-line')||{}).textContent||''")
        ck("111 results compare with your last try at the puzzle", "last try" in rl, rl[:80])
        ck("112 results show the crossword time", "Crossword in" in rl, rl[:80])
        ck("110 the longest word is remembered", await pg.evaluate("!!stats.longW&&stats.longW.w.length>=3"), await pg.evaluate("stats.longW&&stats.longW.w"))
        ck("121 first day played is stored", await pg.evaluate("/^\\d{4}-\\d\\d-\\d\\d$/.test(stats.since||'')"))
        await pg.evaluate(CLOSE); await pg.evaluate(PROFILE); await pg.wait_for_timeout(200)
        # redesign
        pr = await pg.evaluate("""()=>{const el=document.getElementById('profile');return {hud:el.classList.contains('hud'),pp:el.classList.contains('pp'),hudText:/TELEMETRY|CALLSIGN|MISSION LOG|PLAYER SYSTEMS/.test(el.textContent),
            tiles:[...el.querySelectorAll('.pp-name b')].map(b=>b.textContent).join(''),big:el.querySelectorAll('.pp-big .pp-tile').length,links:el.querySelectorAll('.pp-links .pp-link').length,
            ids:['pfLook','pfRewards','pfAch','pfIns','pfRec','pfHist','pfSb','pfWeek','pfWb','pfEv','pfDu','nickForm','nickIn','scoreChart'].filter(id=>!document.getElementById(id))}}""")
        ck("profile is a player card, not a HUD dashboard", pr['pp'] and not pr['hud'] and not pr['hudText'], pr)
        ck("profile shows your name as letter tiles", pr['tiles'] == "OMARI", pr['tiles'])
        ck("profile keeps every destination and the name editor", pr['big'] == 3 and pr['links'] == 8 and pr['ids'] == [], pr['ids'])
        nm = await pg.evaluate("""async()=>{const f=document.getElementById('nickForm'),hid=f.hidden;document.getElementById('pfEdit').click();const shown=!f.hidden;
            document.getElementById('nickIn').value='Omari B';f.dispatchEvent(new Event('submit',{cancelable:true}));await new Promise(r=>setTimeout(r,50));return [hid,shown,stats.nick]}""")
        ck("the name editor opens from the pencil and saves", nm == [True, True, "Omari B"], nm)
        ck("profile works with a light theme too", await pg.evaluate("(()=>{document.documentElement.classList.add('light');const c=getComputedStyle(document.querySelector('.pp-sec')).backgroundColor;document.documentElement.classList.remove('light');return c!=='rgba(0, 0, 0, 0)'})()"))
        # 103 106 107 121
        hero = await pg.evaluate("""()=>{const h=document.querySelector('.pp-hero');return [h.querySelectorAll('.pp-week span').length,h.querySelectorAll('.pp-week span.on').length,!!document.getElementById('pfCard'),(h.querySelector('.pp-foot')||{}).textContent||'']}""")
        ck("103 the hero shows the last 7 days you played", hero[0] == 7 and hero[1] >= 1, hero[:2])
        ck("107 share my card from the profile", hero[2])
        ck("121 playing since", "Playing since" in hero[3], hero[3][:40])
        ck("106 name tiles drop in once", await pg.evaluate("ppIntroDone===true"))
        # 104
        fv = await pg.evaluate("[(document.querySelector('.pp-fav')||{}).textContent||'',!!document.getElementById('pfFav')]")
        ck("104 your home category with a Play button", "Sports" in fv[0] and fv[1], fv[0][:60])
        await pg.evaluate("document.getElementById('pfFav').click()"); await pg.wait_for_timeout(150)
        ck("104 Play starts a puzzle from it", await pg.evaluate("!!S&&S.L.cat==='Sports'"))
        await pg.evaluate(CLOSE); await pg.evaluate(PROFILE); await pg.wait_for_timeout(100)
        # 108 122
        ms = await pg.evaluate("[...document.querySelectorAll('.pp-ms .pp-m')].map(m=>m.textContent)")
        ck("108 up next shows the next level, streak and stars", len(ms) >= 3 and "Level" in ms[0] and any("streak" in m for m in ms) and any("stars" in m for m in ms), ms)
        ck("122 and the medal you're closest to", await pg.evaluate("!!document.getElementById('pfMedal')"), ms[-1] if ms else "")
        # 105
        await pg.evaluate("document.querySelector('button.pp-cat').click()"); await pg.wait_for_timeout(150)
        ck("105 tapping a category opens its details", await pg.evaluate("!document.getElementById('evh').hidden"))
        await pg.evaluate(CLOSE); await pg.evaluate(PROFILE); await pg.wait_for_timeout(100)
        # 109
        wn = await pg.evaluate("()=>{const b=document.querySelector('button.pp-word');if(!b)return '';b.click();return document.getElementById('ppWordNote').textContent}")
        ck("109 tapping a saved word shows its clue", ":" in wn and len(wn) > 5, wn[:50])
        # 119
        bt = await pg.evaluate("""()=>{const base=new Date('2026-11-20T09:00:00').getTime();for(let i=0;i<8;i++)stats.games.push({t:base-i*864e5+(i%2?10*36e5:0),id:'x'+i,cat:'Music',name:'X',score:i%2?3000:500,win:true,stars:1});return bestTimeLine()}""")
        ck("119 the profile tells you when you play best", "evenings" in bt or "afternoons" in bt, bt[:60])
        # 113
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(100)
        await pg.evaluate("()=>{S.phase='rush';S.rush={state:'on',left:4,limit:60,mode:'clue',word:'NOTE',input:'',clue:'x'};renderRush()}"); await pg.wait_for_timeout(400)
        ck("113 the last five seconds of a rush pulse", await pg.evaluate("document.getElementById('rush').classList.contains('hurry')"))
        await pg.evaluate("S.rush.left=30"); await pg.wait_for_timeout(400)
        ck("113 not before then", await pg.evaluate("!document.getElementById('rush').classList.contains('hurry')"))
        await pg.evaluate("S.rush=null;S.phase='cross';renderRush()")
        # 118
        cw = await pg.evaluate("""async()=>{renderAll();const w=curWord();const ks=w.cells.filter(k=>!S.cw.cells.get(k).lock);ks.forEach(k=>S.cw.cells.get(k).val='Q');renderAll();
            const bk=document.querySelector('#pad [data-a="bk"]');bk.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));await new Promise(r=>setTimeout(r,650));bk.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
            return [ks.every(k=>!S.cw.cells.get(k).val),bk.getAttribute('aria-label')]}""")
        ck("118 hold delete to clear the whole word", cw[0] and "Hold" in (cw[1] or ""), cw)
        # 116 120
        ph = await pg.evaluate(TO_DROP)
        lv = await pg.evaluate("()=>{S.linesCleared=3;lvBadge();const a=document.getElementById('wellLv').textContent;S.linesCleared=5;lvBadge();return [a,document.getElementById('wellLv').classList.contains('lvup'),document.getElementById('wellLv').textContent]}")
        ck("120 the level badge shows rows to the next level", ph == "drop" and "2 rows to LV 2" in lv[0], lv)
        ck("116 leveling up gives the badge a bump", lv[1] and lv[2].startswith("LV 2"), lv)
        # 114 115
        await pg.evaluate(CLOSE); await pg.evaluate("goPage('Play');renderDailyCard()"); await pg.wait_for_timeout(100)
        hl = await pg.evaluate("(document.querySelector('#dailyCard .hello')||{}).textContent||''")
        ck("115 the home screen says hello by time of day", hl.startswith("Good morning") and "Omari" in hl, hl)
        await pg.evaluate("playDaily(todayKey())"); await pg.wait_for_timeout(200); await pg.evaluate(PLAY); await pg.wait_for_timeout(700)
        await pg.evaluate(CLOSE); await pg.evaluate("goPage('Play');renderDailyCard()"); await pg.wait_for_timeout(100)
        dn = await pg.evaluate("(document.getElementById('dcNext')||{}).textContent||''")
        ck("114 a finished Daily counts down to the next one", "Next Daily in" in dn and "h" in dn, dn)
        # 117
        await pg.evaluate("renderPaceInfo();document.getElementById('settings').hidden=false"); await pg.wait_for_timeout(100)
        await pg.evaluate("document.getElementById('setTips').click()")
        ck("117 Settings › Show tips again resets the tips", await pg.evaluate("Object.keys(stats.tips||{}).length===0"))
        await pg.evaluate(CLOSE)
        wn = await pg.evaluate("async()=>{stats.seen24=0;stats.seen25=0;stats.seen26=0;stats.seen27=0;stats.seen28=0;stats.seen29=0;maybeWhatsNew();await new Promise(r=>setTimeout(r,50));const t=document.getElementById('evh').textContent;return [t.includes('A new profile'),document.querySelectorAll('#evh > .panel.wn').length,!!stats.seen24]}")
        ck("What's New leads with this update", wn == [True, 4, True], wn)
        ck("no page errors", not errs, errs[:3])
        await ctx.close(); await b.close()
    print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)

asyncio.run(main())
