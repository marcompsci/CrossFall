/* ================= Phases 233–247 (21 Nov 2026, morning) ================= */

/* ---------- 233–236: Daily and Speed Unscramble ---------- */
function unDailyList(){const pool=unPool().sort((a,b)=>a[0]<b[0]?-1:1);if(pool.length<5)return null;const R=rng(todayKey().split("-").join("")|0);return shuffle(pool.slice(),R).slice(0,5)}
function unDailyDone(){return(stats.unDaily||{}).last===todayKey()}
function unDailyStreak(){const D=stats.unDaily||{};if(!D.last)return 0;return D.last===todayKey()||D.last===addDays(todayKey(),-1)?D.n||0:0}
function openUnDaily(){const L=unDailyList();if(!L){toast("Solve a few more words to unlock Unscramble");return}if(unDailyDone()){toast(`Today's Unscramble is done: ${(stats.unDaily||{}).score||0} points`);return}
  un={list:L,i:0,got:0,hint:0,score:0,daily:true};renderUn();document.getElementById("evh").hidden=false}
function openUnSpeed(){const pool=unPool();if(pool.length<5){toast("Solve a few more words to unlock Unscramble");return}const R=rng(Date.now()%100000);
  un={list:shuffle(pool.slice(),R).slice(0,30),i:0,got:0,hint:0,score:0,speed:true,end:Date.now()+60000};renderUn();document.getElementById("evh").hidden=false;
  const tick=()=>{if(!un||!un.speed)return;const left=Math.max(0,Math.ceil((un.end-Date.now())/1000));const t=document.getElementById("unTimer");if(t)t.textContent=left+"s";if(left<=0){un.i=un.list.length;renderUn();return}setTimeout(tick,250)};tick()}
{const _ru=renderUn;renderUn=function(){if(un&&un.i>=un.list.length&&(un.daily||un.speed)&&!un._fin){un._fin=1;const el=document.getElementById("evh");
    if(un.daily){const D=stats.unDaily=stats.unDaily||{};D.n=(D.last===addDays(todayKey(),-1)?(D.n||0):0)+1;D.last=todayKey();D.score=un.score;D.best=Math.max(D.best||0,D.n);giveXP(un.got*25,"Daily Unscramble");saveStats();
      el.innerHTML=`<h1>DAILY <span>UNSCRAMBLE</span></h1><div class="pts">${un.got}/5</div><p class="sub">${fmtN(un.score)} points · ${D.n}-day streak</p>
       <div class="btns"><button class="ghost-btn" id="unShare">Share</button><button class="big" id="evDone">Done</button></div>`;
      document.getElementById("unShare").onclick=()=>shareOut(`Crossfall Daily Unscramble ${todayKey()}: ${un.got}/5 · ${D.n}-day streak`)}
    else{const best=stats.unSpeed||0,isBest=un.got>best;if(isBest)stats.unSpeed=un.got;giveXP(un.got*10,"Speed Unscramble");saveStats();
      el.innerHTML=`<h1>SPEED <span>UNSCRAMBLE</span></h1><div class="pts">${un.got}</div><p class="sub">words in 60 seconds${isBest?" · new best!":best?` · best ${best}`:""}</p>
       <div class="btns"><button class="big" id="unAgain">Go again</button><button class="ghost-btn" id="unShare">Share</button></div><div class="btns wide"><button class="ghost-btn" id="evDone">Done</button></div>`;
      document.getElementById("unAgain").onclick=openUnSpeed;document.getElementById("unShare").onclick=()=>shareOut(`Crossfall Speed Unscramble: ${un.got} words in 60 seconds`)}
    document.getElementById("evDone").onclick=()=>{un=null;closeEvents();try{if(hubPage==="Play")renderDailyCard();else if(hubPage==="Learn")renderLearn()}catch(e){}};return}
  if(un&&un._fin)return;_ru.apply(this,arguments);if(!un)return;const el=document.getElementById("evh"),h=el.querySelector("h1"),sub=el.querySelector(".sub");
  if(un.daily&&h){h.innerHTML="DAILY <span>UNSCRAMBLE</span>";if(sub)sub.textContent=`Word ${un.i+1} of 5 · same words for everyone today`}
  if(un.speed&&h){h.innerHTML="SPEED <span>UNSCRAMBLE</span>";if(sub)sub.innerHTML=`<b id="unTimer">${Math.max(0,Math.ceil((un.end-Date.now())/1000))}s</b> · ${un.got} solved`;const sk=document.getElementById("unSkip");if(sk)sk.onclick=()=>{un.i++;un.hint=0;renderUn()}}}}
