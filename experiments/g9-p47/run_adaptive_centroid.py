#!/usr/bin/env python3
"""G9-P47 adaptive centroid-residualization on canonical development packet and fresh source holdout."""
from __future__ import annotations
import argparse, importlib.util, json, pathlib
import numpy as np

HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("p47runner", HERE/"run_frozen_encoder.py")
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.MAXLEN=512

SHAS={
 "F0":"02f94ba5e3fcb7e2a58a390b8639b0fac974a8da",
 "F1":"8fca7c9c98c26599be0e14b9916b11a756a26f19",
 "F2":"d128750597153bb5987e10b1c3493a34e5a4502a",
 "F3":"5617a9f61b028005a4858fdac845db406aefb181",
}

def normalize(X):
    n=np.linalg.norm(X,axis=1,keepdims=True)
    return X/np.clip(n,1e-12,None)

def fit_subspace(X,rows):
    mu=X.mean(0)
    regs=sorted({r["regime"] for r in rows})
    C=np.stack([X[[i for i,r in enumerate(rows) if r["regime"]==rg]].mean(0)-mu for rg in regs])
    _u,s,vt=np.linalg.svd(C,full_matrices=False)
    rank=min(2,int(np.sum(s>1e-10)))
    U=vt[:rank].T
    return mu,U,s[:rank],regs

def transform(X,mu,U):
    Z=X-((X-mu)@U)@U.T
    return normalize(Z)

def split_pairs(rows):
    pairs=[]
    for r in sorted(rows,key=lambda x:x["id"]):
        p=m.split_views(r)
        if p:pairs.append((r["id"],p[0],p[1]))
        if len(pairs)>=256:break
    return pairs

def retrieval_with_transform(rows,enc,mu,U):
    pairs=split_pairs(rows)
    if len(pairs)<32:return {"n":len(pairs),"before":None,"after":None}
    A=enc([x[1] for x in pairs]); B=enc([x[2] for x in pairs])
    def score(AA,BB):
        S=AA@BB.T; ranks=[]
        for i in range(len(pairs)):
            order=np.argsort(-S[i]); ranks.append(int(np.where(order==i)[0][0])+1)
        rr=np.array(ranks)
        return {"recall_at_1":float(np.mean(rr==1)),"mrr":float(np.mean(1/rr.astype(float)))}
    return {"n":len(pairs),"before":score(A,B),"after":score(transform(A,mu,U),transform(B,mu,U))}

def geom(X):
    return {"effective_rank":m.effective_rank(X),"mean_offdiag_cosine":m.anisotropy(X)}

def temporal(rows,X):
    by={}
    for i,r in enumerate(rows):by.setdefault(r["year"],[]).append(i)
    cs={}
    for y,idx in by.items():
        c=X[idx].mean(0); c=c/np.linalg.norm(c); cs[y]=c
    ys=sorted(cs)
    adj=[m.angular(cs[a],cs[b]) for a,b in zip(ys,ys[1:])]
    direct=m.angular(cs[ys[0]],cs[ys[-1]])
    return {"years":ys,"adjacent_angular":adj,"direct_first_last_angular":direct,
            "path_efficiency":None if sum(adj)==0 else direct/sum(adj)}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--alias",choices=SHAS,required=True)
    ap.add_argument("--dev",type=pathlib.Path,required=True); ap.add_argument("--holdout",type=pathlib.Path,required=True)
    ap.add_argument("--out",type=pathlib.Path,required=True); a=ap.parse_args()
    dev=[json.loads(x) for x in a.dev.read_text(encoding="utf-8").splitlines() if x.strip()]
    hold=[json.loads(x) for x in a.holdout.read_text(encoding="utf-8").splitlines() if x.strip()]
    print(json.dumps({"event":"MODEL_SHA_FROZEN","alias":a.alias,"sha":SHAS[a.alias],"intervention":"CENTROID_NUISANCE_RESIDUALIZATION"}))
    _tok,enc=m.encode_factory(a.alias,SHAS[a.alias])
    Xd=enc([r["text"] for r in dev]); Xh=enc([r["text"] for r in hold])
    mu,U,s,regs=fit_subspace(Xd,dev); Ad=transform(Xd,mu,U); Ah=transform(Xh,mu,U)
    dev_ids=[r["id"] for r in dev]; dev_labels=[r["regime"] for r in dev]
    hold_ids=[r["id"] for r in hold]; hold_year=[str(r["year"]) for r in hold]
    removed_dev=float(np.mean(np.sum((((Xd-mu)@U)@U.T)**2,axis=1)))
    removed_hold=float(np.mean(np.sum((((Xh-mu)@U)@U.T)**2,axis=1)))
    out={
      "schema":"ksgt.g9.p47.adaptive-centroid-result.v1","alias":a.alias,"model_sha":SHAS[a.alias],
      "subspace_rank":int(U.shape[1]),"singular_values":[float(x) for x in s],"development_regimes":regs,
      "removed_energy":{"development":removed_dev,"fresh_holdout":removed_hold},
      "development":{
        "geometry_before":geom(Xd),"geometry_after":geom(Ad),
        "regime_probe_before":m.probe(Xd,dev_labels,dev_ids),
        "regime_probe_after":m.probe(Ad,dev_labels,dev_ids),
        "content_proxy":retrieval_with_transform(dev,enc,mu,U)
      },
      "fresh_hwangsung":{
        "rows":len(hold),"geometry_before":geom(Xh),"geometry_after":geom(Ah),
        "year_probe_before":m.probe(Xh,hold_year,hold_ids),
        "year_probe_after":m.probe(Ah,hold_year,hold_ids),
        "content_proxy":retrieval_with_transform(hold,enc,mu,U),
        "temporal_before":temporal(hold,Xh),"temporal_after":temporal(hold,Ah)
      },
      "authority":"SEQUENTIAL_ADAPTIVE_GEOMETRY_INTERVENTION_NO_SEMANTIC_AUTHORITY"
    }
    a.out.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(out,ensure_ascii=False))
if __name__=="__main__": main()
