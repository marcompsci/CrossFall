/* ================= Phases 58–72 (19 Nov 2026) ================= */
function strSeed(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}

/* ---------- 58: Groups, a daily puzzle: sort 16 words into their 4 categories ---------- */
const GRP_COL=["#f2c94c","#6fcf97","#56ccf2","#bb6bd9"],GRP_EMO=["🟨","🟩","🟦","🟪"];
function grpPools(){if(grpPools.c)return grpPools.c;const pools={},seen={};
  CATEGORIES.filter(c=>!c.lang&&!c.heal).forEach(c=>{const set=new Set();c.puzzles.forEach(p=>(p.words||[]).forEach(w=>{const a=String(w[0]||"").toUpperCase();if(/^[A-Z]{4,7}$/.test(a))set.add(a)}));pools[c.name]=[...set];set.forEach(a=>seen[a]=(seen[a]||0)+1)});
  for(const k in pools)pools[k]=pools[k].filter(a=>seen[a]===1).sort();return grpPools.c=pools}
function grpPuzzle(dk){const R=rng(strSeed("grp"+dk)),P=grpPools(),cats=shuffle(Object.keys(P).filter(k=>P[k].length>=8).sort(),R).slice(0,4);
  const groups=cats.map((c,i)=>({cat:c,col:i,words:shuffle(P[c].slice(),R).slice(0,4)}));
  return{groups,board:shuffle(groups.flatMap(g=>g.words),R)}}
function grpSt(dk){stats.grp=stats.grp||{days:{},streak:{n:0,last:"",best:0}};const d=stats.grp.days;if(!d[dk])d[dk]={solved:[],miss:0,guesses:[],done:false,win:false};
  const ks=Object.keys(d).sort();if(ks.length>40)ks.slice(0,ks.length-40).forEach(k=>delete d[k]);return d[dk]}
let GRP=null;
function openGroups(dk){dk=dk||todayKey();GRP={dk,P:grpPuzzle(dk),sel:[],msg:""};renderGroups();const el=document.getElementById("evh");el.hidden=false;el.scrollTop=0}
function grpOf(w){return GRP.P.groups.find(g=>g.words.includes(w))}
function renderGroups(){const el=document.getElementById("evh"),st=grpSt(GRP.dk),P=GRP.P;
  const solved=st.solved.map(c=>P.groups.find(g=>g.cat===c)),left=P.board.filter(w=>!st.solved.includes(grpOf(w).cat));
  const show=st.done&&!st.win?P.groups:solved;const rest=st.done?[]:left;
  el.innerHTML=`<h1>GROUPS</h1><p class="sub">Find four groups of four. Each group is one Crossfall category. ${st.done?"":`${4-st.miss} mistake${4-st.miss===1?"":"s"} left.`}</p>
   <div class="grp">${show.map(g=>`<div class="grp-row" style="--g:${GRP_COL[g.col]}"><b>${esc(g.cat)}</b><span>${g.words.join(" · ")}</span></div>`).join("")}
   ${rest.length?`<div class="grp-grid" role="group" aria-label="Words">${rest.map(w=>`<button class="grp-w" data-gw="${w}" aria-pressed="${GRP.sel.includes(w)}">${w}</button>`).join("")}</div>`:""}</div>
   <p class="qd-msg" role="status">${esc(GRP.msg||(st.done?st.win?`Solved with ${st.miss} mistake${st.miss===1?"":"s"}.`:"Out of mistakes. Here are the groups.":""))}</p>
   ${st.done?`<div class="btns"><button class="ghost-btn" id="grShare">Share result</button></div>`:`<div class="btns grp-ctl"><button class="ghost-btn" id="grMix">Shuffle</button><button class="ghost-btn" id="grClr">Deselect</button><button class="big" id="grGo" ${GRP.sel.length===4?"":"disabled"}>Submit</button></div>`}
   <div class="btns wide"><button class="big" id="evDone">Done</button></div>`;
  el.querySelectorAll("[data-gw]").forEach(b=>b.onclick=()=>{const w=b.dataset.gw,i=GRP.sel.indexOf(w);if(i>=0)GRP.sel.splice(i,1);else if(GRP.sel.length<4)GRP.sel.push(w);GRP.msg="";renderGroups()});
  const on=(id,f)=>{const x=document.getElementById(id);if(x)x.onclick=f};
  on("grMix",()=>{shuffle(GRP.P.board,rng(Date.now()%99991));renderGroups()});on("grClr",()=>{GRP.sel=[];renderGroups()});on("grGo",grpSubmit);
  on("grShare",()=>shareOut(grpShare()));document.getElementById("evDone").onclick=closeEvents}
