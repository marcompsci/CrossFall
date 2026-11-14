/* ================= Phases 48–57 (13 Nov 2026) ================= */

/* ---------- 48: every clue in one list ---------- */
function openClueList(){if(!S||S.phase!=="cross")return;const el=document.getElementById("evh"),cur=curWord();
  const grp=d=>S.cw.words.filter(w=>w.dir===d).sort((a,b)=>a.num-b.num);
  const row=w=>{const fill=w.cells.map(k=>S.cw.cells.get(k).val||"·").join("");
    return`<button class="cl-row${w.solved?" done":""}${w===cur?" cur":""}" data-cw="${S.cw.words.indexOf(w)}"${w.solved?' aria-disabled="true"':""}>
      <b class="cl-n">${w.num}</b><span class="cl-t">${esc(w.clue)}<small>${w.ans.length} letters${w.solved?" · solved":` · ${esc(fill)}`}</small></span>${w.solved?`<span class="cl-ok" aria-hidden="true">✓</span>`:""}</button>`};
  const left=S.cw.words.filter(w=>!w.solved).length;
  el.innerHTML=`<h1>ALL <span>CLUES</span></h1><p class="sub">${left} of ${S.cw.words.length} left. Tap a clue to jump to it.</p>
   ${["a","d"].map(d=>{const ws=grp(d);return ws.length?`<div class="panel"><h2 class="ph">${d==="a"?"Across":"Down"}</h2>${ws.map(row).join("")}</div>`:""}).join("")}
   <div class="panel"><h2 class="ph">${ti("pencil")} While you solve</h2>
     <button class="setrow" role="switch" id="clPen" aria-checked="${!!S.pen}"><span><span class="st-t">Unsure letters</span><br><span class="st-d">Letters you type are shown in pencil and Autocheck leaves them alone. Turn it off to write in ink.</span></span><span class="sw"></span></button>
     <button class="setrow" role="switch" id="clBig" aria-checked="${!!prefs.big}"><span><span class="st-t">Bigger text</span><br><span class="st-d">Same as Settings › Bigger text.</span></span><span class="sw"></span></button></div>
   <div class="btns wide"><button class="big" id="evDone">Back to the puzzle</button></div>`;
  el.hidden=false;el.scrollTop=0;
  el.querySelectorAll("[data-cw]").forEach(b=>b.onclick=()=>{const w=S.cw.words[+b.dataset.cw];if(!w||w.solved)return;selectWord(w);closeEvents();renderAll()});
  document.getElementById("clPen").onclick=e=>{S.pen=!S.pen;e.currentTarget.setAttribute("aria-checked",S.pen);renderAll();toast(S.pen?"Pencil on: unsure letters":"Pencil off")};
  document.getElementById("clBig").onclick=e=>{setBigText(!prefs.big);e.currentTarget.setAttribute("aria-checked",!!prefs.big)};
  document.getElementById("evDone").onclick=()=>{closeEvents();renderAll()}}
function clueListBtn(){const bar=document.getElementById("cluebar");if(!bar||document.getElementById("clAll"))return;
  const b=document.createElement("button");b.className="nav";b.id="clAll";b.setAttribute("aria-label","All clues");b.innerHTML=ti("cards");
  bar.insertBefore(b,document.getElementById("clueSay"));b.onclick=openClueList}
{const _rc=renderClue;renderClue=function(){_rc.apply(this,arguments);try{clueListBtn();const b=document.getElementById("clAll");if(b)b.hidden=!(S&&S.phase==="cross");
  const n=document.getElementById("clueNum");if(n&&S&&S.phase==="cross"&&S.pen&&!n.querySelector(".pen-tag"))n.insertAdjacentHTML("beforeend",` <span class="pen-tag">✎</span>`)}catch(e){}}}

