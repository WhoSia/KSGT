#!/usr/bin/env python3
"""CP5 aggregate diagnostics from the immutable CP4c derived receipt only."""
from __future__ import annotations

import argparse
import collections
import gzip
import hashlib
import json
import math
import statistics
from pathlib import Path
from typing import Any

from nikl_stream_audit import EDF, jsd

INPUT_SHA256 = "270fd4a632d73b2836b88453762d122921c8d1f784f03d85134438b5fb31f5aa"
INPUT_NAME = "g9_p45_nikl_topic_sensitivity_checkpoint4c_raw.json.gz"
CLASSES = tuple(EDF)
SUPPORT_BINS = ((1, 9, "1-9"), (10, 49, "10-49"), (50, 199, "50-199"), (200, math.inf, "200+"))


def q(values: list[float], p: float) -> float | None:
    if not values:
        return None
    x = sorted(values)
    i = (len(x) - 1) * p
    lo = int(i)
    hi = min(lo + 1, len(x) - 1)
    return x[lo] + (x[hi] - x[lo]) * (i - lo)


def summ(values: list[float]) -> dict[str, Any]:
    if not values:
        return {"n": 0}
    return {"n": len(values), "median": statistics.median(values), "p90": q(values, .90),
            "p95": q(values, .95), "p99": q(values, .99), "max": max(values)}


def corr(x: list[float], y: list[float]) -> float | None:
    if len(x) < 2 or len(x) != len(y):
        return None
    mx, my = statistics.mean(x), statistics.mean(y)
    xx = sum((a - mx) ** 2 for a in x)
    yy = sum((b - my) ** 2 for b in y)
    return sum((a - mx) * (b - my) for a, b in zip(x, y)) / math.sqrt(xx * yy) if xx and yy else None


def dist(counts: dict[str, int]) -> list[int]:
    return [counts.get(c, 0) for c in CLASSES]


def class_totals(cells: dict[tuple[str, str], dict[str, Any]]) -> dict[str, int]:
    return {c: sum(v["edf"].get(c, 0) for v in cells.values()) for c in CLASSES}


def marker_jsd(a: dict[str, Any], b: dict[str, Any]) -> dict[str, float]:
    return {c: jsd([a["markers"].get(c, {}).get(m, 0) for m in EDF[c]],
                   [b["markers"].get(c, {}).get(m, 0) for m in EDF[c]]) for c in CLASSES}


def shannon(prob: dict[Any, float]) -> float:
    return -sum(v * math.log(v, 2) for v in prob.values() if v > 0)


def shapley_decompose(a: dict[tuple[str, str], dict[str, Any]],
                      b: dict[tuple[str, str], dict[str, Any]]) -> dict[str, Any]:
    """Symmetric two-factor Kitagawa decomposition on common support.

    Factors are the joint publisher×topic cell composition and within-cell class
    mix. Unmatched documents are reported separately and excluded from the
    decomposition identity.
    """
    common = sorted(set(a) & set(b))
    da, db = sum(v["documents"] for v in a.values()), sum(v["documents"] for v in b.values())
    ca = {k: a[k]["documents"] for k in common}
    cb = {k: b[k]["documents"] for k in common}
    ma, mb = sum(ca.values()), sum(cb.values())
    if not common or not ma or not mb:
        return {"matched_cells": len(common), "status": "NO_COMMON_PUBLISHER_TOPIC_SUPPORT"}

    wa = {k: n / ma for k, n in ca.items()}
    wb = {k: n / mb for k, n in cb.items()}
    pa, pb = {}, {}
    for c in CLASSES:
        pa[c], pb[c] = {}, {}
        for key in common:
            na, nb = sum(a[key]["edf"].values()), sum(b[key]["edf"].values())
            pa[c][key] = a[key]["edf"].get(c, 0) / na if na else 0.0
            pb[c][key] = b[key]["edf"].get(c, 0) / nb if nb else 0.0
    effects_by_class: dict[str, dict[str, float]] = {}
    for c in CLASSES:
        within = sum(((wa[k] + wb[k]) / 2) * (pb[c][k] - pa[c][k]) for k in common)
        composition = sum(((pa[c][k] + pb[c][k]) / 2) * (wb[k] - wa[k]) for k in common)
        start = sum(wa[k] * pa[c][k] for k in common)
        end = sum(wb[k] * pb[c][k] for k in common)
        effects_by_class[c] = {"publisher_topic_composition": composition,
                               "within_cell_class_mix": within,
                               "common_support_delta": end - start,
                               "identity_residual": composition + within - (end - start)}
    return {
        "status": "COMMON_SUPPORT_SHAPLEY",
        "matched_cells": len(common),
        "document_coverage_a": ma / da if da else None,
        "document_coverage_b": mb / db if db else None,
        "unmatched_documents_a": da - ma,
        "unmatched_documents_b": db - mb,
        "decomposition_factors": ["joint_publisher_topic_composition", "within_cell_class_mix"],
        "per_class_common_support_shapley_effects": effects_by_class,
        "identity_scope": "factor effects are class-specific; aggregate class-share movement is not a quality measure",
        "all_cell_document_counts": [da, db],
        "common_support_document_counts": [ma, mb],
    }


