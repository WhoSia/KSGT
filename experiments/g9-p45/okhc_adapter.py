#!/usr/bin/env python3
"""KSGT G9-P45 streaming adapter for diachronic JSONL corpora.

Design:
- never infer provenance from date alone;
- preserve PERIOD x GENRE x REGISTER x PROVENANCE separation;
- default to feature-only output (no raw text);
- admit corpus-specific provenance/register mappings only through a source contract.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any, Iterable

EDF = {
    "CONTRAST": ["그러나","그런데","하지만","그렇지만","반면","오히려","도리어","그럼에도","비록"],
    "CAUSE_RESULT": ["그래서","그러므로","따라서","때문에","그러자","그리하여","결국","그러니","그러면","이에"],
    "TEMPORAL": ["그때","이때","먼저","뒤에","후에","마침내","이윽고","곧","동안","한동안"],
    "EXPANSION": ["그리고","또한","또","게다가","더구나","즉","이를테면","예컨대","다시 말해"],
}

PERIODS = [
    (1930, 1939, "PREWAR_1930S"),
    (1945, 1959, "POSTLIB_1945_1959"),
    (1960, 1979, "INDUSTRIAL_1960_1979"),
    (1980, 1999, "LATE20C_1980_1999"),
    (2000, 2008, "EARLY_DIGITAL_2000_2008"),
    (2009, 2018, "NEWS_2009_2018"),
    (2019, 2019, "NEWS_2019"),
    (2020, 2022, "PRE_CHATGPT_2020_2022_11_29"),
    (2023, 2023, "TRANSITION_2022_11_30_2023"),
    (2024, 9999, "POST_2024_MIXED_PROVENANCE"),
]

DEFAULT_SOURCE_CONTRACT = {
    "Korean Newspaper Archive": {
        "genre": "news",
        "register": "institutional_editorial",
        "provenance_pre_chatgpt": "INSTITUTIONAL_EDITORIAL_PRE_CHATGPT",
        "provenance_post_2022": "UNKNOWN",
    }
}

def period_bin(year: int | None) -> str:
    if year is None:
        return "UNKNOWN_PERIOD"
    if year < 1930:
        return "OUT_OF_SCOPE_PRE1930"
    if 1940 <= year <= 1944:
        return "WARTIME_1940_1944_UNMODELED"
    for lo, hi, name in PERIODS:
        if lo <= year <= hi:
            return name
    return "UNKNOWN_PERIOD"

def load_contract(path: str | None) -> dict[str, Any]:
    if not path:
        return DEFAULT_SOURCE_CONTRACT
    return json.loads(Path(path).read_text(encoding="utf-8"))

def classify_source(row: dict[str, Any], contract: dict[str, Any]) -> dict[str, str]:
    corpus = str(row.get("corpus") or "")
    year = row.get("year")
    spec = contract.get(corpus, {})
    genre = spec.get("genre", "UNKNOWN")
    register = spec.get("register", "UNKNOWN")
    if isinstance(year, int) and year <= 2022:
        provenance = spec.get("provenance_pre_chatgpt", "UNKNOWN")
    else:
        provenance = spec.get("provenance_post_2022", "UNKNOWN")
    return {"genre": genre, "register": register, "provenance": provenance}

def get_text(row: dict[str, Any]) -> str:
    text = row.get("text")
    if isinstance(text, str) and text:
        return text
    content = row.get("content")
    if isinstance(content, dict):
        body = content.get("body")
        if isinstance(body, str):
            return body
    return ""

def edf_counts(text: str) -> dict[str, int]:
    return {cls: sum(text.count(marker) for marker in markers) for cls, markers in EDF.items()}

def feature_row(row: dict[str, Any], contract: dict[str, Any]) -> dict[str, Any]:
    year = row.get("year")
    if not isinstance(year, int):
        try:
            year = int(year)
        except (TypeError, ValueError):
            year = None
    source_state = classify_source({**row, "year": year}, contract)
    text = get_text(row)
    return {
        "id": row.get("id"),
        "year": year,
        "period": period_bin(year),
        "language": row.get("language"),
        "script": row.get("script"),
        "source": row.get("source"),
        "corpus": row.get("corpus"),
        "copyright": row.get("copyright"),
        "url": row.get("url"),
        **source_state,
        "text_length": len(text),
        "edf": edf_counts(text),
    }

def iter_jsonl(path: Path) -> Iterable[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as e:
                raise ValueError(f"{path}:{line_no}: invalid JSON") from e
            if not isinstance(row, dict):
                raise ValueError(f"{path}:{line_no}: row must be an object")
            yield row

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("--source-contract")
    ap.add_argument("--output", type=Path)
    args = ap.parse_args()

    contract = load_contract(args.source_contract)
    out = args.output.open("w", encoding="utf-8") if args.output else None
    summary = Counter()
    try:
        for row in iter_jsonl(args.input):
            feat = feature_row(row, contract)
            summary[feat["period"]] += 1
            line = json.dumps(feat, ensure_ascii=False, sort_keys=True)
            if out:
                out.write(line + "\n")
            else:
                print(line)
    finally:
        if out:
            out.close()

    print(json.dumps({"rows": sum(summary.values()), "period_counts": dict(summary)},
                     ensure_ascii=False, sort_keys=True), file=__import__("sys").stderr)

if __name__ == "__main__":
    main()
