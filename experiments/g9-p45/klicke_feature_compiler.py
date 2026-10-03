#!/usr/bin/env python3
"""Compile KLiCKe auxiliary raw packages into participant-level feature rows.

Authority:
- feature-only output; no final essay text or keystroke strings are emitted;
- participant IDs remain pseudonymous join keys;
- demographics are presence-only by default (no sensitive fields exported);
- this lane is auxiliary and cannot enter G9-P45 diachronic authority.
"""
from __future__ import annotations
import argparse,csv,io,json,math,re,statistics,zipfile
from collections import Counter,defaultdict
from pathlib import Path

ID_RE=re.compile(r"(?<!\d)(\d{8})(?!\d)")
TYPING_RE=re.compile(r"(?P<id>\d{8})_TYPING(?P<task>[^.]*)\.csv$")
VOCAB_RE=re.compile(r"(?P<id>\d{8})_Vocab\.csv$")

def _f(x):
    try:return float(x)
    except (TypeError,ValueError):return None

def read_demographic_ids(path:Path)->set[str]:
    out=set()
    with path.open(encoding="utf-8-sig",newline="") as f:
        for r in csv.DictReader(f):
            x=(r.get("ID") or "").strip()
            if ID_RE.fullmatch(x):out.add(x)
    return out

def _decode_holistic(path:Path)->str:
    data=path.read_bytes()
    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError:
        # KLiCKe holistic_scores.csv is a legacy Windows-1252 export.
        # Strict fallback only: never replacement-decode source text.
        return data.decode("cp1252")

def read_holistic(path:Path):
    out={}
    with io.StringIO(_decode_holistic(path),newline="") as f:
        for r in csv.DictReader(f):
            pid=(r.get("ID") or "").strip()
            if not ID_RE.fullmatch(pid):continue
            out[pid]={
              "prompt":r.get("Prompt"),
              "holistic_score":_f(r.get("Score")),
              "final_text_length":len(r.get("Text") or "")
            }
    return out

def q(v,p):
    if not v:return None
    x=sorted(v); pos=(len(x)-1)*p; lo=math.floor(pos); hi=math.ceil(pos)
    if lo==hi:return x[lo]
    return x[lo]*(hi-pos)+x[hi]*(pos-lo)

def typing_features(path:Path):
    agg=defaultdict(lambda:{
      "tasks":set(),"events":0,"pause_ms":[],"activity":Counter(),
      "action_ms":[],"max_word_count":0
    })
    with zipfile.ZipFile(path) as z:
        for name in z.namelist():
            m=TYPING_RE.search(Path(name).name)
            if not m:continue
            pid=m.group("id"); task=m.group("task")
            a=agg[pid]; a["tasks"].add(task)
            with z.open(name) as raw:
                txt=io.TextIOWrapper(raw,encoding="utf-8-sig",errors="replace",newline="")
                for r in csv.DictReader(txt):
                    a["events"]+=1
                    pause=_f(r.get("PauseTime"))
                    if pause is not None and pause>=0:a["pause_ms"].append(pause)
                    action=_f(r.get("ActionTime"))
                    if action is not None and action>=0:a["action_ms"].append(action)
                    act=(r.get("Activity") or "UNKNOWN").strip() or "UNKNOWN"
                    a["activity"][act]+=1
                    wc=_f(r.get("WordCount"))
                    if wc is not None:a["max_word_count"]=max(a["max_word_count"],int(wc))
    out={}
    for pid,a in agg.items():
        pauses=a["pause_ms"]; acts=a["activity"]; n=a["events"]
        revise=sum(v for k,v in acts.items() if k in {"Remove/Cut","Replace","Paste"})
        out[pid]={
          "typing_task_count":len(a["tasks"]),
          "typing_event_count":n,
          "typing_pause_median_ms":q(pauses,.5),
          "typing_pause_p90_ms":q(pauses,.9),
          "typing_long_pause_ge_2000ms_rate":(
             sum(x>=2000 for x in pauses)/len(pauses) if pauses else None),
          "typing_mean_action_ms":(
             statistics.fmean(a["action_ms"]) if a["action_ms"] else None),
          "typing_input_event_rate":acts.get("Input",0)/n if n else None,
          "typing_revision_event_rate":revise/n if n else None,
          "typing_max_word_count":a["max_word_count"]
        }
    return out

def vocab_features(path:Path):
    out={}
    with zipfile.ZipFile(path) as z:
        for name in z.namelist():
            m=VOCAB_RE.search(Path(name).name)
            if not m:continue
            pid=m.group("id"); n=correct=falsepos=falseneg=0
            with z.open(name) as raw:
                txt=io.TextIOWrapper(raw,encoding="utf-8-sig",errors="replace",newline="")
                for r in csv.DictReader(txt):
                    resp=_f(r.get("Response")); key=_f(r.get("Key"))
                    if resp is None or key is None:continue
                    n+=1; correct+=int(resp==key)
                    falsepos+=int(resp==1 and key==0)
                    falseneg+=int(resp==0 and key==1)
            out[pid]={
              "vocab_items":n,
              "vocab_accuracy":correct/n if n else None,
              "vocab_false_positive_rate":falsepos/n if n else None,
              "vocab_false_negative_rate":falseneg/n if n else None
            }
    return out

def compile_rows(holistic,demographic,typing,vocab):
    ids=sorted(set(holistic)|demographic|set(typing)|set(vocab))
    for pid in ids:
        row={
          "participant_id":pid,
          "has_holistic":pid in holistic,
          "has_demographic":pid in demographic,
          "has_typing":pid in typing,
          "has_vocabulary":pid in vocab,
          "authority":"AUXILIARY_PROCESS_COVARIATE_ONLY"
        }
        row.update(holistic.get(pid,{}));row.update(typing.get(pid,{}));row.update(vocab.get(pid,{}))
        yield row

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--holistic",type=Path,required=True)
    ap.add_argument("--demographic",type=Path,required=True)
    ap.add_argument("--typing-zip",type=Path,required=True)
    ap.add_argument("--vocab-zip",type=Path,required=True)
    ap.add_argument("--output",type=Path,required=True)
    args=ap.parse_args()
    h=read_holistic(args.holistic);d=read_demographic_ids(args.demographic)
    t=typing_features(args.typing_zip);v=vocab_features(args.vocab_zip)
    rows=list(compile_rows(h,d,t,v))
    with args.output.open("w",encoding="utf-8") as f:
        for r in rows:f.write(json.dumps(r,ensure_ascii=False,sort_keys=True)+"\n")
    summary={
      "participants":len(rows),
      "holistic":sum(r["has_holistic"] for r in rows),
      "demographic":sum(r["has_demographic"] for r in rows),
      "typing":sum(r["has_typing"] for r in rows),
      "vocabulary":sum(r["has_vocabulary"] for r in rows),
      "complete_four_way":sum(r["has_holistic"] and r["has_demographic"] and r["has_typing"] and r["has_vocabulary"] for r in rows),
      "authority":"AUXILIARY_PROCESS_COVARIATE_ONLY"
    }
    print(json.dumps(summary,ensure_ascii=False,sort_keys=True))
if __name__=="__main__":main()
