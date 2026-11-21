/* ================= Phases 208–232 (21 Nov 2026) ================= */

/* ---------- 208–211: study on the Learn page ---------- */
function dueWords(){const now=Date.now();return Object.entries(stats.bank||{}).filter(([w,b])=>b&&b.c&&((b.box||0)===0||b.sl||(b.rt&&now-b.rt>Math.pow(2,b.box||0)*864e5)))}
function masteredN(){return Object.values(stats.bank||{}).filter(b=>(b.box||0)>=4).length}
function revStreak(){const set=new Set(stats.revDays||[]);let n=0,d=todayKey();if(!set.has(d))d=addDays(d,-1);while(set.has(d)){n++;d=addDays(d,-1)}return n}
function markReviewDay(){stats.revDays=stats.revDays||[];const t=todayKey();if(!stats.revDays.includes(t)){stats.revDays.push(t);stats.revDays=stats.revDays.slice(-60)}}
{const _rr=renderReview;renderReview=function(){const r=_rr.apply(this,arguments);try{if(rv&&rv.i>=rv.list.length){markReviewDay();saveStats()}else if(rv&&rv.list[rv.i]){const b=rv.list[rv.i][1];if(b)b.rt=Date.now()}}catch(e){}return r}}
function openToughReview(){const all=Object.entries(stats.bank||{});const tough=new Set(Object.keys(stats.tough||{}));
  const pick=all.filter(([w,b])=>tough.has(w)||(b.box||0)===0||b.sl).sort((a,z)=>(a[1].box||0)-(z[1].box||0)).slice(0,10);
  if(!pick.length){toast("No tricky words right now. Nice!");return}rv={list:pick,i:0,shown:false,got:0};renderReview();document.getElementById("review").hidden=false}
function studyHTML(){const due=dueWords().length,st=revStreak(),m=masteredN(),bank=Object.keys(stats.bank||{}).length;if(!bank)return"";
  return`<div class="panel ln-study"><h3>Today's study</h3><div class="ls-row"><div><b>${due}</b><span>word${due===1?"":"s"} to review</span></div><div><b>${st}</b><span>day${st===1?"":"s"} in a row</span></div><div><b>${m}</b><span>mastered</span></div></div>
    <span class="pp-bar" aria-hidden="true"><i style="width:${Math.min(100,m)}%"></i></span><p class="pf-rank">${m<100?`${100-m} more to master 100 words. A word is mastered after you know it 4 times.`:"100 words mastered!"}</p>
    <div class="btns"><button class="big" id="lsGo">${due?"Start today's review":"Review 10 words"}</button><button class="ghost-btn" id="lsTough">Tricky words</button></div></div>`}

/* ---------- 212–214, 232: Unscramble ---------- */
let un=null;
function unPool(){return Object.entries(stats.bank||{}).filter(([w,b])=>w.length>=4&&w.length<=8&&/^[A-Z]+$/.test(w)&&b&&b.c)}
function scramble(w){let s=w;for(let k=0;k<8&&s===w;k++)s=shuffle([...w],rng(Date.now()%99991+k)).join("");return s}
function openUnscramble(){const pool=unPool();if(pool.length<5){toast("Solve a few more words to unlock Unscramble");return}const R=rng(Date.now()%100000);
  un={list:shuffle(pool.slice(),R).slice(0,5),i:0,got:0,hint:0,score:0};renderUn();document.getElementById("evh").hidden=false}
