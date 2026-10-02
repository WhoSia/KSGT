#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,math,random
from collections import defaultdict
from pathlib import Path

CLASSES=("CONTRAST","CAUSE_RESULT","TEMPORAL","EXPANSION")

def norm(v):
    s=sum(v)
    return [x/s for x in v] if s else [0.0 for _ in v]

def kl(p,q):
    out=0.0
    for a,b in zip(p,q):
        if a>0:
            if b<=0: raise ValueError("KL support failure")
            out+=a*math.log2(a/b)
    return out

def jsd(a,b):
    p=norm(a); q=norm(b)
    if not any(p) and not any(q): return 0.0
    eps=1e-12
    p=[max(x,eps) for x in p]; q=[max(x,eps) for x in q]
    p=norm(p); q=norm(q)
    m=[(x+y)/2 for x,y in zip(p,q)]
    return 0.5*kl(p,m)+0.5*kl(q,m)

def read_rows(path):
    rows=[]
    with Path(path).open(encoding="utf-8") as f:
        for line in f:
            if line.strip(): rows.append(json.loads(line))
    return rows

def cell_key(r):
    return (
      r.get("period"),r.get("source"),r.get("genre"),r.get("register"),
      r.get("provenance"),r.get("representation")
    )

def aggregate(rows):
    out={}
    for r in rows:
        k=cell_key(r)
        if k not in out:
            out[k]={"n":0,"edf":{c:0 for c in CLASSES},
                    "markers":{c:defaultdict(int) for c in CLASSES}}
        g=out[k]; g["n"]+=1
        for c in CLASSES:
            g["edf"][c]+=int((r.get("edf") or {}).get(c,0))
            for m,n in ((r.get("markers") or {}).get(c,{}) or {}).items():
                g["markers"][c][m]+=int(n)
    return out

def compare(a,b):
    if a[0][5]!=b[0][5]:
        raise ValueError("REPRESENTATION_MIX_FORBIDDEN")
    out={"coarse_jsd":jsd([a[1]["edf"][c] for c in CLASSES],
                          [b[1]["edf"][c] for c in CLASSES]),
         "marker_jsd":{}}
    for c in CLASSES:
        keys=sorted(set(a[1]["markers"][c])|set(b[1]["markers"][c]))
        out["marker_jsd"][c]=jsd(
          [a[1]["markers"][c].get(k,0) for k in keys],
          [b[1]["markers"][c].get(k,0) for k in keys])
    return out

def eligible_pairs(groups):
    items=list(groups.items()); out=[]
    for i,(ka,ga) in enumerate(items):
      for kb,gb in items[i+1:]:
        # same source/genre/register/provenance/representation; period differs
        if ka[0]==kb[0]: continue
        if ka[1:]==kb[1:]: out.append(((ka,ga),(kb,gb)))
    return out

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("features",type=Path)
    ap.add_argument("--output",type=Path)
    args=ap.parse_args()
    groups=aggregate(read_rows(args.features))
    pairs=[]
    for a,b in eligible_pairs(groups):
        pairs.append({"a":a[0],"b":b[0],**compare(a,b)})
    result={
      "schema":"ksgt.g9.p45.drift-court.v1",
      "groups":len(groups),"eligible_period_pairs":len(pairs),
      "pairwise":pairs,
      "authority_rules":[
        "REPRESENTATION_MIX_FORBIDDEN",
        "SOURCE_GENRE_REGISTER_PROVENANCE_HELD_FIXED",
        "COARSE_FUNCTION_JSD_AND_WITHIN_CLASS_MARKER_JSD_BOTH_REPORTED"
      ]
    }
    txt=json.dumps(result,ensure_ascii=False,sort_keys=True,indent=2)
    if args.output: args.output.write_text(txt+"\n",encoding="utf-8")
    else: print(txt)
if __name__=="__main__":main()