function unTileHTML(){const L=unDailyList();if(!L||prefs.hideHt&&prefs.hideHt.uns)return"";const done=unDailyDone(),st=unDailyStreak();
  return`<button class="ht ht-uns" id="htUns"><span class="ht-k">Daily Unscramble${st?` · ${st}-day streak`:""}</span><b>${done?`Done: ${fmtN((stats.unDaily||{}).score||0)} points`:"Five words from your bank"}</b><span>${done?"Come back tomorrow":"Same words all day. Takes a minute."}</span></button>`}

/* ---------- 237, 238: mastered words; share my word list ---------- */
function openMastered(){const m=Object.entries(stats.bank||{}).filter(([w,b])=>(b.box||0)>=4).sort((a,b)=>a[0]<b[0]?-1:1),el=document.getElementById("evh");
  el.innerHTML=`<h1>MASTERED <span>WORDS</span></h1><p class="sub">${m.length} word${m.length===1?"":"s"} you've known 4 times or more.</p>
   ${m.length?`<div class="pp-words ms-words">${m.map(([w,b])=>`<button class="pp-word" data-mw="${esc(w)}" title="${esc(b.c||"")}">${esc(w)}</button>`).join("")}</div><p class="sub" id="mwNote" role="status">Tap a word to see its clue.</p>`:`<p class="sub">Keep reviewing. A word moves here after you know it 4 times.</p>`}
   <div class="btns wide"><button class="ghost-btn" id="mwShare" ${m.length?"":"disabled"}>Share my word list</button><button class="big" id="evDone">Done</button></div>`;
  el.hidden=false;el.scrollTop=0;el.querySelectorAll("[data-mw]").forEach(b=>b.onclick=()=>{document.getElementById("mwNote").innerHTML=`<b>${esc(b.dataset.mw)}</b>: ${esc(b.title)}`});
  document.getElementById("mwShare").onclick=shareWordList;document.getElementById("evDone").onclick=closeEvents}
function shareWordList(){const m=Object.entries(stats.bank||{}).filter(([w,b])=>(b.box||0)>=4).map(([w])=>w).sort(),all=Object.keys(stats.bank||{}).length;
  shareOut(`My Crossfall word list: ${m.length} mastered of ${all} words\n${m.slice(0,40).join(" · ")}${m.length>40?" …":""}`)}

/* ---------- Learn additions ---------- */
{const _rl2=renderLearn;renderLearn=function(){_rl2.apply(this,arguments);const g=document.querySelector("#learn .ln-games .ln-gbtns");if(g&&!document.getElementById("lnUnD")){
    g.insertAdjacentHTML("afterbegin",`<button class="pp-link" id="lnUnD">${ti("star")}<span>Daily Unscramble<small>${unDailyDone()?"Done today ✓":unDailyStreak()?`${unDailyStreak()}-day streak`:"Same words all day"}</small></span></button>`);
    g.insertAdjacentHTML("beforeend",`<button class="pp-link" id="lnUnS">${ti("clock")}<span>Speed Unscramble<small>${stats.unSpeed?`best ${stats.unSpeed} words`:"60 seconds"}</small></span></button>`);
    document.getElementById("lnUnD").onclick=openUnDaily;document.getElementById("lnUnS").onclick=openUnSpeed}
  const st=document.querySelector("#learn .ln-study .btns");if(st&&!document.getElementById("lsMastered")){st.insertAdjacentHTML("afterend",`<div class="pp-row"><button class="ghost-btn sm" id="lsMastered">Mastered words</button><button class="ghost-btn sm" id="lsShare">Share my word list</button></div>`);
    document.getElementById("lsMastered").onclick=openMastered;document.getElementById("lsShare").onclick=shareWordList}}}

/* ---------- 236 + 239: profile ---------- */
function catYearHTML(){const y=String(new Date().getFullYear()),n={};Object.entries(stats.mon||{}).forEach(([k,M])=>{if(k.startsWith(y))Object.entries(M.cats||{}).forEach(([c,v])=>{n[c]=(n[c]||0)+(typeof v==="number"?v:(v&&v.games)||0)})});
  const rows=Object.entries(n).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);if(!rows.length)return"";const mx=rows[0][1];
  return`<div class="cy">${rows.map(([c,v])=>{const lk=CAT_LOOK[c]||{g1:"var(--accent)"};return`<div class="cy-r"><span>${esc(c)}</span><span class="cy-b"><i style="width:${Math.round(v/mx*100)}%;background:${lk.g1}"></i></span><b>${v}</b></div>`}).join("")}</div>`}
{const _rp8=renderProfile;renderProfile=function(){_rp8.apply(this,arguments);const el=document.getElementById("profile");if(!el)return;
  const yr=[...el.querySelectorAll(".pp-sec")].find(s=>(s.querySelector(".pp-h")||{}).textContent.includes("so far"));const cy=catYearHTML();
  if(yr&&cy)yr.insertAdjacentHTML("beforeend",`<h3 class="pp-h3">Puzzles by category</h3>${cy}`);
  const recs=[...el.querySelectorAll(".pp-sec")].find(s=>(s.querySelector(".pp-h")||{}).textContent.startsWith("Personal records"));
  if(recs&&(stats.unsc||stats.unSpeed||(stats.unDaily||{}).best)){const row=recs.querySelector(".pr-row");if(row)row.insertAdjacentHTML("beforeend",`<div class="pr-c"><b>${fmtN(stats.unsc||0)}</b><span>best Unscramble</span></div><div class="pr-c"><b>${stats.unSpeed||0}</b><span>Speed Unscramble words</span></div>`)}}}