function renderUn(){const el=document.getElementById("evh");if(!un)return;
  if(un.i>=un.list.length){const best=stats.unsc||0,isBest=un.score>best;if(isBest)stats.unsc=un.score;stats.unPlays=(stats.unPlays||0)+1;const xp=un.got*20;if(xp)giveXP(xp,"Unscramble");saveStats();
    el.innerHTML=`<h1>UN<span>SCRAMBLE</span></h1><div class="pts">${un.got}/5</div><p class="sub">${fmtN(un.score)} points${isBest?" · new best!":best?` · best ${fmtN(best)}`:""}</p>
     <div class="btns"><button class="big" id="unAgain">Play again</button><button class="ghost-btn" id="unShare">Share</button></div><div class="btns wide"><button class="ghost-btn" id="evDone">Done</button></div>`;
    document.getElementById("unAgain").onclick=openUnscramble;document.getElementById("unShare").onclick=()=>shareOut(`Crossfall Unscramble: ${un.got}/5 · ${fmtN(un.score)} points`);document.getElementById("evDone").onclick=closeEvents;return}
  const [w,b]=un.list[un.i];un.sc=un.sc&&un.sc.w===w?un.sc:{w,s:scramble(w)};
  el.innerHTML=`<h1>UN<span>SCRAMBLE</span></h1><p class="sub">Word ${un.i+1} of 5 · ${fmtN(un.score)} points</p>
   <div class="rvcard"><p class="rvclue">${esc(b.c)}</p><div class="un-tiles" aria-label="Letters: ${un.sc.s.split("").join(" ")}">${[...un.sc.s].map(c=>`<b>${c}</b>`).join("")}</div>
   ${un.hint?`<p class="sub">Starts with <b>${w[0]}</b></p>`:""}</div>
   <form id="unForm" class="un-form"><label class="sr" for="unIn">Your answer</label><input id="unIn" maxlength="${w.length}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${w.length} letters"><button class="big" type="submit">Check</button></form>
   <p class="sub" id="unMsg" role="status"></p><div class="btns"><button class="ghost-btn" id="unHint" ${un.hint?"disabled":""}>First letter</button><button class="ghost-btn" id="unSkip">Skip</button></div>
   <div class="btns wide"><button class="ghost-btn" id="evDone">Stop</button></div>`;
  const inp=document.getElementById("unIn");inp.focus();
  document.getElementById("unForm").onsubmit=e=>{e.preventDefault();const v=inp.value.toUpperCase().replace(/[^A-Z]/g,"");if(v===w){un.got++;un.score+=un.hint?50:100;hap("success");blip(880,.06);un.i++;un.hint=0;renderUn()}else{document.getElementById("unMsg").textContent="Not quite. Try again.";hap("error");inp.select()}};
  document.getElementById("unHint").onclick=()=>{un.hint=1;renderUn()};
  document.getElementById("unSkip").onclick=()=>{document.getElementById("unMsg").textContent=`It was ${w}.`;setTimeout(()=>{un.i++;un.hint=0;renderUn()},900)};
  document.getElementById("evDone").onclick=()=>{un=null;closeEvents()}}

