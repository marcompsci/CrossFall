/* ================= Phases 178–207 (20 Nov 2026, late) ================= */

/* ---------- 178–181, 206: find a puzzle ---------- */
let findF="all";
function findMatches(q){q=(q||"").trim().toLowerCase();return LEVELS.map((l,i)=>({l,i,s:(store[l.id]||{}).stars||0,played:!!store[l.id]})).filter(x=>!x.l.daily&&!x.l.custom&&x.l.name&&x.l.cat)
  .filter(x=>!q||x.l.name.toLowerCase().includes(q)||x.l.cat.toLowerCase().includes(q)||((x.l.words||[]).some(w=>(w[0]||"").toLowerCase()===q)))
  .filter(x=>findF==="all"||(findF==="new"&&!x.played)||(findF==="partial"&&x.s>0&&x.s<3)||(findF==="done"&&x.s===3))}
function recentPlayed(){const seen=new Set(),out=[];for(const g of stats.games){if(g.daily||!g.id||seen.has(g.id))continue;seen.add(g.id);const i=LEVELS.findIndex(l=>l.id===g.id);if(i>=0)out.push({l:LEVELS[i],i,s:(store[g.id]||{}).stars||0});if(out.length>=5)break}return out}
function findRow(x){const lk=lockReason(x.l);return`<button class="arow fp-row${lk?" locked":""}" data-fi="${x.i}" ${lk?'aria-disabled="true"':""}><span><b>${esc(x.l.name)}</b><span class="sub">${esc(x.l.cat)}${lk?" · locked":""}</span></span><span class="fp-st" aria-label="${x.s} stars">${"★".repeat(x.s)}${"☆".repeat(3-x.s)}</span></button>`}
function openFind(q){const el=document.getElementById("evh");
  el.innerHTML=`<h1>FIND A <span>PUZZLE</span></h1><input type="search" id="fpQ" class="fp-q" placeholder="Name, category or a word you remember" aria-label="Find a puzzle" autocomplete="off" spellcheck="false" value="${esc(q||"")}">
   <div class="seg" role="radiogroup" aria-label="Show" id="fpF">${[["all","All"],["new","Not played"],["partial","1–2 stars"],["done","3 stars"]].map(([k,l])=>`<button role="radio" data-ff="${k}" aria-checked="${findF===k}">${l}</button>`).join("")}</div>
   <div id="fpRecent"></div><p class="sub" id="fpN" role="status"></p><div class="alist" id="fpList"></div>
   <div class="btns wide"><button class="ghost-btn" id="fpRand">Surprise me from these</button><button class="big" id="evDone">Done</button></div>`;
  el.hidden=false;el.scrollTop=0;const inp=document.getElementById("fpQ");
  const draw=()=>{const v=inp.value,m=findMatches(v),rc=recentPlayed();document.getElementById("fpRecent").innerHTML=!v&&findF==="all"&&rc.length?`<h2 class="hh">Recently played</h2><div class="alist">${rc.map(findRow).join("")}</div><h2 class="hh">All puzzles</h2>`:"";
    document.getElementById("fpN").textContent=`${m.length} puzzle${m.length===1?"":"s"}`;document.getElementById("fpList").innerHTML=m.slice(0,80).map(findRow).join("")+(m.length>80?`<p class="sub">Showing the first 80. Type to narrow it down.</p>`:"");
    el.querySelectorAll("[data-fi]").forEach(b=>b.onclick=()=>{const l=LEVELS[+b.dataset.fi];const lk=lockReason(l);if(lk){toast(typeof lk==="string"?lk:"That one is locked");return}closeEvents();startLevel(+b.dataset.fi)});
    document.getElementById("fpRand").disabled=!m.some(x=>!lockReason(x.l))};
  inp.oninput=draw;el.querySelectorAll("[data-ff]").forEach(b=>b.onclick=()=>{findF=b.dataset.ff;el.querySelectorAll("[data-ff]").forEach(x=>x.setAttribute("aria-checked",x===b));draw()});
  document.getElementById("fpRand").onclick=()=>{const m=findMatches(inp.value).filter(x=>!lockReason(x.l));if(!m.length)return;const x=m[Math.floor(Math.random()*m.length)];closeEvents();startLevel(x.i)};
  document.getElementById("evDone").onclick=closeEvents;draw()}