/* ---------- 240–242: puzzle notes; Find shows your best and sorts ---------- */
function bestOn(id){let b=0;stats.games.forEach(g=>{if(g.id===id&&!g.practice&&g.score>b)b=g.score});return b}
{const _fr=findRow;findRow=function(x){let h=_fr.apply(this,arguments);const b=bestOn(x.l.id),note=(stats.notes||{})[x.l.id];
  if(b||note)h=h.replace(/(<span class="sub">)([^<]*)(<\/span>)/,(m,a,t,c)=>`${a}${t}${b?` · best ${fmtN(b)}`:""}${c}${note?`<span class="fp-note">📝 ${esc(note)}</span>`:""}`);return h}}
{const _fm=findMatches;findMatches=function(q){const m=_fm.apply(this,arguments),s=prefs.findSort||"order";
  if(s==="name")m.sort((a,b)=>a.l.name.localeCompare(b.l.name));else if(s==="stars")m.sort((a,b)=>b.s-a.s||a.l.name.localeCompare(b.l.name));else if(s==="best")m.sort((a,b)=>bestOn(b.l.id)-bestOn(a.l.id));return m}}
{const _of=openFind;openFind=function(){_of.apply(this,arguments);const f=document.getElementById("fpF");if(!f||document.getElementById("fpSort"))return;const cur=prefs.findSort||"order";
  f.insertAdjacentHTML("afterend",`<label class="fp-sort"><span>Sort</span><select id="fpSort">${[["order","Category order"],["name","A–Z"],["stars","Most stars"],["best","Best score"]].map(([k,l])=>`<option value="${k}" ${cur===k?"selected":""}>${l}</option>`).join("")}</select></label>`);
  document.getElementById("fpSort").onchange=e=>{prefs.findSort=e.target.value;savePrefsQuiet();const q=document.getElementById("fpQ");q.dispatchEvent(new Event("input"))}}}
{const _shr6=showResult;showResult=function(){const r=_shr6.apply(this,arguments);try{const el=document.getElementById("result");if(!el||!S||!S.L||!S.L.id||S.L.daily||el.querySelector(".nt-box"))return r;const n=(stats.notes||{})[S.L.id]||"";
    const at=el.querySelector(".rs-extra")||el.querySelector(".rw-line")||el.querySelector(".pts");if(!at)return r;
    at.insertAdjacentHTML("afterend",`<div class="nt-box">${n?`<p class="nt-cur">📝 ${esc(n)}</p>`:""}<button class="ghost-btn sm" id="ntEdit">${n?"Edit my note":"Add a note to this puzzle"}</button><form id="ntForm" hidden><label class="sr" for="ntIn">Note</label><input id="ntIn" maxlength="60" value="${esc(n)}" placeholder="e.g. tricky sports clue" autocomplete="off"><button class="ghost-btn sm" type="submit">Save</button></form></div>`);
    const id=S.L.id;document.getElementById("ntEdit").onclick=()=>{const f=document.getElementById("ntForm");f.hidden=false;document.getElementById("ntIn").focus()};
    document.getElementById("ntForm").onsubmit=e=>{e.preventDefault();stats.notes=stats.notes||{};const v=document.getElementById("ntIn").value.replace(/[<>]/g,"").trim().slice(0,60);if(v)stats.notes[id]=v;else delete stats.notes[id];saveStats();toast(v?"Note saved":"Note removed");
      const box=el.querySelector(".nt-box");box.innerHTML=v?`<p class="nt-cur">📝 ${esc(v)}</p>`:""}}catch(e){console.error(e)}return r}}

