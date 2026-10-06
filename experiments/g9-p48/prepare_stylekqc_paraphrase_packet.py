#!/usr/bin/env python3
"""Compile G9-P48 StyleKQC v1.1 generic-only robustness packet."""
from __future__ import annotations
import csv, hashlib, io, json, urllib.request
from pathlib import Path

REPO="cynthia/stylekqc"; COMMIT="f12bff2c26779969e1f8e54e1b98fcb8cfeeff77"
PATH="sts/test.tsv"; EXPECTED_SHA="60906d8b4c7624000d19a182ae4ecb8dea4c86c03c410b62e7293f97f575b657"
URL=f"https://raw.githubusercontent.com/{REPO}/{COMMIT}/{PATH}"
SALT="KSGT-G9-P48-STYLEKQC-PARA-v1.1"; N=32

req=urllib.request.Request(URL,headers={"User-Agent":"KSGT-G9-P48-stylekqc-v1.1"})
with urllib.request.urlopen(req,timeout=120) as r:data=r.read()
if hashlib.sha256(data).hexdigest()!=EXPECTED_SHA: raise SystemExit("source sha mismatch")
reader=csv.DictReader(io.StringIO(data.decode("utf-8")),delimiter="\t",quoting=csv.QUOTE_NONE)
seen=set(); pool=[]
for row in reader:
    if str(row.get("similarity","")).strip()!="1": continue
    a=row.get("sentence1",""); b=row.get("sentence2","")
    if not a.strip() or not b.strip() or a==b: continue
    key=(a,b)
    if key in seen: continue
    seen.add(key)
    h=hashlib.sha256((a+"\0"+b+"|"+SALT).encode()).hexdigest()
    pool.append((h,a,b))
selected=sorted(pool,key=lambda x:x[0])[:N]
if len(selected)<N: raise SystemExit(f"insufficient generic pool: {len(selected)}")

sp=Path("p48_stylekqc_source_packet.jsonl"); gp=Path("p48_stylekqc_hidden_gold.jsonl")
with sp.open("w",encoding="utf-8") as fs, gp.open("w",encoding="utf-8") as fg:
    for i,(h,a,b) in enumerate(selected):
        iid=f"P48-STYLEKQC-{i+1:03d}"
        fs.write(json.dumps({"item_id":iid,"stratum":"S2_GENERIC_ONLY","source":a,"source_sha256":hashlib.sha256(a.encode()).hexdigest(),"protected_tokens":[]},ensure_ascii=False)+"\n")
        fg.write(json.dumps({"item_id":iid,"references":[b],"reference_sha256":[hashlib.sha256(b.encode()).hexdigest()]},ensure_ascii=False)+"\n")

receipt={
 "schema":"ksgt.g9.p48.stylekqc-paraphrase-packet-receipt.v1.1","status":"PASS_GENERIC_ONLY",
 "source_sha256":EXPECTED_SHA,"positive_unique_eligible":len(pool),"selected":N,
 "source_packet_sha256":hashlib.sha256(sp.read_bytes()).hexdigest(),
 "hidden_gold_sha256":hashlib.sha256(gp.read_bytes()).hexdigest(),
 "raw_text_in_receipt":False,"selection_outcome_blind":True,
 "authority_ceiling":"FORMAT_PLURALITY_AND_SOURCE_TASK_ROBUSTNESS_ONLY",
 "hard_cargo_replication":False
}
Path("g9_p48_stylekqc_packet_receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(receipt,ensure_ascii=False))
