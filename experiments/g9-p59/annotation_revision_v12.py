#!/usr/bin/env python3
"""P59 internal §v1.2: schema and revision evidence gate; stdlib; no raw corpus assumed."""
import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import zipfile

def zip_central_directory(path):
    """Central directory only: no extraction or corpus text reading."""
    p=Path(path)
    with zipfile.ZipFile(p) as z:
        seen=set()
        items=[]
        for entry in z.infolist():
            if entry.is_dir(): continue
            name=entry.filename.replace("\\","/")
            if name.startswith("/") or ".." in name.split("/"): raise ValueError("ZIP_TRAVERSAL")
            if name in seen: raise ValueError("ZIP_DUPLICATE_MEMBER")
            seen.add(name)
            items.append({"path":name,"unpackedBytes":entry.file_size,"crc32":format(entry.CRC,"08x")})
    return {"name":p.name,"archiveBytes":p.stat().st_size,"members":items,
            "rawTextRead":False,"sha256":"NOT_CALCULATED","rights":"NOT_INFERRED"}

def conllu_syntax(source,work_id,split):
    """CoNLL-U structure, not verified GOLEM coreference chains."""
    if not work_id or split not in ("train","dev","test"): raise ValueError("WORK_SPLIT")
    n=zero=entity=0
    for line in source.splitlines():
        if not line.strip() or line.startswith("#"): continue
        cols=line.split("\t")
        if len(cols)!=10: raise ValueError("TEN_COLUMNS_REQUIRED")
        if not(cols[0].isdigit() or "." in cols[0] or "-" in cols[0]): raise ValueError("BAD_ID")
        n+=1
        zero+=int("." in cols[0])
        entity+=int("Entity=" in cols[9])
    if not n: raise ValueError("EMPTY")
    return {"workId":work_id,"split":split,"tokens":n,"emptyNodes":zero,
            "entityMarkedTokens":entity,"authority":"SYNTAX_ONLY_NOT_REAL_GOLD_VALIDATION"}

def kosend_contract(row,mapping):
    """Field mapping must be established from an actual original row."""
    required={"itemId","variant","judgment","provenance"}
    if not isinstance(row,dict) or not isinstance(mapping,dict): raise ValueError("SCHEMA")
    if set(mapping)!=required: return {"status":"HOLD_SCHEMA_UNKNOWN"}
    if any(field not in row for field in mapping.values()): return {"status":"HOLD_FIELD_NOT_PRESENT"}
    source=row[mapping["provenance"]]
    if source not in ("HUMAN_DIRECT","LLM_PSEUDO","UNKNOWN"): raise ValueError("BAD_PROVENANCE")
    if source=="HUMAN_DIRECT" and not row.get("humanEvidenceId"):
        return {"status":"HOLD_HUMAN_WITNESS"}
    return {"status":"MAPPED_NOT_CALIBRATED","labelOrigin":source}

def felw_gate(contract,candidate):
    """Never infer Korean semantic entailment from a witness assertion."""
    if set(contract)!={"facts","epistemic","licenseToInvent","writerIntent"}:
        raise ValueError("FELW_SCHEMA")
    if not contract["facts"] or not contract["writerIntent"]: raise ValueError("FELW_EMPTY")
    w=candidate.get("independentWitness") if isinstance(candidate,dict) else None
    if not isinstance(w,dict): return {"status":"HOLD","humanPreference":"NOT_OBSERVED"}
    for k in ("factsPreserved","evidencePreserved","intentPreserved","creationLicensed"):
        if w.get(k) is False: return {"status":"REJECT","reason":k,"humanPreference":"NOT_OBSERVED"}
        if w.get(k) is not True: return {"status":"HOLD","humanPreference":"NOT_OBSERVED"}
    return {"status":"WITNESSED_GATE_ONLY","humanPreference":"NOT_OBSERVED"}