function grpSubmit(){const st=grpSt(GRP.dk);if(st.done||GRP.sel.length!==4)return;const gs=GRP.sel.map(grpOf);st.guesses.push(gs.map(g=>g.col));
  const same=gs.every(g=>g===gs[0]);
  if(same){st.solved.push(gs[0].cat);GRP.msg=gs[0].cat+"!";sfx("solve");hap("success");GRP.sel=[]}
  else{st.miss++;const cnt={};gs.forEach(g=>cnt[g.cat]=(cnt[g.cat]||0)+1);GRP.msg=Math.max(...Object.values(cnt))===3?"One away…":"Not a group.";hap("error")}
  if(st.solved.length===4||st.miss>=4){st.done=true;st.win=st.solved.length===4;GRP.sel=[];GRP.msg="";
    if(GRP.dk===todayKey()){const s=stats.grp.streak,y=addDays(GRP.dk,-1);if(st.win){s.n=s.last===y?s.n+1:1;s.last=GRP.dk;s.best=Math.max(s.best,s.n);giveXP(st.miss?200:300,"Groups solved")}else{s.n=0}}}
  saveStats();renderGroups()}
function grpShare(){const st=grpSt(GRP.dk);return`Crossfall Groups ${GRP.dk}\n${st.guesses.map(r=>r.map(c=>GRP_EMO[c]).join("")).join("\n")}\n${st.win?`Solved · ${st.miss} mistake${st.miss===1?"":"s"}`:"Not this time"}`}
function grpLine(){const st=(stats.grp&&stats.grp.days[todayKey()])||null,s=(stats.grp||{}).streak||{n:0};
  return`<button class="wk-line" id="grLine"><span>${ti("cards")} <b>Groups</b> · ${st&&st.done?st.win?"✓ solved":"played":"sort 16 words into 4 categories"}${s.n>1?`<small>${s.n} days in a row</small>`:""}</span><span aria-hidden="true">›</span></button>`}

/* ---------- 59: Twist of the day ---------- */
const TWISTS=[{id:"fast",name:"Fast Fall",d:"Pieces fall faster."},{id:"nohold",name:"No Hold",d:"Hold is switched off."},{id:"nohint",name:"No Help",d:"No hints. Autocheck still works."},{id:"short",name:"Quick Rush",d:"Every rush is 30% shorter."},{id:"deep",name:"Deep Well",d:"Two extra junk rows to start."}];
function twistOf(dk){const h=strSeed("tw"+dk),T=TWISTS[h%TWISTS.length];const pool=LEVELS.filter(l=>!l.lang&&!l.heal&&!l.daily&&!lockReason(l)&&(l.words||[]).length>=5);
  return{T,L:pool.length?pool[strSeed("twl"+dk)%pool.length]:null}}
function twSt(){stats.twist=stats.twist||{days:{},n:0};return stats.twist}
let TWISTQ=null;
function playTwist(){const t=todayKey(),x=twistOf(t);if(!x.L){toast("Unlock a category to play the Twist");return}TWISTQ={dk:t,id:x.T.id,L:x.L};startLevel(LEVELS.indexOf(x.L))}
function twistApply(){if(!TWISTQ||!S)return;if(S.L!==TWISTQ.L){TWISTQ=null;return}const id=TWISTQ.id;S.twist=id;S.twistDay=TWISTQ.dk;TWISTQ=null;
  if(id==="fast")S.runMul=(S.runMul||1)*.65;if(id==="nohold")S.twistNoHold=1;if(id==="nohint"){S.noHint=1;S.noHintMsg="No hints in today's Twist"}
  if(id==="deep"){let top=ROWS;for(let r=0;r<ROWS;r++)if(S.grid[r].some(Boolean)){top=r;break}for(let r=Math.max(0,top-2);r<top;r++){const gap=Math.floor(S.R()*COLS);for(let c=0;c<COLS;c++)S.grid[r][c]=c===gap?null:{ch:GARB[Math.floor(S.R()*GARB.length)],g:1}}}
  toast("Today's Twist: "+TWISTS.find(t=>t.id===id).name);try{renderAll()}catch(e){}}