function findLink(){const dh=document.querySelector("#pgPlay .deckhead");if(!dh||document.getElementById("findLink"))return;dh.insertAdjacentHTML("beforeend",`<button class="ghost-btn sm" id="findLink">${ti("puzzle")} Find</button>`);document.getElementById("findLink").onclick=()=>openFind()}

/* ---------- 182–184: the monthly challenge ---------- */
const MC_GOALS=[["stars",45,"Earn 45 stars"],["games",20,"Finish 20 puzzles"],["words",120,"Solve 120 words"],["gold",8,"Get 8 gold solves"]];
function mcFor(ym){const n=ym.split("-").join("")|0;return MC_GOALS[n%MC_GOALS.length]}
function mcProgress(ym){ym=ym||monKey(Date.now());const [k,goal,label]=mcFor(ym),M=(stats.mon||{})[ym]||{};let v=0;
  if(k==="stars")v=stats.games.filter(g=>monKey(g.t)===ym&&!g.practice).reduce((a,g)=>a+(g.stars||0),0)+((stats.mcExtra||{})[ym]||0);else v=M[k]||0;return{ym,k,goal,label,v:Math.min(v,goal),done:v>=goal}}
function mcCheck(){const p=mcProgress();stats.mcDone=stats.mcDone||[];if(p.done&&!stats.mcDone.includes(p.ym)){stats.mcDone.push(p.ym);const mn=new Date(p.ym+"-15").toLocaleDateString("en-US",{month:"long"});
  stats.badges=stats.badges||{};stats.badges["mc-"+p.ym]=Date.now();queueCele({kind:"xp",title:`${mn} challenge done`,sub:`${p.label}. A badge is on your profile.`});giveXP(750,mn+" challenge");saveStats()}}
function mcHTML(){const p=mcProgress(),mn=new Date(p.ym+"-15").toLocaleDateString("en-US",{month:"long"}),left=Math.ceil((new Date(new Date().getFullYear(),new Date().getMonth()+1,1)-Date.now())/864e5);
  return`<div class="ht ht-mc${p.done?" done":""}"><span class="ht-k">${mn} challenge</span><b>${esc(p.label)}</b><span class="pp-bar" aria-hidden="true"><i style="width:${Math.round(p.v/p.goal*100)}%"></i></span><span>${p.done?"Done! +750 XP and a badge":`${p.v} of ${p.goal} · ${left} day${left===1?"":"s"} left`}</span></div>`}

/* ---------- 185: show the letters you have so far; 189: say the word when it's solved ---------- */
{const _rcl=renderClue;renderClue=function(){const r=_rcl.apply(this,arguments);try{if(prefs.cluePat&&S&&S.phase==="cross"){const w=curWord(),n=document.getElementById("clueNum");if(w&&n){const pat=w.cells.map(k=>S.cw.cells.get(k).val||"_").join(" ");if(pat.includes("_")&&!/[A-Z]/.test(pat.replace(/_/g,"")))return r;n.textContent+=` · ${pat}`}}}catch(e){}return r}}
{const _cw3=checkWords;checkWords=function(cell){if(!S||!prefs.sayWord)return _cw3.apply(this,arguments);const before=S.cw.words.filter(w=>w.solved).length;const r=_cw3.apply(this,arguments);
  try{const now=S.cw.words.filter(w=>w.solved);if(now.length>before){const w=now.find(w=>!w._said);if(w){w._said=1;setTimeout(()=>speakText(w.ans.toLowerCase()),250)}}}catch(e){}return r}}

