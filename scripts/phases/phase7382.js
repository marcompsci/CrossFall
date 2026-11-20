/* ================= Phases 73–82 (19 Nov 2026) ================= */

/* ---------- 73: a smoother keyboard: key preview, softer press, letters pop in ---------- */
function keyPop(b,show){let p=document.getElementById("kpop");if(!p){p=document.createElement("div");p.id="kpop";p.setAttribute("aria-hidden","true");document.body.appendChild(p)}
  if(!show){p.classList.remove("on");return}const r=b.getBoundingClientRect();p.textContent=b.dataset.ch;
  p.style.left=(r.left+r.width/2)+"px";p.style.top=(r.top-6)+"px";p.style.setProperty("--kw",Math.max(r.width,34)+"px");p.classList.remove("on");void p.offsetWidth;p.classList.add("on")}
function wireKeyFeel(){const pad=document.getElementById("pad");if(!pad)return;
  pad.querySelectorAll(".k").forEach(b=>{if(b._feel)return;b._feel=1;let t=0;
    const up=()=>{clearTimeout(t);t=setTimeout(()=>{b.classList.remove("down");if(b.dataset.ch)keyPop(b,false)},70)};
    b.addEventListener("pointerdown",()=>{clearTimeout(t);b.classList.add("down");if(b.dataset.ch){keyPop(b,true);if(prefs.keyTick!==false)hap("select")}});
    b.addEventListener("pointerup",up);b.addEventListener("pointerleave",up);b.addEventListener("pointercancel",up)})}
{const _tl3=typeLetter;typeLetter=function(ch){const k=S&&S.phase==="cross"&&S.sel?S.sel.key:null;const r=_tl3.apply(this,arguments);
  if(k&&!calmNow()){const d=document.querySelector(`#cw [data-k="${k}"]`);if(d){d.classList.remove("typed");void d.offsetWidth;d.classList.add("typed");setTimeout(()=>d.classList.remove("typed"),220)}}return r}}

/* ---------- 74: the keypad changes smoothly between typing and dropping ---------- */
{const _rp=renderPad;renderPad=function(){const was=padMode;_rp.apply(this,arguments);if(padMode!==was){const pad=document.getElementById("pad");
  if(pad&&!calmNow()){pad.classList.remove("pad-in");void pad.offsetWidth;pad.classList.add("pad-in")}}wireKeyFeel()}}