/* ---------- 49: unsure letters (pencil) ---------- */
{const _tl=typeLetter;typeLetter=function(ch){
  if(!S||S.phase!=="cross"){return _tl.apply(this,arguments)}
  const k=S.sel.key,cell=S.cw.cells.get(k),assist=S.assist,wasBad=S.bad&&S.bad.has(k);
  _tl.apply(this,arguments);
  if(cell&&!cell.lock){cell.pen=!!S.pen;if(S.pen){if(S.bad&&!wasBad)S.bad.delete(k);S.assist=assist}}
  else if(cell)cell.pen=false;
  try{if(S&&S.phase==="cross")renderCW()}catch(e){}}}
{const _cw=renderCW;renderCW=function(){_cw.apply(this,arguments);if(!S||!S.cw)return;
  document.querySelectorAll("#cw [data-k]").forEach(d=>{const c=S.cw.cells.get(d.dataset.k);const on=!!(c&&c.pen&&c.val&&!c.lock);d.classList.toggle("pen",on);
    if(on&&!/pencil/.test(d.getAttribute("aria-label")))d.setAttribute("aria-label",d.getAttribute("aria-label")+", pencil")})}}

/* ---------- 50: every word, after the game ---------- */
function recapHTML(){if(!S||!S.cw||S.L.lang||S.pp||S.tut)return"";const bank=stats.bank||{};
  const ws=[...S.cw.words].sort((a,b)=>a.dir===b.dir?a.num-b.num:a.dir==="a"?-1:1);
  return`<details class="recap"><summary>${ti("cards")} The words in this puzzle</summary>
   ${ws.map(w=>{const inRv=bank[w.ans]&&bank[w.ans].box===0&&bank[w.ans].sl;return`<div class="rcp-row${w.solved?"":" miss"}"><b>${w.ans}</b><span>${esc(w.clue)}<small>${w.num} ${w.dir==="a"?"Across":"Down"}${w.solved?w.cells.some(k=>S.helped.has(k))?" · with a hint":"":" · not solved"}</small></span>
     <button class="ghost-btn sm" data-study="${w.ans}" aria-pressed="${!!inRv}">${inRv?"In Review ✓":"Study later"}</button></div>`}).join("")}
   <p class="sub">Study later adds a word to Review my words, at the start of the queue.</p></details>`}
function wireRecap(el){el.querySelectorAll("[data-study]").forEach(b=>b.onclick=()=>{const a=b.dataset.study,w=S.cw.words.find(x=>x.ans===a);if(!w)return;
  stats.bank=stats.bank||{};const e=stats.bank[a]||{c:String(w.clue).slice(0,220),k:S.L.cat,n:0,box:0,t:0};e.box=0;e.t=Date.now();e.sl=1;stats.bank[a]=e;saveStats();
  b.textContent="In Review ✓";b.setAttribute("aria-pressed","true");toast(a+" added to Review")})}

/* ---------- 51: daily goal ---------- */
const GOAL_OPTS=[0,1,3,5];
function goalN(){return stats.goal==null?3:stats.goal}
function goalToday(){const t=todayKey(),G=stats.goalLog||{};return G[t]||0}
function goalStreak(){const G=stats.goalLog||{},n=goalN();if(!n)return 0;let s=0;const d=new Date();if((G[todayKey()]||0)<n)d.setDate(d.getDate()-1);
  for(;;){const k=dayKeyOf(d);if((G[k]||0)>=n){s++;d.setDate(d.getDate()-1)}else break}return s}
function goalCount(){const t=todayKey();stats.goalLog=stats.goalLog||{};const before=stats.goalLog[t]||0;stats.goalLog[t]=before+1;
  const keys=Object.keys(stats.goalLog).sort();if(keys.length>60)keys.slice(0,keys.length-60).forEach(k=>delete stats.goalLog[k]);
  const n=goalN();if(n&&before<n&&before+1>=n&&stats.goalPaid!==t){stats.goalPaid=t;stats.sparks=Math.min(SPARK_CAP,sparks()+1);
    queueCele({kind:"xp",title:"Daily goal done",sub:`${n} puzzle${n>1?"s":""} today · +1 spark · ${goalStreak()} day goal streak`})}}