/* ---------- 186 bold focus, 187/188 tint, 199 well skins ---------- */
const SKINS=[["classic","Classic"],["paper","Paper"],["neon","Neon"],["stone","Stone"]];
function tintNow(){const t=prefs.tint||"none";if(t==="auto"){const h=new Date().getHours();return h>=21||h<6?"warm":"none"}return t}
function applyLook178(){const h=document.documentElement;h.classList.toggle("boldfocus",!!prefs.boldFocus);["warm","cool"].forEach(t=>h.classList.toggle("tint-"+t,tintNow()===t));
  SKINS.forEach(([k])=>h.classList.toggle("skin-"+k,(prefs.skin||"classic")===k&&k!=="classic"))}
setInterval(()=>{if(prefs.tint==="auto")applyLook178()},60000);

/* ---------- 190–192: your month and your year ---------- */
function monthGridHTML(){const n=new Date(),y=n.getFullYear(),m=n.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),pad=(first.getDay()+6)%7,set=new Set(stats.days||[]),t=todayKey();
  let h=`<div class="mg" role="img" aria-label="${n.toLocaleDateString("en-US",{month:"long"})}: played on ${[...Array(days)].filter((_,i)=>set.has(dayKeyOf(new Date(y,m,i+1)))).length} days">`;
  ["M","T","W","T","F","S","S"].forEach(d=>h+=`<small>${d}</small>`);for(let i=0;i<pad;i++)h+="<span class=\"x\"></span>";
  for(let d=1;d<=days;d++){const k=dayKeyOf(new Date(y,m,d));h+=`<span class="${set.has(k)?"on":""}${dailyRecord(k)?" dly":""}${k===t?" now":""}${k>t?" fut":""}">${d}</span>`}return h+"</div>"}
function yearData(){const y=String(new Date().getFullYear()),A={games:0,wins:0,score:0,words:0,gold:0};Object.entries(stats.mon||{}).forEach(([k,M])=>{if(k.startsWith(y))Object.keys(A).forEach(f=>A[f]+=M[f]||0)});
  A.days=(stats.days||[]).filter(d=>d.startsWith(y)).length;A.stickers=Object.values(stats.stk||{}).filter(t=>new Date(t).getFullYear()==y).length;A.letters=((stats.abc||{})[y]||"").length;return A}
function yearHTML(){const A=yearData(),it=(v,l)=>`<div class="pp-stat"><b>${fmtN(v)}</b><span>${l}</span></div>`;
  return`<div class="pp-stats">${it(A.games,"puzzles")}${it(A.words,"words solved")}${it(A.days,"days played")}${it(A.score,"points")}</div><div class="pp-row"><button class="ghost-btn sm" id="pfYear">Share my year so far</button></div>`}
function shareYear(){const A=yearData(),y=new Date().getFullYear();shareOut(`My ${y} in Crossfall so far\n🧩 ${fmtN(A.games)} puzzles · ${fmtN(A.words)} words\n📅 ${A.days} days played · ⭐ ${fmtN(A.score)} points\n🏷️ ${A.stickers} stickers · 🔤 ${A.letters} letters collected`)}

