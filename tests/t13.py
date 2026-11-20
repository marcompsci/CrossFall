"""Phases 58-72 (19 Nov 2026). Run after scripts/build_index.py."""
from pathlib import Path
import asyncio, sys
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from smoke_test import MOCK, PLAY
SRC = (ROOT / 'Crossfall' / 'index.html').read_text().replace('<head>', '<head>' + MOCK, 1)
res = []
def ck(n, ok, d=""):
    res.append(bool(ok)); print(f"{'PASS' if ok else 'FAIL'}  {n}{('  · ' + str(d)) if d not in ('', None) else ''}")
SETUP = """()=>{stats.tutDone=true;stats.nick='T';stats.freeCats=['Sports','Music','Arcade'];stats.spSkip=1;stats.diff={};CATEGORIES.forEach(c=>stats.diff[c.name]='medium');
 stats.seen19=1;stats.seen20=1;stats.seen21=1;stats.seen22=1;stats.seen23=1;stats.fullHome=1;stats.recapSeen='2026-11';stats.tot.games=12;stats.tips={target:1,powers:1,fever:1,'rush-tap':1,'rush-clue':1,'rush-scramble':1};document.getElementById('onb').hidden=true;S=null;showMenu()}"""
CLOSE = "()=>{document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});const c=document.getElementById('cele');if(c)c.hidden=true;S=null;showMenu()}"

async def page(b, when, setup=SETUP):
    ctx = await b.new_context(viewport={"width": 393, "height": 852}); pg = await ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e))); await pg.clock.install(time=when)
    await pg.set_content(SRC); await pg.wait_for_timeout(900); await pg.evaluate(setup); await pg.wait_for_timeout(400); return ctx, pg, errs

