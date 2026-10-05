#!/usr/bin/env python3
"""Run one frozen encoder on the prospectively sealed G9-P47 public OKHC packet."""
from __future__ import annotations
import argparse, hashlib, importlib.metadata, json, math, pathlib
from collections import defaultdict
import numpy as np
from huggingface_hub import HfApi
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score
from sklearn.preprocessing import LabelEncoder

MODELS={
 "F0":dict(repo="klue/roberta-base",kind="hf",prefix=""),
 "F1":dict(repo="jhgan/ko-sroberta-multitask",kind="st",prefix=""),
 "F2":dict(repo="intfloat/multilingual-e5-base",kind="st",prefix="query: "),
 "F3":dict(repo="BAAI/bge-m3",kind="st",prefix=""),
}
MAXLEN=512

def l2(x):
    n=np.linalg.norm(x,axis=1,keepdims=True); return x/np.clip(n,1e-12,None)

def angular(a,b):
    a=a/np.linalg.norm(a); b=b/np.linalg.norm(b)
    return float(math.acos(float(np.clip(a@b,-1,1)))/math.pi)

def encode_factory(alias,sha):
    spec=MODELS[alias]
    if spec["kind"]=="st":
        from sentence_transformers import SentenceTransformer
        m=SentenceTransformer(spec["repo"],revision=sha,trust_remote_code=False)
        m.max_seq_length=MAXLEN
        tok=m.tokenizer
        def enc(texts):
            xs=[spec["prefix"]+x for x in texts]
            return np.asarray(m.encode(xs,batch_size=16,show_progress_bar=False,
                                       normalize_embeddings=True,convert_to_numpy=True))
        return tok,enc
    import torch
    from transformers import AutoTokenizer,AutoModel
    tok=AutoTokenizer.from_pretrained(spec["repo"],revision=sha,trust_remote_code=False)
    model=AutoModel.from_pretrained(spec["repo"],revision=sha,trust_remote_code=False)
    model.eval()
    def enc(texts):
        out=[]
        with torch.no_grad():
            for i in range(0,len(texts),16):
                batch=tok(texts[i:i+16],padding=True,truncation=True,max_length=MAXLEN,return_tensors="pt")
                h=model(**batch).last_hidden_state
                mask=batch["attention_mask"].unsqueeze(-1).to(h.dtype)
                e=(h*mask).sum(1)/mask.sum(1).clamp_min(1)
                e=torch.nn.functional.normalize(e,p=2,dim=1)
                out.append(e.cpu().numpy())
        return np.concatenate(out,axis=0)
    return tok,enc

def tokenizer_stats(tok,texts,prefix):
    lengths=[]; unk=0; toks=0
    uid=getattr(tok,"unk_token_id",None)
    for t in texts:
        ids=tok(prefix+t,add_special_tokens=True,truncation=False)["input_ids"]
        lengths.append(len(ids)); toks+=len(ids)
        if uid is not None: unk+=sum(int(x==uid) for x in ids)
    return {
      "median_raw_tokens":float(np.median(lengths)),
      "p90_raw_tokens":float(np.quantile(lengths,.9)),
      "max_raw_tokens":int(max(lengths)),
      "truncation_fraction":float(np.mean(np.array(lengths)>MAXLEN)),
      "unk_fraction":None if uid is None else float(unk/max(toks,1)),
    }

def effective_rank(X):
    X=X-X.mean(0,keepdims=True)
    s=np.linalg.svd(X,compute_uv=False)
    v=s*s
    p=v/v.sum()
    h=-(p[p>0]*np.log(p[p>0])).sum()
    return float(np.exp(h))

def anisotropy(X):
    X=l2(X); S=X@X.T
    n=len(X)
    return float((S.sum()-np.trace(S))/(n*(n-1)))

def split_views(row):
    t=row["text"].strip()
    if len(t)<100:return None
    mid=len(t)//2
    # move split to nearest space within 40 chars when possible
    candidates=[i for i in range(max(1,mid-40),min(len(t)-1,mid+41)) if t[i].isspace()]
    if candidates: mid=min(candidates,key=lambda i:abs(i-mid))
    a=t[:mid].strip(); b=t[mid:].strip()
    if len(a)<30 or len(b)<30:return None
    return a,b

