"""R3 full frozen-cohort mechanical falsification, separate from active ingestion.

Read-only source snapshots; own SQLite shard checkpoints; no reviewer data or
semantic judgments. A local operator must verify free disk and controller state.
"""
import argparse
import collections
import contextlib
import datetime
import gzip
import hashlib
import json
import pathlib
import shutil
import sqlite3
import time

import p62_reference as ref
from p62_r3_inference import policy_court
from p62_r3_machine_court import SUFFIX_ATTACKS

METRICS = (
    "STRUCT_LEX_DISAGREE", "PREFIX_ACCESS_STRUCT_DISAGREE",
    "PREFIX_ACCESS_LEX_DISAGREE", "PREFIX_RECENCY_DISAGREE",
    "PREFIX_REPETITION_DISAGREE", "PREFIX_ABSTAIN",
    "STRUCT_SUFFIX_CHANGED", "LEX_SUFFIX_CHANGED",
)
CENSUS = (886879, 10698118, 19255)
VERSION = "P62-R3-full-frozen-machine-v1"


def _chosen(candidate):
    return candidate["candidate_id"] if candidate is not None else None


def analyze_structure(forms, strict, work, family, year):
    """One exact original JSON structure; every literal target, including edges."""
    values=collections.Counter()
    targets=0
    for i, source in enumerate(forms):
        for match in ref.TARGET.finditer(source):
            targets+=1
            t={"unit":i,"start":match.start(),"end":match.end(),"observed":True}
            cs=ref.candidates(forms,t)
            item={"strict_structure":strict,"source_work_key":work,"target":t,
                  "context":[{"unit":j,"text":forms[j]} for j in range(max(0,i-2),min(len(forms),i+3))],
                  "candidates":cs,"human_ground_truth":None,
                  "independent_adjudications":[]}
            court=policy_court(item)
            chosen=court["selected_ids"]
            old_s=_chosen(ref.rank_candidate(forms,t,cs,"STRUCTURAL"))
            old_l=_chosen(ref.rank_candidate(forms,t,cs,"LEXICAL"))
            values["STRUCT_LEX_DISAGREE"]+=old_s!=old_l
            values["PREFIX_ACCESS_STRUCT_DISAGREE"]+=chosen["PREFIX_ACCESSIBILITY"]!=old_s
            values["PREFIX_ACCESS_LEX_DISAGREE"]+=chosen["PREFIX_ACCESSIBILITY"]!=old_l
            values["PREFIX_RECENCY_DISAGREE"]+=court["accessibility_recency_disagree"]
            values["PREFIX_REPETITION_DISAGREE"]+=court["accessibility_repetition_disagree"]
            values["PREFIX_ABSTAIN"]+=court["all_abstain"]
            structural_changed=lexical_changed=False
            for suffix in SUFFIX_ATTACKS:
                hypothetical=list(forms)
                hypothetical[i]=source[:t["end"]]+suffix
                for j in range(i+1,min(i+3,len(forms))):
                    hypothetical[j]="후행 통제 문단."
                edited={**item,"context":[{"unit":j,"text":hypothetical[j]}
                           for j in range(max(0,i-2),min(len(forms),i+3))]}
                changed=policy_court(edited)
                if changed["prefix_signature"]!=court["prefix_signature"] or changed["selected_ids"]!=chosen:
                    raise AssertionError("Future mutation changed a strict-prefix policy")
                structural_changed |= _chosen(ref.rank_candidate(hypothetical,t,cs,"STRUCTURAL"))!=old_s
                lexical_changed |= _chosen(ref.rank_candidate(hypothetical,t,cs,"LEXICAL"))!=old_l
            values["STRUCT_SUFFIX_CHANGED"]+=structural_changed
            values["LEX_SUFFIX_CHANGED"]+=lexical_changed
    return {"strict":strict,"work":work,"family":str(family),"year":str(year),
            "paragraphs":len(forms),"targets":targets,
            "metrics":{metric:int(values[metric]) for metric in METRICS}}


