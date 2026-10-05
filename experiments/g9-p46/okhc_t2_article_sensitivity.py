#!/usr/bin/env python3
"""G9-P46 T2 OKHC article-only sensitivity audit.

Reads the three canonical JSONL shards without modifying them. This script reproduces the stricter article-only sensitivity layer, not the canonical broader D1 receipt. It separates:
- corpus/schema/provenance census,
- exact-text duplicate ecology,
- Modern-Korean article admission,
- R0 legacy EDF and R1 exclusive marker-event observability,
- matched four-year quotient/fiber trajectories.

No Unicode normalization is performed on the selected top-level OKHC text field.
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import json
import math
from pathlib import Path
from typing import Any

EDF = {
    "CONTRAST": ["그러나", "그런데", "하지만", "그렇지만", "반면", "오히려", "도리어", "그럼에도", "비록"],
    "CAUSE_RESULT": ["그래서", "그러므로", "따라서", "때문에", "그러자", "그리하여", "결국", "그러니", "그러면", "이에"],
    "TEMPORAL": ["그때", "이때", "먼저", "뒤에", "후에", "마침내", "이윽고", "곧", "동안", "한동안"],
    "EXPANSION": ["그리고", "또한", "또", "게다가", "더구나", "즉", "이를테면", "예컨대", "다시 말해"],
}
MARKERS = [m for ms in EDF.values() for m in ms]
M2C = {m:c for c,ms in EDF.items() for m in ms}

def norm(c):
    s = sum(v for v in c.values() if v > 0)
    return {} if s <= 0 else {k:v/s for k,v in c.items() if v > 0}

def wjs(p, q, alpha=.5):
    p, q = norm(p), norm(q)
    if not p and not q:
        return 0.0
    keys = set(p) | set(q)
    mix = {k: alpha*p.get(k,0.0) + (1-alpha)*q.get(k,0.0) for k in keys}
    def kl(x):
        return sum(v*math.log(v/mix[k]) for k,v in x.items() if v > 0)
    return alpha*kl(p) + (1-alpha)*kl(q)

def qfid(p_counts, q_counts):
    p, q = norm(p_counts), norm(q_counts)
    pc, qc = collections.Counter(), collections.Counter()
    for m,v in p.items(): pc[M2C[m]] += v
    for m,v in q.items(): qc[M2C[m]] += v
    dq = wjs(pc,qc)
    df = 0.0
    for cls in set(pc)|set(qc):
        pm, qm = pc.get(cls,0.0), qc.get(cls,0.0)
        rm = .5*(pm+qm)
        if rm <= 0: continue
        a = pm/(pm+qm)
        pp = {m:v/pm for m,v in p.items() if M2C[m] == cls} if pm else {}
        qq = {m:v/qm for m,v in q.items() if M2C[m] == cls} if qm else {}
        df += rm*wjs(pp,qq,a)
    dt = wjs(p,q)
    return dq, df, dt, dt-dq-df

def legacy_counts(text):
    return collections.Counter({m:text.count(m) for m in MARKERS if text.count(m)})

def exclusive_counts(text):
    hits=[]
    for order,m in enumerate(MARKERS):
        start=0
        while True:
            i=text.find(m,start)
            if i < 0: break
            hits.append((i,i+len(m),order,m))
            start=i+1
    hits.sort(key=lambda x:(x[0],-(x[1]-x[0]),x[2]))
    out=collections.Counter()
    occupied=-1
    for st,en,_order,m in hits:
        if st < occupied: continue
        out[m]+=1
        occupied=en
    return out

def parse_tags(raw):
    if not raw: return ()
    obj=json.loads(raw) if isinstance(raw,str) else raw
    return tuple(obj) if isinstance(obj,list) else ()

def add_agg(agg,text,r0,r1):
    agg["docs"] += 1
    agg["chars"] += len(text)
    if sum(r0.values()) > 0:
        agg["docs_any"] += 1
    agg["R0"].update(r0)
    agg["R1"].update(r1)

def new_agg():
    return {"docs":0,"chars":0,"docs_any":0,"R0":collections.Counter(),"R1":collections.Counter()}

def runs(years):
    ys=sorted(years)
    if not ys: return []
    out=[]; st=pr=ys[0]
    for y in ys[1:]:
        if y == pr+1: pr=y
        else:
            out.append((st,pr,pr-st+1)); st=pr=y
    out.append((st,pr,pr-st+1))
    return out

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("shards", nargs=3, type=Path)
    ap.add_argument("--output", type=Path)
    args=ap.parse_args()

    hashes={}
    rows=0
    lang=collections.Counter()
    script=collections.Counter()
    hosts=collections.Counter()
    years=collections.Counter()
    ids=set()
    duplicate_ids=0
    exact_text=collections.Counter()
    natural=collections.defaultdict(new_agg)
    dedup=collections.defaultdict(new_agg)
    seen_in_cell=collections.defaultdict(set)

    for path in args.shards:
        h=hashlib.sha256()
        with path.open("rb") as f:
            for line in f:
                h.update(line)
                if not line.strip(): continue
                r=json.loads(line)
                rows += 1
                rid=r.get("id")
                if rid in ids: duplicate_ids += 1
                ids.add(rid)
                y=r.get("year")
                years[y]+=1
                lang[r.get("language")]+=1
                script[r.get("script")]+=1
                md=r.get("metadata") or {}
                hosts[md.get("host_ko")]+=1
                text=r.get("text") or ""
                exact_text[hashlib.sha256(text.encode("utf-8")).digest()[:16]] += 1

                if r.get("corpus") != "Korean Newspaper Archive": continue
                if r.get("doc_type") != "news_article": continue
                if r.get("language") != "Modern Korean" or not isinstance(y,int): continue
                host=md.get("host_ko")
                scr=r.get("script")
                tags=parse_tags(md.get("keyword"))
                if not host or not scr or "기사" not in tags or not text: continue
                key=(host,scr,tags,y)
                r0=legacy_counts(text)
                r1=exclusive_counts(text)
                add_agg(natural[key],text,r0,r1)
                th=hashlib.sha256(text.encode("utf-8")).digest()[:16]
                if th not in seen_in_cell[key]:
                    seen_in_cell[key].add(th)
                    add_agg(dedup[key],text,r0,r1)
        hashes[path.name]=h.hexdigest()

    series=collections.defaultdict(dict)
    for (host,scr,tags,y),a in dedup.items():
        series[(host,scr,tags)][y]=a

    chains=[]
    for base,ys in series.items():
        for y in sorted(ys):
            if not all(y+h in ys for h in range(4)): continue
            arr=[ys[y+h] for h in range(4)]
            if min(a["docs"] for a in arr) < 200: continue
            rec={"base":base,"start_year":y,"docs":[a["docs"] for a in arr],"repr":{}}
            for rr in ("R0","R1"):
                counts=[a[rr] for a in arr]
                q={}
                for h in (1,2,3):
                    dq,df,dt,res=qfid(counts[0],counts[h])
                    q[str(h)]={"DQ":dq,"DF":df,"DT":dt,"fiber_share":df/dt if dt else None,"residual":res}
                fine_adj=[wjs(counts[i],counts[i+1]) for i in range(3)]
                fine_direct=wjs(counts[0],counts[3])
                coarse=[]
                for cts in counts:
                    cc=collections.Counter()
                    for m,v in cts.items(): cc[M2C[m]]+=v
                    coarse.append(cc)
                coarse_adj=[wjs(coarse[i],coarse[i+1]) for i in range(3)]
                coarse_direct=wjs(coarse[0],coarse[3])
                fd=sum(math.sqrt(x) for x in fine_adj)
                cd=sum(math.sqrt(x) for x in coarse_adj)
                q["eta_fine"]=math.sqrt(fine_direct)/fd if fd else None
                q["eta_coarse"]=math.sqrt(coarse_direct)/cd if cd else None
                rec["repr"][rr]=q
            chains.append(rec)

    out={
        "schema":"ksgt.g9.p46.okhc-t2-runtime.v1",
        "hashes":hashes,
        "rows":rows,
        "languages":dict(lang),
        "scripts":dict(script),
        "year_null":years.get(None,0),
        "year_min":min(y for y in years if isinstance(y,int)),
        "year_max":max(y for y in years if isinstance(y,int)),
        "publisher_count_nonnull":sum(1 for h in hosts if h is not None),
        "duplicate_ids":duplicate_ids,
        "exact_text_duplicate_groups":sum(1 for v in exact_text.values() if v>1),
        "exact_text_duplicate_extras":sum(v-1 for v in exact_text.values() if v>1),
        "admitted_documents":sum(a["docs"] for a in natural.values()),
        "dedup_documents":sum(a["docs"] for a in dedup.values()),
        "dense_four_year_chains":chains,
        "raw_files_modified":False,
    }
    text=json.dumps(out,ensure_ascii=False,indent=2)+"\n"
    if args.output:
        args.output.write_text(text,encoding="utf-8")
    else:
        print(text,end="")

if __name__=="__main__":
    main()
