"""Index original G10 paragraph-generation records without emitting source or prose."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
from zipfile import ZipFile


# Exact cohorts in the historical '196', plus the preceding failed run.
COHORTS = {
    "RAWSOURCE001": 27,
    "CROSSFAM002": 27,
    "CROSSFAM001": 27,
    "QWEN_FAMILY_SMOKE": 5,
    "FACTORIAL002": 36,
    "FACTORIAL001": 24,
    "PILOT005": 15,
    "PILOT004": 15,
    "PILOT001": 5,
    "PILOT002": 5,
    "PILOT003": 15,
}
RAW_MEMBERS = {
    "rawsource-private-raw.json",
    "crossfamily-private-raw.json",
    "factorial-private-raw.json",
    "ksgt-groq-development.json",
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def replay_archive(archive, cohort):
    with ZipFile(archive) as zipped:
        names = [name for name in zipped.namelist() if name in RAW_MEMBERS]
        if len(names) != 1 or zipped.testzip() is not None:
            raise ValueError(f"{cohort}: missing/ambiguous raw member or CRC failure")
        raw_member = names[0]
        payload = zipped.read(raw_member)
    document = json.loads(payload)
    rows = document["rows"]
    if len(rows) != COHORTS[cohort]:
        raise ValueError(f"{cohort}: unexpected raw row count")
    indexed = []
    for row_number, row in enumerate(rows, 1):
        model = row.get("model", document.get("model"))
        provider = row.get("provider", document.get("provider"))
        prompt_hash = row.get("promptSha256")
        finish = row.get("finishReason")
        text = row.get("text")
        outcome = row["outcome"]
        if not isinstance(prompt_hash, str) or not re.fullmatch(r"[0-9a-f]{64}", prompt_hash):
            raise ValueError(f"{cohort} row {row_number}: invalid prompt hash")
        if provider != "groq" or not model or not row.get("sourceWork") or not row.get("arm"):
            raise ValueError(f"{cohort} row {row_number}: incomplete identity")
        failed_pilot = cohort == "PILOT001"
        if failed_pilot and (outcome != "FAILED" or text or row.get("failureClass") != "PROVIDER_HTTP_404"):
            raise ValueError(f"{cohort} row {row_number}: invalid failed pilot row")
        if not failed_pilot and (outcome != "GENERATED" or finish != "stop" or
                                 not isinstance(text, str) or not text.strip()):
            raise ValueError(f"{cohort} row {row_number}: missing completed prose")
        indexed.append({
            "row": row_number,
            "work_label": row["sourceWork"],
            "model": model,
            "arm": row["arm"],
            "prompt_sha256": prompt_hash,
            "text_sha256": digest(text.encode("utf-8")) if text else None,
            "paragraphs_by_blank_line": len(re.split(r"\n\s*\n", text.strip())) if text else None,
            "outcome": outcome,
            "finish_reason": finish,
            "failure_class": row.get("failureClass"),
        })
    return {
        "cohort": cohort,
        "archive": archive.name,
        "archive_bytes": archive.stat().st_size,
        "archive_sha256": digest(archive.read_bytes()),
        "raw_member": raw_member,
        "raw_member_sha256": digest(payload),
        "rows": indexed,
    }


def key_pair(row):
    return row["work_label"], row["model"], row["arm"]


def paired_crossfamily(archives):
    left, right = [next(a["rows"] for a in archives if a["cohort"] == key)
                   for key in ("CROSSFAM001", "CROSSFAM002")]
    earlier, later = [{key_pair(r): r for r in rows} for rows in (left, right)]
    if earlier.keys() != later.keys() or len(earlier) != len(left) or len(later) != len(right):
        raise ValueError("cross-family arms cannot be paired uniquely")
    matched = [(row, later[key]) for key, row in earlier.items()
               if row["prompt_sha256"] == later[key]["prompt_sha256"]]
    return {
        "paired_cells": len(earlier),
        "same_prompt_sha256": len(matched),
        "same_text_sha256_among_same_prompt": sum(a["text_sha256"] == b["text_sha256"] for a, b in matched),
    }


def replay(directory):
    archives = []
    files = sorted(directory.glob("*.zip"))
    for cohort in COHORTS:
        matches = [file for file in files if f"_{cohort}_" in file.name]
        if len(matches) != 1:
            raise ValueError(f"{cohort}: expected one named archive, got {len(matches)}")
        archives.append(replay_archive(matches[0], cohort))
    rows = [row for a in archives for row in a["rows"]]
    generated = [r for r in rows if r["outcome"] == "GENERATED"]
    return {
        "schema": "ksgt.r925.historical-paragraph-lineage.v1",
        "counts": {
            "archives": len(archives),
            "logged_rows": len(rows),
            "completed_output_occurrences": len(generated),
            "failed_attempt_rows": len(rows) - len(generated),
            "distinct_work_labels": dict(Counter(r["work_label"] for r in generated)),
            "by_model": dict(Counter(r["model"] for r in generated)),
            "distinct_exact_output_strings": len({r["text_sha256"] for r in generated}),
            "distinct_recorded_prompt_hashes": len({r["prompt_sha256"] for r in generated}),
            "distinct_model_prompt_pairs": len({(r["model"], r["prompt_sha256"]) for r in generated}),
            "paragraphs_by_blank_line": dict(Counter(r["paragraphs_by_blank_line"] for r in generated)),
            "crossfamily_repeat": paired_crossfamily(archives),
        },
        "archives": archives,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    print(json.dumps(replay(args.directory), ensure_ascii=False, indent=2))