def _seal(root):
    root=pathlib.Path(root)
    source=root/"70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite"
    p62=root/"80_EXPORT/p62_referential_grounding_20261011/P62_PRIVATE.sqlite"
    return {"version":VERSION,
            "source_db_sha256":ref.digest(source),
            "p62_db_sha256":ref.digest(p62),
            "code_sha256":{p:ref.digest(pathlib.Path(__file__).with_name(p))
               for p in ("p62_r3_full_court.py","p62_r3_inference.py",
                         "p62_r3_machine_court.py","p62_r2.py","p62_reference.py") }}


def _connect_ro(path):
    return sqlite3.connect(pathlib.Path(path).resolve().as_uri()+"?mode=ro",uri=True)


def _init_checkpoint(db):
    db.executescript("""
        CREATE TABLE IF NOT EXISTS completed_shards(
          ordinal INTEGER PRIMARY KEY,path TEXT NOT NULL,sha256 TEXT NOT NULL,
          structures INTEGER NOT NULL,paragraphs INTEGER NOT NULL,targets INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS document_means(
          shard_ordinal INTEGER NOT NULL,document_ordinal INTEGER NOT NULL,
          strict TEXT NOT NULL,work TEXT NOT NULL,family TEXT NOT NULL,year TEXT NOT NULL,
          paragraphs INTEGER NOT NULL,targets INTEGER NOT NULL,metrics_json TEXT NOT NULL,
          PRIMARY KEY(shard_ordinal,document_ordinal));
    """)


def _scan_shard(path, lookup):
    """Process original whole-unit vectors. No transformed text is persisted."""
    counts=collections.Counter()
    rows=[]
    current=None
    forms=[]
    def flush():
        if current is None: return
        counts["structures"]+=1
        counts["paragraphs"]+=len(forms)
        record=lookup.execute(
            "select w.work,d.family,d.year from documents d join work_keys w using(lineage) where strict=?",
            (current,)).fetchone()
        if record is None:
            raise RuntimeError("Frozen P62 work-key missing from source population")
        row=analyze_structure(forms,current,*record)
        counts["targets"]+=row["targets"]
        counts["zero_target_structures"]+=row["targets"]==0
        rows.append(row)
    with gzip.open(path,"rt",encoding="utf-8") as f:
        for line in f:
            entry=json.loads(line)
            variant=entry["document_variant"]
            if variant!=current:
                flush()
                current=variant
                forms=[]
            forms.append(entry["form"])
    flush()
    return counts,rows


def _aggregate(db):
    shard_counts=db.execute(
        "select coalesce(sum(structures),0),coalesce(sum(paragraphs),0),coalesce(sum(targets),0) from completed_shards"
    ).fetchone()
    metrics=collections.defaultdict(list)
    families=collections.defaultdict(collections.Counter)
    years=collections.defaultdict(collections.Counter)
    zero=0
    for strict,work,family,year,targets,payload in db.execute(
        "select strict,work,family,year,targets,metrics_json from document_means"):
        if not targets:
            zero+=1
            continue
        totals=json.loads(payload)
        families[family]["eligible_documents"]+=1
        families[family]["targets"]+=targets
        years[year]["eligible_documents"]+=1
        years[year]["targets"]+=targets
        for name in METRICS:
            value=totals[name]
            metrics[name].append((work,strict,value/targets))
            families[family][name]+=value
            years[year][name]+=value
    overall={k:{**ref.bootstrap(v,1000),
                 "metric":"Document-equal fraction of targets; work-component clustered resampling"}
             for k,v in metrics.items()}
    return {"status":"MACHINE_PROVISIONAL","frozen_structures":shard_counts[0],
            "frozen_paragraphs":shard_counts[1],"literal_targets":shard_counts[2],
            "zero_target_structures":zero,"metrics":overall,
            "families":{k:dict(v) for k,v in sorted(families.items())},
            "years":{k:dict(v) for k,v in sorted(years.items())},
            "semantic_accuracy":None,"human_labels":0,
            "scope":"Previously machine-exposed P62 frozen JSON cohort, not independent human validation"}


