/* ================= Phases 123–147 (20 Nov 2026, evening) ================= */
function prRec(){stats.prr=stats.prr||{fastest:0,combo:0,clean:0};return stats.prr}

/* ---------- 123: pause the well ---------- */
function pauseWell(){if(!S||S.phase!=="drop"||S.paused||S.tut)return;S.paused=true;S._pauseFreeze=S.freezeUntil||0;S.freezeUntil=Infinity;
  const ov=document.getElementById("pauseOv")||(()=>{const d=document.createElement("div");d.id="pauseOv";d.className="pause-ov";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-labelledby","pauseT");document.body.appendChild(d);return d})();
  ov.innerHTML=`<div class="pause-card"><h2 id="pauseT">Paused</h2><p class="sub">${esc(S.L.name)} · ${fmtN(S.score)} points</p><button class="big" id="pzResume">Resume</button><button class="ghost-btn" id="pzMenu">Menu</button></div>`;
  ov.hidden=false;hap("light");document.getElementById("pzResume").focus();
  document.getElementById("pzResume").onclick=resumeWell;document.getElementById("pzMenu").onclick=()=>{ov.hidden=true;S.paused=false;S.freezeUntil=performance.now()+600000;openDrawer()}}
function resumeWell(){const ov=document.getElementById("pauseOv");if(ov)ov.hidden=true;if(!S)return;S.paused=false;S.freezeUntil=0;resumeCountdown();if(!(S.freezeUntil>performance.now()))S.freezeUntil=performance.now()+300}
{const _rcd=resumeCountdown;resumeCountdown=function(){if(S&&S.paused)return;return _rcd.apply(this,arguments)}}
function wellPauseBtn(){const w=document.getElementById("wellWrap");if(!w||document.getElementById("wellPause"))return;const b=document.createElement("button");b.id="wellPause";b.className="well-pause";b.setAttribute("aria-label","Pause");b.innerHTML="<span></span><span></span>";b.onclick=pauseWell;w.appendChild(b)}
{const _rw3=renderWell;renderWell=function(){_rw3.apply(this,arguments);try{wellPauseBtn();const b=document.getElementById("wellPause");if(b)b.hidden=!(S&&S.phase==="drop"&&!S.tut)}catch(e){}}}
document.addEventListener("keydown",e=>{if((e.key==="p"||e.key==="P")&&S&&S.phase==="drop"&&!(e.target&&e.target.closest&&e.target.closest("input,textarea"))){S.paused?resumeWell():pauseWell()}});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"&&S&&S.phase==="drop"&&!S.tut&&prefs.autoPause!==false)pauseWell()});

/* ---------- 125: the landing sound drops in pitch as the stack rises ---------- */
{const _lk3=lock;lock=function(){const top=S&&S.active?Math.min(...absCells(S.active).map(c=>c.r)):0;const r=_lk3.apply(this,arguments);
  try{if(S&&!S.tut)blip(180+Math.max(0,top)*22,.035)}catch(e){}return r}}

/* ---------- 126 + 127: clean solves ---------- */
{const _cw=checkWords;checkWords=function(cell){if(!S)return _cw.apply(this,arguments);const before=S.cw.words.filter(w=>w.solved).length,wr=S.wrong;
  const r=_cw.apply(this,arguments);if(!S||!S.cw)return r;
  if(S.wrong&&S.wrong!==wr){S.clean=0;chipClean();return r}
  const now=S.cw.words.filter(w=>w.solved);if(now.length>before&&!S.tut){
    for(const w of now.slice(0)){if(w._cleanSeen)continue;w._cleanSeen=1;const helped=S.helped&&w.cells.some(k=>S.helped.has(k));
      if(helped){S.clean=0;continue}S.clean=(S.clean||0)+1;if(S.clean>=3){addPts("clean",25);toast(`CLEAN ×${S.clean} +25`)}
      const P=prRec();if(S.clean>P.clean){P.clean=S.clean}}chipClean()}
  return r}}
function chipClean(){const bar=document.getElementById("cluebar")||document.querySelector(".cluebar");if(!bar||!S)return;let c=document.getElementById("cleanChip");
  if(!c){c=document.createElement("span");c.id="cleanChip";c.className="clean-chip";c.setAttribute("aria-live","polite");bar.appendChild(c)}
  const n=S.clean||0;c.hidden=n<2;c.textContent=`Clean ×${n}`}
{const _sl5=startLevel;startLevel=function(){const r=_sl5.apply(this,arguments);try{if(S){S.clean=0;S.paused=false;const c=document.getElementById("cleanChip");if(c)c.hidden=true}}catch(e){}return r}}

/* ---------- 134 records: best combo, fastest crossword ---------- */
{const _as5=afterSettle;afterSettle=function(){try{if(S&&!S.tut){const P=prRec();if((S.combo||0)>P.combo)P.combo=S.combo}}catch(e){}return _as5.apply(this,arguments)}}
{const _rg6=recordGame;recordGame=function(win){try{if(S&&win&&S.crossMs>0&&!S.dropOnly){const P=prRec();if(!P.fastest||S.crossMs<P.fastest)P.fastest=S.crossMs;
    stats.catFast=stats.catFast||{};const c=S.L.cat;if(c&&(!stats.catFast[c]||S.crossMs<stats.catFast[c]))stats.catFast[c]=S.crossMs}}catch(e){}return _rg6.apply(this,arguments)}}

/* ---------- home tiles: 128 beat yesterday, 129 weekly summary, 130 almost 3 stars, 136 tonight's sky ---------- */
function weekSum(){const t=todayKey(),start=addDays(t,-((new Date().getDay()+6)%7)-7),end=addDays(start,6);
  const g=stats.games.filter(x=>{const k=dayKeyOf(new Date(x.t));return k>=start&&k<=end&&!x.practice});if(!g.length)return null;
  return{start,n:g.length,stars:g.reduce((a,x)=>a+(x.stars||0),0),best:Math.max(...g.map(x=>x.score)),days:new Set(g.map(x=>dayKeyOf(new Date(x.t)))).size}}
function almostPick(){const c=LEVELS.map((l,i)=>({l,i,s:(store[l.id]||{}).stars||0})).filter(x=>x.s===2&&!lockReason(x.l));if(!c.length)return null;const d=todayKey().split("-").join("")|0;return c[d%c.length]}
function tonightPick(){const c=CATEGORIES.find(x=>x.name==="Night Sky");if(!c)return null;const d=(todayKey().split("-").join("")|0);for(let k=0;k<c.puzzles.length;k++){const i=(d+k)%c.puzzles.length,p=c.puzzles[i];const li=LEVELS.findIndex(l=>l.id===p.id);if(li>=0&&!lockReason(LEVELS[li]))return{li,p,theme:NS_THEMES[i%10],q:STAR_WORDS[d%STAR_WORDS.length]}}return null}
function homeTilesHTML(){const out=[],h=new Date().getHours(),wk=weekSum(),mon=new Date().getDay()===1;
  if(mon&&wk&&stats.wkSeen!==wk.start)out.push(`<div class="ht ht-week" id="htWeek"><span class="ht-k">Last week</span><b>${wk.n} puzzle${wk.n===1?"":"s"} on ${wk.days} day${wk.days===1?"":"s"}</b><span>${wk.stars}★ · best ${fmtN(wk.best)}</span><button class="ht-x" id="htWeekX" aria-label="Dismiss last week's summary">✕</button></div>`);
  const tn=h>=19||h<4?tonightPick():null;if(tn)out.push(`<button class="ht ht-sky" id="htSky"><span class="ht-k">Tonight's sky · ${esc(tn.theme)}</span><b>${esc(tn.p.name)}</b><span>“${esc(tn.q[0].length>70?tn.q[0].slice(0,68)+"…":tn.q[0])}”</span></button>`);
  const al=almostPick();if(al)out.push(`<button class="ht ht-almost" id="htAlmost" data-li="${al.i}"><span class="ht-k">Almost three stars</span><b>${esc(al.l.name)}</b><span>${esc(al.l.cat)} · ★★☆</span></button>`);
  return out.length?`<div class="home-tiles" id="homeTiles">${out.join("")}</div>`:""}
function yesterdayLine(){const y=dailyRecord(addDays(todayKey(),-1)),t=dailyRecord(todayKey());if(!y||t||!y.score)return"";return`<p class="dc-beat">Yesterday you scored <b>${fmtN(y.score)}</b>. Beat it today.</p>`}
{const _rdc2=renderDailyCard;renderDailyCard=function(){const r=_rdc2.apply(this,arguments);try{const box=document.getElementById("dailyCard");if(!box)return r;
    if(!box.querySelector(".dc-beat")){const yl=yesterdayLine();const btns=box.querySelector(".dc-btns");if(yl&&btns)btns.insertAdjacentHTML("beforebegin",yl)}
    const old=document.getElementById("homeTiles");if(old)old.remove();const h=homeTilesHTML();if(h){const at=box.querySelector(".dc-next")||box.querySelector(".dc-btns");if(at)at.insertAdjacentHTML("afterend",h);else box.insertAdjacentHTML("beforeend",h)}
    const on=(id,f)=>{const x=document.getElementById(id);if(x)x.onclick=f};
    on("htWeekX",()=>{stats.wkSeen=(weekSum()||{}).start;saveStats();document.getElementById("htWeek").remove()});
    on("htSky",()=>{const t=tonightPick();if(t)startLevel(t.li)});on("htAlmost",()=>startLevel(+document.getElementById("htAlmost").dataset.li))}catch(e){console.error(e)}return r}}

/* ---------- profile: 131 favourite words, 132 hero colour, 133 motto, 134 records, 144 sort, 145 avatar, 146 XP help, 147 collapse ---------- */
const HERO_COLS=[["auto","Auto",""],["ember","Ember","#ff8a3d,#8a2c0c"],["ocean","Ocean","#2e8bd8,#0d2a55"],["forest","Forest","#3fa66b,#0f3a24"],["grape","Grape","#8a5cf0,#2a1660"],["rose","Rose","#e2577f,#5a1630"],["slate","Slate","#6b7a90,#1e2430"]];
function recordsHTML(){const P=prRec(),W=stats.ws||{};const it=(v,l)=>`<div class="pr-c"><b>${v}</b><span>${l}</span></div>`;
  return`<div class="pr-row">${it(P.fastest?fmtTime(P.fastest/1000):"–","fastest crossword")}${it("LV "+(W.bestLv||1),"best well level")}${it(P.combo?"×"+P.combo:"–","best combo")}${it(P.clean||0,"clean solves in a row")}</div>`}
function favWordsHTML(){const f=(stats.favW||[]).filter(w=>(stats.bank||{})[w]);if(!f.length)return"";return`<div class="pp-fw"><small>♥ Words you love</small><div class="pp-words">${f.map(w=>`<span class="pp-word fav">${esc(w)}</span>`).join("")}</div></div>`}
{const _rp4=renderProfile;renderProfile=function(){_rp4.apply(this,arguments);const el=document.getElementById("profile");if(!el)return;
  const hero=el.querySelector(".pp-hero");
  /* 132 colour */
  const hc=HERO_COLS.find(c=>c[0]===prefs.heroCol);if(hero&&hc&&hc[2]){const [a,b]=hc[2].split(",");hero.style.setProperty("--g1",a);hero.style.setProperty("--g2",b)}
  /* 133 motto */
  if(hero&&stats.motto){const t=hero.querySelector(".pp-title");if(t)t.insertAdjacentHTML("afterend",`<span class="pp-motto">“${esc(stats.motto)}”</span>`)}
  const form=document.getElementById("nickForm");if(form&&!form.querySelector("#mottoIn")){
    form.insertAdjacentHTML("beforeend",`<label class="pp-fl" for="mottoIn">Motto <small>(optional)</small></label><input id="mottoIn" maxlength="40" value="${esc(stats.motto||"")}" placeholder="A few words about you" autocomplete="off">
      <div class="pp-fl">Card colour</div><div class="hc-row" role="radiogroup" aria-label="Card colour">${HERO_COLS.map(([k,l,g])=>`<button type="button" role="radio" class="hc" data-hc="${k}" aria-checked="${(prefs.heroCol||"auto")===k}" aria-label="${l}" style="${g?`background:linear-gradient(135deg,${g})`:""}">${g?"":"A"}</button>`).join("")}</div>`);
    form.querySelectorAll("[data-hc]").forEach(b=>b.onclick=()=>{prefs.heroCol=b.dataset.hc;savePrefsQuiet();form.querySelectorAll("[data-hc]").forEach(x=>x.setAttribute("aria-checked",x===b));
      const c=HERO_COLS.find(x=>x[0]===prefs.heroCol);if(c&&c[2]){const [a,z]=c[2].split(",");hero.style.setProperty("--g1",a);hero.style.setProperty("--g2",z)}else renderProfile()});
    const sub=form.onsubmit;form.onsubmit=e=>{stats.motto=(document.getElementById("mottoIn").value||"").replace(/[<>]/g,"").trim().slice(0,40);sub(e)}}
  /* 145 avatar opens the look sheet */
  const av=hero&&hero.querySelector(".pf-av");if(av&&!av.closest("button")){av.setAttribute("role","button");av.setAttribute("tabindex","0");av.setAttribute("aria-label","Change avatar and title");av.onclick=openLook;av.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openLook()}}}
  /* 146 what XP is for */
  const lvb=hero&&hero.querySelector(".pp-lv");if(lvb&&!lvb.querySelector("#xpHelp")){lvb.insertAdjacentHTML("beforeend",`<button class="xp-help" id="xpHelp" aria-expanded="false" aria-controls="xpBox">How to earn XP</button>`);
    lvb.insertAdjacentHTML("afterend",`<div class="xp-box" id="xpBox" hidden><p>You earn XP for every puzzle you finish, more for stars, golds and Dailies. Quests, weekly challenges, the Spotlight, Twists, Groups and lighting constellations all give extra.</p></div>`);
    document.getElementById("xpHelp").onclick=e=>{const b=document.getElementById("xpBox");b.hidden=!b.hidden;e.currentTarget.setAttribute("aria-expanded",!b.hidden)}}
  /* 134 + 127 records */
  const how=[...el.querySelectorAll(".pp-sec")].find(s=>(s.querySelector(".pp-h")||{}).textContent==="How you play");if(how){how.insertAdjacentHTML("afterend",`<section class="pp-sec"><h2 class="pp-h">Personal records</h2>${recordsHTML()}</section>`)}
  /* 131 favourites */
  const ws=el.querySelector(".pp-words");if(ws){const fv=favWordsHTML();if(fv)ws.insertAdjacentHTML("beforebegin",fv);
    const note=document.getElementById("ppWordNote");ws.querySelectorAll("button.pp-word").forEach(b=>b.addEventListener("click",()=>{const w=b.textContent,isF=(stats.favW||[]).includes(w);
      note.insertAdjacentHTML("beforeend",` <button class="ghost-btn sm fav-btn" id="favBtn" aria-pressed="${isF}">${isF?"♥ Loved":"♡ Love it"}</button>`);
      document.getElementById("favBtn").onclick=()=>{stats.favW=stats.favW||[];const i=stats.favW.indexOf(w);if(i>=0)stats.favW.splice(i,1);else stats.favW.unshift(w);stats.favW=stats.favW.slice(0,30);saveStats();hap("select");renderProfile()}}))}
  /* 144 sort categories */
  const cats=el.querySelector(".pp-cats");if(cats){const sec=cats.closest(".pp-sec"),h=sec.querySelector(".pp-h");const mode=prefs.catSort||"order";
    h.insertAdjacentHTML("beforeend",`<button class="pp-sort" id="ppSort" aria-label="Sort categories. Now: ${mode==="most"?"most stars first":"default order"}">${mode==="most"?"Most stars":"Default order"} ⇅</button>`);
    if(mode==="most"){[...cats.children].sort((a,b)=>parseInt(b.querySelector(".v").textContent)-parseInt(a.querySelector(".v").textContent)).forEach(x=>cats.appendChild(x))}
    document.getElementById("ppSort").onclick=()=>{prefs.catSort=mode==="most"?"order":"most";savePrefsQuiet();renderProfile()}}
  /* 147 fold sections, remembered */
  const fold=prefs.ppFold||{};el.querySelectorAll(".pp-sec").forEach(s=>{const h=s.querySelector(".pp-h");if(!h)return;const key=(h.firstChild&&h.firstChild.textContent||"").trim();if(!key)return;
    const tb=document.createElement("button");tb.className="pp-fold";tb.setAttribute("aria-expanded",!fold[key]);tb.setAttribute("aria-label",(fold[key]?"Show ":"Hide ")+key);tb.innerHTML='<span aria-hidden="true">⌄</span>';h.appendChild(tb);
    s.classList.toggle("folded",!!fold[key]);tb.onclick=()=>{fold[key]=!fold[key];prefs.ppFold=fold;savePrefsQuiet();s.classList.toggle("folded",!!fold[key]);tb.setAttribute("aria-expanded",!fold[key]);tb.setAttribute("aria-label",(fold[key]?"Show ":"Hide ")+key)}})}}

