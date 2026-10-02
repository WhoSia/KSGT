#!/usr/bin/env python3
"""Probe JSONL shard metadata before admitting a source contract.

This tool never infers provenance. It only describes observed metadata and
marks whether selected contract fields are homogeneous in the probed rows.
"""
from __future__ import annotations
import argparse,json
from collections import Counter
from pathlib import Path

FIELDS=("source","corpus","copyright","copyright_status","language","script","doc_type")
def probe(path:Path,limit:int=1000):
    counts={k:Counter() for k in FIELDS}; years=Counter(); n=0
    with path.open(encoding="utf-8") as f:
        for line in f:
            if not line.strip():continue
            r=json.loads(line); n+=1
            for k in FIELDS:
                v=r.get(k)
                if v is not None:counts[k][str(v)]+=1
            y=r.get("year")
            if y is not None:years[str(y)]+=1
            if n>=limit:break
    distinct={k:dict(v.most_common()) for k,v in counts.items()}
    contract_fields={
      "source":len(counts["source"])==1,
      "corpus":len(counts["corpus"])==1,
      "copyright":(len(counts["copyright"])==1 and not counts["copyright_status"]) or
                  (len(counts["copyright_status"])==1 and not counts["copyright"]),
      "language":len(counts["language"])==1,
      "script":len(counts["script"])==1,
      "doc_type":len(counts["doc_type"])<=1,
    }
    return {
      "rows_probed":n,
      "metadata_counts":distinct,
      "year_min":min(map(int,years)) if years and all(x.lstrip("-").isdigit() for x in years) else None,
      "year_max":max(map(int,years)) if years and all(x.lstrip("-").isdigit() for x in years) else None,
      "contract_field_homogeneity":contract_fields,
      "auto_contract_admissible":all(contract_fields[k] for k in ("source","corpus","copyright","language")),
      "provenance":"UNINFERRED",
      "authority":"SOURCE_CONTRACT_PROBE_ONLY"
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("input",type=Path)
    ap.add_argument("--limit",type=int,default=1000)
    args=ap.parse_args()
    print(json.dumps(probe(args.input,args.limit),ensure_ascii=False,sort_keys=True,indent=2))
if __name__=="__main__":main()