def retrieval(rows,enc):
    pairs=[]
    for r in sorted(rows,key=lambda x:x["id"]):
        p=split_views(r)
        if p:pairs.append((r["id"],p[0],p[1]))
        if len(pairs)>=256:break
    if len(pairs)<32:return {"n":len(pairs),"recall_at_1":None,"mrr":None}
    A=enc([x[1] for x in pairs]); B=enc([x[2] for x in pairs])
    S=A@B.T
    ranks=[]
    for i in range(len(pairs)):
        order=np.argsort(-S[i])
        rank=int(np.where(order==i)[0][0])+1; ranks.append(rank)
    return {"n":len(pairs),"recall_at_1":float(np.mean(np.array(ranks)==1)),
            "mrr":float(np.mean(1/np.array(ranks,dtype=float)))}

def probe(X,labels,ids):
    y=LabelEncoder().fit_transform(labels)
    mask=np.array([int(hashlib.sha256((i+"|P47-PROBE").encode()).hexdigest(),16)%5!=0 for i in ids])
    if len(set(y[mask]))<2 or len(set(y[~mask]))<2:return None
    clf=LogisticRegression(max_iter=1500,class_weight="balanced",C=1.0)
    clf.fit(X[mask],y[mask])
    pred=clf.predict(X[~mask])
    return {"n_train":int(mask.sum()),"n_test":int((~mask).sum()),
            "balanced_accuracy":float(balanced_accuracy_score(y[~mask],pred)),
            "classes":int(len(set(y)))}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--alias",choices=MODELS,required=True)
    ap.add_argument("--packet",type=pathlib.Path,required=True); ap.add_argument("--out",type=pathlib.Path,required=True)
    args=ap.parse_args()
    rows=[json.loads(x) for x in args.packet.read_text(encoding="utf-8").splitlines() if x.strip()]
    spec=MODELS[args.alias]
    info=HfApi().model_info(spec["repo"])
    sha=info.sha
    # exact repo SHA is resolved and printed before any packet text is encoded
    print(json.dumps({"event":"MODEL_SHA_FROZEN","alias":args.alias,"repo":spec["repo"],"sha":sha}))
    tok,enc=encode_factory(args.alias,sha)
    texts=[r["text"] for r in rows]
    token_stats=tokenizer_stats(tok,texts,spec["prefix"])
    X=enc(texts)
    centroids={}
    by=defaultdict(list)
    for i,r in enumerate(rows):by[(r["regime"],r["year"])].append(i)
    for (rg,y),idx in by.items():
        c=X[idx].mean(0); c=c/np.linalg.norm(c); centroids[(rg,y)]=c
    temporal={}
    for rg in sorted(set(r["regime"] for r in rows)):
        ys=sorted(y for (r,y) in centroids if r==rg)
        adj=[angular(centroids[(rg,a)],centroids[(rg,b)]) for a,b in zip(ys,ys[1:])]
        direct=angular(centroids[(rg,ys[0])],centroids[(rg,ys[-1])])
        temporal[rg]={
          "years":ys,"adjacent_angular":adj,"direct_first_last_angular":direct,
          "path_efficiency":None if sum(adj)==0 else direct/sum(adj)
        }
    regime_probe=probe(X,[r["regime"] for r in rows],[r["id"] for r in rows])
    year_probes={}
    for rg in sorted(set(r["regime"] for r in rows)):
        idx=[i for i,r in enumerate(rows) if r["regime"]==rg]
        year_probes[rg]=probe(X[idx],[str(rows[i]["year"]) for i in idx],[rows[i]["id"] for i in idx])
    result={
      "schema":"ksgt.g9.p47.frozen-encoder-okhc.v1","alias":args.alias,"repo":spec["repo"],
      "resolved_model_sha":sha,"packet_rows":len(rows),"primary_max_length":MAXLEN,
      "tokenizer_observability":token_stats,
      "geometry":{"effective_rank":effective_rank(X),"mean_offdiag_cosine":anisotropy(X)},
      "content_proxy":retrieval(rows,enc),
      "nuisance_risk":{"regime_probe":regime_probe,"within_regime_year_probe":year_probes},
      "temporal":temporal,
      "package_versions":{p:importlib.metadata.version(p) for p in ["torch","transformers","sentence-transformers","scikit-learn","numpy","huggingface-hub"]},
      "authority":"FROZEN_PUBLIC_HISTORICAL_TRANSPORT_DIAGNOSTIC_ONLY_NO_SEMANTIC_WINNER"
    }
    args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"event":"DONE","alias":args.alias,"sha":sha,"result":str(args.out)}))

if __name__=="__main__":main()