function twistAfter(win){if(!S||!S.twistDay)return;const T=twSt(),d=T.days[S.twistDay]||{best:0,win:false,tries:0};d.tries++;d.best=Math.max(d.best,S.score);
  if(win&&!d.win){d.win=true;T.n=(T.n||0)+1;giveXP(250,"Twist cleared: "+TWISTS.find(t=>t.id===S.twist).name)}T.days[S.twistDay]=d;
  const ks=Object.keys(T.days).sort();if(ks.length>40)ks.slice(0,ks.length-40).forEach(k=>delete T.days[k])}
function twistLine(){const x=twistOf(todayKey());if(!x.L)return"";const d=twSt().days[todayKey()];
  return`<button class="wk-line tw-line" id="twLine"><span>${ti("bolt")} <b>Twist: ${x.T.name}</b> · ${d&&d.win?`✓ ${fmtN(d.best)}`:esc(x.L.name)}<small>+250 XP for a win</small></span><span aria-hidden="true">›</span></button>`}

/* ---------- 60: Crossfall Wrapped (1 Dec to 15 Jan) ---------- */
function wrapYear(now){const d=new Date(now||Date.now());return d.getMonth()===0?d.getFullYear()-1:d.getFullYear()}
function wrapOn(now){const d=new Date(now||Date.now());return d.getMonth()===11||(d.getMonth()===0&&d.getDate()<=15)}
function wrapData(y){const M=stats.mon||{},ks=Object.keys(M).filter(k=>k.startsWith(y+"-")).sort();const W={games:0,wins:0,score:0,words:0,gold:0,targets:0,best:0,bestName:"",cats:{},months:{}};
  ks.forEach(k=>{const m=M[k];W.games+=m.games;W.wins+=m.wins;W.score+=m.score;W.words+=m.words;W.gold+=m.gold||0;W.targets+=m.targets||0;W.months[k]=m.games;if(m.best>W.best){W.best=m.best;W.bestName=m.bestName}for(const c in m.cats||{})W.cats[c]=(W.cats[c]||0)+m.cats[c]});
  W.topCat=Object.entries(W.cats).sort((a,b)=>b[1]-a[1])[0];W.topMonth=Object.entries(W.months).sort((a,b)=>b[1]-a[1])[0];
  W.badges=Object.values(stats.badges||{}).filter(b=>new Date(b.t).getFullYear()===y).length;W.words2=Object.keys(stats.wb||{}).length;W.streak=(stats.dstreak||{}).best||0;return W}
function openWrapped(){const y=wrapYear(),W=wrapData(y),el=document.getElementById("evh"),mn=k=>new Date(k+"-15T12:00").toLocaleDateString("en-US",{month:"long"});
  const card=(n,l)=>`<div class="wr-c"><b>${n}</b><span>${l}</span></div>`;
  el.innerHTML=`<h1>${y} <span>WRAPPED</span></h1><p class="sub">Your year in Crossfall, counted on your device.</p>
   ${W.games?`<div class="wr">${card(fmtN(W.games),"puzzles played")}${card(fmtN(W.words),"words solved")}${card(fmtN(W.wins),"wins")}${card(fmtN(W.score),"points")}${card(fmtN(W.gold),"gold runs")}${card(fmtN(W.badges),"badges earned")}</div>
   <div class="panel"><p>${W.topCat?`Your category: <b>${esc(W.topCat[0])}</b> (${W.topCat[1]} games).<br>`:""}${W.topMonth?`Busiest month: <b>${mn(W.topMonth[0])}</b>.<br>`:""}${W.best?`Best game: <b>${fmtN(W.best)}</b>${W.bestName?` on ${esc(W.bestName)}`:""}.`:""}</p></div>
   <div class="btns"><button class="ghost-btn" id="wrShare">Share my year</button></div>`:`<div class="panel"><p class="sub">Play a few puzzles and your year shows up here.</p></div>`}
   <div class="btns wide"><button class="big" id="evDone">Done</button></div>`;
  el.hidden=false;el.scrollTop=0;const s=document.getElementById("wrShare");
  if(s)s.onclick=()=>shareOut(`My ${y} in Crossfall: ${fmtN(W.games)} puzzles, ${fmtN(W.words)} words, ${fmtN(W.wins)} wins${W.topCat?`, mostly ${W.topCat[0]}`:""}.`);
  stats.wrapSeen=y;saveStats();document.getElementById("evDone").onclick=closeEvents}
