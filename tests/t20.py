"""Phases 208-232 (21 Nov 2026). Run after scripts/build_index.py."""
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
 for(let i=19;i<=30;i++)stats['seen'+i]=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,drag:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;const p=document.getElementById('pauseOv');if(p)p.hidden=true;const r=document.getElementById('review');if(r)r.hidden=true;S=null;showMenu()}"
TO_DROP = "async()=>{for(let i=0;i<20&&S.phase==='cross';i++){const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}await new Promise(r=>setTimeout(r,50));return S.phase}"
BANK = "()=>{stats.bank=stats.bank||{};const W=['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GOLF','HOTEL'];W.forEach((w,i)=>stats.bank[w]={c:'Clue for '+w,t:Date.now()-i*1000,box:i<3?0:i<6?2:5,k:'Test'})}"

def no_duplicate_functions():
    import re, collections
    src = (ROOT / 'web' / 'crossfall.html').read_text()
    c = collections.Counter(re.findall(r'^function ([A-Za-z0-9_]+)\(', src, re.M))
    return [k for k, v in c.items() if v > 1]

async def main():
    dup = no_duplicate_functions()
    ck("no function is declared twice (a later one would silently replace the first)", not dup, dup)
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # Saturday
        ctx = await b.new_context(viewport={"width": 393, "height": 852}, has_touch=True); pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time='2026-11-21T10:00:00')
        await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(SETUP); await pg.wait_for_timeout(300)
        await pg.evaluate(BANK)
        # 208-211 learn
        await pg.evaluate("goPage('Learn');renderLearn()"); await pg.wait_for_timeout(100)
        st = await pg.evaluate("(document.querySelector('#learn .ln-study')||{}).textContent||''")
        ck("208 Learn shows today's study with words to review", "to review" in st and "mastered" in st, st[:80])
        ck("211 mastered words count toward 100", "2" in st and "more to master 100" in st, st[-90:])
        await pg.evaluate("document.getElementById('lsGo').click()"); await pg.wait_for_timeout(100)
        ck("208 Start today's review opens the due words", await pg.evaluate("!document.getElementById('review').hidden&&rv.list.every(([w,b])=>(b.box||0)===0||b.sl||b.rt)"))
        await pg.evaluate("()=>{rv.i=rv.list.length;renderReview()}")
        ck("209 finishing a review counts toward your review streak", await pg.evaluate("revStreak()===1"))
        await pg.evaluate(CLOSE); await pg.evaluate("()=>{stats.tough={GOLF:2};goPage('Learn');renderLearn();document.getElementById('lsTough').click()}"); await pg.wait_for_timeout(100)
        tw = await pg.evaluate("rv.list.map(x=>x[0])")
        ck("210 tricky words review includes trouble words", "GOLF" in tw, tw)
        await pg.evaluate(CLOSE); await pg.evaluate("goPage('Learn');renderLearn()")
        ln = await pg.evaluate("[!!document.getElementById('lnUn'),!!document.getElementById('lnAlbum'),!!document.getElementById('lnSky'),document.querySelectorAll('#learn .abc span').length]")
        ck("229/230 Learn has word games, letter of the week and collections", ln[0] and ln[1] and ln[2] and ln[3] == 26, ln)
        fo = await pg.evaluate("()=>{const h=[...document.querySelectorAll('#learn .panel>h3')].find(h=>h.textContent.startsWith('Collections'));h.querySelector('.pp-fold').click();renderLearn();const h2=[...document.querySelectorAll('#learn .panel>h3')].find(h=>h.textContent.startsWith('Collections'));return h2.parentElement.classList.contains('folded')}")
        ck("231 Learn sections fold and stay folded", fo)
        # 212-214 unscramble
        await pg.evaluate("document.getElementById('lnUn').click()"); await pg.wait_for_timeout(100)
        u = await pg.evaluate("()=>{const w=un.list[0][0];const t=[...document.querySelectorAll('.un-tiles b, .un-tiles .un-t')].map(b=>b.textContent).join('');return [w,t,[...w].sort().join('')===[...t].sort().join(''),t!==w]}")
        ck("212 Unscramble shows a bank word's letters mixed up", u[2] and u[3], u)
        await pg.evaluate("document.getElementById('unIn').value='ZZZZ';document.getElementById('unForm').dispatchEvent(new Event('submit',{cancelable:true}))")
        ck("212 a wrong answer says try again", "Try again" in await pg.evaluate("document.getElementById('unMsg').textContent"))
        await pg.evaluate("document.getElementById('unHint').click()")
        ck("213 the hint shows the first letter", f"Starts with {u[0][0]}" in await pg.evaluate("document.querySelector('#evh .rvcard').textContent"))
        await pg.evaluate("""()=>{for(let i=0;i<5;i++){const w=un.list[un.i][0];document.getElementById('unIn').value=w;document.getElementById('unForm').dispatchEvent(new Event('submit',{cancelable:true}))}}""")
        ur = await pg.evaluate("[document.querySelector('#evh .pts').textContent,stats.unsc,document.getElementById('evh').textContent.includes('new best')]")
        ck("214 five right gives 5/5, a best score and XP", ur[0] == "5/5" and ur[1] == 450 and ur[2], ur)
        await pg.evaluate(CLOSE)
        ck("232 Unscramble is in the Menu", await pg.evaluate("!!document.querySelector('#drawer [data-act=unsc]')"))
        # play games for later checks
        for c in ["Sports", "Music"]:
            await pg.evaluate(CLOSE); await pg.evaluate(f"startLevel(LEVELS.findIndex(l=>l.cat==='{c}'))"); await pg.wait_for_timeout(100)
            await pg.evaluate(PLAY); await pg.wait_for_timeout(800)
        # 215 216
        await pg.evaluate(CLOSE); await pg.evaluate("goPage('Ranks');renderRanks()"); await pg.wait_for_timeout(100)
        mb = await pg.evaluate("[document.querySelectorAll('#myBests .mb-list li').length,(document.getElementById('myBests')||{}).textContent||'']")
        ck("215 Ranks shows your best games", mb[0] >= 2, mb[0])
        ck("216 and your best in each category", "Best in each category" in mb[1] and "Sports" in mb[1] and "Music" in mb[1])
        # 217 218 weekend
        await pg.evaluate(CLOSE); await pg.evaluate("goPage('Play');renderDailyCard()"); await pg.wait_for_timeout(100)
        wk = await pg.evaluate("[(document.querySelector('.ht-wknd')||{}).textContent||'',document.querySelectorAll('[data-wk]').length]")
        ck("217 Saturday shows the weekend challenge with three categories", "Weekend challenge" in wk[0] and wk[1] == 3, wk)
        done = await pg.evaluate("""async()=>{const P=wkndPicks();for(const p of P){stats.games.unshift({t:Date.now(),id:p.id,cat:p.cat,name:p.name,score:100,win:true,stars:1})}wkndCheck();return [wkndDone().every(Boolean),stats.wkndPaid===wkndKey()]}""")
        ck("218 winning all three pays out once", done == [True, True], done)
        x0 = await pg.evaluate("stats.xpBonus"); await pg.evaluate("wkndCheck()")
        ck("218 not twice", await pg.evaluate(f"stats.xpBonus==={x0}"))
        # 219 220
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.evaluate(TO_DROP)
        hv = await pg.evaluate("""async()=>{const h=[],a=[];const oh=hap,oa=announce;hap=k=>h.push(k);announce=t=>a.push(t);S.freezeUntil=0;S.grid=S.grid.map(r=>r.map(()=>null));
            for(const r of [ROWS-1,ROWS-2,ROWS-3])for(let c=1;c<COLS;c++)S.grid[r][c]={ch:'Q'};S.phase='drop';S.active={cells:[{dr:0,dc:0,ch:'A'},{dr:1,dc:0,ch:'B'},{dr:2,dc:0,ch:'C'}],r:0,c:0};hardDrop();
            await new Promise(r=>setTimeout(r,500));hap=oh;announce=oa;return [h,a]}""")
        ck("219 three or more rows give a heavy buzz", "heavy" in hv[0], hv[0])
        ck("220 VoiceOver hears rows cleared and the score", any("rows cleared" in x for x in hv[1]), [x for x in hv[1] if "row" in x][:1])
        # 221 222 228 profile
        await pg.evaluate(CLOSE); await pg.evaluate("goPage('Profile');renderProfile()"); await pg.wait_for_timeout(150)
        pf = await pg.evaluate("[[...document.querySelectorAll('#profile .pp-h')].map(h=>h.textContent),(document.querySelector('.wk-cmp')||{}).textContent||'',document.querySelectorAll('.am-m').length,(document.getElementById('pfMedals')||{}).textContent||'']")
        ck("221 this week vs last week", "This week vs last week" in pf[0] and "Puzzles" in pf[1], pf[1][:60])
        ck("222 the three medals you're closest to", "Almost there" in pf[0] and pf[2] == 3, pf[2])
        ck("228 a medal count on your card", "medals" in pf[3], pf[3])
        # 223 224
        await pg.evaluate(CLOSE); await pg.evaluate("openDrawer()"); await pg.wait_for_timeout(100)
        ck("224 the Menu shows a fun fact about your play", len(await pg.evaluate("(document.getElementById('drFact')||{}).textContent||''")) > 10)
        await pg.evaluate("closeDrawer()")
        await pg.evaluate("renderPaceInfo();document.getElementById('settings').hidden=false"); await pg.wait_for_timeout(50)
        await pg.evaluate("document.querySelector('[data-sp=Learn]').click()")
        ck("223 choose the page the app opens on", await pg.evaluate("prefs.startPage==='Learn'"))
        await pg.evaluate(CLOSE)
        # 225 226 227
        await pg.evaluate("openSkyMap()"); await pg.wait_for_timeout(100)
        ck("225 Your sky names the next constellation to light", "Next to light" in await pg.evaluate("(document.getElementById('skyNext')||{}).textContent||''"))
        await pg.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))")
        ck("227 Escape closes the sheet", await pg.evaluate("document.getElementById('evh').hidden"))
        await pg.evaluate("()=>{stats.breaths=1;saveStats();openBreath()}"); await pg.wait_for_timeout(100)
        ck("226 Take a breath shows your days this week", "this week" in await pg.evaluate("(document.querySelector('.br-week')||{}).textContent||''"))
        await pg.evaluate(CLOSE)
        wn = await pg.evaluate("async()=>{stats.seen28=0;stats.seen29=0;stats.seen30=0;maybeWhatsNew();await new Promise(r=>setTimeout(r,50));const t=document.getElementById('evh').textContent;return [t.includes('Unscramble'),document.querySelectorAll('#evh > .panel.wn').length,!!stats.seen28]}")
        ck("What's New leads with this update", wn == [True, 4, True], wn)
        ck("no page errors", not errs, errs[:3])
        await ctx.close()
        # weekday: no weekend tile; start page applies on launch
        ctx = await b.new_context(viewport={"width": 393, "height": 852}); pg = await ctx.new_page(); errs2 = []
        pg.on("pageerror", lambda e: errs2.append(str(e))); await pg.clock.install(time='2026-11-24T10:00:00')
        await pg.add_init_script("try{localStorage.setItem('crossfall.prefs',JSON.stringify({startPage:'Profile'}))}catch(e){}")
        await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(SETUP); await pg.wait_for_timeout(200)
        ck("217 no weekend challenge on a Tuesday", await pg.evaluate("wkndHTML()===''"))
        ck("no page errors (weekday)", not errs2, errs2[:3])
        await ctx.close(); await b.close()
    print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)

asyncio.run(main())