function goalRing(have,n){const p=n?Math.min(1,have/n):0,R=15,C=2*Math.PI*R;
  return`<svg class="gl-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="${R}" class="bg"/><circle cx="18" cy="18" r="${R}" class="fg" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C*(1-p)).toFixed(1)}"/></svg>`}
function goalLine(){const n=goalN();if(!n)return"";const h=goalToday(),st=goalStreak();
  return`<button class="wk-line gl-line" id="glLine"><span>${goalRing(h,n)}<b>Daily goal</b> · ${h>=n?`done ✓`:`${h} of ${n} puzzles`}${st>1?`<small>${st} days in a row</small>`:""}</span><span aria-hidden="true">›</span></button>`}
function openGoal(){const el=document.getElementById("evh"),n=goalN(),G=stats.goalLog||{};const days=[...Array(14)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);return dayKeyOf(d)});
  el.innerHTML=`<h1>DAILY <span>GOAL</span></h1><p class="sub">Count any finished puzzle. Reach your goal for +1 spark a day.</p>
   <div class="panel"><h2 class="ph">Puzzles a day</h2><div class="seg seg4" role="radiogroup" aria-label="Daily goal" id="glSeg">${GOAL_OPTS.map(v=>`<button role="radio" data-gl="${v}" aria-checked="${v===n}">${v||"Off"}</button>`).join("")}</div></div>
   ${n?`<div class="panel"><h2 class="ph">Last two weeks</h2><div class="gl-bars" role="img" aria-label="Puzzles per day for the last 14 days">${days.map(k=>{const v=G[k]||0;return`<span class="${v>=n?"met":""}" style="--h:${Math.min(1,v/Math.max(n,1))*100}%"><i></i><small>${+k.slice(8)}</small></span>`}).join("")}</div>
     <p class="sub">Today ${goalToday()} of ${n} · goal streak ${goalStreak()} day${goalStreak()===1?"":"s"}</p></div>`:""}
   <div class="btns wide"><button class="big" id="evDone">Done</button></div>`;
  el.hidden=false;el.scrollTop=0;
  el.querySelectorAll("[data-gl]").forEach(b=>b.onclick=()=>{stats.goal=+b.dataset.gl;saveStats();openGoal()});
  document.getElementById("evDone").onclick=closeEvents}

/* ---------- 53: category spotlight of the week ---------- */
const SPOT_XP=150,SPOT_MAX=5;
function spotCat(){const wk=weekKeyOf(Date.now()),cats=CATEGORIES.filter(c=>!c.lang&&!c.heal&&c.puzzles.some(l=>!lockReason(l)));if(!cats.length)return null;
  let h=0;for(const ch of "spot"+wk)h=(h*31+ch.charCodeAt(0))>>>0;return cats[h%cats.length]}
function spotSt(){const wk=weekKeyOf(Date.now());if(!stats.spot||stats.spot.wk!==wk)stats.spot={wk,n:0};return stats.spot}
function spotLine(){const c=spotCat();if(!c)return"";const st=spotSt();
  return`<button class="wk-line sl-line" id="slLine" style="--sl:${(CAT_LOOK[c.name]||{}).g1||"var(--accent)"}"><span>${ti("star")} <b>Spotlight: ${esc(c.name)}</b><small>+${SPOT_XP} XP for each win this week · ${st.n}/${SPOT_MAX}</small></span><span aria-hidden="true">›</span></button>`}
function playSpot(){const c=spotCat();if(!c)return;const L=c.puzzles.find(l=>!lockReason(l)&&((store[l.id]||{}).stars||0)<3)||c.puzzles.find(l=>!lockReason(l));if(L)startLevel(LEVELS.indexOf(L))}
function spotAfter(win){if(!win||!S||S.L.custom||S.L.archive||S.pp||S.tut||S.L.daily)return;const c=spotCat();if(!c||S.L.cat!==c.name)return;const st=spotSt();
  if(st.n>=SPOT_MAX)return;st.n++;giveXP(SPOT_XP,`Spotlight: ${c.name} (${st.n}/${SPOT_MAX})`);S.spotGot=1}

