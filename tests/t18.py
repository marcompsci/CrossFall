"""Phases 148-177 (20 Nov 2026, night). Run after scripts/build_index.py."""
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
 stats.seen19=1;stats.seen20=1;stats.seen21=1;stats.seen22=1;stats.seen23=1;stats.seen24=1;stats.seen25=1;stats.seen26=1;stats.seen27=1;stats.seen28=1;stats.seen29=1;stats.seen30=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,drag:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;const p=document.getElementById('pauseOv');if(p)p.hidden=true;S=null;showMenu()}"
TO_DROP = "async()=>{for(let i=0;i<20&&S.phase==='cross';i++){const w=S.cw.words.find(w=>!w.solved);selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}await new Promise(r=>setTimeout(r,50));return S.phase}"
PROFILE = "()=>{goPage('Profile');renderProfile()}"

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 393, "height": 852}, has_touch=True); pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time='2026-11-20T20:00:00')
        await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(SETUP); await pg.wait_for_timeout(300)
        # 153-155 letter of the week
        L = await pg.evaluate("lotw()")
        ck("153 there is a letter of the week, the same all week", len(L) == 1 and await pg.evaluate("(()=>{const a=lotw();return a})()") == L, L)
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Music'))"); await pg.wait_for_timeout(100)
        chip = await pg.evaluate("(()=>{renderAll();const c=document.getElementById('lotwChip');return c&&!c.hidden?c.textContent:''})()")
        ck("155 the letter shows in the clue bar", chip == L, chip)
        lb = await pg.evaluate(f"""()=>{{const L='{L}';const w=S.cw.words.find(w=>w.ans.includes(L))||S.cw.words[0];const n=[...w.ans].filter(c=>c===L).length;selectWord(w);for(const k of w.cells){{const c=S.cw.cells.get(k);if(!c.lock){{S.sel.key=k;typeLetter(c.ans)}}}}
            return [n,S.pts.letter||0,((stats.abc||{{}})[new Date().getFullYear()]||'').includes(L)]}}""")
        ck("154 each of the week's letter in a solved word is +10", lb[0] == 0 or (lb[1] == 10 * lb[0]), lb)
        ck("156 and the letter is collected for the year", lb[0] == 0 or lb[2], lb)
        # 157 type haptics
        hp = await pg.evaluate("""()=>{let n=0;const o=hap;hap=k=>{if(k==='light')n++};prefs.typeHap=true;S.phase='cross';const w=S.cw.words.find(w=>!w.solved);selectWord(w);const k=w.cells.find(k=>!S.cw.cells.get(k).lock);S.sel.key=k;typeLetter('Q');hap=o;prefs.typeHap=false;backspace();return n}""")
        ck("157 a light tap when you type, if turned on", hp >= 1, hp)
        # 148 ghost letters
        await pg.evaluate("S.phase='cross';S.queue=[];S.active=null")
        ph = await pg.evaluate(TO_DROP)
        gl = await pg.evaluate("()=>{S.freezeUntil=performance.now()+1e6;S.grid=S.grid.map(r=>r.map(()=>null));S.active={cells:[{dr:0,dc:0,ch:'K'},{dr:0,dc:1,ch:'Y'}],r:0,c:1};renderWell();return [...document.querySelectorAll('#well .wc.ghost[data-gl]')].map(d=>d.dataset.gl).join('')}")
        ck("148 the landing guide shows each letter", ph == "drop" and gl == "KY", gl)
        await pg.evaluate("prefs.ghostLetters=false;renderWell()")
        ck("148 and can be turned off", await pg.evaluate("document.querySelectorAll('#well .wc[data-gl]').length===0"))
        await pg.evaluate("prefs.ghostLetters=true")
        # 174-176 pause card
        await pg.evaluate("pauseWell()")
        pz = await pg.evaluate("[(document.querySelector('.pz-stats')||{}).textContent||'',!!document.getElementById('pzSound'),!!document.getElementById('pzHap'),!!document.getElementById('pzRestart')]")
        ck("174 the pause card shows rows, level and pieces left", "rows" in pz[0] and "LV" in pz[0] and "pieces left" in pz[0], pz[0])
        h0 = await pg.evaluate("prefs.haptics")
        await pg.evaluate("document.getElementById('pzHap').click()")
        ck("176 sound and haptics switch from the pause card", pz[1] and pz[2] and await pg.evaluate(f"prefs.haptics==={str(not h0).lower()}"))
        await pg.evaluate("document.getElementById('pzHap').click()")
        rs = await pg.evaluate("()=>{const b=document.getElementById('pzRestart');const id=S.L.id;b.click();const first=!!S&&S.phase==='drop';b.click();return [first,S&&S.L.id===id,S&&S.phase]}")
        ck("175 restart needs two taps and starts the puzzle again", rs[0] and rs[1] and rs[2] == "cross", rs)
        # 159 158
        await pg.evaluate("prefs.hcWell=true;prefs.bigClue=true;applyLook148()")
        ck("159/158 high-contrast well and bigger clues", await pg.evaluate("document.documentElement.classList.contains('hcwell')&&document.documentElement.classList.contains('bigclue')"))
        await pg.evaluate("prefs.hcWell=false;prefs.bigClue=false;applyLook148()")
        # finish a game: stickers, words per minute
        await pg.evaluate(CLOSE); await pg.evaluate("startLevel(LEVELS.findIndex(l=>l.cat==='Sports'))"); await pg.wait_for_timeout(100)
        await pg.evaluate("()=>{let t=0;const o=performance.now.bind(performance);S._wordStart=o()-20000}")
        await pg.evaluate(PLAY); await pg.wait_for_timeout(900)
        rw = await pg.evaluate("(document.querySelector('#result .rw-line')||{}).textContent||''")
        ck("163/164/165 results show words a minute, quickest and toughest word", "words a minute" in rw and "Quickest" in rw and "Toughest" in rw, rw[:90])
        await pg.evaluate("document.getElementById('rwStudy').click()")
        ck("165 Study it adds the toughest word to review", await pg.evaluate("(()=>{const w=document.getElementById('rwStudy').dataset.w;return stats.bank[w]&&stats.bank[w].box===0})()"))
        st = await pg.evaluate("[stickerCount(),!!(stats.stk||{})['Sports:0']]")
        ck("149/150 winning a puzzle earns the first-win sticker", st[0] >= 1 and st[1], st)
        ck("151 a new sticker is celebrated", await pg.evaluate("celeQ.some(c=>c.title==='New sticker')||!document.getElementById('cele').hidden"))
        # 161 time played
        await pg.wait_for_timeout(5300)
        ck("161 time played today is counted", await pg.evaluate("((stats.pt||{})[todayKey()]||0)>=0"))
        await pg.evaluate("()=>{stats.pt=stats.pt||{};stats.pt[todayKey()]=(stats.pt[todayKey()]||0)+25*60000}")
        # album
        await pg.evaluate(CLOSE); await pg.evaluate("openAlbum()"); await pg.wait_for_timeout(100)
        al = await pg.evaluate("[document.querySelectorAll('#evh .al-row').length,document.querySelectorAll('#evh .stk').length,document.querySelectorAll('#evh .stk.on').length]")
        ck("149 the album has four stickers for every category", al[0] == await pg.evaluate("CATEGORIES.length") and al[1] == al[0] * 4 and al[2] >= 1, al)
        ck("152 share my album", await pg.evaluate("!!document.getElementById('alShare')"))
        await pg.evaluate(CLOSE)
        ck("Menu has Sticker album", await pg.evaluate("!!document.querySelector('#drawer [data-act=album]')"))
        # profile
        await pg.evaluate(PROFILE); await pg.wait_for_timeout(150)
        pf = await pg.evaluate("""()=>{const t=[...document.querySelectorAll('#profile .pp-sec .pp-h')].map(h=>h.textContent);return {t,today:(document.querySelector('.pp-today')||{}).textContent||'',wt:document.querySelectorAll('.wt span').length,abc:document.querySelectorAll('.abc span').length,album:!!document.getElementById('pfAlbum')}}""")
        ck("177 a Today card on the profile", "puzzle" in pf['today'] and "played" in pf['today'], pf['today'])
        ck("162 time played over the week", pf['wt'] == 7)
        ck("152 sticker album on the profile", pf['album'] and any(x.startswith("Sticker album") for x in pf['t']), pf['t'])
        ck("156 the alphabet you've collected this year", pf['abc'] == 26)
        await pg.evaluate("()=>{stats.tough={};const w=Object.keys(stats.bank)[0];stats.tough[w]=2;renderProfile()}")
        ck("166 words that gave you trouble", await pg.evaluate("[...document.querySelectorAll('.pp-h')].some(h=>h.textContent.startsWith('Words that gave'))"))
        await pg.evaluate("document.getElementById('pfTough').click()"); await pg.wait_for_timeout(100)
        ck("167 Study these sends them to review", await pg.evaluate("(()=>{const w=Object.keys(stats.tough)[0];return stats.bank[w].box===0})()"))
        await pg.evaluate(CLOSE)
        # 170 daily days glow gold
        dg = await pg.evaluate("()=>{const o=dailyRecord;dailyRecord=k=>k===todayKey()?{score:1}:o(k);const h=weekDotsHTML();dailyRecord=o;return (h.match(/dly/g)||[]).length}")
        ck("170 days with a Daily glow gold in your week", dg == 1, dg)
        # 168 169 home
        await pg.evaluate("()=>{const t=Date.now()-20*864e5;stats.games.push({t,id:'old',cat:'Music',name:'Old',score:10,win:true,stars:1});stats.games=stats.games.filter(g=>g.cat!=='Music'||g.t<=t)}")
        await pg.evaluate("goPage('Play');renderDailyCard()"); await pg.wait_for_timeout(100)
        hm = await pg.evaluate("[(document.getElementById('htMiss')||{}).textContent||'',document.querySelectorAll('.ht-goal').length]")
        ck("169 a category you haven't played in a while", "Back to Music" in hm[0], hm[0][:60])
        await pg.evaluate("document.getElementById('htMiss').click()"); await pg.wait_for_timeout(100)
        ck("169 and it starts one", await pg.evaluate("!!S&&S.L.cat==='Music'"))
        await pg.evaluate(CLOSE)
        ng = await pg.evaluate("()=>{const o=levelOf;levelOf=()=>({lv:3,toNext:200,pct:90});const g=nextGoal();levelOf=o;return g&&g.t}")
        ck("168 your next goal on Play", ng and "200 XP to level 4" in ng, ng)
        # 171-173 medals
        ach = await pg.evaluate("achCheck();['collector','alphabet','calm'].every(id=>ACH.some(a=>a.id===id))")
        ck("171-173 medals for stickers, letters and calm", ach)
        # 160 nudge
        await pg.evaluate("()=>{breakNudge()}")
        ck("160 a gentle break reminder offers a breath", await pg.evaluate("!!document.querySelector('.nudge #ndBreath')"))
        await pg.evaluate("document.querySelector('.nudge .nd-x').click()")
        # settings
        await pg.evaluate("renderPaceInfo();document.getElementById('settings').hidden=false"); await pg.wait_for_timeout(50)
        ck("Settings has the new switches", await pg.evaluate("['setGhostL','setHcWell','setBigClue','setTypeHap','setLotw','setNudge'].every(id=>!!document.getElementById(id))"))
        await pg.evaluate("document.getElementById('setLotw').click()")
        ck("letter of the week can be turned off", await pg.evaluate("prefs.lotw===false"))
        await pg.evaluate(CLOSE)
        wn = await pg.evaluate("async()=>{stats.seen26=0;stats.seen27=0;stats.seen28=0;stats.seen29=0;stats.seen30=0;maybeWhatsNew();await new Promise(r=>setTimeout(r,50));const t=document.getElementById('evh').textContent;return [t.includes('Sticker album'),document.querySelectorAll('#evh > .panel.wn').length,!!stats.seen26]}")
        ck("What's New leads with this update", wn == [True, 4, True], wn)
        ck("no page errors", not errs, errs[:3])
        await ctx.close(); await b.close()
    print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)

asyncio.run(main())