/* ---------- 135 fastest crossword in the category deep dive ---------- */
{const _ocd=openCatDeep;openCatDeep=function(name){_ocd.apply(this,arguments);const el=document.getElementById("evh"),ms=(stats.catFast||{})[name];if(!el||!ms||el.querySelector(".cd-fast"))return;
  const h=el.querySelector("h1");if(h)h.insertAdjacentHTML("afterend",`<p class="sub cd-fast">${ti("clock")} Your fastest ${esc(name)} crossword: <b>${fmtTime(ms/1000)}</b></p>`)}}

/* ---------- 137 breathing options ---------- */
const BREATHS={calm:{n:"Calm",steps:[["Breathe in",4],["Hold",4],["Breathe out",6]]},box:{n:"Box",steps:[["Breathe in",4],["Hold",4],["Breathe out",4],["Hold",4]]},sleep:{n:"Wind down",steps:[["Breathe in",4],["Hold",7],["Breathe out",8]]}};
{const _ob=openBreath;openBreath=function(){_ob.apply(this,arguments);const el=document.getElementById("evh"),go=document.getElementById("brGo");if(!el||!go)return;
  const B=prefs.breath||{p:"calm",n:3};const opt=`<div class="br-opts"><div class="seg" role="radiogroup" aria-label="Breathing pattern" id="brPat">${Object.entries(BREATHS).map(([k,v])=>`<button role="radio" data-bp="${k}" aria-checked="${B.p===k}">${v.n}</button>`).join("")}</div>
     <div class="seg" role="radiogroup" aria-label="Number of breaths" id="brN">${[1,3,5].map(n=>`<button role="radio" data-bn="${n}" aria-checked="${B.n===n}">${n} breath${n>1?"s":""}</button>`).join("")}</div></div>`;
  go.closest(".btns").insertAdjacentHTML("beforebegin",opt);const sub=el.querySelector(".sub");const desc=()=>{const s=BREATHS[B.p].steps;sub.textContent=`${B.n} slow breath${B.n>1?"s":""}. ${s.map(([t,n])=>`${t.replace("Breathe ","")} ${n}`).join(", ")}.`};desc();
  el.querySelectorAll("[data-bp]").forEach(b=>b.onclick=()=>{B.p=b.dataset.bp;prefs.breath=B;savePrefsQuiet();el.querySelectorAll("[data-bp]").forEach(x=>x.setAttribute("aria-checked",x===b));desc()});
  el.querySelectorAll("[data-bn]").forEach(b=>b.onclick=()=>{B.n=+b.dataset.bn;prefs.breath=B;savePrefsQuiet();el.querySelectorAll("[data-bn]").forEach(x=>x.setAttribute("aria-checked",x===b));desc()});
  let stop=false,timer=0;const ring=document.getElementById("brRing"),cue=document.getElementById("brCue");
  const run=(cycle,step)=>{if(stop)return;const S2=BREATHS[B.p].steps;if(cycle>=B.n){cue.textContent="Well done. Carry that calm with you.";ring.className="br-ring";stats.breaths=(stats.breaths||0)+1;saveStats();hap("success");return}
    const [t,s]=S2[step];cue.textContent=`${t} · ${s}`;ring.className="br-ring "+(t==="Hold"?"hold":t==="Breathe in"?"in":"out");if(t==="Hold"&&step>0&&S2[step-1][0]==="Breathe out")ring.className="br-ring out";ring.style.setProperty("--d",s+"s");hap("light");
    let left=s;const tk=()=>{if(stop)return;left--;if(left>0){cue.textContent=`${t} · ${left}`;timer=setTimeout(tk,1000)}else run(step===S2.length-1?cycle+1:cycle,(step+1)%S2.length)};timer=setTimeout(tk,1000)};
  go.onclick=e=>{e.currentTarget.hidden=true;el.querySelector(".br-opts").hidden=true;run(0,0)};
  document.getElementById("evDone").onclick=()=>{stop=true;clearTimeout(timer);closeEvents()}}}

