/* ================= Phases 148–177 (20 Nov 2026, night) ================= */

/* ---------- 148: ghost letters show where each letter will land ---------- */
{const _rw4=renderWell;renderWell=function(){_rw4.apply(this,arguments);if(!S||!S.active)return;const well=document.getElementById("well");if(!well)return;
  const off=prefs.ghostLetters===false||prefs.ghost==="off";well.querySelectorAll(".wc[data-gl]").forEach(d=>{if(off||!d.classList.contains("ghost"))d.removeAttribute("data-gl")});if(prefs.ghostLetters===false||prefs.ghost==="off")return;
  let d=0;while(!collides(absCells(S.active,d+1,0)))d++;if(d<1)return;absCells(S.active,d,0).forEach(x=>{const el=well.querySelector(`.wc[data-r="${x.r}"][data-c="${x.c}"]`);if(el&&el.classList.contains("ghost"))el.setAttribute("data-gl",x.ch)})}}

/* ---------- 149–152: the sticker album ---------- */
const STK_TIERS=[["First win","win",1],["10 stars","stars",10],["30 stars","stars",30],["Every puzzle played","all",1]];
function catStats(name){const c=CATEGORIES.find(x=>x.name===name);if(!c)return null;let stars=0,played=0;c.puzzles.forEach(p=>{const s=(store[p.id]||{}).stars||0;stars+=s;if(store[p.id])played++});
  const wins=stats.games.filter(g=>g.cat===name&&g.win).length+((stats.stk||{})[name+":win"]?1:0);return{stars,played,n:c.puzzles.length,wins}}
function stickerHas(name,t){const S2=catStats(name);if(!S2)return false;const [,k,n]=STK_TIERS[t];return k==="win"?S2.wins>=n||S2.stars>0:k==="stars"?S2.stars>=n:S2.played>=S2.n}
function stickerCount(){let n=0;CATEGORIES.forEach(c=>STK_TIERS.forEach((_,t)=>{if((stats.stk||{})[c.name+":"+t])n++}));return n}
function stickerCheck(silent){stats.stk=stats.stk||{};const got=[];CATEGORIES.forEach(c=>STK_TIERS.forEach((tr,t)=>{const k=c.name+":"+t;if(!stats.stk[k]&&stickerHas(c.name,t)){stats.stk[k]=Date.now();got.push([c.name,tr[0]])}}));
  if(got.length&&!silent){got.slice(0,2).forEach(([c,t])=>queueCele({kind:"xp",title:"New sticker",sub:`${c}: ${t}. See it in Menu › Sticker album.`}));giveXP(100*got.length,"Stickers")}
  return got}
function stickerSVG(name,t,on){const lk=CAT_LOOK[name]||{g1:"#888",g2:"#333"},shapes=["M24 6l5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z","M24 8a16 16 0 1 0 .01 0z","M10 10h28v28H10z","M24 6l18 18-18 18L6 24z"];
  return`<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="sg${t}${name.replace(/\W/g,"")}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${on?lk.g1:"#7a7590"}"/><stop offset="1" stop-color="${on?lk.g2:"#3c3850"}"/></linearGradient></defs>
    <path d="${shapes[t]}" fill="url(#sg${t}${name.replace(/\W/g,"")})" stroke="${on?"#fff":"rgba(255,255,255,.25)"}" stroke-width="2" stroke-linejoin="round" ${on?"":'stroke-dasharray="3 3"'}/><text x="24" y="29" text-anchor="middle" font-size="13" font-weight="800" fill="${on?"#fff":"rgba(255,255,255,.45)"}">${esc(name[0])}</text></svg>`}
