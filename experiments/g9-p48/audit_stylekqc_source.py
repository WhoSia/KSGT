#!/usr/bin/env python3
"""Audit exact public StyleKQC repository surfaces for G9-P48.

No raw sentences are written to the artifact. The receipt contains only hashes,
headers, row counts, label distributions and duplicate/identity diagnostics.
"""
from __future__ import annotations
import csv, hashlib, io, json, urllib.request
from collections import Counter
from pathlib import Path

REPO="cynthia/stylekqc"
COMMIT="f12bff2c26779969e1f8e54e1b98fcb8cfeeff77"
PATHS=[
 "act/train.tsv","act/dev.tsv","act/test.tsv",
 "topic/train.tsv","topic/dev.tsv","topic/test.tsv",
 "sts/train.tsv","sts/dev.tsv","sts/test.tsv",
]
BASE=f"https://raw.githubusercontent.com/{REPO}/{COMMIT}"

def get(path:str)->bytes:
    req=urllib.request.Request(f"{BASE}/{path}",headers={"User-Agent":"KSGT-G9-P48-audit"})
    with urllib.request.urlopen(req,timeout=120) as r:
        return r.read()

def audit(path:str,data:bytes):
    txt=data.decode("utf-8")
    reader=csv.DictReader(io.StringIO(txt),delimiter="\t",quoting=csv.QUOTE_NONE)
    headers=reader.fieldnames or []
    rows=0; labels=Counter(); keys=Counter(); exact_pair_equal=0
    s1="sentence1" if "sentence1" in headers else None
    s2="sentence2" if "sentence2" in headers else None
    label_col=None
    for c in ["similarity","act","topic","label"]:
        if c in headers: label_col=c; break
    for row in reader:
        rows+=1
        if label_col is not None: labels[str(row.get(label_col,""))]+=1
        if s1 and s2:
            a=row.get(s1,""); b=row.get(s2,"")
            if a==b: exact_pair_equal+=1
            h=hashlib.sha256((a+"\0"+b).encode("utf-8")).hexdigest()
            keys[h]+=1
    return {
      "path":path,"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest(),
      "headers":headers,"rows":rows,"label_column":label_col,
      "label_counts":dict(sorted(labels.items())),
      "exact_pair_equal":exact_pair_equal if s1 and s2 else None,
      "duplicate_pair_rows":sum(v-1 for v in keys.values() if v>1) if s1 and s2 else None
    }

def main():
    out={"schema":"ksgt.g9.p48.stylekqc-source-audit.v1","repo":REPO,"commit":COMMIT,"files":[]}
    for p in PATHS:
        out["files"].append(audit(p,get(p)))
    sts=[x for x in out["files"] if x["path"].startswith("sts/")]
    out["adjudication"]={
      "all_files_utf8":True,
      "sts_headers":sorted({tuple(x["headers"]) for x in sts}),
      "directed_register_columns_present":any(any(k in h.lower() for k in ["formal","informal","style","direction"]) for x in sts for h in x["headers"]),
      "rule":"Do not treat STS sentence1/sentence2 rows as directed formal↔informal gold unless a direction/style field is present or separately reconstructible from authoritative source metadata."
    }
    Path("g9_p48_stylekqc_source_audit.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(out,ensure_ascii=False))
if __name__=="__main__": main()