def analyze(receipt: dict[str, Any]) -> dict[str, Any]:
    if receipt.get("schema") != "ksgt.g9.p45.nikl-stream-census.v1":
        raise ValueError("unexpected CP4c schema")
    files = receipt["files"]
    # Aggregate from the already-derived publisher/topic/year sufficient counters.
    yearly: dict[tuple[str, str, str, int], dict[tuple[str, str], dict[str, Any]]] = collections.defaultdict(dict)
    archive_at: dict[tuple[str, str, str, int], set[str]] = collections.defaultdict(set)
    for f in files:
        family, fmt, archive = f["source_family"], f["serialization"], f["name"]
        for key, g in f["groups"].items():
            period, year_s, pub = key.split("|", 2)
            try:
                year = int(year_s)
            except ValueError:
                continue
            archive_at[(family, fmt, period, year)].add(archive)
            for tf in g.get("topic_features", []):
                topic = tf.get("topic") or ""
                yearly[(family, fmt, period, year)][(pub, topic)] = {
                    "documents": tf.get("documents", 0), "text_units": tf.get("text_units", 0),
                    "characters": tf.get("characters", 0), "edf": tf.get("edf", {}), "markers": tf.get("markers", {})}

    # Recreate adjacent transitions from the existing sufficient aggregate and verify CP4c parity.
    recomputed = {}
    series: dict[tuple[str, str, str, str, str], dict[int, dict[str, Any]]] = collections.defaultdict(dict)
    for (family, fmt, period, year), cells in yearly.items():
        if len(archive_at[(family, fmt, period, year)]) != 1:
            continue
        for (pub, topic), cell in cells.items():
            series[(family, fmt, period, pub, topic)][year] = cell
    horizons: dict[int, list[dict[str, Any]]] = {1: [], 2: [], 3: []}
    for (family, fmt, period, pub, topic), years in series.items():
        for h in horizons:
            for ya in sorted(years):
                yb = ya + h
                if yb not in years:
                    continue
                a, b = years[ya], years[yb]
                coarse = jsd(dist(a["edf"]), dist(b["edf"]))
                within = marker_jsd(a, b)
                horizons[h].append({"family": family, "format": fmt, "period": period, "publisher": pub,
                                    "topic": topic, "year_a": ya, "year_b": yb, "lag": h,
                                    "documents_a": a["documents"], "documents_b": b["documents"],
                                    "coarse_jsd": coarse, "within_class_marker_jsd": within,
                                    "mean_within_class_marker_jsd": statistics.mean(within.values())})

    original = receipt["topic_conditioned_drift"]["annual_adjacent_topic_pairs"]
    orig_by = {(r["source_family"], r["serialization"], r["period"], r["publisher"], r["topic"], r["year_a"], r["year_b"]): r for r in original}
    rec1 = {(r["family"], r["format"], r["period"], r["publisher"], r["topic"], r["year_a"], r["year_b"]): r for r in horizons[1]}
    common = set(orig_by) & set(rec1)
    parity = {"cp4c_pair_count": len(orig_by), "recomputed_adjacent_pair_count": len(rec1),
              "matched_pair_count": len(common),
              "exact_coarse_jsd_matches": sum(orig_by[k]["coarse_class_jsd"] == rec1[k]["coarse_jsd"] for k in common)}

    support = {}
    for h, rows in horizons.items():
        q90_selected: set[tuple] = set()
        q90_strata = collections.defaultdict(list)
        for r in rows:
            q90_strata[(r["family"], r["format"], r["period"])].append(r)
        for sk, group in q90_strata.items():
            cutoff = q([r["coarse_jsd"] for r in group], .90)
            q90_selected.update((r["family"], r["format"], r["period"], r["publisher"], r["topic"], r["year_a"], r["year_b"])
                                for r in group if cutoff is not None and r["coarse_jsd"] >= cutoff)
        bins = {}
        for lo, hi, label in SUPPORT_BINS:
            rs = [r for r in rows if lo <= min(r["documents_a"], r["documents_b"]) <= hi]
            bins[label] = {"n": len(rs), "coarse_jsd": summ([r["coarse_jsd"] for r in rs]),
                           "mean_within_class_marker_jsd": summ([r["mean_within_class_marker_jsd"] for r in rs]),
                           "tie_inclusive_stratum_q90_count": sum((r["family"], r["format"], r["period"], r["publisher"], r["topic"], r["year_a"], r["year_b"]) in q90_selected for r in rs)}
        support[str(h)] = bins

    # Reuse the CP4e q90 rule, freshly computed within exact stratum for each horizon.
    hotspot_counts = collections.Counter()
    horizon_summaries = {}
    for h, rows in horizons.items():
        strata = collections.defaultdict(list)
        for r in rows:
            strata[(r["family"], r["format"], r["period"])].append(r)
        selected = []
        for sk, group in strata.items():
            cutoff = q([r["coarse_jsd"] for r in group], .90)
            for r in group:
                if cutoff is not None and r["coarse_jsd"] >= cutoff:
                    selected.append(r)
                    if h == 1:
                        hotspot_counts[(r["family"], r["format"], r["period"], r["publisher"], r["topic"])] += 1
        horizon_summaries[str(h)] = {"pair_count": len(rows), "coarse_jsd": summ([r["coarse_jsd"] for r in rows]),
                                     "within_class_marker_mean_jsd": summ([r["mean_within_class_marker_jsd"] for r in rows]),
                                     "tie_inclusive_q90_hotspot_transition_count": len(selected)}
    recurrent = sum(n >= 2 for n in hotspot_counts.values())

    # Two-factor publisher×topic cell decomposition with common-support Shapley splits.
    comp_rows = []
    strata_years: dict[tuple[str, str, str], set[int]] = collections.defaultdict(set)
    for family, fmt, period, year in yearly:
        if len(archive_at[(family, fmt, period, year)]) == 1:
            strata_years[(family, fmt, period)].add(year)
    for (family, fmt, period), ys in strata_years.items():
        for ya in sorted(ys):
            if ya + 1 in ys:
                a, b = yearly[(family, fmt, period, ya)], yearly[(family, fmt, period, ya + 1)]
                comp_rows.append({"source_family": family, "serialization": fmt, "period": period,
                                  "years": [ya, ya + 1], "overall_coarse_jsd": jsd(dist(class_totals(a)), dist(class_totals(b))),
                                  **shapley_decompose(a, b)})

    paired = [r for r in horizons[1] if r["lag"] == 1]
    coarse = [r["coarse_jsd"] for r in paired]
    within = [r["mean_within_class_marker_jsd"] for r in paired]
    diffs = [b - a for a, b in zip(coarse, within)]
    paired_result = {"matched_cells": len(paired), "coarse_class_jsd": summ(coarse),
                     "mean_conditional_within_class_marker_jsd": summ(within),
                     "within_marker_minus_coarse_jsd": summ(diffs), "pearson": corr(coarse, within),
                     "coarse_greater_count": sum(a > b for a, b in zip(coarse, within)),
                     "within_marker_greater_count": sum(b > a for a, b in zip(coarse, within)),
                     "ties": sum(a == b for a, b in zip(coarse, within))}
    return {
        "schema": "ksgt.g9.p45.nikl-cp5-derived-diagnostics.v1", "checkpoint": "G9-P45-CP5A",
        "status": "OPEN", "input": {"artifact": INPUT_NAME, "sha256": INPUT_SHA256,
                                         "drive_file_id": "1MXBH1QxKBXrU9QBRm8ZzelkNBVkvOV3O",
                                         "source_zip_reopened": False, "archive_count_in_cp4c": len(files)},
        "cp4c_reconstruction_parity": parity,
        "support_size_sensitivity_by_horizon": support,
        "multi_horizon": horizon_summaries,
        "persistent_publisher_topic_hotspots": {"q90_rule": "tie-inclusive within exact family×serialization×period and horizon",
                                                "lag1_recurrent_keys_ge2": recurrent,
                                                "lag1_total_hotspot_keys": len(hotspot_counts)},
        "composition_decomposition": {"method": "common-support symmetric two-factor Kitagawa decomposition; joint publisher×topic composition versus within-cell class mix",
                                       "matched_annual_comparisons": len(comp_rows), "comparisons": comp_rows},
        "paired_coarse_vs_within_class_marker_drift": paired_result,
        "limitations": ["Derived aggregate receipt does not support document-level bootstrap, document balancing, or leave-document influence.",
                        "Publisher and source topic are metadata, not authorship or semantic gold labels.",
                        "NIKL CSV/JSON format concordance is not independent-source replication.",
                        "All EDF values are frozen substring counts on RAW source representations; no normalized text was available.",
                        "P45 scientific mechanism-persistence adjudication remains open."]}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    args = ap.parse_args()
    if args.input.name != INPUT_NAME:
        raise SystemExit("CP5A accepts only the already-derived CP4c gzip receipt")
    h = hashlib.sha256()
    with args.input.open("rb") as f:
        for block in iter(lambda: f.read(8 << 20), b""):
            h.update(block)
    if h.hexdigest() != INPUT_SHA256:
        raise SystemExit("CP4c gzip hash mismatch")
    with gzip.open(args.input, "rt", encoding="utf-8") as f:
        data = json.load(f)
    result = analyze(data)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "PASS", "pairs": result["cp4c_reconstruction_parity"], "output": str(args.output)}))


if __name__ == "__main__":
    main()