def run(root,out,resume=False,max_new_shards=None):
    root=pathlib.Path(root);out=pathlib.Path(out)
    if shutil.disk_usage(root).free<60*1024**3:
        raise RuntimeError("HOLD_DISK_RESERVE_UNDER_60_GIB")
    if max_new_shards is not None and (type(max_new_shards) is not int or max_new_shards<1):
        raise ValueError("Positive shard limit required")
    lock=out/"R3_FROZEN_INPUTS.json"
    if resume:
        if not lock.exists():raise FileNotFoundError("No prior sealed run to resume")
        prior=json.loads(lock.read_text(encoding="utf-8"))
        if _seal(root)!=prior:raise RuntimeError("R3 input/code seal changed; refuse resume")
    else:
        if out.exists():raise FileExistsError("Refuse to overwrite an existing output directory")
        declaration=_seal(root)
        out.mkdir(parents=True)
        lock.write_text(json.dumps(declaration,indent=2)+"\n",encoding="utf-8")
    with contextlib.ExitStack() as stack:
        src=stack.enter_context(contextlib.closing(_connect_ro(root/"70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite")))
        p62=stack.enter_context(contextlib.closing(_connect_ro(root/"80_EXPORT/p62_referential_grounding_20261011/P62_PRIVATE.sqlite")))
        db=stack.enter_context(contextlib.closing(sqlite3.connect(out/"R3_CHECKPOINT.private.sqlite")))
        _init_checkpoint(db)
        shards=[x[0] for x in src.execute("select path from shards where kind='paragraphs' order by path")]
        new=0
        for ordinal,path in enumerate(shards):
            done=db.execute("select path,sha256 from completed_shards where ordinal=?",(ordinal,)).fetchone()
            if done:
                if done[0]!=path or ref.digest(path)!=done[1]:
                    raise RuntimeError("Committed shard changed; refuse restart")
                continue
            if max_new_shards is not None and new>=max_new_shards:break
            if shutil.disk_usage(root).free<60*1024**3:
                raise RuntimeError("HOLD_DISK_RESERVE_UNDER_60_GIB")
            shard_sha=ref.digest(path)
            counts,rows=_scan_shard(path,p62)
            with db:
                for i,row in enumerate(rows):
                    db.execute("insert into document_means values(?,?,?,?,?,?,?,?,?)",
                       (ordinal,i,row["strict"],row["work"],row["family"],row["year"],
                        row["paragraphs"],row["targets"],json.dumps(row["metrics"])))
                db.execute("insert into completed_shards values(?,?,?,?,?,?)",
                           (ordinal,path,shard_sha,counts["structures"],counts["paragraphs"],counts["targets"]))
            new+=1
            print(json.dumps({"phase":"R3_FROZEN_FULL_COHORT","committed_shard":ordinal,
                              "new_shards":new,"structures":counts["structures"],
                              "targets":counts["targets"]}),flush=True)
        completed=db.execute("select count(*) from completed_shards").fetchone()[0]
        if completed==len(shards):
            result=_aggregate(db)
            if (result["frozen_structures"],result["frozen_paragraphs"],
                result["literal_targets"])!=CENSUS:
                raise RuntimeError("Full P62 frozen-cohort census mismatch")
            result["status"]="EXECUTED_FULL_FROZEN_MACHINE_COURT"
            result["source_sha256"]=json.loads(lock.read_text(encoding="utf-8"))["source_db_sha256"]
            result["utc"]=datetime.datetime.now(datetime.timezone.utc).isoformat()
            output=out/"R3_FULL_FROZEN_MACHINE_RESULTS.json"
            output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
            receipt={"version":VERSION,"status":result["status"],
                     "result_sha256":ref.digest(output),
                     "R3_INPUT_SEAL_SHA256":ref.digest(lock),
                     "human_ground_truth":None,"source_databases_modified":False}
            (out/"R3_FINAL_SHA256_RECEIPT.json").write_text(json.dumps(receipt,indent=2)+"\n",encoding="utf-8")
        else:
            result={"status":"PARTIAL_RESUMABLE","completed_shards":completed,
                    "total_shards":len(shards),"human_labels":0}
        return result


if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--root",required=True)
    p.add_argument("--out",required=True)
    p.add_argument("--resume",action="store_true")
    p.add_argument("--max-new-shards",type=int)
    a=p.parse_args()
    result=run(a.root,a.out,a.resume,a.max_new_shards)
    print(json.dumps({"status":result["status"],
                      "literal_targets":result.get("literal_targets"),
                      "completed_shards":result.get("completed_shards")}))