/* ---------- 229–231: Learn page additions; folding ---------- */
{const _rl=renderLearn;renderLearn=function(){_rl.apply(this,arguments);const el=document.getElementById("learn");if(!el)return;
  const head=el.querySelector(".deckhead");const sh=studyHTML();if(head&&sh)head.insertAdjacentHTML("afterend",sh);
  const bankP=[...el.querySelectorAll(".panel")].find(p=>(p.querySelector("h3")||{}).textContent&&p.querySelector("h3").textContent.startsWith("Word bank"));
  const extra=`<div class="panel ln-games"><h3>Word games</h3><div class="ln-gbtns"><button class="pp-link" id="lnUn">${ti("cards")}<span>Unscramble<small>${stats.unsc?`best ${fmtN(stats.unsc)}`:"5 words from your bank"}</small></span></button><button class="pp-link" id="lnGym">${ti("bolt")}<span>Rush Gym<small>Practice rushes</small></span></button></div></div>
    <div class="panel"><h3>Letter of the week · ${lotw()}</h3>${abcHTML()}</div>
    <div class="panel"><h3>Collections</h3><div class="ln-gbtns"><button class="pp-link" id="lnAlbum">${ti("star")}<span>Sticker album<small>${stickerCount()} of ${CATEGORIES.length*STK_TIERS.length}</small></span></button><button class="pp-link" id="lnSky">${ti("moon")}<span>Your sky<small>${nsProgress().filter(p=>p.lit).length} of 10 lit</small></span></button></div></div>`;
  (bankP||el.lastElementChild).insertAdjacentHTML("afterend",extra);
  const on=(id,f)=>{const x=document.getElementById(id);if(x)x.onclick=f};on("lsGo",()=>dueWords().length?(()=>{const d=dueWords().slice(0,10);rv={list:d,i:0,shown:false,got:0};renderReview();document.getElementById("review").hidden=false})():openReview());
  on("lsTough",openToughReview);on("lnUn",openUnscramble);on("lnGym",()=>{try{openGym()}catch(e){}});on("lnAlbum",openAlbum);on("lnSky",openSkyMap);
  const fold=prefs.lnFold||{};el.querySelectorAll(".panel>h3").forEach(h=>{const key=h.textContent.split("·")[0].trim();if(!key||h.querySelector(".pp-fold"))return;const p=h.parentElement;
    const tb=document.createElement("button");tb.className="pp-fold";tb.setAttribute("aria-expanded",!fold[key]);tb.setAttribute("aria-label",(fold[key]?"Show ":"Hide ")+key);tb.innerHTML='<span aria-hidden="true">⌄</span>';h.classList.add("ln-h");h.appendChild(tb);p.classList.toggle("folded",!!fold[key]);
    tb.onclick=e=>{e.stopPropagation();fold[key]=!fold[key];prefs.lnFold=fold;savePrefsQuiet();p.classList.toggle("folded",!!fold[key]);tb.setAttribute("aria-expanded",!fold[key]);tb.setAttribute("aria-label",(fold[key]?"Show ":"Hide ")+key)}})}}