/* ---------- 138 left-handed, 139 spaced clues, 140 quiet hours, 141 fewer flashes, 124 grid lines ---------- */
function applyComfort2(){const h=document.documentElement;h.classList.toggle("lefty",!!prefs.lefty);h.classList.toggle("spaced",!!prefs.spaced);h.classList.toggle("noflash",!!prefs.noFlash);h.classList.toggle("wgrid",!!prefs.wellGrid)}
function quietNow(){if(!prefs.quiet)return false;const h=new Date().getHours();return h>=22||h<7}
{const _bl=blip;blip=function(){if(quietNow())return;return _bl.apply(this,arguments)}}
{const _sf=sfx;sfx=function(){if(quietNow())return;return _sf.apply(this,arguments)}}
{const _rpi5=renderPaceInfo;renderPaceInfo=function(){_rpi5.apply(this,arguments);const a=document.getElementById("a11ySlot");if(!a||a.querySelector("#setLefty"))return;
  const sw=(id,on,t,d)=>`<button class="setrow" role="switch" id="${id}" aria-checked="${on}"><span><span class="st-t">${t}</span><br><span class="st-d">${d}</span></span><span class="sw"></span></button>`;
  a.insertAdjacentHTML("beforeend",sw("setWGrid",!!prefs.wellGrid,"Grid lines in the well","Faint lines to help you line up drops.")+sw("setLefty",!!prefs.lefty,"Left-handed controls","Puts the drop and turn buttons on the left.")+
    sw("setSpaced",!!prefs.spaced,"Roomier clue text","More space between letters and lines in clues.")+sw("setNoFlash",!!prefs.noFlash,"Fewer flashes","Rows glow instead of flashing when they clear.")+
    sw("setQuiet",!!prefs.quiet,"Quiet hours","No game sounds from 10 pm to 7 am.")+sw("setAutoPause",prefs.autoPause!==false,"Pause when you leave","The well pauses if you switch apps."));
  [["setWGrid","wellGrid",0],["setLefty","lefty",0],["setSpaced","spaced",0],["setNoFlash","noFlash",0],["setQuiet","quiet",0],["setAutoPause","autoPause",1]].forEach(([id,k,def])=>{const b=document.getElementById(id);
    b.onclick=()=>{prefs[k]=def?prefs[k]===false:!prefs[k];b.setAttribute("aria-checked",def?prefs[k]!==false:!!prefs[k]);applyComfort2();savePrefsQuiet();try{if(S)renderAll()}catch(e){}}})}}