/* ---------- 52: Quick Daily inside the app (same puzzle as the widget) ---------- */
const QD_BANK=[["SUN","It rises in the east"],["OWL","Wise night bird"],["MAP","It shows the way"],["JAM","Fruit spread for toast"],["KEY","Opens a lock"],["BEE","Buzzing honey maker"],["INK","A pen is full of it"],["FOX","Clever red animal"],["CUP","Hold your tea in it"],["HAT","Wear it on your head"],["SKY","Blue up above"],["OAR","Row a boat with it"],["ELF","Santa's little helper"],["EGG","A hen lays one"],["NET","Goal or tennis mesh"],["PIE","Dessert with a crust"],["ANT","Tiny picnic visitor"],["ICE","Frozen water"],["BOOK","Read it cover to cover"],["MOON","Night light in the sky"],["TREE","It has bark and leaves"],["SHIP","Big boat"],["FROG","Green hopper by the pond"],["STAR","Twinkles at night"],["RAIN","Falls from clouds"],["DRUM","Hit it with sticks"],["KITE","Fly it on a windy day"],["LAMP","Turn it on to read"],["NEST","Bird's home"],["SNOW","White winter flakes"],["CAKE","Birthday dessert"],["BOLT","Flash of lightning"],["GOLF","Sport with tees and holes"],["WAVE","Ocean ripple, or a hello"],["SALT","Pepper's partner"],["MILK","Pour it on cereal"],["TRAIN","It runs on tracks"],["APPLE","Crisp red fruit"],["CLOUD","Fluffy white thing in the sky"],["PIANO","Instrument with 88 keys"],["TIGER","Striped big cat"],["BREAD","Slice it for a sandwich"],["OCEAN","The Pacific, for one"],["CHAIR","Sit on it"],["LEMON","Sour yellow fruit"],["RIVER","It flows to the sea"],["ROBOT","Machine helper"],["MUSIC","Songs and melodies"],["CLOCK","It tells the time"],["HONEY","Sweet stuff from bees"],["SPOON","Eat soup with it"],["BEACH","Sand by the sea"],["GHOST","Spooky see-through spirit"],["PLANT","It grows in a pot"],["SMILE","A happy face makes one"],["TOAST","Crispy bread, or a cheers"],["BRUSH","Paint or teeth tool"],["CHALK","Write on the board with it"],["STORM","Thunder and lightning"],["FLUTE","Woodwind you play sideways"]];
const QD_M=(1n<<64n)-1n,QD_C=6,QD_R=6,QD_JT=3;
function qdSeed(s){let h=1469598103934665603n;for(const b of new TextEncoder().encode(s)){h^=BigInt(b);h=(h*1099511628211n)&QD_M}return h}
function qdRng(seed){let s=seed===0n?0x9E3779B97F4A7C15n:seed;const next=()=>{s=(s+0x9E3779B97F4A7C15n)&QD_M;let z=s;z=((z^(z>>30n))*0xBF58476D1CE4E5B9n)&QD_M;z=((z^(z>>27n))*0x94D049BB133111EBn)&QD_M;return z^(z>>31n)};
  return{int:n=>n<=1?0:Number(next()%BigInt(n))}}
function qdWords(day){const r=qdRng(qdSeed("qd"+day)),p=[];while(p.length<3){const w=QD_BANK[r.int(QD_BANK.length)];if(!p.some(x=>x[0]===w[0]))p.push(w)}return p}
function qdTiles(day,wi,word){const r=qdRng(qdSeed(day+"t"+wi)),t=[...word],pool="AEIOURSTLNDMCBHPGK";while(t.length<8)t.push(pool[r.int(pool.length)]);
  for(let i=t.length-1;i>0;i--){const j=r.int(i+1);[t[i],t[j]]=[t[j],t[i]]}return t}
