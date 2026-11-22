/* ================= Phases 248–267 (21 Nov 2026, evening) ================= */

/* ---------- 248, 249: words left in the clue bar ---------- */
{const _rcl2=renderClue;renderClue=function(){const r=_rcl2.apply(this,arguments);try{const bar=document.getElementById("cluebar");if(!bar||!S||!S.cw)return r;let c=document.getElementById("wordsChip");
    if(!c){c=document.createElement("span");c.id="wordsChip";c.className="words-chip";c.setAttribute("aria-live","polite");bar.appendChild(c)}
    const n=S.cw.words.length,done=S.cw.words.filter(w=>w.solved).length,left=n-done;c.hidden=S.phase!=="cross";c.classList.toggle("last",left===1);c.textContent=left===1?"Last word!":`${done}/${n}`;
    c.setAttribute("aria-label",left===1?"Last word":`${done} of ${n} words solved`)}catch(e){}return r}}

/* ---------- 250, 251, 254, 265: perfect puzzles, new bests, new words ---------- */
{const _cw4=checkWords;checkWords=function(cell){const wr=S&&S.wrong;const r=_cw4.apply(this,arguments);try{if(S&&S.wrong&&S.wrong!==wr)S._dirty=1}catch(e){}return r}}
{const _sl7=startLevel;startLevel=function(){const r=_sl7.apply(this,arguments);try{if(S){S._dirty=0;S._bank0=Object.keys(stats.bank||{}).length;S._best0=S.L&&S.L.id?bestOn(S.L.id):0}}catch(e){}return r}}
{const _rg10=recordGame;recordGame=function(win){let perfect=false;try{perfect=!!win&&!S._dirty&&!(S.helped&&S.helped.size)&&!S.tut&&!S.dropOnly}catch(e){}const r=_rg10.apply(this,arguments);
  try{if(S){const g=stats.games[0];S._perfect=perfect&&g&&g.stars>=3;if(S._perfect){stats.perfectN=(stats.perfectN||0)+1}S._newWords=Math.max(0,Object.keys(stats.bank||{}).length-(S._bank0||0));
    S._newBest=!!(S.L&&S.L.id&&!S.L.daily&&S._best0>0&&S.score>S._best0)}}catch(e){}return r}}
{const _shr7=showResult;showResult=function(){const r=_shr7.apply(this,arguments);try{const el=document.getElementById("result");if(!el||!S||el.querySelector(".pf-line"))return r;const bits=[];
    if(S._perfect)bits.push(`<span class="pf-perfect">★ Perfect puzzle: three stars, no help, no wrong words</span>`);
    if(S._newBest)bits.push(`<span class="up">New best on this puzzle (was ${fmtN(S._best0)})</span>`);
    if(S._newWords)bits.push(`<span>${ti("cards")} ${S._newWords} new word${S._newWords===1?"":"s"} in your bank</span>`);
    const at=el.querySelector(".pts");if(at&&bits.length)at.insertAdjacentHTML("afterend",`<div class="pf-line">${bits.join("")}</div>`);if(S._perfect&&!calmNow())hap("success")}catch(e){console.error(e)}return r}}

/* ---------- 252, 253: your day ---------- */
function dayChecks(){const t=todayKey(),played=stats.games.filter(g=>!g.practice&&dayKeyOf(new Date(g.t))===t).length,goal=Math.max(1,stats.goal||3);
  return[{k:"daily",l:"Today's Daily",ok:!!dailyRecord(t)},{k:"uns",l:"Daily Unscramble",ok:unDailyDone(),hide:!unDailyList()},{k:"goal",l:`${goal} puzzle${goal===1?"":"s"}`,ok:played>=goal,sub:`${Math.min(played,goal)}/${goal}`}].filter(x=>!x.hide)}
function dayCheck(){const C=dayChecks(),t=todayKey();if(C.length>=2&&C.every(x=>x.ok)&&stats.dayDone!==t){stats.dayDone=t;stats.dayDoneN=(stats.dayDoneN||0)+1;giveXP(100,"Your day");queueCele({kind:"xp",title:"Your day is done",sub:"Daily, Unscramble and your goal. +100 XP"});saveStats()}}
function dayTileHTML(){if((prefs.hideHt||{}).day)return"";const C=dayChecks();if(C.length<2)return"";const n=C.filter(x=>x.ok).length,all=n===C.length;
  return`<div class="ht ht-day${all?" done":""}"><span class="ht-k">Your day · ${n}/${C.length}</span><b>${all?"All done. See you tomorrow!":"Three small things"}</b><span class="dy-list">${C.map(x=>`<span class="dy${x.ok?" ok":""}">${x.ok?"✓":"○"} ${esc(x.l)}${x.sub&&!x.ok?` · ${x.sub}`:""}</span>`).join("")}</span>${all?"":`<span>Finish all for +100 XP</span>`}</div>`}

