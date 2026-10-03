#!/usr/bin/env python3
"""Selective OKHC acquisition for G9-P45.

Default policy: acquire only the presealed minimum independent-replication set.
No full-repository clone/download is performed by this tool.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

REPO_ID="seyoungsong/Open-Korean-Historical-Corpus"
MINIMUM_NEWS_ARCHIVE=(
    "news_archive_part_001_of_003.jsonl",
    "news_archive_part_002_of_003.jsonl",
    "news_archive_part_003_of_003.jsonl",
)

def selected_files(family:str)->tuple[str,...]:
    if family=="news_archive":
        return MINIMUM_NEWS_ARCHIVE
    raise ValueError(f"unsupported selective family: {family}")

def sha256(path:Path)->str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda:f.read(8<<20),b""):
            h.update(block)
    return h.hexdigest()

def acquire(dest:Path,family:str)->dict:
    try:
        from huggingface_hub import hf_hub_download
    except ImportError as e:
        raise SystemExit("huggingface_hub is required for acquisition; install it in the execution environment") from e
    dest.mkdir(parents=True,exist_ok=True)
    rows=[]
    for filename in selected_files(family):
        local=Path(hf_hub_download(
            repo_id=REPO_ID,repo_type="dataset",filename=filename,
            local_dir=str(dest)
        ))
        rows.append({"filename":filename,"bytes":local.stat().st_size,"sha256":sha256(local)})
    return {
        "schema":"ksgt.g9.p45.okhc-selective-acquisition.v1",
        "repo_id":REPO_ID,
        "family":family,
        "files":rows,
        "full_repo_downloaded":False,
        "authority":"CUSTODY_ONLY_UNTIL_ROW_LEVEL_SOURCE_LANGUAGE_PERIOD_GATES_PASS"
    }

def main()->None:
    ap=argparse.ArgumentParser()
    ap.add_argument("--dest",type=Path)
    ap.add_argument("--family",default="news_archive")
    ap.add_argument("--manifest",type=Path)
    ap.add_argument("--dry-run",action="store_true")
    args=ap.parse_args()
    files=selected_files(args.family)
    if args.dry_run:
        print(json.dumps({"repo_id":REPO_ID,"family":args.family,"files":files,
                          "full_repo_downloaded":False},ensure_ascii=False,indent=2))
        return
    if args.dest is None or args.manifest is None:
        raise SystemExit("--dest and --manifest are required unless --dry-run")
    result=acquire(args.dest,args.family)
    args.manifest.parent.mkdir(parents=True,exist_ok=True)
    args.manifest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"status":"PASS","files":len(result["files"]),"manifest":str(args.manifest)}))

if __name__=="__main__":
    main()
