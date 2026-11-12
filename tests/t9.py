from pathlib import Path
import asyncio,sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'scripts'))
from smoke_test import MOCK
SRC=(Path(__file__).resolve().parent.parent / 'Crossfall' / 'index.html').read_text().replace('<head>','<head>'+MOCK,1)
res=[]
def ck(n,ok,d=""):res.append(ok);print(f"{'PASS' if ok else 'FAIL'}  {n}{('  · '+str(d)) if d else ''}")
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page(viewport={"width":393,"height":852});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.set_content(SRC);await pg.wait_for_timeout(900)
        await pg.evaluate("()=>{stats.tutDone=true;stats.seen17=1;stats.seen18=1;stats.seen19=1;stats.fullHome=1;stats.tot.games=5;document.getElementById('onb').hidden=true;S=null;showMenu()}");await pg.wait_for_timeout(500)
        # drawer: fast flick right closes
        await pg.evaluate("openDrawer()");await pg.wait_for_timeout(450)
        bb=await pg.evaluate("(()=>{const r=document.getElementById('drawer').getBoundingClientRect();return[r.left,r.top,r.width,r.height]})()")
        x,y=bb[0]+bb[2]*0.3,bb[1]+bb[3]*0.55
        await pg.mouse.move(x,y);await pg.mouse.down()
        for i in range(1,9):await pg.mouse.move(x+i*25,y+1);await pg.wait_for_timeout(8)
        mid=await pg.evaluate("new DOMMatrix(getComputedStyle(document.getElementById('drawer')).transform).m41")
        await pg.mouse.up();await pg.wait_for_timeout(600)
        ck("drawer follows the finger during the drag",mid>150,round(mid))
        ck("a quick flick right closes the drawer",await pg.evaluate("document.getElementById('drawer').hidden&&document.getElementById('scrim').hidden&&document.getElementById('hubMenu').getAttribute('aria-expanded')==='false'"))
        # slow small drag snaps back
        await pg.evaluate("openDrawer()");await pg.wait_for_timeout(450)
        await pg.mouse.move(x,y);await pg.mouse.down()
        for i in range(1,6):await pg.mouse.move(x+i*10,y);await pg.wait_for_timeout(60)
        await pg.wait_for_timeout(120);await pg.mouse.up();await pg.wait_for_timeout(500)
        ck("a slow short drag springs back open",await pg.evaluate("!document.getElementById('drawer').hidden&&getComputedStyle(document.getElementById('drawer')).transform==='none'"))
        # drag left rubber-bands
        await pg.mouse.move(x+60,y);await pg.mouse.down()
        for i in range(1,8):await pg.mouse.move(x+60-i*30,y);await pg.wait_for_timeout(10)
        rb=await pg.evaluate("new DOMMatrix(getComputedStyle(document.getElementById('drawer')).transform).m41")
        await pg.mouse.up();await pg.wait_for_timeout(500)
        ck("dragging past the open edge resists (rubber band)",-100<rb<0,round(rb))
        ck("a drag doesn't trigger the menu item under the finger",await pg.evaluate("!document.getElementById('drawer').hidden&&document.querySelectorAll('.ov:not(#menu):not([hidden])').length===0"))
        # vertical scroll gesture is left alone
        await pg.mouse.move(x,y);await pg.mouse.down();await pg.mouse.move(x+3,y-60);await pg.mouse.up();await pg.wait_for_timeout(300)
        ck("vertical movement isn't treated as a close",await pg.evaluate("!document.getElementById('drawer').hidden"))
        await pg.evaluate("closeDrawer()");await pg.wait_for_timeout(400)
        # overlays: enter and exit along the same path, no tap capture while leaving
        await pg.evaluate("openRecords()");await pg.wait_for_timeout(60)
        o1=await pg.evaluate("+getComputedStyle(document.getElementById('evh')).opacity");await pg.wait_for_timeout(400)
        o2=await pg.evaluate("+getComputedStyle(document.getElementById('evh')).opacity")
        ck("sheets fade and rise in",o1<1 and o2==1,[o1,o2])
        await pg.evaluate("closeEvents()");await pg.wait_for_timeout(60)
        st=await pg.evaluate("(()=>{const c=getComputedStyle(document.getElementById('evh'));return[c.display,c.pointerEvents,+c.opacity]})()")
        await pg.wait_for_timeout(450)
        st2=await pg.evaluate("getComputedStyle(document.getElementById('evh')).display")
        ck("sheets leave the way they came, ignoring taps while leaving",st[0]!='none' and st[1]=='none' and st[2]<1 and st2=='none',[st,st2])
        # toast keyframes fixed
        ck("toast animation is the centered one again",await pg.evaluate("(()=>{for(const sh of document.styleSheets)for(const r of sh.cssRules)if(r.type===7&&r.name==='pop'&&r.cssText.includes('-50%'))return true;return false})()"))
        ck("only one @keyframes pop",await pg.evaluate("(()=>{let n=0;for(const sh of document.styleSheets)for(const r of sh.cssRules)if(r.type===7&&r.name==='pop')n++;return n})()")==1)
        # tabs direction
        await pg.evaluate("goPage('Profile')");d1=await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--dir').trim()")
        await pg.evaluate("goPage('Play')");d2=await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--dir').trim()")
        ck("tabs slide from the direction you move",d1=='1' and d2=='-1',[d1,d2])
        ck("titles: one colour on sheets, accent kept on the result",await pg.evaluate("(()=>{openRecords();const s=document.querySelector('#evh h1 span');return getComputedStyle(s).color===getComputedStyle(document.querySelector('#evh h1')).color})()"))
        ck("no JS errors",not errs,errs[:2])
        await b.close()
    print(f"{sum(res)}/{len(res)}")
asyncio.run(main())