function openAlbum(){stickerCheck(true);saveStats();const el=document.getElementById("evh"),n=stickerCount(),max=CATEGORIES.length*STK_TIERS.length;
  el.innerHTML=`<h1>STICKER <span>ALBUM</span></h1><p class="sub">${n} of ${max} stickers. Each category has four: a first win, 10 stars, 30 stars and every puzzle played.</p>
   <div class="album">${CATEGORIES.map(c=>{const s=catStats(c.name);return`<div class="al-row"><div class="al-h"><b>${esc(c.name)}</b><small>${s.stars}★ · ${s.played}/${s.n} played</small></div>
     <div class="al-st">${STK_TIERS.map((tr,t)=>{const on=!!(stats.stk||{})[c.name+":"+t];return`<div class="stk${on?" on":""}" role="img" aria-label="${esc(c.name)}, ${tr[0]}: ${on?"collected":"not yet"}">${stickerSVG(c.name,t,on)}<small>${tr[0]}</small></div>`}).join("")}</div></div>`}).join("")}</div>
   <div class="btns wide"><button class="ghost-btn" id="alShare">Share my album</button><button class="big" id="evDone">Done</button></div>`;
  el.hidden=false;el.scrollTop=0;document.getElementById("evDone").onclick=closeEvents;
  document.getElementById("alShare").onclick=()=>shareOut(`My Crossfall sticker album: ${n}/${max}\n`+CATEGORIES.map(c=>`${c.name} `+STK_TIERS.map((_,t)=>(stats.stk||{})[c.name+":"+t]?"🟧":"⬜").join("")).join("\n"))}

/* ---------- 153–156: letter of the week ---------- */
const LOTW_POOL="ABCDEGHILMNOPRSTUWY";
function weekKey(d){const x=new Date(d||Date.now());x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return dayKeyOf(x)}
function lotw(){const k=weekKey(),n=k.split("-").join("")|0;let h=2166136261;for(const ch of k){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return LOTW_POOL[h%LOTW_POOL.length]}
{const _cw2=checkWords;checkWords=function(cell){if(!S||S.tut)return _cw2.apply(this,arguments);const before=new Set(S.cw.words.filter(w=>w.solved));const r=_cw2.apply(this,arguments);if(!S||!S.cw)return r;
  const L=lotw(),now=performance.now();S._wt=S._wt||{};S.cw.words.forEach(w=>{if(w.solved&&!before.has(w)){
    const n=[...w.ans].filter(c=>c===L).length;if(n&&prefs.lotw!==false){addPts("letter",10*n);stats.abc=stats.abc||{};const y=new Date().getFullYear();stats.abc[y]=stats.abc[y]||"";if(!stats.abc[y].includes(L)){stats.abc[y]+=L;toast(`Letter ${L} collected for ${y}!`)}else toast(`LETTER ${L} ×${n} +${10*n}`)}
    const t0=S._wordStart||S.t0||now;const dt=now-t0;S._wt[w.ans]=dt;S._wordStart=now}});return r}}
{const _sw=selectWord;selectWord=function(w){const r=_sw.apply(this,arguments);try{if(S&&!S._wordStart)S._wordStart=performance.now()}catch(e){}return r}}
function lotwChip(){const bar=document.getElementById("cluebar");if(!bar||!S||prefs.lotw===false)return;let c=document.getElementById("lotwChip");
  if(!c){c=document.createElement("span");c.id="lotwChip";c.className="lotw-chip";bar.appendChild(c)}c.textContent=lotw();c.title=`Letter of the week: +10 for every ${lotw()} in a solved word`;c.setAttribute("aria-label",c.title);c.hidden=S.phase!=="cross"}
{const _ra=renderAll;renderAll=function(){const r=_ra.apply(this,arguments);try{lotwChip()}catch(e){}return r}}
function abcHTML(){const y=new Date().getFullYear(),have=(stats.abc||{})[y]||"";return`<div class="abc" role="img" aria-label="${have.length} letters collected this year">${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(ch=>`<span class="${have.includes(ch)?"on":LOTW_POOL.includes(ch)?"":"na"}${ch===lotw()?" now":""}">${ch}</span>`).join("")}</div>
  <p class="pp-note">This week's letter is <b>${lotw()}</b>: every ${lotw()} in a word you solve is worth +10. Solve one to collect it.</p>`}

/* ---------- 157: a tap you can feel when you type; 158: bigger clues (Settings) ---------- */
{const _tl=typeLetter;typeLetter=function(){const r=_tl.apply(this,arguments);if(prefs.typeHap)hap("light");return r}}


/* ---------- 159: high-contrast well; 160: break nudge ---------- */
function applyLook148(){const h=document.documentElement;h.classList.toggle("bigclue",!!prefs.bigClue);h.classList.toggle("hcwell",!!prefs.hcWell)}
let playMsToday=0;
setInterval(()=>{if(!S||document.visibilityState!=="visible"||S.paused||S.phase==="done"||S.phase==="over")return;const dk=todayKey();stats.pt=stats.pt||{};stats.pt[dk]=(stats.pt[dk]||0)+5000;
  const ks=Object.keys(stats.pt).sort();if(ks.length>40)ks.slice(0,ks.length-40).forEach(k=>delete stats.pt[k]);
  S._sess=(S._sess||0)+5000;window._sessMs=(window._sessMs||0)+5000;
  if(prefs.breakNudge!==false&&window._sessMs>=45*60000&&!window._nudged){window._nudged=1;breakNudge()}},5000);
function breakNudge(){const t=document.getElementById("toast");const box=document.createElement("div");box.className="nudge";box.setAttribute("role","status");
  box.innerHTML=`<span>You've been playing for 45 minutes. Time for a stretch?</span><button class="ghost-btn sm" id="ndBreath">Take a breath</button><button class="nd-x" aria-label="Dismiss">✕</button>`;document.body.appendChild(box);
  box.querySelector("#ndBreath").onclick=()=>{box.remove();if(S&&S.phase==="drop")pauseWell();openBreath()};box.querySelector(".nd-x").onclick=()=>box.remove();setTimeout(()=>box.remove(),20000)}

/* ---------- 161, 162, 177: time played; today on the profile ---------- */
function fmtMin(ms){const m=Math.round(ms/60000);return m<60?`${m} min`:`${Math.floor(m/60)} h ${m%60} min`}
function weekTimeHTML(){const t=todayKey(),days=[...Array(7)].map((_,i)=>addDays(t,i-6)),v=days.map(d=>(stats.pt||{})[d]||0),mx=Math.max(60000,...v);
  return`<div class="wt" role="img" aria-label="Time played over the last 7 days: ${fmtMin(v.reduce((a,b)=>a+b,0))}">${days.map((d,i)=>`<span><i style="height:${Math.round(v[i]/mx*100)}%"></i><small>${new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"narrow"})}</small></span>`).join("")}</div>
   <p class="pp-note">${fmtMin(v.reduce((a,b)=>a+b,0))} this week.</p>`}