/* ---------- 262: your week on Sunday; 264: catch up on yesterday's Daily ---------- */
function thisWeekSum(){const t=todayKey(),mon=addDays(t,-((new Date().getDay()+6)%7)),g=stats.games.filter(x=>!x.practice&&dayKeyOf(new Date(x.t))>=mon);if(!g.length)return null;
  return{n:g.length,stars:g.reduce((a,x)=>a+(x.stars||0),0),pts:g.reduce((a,x)=>a+(x.score||0),0),days:new Set(g.map(x=>dayKeyOf(new Date(x.t)))).size}}
function sundayHTML(){if(new Date().getDay()!==0||(prefs.hideHt||{}).sun)return"";const w=thisWeekSum();if(!w)return"";
  return`<div class="ht ht-sun"><span class="ht-k">Your week so far</span><b>${w.n} puzzles · ${w.stars}★ · ${w.days} day${w.days===1?"":"s"}</b><span>${fmtN(w.pts)} points</span><button class="ghost-btn sm" id="htSunShare">Share my week</button></div>`}
function missedYHTML(){if((prefs.hideHt||{}).missy)return"";const y=addDays(todayKey(),-1);if(dailyRecord(y)||!stats.games.length)return"";
  return`<button class="ht ht-missy" id="htMissY"><span class="ht-k">Missed yesterday?</span><b>Play yesterday's Daily</b><span>It won't change your streak, but you'll get the stars.</span></button>`}
{const _htH5=homeTilesHTML;homeTilesHTML=function(){let h=_htH5.apply(this,arguments)||"";const add=dayTileHTML()+sundayHTML()+missedYHTML();if(!add)return h;
  return h?h.replace('<div class="home-tiles" id="homeTiles">','<div class="home-tiles" id="homeTiles">'+add):`<div class="home-tiles" id="homeTiles">${add}</div>`}}
{const _rdc7=renderDailyCard;renderDailyCard=function(){const r=_rdc7.apply(this,arguments);try{const s=document.getElementById("htSunShare");if(s)s.onclick=()=>{const w=thisWeekSum();shareOut(`My Crossfall week: ${w.n} puzzles · ${w.stars}★ · ${w.days} days · ${fmtN(w.pts)} points`)};
    const m=document.getElementById("htMissY");if(m)m.onclick=()=>playDaily(addDays(todayKey(),-1),true)}catch(e){}return r}}
HT_KINDS.push(["day","Your day",".ht-day"],["sun","Your week (Sundays)",".ht-sun"],["missy","Yesterday's Daily",".ht-missy"]);

/* ---------- 255: your best month ---------- */
function bestMonth(){let b=null;Object.entries(stats.mon||{}).forEach(([k,M])=>{if(M.score>0&&(!b||M.score>b.M.score))b={k,M}});return b}

