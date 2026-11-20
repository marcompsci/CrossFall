function renderProfile(){if(gc.native)gcLoad("total");
  const el=document.getElementById("profile");if(!el)return;el.classList.remove("hud");el.classList.add("pp");
  const T=stats.tot,nick=stats.nick||(cloud.uid?defaultNick():"Player"),L=levelOf(xpTotal()),rk=myRank();
  const ds=dailyStreak(),ms=typeof pzStreak==="function"?pzStreak("mini"):{n:0,best:0},cs=typeof pzStreak==="function"?pzStreak("chunks"):{n:0,best:0};
  const bankN=Object.keys(stats.bank||{}).length,bankRecent=Object.entries(stats.bank||{}).sort((a,b)=>b[1].t-a[1].t).slice(0,10);
  const maxStars=LEVELS.length*3,sTot=starsTotal(),pct=(a,b)=>b?Math.round(a/b*100):0;
  const recent=stats.games.slice(0,14).reverse();
  const catRows=CATEGORIES.map(c=>{const got=c.puzzles.reduce((t,p)=>t+((store[p.id]||{}).stars||0),0),max=c.puzzles.length*3,played=stats.games.filter(g=>g.cat===c.name).length;return{c:c.name,got,max,played}});
  const fav=catRows.slice().sort((a,b)=>b.played-a.played||b.got-a.got)[0],look=CAT_LOOK[fav&&fav.played?fav.c:"Night Sky"]||{g1:"#5a45c4",g2:"#140f3d"};
  const sec=(t,body,cls="")=>`<section class="pp-sec ${cls}"><h2 class="pp-h">${t}</h2>${body}</section>`;
  const link=(id,ic,t)=>`<button class="pp-link" id="${id}">${ti(ic)}<span>${t}</span></button>`;
  const stat=(v,l,s)=>`<div class="pp-stat"><b>${v}</b><span>${l}</span>${s?`<small>${s}</small>`:""}</div>`;
  const bar=(f,col)=>`<span class="pp-bar" aria-hidden="true"><i style="width:${Math.round(Math.max(0,Math.min(1,f))*100)}%;${col?`background:${col}`:""}"></i></span>`;
  const tiles=[...nick.toUpperCase().replace(/\s+/g," ").slice(0,12)].map(ch=>ch===" "?`<i class="sp"></i>`:`<b>${esc(ch)}</b>`).join("");
  const rankTxt=rk?`Ranked <b>#${fmtN(rk.pos)}</b> of ${fmtN(rk.of)}`:(cloud.db||(gc.native&&gc.auth&&gc.auth.ok))?"Finish a puzzle to get ranked":gc.native?"Sign in to Game Center to get ranked":"Rankings are offline";
  const dayTxt=!T.games?"Play your first puzzle":ds.doneToday?"Today's Daily is done":"Today's Daily is waiting";
  el.innerHTML=`
   <section class="pp-hero hero" style="--g1:${look.g1};--g2:${look.g2}">
     <div class="pp-top">${avatarHTML()}<div class="pp-who">
       <div class="pp-name" role="img" aria-label="${esc(nick)}">${tiles}</div>
       <span class="pp-title">${esc(titleOf())}</span></div>
       <button class="pp-edit" id="pfEdit" aria-expanded="false" aria-controls="nickForm">${ti("pencil")}<span class="sr">Edit name</span></button></div>
     <form class="pf-nick" id="nickForm" hidden><label class="sr" for="nickIn">Player name</label><input id="nickIn" maxlength="16" value="${esc(nick)}" autocomplete="off"><button type="submit">Save</button></form>
     <div class="pp-lv"><span class="pp-lvn">Level <b>${L.lv}</b></span><span class="pp-xp">${fmtN(xpTotal())} XP · ${fmtN(L.toNext)} to level ${L.lv+1}</span></div>
     <div class="pp-lvbar" role="img" aria-label="${L.pct}% of the way to level ${L.lv+1}"><i style="width:${L.pct}%"></i></div>
     <div class="pp-meta"><span>${rankTxt}</span><span class="pp-day${ds.doneToday?" ok":""}">${ds.doneToday?"✓ ":""}${dayTxt}</span></div>
   </section>
   <div class="pp-big">
     <div class="pp-tile fire"><span class="pp-ic">${ti("fire")}</span><b>${fmtN(ds.n)}</b><span>day streak</span><small>best ${fmtN((stats.dstreak||{}).best||0)} · ${ds.freezes} freeze${ds.freezes===1?"":"s"}</small></div>
     <div class="pp-tile"><span class="pp-ic">${ti("trophy")}</span><b>${fmtN(T.best)}</b><span>best game</span><small>${fmtN(T.score)} total</small></div>
     <div class="pp-tile"><span class="pp-ic">${ti("cards")}</span><b>${fmtN(T.words)}</b><span>words solved</span><small>${fmtN(bankN)} in your bank</small></div>
   </div>
   <nav class="pp-links" aria-label="Your stuff">
     ${link("pfLook","smile","Avatar &amp; title")}${link("pfRewards","star","Rewards &amp; themes")}${link("pfAch","medal","Achievements")}${link("pfIns","numbers","Insights")}
     ${link("pfRec","trophy","Records")}${link("pfHist","clock","My games")}${link("pfSb","numbers","Scoreboard")}${link("pfWeek","cards","Share my week")}
   </nav>
   ${sec("How you play",`<div class="pp-stats">
     ${stat(T.games?pct(T.wins,T.games)+"%":"–","solve rate",`${fmtN(T.wins)} of ${fmtN(T.games)} games`)}
     ${stat(T.rushT?pct(T.rushW,T.rushT)+"%":"–","rushes won",`${fmtN(T.rushW)} of ${fmtN(T.rushT)}`)}
     ${stat(fmtN(sTot)+"★","stars",`of ${fmtN(maxStars)}`)}
     ${stat(fmtN(T.golds||0),"gold solves","no help used")}
     ${stat(fmtN(T.targets),"targets built",`best chain ×${T.chainBest||0}`)}
     ${stat(fmtN(curWeek()),"points this week","")}
     ${stat(fmtN(ms.n)+"d","Mini streak",`best ${fmtN(ms.best)}`)}
     ${stat(fmtN(cs.n)+"d","Chunks streak",`best ${fmtN(cs.best)}`)}</div>`)}
   ${sec(`Recent scores`,`<div class="chart pp-chart" id="scoreChart">${recent.length?scoreChart(recent):`<p class="pp-empty">Play a puzzle and your scores will show up here.</p>`}</div>`)}
   ${sec("Stars by category",`<div class="pp-cats">${catRows.map(r=>{const lk=CAT_LOOK[r.c]||{g1:"#888"};
     return`<div class="pp-cat">${catIcon(r.c,lk.g1)}<span class="n">${esc(r.c)}</span>${bar(r.max?r.got/r.max:0,lk.g1)}<span class="v">${r.got}<small>/${r.max}</small></span></div>`}).join("")}</div>`)}
   ${sec(`Word bank <small>${fmtN(bankN)}</small>`,(bankN?`<div class="pp-words">${bankRecent.map(([w,b])=>`<span class="pp-word" title="${esc(b.c)}">${esc(w)}</span>`).join("")}</div>`:`<p class="pp-empty">Every word you solve lands here.</p>`)
     +`<div class="pp-row">${bankN?`<button class="ghost-btn sm" id="pfReview">Review 10 words</button>`:""}<button class="ghost-btn sm" id="pfWb">Word book · ${fmtN(Object.keys(stats.wb||{}).length)}</button></div>`)}
   ${sec(`Badges <small>${Object.keys(stats.badges||{}).length}</small>`,badgesHTML()+`<div class="pp-row"><button class="ghost-btn sm" id="pfEv">Events &amp; seasons</button></div>`)}
   ${sec("Rivals",(()=>{const rv=rivalsOf();return rv.length?`<div class="pp-list">${rv.slice(0,5).map(r=>`<div class="pp-li"><span>${esc(r.n)}</span><b>${r.w}–${r.l}${r.t?"–"+r.t:""}</b></div>`).join("")}</div>`:`<p class="pp-empty">No duels yet. Challenge a friend from any result screen.</p>`})()+`<div class="pp-row"><button class="ghost-btn sm" id="pfDu">Duels &amp; rivals</button></div>`)}
   ${healProfile?sec("Your check-in focus",`<div class="chipline">${healFocus().slice(0,3).map(t=>`<span>${themeLabel(t)}</span>`).join("")}</div><div class="pp-row"><button class="ghost-btn sm" id="pfRetake">Change my answers</button></div>`):""}
   ${sec("Your rush timers",`<div class="pp-list">${Object.entries(RUSH_MODES).map(([m,l])=>{const lim=prefs.adapt===false?RUSH_SECS:rushLimit(m);
     return`<div class="pp-li"><span>${l}</span>${bar(lim/RUSH_SECS)}<b>${fmtTime(lim)}</b></div>`}).join("")}</div><p class="pp-note">Shorter means faster rushes. ${prefs.adapt===false?"The adaptive timer is off.":"They tune themselves as you play."}</p>`)}
   ${sec("Last games",stats.games.length?`<div class="pp-list">${stats.games.slice(0,8).map(g=>`<div class="pp-li g"><span class="d">${new Date(g.t).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
       <span class="m"><b>${esc(g.name)}</b><i>${esc(g.cat)} · ${g.win?starStr(g.stars):"well filled"}${g.grade?` · ${g.grade}`:""}</i></span><b>${fmtN(g.score)}</b></div>`).join("")}</div>`:`<p class="pp-empty">No games yet.</p>`)}`;
  const form=document.getElementById("nickForm"),ed=document.getElementById("pfEdit");
  ed.onclick=()=>{form.hidden=!form.hidden;ed.setAttribute("aria-expanded",!form.hidden);if(!form.hidden){const i=document.getElementById("nickIn");i.focus();i.select()}};
  form.onsubmit=e=>{e.preventDefault();const v=document.getElementById("nickIn").value.replace(/[^\p{L}\p{N} _.-]/gu,"").trim().slice(0,16);
    if(!v)return;stats.nick=cleanNick(v);saveStats();pushCloud();toast("Name saved");renderProfile()};
  const on=(id,f)=>{const x=document.getElementById(id);if(x)x.onclick=f};
  on("pfRetake",()=>showQuiz(null));on("pfReview",openReview);on("pfRewards",openRewards);on("pfSb",()=>openScoreboard&&openScoreboard("daily"));on("pfWb",()=>openWordBook());on("pfWeek",shareWeek);on("pfLook",openLook);on("pfAch",openAchievements);on("pfIns",openInsights);on("pfRec",openRecords);on("pfHist",openHistory);on("pfEv",openEvents);on("pfDu",openDuels);
  wireChart();
}