function todayHTML(){const t=todayKey(),g=stats.games.filter(x=>dayKeyOf(new Date(x.t))===t),pts=g.reduce((a,x)=>a+(x.score||0),0),ms=(stats.pt||{})[t]||0,st=g.reduce((a,x)=>a+(x.stars||0),0);
  return`<div class="pp-today"><div><b>${g.length}</b><span>puzzle${g.length===1?"":"s"}</span></div><div><b>${st}★</b><span>stars</span></div><div><b>${fmtN(pts)}</b><span>points</span></div><div><b>${fmtMin(ms)}</b><span>played</span></div></div>`}

/* ---------- 163–167: words per minute, quickest and toughest word, trouble words ---------- */
function resWordsHTML(){if(!S||!S._wt||S.tut)return"";const e=Object.entries(S._wt).filter(([,t])=>t>300);if(e.length<2)return"";e.sort((a,b)=>a[1]-b[1]);
  const q=e[0],h=e[e.length-1],mins=(S.crossMs||e.reduce((a,[,t])=>a+t,0))/60000,wpm=mins>0?Math.round(e.length/mins*10)/10:0;
  stats.tough=stats.tough||{};if(h[1]>15000){stats.tough[h[0]]=(stats.tough[h[0]]||0)+1;const ks=Object.keys(stats.tough);if(ks.length>40)delete stats.tough[ks[0]]}
  return`<div class="rw-line"><span>${ti("bolt")} ${wpm} words a minute</span><span>Quickest: <b>${esc(q[0])}</b> ${Math.max(1,Math.round(q[1]/1000))}s</span><span>Toughest: <b>${esc(h[0])}</b> ${Math.round(h[1]/1000)}s <button class="ghost-btn sm" id="rwStudy" data-w="${esc(h[0])}">Study it</button></span></div>`}
{const _shr4=showResult;showResult=function(){const r=_shr4.apply(this,arguments);try{const el=document.getElementById("result"),p=el&&(el.querySelector(".rx-line")||el.querySelector(".pts"));
  if(p&&!el.querySelector(".rw-line")){const h=resWordsHTML();if(h){p.insertAdjacentHTML("afterend",h);document.getElementById("rwStudy").onclick=e=>{studyWord(e.currentTarget.dataset.w);e.currentTarget.disabled=true;e.currentTarget.textContent="Added"}}}}catch(e){console.error(e)}return r}}
