#!/usr/bin/env python3
import argparse,json,pathlib,hashlib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics.pairwise import cosine_similarity

def probe(X,labels,ids):
    y=LabelEncoder().fit_transform(labels)
    mask=np.array([int(hashlib.sha256((i+"|P47-PROBE").encode()).hexdigest(),16)%5!=0 for i in ids])
    clf=LogisticRegression(max_iter=1500,class_weight="balanced",C=1.0)
    clf.fit(X[mask],y[mask]); pred=clf.predict(X[~mask])
    return float(balanced_accuracy_score(y[~mask],pred))

def halves(t):
    t=t.strip()
    if len(t)<100:return None
    m=len(t)//2
    return t[:m],t[m:]

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--packet",type=pathlib.Path,required=True);ap.add_argument("--out",type=pathlib.Path,required=True)
    a=ap.parse_args(); rows=[json.loads(x) for x in a.packet.read_text(encoding="utf-8").splitlines() if x.strip()]
    texts=[r["text"] for r in rows]
    v=TfidfVectorizer(analyzer="char",ngram_range=(2,5),min_df=2,sublinear_tf=True,norm="l2",max_features=100000)
    X=v.fit_transform(texts)
    reg=probe(X,[r["regime"] for r in rows],[r["id"] for r in rows])
    yr={}
    for rg in sorted(set(r["regime"] for r in rows)):
        idx=[i for i,r in enumerate(rows) if r["regime"]==rg]
        yr[rg]=probe(X[idx],[str(rows[i]["year"]) for i in idx],[rows[i]["id"] for i in idx])
    pairs=[]
    for r in sorted(rows,key=lambda z:z["id"]):
        p=halves(r["text"])
        if p:pairs.append((r["id"],*p))
        if len(pairs)>=256:break
    vv=TfidfVectorizer(analyzer="char",ngram_range=(2,5),min_df=2,sublinear_tf=True,norm="l2",max_features=100000)
    both=[p[1] for p in pairs]+[p[2] for p in pairs]; M=vv.fit_transform(both); n=len(pairs)
    S=cosine_similarity(M[:n],M[n:])
    ranks=[]
    for i in range(n):
        order=np.argsort(-S[i]); ranks.append(int(np.where(order==i)[0][0])+1)
    out={"schema":"ksgt.g9.p47.surface-control-result.v1","packet_rows":len(rows),"features":int(X.shape[1]),
         "regime_balanced_accuracy":reg,"year_balanced_accuracy":yr,
         "content_proxy":{"n":n,"recall_at_1":float(np.mean(np.array(ranks)==1)),"mrr":float(np.mean(1/np.array(ranks,float)))},
         "authority":"SURFACE_NUISANCE_INTERPRETATION_CONTROL_ONLY"}
    a.out.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(out,ensure_ascii=False))
if __name__=="__main__":main()
