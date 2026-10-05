#!/usr/bin/env python3
"""Prepare the public OKHC packet for G9-P47 frozen encoder transport.

Public source only. Verifies exact shard SHA-256, reads canonical top-level text,
and selects a deterministic equal-size sample by regime×year before any model runs.
"""
from __future__ import annotations
import argparse, hashlib, heapq, json, os, pathlib, requests
from collections import Counter, defaultdict

BASE="https://huggingface.co/datasets/seyoungsong/Open-Korean-Historical-Corpus/resolve/main"
FILES={
 "news_archive_part_001_of_003.jsonl":"0ef1e00f4055be6adf288cc91f75539d9fed9d7733279956f471bcc2a84ac1df",
 "news_archive_part_002_of_003.jsonl":"046a95987197086e2af8ccfe9845991366c4bb33b1de84ecabb266c7d4ccc34a",
 "news_archive_part_003_of_003.jsonl":"dd143e14a930a56aa1ecbe9db3424962c535db1358e0d62f24edaaf44802e32f",
}
REGIMES={
 "PRE_HANGEUL_INDEPENDENT":dict(publisher="독립신문(서재필)",script="Hangeul",years={1896,1897,1898,1899}),
 "PRE_OLD_HANGEUL_DAEHAN":dict(publisher="대한매일신보",script="Hanja, Old Hangeul",years={1906,1907,1908,1909}),
 "POSTLIB_HANJA_HANGEUL_MASAN":dict(publisher="마산일보",script="Hanja, Hangeul",years={1949,1950,1951,1952}),
}
SALT="KSGT-G9-P47-OKHC-FROZEN-v1"
K=64

def sha_file(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""): h.update(b)
    return h.hexdigest()

def download(name,outdir):
    p=outdir/name
    if not p.exists():
        with requests.get(f"{BASE}/{name}?download=true",stream=True,timeout=120) as r:
            r.raise_for_status()
            with open(p,"wb") as f:
                for chunk in r.iter_content(1024*1024):
                    if chunk: f.write(chunk)
    got=sha_file(p)
    if got!=FILES[name]:
        raise RuntimeError(f"sha256 mismatch {name}: {got}")
    return p

def keywords(row):
    md=row.get("metadata") or {}
    x=row.get("keywords",row.get("keyword",md.get("keywords",md.get("keyword"))))
    if x is None: return []
    if isinstance(x,str): return [x]
    if isinstance(x,list):
        out=[]
        for v in x:
            if isinstance(v,str): out.append(v)
            elif isinstance(v,dict):
                out.extend(str(z) for z in v.values() if isinstance(z,(str,int,float)))
        return out
    if isinstance(x,dict):
        return [str(z) for z in x.values()]
    return [str(x)]

def publisher(row):
    md=row.get("metadata") or {}
    return md.get("host_ko") or row.get("publisher") or row.get("host_ko")

def push(heap,score,obj):
    item=(-score,obj["id"],obj)
    if len(heap)<K: heapq.heappush(heap,item)
    elif item>heap[0]: heapq.heapreplace(heap,item)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--outdir",type=pathlib.Path,default=pathlib.Path("p47_packet"))
    args=ap.parse_args(); args.outdir.mkdir(parents=True,exist_ok=True)
    heaps=defaultdict(list); eligible=Counter(); reject=Counter(); rows=0
    hashes={}
    for name in FILES:
        path=download(name,args.outdir); hashes[name]=sha_file(path)
        with open(path,"r",encoding="utf-8") as f:
            for line in f:
                rows+=1
                row=json.loads(line)
                if row.get("language")!="Modern Korean": reject["language"]+=1; continue
                year=row.get("year")
                if not isinstance(year,int): reject["year"]+=1; continue
                pub=publisher(row); script=row.get("script")
                text=row.get("text")
                if not isinstance(text,str) or not text.strip(): reject["text"]+=1; continue
                kws=keywords(row)
                if not kws or not any("기사" in k for k in kws): reject["keyword"]+=1; continue
                rid=None
                for rg,spec in REGIMES.items():
                    if pub==spec["publisher"] and script==spec["script"] and year in spec["years"]:
                        rid=rg; break
                if rid is None: reject["regime"]+=1; continue
                docid=str(row.get("id") or row.get("doc_id") or row.get("_id") or "")
                if not docid: reject["id"]+=1; continue
                key=(rid,year); eligible[key]+=1
                score=int(hashlib.sha256((docid+"|"+SALT).encode()).hexdigest(),16)
                obj={"id":docid,"regime":rid,"publisher":pub,"script":script,"year":year,"text":text}
                push(heaps[key],score,obj)
    packet=[]
    for key in sorted(heaps):
        chosen=[x[2] for x in sorted(heaps[key],reverse=True)]
        if len(chosen)<K:
            raise RuntimeError(f"insufficient support for {key}: {len(chosen)}")
        packet.extend(chosen)
    with open(args.outdir/"packet.jsonl","w",encoding="utf-8") as f:
        for row in packet: f.write(json.dumps(row,ensure_ascii=False)+"\n")
    receipt={
      "schema":"ksgt.g9.p47.okhc-public-packet.v1",
      "source_rows":rows,"file_sha256":hashes,"salt":SALT,"k_per_regime_year":K,
      "eligible_counts":{f"{r}|{y}":eligible[(r,y)] for r,y in sorted(eligible)},
      "sample_counts":dict(Counter(f'{x["regime"]}|{x["year"]}' for x in packet)),
      "packet_rows":len(packet),"reject_counts":dict(reject),
      "canonical_text_field":"top-level text","normalization":"NONE",
    }
    (args.outdir/"prep_receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(receipt,ensure_ascii=False))

if __name__=="__main__": main()