function wrapLine(){if(!wrapOn())return"";const y=wrapYear();return`<button class="wk-line wr-line" id="wrLine"><span>${ti("star")} <b>${y} Wrapped</b>${stats.wrapSeen===y?"":` · new`}<small>Your year in Crossfall</small></span><span aria-hidden="true">›</span></button>`}

/* ---------- 61: badge showcase ---------- */
function showcase(){return(stats.show||[]).filter(id=>(stats.badges||{})[id]).slice(0,3)}
function toggleShow(id){stats.show=showcase();const i=stats.show.indexOf(id);if(i>=0)stats.show.splice(i,1);else{if(stats.show.length>=3){toast("Pick up to 3. Unpin one first.");return}stats.show.push(id)}saveStats()}
function showcaseHTML(){const ids=showcase();if(!ids.length)return"";const B=stats.badges;
  return`<div class="sc-row" aria-label="Pinned badges">${ids.map(id=>`<span class="sc-b">${ti(B[id].icon||"medal")}<b>${esc(B[id].name)}</b></span>`).join("")}</div>`}
{const _bh=badgesHTML;badgesHTML=function(){const h=_bh.apply(this,arguments);if(!Object.keys(stats.badges||{}).length)return h;const ids=showcase();
  return`<p class="sub">Tap a badge to pin it to your profile (up to 3).</p>`+h}}
{const _rp=renderProfile;renderProfile=function(){_rp.apply(this,arguments);const el=document.getElementById("profile");if(!el)return;
  const hero=el.querySelector(".hero");if(hero&&!el.querySelector(".sc-row")){const h=showcaseHTML();if(h)hero.insertAdjacentHTML("afterend",`<section class="hp sc-hp"><header><span>PN</span><b>PINNED BADGES</b></header>${h}</section>`)}
  const ids=Object.entries(stats.badges||{}).sort((a,b)=>b[1].t-a[1].t).map(x=>x[0]);
  el.querySelectorAll(".bdg-grid .bdg").forEach((b,i)=>{const id=ids[i];if(!id)return;b.setAttribute("role","button");b.tabIndex=0;b.setAttribute("aria-pressed",showcase().includes(id));
    b.onclick=()=>{toggleShow(id);renderProfile()};b.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();b.onclick()}}})}}

/* ---------- 62: words to review ---------- */
function reviewDue(){return Object.values(stats.bank||{}).filter(e=>(e.box||0)<=1).length}
function reviewLine(){const n=reviewDue();if(n<3)return"";return`<button class="wk-line" id="rvLine"><span>${ti("cards")} <b>${n} word${n===1?"":"s"} to review</b><small>Quick flashcards from words you missed or marked Study later</small></span><span aria-hidden="true">›</span></button>`}

/* ---------- 63: a puzzle made from your review words ---------- */
function reviewPuzzle(){const all=Object.entries(stats.bank||{}).filter(([w,e])=>/^[A-Z]{3,9}$/.test(w)&&e.c).sort((a,b)=>(a[1].box||0)-(b[1].box||0)||b[1].t-a[1].t).slice(0,8);
  if(all.length<4){toast("Study a few more words first");return null}const r=buildCustom({t:"My review words",w:all.map(([w,e])=>[w,String(e.c).replace(/[<>]/g,"").slice(0,120)]),d:"bar",f:"clue",s:strSeed(todayKey())%9000+11});
  if(r.err){toast("Those words don't cross. Try again after a few more games.");return null}return r}
function playReviewPuzzle(){const r=reviewPuzzle();if(!r)return;document.getElementById("review").hidden=true;closeEvents();startLevel(r.L)}

/* ---------- 64: weekend double sparks ---------- */
function isWeekend(t){const d=new Date(t||Date.now()).getDay();return d===0||d===6}
{const _sa=sparksAfter;sparksAfter=function(g){const b=sparks();_sa.apply(this,arguments);if(!isWeekend(g&&g.t))return;const got=sparks()-b;if(got>0){stats.sparks=Math.min(SPARK_CAP,sparks()+got);S.weekendSparks=sparks()-b-got}}}
function weekendLine(){return isWeekend()?`<div class="wk-line we-line" role="note"><span>${ti("bolt")} <b>Weekend:</b> double sparks from every game</span></div>`:""}