/* ---------- 193–195: streak flame, avatar frames, name counter ---------- */
function avFrame(lv){return lv>=50?"gold":lv>=25?"silver":lv>=10?"bronze":""}
{const _rp6=renderProfile;renderProfile=function(){_rp6.apply(this,arguments);const el=document.getElementById("profile");if(!el)return;
  const fire=el.querySelector(".pp-tile.fire");if(fire&&dailyStreak().n>=3)fire.classList.add("lit");
  const L=levelOf(xpTotal()),fr=avFrame(L.lv),av=el.querySelector(".pp-top .pf-av");if(av){av.classList.remove("fr-bronze","fr-silver","fr-gold");if(fr){av.classList.add("fr-"+fr);av.setAttribute("aria-label",`Change avatar and title. ${fr[0].toUpperCase()+fr.slice(1)} frame for level ${L.lv}`)}}
  const ni=document.getElementById("nickIn");if(ni&&!document.getElementById("nickLeft")){ni.insertAdjacentHTML("afterend",`<span class="nick-left" id="nickLeft" aria-live="polite"></span>`);const up=()=>{const n=16-ni.value.length;document.getElementById("nickLeft").textContent=n<=5?`${n} left`:""};ni.addEventListener("input",up);up()}
  const sec=(t,b)=>`<section class="pp-sec"><h2 class="pp-h">${t}</h2>${b}</section>`;
  const today=[...el.querySelectorAll(".pp-sec")].find(s=>(s.querySelector(".pp-h")||{}).textContent==="Today");
  const mn=new Date().toLocaleDateString("en-US",{month:"long"});
  if(today)today.insertAdjacentHTML("afterend",sec(`${mn}`,monthGridHTML()+`<div class="mc-wrap">${mcHTML()}</div>`));
  const done=(stats.mcDone||[]).slice().sort();const albumSec=[...el.querySelectorAll(".pp-sec")].find(s=>(s.querySelector(".pp-h")||{}).textContent.startsWith("Sticker album"));
  const yH=sec(`${new Date().getFullYear()} so far`,yearHTML()+(done.length?`<p class="pp-note">Monthly challenges done: ${done.map(ym=>new Date(ym+"-15").toLocaleDateString("en-US",{month:"short"})).join(", ")}</p>`:""));
  (albumSec||today||el.lastElementChild).insertAdjacentHTML(albumSec?"beforebegin":"afterend",yH);
  const b=document.getElementById("pfYear");if(b)b.onclick=shareYear}}

/* ---------- 196–198: results ---------- */
{const _rg8=recordGame;recordGame=function(win){let x0=0;try{x0=xpTotal()}catch(e){}const r=_rg8.apply(this,arguments);try{if(S){S._xpGain=Math.max(0,xpTotal()-x0);mcCheck()}}catch(e){}return r}}
{const _shr5=showResult;showResult=function(){const r=_shr5.apply(this,arguments);try{const el=document.getElementById("result");if(!el||!S||el.querySelector(".rs-extra"))return r;const bits=[];
    if(S._xpGain>0)bits.push(`<span class="xpg">+${fmtN(S._xpGain)} XP</span>`);
    if(S.L.daily&&!S.L.archive){const ds=dailyStreak();if(ds.n>0)bits.push(`<span>${ti("fire")} Daily streak: <b>${ds.n} day${ds.n===1?"":"s"}</b></span>`)}
    const p=mcProgress();if(!p.done)bits.push(`<span>${esc(new Date(p.ym+"-15").toLocaleDateString("en-US",{month:"long"}))}: ${p.v}/${p.goal}</span>`);
    const at=el.querySelector(".rw-line")||el.querySelector(".rx-line")||el.querySelector(".pts");if(at&&bits.length)at.insertAdjacentHTML("afterend",`<div class="rs-extra">${bits.join("")}</div>`)}catch(e){console.error(e)}return r}}
document.addEventListener("keydown",e=>{const res=document.getElementById("result");if(!res||res.hidden||e.metaKey||e.ctrlKey||e.altKey||(e.target&&e.target.closest&&e.target.closest("input,textarea")))return;
  const k=e.key.toLowerCase();if(k==="n"){const b=document.getElementById("nextCat");if(b){e.preventDefault();b.click()}}else if(k==="r"){const b=[...res.querySelectorAll("button")].find(x=>/^(Play again|Try again|Retry)/i.test(x.textContent.trim()));if(b){e.preventDefault();b.click()}}});

