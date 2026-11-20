/* ================= Phases 103–122 (20 Nov 2026) ================= */
/* ---------- profile helpers ---------- */
function favCat(){const n={};stats.games.forEach(g=>{if(g.cat)n[g.cat]=(n[g.cat]||0)+1});const top=Object.entries(n).sort((a,b)=>b[1]-a[1])[0];return top&&CATEGORIES.some(c=>c.name===top[0])?{name:top[0],n:top[1]}:null}
function sinceKey(){if(stats.since)return stats.since;const ds=(stats.days||[]).slice().sort();return ds[0]||null}
function weekDotsHTML(){const t=todayKey(),set=new Set(stats.days||[]);const days=[...Array(7)].map((_,i)=>addDays(t,i-6));
  const n=days.filter(d=>set.has(d)).length;
  return`<div class="pp-week" role="img" aria-label="Played on ${n} of the last 7 days">${days.map(d=>{const dt=new Date(d+"T12:00:00");
    return`<span class="${set.has(d)?"on":""}${d===t?" now":""}"><i></i><small>${dt.toLocaleDateString("en-US",{weekday:"narrow"})}</small></span>`}).join("")}</div>`}
function closestMedal(){let best=null;try{ACH.forEach(a=>{let v=0;try{v=a.v()}catch(e){}const tier=achTier(a);if(tier>=a.t.length)return;const goal=a.t[tier],f=v/goal;
  if(f<1&&(!best||f>best.f))best={a,v,goal,f,tier}})}catch(e){}return best}
function milestonesHTML(){const L=levelOf(xpTotal()),ds=dailyStreak(),sT=starsTotal(),rows=[];
  rows.push({ic:"star",t:`Level ${L.lv+1}`,s:`${fmtN(L.toNext)} XP to go`,f:L.pct/100});
  const sm=[7,30,100,365].find(x=>x>ds.n);if(sm)rows.push({ic:"fire",t:`${sm}-day streak`,s:`${sm-ds.n} more day${sm-ds.n===1?"":"s"} of Dailies`,f:ds.n/sm});
  const sn=(Math.floor(sT/50)+1)*50;rows.push({ic:"trophy",t:`${fmtN(sn)} stars`,s:`${sn-sT} more star${sn-sT===1?"":"s"}`,f:(sT%50)/50});
  const cm=closestMedal();if(cm)rows.push({ic:cm.a.ic||"medal",t:`${cm.a.name}: ${ACH_TIER[cm.tier]||"next tier"}`,s:`${fmtN(cm.v)} of ${fmtN(cm.goal)} ${cm.a.unit||""}`.trim(),f:cm.f,id:"pfMedal"});
  return`<div class="pp-ms">${rows.map(r=>`<${r.id?`button id="${r.id}"`:"div"} class="pp-m">${ti(r.ic)}<span class="t"><b>${esc(r.t)}</b><small>${esc(r.s)}</small></span><span class="pp-bar" aria-hidden="true"><i style="width:${Math.round(Math.max(0,Math.min(1,r.f))*100)}%"></i></span></${r.id?"button":"div"}>`).join("")}</div>`}
function bestTimeLine(){const g=stats.games.filter(x=>!x.practice&&x.score>0);if(g.length<6)return"";const B=[["mornings",5,12],["afternoons",12,17],["evenings",17,22],["late nights",22,29]];
  const sc=B.map(([n,a,b])=>{const xs=g.filter(x=>{let h=new Date(x.t).getHours();if(h<5)h+=24;return h>=a&&h<b});return{n,c:xs.length,avg:xs.length?xs.reduce((t,x)=>t+x.score,0)/xs.length:0}}).filter(x=>x.c>=2);
  if(sc.length<2)return"";sc.sort((a,b)=>b.avg-a.avg);return`You score highest in the <b>${sc[0].n}</b>: ${fmtN(sc[0].avg)} a game on average.`}