/* ---------- 256, 257: tap letters to unscramble; shuffle ---------- */
{const _ru2=renderUn;renderUn=function(){_ru2.apply(this,arguments);try{const tiles=document.querySelector("#evh .un-tiles"),inp=document.getElementById("unIn");if(!tiles||!inp||tiles.dataset.tap)return;tiles.dataset.tap=1;
  const [w]=un.list[un.i];const draw=s=>{tiles.innerHTML=[...s].map((c,i)=>`<button type="button" class="un-t" data-ui="${i}" aria-label="${c}">${c}</button>`).join("");used.clear();wire()};const used=new Set();
  const wire=()=>tiles.querySelectorAll(".un-t").forEach(b=>b.onclick=()=>{if(used.has(b.dataset.ui)||inp.value.length>=w.length)return;used.add(b.dataset.ui);b.classList.add("used");b.disabled=true;inp.value+=b.textContent;hap("light");
    if(inp.value.length===w.length)document.getElementById("unForm").dispatchEvent(new Event("submit",{cancelable:true}))});
  draw(un.sc.s);inp.addEventListener("input",()=>{if(!inp.value){used.clear();tiles.querySelectorAll(".un-t").forEach(b=>{b.classList.remove("used");b.disabled=false})}});
  const row=document.getElementById("unHint").closest(".btns");row.insertAdjacentHTML("afterbegin",`<button class="ghost-btn" id="unBk" type="button">⌫ Clear</button><button class="ghost-btn" id="unMix" type="button">Shuffle</button>`);
  document.getElementById("unBk").onclick=()=>{inp.value="";used.clear();tiles.querySelectorAll(".un-t").forEach(b=>{b.classList.remove("used");b.disabled=false})};
  document.getElementById("unMix").onclick=()=>{un.sc.s=scramble(w);inp.value="";draw(un.sc.s)};
  const f=document.getElementById("unForm");f.addEventListener("submit",()=>setTimeout(()=>{if(un&&un.list[un.i]&&un.list[un.i][0]===w&&document.getElementById("unIn")){document.getElementById("unIn").value="";used.clear();tiles.querySelectorAll(".un-t").forEach(b=>{b.classList.remove("used");b.disabled=false})}},400))}catch(e){console.error(e)}}}

/* ---------- 258: category chips in Find ---------- */
let findCat="";
{const _fm2=findMatches;findMatches=function(q){const m=_fm2.apply(this,arguments);return findCat?m.filter(x=>x.l.cat===findCat):m}}
{const _of2=openFind;openFind=function(){findCat="";_of2.apply(this,arguments);const s=document.querySelector("#evh .fp-sort");if(!s||document.getElementById("fpCats"))return;
  s.insertAdjacentHTML("beforebegin",`<div class="fp-cats" id="fpCats" role="radiogroup" aria-label="Category"><button role="radio" data-fc="" aria-checked="true">All</button>${CATEGORIES.map(c=>`<button role="radio" data-fc="${esc(c.name)}" aria-checked="false">${esc(c.name)}</button>`).join("")}</div>`);
  document.querySelectorAll("#fpCats [data-fc]").forEach(b=>b.onclick=()=>{findCat=b.dataset.fc;document.querySelectorAll("#fpCats [data-fc]").forEach(x=>x.setAttribute("aria-checked",x===b));document.getElementById("fpQ").dispatchEvent(new Event("input"))})}}

/* ---------- 259: settings search understands other words ---------- */
const SET_KW={setQuiet:"sound audio volume mute night silent",setTypeHap:"vibrate vibration haptics touch",setNoFlash:"flashing epilepsy motion light",setBigClue:"text size font large read",setSpaced:"dyslexia reading letter spacing font",
  setLefty:"left hand handed",setHcWell:"colour color blind contrast",setTint:"night blue light eyes warm",setReadClue:"voiceover speak audio tts",setSay:"voiceover speak audio tts",setNudge:"break rest health time",setQuietCele:"popups confetti animation"};
{const _rpi10=renderPaceInfo;renderPaceInfo=function(){_rpi10.apply(this,arguments);Object.entries(SET_KW).forEach(([id,kw])=>{const el=document.getElementById(id);const row=el&&(el.classList.contains("setrow")?el:el.closest(".setgroup"));if(row&&!row.querySelector(".kw"))row.insertAdjacentHTML("beforeend",`<span class="kw" hidden>${kw}</span>`)})}}

