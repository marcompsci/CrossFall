/* ================= Phases 83–102 (20 Nov 2026) ================= */
function wsSt(){stats.ws=stats.ws||{perfect:0,links:0,spins:0,matches:0,crossfall:0,bestLv:1};return stats.ws}

/* ---------- 83: see which rows a drop will clear; 84: danger zone; 101: combo meter; 102: pieces drop in ---------- */
function landingClears(){if(!S||!S.active||S.phase!=="drop")return[];let d=0;while(!collides(absCells(S.active,d+1,0)))d++;
  const cells=absCells(S.active,d,0);if(cells.some(x=>x.r<0))return[];const occ=new Set(cells.map(x=>x.r+","+x.c));
  const rows=[...new Set(cells.map(x=>x.r))];return rows.filter(r=>{for(let c=0;c<COLS;c++)if(!S.grid[r][c]&&!occ.has(r+","+c))return false;return true})}
function stackTop(){for(let r=0;r<ROWS;r++)if(S.grid[r].some(Boolean))return r;return ROWS}
function wellBadges(){const w=document.getElementById("wellWrap");if(!w||!S)return;let b=document.getElementById("wellCombo");
  if(!b){b=document.createElement("div");b.id="wellCombo";b.setAttribute("aria-hidden","true");w.appendChild(b)}
  const on=S.combo>1&&(S.phase==="drop"||S.phase==="anim");b.hidden=!on;if(on&&b.dataset.n!==String(S.combo)){b.dataset.n=S.combo;b.textContent="COMBO ×"+S.combo;b.classList.remove("bump");void b.offsetWidth;b.classList.add("bump")}}
{const _rw=renderWell;renderWell=function(){_rw.apply(this,arguments);if(!S)return;const well=document.getElementById("well");if(!well)return;
  const will=new Set(landingClears());well.querySelectorAll(".wc.willclear").forEach(d=>{if(!will.has(+d.dataset.r))d.classList.remove("willclear")});
  if(will.size&&prefs.clearHint!==false)will.forEach(r=>well.querySelectorAll(`.wc[data-r="${r}"]`).forEach(d=>d.classList.add("willclear")));
  const danger=(S.phase==="drop"||S.phase==="anim")&&!S.tut&&stackTop()<=Math.floor(ROWS*.3);well.classList.toggle("danger",danger);
  if(danger){const now=performance.now();if(!S._beatT||now-S._beatT>1100){S._beatT=now;try{blip(85,.09)}catch(e){}}if(!S._dangerSaid){S._dangerSaid=1;announce("Careful: the well is nearly full.")}}else S._dangerSaid=0;
  if(S.active&&S.spawnT&&performance.now()-S.spawnT<170&&!calmNow())well.querySelectorAll(".wc.p").forEach(d=>d.classList.add("spawn"));
  wellBadges()}}
{const _sp2=spawnPiece;spawnPiece=function(){const r=_sp2.apply(this,arguments);if(S){S.spawnT=performance.now();S.lastAct="spawn"}return r}}