/* ---------- 103–110, 119, 121, 122: the new profile, filled in ---------- */
let ppIntroDone=false;
{const _rp3=renderProfile;renderProfile=function(){_rp3.apply(this,arguments);const el=document.getElementById("profile");if(!el)return;
  const hero=el.querySelector(".pp-hero");if(hero){
    /* 106 name tiles drop in the first time you open the page */
    if(!ppIntroDone&&!calmNow()){ppIntroDone=true;hero.querySelectorAll(".pp-name b").forEach((b,i)=>{b.style.setProperty("--i",i);b.classList.add("in")})}
    /* 103 this week; 121 member since; 107 share card */
    const sk=sinceKey();
    hero.insertAdjacentHTML("beforeend",`${weekDotsHTML()}<div class="pp-foot">${sk?`<span>Playing since ${new Date(sk+"T12:00:00").toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span>`:"<span></span>"}<button class="pp-share" id="pfCard">${ti("cards")} Share my card</button></div>`)}
  /* 104 your home category */
  const f=favCat(),big=el.querySelector(".pp-big");
  if(f&&big){const lk=CAT_LOOK[f.name]||{g1:"#888",tag:""};big.insertAdjacentHTML("afterend",`<div class="pp-fav" style="--d:${lk.g1}">${catIcon(f.name,lk.g1)}<span><small>Your home category</small><b>${esc(f.name)}</b><i>${fmtN(f.n)} game${f.n===1?"":"s"} · ${esc(lk.tag||"")}</i></span><button class="ghost-btn sm" id="pfFav" data-cat="${esc(f.name)}">Play</button></div>`)}
  /* 108 + 122 what's next */
  const links=el.querySelector(".pp-links");if(links)links.insertAdjacentHTML("afterend",`<section class="pp-sec"><h2 class="pp-h">Up next for you</h2>${milestonesHTML()}</section>`);
  /* 119 when you play best; 110 longest word */
  const how=[...el.querySelectorAll(".pp-sec")].find(s=>(s.querySelector(".pp-h")||{}).textContent==="How you play");
  if(how){const bt=bestTimeLine(),lw=stats.longW;if(bt||lw)how.insertAdjacentHTML("beforeend",`<div class="pp-facts">${bt?`<p>${ti("clock")}<span>${bt}</span></p>`:""}${lw?`<p>${ti("pencil")}<span>Longest word solved: <b>${esc(lw.w)}</b> (${lw.w.length} letters)</span></p>`:""}</div>`)}
  /* 105 tap a category for the deep dive */
  el.querySelectorAll(".pp-cat").forEach(row=>{const n=row.querySelector(".n");if(!n)return;const name=n.textContent;const b=document.createElement("button");b.className="pp-cat";b.innerHTML=row.innerHTML;
    b.setAttribute("aria-label",`${name}: ${row.querySelector(".v").textContent.replace("/"," of ")} stars. Open details`);b.onclick=()=>{try{openCatDeep(name)}catch(e){}};row.replaceWith(b)});
  /* 109 tap a word to see its clue */
  const ws=el.querySelector(".pp-words");if(ws){ws.insertAdjacentHTML("afterend",`<p class="pp-note" id="ppWordNote" role="status">Tap a word to see its clue.</p>`);
    ws.querySelectorAll(".pp-word").forEach(sp=>{const b=document.createElement("button");b.className="pp-word";b.textContent=sp.textContent;const clue=sp.getAttribute("title")||"";
      b.onclick=()=>{ws.querySelectorAll(".pp-word").forEach(x=>x.setAttribute("aria-pressed",x===b));document.getElementById("ppWordNote").innerHTML=`<b>${esc(b.textContent)}</b>: ${esc(clue)}`};b.setAttribute("aria-pressed","false");sp.replaceWith(b)})}
  const on=(id,fn)=>{const x=document.getElementById(id);if(x)x.onclick=fn};
  on("pfCard",sharePlayerCard);on("pfMedal",openAchievements);
  on("pfFav",()=>{const c=document.getElementById("pfFav").dataset.cat;const i=LEVELS.findIndex(l=>l.cat===c&&!((store[l.id]||{}).stars));startLevel(i>=0?i:LEVELS.findIndex(l=>l.cat===c))})}}

/* ---------- 110 longest word; 111 vs your last try; 112 crossword time; 121 member since ---------- */
{const _rg5=recordGame;recordGame=function(win){try{if(S&&S.L){const prev=stats.games.find(g=>g.id===S.L.id&&!g.practice);S._prevTry=prev?prev.score:null;
    const longest=S.cw.words.filter(w=>w.solved).map(w=>w.ans).sort((a,b)=>b.length-a.length)[0];S._newLong=null;
    if(longest&&(!stats.longW||longest.length>stats.longW.w.length)){S._newLong=stats.longW?longest:null;stats.longW={w:longest,t:Date.now()}}
    if(!stats.since)stats.since=sinceKey()||todayKey()}}catch(e){}
  return _rg5.apply(this,arguments)}}
function resLineHTML(){if(!S||S.tut)return"";const bits=[];
  if(S._prevTry!=null&&!S.L.daily){const d=S.score-S._prevTry;bits.push(d>0?`<span class="up">+${fmtN(d)} on your last try</span>`:d<0?`<span>${fmtN(-d)} under your last try</span>`:`<span>Same as your last try</span>`)}
  if(S.crossMs>0)bits.push(`<span>${ti("clock")} Crossword in ${fmtTime(S.crossMs/1000)}</span>`);
  if(S._newLong)bits.push(`<span class="up">New longest word: ${esc(S._newLong)}</span>`);
  return bits.length?`<div class="rx-line">${bits.join("")}</div>`:""}
{const _shr2=showResult;showResult=function(){const r=_shr2.apply(this,arguments);try{const el=document.getElementById("result"),p=el&&el.querySelector(".pts");if(p&&!el.querySelector(".rx-line")){const h=resLineHTML();if(h)p.insertAdjacentHTML("afterend",h)}}catch(e){console.error(e)}return r}}

/* ---------- 113 the last five seconds of a rush ---------- */
setInterval(()=>{const el=document.getElementById("rush");if(!el)return;const hurry=!!(S&&S.phase==="rush"&&S.rush&&S.rush.state==="on"&&!S.rush.zen&&S.rush.left<=5&&S.rush.left>0);
  if(el.classList.contains("hurry")!==hurry){el.classList.toggle("hurry",hurry);if(hurry){hap("warning");announce("Five seconds left")}}},250);

/* ---------- 114 next Daily countdown; 115 a hello ---------- */
function untilTomorrow(){const n=new Date(),m=new Date(n);m.setHours(24,0,0,0);const s=Math.max(0,Math.round((m-n)/1000));const h=Math.floor(s/3600),mi=Math.floor(s%3600/60);return h?`${h}h ${mi}m`:`${mi}m`}
function helloLine(){const h=new Date().getHours(),nick=stats.nick&&!/^Player( \d+)?$/.test(stats.nick)?stats.nick:"";const p=h<5?"Up late":h<12?"Good morning":h<17?"Good afternoon":h<22?"Good evening":"Up late";
  return`<p class="hello">${p}${nick?`, ${esc(nick)}`:""}.</p>`}
{const _rdc=renderDailyCard;renderDailyCard=function(){const r=_rdc.apply(this,arguments);try{const box=document.getElementById("dailyCard");if(!box)return r;
    if(!box.querySelector(".hello"))box.insertAdjacentHTML("afterbegin",helloLine());
    if(dailyRecord(todayKey())&&!box.querySelector("#dcNext")){const done=box.querySelector(".dc-btns");if(done)done.insertAdjacentHTML("afterend",`<p class="dc-next" id="dcNext">Next Daily in <b>${untilTomorrow()}</b></p>`)}}catch(e){}return r}}
setInterval(()=>{const n=document.getElementById("dcNext");if(n){const b=n.querySelector("b");if(b)b.textContent=untilTomorrow()}},30000);

/* ---------- 116 level up feel; 120 rows to the next level ---------- */
{const _lb=lvBadge;lvBadge=function(){_lb.apply(this,arguments);const b=document.getElementById("wellLv");if(!b||!S)return;const lv=wellLevel(),left=ROWS_PER_LEVEL-((S.linesCleared||0)%ROWS_PER_LEVEL);
  b.innerHTML=`LV ${lv}<small>${left} row${left===1?"":"s"} to LV ${lv+1}</small>`;if(S._lvSeen&&lv>S._lvSeen){hap("success");b.classList.remove("lvup");void b.offsetWidth;b.classList.add("lvup")}S._lvSeen=lv}}

/* ---------- 117 show tips again ---------- */
{const _rpi4=renderPaceInfo;renderPaceInfo=function(){_rpi4.apply(this,arguments);const a=document.getElementById("a11ySlot");if(!a||a.querySelector("#setTips"))return;
  a.insertAdjacentHTML("beforeend",`<button class="setrow" id="setTips"><span><span class="st-t">Show tips again</span><br><span class="st-d">Bring back the coach cards and first-time hints.</span></span><span class="st-go" aria-hidden="true">↺</span></button>`);
  document.getElementById("setTips").onclick=()=>{stats.tips={};saveStats();toast("Tips will show again");announce("Tips will show again")}}}

/* ---------- 118 hold delete to clear the word ---------- */
function clearWord(){if(!S||S.phase!=="cross")return;const w=curWord();if(!w)return;let n=0;w.cells.forEach(k=>{const c=S.cw.cells.get(k);if(!c.lock&&c.val){c.val="";n++}});
  const first=w.cells.find(k=>!S.cw.cells.get(k).lock);if(first)S.sel.key=first;if(n){hap("medium");toast("Word cleared")}renderAll()}
{const _rpd=renderPad;renderPad=function(){const r=_rpd.apply(this,arguments);const bk=document.querySelector('#pad [data-a="bk"]');if(bk&&!bk.dataset.hold){bk.dataset.hold=1;let t;
  const stop=()=>clearTimeout(t);bk.addEventListener("pointerdown",()=>{stop();t=setTimeout(()=>{if(S&&S.phase==="cross")clearWord()},480)});["pointerup","pointerleave","pointercancel"].forEach(e=>bk.addEventListener(e,stop));
  bk.setAttribute("aria-label",S&&S.phase==="cross"?"Delete. Hold to clear the word":"Delete")}return r}}