function qdWell(day,words){const r=qdRng(qdSeed(day+"well"));
  for(let a=0;a<60;a++){const g=[...Array(QD_R)].map(()=>Array(QD_C).fill("")),gaps=[];
    for(let i=0;i<3;i++){const L=words[i].length,st=r.int(QD_C-L+1);gaps.push(st);for(let c=0;c<QD_C;c++)g[QD_JT+i][c]=c>=st&&c<st+L?"":"#"}
    let ok=true;for(let i=0;i<2;i++){let any=false;for(let c=gaps[i];c<gaps[i]+words[i].length;c++)if(g[QD_JT+i+1][c]==="#")any=true;if(!any)ok=false}
    if(ok)return g}
  const g=[...Array(QD_R)].map(()=>Array(QD_C).fill(""));for(let i=0;i<3;i++){const L=words[i].length,st=i%2===0?0:QD_C-L;for(let c=0;c<QD_C;c++)g[QD_JT+i][c]=c>=st&&c<st+L?"":"#"}return g}
function qdState(){const t=todayKey();let s=stats.qd;if(!s||s.day!==t){const p=qdWords(t);s=stats.qd={day:t,words:p.map(x=>x[0]),clues:p.map(x=>x[1]),phase:0,wi:0,typed:"",used:[],mistakes:0,grid:null,col:0,cleared:0,msg:"",best:(stats.qd||{}).best||0,last:(stats.qd||{}).last||"",streak:(stats.qd||{}).streak||0};s.tiles=qdTiles(t,0,s.words[0])}return s}
function qdScore(s){return Math.max(0,300-s.mistakes*20)+s.cleared*100+(s.cleared===3?200:0)}
function qdCenter(s){s.col=Math.max(0,Math.floor((QD_C-s.words[Math.min(s.wi,2)].length)/2))}
function qdTap(i){const s=qdState();if(s.phase!==0||s.used.includes(i))return;const w=s.words[s.wi];if(s.typed.length>=w.length)return;
  if(s.tiles[i]===w[s.typed.length]){s.typed+=s.tiles[i];s.used.push(i);s.msg="";blip(660,.04);
    if(s.typed.length===w.length){if(s.wi<2){s.wi++;s.tiles=qdTiles(s.day,s.wi,s.words[s.wi]);s.used=[];s.typed="";s.msg="Nice! Next clue."}else{s.phase=1;s.grid=qdWell(s.day,s.words);s.wi=0;qdCenter(s);s.msg="Now drop each word into its gap."}hap("success")}}
  else{s.mistakes++;s.msg=`Not ${s.tiles[i]}. Try another letter.`;hap("error")}saveStats();renderQD()}
function qdMove(d){const s=qdState();if(s.phase!==1)return;s.col=Math.min(Math.max(0,s.col+d),QD_C-s.words[s.wi].length);renderQD()}
function qdDrop(){const s=qdState();if(s.phase!==1)return;const w=[...s.words[s.wi]],L=w.length,free=r=>w.every((_,k)=>s.grid[r][s.col+k]==="");
  if(!free(0)){qdFinish(s);return}let r=0;while(r+1<QD_R&&free(r+1))r++;w.forEach((ch,k)=>s.grid[r][s.col+k]=ch);
  const keep=s.grid.filter(row=>!row.every(x=>x!=="")),cl=QD_R-keep.length;s.grid=[...Array(cl)].map(()=>Array(QD_C).fill("")).concat(keep);s.cleared+=cl;
  s.msg=cl?"Row cleared! +100":"No row cleared. Line the word up with a gap.";if(cl){sfx("clear",1);hap("success")}
  if(s.wi<2){s.wi++;qdCenter(s)}else qdFinish(s);saveStats();renderQD()}
function qdFinish(s){s.phase=2;const y=new Date();y.setDate(y.getDate()-1);if(s.last!==s.day){s.streak=(s.last===dayKeyOf(y)?s.streak:0)+1;s.last=s.day}
  s.best=Math.max(s.best||0,qdScore(s));s.msg=s.cleared===3?"Solved! All three rows cleared.":`Done for today: ${s.cleared} of 3 rows.`;saveStats()}