/* ---------- 65: play a loved puzzle ---------- */
function playLovedShuffle(){const L=lovedList().filter(l=>!lockReason(l));if(!L.length){toast("No loved puzzles yet");return}const l=L[Math.floor(Math.random()*L.length)];document.querySelectorAll(".ov").forEach(o=>{if(o.id!=="menu")o.hidden=true});startLevel(LEVELS.indexOf(l))}
{const _lp=lovedPanelHTML;lovedPanelHTML=function(){const h=_lp.apply(this,arguments);if(lovedList().length<2)return h;return h.replace(/<\/div>$/,`<button class="ghost-btn" id="lvShuffle">${ti("cards")} Play a loved puzzle</button></div>`)}}

/* ---------- 66: category deep dive ---------- */
function catDeep(name){const c=CATEGORIES.find(x=>x.name===name);if(!c)return null;const gs=(stats.games||[]).filter(g=>g.cat===name&&!g.practice);
  const M=stats.mon||{};let games=0,wins=0,score=0,words=0;for(const k in M){const m=M[k];games+=(m.cats||{})[name]||0}
  const got=c.puzzles.reduce((t,p)=>t+((store[p.id]||{}).stars||0),0),max=c.puzzles.length*3,played=c.puzzles.filter(p=>store[p.id]).length;
  gs.forEach(g=>{wins+=g.win?1:0;score+=g.score;words+=g.words});
  const best=c.puzzles.map(p=>({p,b:(store[p.id]||{}).best||0})).sort((a,b)=>b.b-a.b)[0];
  const wb=Object.entries(stats.wb||{}).filter(([w,e])=>e.k===name).length,hard=Object.entries(stats.bank||{}).filter(([w,e])=>e.k===name&&(e.box||0)===0).map(x=>x[0]).slice(0,6);
  return{c,games,recent:gs.length,wins,avg:gs.length?Math.round(score/gs.length):0,words,got,max,played,best,wb,hard}}
function openCatDeep(name){const D=catDeep(name);if(!D)return;const el=document.getElementById("evh"),pct=D.max?Math.round(D.got/D.max*100):0;
  el.innerHTML=`<h1>${esc(name.toUpperCase())}</h1><p class="sub">Everything you've done in ${esc(name)}.</p>
   <div class="wr"><div class="wr-c"><b>${D.got}/${D.max}</b><span>stars (${pct}%)</span></div><div class="wr-c"><b>${D.played}/${D.c.puzzles.length}</b><span>puzzles played</span></div>
    <div class="wr-c"><b>${fmtN(D.games)}</b><span>games this year</span></div><div class="wr-c"><b>${D.recent?Math.round(D.wins/D.recent*100)+"%":"–"}</b><span>wins (last ${D.recent})</span></div>
    <div class="wr-c"><b>${D.avg?fmtN(D.avg):"–"}</b><span>average score</span></div><div class="wr-c"><b>${fmtN(D.wb)}</b><span>words in your word book</span></div></div>
   ${D.best&&D.best.b?`<div class="panel"><p>Best: <b>${fmtN(D.best.b)}</b> on ${esc(D.best.p.name)}</p></div>`:""}
   ${D.hard.length?`<div class="panel"><h2 class="ph">Still learning</h2><p>${D.hard.join(" · ")}</p></div>`:""}
   <div class="btns wide"><button class="big" id="evDone">Done</button></div>`;
  el.hidden=false;el.scrollTop=0;document.getElementById("evDone").onclick=closeEvents}
{const _oi=openInsights;openInsights=function(){_oi.apply(this,arguments);const el=document.getElementById("evh");if(!el||el.querySelector(".cd-list"))return;
  const names=[...new Set((stats.games||[]).filter(g=>!g.practice&&CATEGORIES.some(c=>c.name===g.cat)).map(g=>g.cat))];if(!names.length)return;
  const done=el.querySelector("#evDone");const html=`<div class="panel"><h2 class="ph">Category details</h2><div class="cd-list">${names.map(n=>`<button class="ghost-btn sm" data-cd="${esc(n)}">${esc(n)} ›</button>`).join("")}</div></div>`;
  (done?done.closest(".btns")||done:el.lastElementChild).insertAdjacentHTML("beforebegin",html);
  el.querySelectorAll("[data-cd]").forEach(b=>b.onclick=()=>openCatDeep(b.dataset.cd))}}