/* ---------- 85: spin clears; 86: word links; 87: letter matches ---------- */
{const _mv2=move;move=function(){if(S)S.lastAct="move";return _mv2.apply(this,arguments)}}
{const _ro2=rotate;rotate=function(){const k=S&&S.active?JSON.stringify(S.active.cells):null;const r=_ro2.apply(this,arguments);if(S&&S.active&&JSON.stringify(S.active.cells)!==k)S.lastAct="rotate";return r}}
{const _sd2=softDrop;softDrop=function(){const r0=S&&S.active?S.active.r:null;const r=_sd2.apply(this,arguments);if(S&&S.active&&S.active.r!==r0)S.lastAct="move";return r}}
function rowWords(str){const out=[];const pool=w=>DICT.has(w)||(S&&S.cw&&S.cw.words.some(x=>x.ans===w));
  for(let L=Math.min(COLS,7);L>=4;L--)for(let i=0;i+L<=str.length;i++){const w=str.slice(i,i+L);if(/^[A-Z]+$/.test(w)&&pool(w)&&!out.some(o=>i<o.i+o.w.length&&o.i<i+L))out.push({w,i})}
  return out.map(o=>o.w).slice(0,2)}
{const _lk=lock;lock=function(){if(!S||!S.active)return _lk.apply(this,arguments);
  const cells=absCells(S.active),spin=S.lastAct==="rotate"&&cells.length>1;let match=0;
  cells.forEach(({r,c,ch})=>{const b=r+1<ROWS&&!cells.some(x=>x.r===r+1&&x.c===c)?S.grid[r+1][c]:null;if(b&&!b.g&&b.ch===ch)match++});
  const g=S.grid.map(row=>row.map(x=>x?x.ch:null));cells.forEach(({r,c,ch})=>{if(r>=0)g[r][c]=ch});const links=[];
  g.forEach(row=>{if(row.every(Boolean))rowWords(row.join("")).forEach(w=>links.push(w))});
  const r=_lk.apply(this,arguments);
  if(match&&!S.tut){addPts("match",20*match);wsSt().matches+=match;toast(match>1?`LETTER MATCH ×${match} +${20*match}`:"LETTER MATCH +20");try{blip(880,.04)}catch(e){}}
  if(g.some(row=>row.every(Boolean))){S._pendClear={spin,links}}
  return r}}
{const _as2=afterSettle;afterSettle=function(){if(S&&S._pendClear&&(S.linesCleared||0)>(S._lc2||0)){const p=S._pendClear,n=S.linesCleared-(S._lc2||0);S._pendClear=null;const W=wsSt();
    if(p.spin){addPts("spin",200*n);W.spins++;toast(`SPIN CLEAR +${200*n}`);try{popCall("SPIN!","clear")}catch(e){}}
    p.links.forEach(w=>{addPts("link",150);W.links++;toast(`WORD LINK: ${w} +150`);announce("Word link, "+w)});
    if(n>=4)W.crossfall++;if(S.grid.every(r=>r.every(c=>!c)))W.perfect++;W.bestLv=Math.max(W.bestLv||1,wellLevel())}
  if(S)S._lc2=S.linesCleared||0;return _as2.apply(this,arguments)}}

/* ---------- 88: 3-2-1 before the well starts again ---------- */
function resumeCountdown(){if(!S||S.phase!=="drop"||S.tut||!S.active||prefs.countdown===false)return;const el=document.getElementById("cdn")||(()=>{const d=document.createElement("div");d.id="cdn";d.setAttribute("role","status");document.getElementById("wellWrap").appendChild(d);return d})();
  S.freezeUntil=Math.max(S.freezeUntil||0,performance.now()+2400);let n=3;const tick=()=>{if(n<1||!S||S.phase!=="drop"){el.hidden=true;return}el.hidden=false;el.textContent=n;el.classList.remove("go");void el.offsetWidth;el.classList.add("go");blip(520+n*60,.05);n--;setTimeout(tick,800)};tick()}
{const _cd=closeDrawer;closeDrawer=function(){const was=!document.getElementById("drawer").hidden;const r=_cd.apply(this,arguments);if(was)setTimeout(resumeCountdown,120);return r}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(resumeCountdown,200)});

/* ---------- 89: a coach card the first time you drop ---------- */
function touchCoach(){if(!S||S.phase!=="drop"||S.tut||(stats.tips||{}).drag||prefs.wellDrag===false)return;stats.tips=stats.tips||{};stats.tips.drag=1;saveStats();
  const w=document.getElementById("wellWrap");if(!w)return;const c=document.createElement("div");c.id="tcoach";c.setAttribute("role","status");
  c.innerHTML=`<span class="tc-hand" aria-hidden="true">☝︎</span><b>Play right on the well</b><span>Drag ↔ to move · Tap to turn · Flick ↓ to slam</span>`;w.appendChild(c);
  S.freezeUntil=Math.max(S.freezeUntil||0,performance.now()+3500);const bye=()=>{c.classList.add("bye");setTimeout(()=>c.remove(),250)};setTimeout(bye,3600);c.onclick=bye}
{const _sp3=spawnPiece;spawnPiece=function(){const r=_sp3.apply(this,arguments);try{if(S&&S.phase==="drop")touchCoach()}catch(e){}return r}}

