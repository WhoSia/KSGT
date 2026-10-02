#!/usr/bin/env python3
"""Analyze the sealed CP4c derived topic-drift receipt only.

This program never opens a NIKL source archive. It accepts only the specific
CP4c gzip receipt, verifies its SHA-256, and writes aggregate diagnostics.
"""
from __future__ import annotations

import argparse
import collections
import gzip
import hashlib
import json
import math
import statistics
from pathlib import Path
from typing import Any, Iterable

INPUT_SHA256 = "270fd4a632d73b2836b88453762d122921c8d1f784f03d85134438b5fb31f5aa"
INPUT_DRIVE_ID = "1MXBH1QxKBXrU9QBRm8ZzelkNBVkvOV3O"
EXPECTED_PAIR_COUNT = 3225
CLASSES = ("CAUSE_RESULT", "CONTRAST", "EXPANSION", "TEMPORAL")
SUPPORT_BINS = ((1, 9, "1-9"), (10, 49, "10-49"), (50, 199, "50-199"), (200, math.inf, "200+"))


def linear_quantile(values: Iterable[float], p: float) -> float:
    xs = sorted(values)
    if not xs:
        raise ValueError("quantile requires at least one value")
    if not 0 <= p <= 1:
        raise ValueError("p must be in [0, 1]")
    pos = (len(xs) - 1) * p
    lo = int(pos)
    hi = min(lo + 1, len(xs) - 1)
    return xs[lo] + (xs[hi] - xs[lo]) * (pos - lo)


def summary(values: Iterable[float]) -> dict[str, float | int]:
    xs = list(values)
    if not xs:
        return {"n": 0}
    return {
        "n": len(xs),
        "median": statistics.median(xs),
        "p90": linear_quantile(xs, 0.90),
        "p95": linear_quantile(xs, 0.95),
        "p99": linear_quantile(xs, 0.99),
        "max": max(xs),
    }


def average_ranks(values: list[float]) -> list[float]:
    order = sorted(range(len(values)), key=values.__getitem__)
    result = [0.0] * len(values)
    i = 0
    while i < len(order):
        j = i + 1
        while j < len(order) and values[order[j]] == values[order[i]]:
            j += 1
        rank = (i + 1 + j) / 2
        for pos in order[i:j]:
            result[pos] = rank
        i = j
    return result


def pearson(xs: list[float], ys: list[float]) -> float | None:
    if len(xs) != len(ys) or len(xs) < 2:
        return None
    mx, my = statistics.mean(xs), statistics.mean(ys)
    numerator = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    denom_x = sum((x - mx) ** 2 for x in xs)
    denom_y = sum((y - my) ** 2 for y in ys)
    denom = math.sqrt(denom_x * denom_y)
    return numerator / denom if denom else None


def correlation(xs: list[float], ys: list[float]) -> dict[str, float | None]:
    return {"pearson": pearson(xs, ys), "spearman": pearson(average_ranks(xs), average_ranks(ys))}


def source_key(row: dict[str, Any]) -> tuple[Any, ...]:
    return (
        row["source_family"], row["serialization"], row["period"], row["publisher"],
        row["topic"], row["year_a"], row["year_b"],
    )


def exact_pair_key(row: dict[str, Any]) -> tuple[Any, ...]:
    return (
        row["source_family"], row["period"], row["publisher"], row["topic"],
        row["year_a"], row["year_b"],
    )