/* ---------- 67: Home Screen quick actions (native) ---------- */
window.__qa=function(kind){try{document.querySelectorAll(".ov").forEach(o=>{if(o.id!=="menu")o.hidden=true});const t=todayKey();
  if(kind==="daily"){if(S&&S.phase&&S.phase!=="done"&&S.phase!=="over"){saveRun()}S=null;showMenu();playDaily(t)}
  else if(kind==="quick"){if(!S){showMenu()}openQD()}
  else if(kind==="groups"){if(!S){showMenu()}openGroups()}}catch(e){console.error(e)}};

/* ---------- 68: music and sound-effect volume ---------- */
let FXBUS=null,MUSBUS=null,REALMASTER=null;
function volApply(){if(!FXBUS)return;const v=x=>Math.max(0,Math.min(1,x==null?1:+x));FXBUS.gain.value=v(prefs.vfx);MUSBUS.gain.value=v(prefs.vmus)}
{const _ai=audioInit;audioInit=function(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();REALMASTER=AC.createGain();REALMASTER.gain.value=.9;REALMASTER.connect(AC.destination);
  FXBUS=AC.createGain();MUSBUS=AC.createGain();FXBUS.connect(REALMASTER);MUSBUS.connect(REALMASTER);MASTER=FXBUS;volApply()}catch(e){}}return _ai.apply(this,arguments)}}
{const _ms=music.set.bind(music);music.set=function(v){if(MUSBUS){const m=MASTER;MASTER=MUSBUS;try{_ms(v)}finally{MASTER=m}}else _ms(v)}}
function volHTML(){const f=Math.round((prefs.vfx==null?1:prefs.vfx)*100),m=Math.round((prefs.vmus==null?1:prefs.vmus)*100);
  return`<div class="setgroup" id="volGroup"><span class="st-t">Volume</span>
    <label class="vol"><span>Effects</span><input type="range" min="0" max="100" step="5" value="${f}" id="volFx" aria-label="Sound effects volume"><output>${f}%</output></label>
    <label class="vol"><span>Music</span><input type="range" min="0" max="100" step="5" value="${m}" id="volMus" aria-label="Music volume"><output>${m}%</output></label></div>`}
function wireVol(){[["volFx","vfx"],["volMus","vmus"]].forEach(([id,k])=>{const r=document.getElementById(id);if(!r)return;r.oninput=()=>{prefs[k]=+r.value/100;r.nextElementSibling.textContent=r.value+"%";audioInit();volApply();savePrefsQuiet()};
  r.onchange=()=>{if(k==="vfx")blip(660,.05)}})}
function savePrefsQuiet(){try{localStorage.setItem("crossfall-a11y",JSON.stringify(prefs))}catch(e){}}

/* ---------- 69: streak milestones ---------- */
const STREAK_MS=[7,30,100,365];
function streakMilestone(){const n=dailyStreak().n||0;stats.msDone=stats.msDone||[];const hit=STREAK_MS.filter(m=>n>=m&&!stats.msDone.includes(m)).pop();if(!hit)return;
  STREAK_MS.filter(m=>m<=hit).forEach(m=>{if(!stats.msDone.includes(m))stats.msDone.push(m)});stats.sparks=Math.min(SPARK_CAP,sparks()+(hit>=100?5:hit>=30?3:2));
  try{giveBadge("streak"+hit,hit+"-day streak","fire",`${hit} Dailies in a row`)}catch(e){}
  queueCele({kind:"xp",title:`${hit}-day streak!`,sub:`+${hit>=100?5:hit>=30?3:2} sparks and a badge. Share it from Profile › Badges.`});S&&(S.msHit=hit)}

/* ---------- 70: everything today, at a glance ---------- */
function todayList(){const t=todayKey(),pz=k=>!!((pzStore(k).days[t]||{}).done),g=(stats.grp&&stats.grp.days[t])||{},q=stats.qd&&stats.qd.day===t?stats.qd:{};
  return[["Daily",!!dailyRecord(t)],["Mini",pz("mini")],["Chunks",pz("chunks")],["Ladder",pz("ladder")],["Cipher",pz("cipher")],["Groups",!!g.done],["Quick Daily",q.phase===2]]}
function todayLine(){const L=todayList(),n=L.filter(x=>x[1]).length;if(!n)return"";
  return`<button class="wk-line td-line" id="tdLine"><span>${goalRing(n,L.length)}<b>Today</b> · ${n===L.length?"all done ✓":`${n} of ${L.length} puzzles`}<small>${L.filter(x=>!x[1]).map(x=>x[0]).join(", ")||"Share your day"}</small></span><span aria-hidden="true">›</span></button>`}
