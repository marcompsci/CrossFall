import re,datetime
src=open(__import__('pathlib').Path(__file__).resolve().parent.parent / 'CrossfallWidget' / 'QuickDaily.swift').read()
bank=re.findall(r'QDWord\(w: "([A-Z]+)", clue: "([^"]+)"\)',src);M=(1<<64)-1
def seed(s):
    h=1469598103934665603
    for b in s.encode():h^=b;h=(h*1099511628211)&M
    return h
class R:
    def __init__(s,x):s.s=x or 0x9E3779B97F4A7C15
    def next(s):
        s.s=(s.s+0x9E3779B97F4A7C15)&M;z=s.s;z=((z^(z>>30))*0xBF58476D1CE4E5B9)&M;z=((z^(z>>27))*0x94D049BB133111EB)&M;return z^(z>>31)
    def int(s,n):return 0 if n<=1 else s.next()%n
COLS=ROWS=6;JT=3
def fresh(day):
    r=R(seed("qd"+day));p=[]
    while len(p)<3:
        w=bank[r.int(len(bank))]
        if w[0] not in [x[0] for x in p]:p.append(w)
    return [x[0] for x in p]
def tiles(day,wi,word):
    r=R(seed(day+f"t{wi}"));t=list(word);pool="AEIOURSTLNDMCBHPGK"
    while len(t)<8:t.append(pool[r.int(len(pool))])
    for i in range(len(t)-1,0,-1):j=r.int(i+1);t[i],t[j]=t[j],t[i]
    return t
def well(day,words):
    r=R(seed(day+"well"))
    for att in range(60):
        g=[[""]*COLS for _ in range(ROWS)];gaps=[]
        for i in range(3):
            L=len(words[i]);st=r.int(COLS-L+1);gaps.append(st)
            for c in range(COLS):g[JT+i][c]="" if st<=c<st+L else "#"
        if all(any(g[JT+i+1][c]=="#" for c in range(gaps[i],gaps[i]+len(words[i]))) for i in range(2)):return g,gaps,att
    return None,None,60
bad=0;fb=0;maxatt=0;d0=datetime.date(2026,11,1);cl=[]
for k in range(1500):
    day=str(d0+datetime.timedelta(days=k));ws=fresh(day)
    for i,w in enumerate(ws):
        t=tiles(day,i,w)
        assert len(t)==8 and all(t.count(ch)>=w.count(ch) for ch in set(w)),(day,w,t)
    g,gaps,att=well(day,ws)
    if g is None:fb+=1;continue
    maxatt=max(maxatt,att)
    cleared=0
    for i,w in enumerate(ws):
        L=len(w);col=gaps[i]
        free=lambda r:all(g[r][col+j]=="" for j in range(L))
        if not free(0):bad+=1;break
        r=0
        while r+1<ROWS and free(r+1):r+=1
        for j in range(L):g[r][col+j]=w[j]
        keep=[row for row in g if not all(x!="" for x in row)];cleared+=ROWS-len(keep);g=[[""]*COLS for _ in range(ROWS-len(keep))]+keep
    cl.append(cleared)
print("days",1500,"fallback",fb,"max attempts",maxatt,"perfect play clears 3:",sum(c==3 for c in cl),"/",len(cl),"blocked",bad)
print("sample",fresh("2026-11-01"),tiles("2026-11-01",0,fresh("2026-11-01")[0]))