/* ---------- 142 My games marks your best run on each puzzle ---------- */
{const _oh=openHistory;openHistory=function(){_oh.apply(this,arguments);const el=document.getElementById("evh"),G=stats.games||[];if(!el)return;const best={};
  G.forEach((g,i)=>{const k=g.daily?"d:"+dayKeyOf(new Date(g.t)):g.id;if(!k)return;if(best[k]==null||g.score>G[best[k]].score)best[k]=i});const bi=new Set(Object.values(best));
  const cnt={};G.forEach(g=>{const k=g.daily?"d:"+dayKeyOf(new Date(g.t)):g.id;cnt[k]=(cnt[k]||0)+1});
  el.querySelectorAll("[data-hg]").forEach(b=>{const i=+b.dataset.hg,g=G[i];if(!g)return;const k=g.daily?"d:"+dayKeyOf(new Date(g.t)):g.id;
    if(bi.has(i)&&cnt[k]>1&&!b.querySelector(".hs-best")){b.classList.add("best");const s=b.querySelector(".hs-s");if(s)s.insertAdjacentHTML("beforebegin",`<span class="hs-best">Best</span>`)}})}}

/* ---------- 143 next in this category ---------- */
function nextInCat(){if(!S||!S.L||!S.L.cat||S.L.daily||S.li<0)return-1;const c=S.L.cat;for(let k=1;k<=LEVELS.length;k++){const i=(S.li+k)%LEVELS.length,l=LEVELS[i];if(l.cat===c&&!((store[l.id]||{}).stars)&&!lockReason(l))return i}return-1}
{const _shr3=showResult;showResult=function(){const r=_shr3.apply(this,arguments);try{const el=document.getElementById("result");const ni=nextInCat();if(el&&ni>=0&&!el.querySelector("#nextCat")){const p=el.querySelector(".rx-line")||el.querySelector(".pts");
    if(p){p.insertAdjacentHTML("afterend",`<div class="btns"><button class="ghost-btn sm" id="nextCat">Next in ${esc(S.L.cat)}: ${esc(LEVELS[ni].name)} ›</button></div>`);document.getElementById("nextCat").onclick=()=>{document.querySelectorAll(".ov").forEach(o=>{if(o.id!=="menu")o.hidden=true});startLevel(ni)}}}}catch(e){console.error(e)}return r}}

try{applyComfort2()}catch(e){}
