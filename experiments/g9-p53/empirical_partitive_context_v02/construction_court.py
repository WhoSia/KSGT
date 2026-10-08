#!/usr/bin/env python3
"""G9-P53: bounded, metadata-only construction census of pinned private NIKL 2025 ZA.
No source sentences, document IDs, person names or row hashes are placed in public
receipts. Source-phrase classification does not resolve the antecedent or writer intent.
"""
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import zipfile

ZIP_SHA256="c0d65205de493dca86d98cef02cf1742844a3b9259caf0ec3dc7e48ddd62d05d"
MEMBERS={
 "NXZA2502512313.json":"b3aaefd241ae351c4c252cc493161d9be02232779a47bd7735195d0de87e8f86",
 "SXZA2502512312.json":"717fbe35db08b91bd62fdfb2a29cdef8a2d91aa85d099f256e82802e8122e0cc"
}
# Mutually exclusive, longest-first. These are surface forms, not licensed edits.
FORMS=(
 ("GEUJUNG_ESEODO","그중에서도"),
 ("GEUJUNG_ESEO","그중에서"),
 ("GEUJUNG_ESEON","그중에선"),
 ("GEUJUNG_E","그중에"),
 ("GEUJUNG_BARE","그중"),
)
LEGACY_PATTERN=re.compile(r"그중 한 [^\s]+")
def sha(raw):return hashlib.sha256(raw).hexdigest()
def construction(text):
 if not isinstance(text,str):raise ValueError("TEXT_REQUIRED")
 at=text.find("그중")
 if at<0:return None
 for label,prefix in FORMS:
  if text.startswith(prefix,at):return label
 raise AssertionError("SURFACE_SCANNER")
def scan_documents(documents,split):
 counts=Counter();private=[]
 for di,doc in enumerate(documents):
  sentences=doc.get("sentence")
  if not isinstance(sentences,list):raise ValueError("SENTENCES_REQUIRED")
  for si,row in enumerate(sentences):
   form=row.get("form")
   if not isinstance(form,str):raise ValueError("FORM_REQUIRED")
   if "그중" not in form:continue
   if form.count("그중")!=1:raise ValueError("MULTIPLE_SPANS_REQUIRE_REVIEW")
   za=row.get("ZA")
   if not isinstance(za,list):raise ValueError("ZA_LIST_REQUIRED")
   label=construction(form)
   counts[label]+=1;counts["TOTAL"]+=1
   counts["PRECEDING_SENTENCE_EXISTS"]+=int(si>0)
   counts["HAS_ZA_ANNOTATION_ROWS"]+=int(bool(za))
   if LEGACY_PATTERN.search(form):counts["KRC_V07_NARROW_PATTERN_HITS"]+=1
   private.append({"split":split,"document_ordinal":di,"sentence_ordinal":si,
     "source_sentence_sha256":sha(form.encode("utf8")),
     "construction":label,
     "gold_partitive_antecedent":"NOT_ADJUDICATED",
     "human_writer_preference":"NOT_OBSERVED"})
 return counts,private
def audit_zip(file):
 raw=Path(file).read_bytes()
 if sha(raw)!=ZIP_SHA256:raise ValueError("SOURCE_ZIP_HASH_MISMATCH")
 combined=Counter();by_split={};private=[]
 with zipfile.ZipFile(file) as z:
  for member,expected in MEMBERS.items():
   content=z.read(member)
   if sha(content)!=expected:raise ValueError("SOURCE_MEMBER_HASH_MISMATCH")
   obj=json.loads(content)
   split=member[:2]
   counts,index=scan_documents(obj["document"],split)
   combined.update(counts);by_split[split]=dict(counts);private.extend(index)
 if len(private)!=25 or combined["KRC_V07_NARROW_PATTERN_HITS"]!=0:
  raise ValueError("PINNED_LEXICAL_COUNTS_CHANGED")
 return ({"schema":"ksgt.g9p53.nikl2025_construction_census.v2",
   "source_sha256":ZIP_SHA256,
   "method":"EXACT_LITERAL_CONTEXT_BOUNDARY_DIAGNOSTICS",
   "by_split":by_split,"construction_counts":dict(combined),
   "partitive_antecedent_gold":"NOT_COLLECTED",
   "human_writer_edits":"NOT_COLLECTED",
   "actual_linguistic_promotion":"NO",
   "no_raw_corpus_in_receipt":True},private)
if __name__=="__main__":
 import argparse
 p=argparse.ArgumentParser()
 p.add_argument("private_archive")
 p.add_argument("--aggregate",help="Exclusive-create metadata JSON")
 args=p.parse_args()
 a,index=audit_zip(args.private_archive)
 if args.aggregate:
  with open(args.aggregate,"x",encoding="utf8") as f:
   json.dump(a,f,ensure_ascii=False,indent=2)
 print(json.dumps({"status":"SOURCE_SHA_PINNED_PRIVATE_METADATA_ONLY","categories":a["construction_counts"],"gold":"NONE"},ensure_ascii=False))
