#!/usr/bin/env python3
"""KSGT G9-P45 streaming adapter for diachronic JSONL corpora.

Authority rules:
- date maps to PERIOD only, never to human provenance by itself;
- PERIOD x GENRE x REGISTER x PROVENANCE x REPRESENTATION remain separate;
- raw text is never emitted by default;
- normalization is never invented: only source-provided normalized text may form
  a NORMALIZED_SOURCE_PROVIDED representation.
"""
from __future__ import annotations
import argparse,json
from collections import Counter
from pathlib import Path
from typing import Any,Iterable

EDF={
 "CONTRAST":["그러나","그런데","하지만","그렇지만","반면","오히려","도리어","그럼에도","비록"],
 "CAUSE_RESULT":["그래서","그러므로","따라서","때문에","그러자","그리하여","결국","그러니","그러면","이에"],
 "TEMPORAL":["그때","이때","먼저","뒤에","후에","마침내","이윽고","곧","동안","한동안"],
 "EXPANSION":["그리고","또한","또","게다가","더구나","즉","이를테면","예컨대","다시 말해"],
}
PERIODS=[
 (1930,1939,"PREWAR_1930S"),(1945,1959,"POSTLIB_1945_1959"),
 (1960,1979,"INDUSTRIAL_1960_1979"),(1980,1999,"LATE20C_1980_1999"),
 (2000,2008,"EARLY_DIGITAL_2000_2008"),(2009,2018,"NEWS_2009_2018"),
 (2019,2019,"NEWS_2019"),(2020,2022,"PRE_CHATGPT_2020_2022_11_29"),
 (2023,2023,"TRANSITION_2022_11_30_2023"),(2024,9999,"POST_2024_MIXED_PROVENANCE"),
]
DEFAULT_SOURCE_CONTRACT={
 "Korean Newspaper Archive":{
   "genre":"news","register":"institutional_editorial",
   "provenance_pre_chatgpt":"INSTITUTIONAL_EDITORIAL_PRE_CHATGPT",
   "provenance_post_2022":"UNKNOWN",
 }
}

def period_bin(year:int|None)->str:
    if year is None:return "UNKNOWN_PERIOD"
    if year<1930:return "OUT_OF_SCOPE_PRE1930"
    if 1940<=year<=1944:return "WARTIME_1940_1944_UNMODELED"
    for lo,hi,name in PERIODS:
        if lo<=year<=hi:return name
    return "UNKNOWN_PERIOD"

def load_contract(path:str|None)->dict[str,Any]:
    if not path:return DEFAULT_SOURCE_CONTRACT
    raw=json.loads(Path(path).read_text(encoding="utf-8"))
    return raw.get("mappings",raw)

def classify_source(row:dict[str,Any],contract:dict[str,Any])->dict[str,str]:
    corpus=str(row.get("corpus") or "")
    year=row.get("year")
    spec=contract.get(corpus)
    if not isinstance(spec,dict):
        return {"genre":"UNKNOWN","register":"UNKNOWN","provenance":"UNKNOWN",
                "source_contract_status":"UNMAPPED"}
    genre=spec.get("genre","UNKNOWN"); register=spec.get("register","UNKNOWN")
    if isinstance(year,int) and year<=2022:
        prov=spec.get("provenance_pre_chatgpt","UNKNOWN")
    else:
        prov=spec.get("provenance_post_2022","UNKNOWN")
    return {"genre":genre,"register":register,"provenance":prov,
            "source_contract_status":"MAPPED"}

def get_raw_text(row:dict[str,Any])->str:
    x=row.get("text")
    if isinstance(x,str) and x:return x
    c=row.get("content")
    if isinstance(c,dict) and isinstance(c.get("body"),str):return c["body"]
    return ""

def get_source_normalized_text(row:dict[str,Any])->str:
    for key in ("normalized_text","text_normalized"):
        x=row.get(key)
        if isinstance(x,str) and x:return x
    c=row.get("normalized_content")
    if isinstance(c,dict) and isinstance(c.get("body"),str):return c["body"]
    return ""

def edf_counts(text:str)->dict[str,int]:
    return {cls:sum(text.count(m) for m in markers) for cls,markers in EDF.items()}

def marker_counts(text:str)->dict[str,dict[str,int]]:
    return {cls:{m:text.count(m) for m in markers} for cls,markers in EDF.items()}

def _year(row):
    y=row.get("year")
    if isinstance(y,int):return y
    try:return int(y)
    except (TypeError,ValueError):return None

def feature_row(row:dict[str,Any],contract:dict[str,Any],
                representation:str="RAW")->dict[str,Any]:
    year=_year(row); source_state=classify_source({**row,"year":year},contract)
    if representation=="RAW":
        text=get_raw_text(row)
    elif representation=="NORMALIZED_SOURCE_PROVIDED":
        text=get_source_normalized_text(row)
        if not text: raise ValueError("normalized representation requested but source provides none")
    else:
        raise ValueError(f"unsupported representation {representation}")
    copyright_value=row.get("copyright_status")
    if copyright_value is None:copyright_value=row.get("copyright")
    analytics=row.get("text_analytics")
    if not isinstance(analytics,dict):analytics=row.get("analytics")
    if not isinstance(analytics,dict):analytics={}
    return {
      "id":row.get("id"),"year":year,"period":period_bin(year),
      "language":row.get("language"),"script":row.get("script"),
      "source":row.get("source"),"corpus":row.get("corpus"),
      "doc_type":row.get("doc_type"),"copyright":copyright_value,
      "url":row.get("url"),"representation":representation,
      **source_state,"text_length":len(text),
      "source_reported_text_length":analytics.get("text_length"),
      "edf":edf_counts(text),"markers":marker_counts(text),
    }

def feature_rows(row,contract,emit_source_normalized=False):
    yield feature_row(row,contract,"RAW")
    if emit_source_normalized and get_source_normalized_text(row):
        yield feature_row(row,contract,"NORMALIZED_SOURCE_PROVIDED")

def iter_jsonl(path:Path)->Iterable[dict[str,Any]]:
    with path.open("r",encoding="utf-8") as f:
      for n,line in enumerate(f,1):
        if not line.strip():continue
        try:r=json.loads(line)
        except json.JSONDecodeError as e:raise ValueError(f"{path}:{n}: invalid JSON") from e
        if not isinstance(r,dict):raise ValueError(f"{path}:{n}: row must be object")
        yield r

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("input",type=Path); ap.add_argument("--source-contract")
    ap.add_argument("--output",type=Path); ap.add_argument("--emit-source-normalized",action="store_true")
    args=ap.parse_args(); contract=load_contract(args.source_contract)
    out=args.output.open("w",encoding="utf-8") if args.output else None
    summary=Counter()
    try:
      for row in iter_jsonl(args.input):
        for feat in feature_rows(row,contract,args.emit_source_normalized):
          summary[(feat["period"],feat["representation"])]+=1
          line=json.dumps(feat,ensure_ascii=False,sort_keys=True)
          (out.write(line+"\n") if out else print(line))
    finally:
      if out:out.close()
    result={"rows":sum(summary.values()),
            "period_representation_counts":{f"{p}|{r}":n for (p,r),n in summary.items()}}
    print(json.dumps(result,ensure_ascii=False,sort_keys=True),file=__import__("sys").stderr)
if __name__=="__main__":main()