/* ---------- 215–216: your bests on Ranks ---------- */
function myBestsHTML(){const g=stats.games.filter(x=>!x.practice&&x.score>0).slice().sort((a,b)=>b.score-a.score).slice(0,10);const cb={};stats.games.forEach(x=>{if(x.practice||!x.cat)return;if(!cb[x.cat]||x.score>cb[x.cat].score)cb[x.cat]=x});
  const cats=Object.values(cb).sort((a,b)=>b.score-a.score);if(!g.length)return"";
  return`<div class="panel my-bests" id="myBests"><h3>Your best games</h3><ol class="rklist mb-list">${g.map((x,i)=>`<li><span class="rk-n">${i+1}</span><span class="mb-m"><b>${esc(x.name)}</b><i>${esc(x.cat||"")} · ${new Date(x.t).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</i></span><b class="mb-s">${fmtN(x.score)}</b></li>`).join("")}</ol>
   <h3>Best in each category</h3><div class="pp-list">${cats.map(x=>`<div class="pp-li"><span>${esc(x.cat)}</span><span class="mb-n">${esc(x.name)}</span><b>${fmtN(x.score)}</b></div>`).join("")}</div></div>`}
{const _rrk=renderRanks;renderRanks=function(){_rrk.apply(this,arguments);try{const pg=document.getElementById("pgRanks");if(!pg)return;const old=document.getElementById("myBests");if(old)old.remove();const h=myBestsHTML();if(h)pg.insertAdjacentHTML("beforeend",h)}catch(e){console.error(e)}}}

/* ---------- 217, 218: weekend challenge ---------- */
function wkndKey(){const d=new Date();d.setDate(d.getDate()-(d.getDay()===0?1:0));return dayKeyOf(d)}
function wkndPicks(){const k=wkndKey(),n=k.split("-").join("")|0,cats=CATEGORIES.filter(c=>{const l=LEVELS.find(l=>l.cat===c.name);return l&&!lockReason(l)&&!c.puzzles[0].lang&&!LEVELS.find(x=>x.cat===c.name).heal});
  if(cats.length<3)return[];const out=[];for(let i=0;out.length<3&&i<cats.length*2;i++){const c=cats[(n+i*7)%cats.length];if(out.some(o=>o.cat===c.name))continue;const ls=LEVELS.map((l,j)=>({l,j})).filter(x=>x.l.cat===c.name);const p=ls[(n+i)%ls.length];out.push({cat:c.name,li:p.j,id:p.l.id,name:p.l.name})}return out}
function wkndDone(){const k=wkndKey(),since=new Date(k+"T00:00:00").getTime();return wkndPicks().map(p=>stats.games.some(g=>g.id===p.id&&g.t>=since&&g.win))}
function wkndHTML(){if(!isWeekend(Date.now()))return"";const P=wkndPicks();if(P.length<3)return"";const D=wkndDone(),n=D.filter(Boolean).length,paid=(stats.wkndPaid||"")===wkndKey();
  return`<div class="ht ht-wknd"><span class="ht-k">Weekend challenge · ${n}/3</span><b>${paid?"Done! +300 XP":"Win one puzzle from three categories"}</b><span class="wk-list">${P.map((p,i)=>`<button class="ghost-btn sm wk-p${D[i]?" ok":""}" data-wk="${p.li}" ${D[i]?'aria-label="'+esc(p.name)+', done"':""}>${D[i]?"✓ ":""}${esc(p.cat)}</button>`).join("")}</span></div>`}
function wkndCheck(){if(!isWeekend(Date.now()))return;const D=wkndDone();if(D.length===3&&D.every(Boolean)&&stats.wkndPaid!==wkndKey()){stats.wkndPaid=wkndKey();stats.wkndN=(stats.wkndN||0)+1;giveXP(300,"Weekend challenge");queueCele({kind:"xp",title:"Weekend challenge done",sub:"Three categories, three wins."});saveStats()}}
{const _htH3=homeTilesHTML;homeTilesHTML=function(){let h=_htH3.apply(this,arguments)||"";const w=wkndHTML();if(!w)return h;if(!h)return`<div class="home-tiles" id="homeTiles">${w}</div>`;return h.replace('<div class="home-tiles" id="homeTiles">','<div class="home-tiles" id="homeTiles">'+w)}}
{const _rdc5=renderDailyCard;renderDailyCard=function(){const r=_rdc5.apply(this,arguments);try{document.querySelectorAll("[data-wk]").forEach(b=>b.onclick=()=>startLevel(+b.dataset.wk))}catch(e){}return r}}

/* ---------- 219, 220: feel and hear big clears ---------- */
{const _as6=afterSettle;afterSettle=function(){try{if(S&&!S.tut){const n=(S.linesCleared||0)-(S._lc6||0);if(n>0){if(n>=3)hap("heavy");announce(`${n} row${n>1?"s":""} cleared. Score ${fmtN(S.score)}.`)}S._lc6=S.linesCleared||0}}catch(e){}return _as6.apply(this,arguments)}}

/* ---------- 221, 222, 228: profile ---------- */
function weekCmp(){const t=todayKey(),mon=addDays(t,-((new Date().getDay()+6)%7)),lastMon=addDays(mon,-7);const inR=(g,a,b)=>{const k=dayKeyOf(new Date(g.t));return k>=a&&k<b};
  const sum=(a,b)=>{const g=stats.games.filter(x=>!x.practice&&inR(x,a,b));return{n:g.length,pts:g.reduce((s,x)=>s+(x.score||0),0),st:g.reduce((s,x)=>s+(x.stars||0),0)}};return{now:sum(mon,addDays(t,1)),last:sum(lastMon,mon)}}
function weekCmpHTML(){const W=weekCmp(),row=(l,a,b,f)=>{const d=a-b;return`<div class="wc-r"><span>${l}</span><b>${f(a)}</b><span class="wc-d ${d>0?"up":d<0?"down":""}">${d>0?"▲ "+f(d):d<0?"▼ "+f(-d):"="}</span></div>`};
  return`<div class="wk-cmp">${row("Puzzles",W.now.n,W.last.n,fmtN)}${row("Stars",W.now.st,W.last.st,fmtN)}${row("Points",W.now.pts,W.last.pts,fmtN)}</div><p class="pp-note">Compared with the same point last week, Monday to now.</p>`}
function topMedals(n){const out=[];try{ACH.forEach(a=>{let v=0;try{v=a.v()}catch(e){}const t=achTier(a);if(t>=a.t.length)return;out.push({a,v,goal:a.t[t],f:v/a.t[t],tier:t})})}catch(e){}return out.filter(x=>x.f<1).sort((a,b)=>b.f-a.f).slice(0,n)}
{const _rp7=renderProfile;renderProfile=function(){_rp7.apply(this,arguments);const el=document.getElementById("profile");if(!el)return;
  const sec=(t,b)=>`<section class="pp-sec"><h2 class="pp-h">${t}</h2>${b}</section>`;
  const how=[...el.querySelectorAll(".pp-sec")].find(s=>(s.querySelector(".pp-h")||{}).textContent.startsWith("How you play"));
  if(how)how.insertAdjacentHTML("beforebegin",sec("This week vs last week",weekCmpHTML()));
  const up=[...el.querySelectorAll(".pp-sec")].find(s=>(s.querySelector(".pp-h")||{}).textContent.startsWith("Up next"));const tm=topMedals(3);
  if(up&&tm.length)up.insertAdjacentHTML("afterend",sec("Almost there",`<div class="pp-ms">${tm.map(x=>`<button class="pp-m am-m">${ti(x.a.ic||"medal")}<span class="t"><b>${esc(x.a.name)}</b><small>${fmtN(x.v)} of ${fmtN(x.goal)} ${esc(x.a.unit||"")}</small></span><span class="pp-bar" aria-hidden="true"><i style="width:${Math.round(x.f*100)}%"></i></span></button>`).join("")}</div>`));
  el.querySelectorAll(".am-m").forEach(b=>b.onclick=openAchievements);
  const meta=el.querySelector(".pp-meta");if(meta&&!meta.querySelector(".pp-medals")){const got=ACH.reduce((s,a)=>s+achTier(a),0),max=ACH.reduce((s,a)=>s+a.t.length,0);meta.insertAdjacentHTML("beforeend",`<button class="pp-medals" id="pfMedals">${ti("medal")} ${got}/${max} medals</button>`);document.getElementById("pfMedals").onclick=openAchievements}}}

/* ---------- 223: start screen; 224: a stat in the Menu ---------- */
function funFact(){const T=stats.tot||{},W=stats.ws||{},bank=Object.keys(stats.bank||{}).length,facts=[];
  if(T.words>=20)facts.push(`You've solved ${fmtN(T.words)} words. Laid end to end that's about ${fmtN(Math.round(T.words*5.6))} letters.`);
  if(W.links)facts.push(`You've found ${fmtN(W.links)} hidden word${W.links===1?"":"s"} in cleared rows.`);
  if(T.targets)facts.push(`You've built ${fmtN(T.targets)} target words on the middle line.`);
  if((stats.breaths||0)>0)facts.push(`You've taken ${stats.breaths} guided breath${stats.breaths===1?"":"s"} here.`);
  if(bank>=10)facts.push(`Your word bank holds ${fmtN(bank)} words with their clues.`);
  if(!facts.length)return"";return facts[(todayKey().split("-").join("")|0)%facts.length]}
{const _od=openDrawer;openDrawer=function(){const r=_od.apply(this,arguments);try{const me=document.getElementById("drMe");if(me&&!document.getElementById("drFact")){const f=funFact();if(f)me.insertAdjacentHTML("afterend",`<p class="dr-fact" id="drFact">${esc(f)}</p>`)}}catch(e){}return r}}
{const _rpi8=renderPaceInfo;renderPaceInfo=function(){_rpi8.apply(this,arguments);const a=document.getElementById("a11ySlot");if(!a||a.querySelector("#setStart"))return;
  const cur=prefs.startPage||"Play";a.insertAdjacentHTML("beforeend",`<div class="setgroup"><span class="st-t">Open the app on</span><span class="st-d">The page you see first.</span><div class="seg" role="radiogroup" aria-label="Open the app on" id="setStart">${["Play","Learn","Profile"].map(p=>`<button role="radio" data-sp="${p}" aria-checked="${cur===p}">${p}</button>`).join("")}</div></div>`);
  a.querySelectorAll("[data-sp]").forEach(b=>b.onclick=()=>{prefs.startPage=b.dataset.sp;a.querySelectorAll("[data-sp]").forEach(x=>x.setAttribute("aria-checked",x===b));savePrefsQuiet()})}}
setTimeout(()=>{try{if(prefs.startPage&&prefs.startPage!=="Play"&&stats.tutDone&&!S&&typeof goPage==="function")goPage(prefs.startPage)}catch(e){}},50);

/* ---------- 225: the next constellation to light; 226: breaths this week ---------- */
{const _osm=openSkyMap;openSkyMap=function(){_osm.apply(this,arguments);const el=document.getElementById("evh"),P=nsProgress();if(!el)return;const nx=P.map((p,t)=>({p,t})).filter(x=>!x.p.lit).sort((a,b)=>(b.p.done/b.p.n)-(a.p.done/a.p.n))[0];
  const sub=el.querySelector(".sub");if(nx&&sub)sub.insertAdjacentHTML("afterend",`<button class="ghost-btn sm sky-next" id="skyNext">Next to light: <b>${esc(nx.p.name)}</b> · ${nx.p.n-nx.p.done} to go</button>`);
  const b=document.getElementById("skyNext");if(b)b.onclick=()=>{const c=CATEGORIES.find(x=>x.name==="Night Sky"),i=c.puzzles.findIndex((p,i)=>i%10===nx.t&&!((store[p.id]||{}).stars));const li=i>=0?LEVELS.findIndex(l=>l.id===c.puzzles[i].id):-1;if(li>=0){closeEvents();startLevel(li)}}}}
{const _ob2=openBreath;openBreath=function(){_ob2.apply(this,arguments);const el=document.getElementById("evh");if(!el||el.querySelector(".br-week"))return;const t=todayKey(),days=new Set([...Array(7)].map((_,i)=>addDays(t,-i)));const n=(stats.breathLog||[]).filter(d=>days.has(d)).length;
  const go=document.getElementById("brGo");if(go)go.closest(".btns").insertAdjacentHTML("afterend",`<p class="sub br-week">${n?`You've taken a breath on ${n} day${n===1?"":"s"} this week.`:"A minute for yourself."}</p>`)}}
{const _ss=saveStats;saveStats=function(){try{if(stats.breaths&&stats.breaths!==stats._brSeen){stats._brSeen=stats.breaths;stats.breathLog=stats.breathLog||[];const t=todayKey();if(!stats.breathLog.includes(t)){stats.breathLog.push(t);stats.breathLog=stats.breathLog.slice(-30)}}}catch(e){}return _ss.apply(this,arguments)}}

/* ---------- 227: Escape closes a sheet ---------- */
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;const ev=document.getElementById("evh");if(ev&&!ev.hidden){e.preventDefault();un=null;const d=document.getElementById("evDone");if(d)d.click();else closeEvents();return}
  const p=document.getElementById("pauseOv");if(p&&!p.hidden){e.preventDefault();resumeWell()}});

/* ---------- hooks ---------- */
{const _rg9=recordGame;recordGame=function(win){const r=_rg9.apply(this,arguments);try{wkndCheck()}catch(e){}return r}}