def analyze(receipt: dict[str, Any], source_sha256: str) -> dict[str, Any]:
    if receipt.get("schema") != "ksgt.g9.p45.nikl-stream-census.v1":
        raise ValueError("unexpected CP4c source schema")
    rows = receipt["topic_conditioned_drift"]["annual_adjacent_topic_pairs"]
    if len(rows) != EXPECTED_PAIR_COUNT:
        raise ValueError(f"expected {EXPECTED_PAIR_COUNT} CP4c rows, got {len(rows)}")

    strata: dict[tuple[str, str, str], list[dict[str, Any]]] = collections.defaultdict(list)
    for row in rows:
        strata[(row["source_family"], row["serialization"], row["period"])].append(row)

    stratum_results: dict[str, Any] = {}
    top_decile_rows: dict[tuple[str, str, str], set[tuple[Any, ...]]] = {}
    for stratum, group in sorted(strata.items()):
        values = [row["coarse_class_jsd"] for row in group]
        cutoff = linear_quantile(values, 0.90)
        selected = [row for row in group if row["coarse_class_jsd"] >= cutoff]
        top_decile_rows[stratum] = {source_key(row) for row in selected}
        support: dict[str, Any] = {}
        top_by_support: dict[str, int] = {}
        for low, high, label in SUPPORT_BINS:
            cells = [row for row in group if low <= min(row["documents_a"], row["documents_b"]) <= high]
            if cells:
                support[label] = summary(row["coarse_class_jsd"] for row in cells)
                top_by_support[label] = sum(
                    row["coarse_class_jsd"] >= cutoff for row in cells
                )
        classes = {
            cls: summary(row["within_class_marker_jsd"].get(cls, 0.0) for row in group)
            for cls in CLASSES
        }
        stratum_results["|".join(stratum)] = {
            "coarse_class_jsd": summary(values),
            "q90_cutoff_including_ties": cutoff,
            "upper_decile_count_including_ties": len(selected),
            "upper_decile_by_minimum_document_support": top_by_support,
            "sparse_support_sensitivity": support,
            "within_class_marker_jsd": classes,
        }

    # Recurrent means at least two upper-decile transitions within one exact
    # source-family × serialization × period stratum.
    hotspot_rows: dict[tuple[str, str, str, str, str], list[dict[str, Any]]] = collections.defaultdict(list)
    for stratum, group in strata.items():
        cutoff = linear_quantile((row["coarse_class_jsd"] for row in group), 0.90)
        for row in group:
            if row["coarse_class_jsd"] >= cutoff:
                hotspot_rows[(
                    row["source_family"], row["serialization"], row["period"],
                    row["publisher"], row["topic"],
                )].append(row)
    recurrent = []
    for key, transitions in hotspot_rows.items():
        if len(transitions) < 2:
            continue
        ordered = sorted(transitions, key=lambda row: (row["year_a"], row["year_b"]))
        recurrent.append({
            "source_family": key[0], "serialization": key[1], "period": key[2],
            "publisher": key[3], "topic": key[4],
            "upper_decile_transition_count": len(ordered),
            "observed_transition_count": sum(
                1 for row in rows
                if (row["source_family"], row["serialization"], row["period"], row["publisher"], row["topic"]) == key
            ),
            "transitions": [{
                "years": [row["year_a"], row["year_b"]],
                "coarse_class_jsd": row["coarse_class_jsd"],
                "min_documents": min(row["documents_a"], row["documents_b"]),
            } for row in ordered],
        })
    recurrent.sort(key=lambda item: (
        -item["upper_decile_transition_count"], item["source_family"], item["serialization"],
        item["period"], item["publisher"], item["topic"],
    ))

    # Exact matched CSV/JSON pair keys, no duplicate-resolution by overwrite.
    formatted: dict[str, dict[tuple[Any, ...], dict[str, Any]]] = {"CSV": {}, "JSON": {}}
    for row in rows:
        fmt = row["serialization"]
        if fmt not in formatted:
            continue
        key = exact_pair_key(row)
        if key in formatted[fmt]:
            raise ValueError(f"duplicate exact pair key for {fmt}: {key}")
        formatted[fmt][key] = row
    periods = sorted(set(row["period"] for row in rows))
    concordance = []
    for period in periods:
        crows = {key: row for key, row in formatted["CSV"].items() if key[1] == period}
        jrows = {key: row for key, row in formatted["JSON"].items() if key[1] == period}
        common = sorted(set(crows) & set(jrows))
        if not common:
            continue
        x = [crows[key]["coarse_class_jsd"] for key in common]
        y = [jrows[key]["coarse_class_jsd"] for key in common]
        ccut = linear_quantile((row["coarse_class_jsd"] for row in crows.values()), 0.90)
        jcut = linear_quantile((row["coarse_class_jsd"] for row in jrows.values()), 0.90)
        ctop = {key for key in common if crows[key]["coarse_class_jsd"] >= ccut}
        jtop = {key for key in common if jrows[key]["coarse_class_jsd"] >= jcut}
        union = ctop | jtop
        concordance.append({
            "period": period,
            "csv_pair_count": len(crows), "json_pair_count": len(jrows),
            "exact_matched_pair_count": len(common),
            "exact_value_match_count": sum(
                crows[key]["coarse_class_jsd"] == jrows[key]["coarse_class_jsd"]
                for key in common
            ),
            "correlation": correlation(x, y),
            "csv_q90_including_ties": ccut, "json_q90_including_ties": jcut,
            "tie_inclusive_upper_decile_overlap": len(ctop & jtop),
            "tie_inclusive_upper_decile_jaccard": len(ctop & jtop) / len(union) if union else None,
        })

    tail = sorted(rows, key=lambda row: (
        -row["coarse_class_jsd"], row["source_family"], row["serialization"],
        row["period"], row["publisher"], row["topic"], row["year_a"],
    ))
    top20 = [{
        "source_family": row["source_family"], "serialization": row["serialization"],
        "period": row["period"], "publisher": row["publisher"], "topic": row["topic"],
        "years": [row["year_a"], row["year_b"]],
        "coarse_class_jsd": row["coarse_class_jsd"],
        "documents": [row["documents_a"], row["documents_b"]],
    } for row in tail[:20]]

    return {
        "schema": "ksgt.g9.p45.nikl-topic-tail-audit.v1",
        "checkpoint": "G9-P45-CP4e",
        "status": "OPEN",
        "input": {
            "drive_file_id": INPUT_DRIVE_ID,
            "artifact": "g9_p45_nikl_topic_sensitivity_checkpoint4c_raw.json.gz",
            "sha256": source_sha256,
            "bytes": None,
            "source_schema": receipt["schema"],
            "topic_pair_count": len(rows),
        },
        "method": {
            "source_archives_reopened": False,
            "pooled_topic_cells": False,
            "quantile": "linearly interpolated empirical quantile; ties included at or above q90",
            "hotspot": "publisher × exact topic; at least two q90-or-higher transitions within source-family × serialization × period",
            "support_bins": ["1-9", "10-49", "50-199", "200+"],
            "global_tail": "top 1% exact rank count and top 20; inventory only, not cross-stratum authority",
        },
        "global_coarse_class_jsd": summary(row["coarse_class_jsd"] for row in rows),
        "top_one_percent_exact_rank_count": math.ceil(0.01 * len(rows)),
        "top20": top20,
        "strata": stratum_results,
        "recurrent_hotspot_count": len(recurrent),
        "recurrent_hotspots": recurrent,
        "csv_json_concordance": concordance,
        "limitations": [
            "All values are surface-marker distribution drift, not semantic mechanism or quality.",
            "Sparse support inflates the observed JSD tail; no minimum-support exclusion was applied.",
            "Publisher and exact topic do not identify authorship or eliminate editing/source confounds.",
            "The NIKL topic/source analysis is not independent replication by OKHC.",
            "The sole CP4c CSV/JSON character-count discrepancy is retained; marker counts and topic distributions remain distinct authorities.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.input.name != "g9_p45_nikl_topic_sensitivity_checkpoint4c_raw.json.gz":
        raise SystemExit("refusing non-CP4c input; source archives are never inputs to this analysis")
    h = hashlib.sha256()
    with args.input.open("rb") as stream:
        for block in iter(lambda: stream.read(8 << 20), b""):
            h.update(block)
    actual = h.hexdigest()
    if actual != INPUT_SHA256:
        raise SystemExit(f"CP4c input hash mismatch: {actual}")
    with gzip.open(args.input, "rt", encoding="utf-8") as stream:
        receipt = json.load(stream)
    out = analyze(receipt, actual)
    out["input"]["bytes"] = args.input.stat().st_size
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "PASS", "rows": out["input"]["topic_pair_count"], "output": str(args.output)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

