#!/usr/bin/env python3
"""Local-first custody + streaming census for very large OKHC raw holdings.

Purpose:
- keep large raw bytes local unless a deliberate mirror decision is made;
- produce a reproducible manifest (size, SHA-256, extension, relative path);
- optionally sample JSONL structure without persisting text;
- never copy raw content to GitHub/Drive.

Supports a single file or a directory tree. Plain JSONL/JSONL.GZ are sampled.
ZIP members are inventoried and JSONL members can be sampled streaming.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import io
import json
import os
import zipfile
from pathlib import Path
from typing import Iterable, Iterator, BinaryIO, TextIO

CHUNK = 8 << 20

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            b = f.read(CHUNK)
            if not b:
                break
            h.update(b)
    return h.hexdigest()

def iter_files(root: Path) -> Iterable[Path]:
    if root.is_file():
        yield root
        return
    for p in sorted(root.rglob("*")):
        if p.is_file():
            yield p

def rel(root: Path, p: Path) -> str:
    if root.is_file():
        return p.name
    return p.relative_to(root).as_posix()

def sample_jsonl_text(f: TextIO, limit: int) -> dict:
    rows = 0
    keys = set()
    years = set()
    corpora = set()
    sources = set()
    copyrights = set()
    malformed = 0
    for line in f:
        if rows >= limit:
            break
        if not line.strip():
            continue
        try:
            obj = json.loads(line)
        except Exception:
            malformed += 1
            continue
        if not isinstance(obj, dict):
            malformed += 1
            continue
        rows += 1
        keys.update(obj.keys())
        y = obj.get("year")
        if isinstance(y, (int, str)):
            years.add(str(y))
        for field, target in (("corpus",corpora),("source",sources),("copyright",copyrights)):
            v = obj.get(field)
            if isinstance(v, str) and v:
                target.add(v)
    return {
        "sample_rows": rows,
        "malformed_sample_rows": malformed,
        "observed_keys": sorted(keys),
        "sample_years": sorted(years)[:50],
        "sample_corpora": sorted(corpora)[:50],
        "sample_sources": sorted(sources)[:50],
        "sample_copyrights": sorted(copyrights)[:50],
    }

def probe_plain(path: Path, limit: int) -> dict | None:
    name = path.name.lower()
    if name.endswith(".jsonl"):
        with path.open("r", encoding="utf-8-sig", errors="strict") as f:
            return sample_jsonl_text(f, limit)
    if name.endswith(".jsonl.gz") or name.endswith(".json.gz"):
        with gzip.open(path, "rt", encoding="utf-8-sig", errors="strict") as f:
            return sample_jsonl_text(f, limit)
    return None

def probe_zip(path: Path, limit: int) -> dict | None:
    if path.suffix.lower() != ".zip":
        return None
    members = []
    samples = []
    with zipfile.ZipFile(path) as z:
        for info in z.infolist():
            if info.is_dir():
                continue
            members.append({
                "name_hash": hashlib.sha256(info.filename.encode("utf-8","replace")).hexdigest()[:16],
                "uncompressed_bytes": info.file_size,
                "compressed_bytes": info.compress_size,
                "suffix": Path(info.filename).suffix.lower(),
            })
            low = info.filename.lower()
            if len(samples) < 3 and low.endswith(".jsonl"):
                with z.open(info) as raw:
                    txt = io.TextIOWrapper(raw, encoding="utf-8-sig", errors="strict")
                    samples.append({
                        "member_name_hash": members[-1]["name_hash"],
                        **sample_jsonl_text(txt, limit)
                    })
    return {
        "zip_member_count": len(members),
        "zip_members": members,
        "jsonl_member_samples": samples,
    }

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("root", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--sample-rows", type=int, default=5)
    ap.add_argument("--skip-hash", action="store_true",
                    help="Use only for exploratory census; full custody requires SHA-256.")
    args = ap.parse_args()

    root = args.root.resolve()
    if not root.exists():
        raise SystemExit("INPUT_NOT_FOUND")

    files = []
    total = 0
    for p in iter_files(root):
        st = p.stat()
        total += st.st_size
        rec = {
            "relative_path": rel(root,p),
            "bytes": st.st_size,
            "suffix": "".join(p.suffixes[-2:]).lower() if len(p.suffixes) >= 2 else p.suffix.lower(),
            "sha256": None if args.skip_hash else sha256_file(p),
        }
        probe = probe_plain(p,args.sample_rows)
        if probe is None:
            probe = probe_zip(p,args.sample_rows)
        if probe is not None:
            rec["probe"] = probe
        files.append(rec)

    result = {
        "schema":"ksgt.g9.p45.local-raw-custody.v1",
        "root_kind":"file" if root.is_file() else "directory",
        "file_count":len(files),
        "total_bytes":total,
        "full_sha256_complete":not args.skip_hash,
        "files":files,
        "authority_rules":[
            "LOCAL_RAW_AVAILABILITY != VERIFIED_CUSTODY",
            "FULL_SHA256_REQUIRED_FOR_CANONICAL_RAW_CUSTODY",
            "RAW_TEXT_NOT_PERSISTED_IN_MANIFEST",
            "FILENAME != SOURCE_CONTRACT",
            "DATE != PROVENANCE",
        ],
    }
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2,sort_keys=True)+"\n",encoding="utf-8")

if __name__ == "__main__":
    main()
