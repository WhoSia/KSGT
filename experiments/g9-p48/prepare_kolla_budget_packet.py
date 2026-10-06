#!/usr/bin/env python3
"""Compile a fresh KoLLA packet for the P48 candidate-budget intervention."""
from __future__ import annotations
import hashlib, json, re, urllib.request
from collections import Counter, defaultdict
from pathlib import Path

URL="https://zenodo.org/records/16908784/files/KoLLA_multi-refs.m2?download=1"
EXPECTED_MD5="9a6f2e3fea1b39bbb7343445db1167f7"
OLD_SALT="KSGT-G9-P48-KOLLA-PACKET-v1"
NEW_SALT="KSGT-G9-P48-KOLLA-BUDGET-v1"
N=16
URL_RE=re.compile(r"https?://[^\s]+")
EMAIL_RE=re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
NUMBER_RE=re.compile(r"(?<![A-Za-z0-9])[+-]?[0-9]+(?:[.,:/-][0-9]+)*(?![A-Za-z0-9])")
ASCII_RE=re.compile(r"\b[A-Za-z][A-Za-z0-9._+-]{1,}\b")

def protected_tokens(s):
    spans=[]; out=[]
    def take(rx,kind):
        for m in rx.finditer(s):
            if any(not (m.end()<=a or m.start()>=b) for a,b in spans): continue
            spans.append((m.start(),m.end())); out.append((kind,m.group(0)))
    take(URL_RE,"URL"); take(EMAIL_RE,"EMAIL"); take(NUMBER_RE,"NUMBER"); take(ASCII_RE,"ASCII_TOKEN")
    return out

def apply_edits(source, edits):
    work=source.split()
    for start,end,repl in sorted(edits,key=lambda x:(x[0],x[1]),reverse=True):
        if start<0 or end<0: continue
        rt=[] if repl in {"","-NONE-"} else repl.split()
        work[start:end]=rt
    return " ".join(work)

def parse_m2(text):
    blocks=[]; cur=None; edits=defaultdict(list)
    def flush():
        nonlocal cur,edits
        if cur is None:return
        refs={aid:apply_edits(cur,es) for aid,es in edits.items()}
        blocks.append((cur,refs)); cur=None; edits=defaultdict(list)
    for line in text.splitlines()+[""]:
        if line.startswith("S "): flush(); cur=line[2:]
        elif line.startswith("A ") and cur is not None:
            parts=line[2:].split("|||")
            if len(parts)<2: continue
            span=parts[0].split()
            if len(span)<2: continue
            try:start,end=int(span[0]),int(span[1])
            except ValueError:continue
            repl=parts[2] if len(parts)>2 else ""
            aid=parts[-1].strip() if parts else "UNKNOWN"
            edits[aid].append((start,end,repl))
        elif not line.strip(): flush()
    return blocks

def score(source,salt,stratum):
    return hashlib.sha256((source+"|"+salt+"|"+stratum).encode()).hexdigest()

def main():
    req=urllib.request.Request(URL,headers={"User-Agent":"KSGT-G9-P48-budget-packet"})
    with urllib.request.urlopen(req,timeout=120) as r:data=r.read()
    if hashlib.md5(data).hexdigest()!=EXPECTED_MD5: raise SystemExit("MD5 mismatch")
    blocks=parse_m2(data.decode("utf-8"))
    seen=set(); pools={"K1_HARD_CARGO":[],"K2_GENERIC":[]}; eligible=0
    for source,refs in blocks:
        if not source.strip() or len(refs)!=2 or source in seen: continue
        seen.add(source); eligible+=1
        toks=protected_tokens(source); stratum="K1_HARD_CARGO" if toks else "K2_GENERIC"
        pools[stratum].append((source,refs,toks))
    old_hashes=set()
    for stratum,xs in pools.items():
        old=sorted(xs,key=lambda x:score(x[0],OLD_SALT,stratum))[:N]
        old_hashes.update(hashlib.sha256(x[0].encode()).hexdigest() for x in old)
    selected=[]
    for stratum,xs in pools.items():
        fresh=[x for x in xs if hashlib.sha256(x[0].encode()).hexdigest() not in old_hashes]
        fresh=sorted(fresh,key=lambda x:score(x[0],NEW_SALT,stratum))
        if len(fresh)<N: raise SystemExit(f"insufficient fresh {stratum}: {len(fresh)}")
        selected.extend((stratum,*x) for x in fresh[:N])
    source_path=Path("p48_budget_source_packet.jsonl"); gold_path=Path("p48_budget_hidden_gold.jsonl")
    with source_path.open("w",encoding="utf-8") as fs, gold_path.open("w",encoding="utf-8") as fg:
        for i,(stratum,source,refs,toks) in enumerate(selected):
            item_id=f"P48-BUDGET-{i+1:03d}"; sh=hashlib.sha256(source.encode()).hexdigest()
            fs.write(json.dumps({"item_id":item_id,"stratum":stratum,"source":source,"source_sha256":sh,"protected_tokens":toks},ensure_ascii=False)+"\n")
            fg.write(json.dumps({"item_id":item_id,"references":list(refs.values()),"reference_sha256":[hashlib.sha256(x.encode()).hexdigest() for x in refs.values()]},ensure_ascii=False)+"\n")
    selected_hashes=[hashlib.sha256(x[1].encode()).hexdigest() for x in selected]
    receipt={
      "schema":"ksgt.g9.p48.kolla-budget-packet.v1","status":"PASS","source_md5":EXPECTED_MD5,
      "eligible_unique_two_reference":eligible,"old_packet_source_hashes_reconstructed":len(old_hashes),
      "old_new_overlap":len(old_hashes.intersection(selected_hashes)),
      "selected_counts":dict(Counter(x[0] for x in selected)),"new_salt":NEW_SALT,
      "selected_source_hashes":selected_hashes,
      "source_packet_sha256":hashlib.sha256(source_path.read_bytes()).hexdigest(),
      "hidden_gold_sha256":hashlib.sha256(gold_path.read_bytes()).hexdigest(),
      "raw_source_or_reference_in_receipt":False,"selection_outcome_blind":True
    }
    Path("g9_p48_kolla_budget_packet_receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in receipt.items() if k!="selected_source_hashes"},ensure_ascii=False))
if __name__=="__main__": main()