/* ---------- 75: drag the falling word with your finger ---------- */
const DRAG={on:false};
function wellCell(){const c=document.querySelector("#well .wc"),w=c?c.getBoundingClientRect().width:0;if(w>8)return w+1;const v=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--wc"));return(v>8?v:24)+1}
function wireWellDrag(){const w=document.getElementById("well");if(!w||w._drag)return;w._drag=1;
  w.addEventListener("pointerdown",e=>{if(prefs.wellDrag===false||!S||S.phase!=="drop"||!S.active||(e.pointerType==="mouse"&&e.button!==0))return;
    DRAG.on=true;DRAG.id=e.pointerId;DRAG.x0=DRAG.x=e.clientX;DRAG.y0=DRAG.y=e.clientY;DRAG.t0=performance.now();DRAG.cols=0;DRAG.rows=0;DRAG.moved=false;DRAG.cw=wellCell();
    try{w.setPointerCapture(e.pointerId)}catch(_){}});
  w.addEventListener("pointermove",e=>{if(!DRAG.on||e.pointerId!==DRAG.id||!S||S.phase!=="drop"||!S.active)return;
    const dx=e.clientX-DRAG.x0,dy=e.clientY-DRAG.y0,wantC=Math.round(dx/DRAG.cw);
    if(Math.abs(dx)>8||Math.abs(dy)>8)DRAG.moved=true;
    while(DRAG.cols<wantC){const c0=S.active.c;move(1);if(S.active&&S.active.c===c0)break;DRAG.cols++}
    while(DRAG.cols>wantC){const c0=S.active.c;move(-1);if(S.active&&S.active.c===c0)break;DRAG.cols--}
    const wantR=Math.floor(Math.max(0,dy)/(DRAG.cw*1.2));if(Math.abs(dx)<DRAG.cw*.8)while(DRAG.rows<wantR&&S.active){softDrop();DRAG.rows++}
    DRAG.x=e.clientX;DRAG.y=e.clientY;e.preventDefault()},{passive:false});
  const end=e=>{if(!DRAG.on||e.pointerId!==DRAG.id)return;DRAG.on=false;if(!S||S.phase!=="drop"||!S.active)return;
    const dt=performance.now()-DRAG.t0,dy=e.clientY-DRAG.y0,dx=e.clientX-DRAG.x0;if(Math.abs(dx)>8||Math.abs(dy)>8)DRAG.moved=true;
    if(!DRAG.moved&&dt<300)rotate();
    else if(dy>DRAG.cw*1.5&&dy/Math.max(dt,1)>0.7&&Math.abs(dx)<dy*.6)hardDrop()};
  w.addEventListener("pointerup",end);w.addEventListener("pointercancel",e=>{DRAG.on=false})}

/* ---------- 76: Tetris-style handling ---------- */
const LOCK_RESETS=15;
function landed(){return S&&S.active&&collides(absCells(S.active,1,0))}
{const _mv=move;move=function(dc){const c0=S&&S.active?S.active.c:null;_mv.apply(this,arguments);if(S&&S.active&&S.active.c!==c0&&landed()&&(S.lockResets||0)<LOCK_RESETS){S.landT=0;S.lockResets=(S.lockResets||0)+1}}}
{const _ro=rotate;rotate=function(){const k0=S&&S.active?JSON.stringify(S.active.cells):null;_ro.apply(this,arguments);if(S&&S.active&&JSON.stringify(S.active.cells)!==k0&&landed()&&(S.lockResets||0)<LOCK_RESETS){S.landT=0;S.lockResets=(S.lockResets||0)+1}}}
{const _sp=spawnPiece;spawnPiece=function(){S&&(S.lockResets=0);return _sp.apply(this,arguments)}}
{const _sd=softDrop;softDrop=function(){const r0=S&&S.active?S.active.r:null;_sd.apply(this,arguments);if(S&&S.active&&S.active.r!==r0)addPts("drop",1)}}

/* ---------- 77: levels, perfect clears and the four-row Crossfall ---------- */
const ROWS_PER_LEVEL=5;
function wellLevel(){return S?1+Math.floor((S.linesCleared||0)/ROWS_PER_LEVEL):1}
{const _fm=fallMs;fallMs=function(){const base=_fm.apply(this,arguments);if(!S||S.tut||S.zen)return base;return Math.round(base*Math.max(.5,Math.pow(.92,wellLevel()-1)))}}
function lvBadge(){const w=document.getElementById("wellWrap");if(!w)return;let b=document.getElementById("wellLv");
  if(!b){b=document.createElement("div");b.id="wellLv";b.setAttribute("aria-hidden","true");w.appendChild(b)}const lv=wellLevel();b.textContent="LV "+lv;b.hidden=!S||S.tut||S.zen}
{const _as=afterSettle;afterSettle=function(){if(S){const lc=S.linesCleared||0,prev=S._lcSeen||0;S._lcSeen=lc;
    if(lc>prev){const lv=1+Math.floor(lc/ROWS_PER_LEVEL),lv0=1+Math.floor(prev/ROWS_PER_LEVEL);
      if(S.grid.every(r=>r.every(c=>!c))){addPts("perfect",1000);toast("PERFECT CLEAR +1000");try{popCall("PERFECT!","clear")}catch(e){}hap("success")}
      if(lv>lv0&&!S.tut&&!S.zen){toast("LEVEL "+lv+" · faster pieces");announce("Level "+lv+". Pieces fall faster.");try{wellFx("thump")}catch(e){}}}
    try{lvBadge()}catch(e){}}
  return _as.apply(this,arguments)}}

/* ---------- 78: a slam you can see, and combos that climb ---------- */
{const _hd=hardDrop;hardDrop=function(){if(!S||S.phase!=="drop"||!S.active)return _hd.apply(this,arguments);
  const from=absCells(S.active);let d=0;while(!collides(absCells(S.active,d+1,0)))d++;const r=_hd.apply(this,arguments);
  if(d>1&&!calmNow()){const well=document.getElementById("well");const cols=[...new Set(from.map(x=>x.c))];
    cols.forEach(c=>{const top=Math.max(0,Math.min(...from.filter(x=>x.c===c).map(x=>x.r))),bot=top+d;const a=well.querySelector(`.wc[data-r="${top}"][data-c="${c}"]`),z=well.querySelector(`.wc[data-r="${Math.min(ROWS-1,bot)}"][data-c="${c}"]`);
      if(!a||!z)return;const t=document.createElement("i");t.className="drop-trail";t.style.left=a.offsetLeft+"px";t.style.top=a.offsetTop+"px";t.style.width=a.offsetWidth+"px";t.style.height=(z.offsetTop-a.offsetTop)+"px";
      well.appendChild(t);setTimeout(()=>t.remove(),260)})}
  return r}}
{const _jc=juiceClear;juiceClear=function(n,combo){_jc.apply(this,arguments);try{if(n>=4)popCall("CROSSFALL!","clear");blip(520+Math.min(8,combo||1)*70,.07)}catch(e){}}}

/* ---------- 79: Bay City retired ---------- */
function migrateCats(){if(stats.catMig==="nov26")return;const names=new Set(CATEGORIES.map(c=>c.name));
  if(Array.isArray(stats.freeCats)){const keep=stats.freeCats.filter(c=>names.has(c));const spare=["Night Sky","Kitchen","Music","Sports","Books","Arcade"].filter(c=>names.has(c)&&!keep.includes(c));
    while(keep.length<stats.freeCats.length&&spare.length)keep.push(spare.shift());stats.freeCats=keep}
  if(stats.diff)Object.keys(stats.diff).forEach(k=>{if(!names.has(k))delete stats.diff[k]});stats.catMig="nov26";try{saveStats()}catch(e){}}

/* ---------- 81: a word to carry, after Night Sky ---------- */
const STAR_WORDS=[
 ["I believe a leaf of grass is no less than the journey-work of the stars.","Walt Whitman, Song of Myself (1855)"],
 ["The heavens declare the glory of God; and the firmament sheweth his handywork.","Psalm 19:1 (KJV)"],
 ["Look round at the courses of the stars, as if thou wert going along with them.","Marcus Aurelius, Meditations (tr. George Long)"],
 ["The journey of a thousand li commences with a single step.","Lao Tzu, Tao Te Ching 64 (tr. James Legge)"],
 ["Hitch your wagon to a star.","Ralph Waldo Emerson, Civilization (1870)"],
 ["The life which is unexamined is not worth living.","Socrates, in Plato's Apology (tr. Benjamin Jowett)"],
 ["When I consider thy heavens, the work of thy fingers, the moon and the stars, which thou hast ordained; what is man, that thou art mindful of him?","Psalm 8:3–4 (KJV)"],
 ["Two things fill the mind with ever new and increasing admiration and awe: the starry heavens above and the moral law within.","Immanuel Kant, Critique of Practical Reason (tr. T. K. Abbott)"],
 ["Canst thou bind the sweet influences of Pleiades, or loose the bands of Orion?","Job 38:31 (KJV)"],
 ["Wonder is the feeling of a philosopher, and philosophy begins in wonder.","Plato, Theaetetus (tr. Benjamin Jowett)"],
 ["Know thyself.","Inscription at the Temple of Apollo, Delphi"]];
function starWord(){const i=strSeed("sw"+todayKey()+(S&&S.L?S.L.id:""))%STAR_WORDS.length;return STAR_WORDS[i]}
function starWordHTML(){if(!S||!S.L||S.L.cat!=="Night Sky")return"";const [q,by]=starWord();
  return`<div class="panel sw-panel"><h2 class="ph">${ti("star")} A word to carry</h2><blockquote>“${esc(q)}”</blockquote><p class="sub">${esc(by)}</p></div>`}

/* ---------- 82: Night Sky looks like a night sky ---------- */
function nightSkyLook(){document.documentElement.classList.toggle("nightsky",!!(S&&S.L&&S.L.cat==="Night Sky"))}

/* ---------- hooks ---------- */
{const _sl3=startLevel;startLevel=function(){const r=_sl3.apply(this,arguments);try{nightSkyLook();if(S){S._lcSeen=0;lvBadge()}wireWellDrag()}catch(e){}return r}}
{const _sm=showMenu;showMenu=function(){const r=_sm.apply(this,arguments);try{if(!S)document.documentElement.classList.remove("nightsky")}catch(e){}return r}}
try{migrateCats()}catch(e){}
function setsHTML7382(){const sw=(id,on,t,d)=>`<button class="setrow" role="switch" id="${id}" aria-checked="${on}"><span><span class="st-t">${t}</span><br><span class="st-d">${d}</span></span><span class="sw"></span></button>`;
  return sw("setWellDrag",prefs.wellDrag!==false,"Drag pieces on the well","Slide a falling word with your finger, tap to turn it, flick down to slam it.")+
    sw("setKeyTick",prefs.keyTick!==false,"Key taps","A light tap you can feel on each letter key (with Haptics on).")}
{const _rpi2=renderPaceInfo;renderPaceInfo=function(){_rpi2.apply(this,arguments);const a=document.getElementById("a11ySlot");if(!a||a.querySelector("#setWellDrag"))return;
  a.insertAdjacentHTML("afterbegin",setsHTML7382());[["setWellDrag","wellDrag"],["setKeyTick","keyTick"]].forEach(([id,k])=>{const b=document.getElementById(id);
    b.onclick=()=>{prefs[k]=prefs[k]===false;b.setAttribute("aria-checked",prefs[k]!==false);savePrefsQuiet()}})}}
