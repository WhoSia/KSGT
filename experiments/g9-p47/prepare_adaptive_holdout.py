#!/usr/bin/env python3
"""Prepare fresh Hwangsung 1907-1910 holdout for G9-P47 adaptive intervention."""
from __future__ import annotations
import argparse, hashlib, heapq, json, pathlib, requests
from collections import Counter

BASE="https://huggingface.co/datasets/seyoungsong/Open-Korean-Historical-Corpus/resolve/main"
FILES={
 "news_archive_part_001_of_003.jsonl":"0ef1e00f4055be6adf288cc91f75539d9fed9d7733279956f471bcc2a84ac1df",
 "news_archive_part_002_of_003.jsonl":"046a95987197086e2af8ccfe9845991366c4bb33b1de84ecabb266c7d4ccc34a",
 "news_archive_part_003_of_003.jsonl":"dd143e14a930a56aa1ecbe9db3424962c535db1358e0d62f24edaaf44802e32f",
}
PUB="황성신문"; SCRIPT="Hanja, Old Hangeul"; YEARS={1907,1908,1909,1910}
SALT="KSGT-G9-P47-ADAPTIVE-HOLDOUT-v1"; K=64

def sha_file(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""): h.update(b)
    return h.hexdigest()

def download(name,outdir):
    p=outdir/name
    if not p.exists():
        with requests.get(f"{BASE}/{name}?download=true",stream=True,timeout=120) as r:
            r.raise_for_status()
            with open(p,"wb") as f:
                for c in r.iter_content(1024*1024):
                    if c:f.write(c)
    got=sha_file(p)
    if got!=FILES[name]: raise RuntimeError(f"sha mismatch {name}: {got}")
    return p

def kws(row):
    md=row.get("metadata") or {}
    x=row.get("keywords",row.get("keyword",md.get("keywords",md.get("keyword"))))
    if isinstance(x,str): return [x]
    if isinstance(x,list):
        out=[]
        for v in x:
            if isinstance(v,str): out.append(v)
            elif isinstance(v,dict): out.extend(str(z) for z in v.values() if isinstance(z,(str,int,float)))
        return out
    if isinstance(x,dict): return [str(z) for z in x.values()]
    return []

def pub(row):
    md=row.get("metadata") or {}
    return md.get("host_ko") or row.get("publisher") or row.get("host_ko")

def push(heap,score,obj):
    item=(-score,obj["id"],obj)
    if len(heap)<K: heapq.heappush(heap,item)
    elif item>heap[0]: heapq.heapreplace(heap,item)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--outdir",type=pathlib.Path,default=pathlib.Path("holdout"))
    a=ap.parse_args(); a.outdir.mkdir(parents=True,exist_ok=True)
    heaps={y:[] for y in YEARS}; eligible=Counter(); hashes={}
    for name in FILES:
        p=download(name,a.outdir); hashes[name]=sha_file(p)
        for line in open(p,encoding="utf-8"):
            r=json.loads(line)
            if r.get("language")!="Modern Korean" or r.get("script")!=SCRIPT or pub(r)!=PUB: continue
            y=r.get("year")
            if y not in YEARS: continue
            text=r.get("text")
            if not isinstance(text,str) or not text.strip(): continue
            if not any("기사" in k for k in kws(r)): continue
            docid=str(r.get("id") or r.get("doc_id") or "")
            if not docid: continue
            eligible[y]+=1
            score=int(hashlib.sha256((docid+"|"+SALT).encode()).hexdigest(),16)
            push(heaps[y],score,{"id":docid,"regime":"FRESH_HWANGSUNG","publisher":PUB,"script":SCRIPT,"year":y,"text":text})
    packet=[]
    for y in sorted(YEARS):
        chosen=[x[2] for x in sorted(heaps[y],reverse=True)]
        if len(chosen)<K: raise RuntimeError(f"insufficient {y}: {len(chosen)}")
        packet.extend(chosen)
    with open(a.outdir/"holdout.jsonl","w",encoding="utf-8") as f:
        for r in packet:f.write(json.dumps(r,ensure_ascii=False)+"\n")
    receipt={"schema":"ksgt.g9.p47.adaptive-holdout.v1","publisher":PUB,"script":SCRIPT,
             "years":sorted(YEARS),"salt":SALT,"k_per_year":K,"rows":len(packet),
             "eligible_counts":{str(y):eligible[y] for y in sorted(YEARS)},
             "file_sha256":hashes,"canonical_text_field":"top-level text","normalization":"NONE"}
    (a.outdir/"receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(receipt,ensure_ascii=False))
if __name__=="__main__": main()