function studyWord(w){stats.bank=stats.bank||{};if(stats.bank[w]){stats.bank[w].box=0;stats.bank[w].sl=1}saveStats();toast(`${w} added to your review`)}
function troubleHTML(){const t=Object.entries(stats.tough||{}).filter(([w])=>(stats.bank||{})[w]).sort((a,b)=>b[1]-a[1]).slice(0,8);if(!t.length)return"";
  return`<div class="pp-words">${t.map(([w])=>`<span class="pp-word tough">${esc(w)}</span>`).join("")}</div><div class="pp-row"><button class="ghost-btn sm" id="pfTough">Study these</button></div>`}

/* ---------- 168, 169: home tiles for your next goal and a category you've missed ---------- */
function missedCat(){const owned=CATEGORIES.filter(c=>!lockReason(LEVELS.find(l=>l.cat===c.name)||{}));const last={};stats.games.forEach(g=>{if(!last[g.cat]||g.t>last[g.cat])last[g.cat]=g.t});
  const old=owned.filter(c=>last[c.name]&&Date.now()-last[c.name]>14*864e5).sort((a,b)=>last[a.name]-last[b.name]);return old[0]?{name:old[0].name,days:Math.floor((Date.now()-last[old[0].name])/864e5)}:null}
function nextGoal(){const L=levelOf(xpTotal()),ds=dailyStreak();const sm=[7,30,100,365].find(x=>x>ds.n);if(ds.alive&&sm&&sm-ds.n<=3)return{t:`${sm-ds.n} Dail${sm-ds.n===1?"y":"ies"} to a ${sm}-day streak`,s:"Keep it going"};
  if(L.toNext<=500)return{t:`${fmtN(L.toNext)} XP to level ${L.lv+1}`,s:"One puzzle could do it"};const cm=closestMedal();if(cm&&cm.f>=.6)return{t:`${cm.a.name}: ${fmtN(cm.goal-cm.v)} to go`,s:ACH_TIER[cm.tier]+" medal"};return null}
{const _htH=homeTilesHTML;homeTilesHTML=function(){let h=_htH.apply(this,arguments);const add=[];const g=nextGoal();if(g)add.push(`<div class="ht ht-goal"><span class="ht-k">Your next goal</span><b>${esc(g.t)}</b><span>${esc(g.s)}</span></div>`);
  const m=missedCat();if(m){const li=LEVELS.findIndex(l=>l.cat===m.name&&!((store[l.id]||{}).stars));add.push(`<button class="ht ht-miss" id="htMiss" data-li="${li>=0?li:LEVELS.findIndex(l=>l.cat===m.name)}"><span class="ht-k">It's been ${m.days} days</span><b>Back to ${esc(m.name)}?</b><span>Pick up where you left off</span></button>`)}
  if(!add.length)return h;if(!h)return`<div class="home-tiles" id="homeTiles">${add.join("")}</div>`;return h.replace(/<\/div>$/,add.join("")+"</div>")}}
{const _rdc3=renderDailyCard;renderDailyCard=function(){const r=_rdc3.apply(this,arguments);try{const b=document.getElementById("htMiss");if(b)b.onclick=()=>startLevel(+b.dataset.li)}catch(e){}return r}}