/* ---------- 243: the target on the pause card ---------- */
{const _pw3=pauseWell;pauseWell=function(){_pw3.apply(this,arguments);const card=document.querySelector("#pauseOv .pause-card");if(!card||!S||!S.L||!S.L.target||card.querySelector(".pz-target"))return;const t=S.L.target[0];
  const st=card.querySelector(".pz-stats");if(st)st.insertAdjacentHTML("beforebegin",`<div class="pz-target"><span>Target</span>${[...t].map(c=>`<b>${c}</b>`).join("")}${S.targetHit?`<em>built ✓</em>`:""}</div>`)}}

/* ---------- 244: choose your Play tiles ---------- */
const HT_KINDS=[["mc","Monthly challenge",".ht-mc"],["wknd","Weekend challenge",".ht-wknd"],["uns","Daily Unscramble",".ht-uns"],["sky","Tonight's sky",".ht-sky"],["almost","Almost three stars",".ht-almost"],["goal","Your next goal",".ht-goal"],["miss","Back to a category",".ht-miss"],["wtk","Word to know",".ht-wtk"],["week","Last week",".ht-week"]];
{const _htH4=homeTilesHTML;homeTilesHTML=function(){let h=_htH4.apply(this,arguments)||"";const u=unTileHTML();if(u)h=h?h.replace(/<\/div>$/,u+"</div>"):`<div class="home-tiles" id="homeTiles">${u}</div>`;return h}}
{const _rdc6=renderDailyCard;renderDailyCard=function(){const r=_rdc6.apply(this,arguments);try{const hide=prefs.hideHt||{};const ht=document.getElementById("homeTiles");if(ht){HT_KINDS.forEach(([k,,sel])=>{if(hide[k])ht.querySelectorAll(sel).forEach(x=>x.remove())});if(!ht.children.length)ht.remove()}
    const u=document.getElementById("htUns");if(u)u.onclick=openUnDaily}catch(e){console.error(e)}return r}}

/* ---------- 245 fewer celebrations; 246 read the clue aloud ---------- */
{const _qc=queueCele;queueCele=function(c){if(prefs.quietCele&&c&&c.kind==="xp"&&!/level|challenge|constellation/i.test(c.title||"")){try{toast(c.title)}catch(e){}return}return _qc.apply(this,arguments)}}
{const _sw2=selectWord;selectWord=function(w){const prev=S&&S.sel?S.sel.key:null;const r=_sw2.apply(this,arguments);try{if(prefs.readClue&&S&&S.phase==="cross"&&w&&w!==S._lastRead){S._lastRead=w;speakText(clueWords(w))}}catch(e){}return r}}
{const _rpi9=renderPaceInfo;renderPaceInfo=function(){_rpi9.apply(this,arguments);const a=document.getElementById("a11ySlot");if(!a||a.querySelector("#setHt"))return;const hide=prefs.hideHt||{};
  const sw=(id,on,t,d)=>`<button class="setrow" role="switch" id="${id}" aria-checked="${on}"><span><span class="st-t">${t}</span><br><span class="st-d">${d}</span></span><span class="sw"></span></button>`;
  a.insertAdjacentHTML("beforeend",sw("setQuietCele",!!prefs.quietCele,"Fewer celebrations","Small rewards show as a quick note instead of a pop-up.")+sw("setReadClue",!!prefs.readClue,"Read each clue aloud","Speaks the clue when you move to a new word.")+
    `<div class="setgroup" id="setHt"><span class="st-t">Play screen cards</span><span class="st-d">Choose which cards show under the Daily.</span><div class="ht-sw">${HT_KINDS.map(([k,l])=>`<button class="chip-sw" role="switch" data-ht="${k}" aria-checked="${!hide[k]}">${l}</button>`).join("")}</div></div>`);
  [["setQuietCele","quietCele"],["setReadClue","readClue"]].forEach(([id,k])=>{const b=document.getElementById(id);b.onclick=()=>{prefs[k]=!prefs[k];b.setAttribute("aria-checked",!!prefs[k]);savePrefsQuiet()}});
  a.querySelectorAll("[data-ht]").forEach(b=>b.onclick=()=>{const h=prefs.hideHt=prefs.hideHt||{};h[b.dataset.ht]=!h[b.dataset.ht];b.setAttribute("aria-checked",!h[b.dataset.ht]);savePrefsQuiet()})}}

/* ---------- 247: Escape closes more sheets ---------- */
document.addEventListener("keydown",e=>{if(e.key!=="Escape"||e.defaultPrevented)return;const rvw=document.getElementById("review");if(rvw&&!rvw.hidden){e.preventDefault();closeReview();return}
  const st=document.getElementById("settings");if(st&&!st.hidden){e.preventDefault();st.hidden=true;return}const dr=document.getElementById("drawer");if(dr&&!dr.hidden){e.preventDefault();closeDrawer()}});