/* ---------- 261: my notes ---------- */
function openNotes(){const N=Object.entries(stats.notes||{}).map(([id,t])=>({id,t,i:LEVELS.findIndex(l=>l.id===id)})).filter(x=>x.i>=0),el=document.getElementById("evh");
  el.innerHTML=`<h1>MY <span>NOTES</span></h1><p class="sub">${N.length?`${N.length} puzzle note${N.length===1?"":"s"}. Add one from any puzzle's results.`:"No notes yet. Add one from any puzzle's results."}</p>
   <div class="alist">${N.map(x=>`<div class="nt-row"><button class="arow" data-ni="${x.i}"><span><b>${esc(LEVELS[x.i].name)}</b><span class="sub">${esc(LEVELS[x.i].cat)}</span><span class="fp-note">📝 ${esc(x.t)}</span></span></button><button class="nt-x" data-nd="${esc(x.id)}" aria-label="Delete note for ${esc(LEVELS[x.i].name)}">✕</button></div>`).join("")}</div>
   <div class="btns wide"><button class="big" id="evDone">Done</button></div>`;el.hidden=false;el.scrollTop=0;
  el.querySelectorAll("[data-ni]").forEach(b=>b.onclick=()=>{const i=+b.dataset.ni;if(lockReason(LEVELS[i])){toast("That puzzle is locked");return}closeEvents();startLevel(i)});
  el.querySelectorAll("[data-nd]").forEach(b=>b.onclick=()=>{delete stats.notes[b.dataset.nd];saveStats();openNotes()});document.getElementById("evDone").onclick=closeEvents}

/* ---------- 263: when you earned each sticker ---------- */
{const _oa=openAlbum;openAlbum=function(){_oa.apply(this,arguments);const el=document.getElementById("evh");el.querySelectorAll(".stk").forEach(s=>{const lab=s.getAttribute("aria-label")||"";const m=lab.match(/^(.*), (.*): (collected|not yet)$/);if(!m)return;
    const c=m[1],t=STK_TIERS.findIndex(x=>x[0]===m[2]),at=(stats.stk||{})[c+":"+t];const b=document.createElement("button");b.className=s.className;b.innerHTML=s.innerHTML;b.setAttribute("aria-label",lab);
    b.onclick=()=>{let n=document.getElementById("stkNote");if(!n){document.querySelector("#evh .album").insertAdjacentHTML("beforebegin",`<p class="sub stk-note" id="stkNote" role="status"></p>`);n=document.getElementById("stkNote")}
      n.innerHTML=at?`<b>${esc(c)} · ${esc(m[2])}</b>: collected ${new Date(at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}`:`<b>${esc(c)} · ${esc(m[2])}</b>: ${STK_TIERS[t][1]==="win"?"win any puzzle in this category":STK_TIERS[t][1]==="stars"?`earn ${STK_TIERS[t][2]} stars in this category`:"play every puzzle in this category"}`};s.replaceWith(b)})}}

/* ---------- profile: 254, 255, 261 ---------- */
{const _rp9=renderProfile;renderProfile=function(){_rp9.apply(this,arguments);const el=document.getElementById("profile");if(!el)return;const row=el.querySelector(".pr-row");
  if(row){const bm=bestMonth();row.insertAdjacentHTML("beforeend",`<div class="pr-c"><b>${fmtN(stats.perfectN||0)}</b><span>perfect puzzles</span></div>${bm?`<div class="pr-c"><b>${fmtN(bm.M.score)}</b><span>best month: ${new Date(bm.k+"-15").toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span></div>`:""}`)}
  const links=el.querySelector(".pp-links");if(links&&!document.getElementById("pfNotes")){const n=Object.keys(stats.notes||{}).length;if(n){links.insertAdjacentHTML("beforeend",`<button class="pp-link" id="pfNotes">${ti("pencil")}<span>My notes · ${n}</span></button>`);document.getElementById("pfNotes").onclick=openNotes}}}}

/* ---------- 266, 267: medals ---------- */
let ach5Done=false;
function ach5Init(){if(ach5Done)return;ach5Done=true;ACH.push({id:"perfect2",name:"Perfectionist",ic:"star",unit:"perfect puzzles",t:[1,10,50],v:()=>stats.perfectN||0},{id:"unscr",name:"Unscrambler",ic:"cards",unit:"day Daily Unscramble streak",t:[3,7,30],v:()=>(stats.unDaily||{}).best||0});
  if(stats.achInit&&!stats.ach5Init){stats.ach=stats.ach||{};ACH.slice(-2).forEach(a=>{let v=0;try{v=a.v()}catch(e){}let t=0;a.t.forEach((n,i)=>{if(v>=n)t=i+1});stats.ach[a.id]=Math.max(stats.ach[a.id]||0,t)})}stats.ach5Init=1}
{const _ac5=achCheck;achCheck=function(){ach5Init();return _ac5.apply(this,arguments)}}

/* ---------- hooks ---------- */
{const _rg11=recordGame;recordGame=function(win){const r=_rg11.apply(this,arguments);try{dayCheck()}catch(e){}return r}}
{const _rui=renderUn;renderUn=function(){const r=_rui.apply(this,arguments);try{if(un&&un.daily&&un._fin)dayCheck()}catch(e){}return r}}