/* ---------- 201: last piece; 202: pause tips ---------- */
const PZ_TIPS=["Hold a piece with ⇄ to save it for a better spot.","Rows that will clear light up while you aim.","Flick down on the well to slam a piece.","Words hidden in a cleared row score a Word Link.","Turning a piece right before a clear scores a Spin Clear.","A letter landing on the same letter is a Letter Match.","Clear four rows at once for a CROSSFALL.","This week's letter is worth +10 in every word you solve."];
{const _pw2=pauseWell;pauseWell=function(){_pw2.apply(this,arguments);const card=document.querySelector("#pauseOv .pause-card");if(!card||card.querySelector(".pz-tip"))return;const t=PZ_TIPS[Math.floor(Math.random()*PZ_TIPS.length)];
  const before=card.querySelector("#pzResume");if(before)before.insertAdjacentHTML("beforebegin",`<p class="pz-tip">${ti("star")}<span><b>Tip:</b> ${esc(t)}</span></p>`)}}
{const _rq=renderQueue;renderQueue=function(){const r=_rq.apply(this,arguments);try{const q=document.getElementById("queue");if(q&&S)q.classList.toggle("last",S.phase==="drop"&&!S.queue.length&&!!S.active)}catch(e){}return r}}

/* ---------- 203 + 207: a word to know ---------- */
function wordToKnow(){const b=Object.entries(stats.bank||{}).filter(([w,v])=>v&&v.c);if(b.length<5)return null;const d=todayKey().split("-").join("")|0;b.sort((a,c)=>a[0]<c[0]?-1:1);const [w,v]=b[d%b.length];return{w,c:v.c}}
{const _htH2=homeTilesHTML;homeTilesHTML=function(){let h=_htH2.apply(this,arguments)||"";const wk=wordToKnow();if(!wk||prefs.wtk===false)return h;
  const tile=`<div class="ht ht-wtk" id="htWtk"><span class="ht-k">From your word bank</span><span class="wtk-c">${esc(wk.c)}</span><b class="wtk-a" id="wtkA" hidden>${esc(wk.w)}</b><span class="wtk-btns"><button class="ghost-btn sm" id="wtkShow">Show the word</button></span></div>`;
  if(!h)return`<div class="home-tiles" id="homeTiles">${tile}</div>`;return h.replace(/<\/div>$/,tile+"</div>")}}
{const _rdc4=renderDailyCard;renderDailyCard=function(){const r=_rdc4.apply(this,arguments);try{const ht=document.getElementById("homeTiles"),box=document.getElementById("dailyCard");
    if(ht&&!ht.querySelector(".ht-mc"))ht.insertAdjacentHTML("afterbegin",mcHTML());else if(!ht&&box){const at=box.querySelector(".dc-next")||box.querySelector(".dc-btns");if(at)at.insertAdjacentHTML("afterend",`<div class="home-tiles" id="homeTiles">${mcHTML()}</div>`)}
    const sb=document.getElementById("wtkShow");if(sb)sb.onclick=()=>{const wk=wordToKnow();document.getElementById("wtkA").hidden=false;sb.closest(".wtk-btns").innerHTML=`<button class="ghost-btn sm" id="wtkGot">I knew it</button><button class="ghost-btn sm" id="wtkStudy">Study it</button>`;
      document.getElementById("wtkGot").onclick=()=>{stats.wtkOk=(stats.wtkOk||0)+1;saveStats();toast("Nice!");document.getElementById("htWtk").classList.add("ok")};document.getElementById("wtkStudy").onclick=()=>{studyWord(wk.w);document.getElementById("htWtk").classList.add("ok")}};
    findLink()}catch(e){console.error(e)}return r}}