/* ---------- 170: Daily days glow gold in your week ---------- */
{const _wd=weekDotsHTML;weekDotsHTML=function(){let h=_wd.apply(this,arguments);const t=todayKey(),days=[...Array(7)].map((_,i)=>addDays(t,i-6));let i=0;
  h=h.replace(/<span class="([^"]*)"><i><\/i>/g,(m,c)=>{const d=days[i++];return dailyRecord(d)?`<span class="${c} dly"><i></i>`:m});return h.replace('aria-label="Played on','aria-label="Gold days had a Daily. Played on')}}

/* ---------- 171–173: medals ---------- */
let ach4Done=false;
function ach4Init(){if(ach4Done)return;ach4Done=true;ACH.push({id:"collector",name:"Collector",ic:"star",unit:"stickers",t:[5,20,40],v:()=>stickerCount()},
  {id:"alphabet",name:"Alphabet",ic:"cards",unit:"letters this year",t:[3,10,19],v:()=>((stats.abc||{})[new Date().getFullYear()]||"").length},
  {id:"calm",name:"Calm Mind",ic:"moon",unit:"guided breaths",t:[1,10,30],v:()=>stats.breaths||0});
  if(stats.achInit&&!stats.ach4Init){stats.ach=stats.ach||{};ACH.slice(-3).forEach(a=>{let v=0;try{v=a.v()}catch(e){}let t=0;a.t.forEach((n,i)=>{if(v>=n)t=i+1});stats.ach[a.id]=Math.max(stats.ach[a.id]||0,t)})}stats.ach4Init=1}
{const _ac4=achCheck;achCheck=function(){ach4Init();return _ac4.apply(this,arguments)}}

/* ---------- 174–176: a better pause card ---------- */
{const _pw=pauseWell;pauseWell=function(){_pw.apply(this,arguments);const card=document.querySelector("#pauseOv .pause-card");if(!card||!S||card.querySelector(".pz-stats"))return;
  card.querySelector(".sub").insertAdjacentHTML("afterend",`<div class="pz-stats"><span><b>${S.linesCleared||0}</b> rows</span><span><b>LV ${wellLevel()}</b></span><span><b>${S.queue.length+(S.active?1:0)}</b> pieces left</span></div>
    <div class="pz-tog"><button class="ghost-btn sm" id="pzSound" aria-pressed="${!muted}">${muted?"Sound off":"Sound on"}</button><button class="ghost-btn sm" id="pzHap" aria-pressed="${!!prefs.haptics}">${prefs.haptics?"Haptics on":"Haptics off"}</button></div>`);
  card.insertAdjacentHTML("beforeend",`<button class="ghost-btn" id="pzRestart">Restart puzzle</button>`);
  document.getElementById("pzSound").onclick=e=>{const mb=document.getElementById("muteBtn");if(mb)mb.click();e.currentTarget.textContent=muted?"Sound off":"Sound on";e.currentTarget.setAttribute("aria-pressed",!muted)};
  document.getElementById("pzHap").onclick=e=>{prefs.haptics=!prefs.haptics;savePrefsQuiet();e.currentTarget.textContent=prefs.haptics?"Haptics on":"Haptics off";e.currentTarget.setAttribute("aria-pressed",!!prefs.haptics)};
  const rb=document.getElementById("pzRestart");rb.onclick=()=>{if(!rb.dataset.sure){rb.dataset.sure=1;rb.textContent="Tap again to restart";return}document.getElementById("pauseOv").hidden=true;const L=S.li>=0?S.li:S.L;S=null;startLevel(L)}}}

/* ---------- profile additions ---------- */
{const _rp5=renderProfile;renderProfile=function(){_rp5.apply(this,arguments);const el=document.getElementById("profile");if(!el)return;stickerCheck(true);
  const sec=(t,b,id)=>`<section class="pp-sec" ${id?`id="${id}"`:""}><h2 class="pp-h">${t}</h2>${b}</section>`;
  const big=el.querySelector(".pp-big");if(big)big.insertAdjacentHTML("beforebegin",sec("Today",todayHTML()));
  const how=[...el.querySelectorAll(".pp-sec")].find(s=>(s.querySelector(".pp-h")||{}).textContent.startsWith("How you play"));
  if(how)how.insertAdjacentHTML("beforeend",`<h3 class="pp-h3">Time played</h3>${weekTimeHTML()}`);
  const n=stickerCount(),last=Object.entries(stats.stk||{}).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const recs=[...el.querySelectorAll(".pp-sec")].find(s=>(s.querySelector(".pp-h")||{}).textContent.startsWith("Personal records"));
  const albumH=sec(`Sticker album <small>${n}/${CATEGORIES.length*STK_TIERS.length}</small>`,(last.length?`<div class="al-st mini">${last.map(([k])=>{const [c,t]=k.split(":");return`<div class="stk on" role="img" aria-label="${esc(c)}, ${STK_TIERS[+t][0]}">${stickerSVG(c,+t,true)}<small>${esc(c)}</small></div>`}).join("")}</div>`:`<p class="pp-empty">Win a puzzle to get your first sticker.</p>`)+`<div class="pp-row"><button class="ghost-btn sm" id="pfAlbum">Open album</button></div>`);
  const abc=sec(`Letter of the week <small>${lotw()}</small>`,abcHTML());const tr=troubleHTML();
  const anchor=recs||how;if(anchor)anchor.insertAdjacentHTML("afterend",albumH+abc+(tr?sec("Words that gave you trouble",tr):""));
  const on=(id,f)=>{const x=document.getElementById(id);if(x)x.onclick=f};on("pfAlbum",openAlbum);
  on("pfTough",()=>{Object.keys(stats.tough||{}).forEach(w=>{if((stats.bank||{})[w]){stats.bank[w].box=0;stats.bank[w].sl=1}});saveStats();toast("Added to your review");try{openReview()}catch(e){}})}}

/* ---------- hooks ---------- */
{const _rg7=recordGame;recordGame=function(win){const r=_rg7.apply(this,arguments);try{if(S&&!S.tut&&!S.dropOnly){stickerCheck(false);saveStats()}}catch(e){console.error(e)}return r}}
{const _sl6=startLevel;startLevel=function(){const r=_sl6.apply(this,arguments);try{if(S){S._wt={};S._wordStart=0}}catch(e){}return r}}
{const _rpi6=renderPaceInfo;renderPaceInfo=function(){_rpi6.apply(this,arguments);const a=document.getElementById("a11ySlot");if(!a||a.querySelector("#setGhostL"))return;
  const sw=(id,on,t,d)=>`<button class="setrow" role="switch" id="${id}" aria-checked="${on}"><span><span class="st-t">${t}</span><br><span class="st-d">${d}</span></span><span class="sw"></span></button>`;
  a.insertAdjacentHTML("beforeend",sw("setGhostL",prefs.ghostLetters!==false,"Letters in the landing guide","See each letter where it will land.")+sw("setHcWell",!!prefs.hcWell,"High-contrast well","Bolder colours and outlines for pieces.")+
    sw("setBigClue",!!prefs.bigClue,"Bigger clues","Larger clue text while you solve.")+sw("setTypeHap",!!prefs.typeHap,"Feel each letter","A light tap when you type a letter.")+
    sw("setLotw",prefs.lotw!==false,"Letter of the week","Bonus points for this week's letter.")+sw("setNudge",prefs.breakNudge!==false,"Break reminder","A gentle nudge after 45 minutes."));
  [["setGhostL","ghostLetters",1],["setHcWell","hcWell",0],["setBigClue","bigClue",0],["setTypeHap","typeHap",0],["setLotw","lotw",1],["setNudge","breakNudge",1]].forEach(([id,k,def])=>{const b=document.getElementById(id);
    b.onclick=()=>{prefs[k]=def?prefs[k]===false:!prefs[k];b.setAttribute("aria-checked",def?prefs[k]!==false:!!prefs[k]);applyLook148();savePrefsQuiet();try{if(S)renderAll()}catch(e){}}})}}
try{applyLook148();stickerCheck(true)}catch(e){}
