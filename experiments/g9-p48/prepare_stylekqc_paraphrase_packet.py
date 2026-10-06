#!/usr/bin/env python3
"""Compile outcome-blind StyleKQC positive-pair packet for G9-P48."""
from __future__ import annotations
import csv, hashlib, io, json, re, urllib.request
from collections import Counter
from pathlib import Path

REPO="cynthia/stylekqc"
COMMIT="f12bff2c26779969e1f8e54e1b98fcb8cfeeff77"
PATH="sts/test.tsv"
EXPECTED_SHA="60906d8b4c7624000d19a182ae4ecb8dea4c86c03c410b62e7293f97f575b657"
URL=f"https://raw.githubusercontent.com/{REPO}/{COMMIT}/{PATH}"
SALT="KSGT-G9-P48-STYLEKQC-PARA-v1"; N=16

URL_RE=re.compile(r"https?://[^\s]+")
EMAIL_RE=re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
NUMBER_RE=re.compile(r"(?<![A-Za-z0-9])[+-]?[0-9]+(?:[.,:/-][0-9]+)*(?![A-Za-z0-9])")
ASCII_RE=re.compile(r"\b[A-Za-z][A-Za-z0-9._+-]{1,}\b")

def protected_tokens(s):
    spans=[]; out=[]
    for kind,rx in [("URL",URL_RE),("EMAIL",EMAIL_RE),("NUMBER",NUMBER_RE),("ASCII_TOKEN",ASCII_RE)]:
        for m in rx.finditer(s):
            if any(not (m.end()<=a or m.start()>=b) for a,b in spans): continue
            spans.append((m.start(),m.end())); out.append((kind,m.group(0)))
    return out

req=urllib.request.Request(URL,headers={"User-Agent":"KSGT-G9-P48-stylekqc"})
with urllib.request.urlopen(req,timeout=120) as r:data=r.read()
if hashlib.sha256(data).hexdigest()!=EXPECTED_SHA: raise SystemExit("source sha mismatch")
reader=csv.DictReader(io.StringIO(data.decode("utf-8")),delimiter="\t",quoting=csv.QUOTE_NONE)

seen=set(); pools={"S1_HARD_CARGO":[],"S2_GENERIC":[]}; positive=0
for row in reader:
    if str(row.get("similarity","")).strip()!="1": continue
    a=row.get("sentence1",""); b=row.get("sentence2","")
    if not a.strip() or not b.strip() or a==b: continue
    key=(a,b)
    if key in seen: continue
    seen.add(key); positive+=1
    toks=protected_tokens(a); st="S1_HARD_CARGO" if toks else "S2_GENERIC"
    h=hashlib.sha256((a+"\0"+b+"|"+SALT+"|"+st).encode()).hexdigest()
    pools[st].append((h,a,b,toks))

selected=[]
for st in ["S1_HARD_CARGO","S2_GENERIC"]:
    xs=sorted(pools[st],key=lambda x:x[0])
    if len(xs)<N: raise SystemExit(f"insufficient {st}: {len(xs)}")
    selected.extend((st,*x) for x in xs[:N])

sp=Path("p48_stylekqc_source_packet.jsonl"); gp=Path("p48_stylekqc_hidden_gold.jsonl")
with sp.open("w",encoding="utf-8") as fs, gp.open("w",encoding="utf-8") as fg:
    for i,(st,h,a,b,toks) in enumerate(selected):
        iid=f"P48-STYLEKQC-{i+1:03d}"
        fs.write(json.dumps({"item_id":iid,"stratum":st,"source":a,"source_sha256":hashlib.sha256(a.encode()).hexdigest(),"protected_tokens":toks},ensure_ascii=False)+"\n")
        fg.write(json.dumps({"item_id":iid,"references":[b],"reference_sha256":[hashlib.sha256(b.encode()).hexdigest()]},ensure_ascii=False)+"\n")

receipt={
 "schema":"ksgt.g9.p48.stylekqc-paraphrase-packet-receipt.v1","status":"PASS",
 "source_sha256":EXPECTED_SHA,"positive_unique_eligible":positive,
 "pool_counts":{k:len(v) for k,v in pools.items()},"selected_counts":dict(Counter(x[0] for x in selected)),
 "source_packet_sha256":hashlib.sha256(sp.read_bytes()).hexdigest(),
 "hidden_gold_sha256":hashlib.sha256(gp.read_bytes()).hexdigest(),
 "raw_text_in_receipt":False,"selection_outcome_blind":True
}
Path("g9_p48_stylekqc_packet_receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(receipt,ensure_ascii=False))