/* ---------- 204: reset the look settings; settings rows ---------- */
const LOOK_KEYS=["bigWell","clearHint","countdown","ghost","wellGrid","lefty","spaced","noFlash","quiet","autoPause","ghostLetters","hcWell","bigClue","typeHap","lotw","breakNudge","cluePat","sayWord","boldFocus","tint","skin","heroCol","catSort","ppFold"];
{const _rpi7=renderPaceInfo;renderPaceInfo=function(){_rpi7.apply(this,arguments);const a=document.getElementById("a11ySlot");if(!a||a.querySelector("#setSkin"))return;
  const sw=(id,on,t,d)=>`<button class="setrow" role="switch" id="${id}" aria-checked="${on}"><span><span class="st-t">${t}</span><br><span class="st-d">${d}</span></span><span class="sw"></span></button>`;
  const seg=(id,lab,d,opts,cur,key)=>`<div class="setgroup"><span class="st-t">${lab}</span><span class="st-d">${d}</span><div class="seg" role="radiogroup" aria-label="${lab}" id="${id}">${opts.map(([k,l])=>`<button role="radio" data-${key}="${k}" aria-checked="${cur===k}">${l}</button>`).join("")}</div></div>`;
  a.insertAdjacentHTML("beforeend",seg("setSkin","Well tiles","The look of the letters in the well.",SKINS,prefs.skin||"classic","sk")+`<div class="skin-prev" id="skinPrev" aria-hidden="true">${[..."CROSS"].map(c=>`<span class="wc f">${c}</span>`).join("")}</div>`+
    seg("setTint","Screen tint","A warm tint is easier on the eyes at night.",[["none","Off"],["warm","Warm"],["cool","Cool"],["auto","Warm at night"]],prefs.tint||"none","tn")+
    sw("setPat",!!prefs.cluePat,"Show letters so far","Adds the letters you've placed, like S _ R _ N T, to the clue.")+sw("setSay",!!prefs.sayWord,"Say each solved word","Reads a word aloud when you solve it.")+
    sw("setFocus",!!prefs.boldFocus,"Bold focus ring","A thicker outline on the selected square and buttons.")+sw("setWtk",prefs.wtk!==false,"Word to know","A word from your bank on the Play screen.")+
    `<button class="setrow" id="setResetLook"><span><span class="st-t">Reset look and comfort settings</span><br><span class="st-d">Puts the switches above back to how they started. Your progress is kept.</span></span><span class="st-go" aria-hidden="true">↺</span></button>`);
  a.querySelectorAll("[data-sk]").forEach(b=>b.onclick=()=>{prefs.skin=b.dataset.sk;a.querySelectorAll("[data-sk]").forEach(x=>x.setAttribute("aria-checked",x===b));applyLook178();savePrefsQuiet()});
  a.querySelectorAll("[data-tn]").forEach(b=>b.onclick=()=>{prefs.tint=b.dataset.tn;a.querySelectorAll("[data-tn]").forEach(x=>x.setAttribute("aria-checked",x===b));applyLook178();savePrefsQuiet()});
  [["setPat","cluePat",0],["setSay","sayWord",0],["setFocus","boldFocus",0],["setWtk","wtk",1]].forEach(([id,k,def])=>{const b=document.getElementById(id);b.onclick=()=>{prefs[k]=def?prefs[k]===false:!prefs[k];b.setAttribute("aria-checked",def?prefs[k]!==false:!!prefs[k]);applyLook178();savePrefsQuiet();try{if(S)renderAll()}catch(e){}}});
  const rb=document.getElementById("setResetLook");rb.onclick=()=>{if(!rb.dataset.sure){rb.dataset.sure=1;rb.querySelector(".st-t").textContent="Tap again to reset";return}
    LOOK_KEYS.forEach(k=>delete prefs[k]);savePrefsQuiet();[applyWellLook,applyComfort2,applyLook148,applyLook178].forEach(f=>{try{f()}catch(e){}});toast("Look and comfort settings reset");
    const st=document.getElementById("settings");a.innerHTML="";try{renderPaceInfo()}catch(e){}if(st)st.scrollTop=0}}}

/* ---------- 205: What's New from the Menu ---------- */
function openWhatsNew(){stats.seen27=0;maybeWhatsNew()}

try{applyLook178()}catch(e){}
