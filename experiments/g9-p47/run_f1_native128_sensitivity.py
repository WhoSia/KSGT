#!/usr/bin/env python3
"""G9-P47 F1 native-128 sensitivity on the exact canonical public packet.

Process-triggered robustness only. Cannot replace the primary 512-parity Court.
"""
from __future__ import annotations
import argparse, importlib.util, json, pathlib, sys
import numpy as np

HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("p47runner", HERE/"run_frozen_encoder.py")
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.MAXLEN=128
F1_SHA="8fca7c9c98c26599be0e14b9916b11a756a26f19"

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--packet",type=pathlib.Path,required=True); ap.add_argument("--out",type=pathlib.Path,required=True)
    a=ap.parse_args()
    rows=[json.loads(x) for x in a.packet.read_text(encoding="utf-8").splitlines() if x.strip()]
    model_spec=m.MODELS["F1"]
    print(json.dumps({"event":"MODEL_SHA_FROZEN","alias":"F1_NATIVE128","repo":model_spec["repo"],"sha":F1_SHA,"max_length":128}))
    tok,enc=m.encode_factory("F1",F1_SHA)
    texts=[r["text"] for r in rows]
    X=enc(texts)
    by={}
    for i,r in enumerate(rows): by.setdefault((r["regime"],r["year"]),[]).append(i)
    centroids={}
    for k,idx in by.items():
        c=X[idx].mean(0); c=c/np.linalg.norm(c); centroids[k]=c
    temporal={}
    for rg in sorted({r["regime"] for r in rows}):
        ys=sorted(y for (rr,y) in centroids if rr==rg)
        adj=[m.angular(centroids[(rg,a0)],centroids[(rg,b)]) for a0,b in zip(ys,ys[1:])]
        direct=m.angular(centroids[(rg,ys[0])],centroids[(rg,ys[-1])])
        temporal[rg]={"years":ys,"adjacent_angular":adj,"direct_first_last_angular":direct,
                      "path_efficiency":None if sum(adj)==0 else direct/sum(adj)}
    result={
      "schema":"ksgt.g9.p47.f1-native128-sensitivity-result.v1",
      "alias":"F1_NATIVE128","repo":model_spec["repo"],"resolved_model_sha":F1_SHA,
      "packet_rows":len(rows),"max_length":128,
      "tokenizer_observability":m.tokenizer_stats(tok,texts,model_spec["prefix"]),
      "geometry":{"effective_rank":m.effective_rank(X),"mean_offdiag_cosine":m.anisotropy(X)},
      "content_proxy":m.retrieval(rows,enc),
      "nuisance_risk":{
        "regime_probe":m.probe(X,[r["regime"] for r in rows],[r["id"] for r in rows]),
        "within_regime_year_probe":{
          rg:m.probe(X[[i for i,r in enumerate(rows) if r["regime"]==rg]],
                     [str(r["year"]) for r in rows if r["regime"]==rg],
                     [r["id"] for r in rows if r["regime"]==rg])
          for rg in sorted({r["regime"] for r in rows})
        }
      },
      "temporal":temporal,
      "authority":"ROBUSTNESS_ONLY_CANNOT_REPLACE_PRIMARY"
    }
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False))
if __name__=="__main__": main()
