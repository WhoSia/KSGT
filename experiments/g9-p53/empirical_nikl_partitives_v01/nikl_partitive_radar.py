#!/usr/bin/env python3
"""KSGT G9-P53: NIKL ZA 2025 candidate radar, metadata only, NOT partitive gold.
No network or dependencies; source in private Drive only, never publish raw.
"""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ZIP_SHA256="c0d65205de493dca86d98cef02cf1742844a3b9259caf0ec3dc7e48ddd62d05d"
FILES={
 "NXZA2502512313.json":"b3aaefd241ae351c4c252cc493161d9be02232779a47bd7735195d0de87e8f86",
 "SXZA2502512312.json":"717fbe35db08b91bd62fdfb2a29cdef8a2d91aa85d099f256e82802e8122e0cc"
}
def sha(b):return hashlib.sha256(b).hexdigest()
def canonical(o):return json.dumps(o,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode("utf8")
def scan_documents(docs,label):
 s={"documents":len(docs),"sentences":0,"za_annotation_rows":0,
    "geujung_sentences":0,"geujung_literals":0,"naemaji_sentences":0,
    "naemaji_literals":0,"geujung_has_prior_sentence":0,
    "geujung_has_za_annotation":0,"geujung_form_original_diff":0}
 manifest=[]
 for di,d in enumerate(docs):
  rows=d.get("sentence")
  if not isinstance(rows,list):raise ValueError("DOCUMENT_SENTENCE_LIST_MISSING")
  s["sentences"]+=len(rows)
  for i,row in enumerate(rows):
   if not isinstance(row,dict) or not isinstance(row.get("form"),str):raise ValueError("INVALID_SENTENCE")
   form=row["form"];original=row.get("original_form");ZA=row.get("ZA")
   if not isinstance(ZA,list):raise ValueError("ZA_ANNOTATION_LIST_MISSING")
   s["za_annotation_rows"]+=len(ZA)
   g,n=form.count("그중"),form.count("나머지")
   if n:s["naemaji_sentences"]+=1;s["naemaji_literals"]+=n
   if not g:continue
   s["geujung_sentences"]+=1;s["geujung_literals"]+=g
   s["geujung_has_prior_sentence"]+=int(i>0)
   s["geujung_has_za_annotation"]+=int(bool(ZA))
   s["geujung_form_original_diff"]+=int(form!=original)
   preceding=[x.get("form","") for x in rows[max(0,i-2):i]]
   manifest.append({"subcorpus":label,"document_ordinal":di,"sentence_ordinal":i,
     "row_key_hash":sha(canonical([d.get("id"),row.get("id")])),
     "sentence_text_sha256":sha(form.encode("utf8")),
     "prior_two_sentences_sha256":sha(canonical(preceding)),
     "preceding_sentence_count":len(preceding),
     "za_annotation_count":len(ZA),"proven_group_antecedent":False,
     "manual_partitive_gold":"NOT_ADJUDICATED"})
 return s,manifest
def scan_archive(path):
 raw=Path(path).read_bytes();digest=sha(raw)
 if digest!=ZIP_SHA256:raise ValueError("PINNED_ZIP_SHA256_MISMATCH")
 summaries={};manifest=[]
 with zipfile.ZipFile(path) as z:
  for name,expected in FILES.items():
   b=z.read(name)
   if sha(b)!=expected:raise ValueError("PINNED_MEMBER_SHA256_MISMATCH:"+name)
   payload=json.loads(b)
   if not isinstance(payload,dict) or not isinstance(payload.get("document"),list):
    raise ValueError("INVALID_NIKL_DOCUMENT_FORMAT:"+name)
   summary,m=scan_documents(payload["document"],name[:2])
   summaries[name]=summary;manifest+=m
 keys=next(iter(summaries.values())).keys()
 totals={k:sum(v[k] for v in summaries.values()) for k in keys}
 totals["candidate_count"]=len(manifest)
 return ({"schema":"ksgt.g9p53.nikl2025_geujung_candidate_radar.v1",
  "source":{"archive_sha256":digest,"membership_sha256":FILES,
   "custody":"EXISTING_PRIVATE_USER_DRIVE","rights":"NO_RAW_PUBLICATION"},
  "by_split":summaries,"total":totals,
  "authority":{"independent_partitive_antecedent_gold":False,
   "automated_group_resolution":False,"licensed_prose_quality":False,
   "geujung_is_zero_anaphora_truth":False,
   "candidate_status":"LEXICAL_FILTER_FOR_PRIVATE_MANUAL_REVIEW_ONLY"}},manifest)
def main():
 p=argparse.ArgumentParser()
 p.add_argument("archive",help="Private local copy of NIKL ZA 2025 v1.0 ZIP")
 p.add_argument("--aggregate",help="Metadata-only output; exclusive create")
 p.add_argument("--private-manifest",help="PRIVATE hashed row index; never GitHub")
 a=p.parse_args()
 aggregate,manifest=scan_archive(a.archive)
 if a.aggregate:
  with open(a.aggregate,"x",encoding="utf8") as f:json.dump(aggregate,f,ensure_ascii=False,indent=2)
 if a.private_manifest:
  with open(a.private_manifest,"x",encoding="utf8") as f:
   json.dump({"warning":"PRIVATE_METADATA_ONLY_NOT_GOLD","candidates":manifest},f,ensure_ascii=False,indent=2)
 print(json.dumps({"status":"PINNED_PRIVATE_CORPUS_METADATA_PASS","total":aggregate["total"],
                   "independent_partitive_gold":False},ensure_ascii=False))
if __name__=="__main__":main()