function qdLine(){const s=qdState();return`<button class="wk-line qd-line" id="qdLine"><span>${ti("cards")} <b>Quick Daily</b> · ${s.phase===2?`✓ ${fmtN(qdScore(s))}`:"3 clues, then the well"}<small>The same puzzle as the Home Screen widget</small></span><span aria-hidden="true">›</span></button>`}
function openQD(){renderQD();const el=document.getElementById("evh");el.hidden=false;el.scrollTop=0}
function renderQD(){const el=document.getElementById("evh"),s=qdState();let body="";
  if(s.phase===0){const w=s.words[s.wi];
    body=`<p class="qd-step">Clue ${s.wi+1} of 3</p><p class="qd-clue">${esc(s.clues[s.wi])}</p>
     <div class="qd-slots" role="group" aria-label="${s.typed.length} of ${w.length} letters">${[...w].map((_,i)=>`<span class="${i<s.typed.length?"on":""}">${s.typed[i]||""}</span>`).join("")}</div>
     <div class="qd-tiles">${s.tiles.map((t,i)=>`<button class="qd-t" data-qt="${i}" ${s.used.includes(i)?'disabled aria-disabled="true"':""} aria-label="Letter ${t}">${t}</button>`).join("")}</div>
     <div class="btns"><button class="ghost-btn" id="qdClr">Clear word</button></div>`}
  else{const L=s.phase===1?s.words[s.wi].length:0;
    body=`${s.phase===1?`<p class="qd-step">Drop ${s.wi+1} of 3 · <b>${s.words[s.wi]}</b></p><div class="qd-piece" aria-hidden="true">${[...s.words[s.wi]].map((c,k)=>`<i style="grid-column:${s.col+k+1}">${c}</i>`).join("")}</div>`:`<p class="qd-step">${s.cleared===3?"Solved":"Finished"} · ${fmtN(qdScore(s))} points${s.streak>1?` · ${s.streak} days in a row`:""}</p>`}
     <div class="qd-well" role="img" aria-label="Small well, ${s.cleared} of 3 rows cleared">${s.grid.map(row=>row.map(x=>`<span class="${x==="#"?"j":x?"l":""}">${x!=="#"?x:""}</span>`).join("")).join("")}</div>
     ${s.phase===1?`<div class="btns qd-ctl"><button class="ghost-btn" id="qdL" aria-label="Move left">◀</button><button class="big" id="qdD">Drop</button><button class="ghost-btn" id="qdR" aria-label="Move right">▶</button></div>`:""}`}
  el.innerHTML=`<h1>QUICK <span>DAILY</span></h1><p class="sub">Three short clues, then drop the words into the well. The same puzzle as the Home Screen widget; the app keeps its own progress.</p>
   <div class="panel qd">${body}<p class="qd-msg" role="status">${esc(s.msg||"")}</p></div>
   <div class="btns wide"><button class="big" id="evDone">Done</button></div>`;
  el.querySelectorAll("[data-qt]").forEach(b=>b.onclick=()=>qdTap(+b.dataset.qt));
  const on=(id,f)=>{const x=document.getElementById(id);if(x)x.onclick=f};on("qdClr",()=>{s.used=[];s.typed="";s.msg="";renderQD()});on("qdL",()=>qdMove(-1));on("qdR",()=>qdMove(1));on("qdD",qdDrop);
  document.getElementById("evDone").onclick=closeEvents}

/* ---------- 54: bigger text from inside a game ---------- */
function setBigText(v){prefs.big=!!v;try{localStorage.setItem("crossfall-a11y",JSON.stringify(prefs))}catch(e){}applyPrefs();try{if(S)renderAll()}catch(e){}
  document.querySelectorAll('[data-pref="big"],#setBig').forEach(x=>x.setAttribute("aria-checked",!!prefs.big))}

/* ---------- 55: export my data ---------- */
function exportCSV(){const q=v=>{const s=String(v==null?"":v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
  const head=["date","category","puzzle","score","stars","won","words","rows","rushes won","seconds","grade","hints","daily","practice"];
  const rows=(stats.games||[]).map(g=>[new Date(g.t).toISOString().slice(0,16).replace("T"," "),g.cat,g.name,g.score,g.stars,g.win?1:0,g.words,g.rows,g.rushW,g.secs,g.grade||"",g.hints||0,g.daily?1:0,g.practice?1:0]);
  const T=stats.tot||{};
  return`Crossfall · my data · ${todayKey()}\nTotals,games ${T.games||0},words ${T.words||0},points ${T.score||0},best ${T.best||0}\n\n`+[head,...rows].map(r=>r.map(q).join(",")).join("\n")}
function exportData(){shareOut(exportCSV());toast("Your last "+(stats.games||[]).length+" games, ready to save or share")}

/* ---------- 56: up next, on the result screen ---------- */
function upNextPick(){if(!S||S.pp||S.tut)return null;const t=todayKey();
  if(!dailyRecord(t)&&!(S.L.daily&&!S.L.archive))return{l:"Play today's Daily",go:()=>playDaily(t)};
  const n=goalN(),h=goalToday();if(n&&h<n)return{l:`${n-h} more for your daily goal`,go:()=>{const L=surprisePick();if(L)startLevel(LEVELS.indexOf(L))}};
  const c=spotCat(),st=spotSt();if(c&&st.n<SPOT_MAX&&S.L.cat!==c.name)return{l:`Spotlight: ${c.name} (+${SPOT_XP} XP)`,go:playSpot};
  const s=qdState();if(s.phase!==2)return{l:"Quick Daily: 3 clues",go:openQD};return null}
function upNextHTML(){const p=upNextPick();if(!p)return"";S.upNext=p;return`<button class="wk-line un-line" id="unGo"><span>${ti("target")} <b>Up next</b> · ${esc(p.l)}</span><span aria-hidden="true">›</span></button>`}
function wireUpNext(el){const b=el.querySelector("#unGo");if(b&&S&&S.upNext){const p=S.upNext;b.onclick=()=>{el.hidden=true;p.go()}}}

/* ---------- 57: search the word book ---------- */
function wbSearch(q){q=String(q||"").trim().toUpperCase();const wb=stats.wb||{};if(q.length<2)return[];
  return Object.keys(wb).filter(w=>w.includes(q)||String(wb[w].c||"").toUpperCase().includes(q)).sort((a,b)=>(b.startsWith(q)-a.startsWith(q))||a.localeCompare(b)).slice(0,40)}
{const _wb=openWordBook;openWordBook=function(){_wb.apply(this,arguments);const el=document.getElementById("wbk"),sum=el&&el.querySelector(".wb-sum");if(!sum)return;
  sum.insertAdjacentHTML("afterend",`<div class="wb-find"><input type="search" id="wbQ" placeholder="Find a word or clue" aria-label="Search your word book" autocomplete="off" autocapitalize="characters" spellcheck="false"><div id="wbHits" role="status" aria-live="polite"></div></div>`);
  const inp=document.getElementById("wbQ"),out=document.getElementById("wbHits");
  inp.oninput=()=>{const hits=wbSearch(inp.value),wb=stats.wb||{};
    out.innerHTML=inp.value.trim().length<2?"":hits.length?`<div class="panel">${hits.map(w=>`<div class="rcp-row"><b>${w}</b><span>${esc(wb[w].c||"")}<small>${esc(wb[w].k||"")} · solved ${wb[w].n} time${wb[w].n===1?"":"s"}</small></span></div>`).join("")}</div>`:`<p class="sub">No words found for “${esc(inp.value.trim())}”.</p>`}}}

/* ---------- hooks ---------- */
{const _rg=recordGame;recordGame=function(win){const r=_rg.apply(this,arguments);try{if(S&&!S.tut&&!S.pp)goalCount();spotAfter(win)}catch(e){console.error(e)}return r}}
{const _or=openRecords;openRecords=function(){_or.apply(this,arguments);const s=document.getElementById("rcShare2");if(s&&!document.getElementById("rcExport")){s.insertAdjacentHTML("afterend",`<button class="ghost-btn" id="rcExport">Export my data</button>`);document.getElementById("rcExport").onclick=exportData}}}