/* ---------- 90: bigger well letters; 91: ghost style ---------- */
function applyWellLook(){const h=document.documentElement;h.classList.toggle("bigwell",!!prefs.bigWell);h.classList.toggle("ghost-solid",prefs.ghost==="solid");h.classList.toggle("ghost-off",prefs.ghost==="off")}

/* ---------- 92: share your well ---------- */
function wellSnapshot(){if(!S||!S.grid)return"";const top=Math.min(stackTop(),ROWS-1),rows=S.grid.slice(Math.max(0,Math.min(top,ROWS-8)));
  return rows.map(r=>r.map(x=>!x?"⬛":x.g?"⬜":"🟧").join("")).join("\n")}
function shareWell(){shareOut(`Crossfall · ${S.L.name}\n${wellSnapshot()}\n${fmtN(S.score)} points · LV ${wellLevel()}${S.bestClear>=4?" · CROSSFALL!":""}`)}

/* ---------- 93: new medals ---------- */
let ach3Done=false;
function ach3Init(){if(ach3Done)return;ach3Done=true;const W=()=>stats.ws||{};
  ACH.push({id:"perfect",name:"Clean Sweep",ic:"star",unit:"Perfect Clears",t:[1,5,25],v:()=>W().perfect||0},
    {id:"links",name:"Word Linker",ic:"cards",unit:"word links in the well",t:[1,25,100],v:()=>W().links||0},
    {id:"spins",name:"Spinner",ic:"bolt",unit:"spin clears",t:[1,25,100],v:()=>W().spins||0},
    {id:"groups",name:"Sorter",ic:"cards",unit:"Groups solved",t:[1,10,50],v:()=>Object.values((stats.grp||{}).days||{}).filter(d=>d.win).length+Math.max(0,((stats.grp||{}).solvedOld)||0)},
    {id:"twists",name:"Twister",ic:"bolt",unit:"Twists won",t:[1,10,30],v:()=>(stats.twist||{}).n||0});
  if(stats.achInit&&!stats.ach3Init){stats.ach=stats.ach||{};ACH.slice(-5).forEach(a=>{let v=0;try{v=a.v()}catch(e){}let t=0;a.t.forEach((n,i)=>{if(v>=n)t=i+1});stats.ach[a.id]=Math.max(stats.ach[a.id]||0,t)})}
  stats.ach3Init=1}
{const _ac3=achCheck;achCheck=function(){ach3Init();return _ac3.apply(this,arguments)}}

/* ---------- 94: well stats in Insights; 95: level reached on results ---------- */
function wellStatsHTML(){const W=stats.ws;if(!W)return"";const it=(n,l)=>`<div class="wr-c"><b>${fmtN(n||0)}</b><span>${l}</span></div>`;
  return`<div class="panel"><h2 class="ph">${ti("puzzle")} In the well</h2><div class="wr">${it(W.bestLv||1,"best level")}${it(W.perfect,"Perfect Clears")}${it(W.crossfall,"CROSSFALLs (4 rows)")}${it(W.links,"word links")}${it(W.spins,"spin clears")}${it(W.matches,"letter matches")}</div></div>`}
{const _oi2=openInsights;openInsights=function(){_oi2.apply(this,arguments);const el=document.getElementById("evh");if(!el||el.querySelector(".ws-ins"))return;const h=wellStatsHTML();if(!h)return;
  const done=el.querySelector("#evDone");(done?done.closest(".btns")||done:el.lastElementChild).insertAdjacentHTML("beforebegin",h.replace('class="panel"','class="panel ws-ins"'))}}
function wellSumHTML(){if(!S||S.tut||!(S.linesCleared>0))return"";const lv=wellLevel(),W=wsSt(),best=lv>(S._bestLvBefore||1)&&lv>1;
  return`<div class="ws-sum"><span>${ti("puzzle")} Reached <b>LV ${lv}</b>${best?" · new best!":""}</span><button class="ghost-btn sm" id="wsShare">Share my well</button><button class="ghost-btn sm" id="wsReplay">Replay the drop</button></div>`}