function shareToday(){const L=todayList();shareOut(`Crossfall ${todayKey()}\n${L.map(([n,d])=>(d?"✅ ":"⬜ ")+n).join("\n")}`)}

/* ---------- 71: wider letter spacing ---------- */
function applySpacing(){document.documentElement.classList.toggle("wide-ls",!!prefs.wideLs)}

/* ---------- 72: keyboard layout ---------- */
const KB_LAYOUTS={qwerty:["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"],azerty:["AZERTYUIOP","QSDFGHJKLM","WXCVBN"],qwertz:["QWERTZUIOP","ASDFGHJKL","YXCVBNM"],abc:["ABCDEFGHI","JKLMNOPQR","STUVWXYZ"]};
function kbRows(){return(KB_LAYOUTS[prefs.kb]||KB_LAYOUTS.qwerty).slice()}
function setsHTML5872(){return`<button class="setrow" role="switch" id="setWideLs" aria-checked="${!!prefs.wideLs}"><span><span class="st-t">Wider letter spacing</span><br><span class="st-d">More space between letters in clues and tiles. Some readers find it easier.</span></span><span class="sw"></span></button>
  <div class="setgroup"><span class="st-t">Keyboard layout</span><span class="st-d">For the on-screen letter keys.</span><div class="seg seg4" role="radiogroup" aria-label="Keyboard layout" id="kbSeg">${[["qwerty","QWERTY"],["azerty","AZERTY"],["qwertz","QWERTZ"],["abc","ABC"]].map(([k,l])=>`<button role="radio" data-kb="${k}" aria-checked="${(prefs.kb||"qwerty")===k}">${l}</button>`).join("")}</div></div>`}
function wireSets5872(){const w=document.getElementById("setWideLs");if(w)w.onclick=()=>{prefs.wideLs=!prefs.wideLs;w.setAttribute("aria-checked",prefs.wideLs);applySpacing();savePrefsQuiet()};
  document.querySelectorAll("[data-kb]").forEach(b=>b.onclick=()=>{prefs.kb=b.dataset.kb;document.querySelectorAll("[data-kb]").forEach(x=>x.setAttribute("aria-checked",x===b));savePrefsQuiet();try{padMode="";if(S)renderAll()}catch(e){}toast("Keyboard: "+b.textContent)});wireVol()}

/* ---------- hooks ---------- */
{const _sl=startLevel;startLevel=function(){_sl.apply(this,arguments);try{if(TWISTQ)twistApply()}catch(e){console.error(e)}}}
{const _hp=holdPiece;holdPiece=function(){if(S&&S.twistNoHold){toast("No hold in today's Twist");return}return _hp.apply(this,arguments)}}
{const _sr=startRush;startRush=function(){const r=_sr.apply(this,arguments);try{if(S&&S.twist==="short"&&S.rush){S.rush.left=Math.max(10,Math.round(S.rush.left*.7));S.rush.limit=S.rush.left}}catch(e){}return r}}
{const _rg2=recordGame;recordGame=function(win){const r=_rg2.apply(this,arguments);try{twistAfter(win);if(S&&S.L&&S.L.daily&&!S.L.archive)streakMilestone()}catch(e){console.error(e)}return r}}
try{applySpacing()}catch(e){}

/* ---------- wiring ---------- */
{const _rpi=renderPaceInfo;renderPaceInfo=function(){_rpi.apply(this,arguments);const a=document.getElementById("a11ySlot"),v=document.getElementById("volSlot");
  if(a)a.innerHTML=setsHTML5872();if(v)v.innerHTML=volHTML();wireSets5872()}}
{const _rr=renderReview;renderReview=function(){_rr.apply(this,arguments);const el=document.getElementById("review");if(!el||el.querySelector("#rvPuzzle"))return;
  if(Object.keys(stats.bank||{}).length>=4){el.insertAdjacentHTML("beforeend",`<div class="btns"><button class="ghost-btn" id="rvPuzzle">${ti("pencil")} Make a puzzle from my review words</button></div>`);document.getElementById("rvPuzzle").onclick=playReviewPuzzle}}}
{const _om=openModes;openModes=function(){_om.apply(this,arguments);const b=document.getElementById("lvShuffle");if(b)b.onclick=playLovedShuffle}}