def paired_utility(rows):
    if not rows: return {"status":"HOLD_NO_HUMAN_DATA"}
    if any(r.get("observedHuman") is not True or
           not isinstance(r.get("before"),(int,float)) or
           not isinstance(r.get("after"),(int,float)) or
           not r.get("workId") for r in rows):
        return {"status":"HOLD_UNVERIFIED_HUMAN_DATA"}
    grouped={}
    for r in rows: grouped.setdefault(r["workId"],[]).append(r["after"]-r["before"])
    means=[sum(v)/len(v) for v in grouped.values()]
    return {"status":"DESCRIPTIVE_ONLY","workMean":sum(means)/len(means),
            "works":len(grouped),"causality":"NOT_IDENTIFIED"}

def self_test():
    with tempfile.TemporaryDirectory() as tmp:
        p=Path(tmp)/"synthetic.zip"
        with zipfile.ZipFile(p,"w") as f: f.writestr("news/year/item.json","{}")
        a=zip_central_directory(p)
        assert a["rawTextRead"] is False and a["sha256"]=="NOT_CALCULATED"
        bad=Path(tmp)/"bad.zip"
        with zipfile.ZipFile(bad,"w") as f: f.writestr("../unexpected.txt","x")
        try: zip_central_directory(bad)
        except ValueError as e: assert str(e)=="ZIP_TRAVERSAL"
        else: raise AssertionError("TRAVERSAL_LEAK")
    tiny="1\t가\t가\tNOUN\t_\t_\t0\troot\t_\tEntity=(e1)\n1.1\t_\t_\tPRON\t_\t_\t1\tdep\t_\t_"
    s=conllu_syntax(tiny,"fabricated-work","dev")
    assert s["tokens"]==2 and s["emptyNodes"]==1
    try: conllu_syntax("1\tbroken","work","train")
    except ValueError as e: assert str(e)=="TEN_COLUMNS_REQUIRED"
    else: raise AssertionError("BAD_CONLLU_ACCEPTED")
    assert kosend_contract({"test":"unmapped"}, {})["status"]=="HOLD_SCHEMA_UNKNOWN"
    m={"itemId":"id","variant":"ending","judgment":"rating","provenance":"source"}
    row={"id":1,"ending":"다","rating":2,"source":"HUMAN_DIRECT"}
    assert kosend_contract(row,m)["status"]=="HOLD_HUMAN_WITNESS"
    felw={"facts":["source-fact"],"epistemic":"observed","licenseToInvent":"none","writerIntent":"report"}
    assert felw_gate(felw,{})["status"]=="HOLD"
    w={"factsPreserved":True,"evidencePreserved":True,"intentPreserved":True,"creationLicensed":True}
    assert felw_gate(felw,{"independentWitness":w})["status"]=="WITNESSED_GATE_ONLY"
    assert felw_gate(felw,{"independentWitness":dict(w,factsPreserved=False)})["status"]=="REJECT"
    assert paired_utility([])["status"]=="HOLD_NO_HUMAN_DATA"
    assert paired_utility([{"workId":"a","before":1,"after":2}])["status"]=="HOLD_UNVERIFIED_HUMAN_DATA"
    print(json.dumps({"test":"PASS","section":"P59/v1.2",
       "zip":"CENTRAL_DIRECTORY_ONLY","conllu":"SCHEMA_ONLY",
       "kosend":"ROW_MAPPING_HOLD","felw":"WITNESS_GATE_ONLY",
       "nativeHumanProseScores":0,"realRawCorpusIngested":0}))

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--scan-zip-dir",type=Path)
    args=ap.parse_args()
    if args.scan_zip_dir:
        root=args.scan_zip_dir
        if not root.is_dir(): raise SystemExit("NOT_A_DIRECTORY")
        print(json.dumps({"mode":"READ_ONLY_LOCAL_METADATA",
          "items":[zip_central_directory(p) for p in sorted(root.glob("*.zip"))]},
          ensure_ascii=False))
    else: self_test()