/* ---------- 96: the Night Sky constellations ---------- */
const NS_THEMES=["Star Stuff","First Light","Roots","Skywatchers","Wayfinders","Sky Stories","The Thinkers","The Way","Spirit","One Sky"];
const NS_SHAPES=[[[10,30],[22,14],[34,26],[46,10]],[[8,24],[20,20],[32,26],[44,18],[48,30]],[[12,10],[16,24],[28,30],[40,22],[44,8]],[[8,16],[18,28],[30,12],[42,28],[48,14]],[[10,28],[24,10],[38,28],[24,22]],[[8,8],[20,14],[28,26],[40,20],[48,30]],[[12,28],[18,12],[30,8],[42,14],[46,28]],[[10,18],[22,8],[34,18],[46,8]],[[28,6],[18,18],[28,30],[38,18],[28,6]],[[8,20],[18,10],[28,20],[38,10],[48,20]]];
function nsProgress(){const c=CATEGORIES.find(x=>x.name==="Night Sky");if(!c)return[];return NS_THEMES.map((name,t)=>{const ps=c.puzzles.filter((p,i)=>i%10===t);const done=ps.filter(p=>((store[p.id]||{}).stars||0)>0).length;return{name,done,n:ps.length,lit:ps.length&&done===ps.length}})}
function openSkyMap(){const P=nsProgress(),el=document.getElementById("evh"),lit=P.filter(p=>p.lit).length;
  const star=(t,p)=>{const pts=NS_SHAPES[t].map(([x,y])=>`${x},${y}`).join(" "),k=p.n?p.done/p.n:0;
    return`<button class="sky-c${p.lit?" lit":""}" data-sky="${t}" aria-label="${esc(p.name)}: ${p.done} of ${p.n} puzzles${p.lit?", lit":""}"><svg viewBox="0 0 56 38" aria-hidden="true"><polyline points="${pts}" fill="none" stroke-width="1" style="opacity:${.25+.75*k}"/>${NS_SHAPES[t].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${p.lit?2.2:1.4}"/>`).join("")}</svg><b>${esc(p.name)}</b><small>${p.done}/${p.n}</small></button>`};
  el.innerHTML=`<h1>YOUR <span>SKY</span></h1><p class="sub">Each Night Sky theme is a constellation. Finish its puzzles to light it. ${lit} of 10 lit.</p>
   <div class="sky">${P.map((p,t)=>star(t,p)).join("")}</div><p class="sub" id="skyNote" role="status"></p>
   <div class="btns wide"><button class="big" id="evDone">Done</button></div>`;
  el.hidden=false;el.scrollTop=0;el.querySelectorAll("[data-sky]").forEach(b=>b.onclick=()=>{const t=+b.dataset.sky,p=P[t];const q=STAR_WORDS[t%STAR_WORDS.length];
    document.getElementById("skyNote").innerHTML=`<b>${esc(p.name)}</b>: ${p.done} of ${p.n} played. ${p.lit?`“${esc(q[0])}” (${esc(q[1])})`:"Play a puzzle from this theme to add a star."}`});
  document.getElementById("evDone").onclick=closeEvents}
function skyAfter(){if(!S||!S.L||S.L.cat!=="Night Sky")return;const P=nsProgress();stats.skyLit=stats.skyLit||[];P.forEach((p,t)=>{if(p.lit&&!stats.skyLit.includes(t)){stats.skyLit.push(t);
  queueCele({kind:"xp",title:"A constellation lights up",sub:`${p.name} is complete. See it in Menu › Your sky.`});giveXP(300,"Constellation: "+p.name)}})}

/* ---------- 97: keep a word to carry ---------- */
function swSaved(){const [q,by]=starWord();return QS.some(x=>x.text===q&&x.ref===by)}
function wireStarWord(el){const b=el.querySelector("#swSave");if(!b)return;b.onclick=()=>{const [q,by]=starWord();
  if(swSaved()){QS=QS.filter(x=>!(x.text===q&&x.ref===by));toast("Removed from your shelf")}else{QS.push({w:"NIGHT SKY",text:q,ref:by,cat:"Night Sky",t:Date.now()});toast("Saved to your quote shelf")}
  saveQS();b.setAttribute("aria-pressed",swSaved());b.textContent=swSaved()?"Saved ✓":"Save to my quote shelf";hap("select")}}

/* ---------- 98: take a breath ---------- */
const BREATH=[["Breathe in",4],["Hold",4],["Breathe out",6]];
function openBreath(){const el=document.getElementById("evh");el.innerHTML=`<h1>TAKE A <span>BREATH</span></h1><p class="sub">Three slow breaths. In for 4, hold for 4, out for 6.</p>
   <div class="br-wrap"><div class="br-ring" id="brRing" aria-hidden="true"></div><p class="br-cue" id="brCue" role="status" aria-live="assertive">Ready when you are</p></div>
   <div class="btns"><button class="big" id="brGo">Start</button></div><div class="btns wide"><button class="ghost-btn" id="evDone">Done</button></div>`;
  el.hidden=false;el.scrollTop=0;let timer=0,stop=false;const ring=document.getElementById("brRing"),cue=document.getElementById("brCue");
  const run=(cycle,step)=>{if(stop)return;if(cycle>=3){cue.textContent="Well done. Carry that calm with you.";ring.className="br-ring";stats.breaths=(stats.breaths||0)+1;saveStats();hap("success");return}
    const [t,s]=BREATH[step];cue.textContent=`${t} · ${s}`;ring.className="br-ring "+["in","hold","out"][step];ring.style.setProperty("--d",s+"s");hap("light");
    let left=s;const tk=()=>{if(stop)return;left--;if(left>0){cue.textContent=`${t} · ${left}`;timer=setTimeout(tk,1000)}else run(step===2?cycle+1:cycle,(step+1)%3)};timer=setTimeout(tk,1000)};
  document.getElementById("brGo").onclick=e=>{e.currentTarget.hidden=true;run(0,0)};
  document.getElementById("evDone").onclick=()=>{stop=true;clearTimeout(timer);closeEvents()}}
const HEAL_CATS=["Biblical","Psychology","Books","Night Sky"];

/* ---------- 99: search settings ---------- */
function wireSetSearch(){const st=document.getElementById("settings");if(!st||st.querySelector("#setQ"))return;const h=st.querySelector("h1");if(!h)return;
  h.insertAdjacentHTML("afterend",`<div class="set-find"><input type="search" id="setQ" placeholder="Search settings" aria-label="Search settings" autocomplete="off" spellcheck="false"><p class="sub" id="setNone" hidden>No settings match.</p></div>`);
  const q=document.getElementById("setQ");q.oninput=()=>{const v=q.value.trim().toLowerCase(),rows=[...st.querySelectorAll(".setrow,.setgroup")].filter(r=>!r.closest(".set-find"));let n=0;
    rows.forEach(r=>{const show=!v||r.textContent.toLowerCase().includes(v);r.classList.toggle("set-hide",!show);if(show)n++});
    st.querySelectorAll("h2,.set-h,.ph").forEach(x=>x.classList.toggle("set-hide",!!v));document.getElementById("setNone").hidden=!v||n>0}}

/* ---------- 100: replay just the drop ---------- */
function replayDrop(){if(!S||!S.L)return;const L=Object.assign({},S.L,{archive:S.L.archive||"drop",dropOnly:true,_cw:S.L._cw||(S.li>=0?crosswordFor(S.li):null)});if(!L._cw)return;document.querySelectorAll(".ov").forEach(o=>{if(o.id!=="menu")o.hidden=true});
  S=null;startLevel(L);if(S){S.dropOnly=true;autoCross()}}
function autoCross(){if(!S||!S.dropOnly)return;if(S.phase==="cross"){const w=S.cw.words.find(w=>!w.solved);if(w){selectWord(w);for(const k of w.cells){const c=S.cw.cells.get(k);if(!c.lock){S.sel.key=k;typeLetter(c.ans)}}}}
  if(S&&S.phase!=="done"&&S.phase!=="over")setTimeout(autoCross,180)}

/* ---------- settings rows ---------- */
function setsHTML83(){const sw=(id,on,t,d)=>`<button class="setrow" role="switch" id="${id}" aria-checked="${on}"><span><span class="st-t">${t}</span><br><span class="st-d">${d}</span></span><span class="sw"></span></button>`;
  return sw("setBigWell",!!prefs.bigWell,"Bigger well letters","Larger letters on the falling words and the stack.")+
   sw("setClearHint",prefs.clearHint!==false,"Show rows a drop will clear","Rows light up while you aim.")+
   sw("setCountdown",prefs.countdown!==false,"3-2-1 when you come back","A short countdown before the well starts again.")+
   `<div class="setgroup"><span class="st-t">Landing guide</span><span class="st-d">Where the falling word will land.</span><div class="seg" role="radiogroup" aria-label="Landing guide" id="ghSeg">${[["outline","Outline"],["solid","Solid"],["off","Off"]].map(([k,l])=>`<button role="radio" data-gh="${k}" aria-checked="${(prefs.ghost||"outline")===k}">${l}</button>`).join("")}</div></div>`}
{const _rpi3=renderPaceInfo;renderPaceInfo=function(){_rpi3.apply(this,arguments);try{wireSetSearch()}catch(e){}const a=document.getElementById("a11ySlot");if(!a||a.querySelector("#setBigWell"))return;
  a.insertAdjacentHTML("beforeend",setsHTML83());[["setBigWell","bigWell",false],["setClearHint","clearHint",true],["setCountdown","countdown",true]].forEach(([id,k,def])=>{const b=document.getElementById(id);
    b.onclick=()=>{prefs[k]=def?prefs[k]===false:!prefs[k];b.setAttribute("aria-checked",def?prefs[k]!==false:!!prefs[k]);applyWellLook();savePrefsQuiet();try{if(S)renderWell()}catch(e){}}});
  a.querySelectorAll("[data-gh]").forEach(b=>b.onclick=()=>{prefs.ghost=b.dataset.gh;a.querySelectorAll("[data-gh]").forEach(x=>x.setAttribute("aria-checked",x===b));applyWellLook();savePrefsQuiet()})}}

/* ---------- hooks ---------- */
{const _sl4=startLevel;startLevel=function(){const r=_sl4.apply(this,arguments);try{if(S){S._lc2=0;S._bestLvBefore=wsSt().bestLv||1}}catch(e){}return r}}
{const _rg4=recordGame;recordGame=function(win){const r=_rg4.apply(this,arguments);try{const W=wsSt();W.bestLv=Math.max(W.bestLv||1,wellLevel());skyAfter()}catch(e){console.error(e)}return r}}
try{applyWellLook()}catch(e){}
/* ---------- results extras ---------- */
{const _swh=starWordHTML;starWordHTML=function(){let h=_swh.apply(this,arguments);if(!S||!S.L)return h;
  if(h)h=h.replace(/<\/div>$/,`<div class="btns"><button class="ghost-btn sm" id="swSave" aria-pressed="${swSaved()}">${swSaved()?"Saved ✓":"Save to my quote shelf"}</button><button class="ghost-btn sm" id="skyOpen">See your sky</button></div></div>`);
  const heal=HEAL_CATS.includes(S.L.cat)?`<div class="panel br-cta"><p class="sub">Before the next one, a minute to settle.</p><button class="ghost-btn sm" id="brOpen">Take a breath</button></div>`:"";
  return wellSumHTML()+h+heal}}
{const _shr=showResult;showResult=function(){const r=_shr.apply(this,arguments);try{const el=document.getElementById("result");if(el){wireStarWord(el);
  const o=(id,f)=>{const b=document.getElementById(id);if(b)b.onclick=f};o("skyOpen",openSkyMap);o("brOpen",openBreath);o("wsShare",shareWell);o("wsReplay",replayDrop)}}catch(e){console.error(e)}return r}}