async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, errs = await page(b, '2026-11-20T10:00:00')  # a Friday
        # 58 Groups
        g = await pg.evaluate("""(()=>{const out=[];for(let i=0;i<60;i++){const dk=addDays('2026-11-01',i),P=grpPuzzle(dk);const all=P.groups.flatMap(g=>g.words);
            out.push(P.groups.length===4&&P.groups.every(g=>g.words.length===4)&&new Set(all).size===16&&new Set(P.groups.map(g=>g.cat)).size===4&&P.board.length===16)}
            const a=JSON.stringify(grpPuzzle('2026-11-20')),b=JSON.stringify(grpPuzzle('2026-11-20')),c=JSON.stringify(grpPuzzle('2026-11-21'));return [out.every(Boolean),a===b,a!==c]})()""")
        ck("58 Groups builds 4 groups of 4 distinct words on 60 days", g[0])
        ck("58 same puzzle all day, a new one tomorrow", g[1] and g[2])
        uniq = await pg.evaluate("""(()=>{const P=grpPools();const seen={};for(const k in P)for(const w of P[k]){if(seen[w])return false;seen[w]=1}return true})()""")
        ck("58 a word never belongs to two categories", uniq)
        await pg.evaluate("()=>openGroups()"); await pg.wait_for_timeout(150)
        ck("58 board shows 16 words", await pg.evaluate("document.querySelectorAll('#evh [data-gw]').length===16"))
        r = await pg.evaluate("""()=>{const P=GRP.P;const g0=P.groups[0],g1=P.groups[1];
            [g0.words[0],g0.words[1],g0.words[2],g1.words[0]].forEach(w=>document.querySelector('[data-gw="'+w+'"]').click());document.getElementById('grGo').click();
            const one=document.getElementById('evh').textContent.includes('One away');
            for(const g of P.groups){GRP.sel=g.words.slice();grpSubmit()}
            const st=grpSt(todayKey());return {one,miss:st.miss,done:st.done,win:st.win,streak:stats.grp.streak.n,share:grpShare()}}""")
        ck("58 three of a group says 'One away' and costs a mistake", r['one'] and r['miss'] == 1, r)
        ck("58 solving all four groups wins and starts a streak", r['done'] and r['win'] and r['streak'] == 1)
        ck("58 share text is a colour grid", r['share'].startswith("Crossfall Groups 2026-11-20") and "🟨" in r['share'] and "1 mistake" in r['share'], r['share'])
        lose = await pg.evaluate("""()=>{GRP={dk:'2026-11-19',P:grpPuzzle('2026-11-19'),sel:[],msg:''};const P=GRP.P;for(let i=0;i<4;i++){GRP.sel=[P.groups[0].words[0],P.groups[1].words[0],P.groups[2].words[0],P.groups[3].words[0]];grpSubmit()}
            const st=grpSt('2026-11-19');return [st.done,st.win,document.querySelectorAll('#evh .grp-row').length]}""")
        ck("58 four mistakes ends the game and reveals all groups", lose == [True, False, 4], lose)
        await pg.evaluate(CLOSE)
        # 59 Twist
        tw = await pg.evaluate("""(()=>{const ids=new Set();for(let i=0;i<30;i++)ids.add(twistOf(addDays('2026-11-01',i)).T.id);const x=twistOf('2026-11-20');return [ids.size,!!x.L,x.L&&!lockReason(x.L)]})()""")
        ck("59 twists rotate and today's puzzle is playable", tw[0] >= 4 and tw[1] and tw[2], tw)
        out = {}
        for tid in ["fast", "nohold", "nohint", "short", "deep"]:
            out[tid] = await pg.evaluate("""(id)=>{const x=twistOf(todayKey());TWISTQ={dk:todayKey(),id,L:x.L};startLevel(LEVELS.indexOf(x.L));const base=S.runMul||1;
                let r={twist:S.twist,day:S.twistDay};
                if(id==='fast')r.ok=S.runMul<1;
                if(id==='nohint'){r.ok=!!S.noHint}
                if(id==='nohold'){S.phase='drop';S.active=S.active||{};S.canHold=true;const h=S.held;holdPiece();r.ok=S.held===h}
                if(id==='deep'){let n=0;for(let rr=0;rr<ROWS;rr++)if(S.grid[rr].some(c=>c&&c.g))n++;r.ok=n>=2;r.n=n}
                if(id==='short'){S.cw.words.forEach(w=>{w.solved=true});const lim0=Math.round(rushLimit('clue'));try{startRush()}catch(e){r.err=String(e)}r.ok=S.rush&&S.rush.limit<=Math.ceil(lim0*0.7)+1;r.lim=[lim0,S.rush&&S.rush.limit]}
                const res=r;document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='menu')o.hidden=true});S=null;showMenu();return res}""", tid)
        ck("59 each twist applies its rule", all(v.get('ok') and v['twist'] for v in out.values()), out)
        await pg.evaluate("()=>{const x=twistOf(todayKey());TWISTQ={dk:todayKey(),id:'fast',L:x.L};startLevel(LEVELS.indexOf(x.L))}")
        await pg.evaluate(PLAY); await pg.wait_for_timeout(800)
        tr = await pg.evaluate("stats.twist.days[todayKey()]")
        ck("59 a Twist result is saved for the day", tr and tr['tries'] == 1, tr)
        await pg.evaluate(CLOSE)
        ck("59 a normal game is not a Twist", await pg.evaluate("(()=>{startLevel(LEVELS.findIndex(l=>l.cat==='Music'));const r=!S.twist;return r})()"))
        await pg.evaluate(CLOSE)
        # 62, 63 review
        await pg.evaluate("""()=>{stats.bank={};['APPLE','MANGO','LEMON','PEACH','GRAPE','MELON'].forEach((w,i)=>stats.bank[w]={c:'fruit '+i,k:'Kitchen',n:1,box:i<4?0:3,t:Date.now()-i})}""")
        await pg.evaluate("()=>renderDailyCard()")
        ck("62 home shows words to review", await pg.evaluate("(document.getElementById('rvLine')||{}).textContent?.includes('4 words to review')"))
        rp = await pg.evaluate("(()=>{const r=reviewPuzzle();return r&&{n:r.L.words.length,custom:r.L.custom,name:r.L.name}})()")
        ck("63 a puzzle builds from review words", rp and rp['n'] >= 4 and rp['custom'], rp)
        await pg.evaluate("()=>{openReview()}"); await pg.wait_for_timeout(100)
        ck("63 Review offers 'Make a puzzle from my review words'", await pg.evaluate("!!document.getElementById('rvPuzzle')"))
        await pg.evaluate("()=>document.getElementById('rvPuzzle').click()"); await pg.wait_for_timeout(300)
        ck("63 tapping it starts the puzzle", await pg.evaluate("S&&S.L.custom&&S.L.name==='My review words'"))
        await pg.evaluate(CLOSE)
        # 64 weekend sparks
        wk = await pg.evaluate("""()=>{const g={t:Date.parse('2026-11-21T10:00:00'),rows:2,rushW:1,target:true,gold:false};S={L:{}};stats.sparks=3;sparksAfter(g);const we=stats.sparks;
            stats.sparks=3;g.t=Date.parse('2026-11-20T10:00:00');sparksAfter(g);const wd=stats.sparks;S=null;return [we-3,wd-3]}""")
        ck("64 weekend games give double sparks", wk[0] == 2 * wk[1] and wk[1] > 0, wk)
        ck("64 weekend banner only on weekends", await pg.evaluate("isWeekend(Date.parse('2026-11-22T09:00'))&&!isWeekend(Date.parse('2026-11-20T09:00'))&&weekendLine()===''"))
        # 65 loved shuffle
        await pg.evaluate("()=>{stats.fb={};LEVELS.filter(l=>!lockReason(l)&&!l.lang).slice(0,3).forEach(l=>stats.fb[l.id]=1);openModes()}"); await pg.wait_for_timeout(150)
        ck("65 'Play a loved puzzle' appears with 2+ loved puzzles", await pg.evaluate("!!document.getElementById('lvShuffle')"), await pg.evaluate("lovedList().length"))
        await pg.evaluate("()=>document.getElementById('lvShuffle').click()"); await pg.wait_for_timeout(300)
        ck("65 it starts one of them", await pg.evaluate("S&&(stats.fb[S.L.id]===1)"))
        await pg.evaluate(CLOSE)
        # 66 category deep dive
        await pg.evaluate(PLAY.replace("async()=>{", "async()=>{startLevel(LEVELS.findIndex(l=>l.cat==='Music'));")); await pg.wait_for_timeout(800)
        await pg.evaluate(CLOSE)
        await pg.evaluate("()=>openInsights()"); await pg.wait_for_timeout(150)
        ck("66 Insights lists category detail buttons", await pg.evaluate("!!document.querySelector('#evh [data-cd=\"Music\"]')"))
        await pg.evaluate("()=>document.querySelector('#evh [data-cd=\"Music\"]').click()"); await pg.wait_for_timeout(100)
        ck("66 category page shows stars and puzzles played", await pg.evaluate("document.getElementById('evh').textContent.includes('puzzles played')&&document.querySelector('#evh h1').textContent==='MUSIC'"))
        await pg.evaluate(CLOSE)
        # 61 showcase
        await pg.evaluate("()=>{stats.badges={a:{name:'Alpha',icon:'medal',n:1,t:3},b:{name:'Beta',icon:'medal',n:1,t:2},c:{name:'Gamma',icon:'medal',n:1,t:1},d:{name:'Delta',icon:'medal',n:1,t:0}};stats.show=[];renderProfile()}")
        await pg.evaluate("()=>{const bs=document.querySelectorAll('#profile .bdg-grid .bdg');bs[0].click()}")
        await pg.evaluate("()=>{const bs=document.querySelectorAll('#profile .bdg-grid .bdg');bs[1].click()}")
        sc = await pg.evaluate("[stats.show.join(),(document.querySelector('#profile .sc-row')||{}).textContent||'']")
        ck("61 tapping badges pins them to the profile", sc[0] == "a,b" and "Alpha" in sc[1] and "Beta" in sc[1], sc)
        await pg.evaluate("()=>{toggleShow('c');toggleShow('d')}")
        ck("61 at most 3 pinned", await pg.evaluate("showcase().length===3"))
        # 67 quick actions
        await pg.evaluate("()=>window.__qa('quick')"); await pg.wait_for_timeout(150)
        ck("67 quick action 'quick' opens Quick Daily", await pg.evaluate("document.getElementById('evh').textContent.includes('QUICK')&&!document.getElementById('evh').hidden"))
        await pg.evaluate("()=>window.__qa('groups')"); await pg.wait_for_timeout(150)
        ck("67 quick action 'groups' opens Groups", await pg.evaluate("document.querySelector('#evh h1').textContent==='GROUPS'"))
        await pg.evaluate("()=>window.__qa('daily')"); await pg.wait_for_timeout(400)
        ck("67 quick action 'daily' starts today's Daily", await pg.evaluate("S&&S.L.daily===todayKey()"))
        await pg.evaluate(CLOSE)
        # 68 volume
        v = await pg.evaluate("""()=>{prefs.vfx=.3;prefs.vmus=.6;audioInit();const a=[!!FXBUS,MASTER===FXBUS,Math.round(FXBUS.gain.value*100),Math.round(MUSBUS.gain.value*100)];
            renderPaceInfo();a.push(!!document.getElementById('volFx'),!!document.getElementById('volMus'));const r=document.getElementById('volFx');r.value='80';r.dispatchEvent(new Event('input'));a.push(Math.round(FXBUS.gain.value*100));return a}""")
        ck("68 effects and music have their own volume", v == [True, True, 30, 60, True, True, 80], v)
        # 71, 72 settings
        ks = await pg.evaluate("""()=>{document.querySelector('[data-kb="azerty"]').click();S=null;startLevel(LEVELS.findIndex(l=>l.cat==='Music'));const k=[...document.querySelectorAll('#pad .kr')][0].textContent.replace(/\\s/g,'');
            document.getElementById('setWideLs').click();const w=document.documentElement.classList.contains('wide-ls');prefs.kb='qwerty';prefs.wideLs=false;applySpacing();return [k,w]}""")
        ck("72 keyboard layout changes the letter keys (AZERTY)", ks[0].startswith("AZERTY"), ks[0][:12])
        ck("71 wider letter spacing turns on", ks[1])
        await pg.evaluate(CLOSE)
        # 69 streak milestones
        ms = await pg.evaluate("""()=>{stats.dstreak={n:30,last:todayKey(),freezes:0};stats.msDone=[];stats.sparks=1;S={L:{daily:todayKey()}};streakMilestone();const a=[stats.msDone.join(),stats.sparks,!!stats.badges.streak30];streakMilestone();a.push(stats.sparks);S=null;return a}""")
        ck("69 a 30-day streak gives sparks and a badge, once", ms == ["7,30", 4, True, 4], ms)
        # 70 today line
        td = await pg.evaluate("""()=>{pzStore('mini').days[todayKey()]={done:true};renderDailyCard();const t=(document.getElementById('tdLine')||{}).textContent||'';return t}""")
        ck("70 today summary counts finished puzzles", "of 7 puzzles" in td, td[:80])
        # 60 wrapped
        await ctx.close()
        ctx, pg, e2 = await page(b, '2026-12-05T10:00:00'); errs += e2
        await pg.evaluate("()=>{stats.mon={'2026-03':{games:5,wins:4,score:9000,words:40,best:3000,bestName:'Song',gold:1,targets:2,cats:{Music:5}},'2026-11':{games:9,wins:6,score:12000,words:70,best:2500,bestName:'X',gold:0,targets:1,cats:{Sports:9}},'2025-12':{games:50,wins:1,score:1,words:1,best:1,cats:{}}};renderDailyCard()}")
        ck("60 Wrapped shows on the home screen in December", await pg.evaluate("!!document.getElementById('wrLine')"))
        await pg.evaluate("()=>document.getElementById('wrLine').click()"); await pg.wait_for_timeout(150)
        w = await pg.evaluate("document.getElementById('evh').textContent")
        ck("60 Wrapped totals this year only", "2026" in w and "14puzzlesplayed" in w.replace(" ", "") and "Sports" in w and "3,000" in w, w[150:400])
        await ctx.close()
        ctx, pg, e3 = await page(b, '2026-11-20T10:00:00'); errs += e3
        ck("60 Wrapped is hidden outside 1 Dec to 15 Jan", await pg.evaluate("!document.getElementById('wrLine')&&wrapOn(Date.parse('2027-01-15T12:00'))&&!wrapOn(Date.parse('2027-01-16T12:00'))&&wrapYear(Date.parse('2027-01-10T12:00'))===2026"))
        # What's new
        await ctx.close()
        ctx, pg, e4 = await page(b, '2026-11-20T10:00:00', SETUP.replace("stats.seen21=1;stats.seen22=1;stats.seen23=1;", "")); errs += e4
        await pg.evaluate("()=>{S=null;showMenu()}"); await pg.wait_for_timeout(900)
        wn = await pg.evaluate("[document.getElementById('evh').textContent.includes('Groups'),document.querySelectorAll('#evh > .wn').length,!!document.querySelector('#evh details.wn-more')]")
        ck("What's new leads with the 4 newest items and folds the rest", wn == [True, 4, True], wn)
        ck("no JS errors", not errs, " | ".join(errs[:3]))
        await b.close()
    print(f"{sum(res)}/{len(res)} passed"); return all(res)
sys.exit(0 if asyncio.run(main()) else 1)
