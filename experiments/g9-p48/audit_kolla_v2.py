#!/usr/bin/env python3
"""Summary-only audit of canonical KoLLA v2 M2 for G9-P48."""
from __future__ import annotations
import hashlib, json, urllib.request
from collections import Counter
from pathlib import Path

URL="https://zenodo.org/records/16908784/files/KoLLA_multi-refs.m2?download=1"
EXPECTED_MD5="9a6f2e3fea1b39bbb7343445db1167f7"

req=urllib.request.Request(URL,headers={"User-Agent":"KSGT-G9-P48-audit"})
with urllib.request.urlopen(req,timeout=120) as r:
    data=r.read()
md5=hashlib.md5(data).hexdigest()
if md5!=EXPECTED_MD5:
    raise SystemExit(f"MD5 mismatch: {md5}")
text=data.decode("utf-8")

sentences=0
annotations=0
annotators=Counter()
refs_per_sentence=[]
cur_ann=set()
blocks=0
for line in text.splitlines()+[""]:
    if line.startswith("S "):
        if cur_ann:
            refs_per_sentence.append(len(cur_ann)); cur_ann=set()
        sentences+=1
    elif line.startswith("A "):
        annotations+=1
        parts=line.split("|||")
        aid=parts[-1].strip() if len(parts)>=2 else "UNKNOWN"
        cur_ann.add(aid); annotators[aid]+=1
    elif not line.strip():
        if cur_ann:
            refs_per_sentence.append(len(cur_ann)); cur_ann=set()
        blocks+=1

dist=Counter(refs_per_sentence)
receipt={
 "schema":"ksgt.g9.p48.kolla-v2-source-audit.v1",
 "status":"PASS",
 "doi":"10.5281/zenodo.16908784",
 "version":"v2",
 "source_url":URL,
 "bytes":len(data),
 "md5":md5,
 "sha256":hashlib.sha256(data).hexdigest(),
 "sentence_records":sentences,
 "annotation_lines":annotations,
 "annotator_ids":dict(sorted(annotators.items())),
 "reference_annotator_count_per_sentence":dict(sorted((str(k),v) for k,v in dist.items())),
 "raw_text_persisted":False,
 "authority":"L2_MULTI_REFERENCE_GEC_SOURCE_STRUCTURE_ONLY"
}
Path("g9_p48_kolla_v2_source_audit.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(receipt,ensure_ascii=False))
