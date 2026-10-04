#!/usr/bin/env python3
"""G9-P46 common-chain quotient/fiber replay from P45 derived topic features.

Never opens raw NIKL corpus text.
"""
from __future__ import annotations
import argparse, collections, gzip, json, math, statistics
from pathlib import Path

def norm(d):
    s=sum(v for v in d.values() if v>0)
    return {} if s<=0 else {k:v/s for k,v in d.items() if v>0}

def wjs(p,q,a=.5):
    p,q=norm(p),norm(q)
    if not p and not q:return 0.0
    keys=set(p)|set(q)
    m={k:a*p.get(k,0)+(1-a)*q.get(k,0) for k in keys}
    def kl(x): return sum(v*math.log(v/m[k]) for k,v in x.items() if v>0)
    return a*kl(p)+(1-a)*kl(q)

def qfid(pa,pb,m2c):
    p,q=norm(pa),norm(pb)
    pc,qc=collections.Counter(),collections.Counter()
    for m,v in p.items(): pc[m2c[m]]+=v
    for m,v in q.items(): qc[m2c[m]]+=v
    dq=wjs(pc,qc)
    df=0.0
    for c in set(pc)|set(qc):
        pm,qm=pc.get(c,0.0),qc.get(c,0.0)
        rm=.5*(pm+qm)
        if rm<=0: continue
        a=pm/(pm+qm)
        pcond={m:v/pm for m,v in p.items() if m2c[m]==c} if pm else {}
        qcond={m:v/qm for m,v in q.items() if m2c[m]==c} if qm else {}
        df += rm*wjs(pcond,qcond,a)
    dt=wjs(p,q)
    return dq,df,dt,dt-dq-df

def extract(data):
    cells={}; m2c={}
    for f in data["files"]:
        fam,ser=f["source_family"],f["serialization"]
        for gkey,g in f["groups"].items():
            period,ys,pub=gkey.split("|",2); year=int(ys)
            for tf in g.get("topic_features",[]):
                mc={}
                for cls,md in tf.get("markers",{}).items():
                    for m,c in md.items():
                        mc[m]=c; m2c[m]=cls
                key=(fam,ser,period,pub,tf.get("topic"),year)
                if key in cells: raise ValueError("ambiguous cell collision")
                cells[key]={"documents":tf.get("documents",0),"markers":mc}
    series=collections.defaultdict(dict)
    for (*base,year),v in cells.items(): series[tuple(base)][year]=v
    chains=[]
    for base,ys in series.items():
        for y in sorted(ys):
            if all(y+h in ys for h in (0,1,2,3)):
                q={}
                for h in (1,2,3):
                    dq,df,dt,res=qfid(ys[y]["markers"],ys[y+h]["markers"],m2c)
                    q[h]={"dq":dq,"df":df,"dt":dt,"resid":res,"fiber_share":df/dt if dt else None}
                chains.append({"base":base,"start_year":y,"docs":[ys[y+h]["documents"] for h in range(4)],"qfid":q})
    return chains

def summarize(chains):
    out={}
    for h in (1,2,3):
        vals=[c["qfid"][h] for c in chains]
        out[str(h)]={k:statistics.median([v[k] for v in vals if v[k] is not None])
                     for k in ("dq","df","dt","fiber_share")}
        out[str(h)]["n"]=len(vals)
    return out

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("input",type=Path); ap.add_argument("--output",type=Path)
    args=ap.parse_args()
    with gzip.open(args.input,"rt",encoding="utf-8") as f:data=json.load(f)
    chains=extract(data)
    dense=[c for c in chains if min(c["docs"])>=200]
    out={"schema":"ksgt.g9.p46.common-chain-qfid.runtime.v1","raw_nikl_reopened":False,
         "all":summarize(chains),"dense_200":summarize(dense),
         "max_abs_identity_residual":max(abs(c["qfid"][h]["resid"]) for c in chains for h in (1,2,3))}
    text=json.dumps(out,ensure_ascii=False,indent=2)+"\n"
    if args.output: args.output.write_text(text,encoding="utf-8")
    else: print(text,end="")
if __name__=="__main__":main()
