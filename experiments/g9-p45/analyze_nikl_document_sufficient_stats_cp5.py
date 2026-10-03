#!/usr/bin/env python3
"""Document-bootstrap and influence court over the CP5 feature-only table."""
from __future__ import annotations

import argparse
import collections
import gzip
import hashlib
import json
import math
import sqlite3
import statistics
import tempfile
from pathlib import Path
from typing import Any

import numpy as np
from nikl_stream_audit import EDF, jsd, sha256

CLASSES = tuple(EDF)
CLASS_COLS = [f"c{i}" for i in range(len(CLASSES))]
SEED = 451003
REPLICATES = 1000


def q(values: list[float], p: float) -> float | None:
    if not values:
        return None
    x = sorted(values)
    i = (len(x) - 1) * p
    lo = int(i)
    hi = min(lo + 1, len(x) - 1)
    return x[lo] + (x[hi] - x[lo]) * (i - lo)


def qsummary(xs: list[float]) -> dict[str, Any]:
    if not xs:
        return {"n": 0}
    return {"n": len(xs), "median": statistics.median(xs), "p90": q(xs, .90),
            "p99": q(xs, .99), "p999": q(xs, .999), "max": max(xs)}


def normalized_rows(rows: list[tuple[int, ...]]) -> np.ndarray:
    x = np.asarray(rows, dtype=np.float64)
    sums = x.sum(axis=1, keepdims=True)
    return np.divide(x, sums, out=np.zeros_like(x), where=sums > 0)


def jsd_np(a: np.ndarray, b: np.ndarray) -> float:
    return float(jsd(a.tolist(), b.tolist()))


def pattern_bank(props: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    return np.unique(props, axis=0, return_counts=True)


def bootstrap_group(rng: np.random.Generator, bank: tuple[np.ndarray, np.ndarray], n_draw: int) -> np.ndarray:
    uniq, counts = bank
    sampled = rng.multinomial(n_draw, counts / counts.sum())
    return sampled @ uniq / n_draw


def ingest_table(path: Path, conn: sqlite3.Connection) -> tuple[int, str]:
    conn.execute("CREATE TABLE docs (doc_hash TEXT PRIMARY KEY, family TEXT, fmt TEXT, representation TEXT, period TEXT, year INTEGER, source_hash TEXT, publisher_hash TEXT, topic TEXT, chars INTEGER, units INTEGER, c0 INTEGER, c1 INTEGER, c2 INTEGER, c3 INTEGER, total_markers INTEGER)")
    insert = "INSERT INTO docs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    batch = []
    count = 0
    with gzip.open(path, "rt", encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            cc = row["class_counts"]
            counts = [int(cc.get(c, 0)) for c in CLASSES]
            batch.append((row["doc_hash"], row["source_family"], row["serialization"], row["representation"],
                          row["period"], row["year"], row["source_hash"], row["publisher_hash"], row["topic"],
                          row["characters"], row["text_units"], *counts, sum(counts)))
            if len(batch) >= 20000:
                conn.executemany(insert, batch)
                conn.commit()
                count += len(batch)
                batch.clear()
        if batch:
            conn.executemany(insert, batch)
            conn.commit()
            count += len(batch)
    return count, sha256(path)


def fetch_cell(conn: sqlite3.Connection, key: tuple[Any, ...], year: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    fam, fmt, period, pub, topic = key
    rows = conn.execute(
        "SELECT c0,c1,c2,c3,chars,total_markers FROM docs WHERE family=? AND fmt=? AND representation='RAW' AND period=? AND year=? AND publisher_hash=? AND topic IS ? ORDER BY doc_hash",
        (fam, fmt, period, year, pub, topic)).fetchall()
    classes = np.asarray([r[:4] for r in rows], dtype=np.float64)
    chars = np.asarray([r[4] for r in rows], dtype=np.float64)
    totals = np.asarray([r[5] for r in rows], dtype=np.float64)
    return classes, chars, totals


def paired_analysis(conn: sqlite3.Connection) -> dict[str, Any]:
    rng = np.random.default_rng(SEED)
    strata_years = conn.execute("SELECT DISTINCT family,fmt,period,year FROM docs WHERE representation='RAW' AND year IS NOT NULL ORDER BY family,fmt,period,year").fetchall()
    yearsets: dict[tuple[str, str, str], set[int]] = collections.defaultdict(set)
    for fam, fmt, period, year in strata_years:
        yearsets[(fam, fmt, period)].add(year)
    results = []
    for (fam, fmt, period), ys in sorted(yearsets.items()):
        for h in (1, 2, 3):
            for ya in sorted(ys):
                yb = ya + h
                if yb not in ys:
                    continue
                groups = {}
                for year in (ya, yb):
                    groups[year] = {(pub, topic): n for pub, topic, n in conn.execute(
                        "SELECT publisher_hash,topic,COUNT(*) FROM docs WHERE family=? AND fmt=? AND representation='RAW' AND period=? AND year=? GROUP BY publisher_hash,topic",
                        (fam, fmt, period, year)).fetchall()}
                keys = sorted(set(groups[ya]) & set(groups[yb]), key=lambda x: (x[0], x[1] or ""))
                if not keys:
                    results.append({"source_family": fam, "serialization": fmt, "period": period,
                                    "years": [ya, yb], "lag": h, "matched_cells": 0,
                                    "status": "NO_MATCHED_PUBLISHER_TOPIC_CELLS"})
                    continue
                cell_data = []
                for key in keys:
                    aa, _, _ = fetch_cell(conn, (fam, fmt, period, key[0], key[1]), ya)
                    bb, _, _ = fetch_cell(conn, (fam, fmt, period, key[0], key[1]), yb)
                    if not len(aa) or not len(bb):
                        continue
                    pa, pb = normalized_rows(aa), normalized_rows(bb)
                    cell_data.append((key, pa, pb, min(len(pa), len(pb)), pattern_bank(pa), pattern_bank(pb)))
                if not cell_data:
                    continue
                balanced_a = np.mean([x[1].mean(axis=0) for x in cell_data], axis=0)
                balanced_b = np.mean([x[2].mean(axis=0) for x in cell_data], axis=0)
                observed_jsd = jsd_np(balanced_a, balanced_b)
                b_jsd = np.empty(REPLICATES, dtype=np.float64)
                b_diff = np.empty((REPLICATES, len(CLASSES)), dtype=np.float64)
                for rep in range(REPLICATES):
                    draw_a, draw_b = [], []
                    for _, pa, pb, n, bank_a, bank_b in cell_data:
                        draw_a.append(bootstrap_group(rng, bank_a, n))
                        draw_b.append(bootstrap_group(rng, bank_b, n))
                    va, vb = np.mean(draw_a, axis=0), np.mean(draw_b, axis=0)
                    b_jsd[rep] = jsd_np(va, vb)
                    b_diff[rep] = vb - va
                publishers = sorted({key[0] for key, *_ in cell_data})
                topics = sorted({key[1] for key, *_ in cell_data if key[1] is not None})
                leave_pub, leave_topic = [], []
                for label, held, dest in (("publisher", publishers, leave_pub), ("topic", topics, leave_topic)):
                    for value in held:
                        subset = [x for x in cell_data if x[0][0 if label == "publisher" else 1] != value]
                        if len(subset) < 1:
                            continue
                        a0 = np.mean([x[1].mean(axis=0) for x in subset], axis=0)
                        b0 = np.mean([x[2].mean(axis=0) for x in subset], axis=0)
                        dest.append({"held_out_hash" if label == "publisher" else "held_out_topic": value,
                                     "matched_cells": len(subset), "balanced_jsd": jsd_np(a0, b0)})
                def influence_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
                    if not rows:
                        return {"n": 0}
                    deltas = [abs(r["balanced_jsd"] - observed_jsd) for r in rows]
                    maxrow = max(rows, key=lambda r: abs(r["balanced_jsd"] - observed_jsd))
                    return {"n": len(rows), "abs_delta_jsd": qsummary(deltas), "max_influence": maxrow}
                results.append({
                    "source_family": fam, "serialization": fmt, "representation": "RAW", "period": period,
                    "years": [ya, yb], "lag": h, "matched_cells": len(cell_data),
                    "matched_documents_by_side": [sum(groups[ya][k] for k in groups[ya] if k in {x[0] for x in cell_data}),
                                                   sum(groups[yb][k] for k in groups[yb] if k in {x[0] for x in cell_data})],
                    "balanced_class_distribution_a": dict(zip(CLASSES, balanced_a.tolist())),
                    "balanced_class_distribution_b": dict(zip(CLASSES, balanced_b.tolist())),
                    "balanced_class_share_delta_b_minus_a": dict(zip(CLASSES, (balanced_b-balanced_a).tolist())),
                    "balanced_jsd": observed_jsd,
                    "document_bootstrap": {"replicates": REPLICATES, "seed": SEED,
                                           "jsd_95_ci": [float(np.quantile(b_jsd, .025)), float(np.quantile(b_jsd, .975))],
                                           "class_share_delta_95_ci": {c: [float(np.quantile(b_diff[:,i], .025)), float(np.quantile(b_diff[:,i], .975))]
                                                                        for i,c in enumerate(CLASSES)}},
                    "leave_one_publisher_out": influence_summary(leave_pub),
                    "leave_one_exact_topic_out": influence_summary(leave_topic),
                    "independent_source_replication": "NOT_AVAILABLE_WITHIN_NIKL_ONLY",
                    "heldout_units_are_diagnostic_only": True,
                })
    return {"replicate_count": REPLICATES, "seed": SEED, "comparisons": results}


def tail_analysis(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    keys = conn.execute("SELECT DISTINCT family,fmt,period,year FROM docs WHERE representation='RAW' ORDER BY family,fmt,period,year").fetchall()
    out = []
    for fam, fmt, period, year in keys:
        rows = conn.execute("SELECT chars,total_markers,c0,c1,c2,c3 FROM docs WHERE family=? AND fmt=? AND period=? AND year IS ? ORDER BY doc_hash",
                            (fam, fmt, period, year)).fetchall()
        if not rows:
            continue
        chars = np.asarray([r[0] for r in rows], dtype=np.float64)
        total = np.asarray([r[1] for r in rows], dtype=np.float64)
        rates = np.divide(total * 1000.0, chars, out=np.full_like(total, np.nan), where=chars > 0)
        valid = rates[np.isfinite(rates)]
        by_class = {}
        for i, c in enumerate(CLASSES):
            cr = np.asarray([r[i+2] for r in rows], dtype=np.float64)
            rate = np.divide(cr * 1000.0, chars, out=np.full_like(cr, np.nan), where=chars > 0)
            vv = rate[np.isfinite(rate)]
            by_class[c] = {"per_1000_codepoints": qsummary(vv.tolist()),
                           "zero_share": float(np.mean(cr == 0))}
        out.append({"source_family": fam, "serialization": fmt, "representation": "RAW",
                    "period": period, "year": year, "documents": len(rows),
                    "total_edf_marker_rate_per_1000_codepoints": qsummary(valid.tolist()),
                    "zero_marker_document_share": float(np.mean(total == 0)),
                    "zero_character_document_count": int(np.sum(chars == 0)),
                    "class_marker_tails": by_class})
    return out


def analyze(table: Path, output: Path, receipt_path: Path) -> dict[str, Any]:
    temp = tempfile.NamedTemporaryFile(prefix="g9p45-cp5-analysis-", suffix=".sqlite", delete=False)
    temp.close()
    db = Path(temp.name)
    try:
        conn = sqlite3.connect(db)
        conn.execute("PRAGMA journal_mode=OFF")
        conn.execute("PRAGMA synchronous=OFF")
        rows, table_sha = ingest_table(table, conn)
        conn.execute("CREATE INDEX docs_by_group_doc ON docs(family,fmt,period,year,publisher_hash,topic,doc_hash)")
        conn.commit()
        paired = paired_analysis(conn)
        tails = tail_analysis(conn)
        conn.close()
    finally:
        try:
            db.unlink()
        except FileNotFoundError:
            pass
    result = {"schema": "ksgt.g9.p45.nikl-document-bootstrap.cp5.v1", "checkpoint": "G9-P45-CP5C",
              "status": "OPEN", "input": {"table": table.name, "sha256": table_sha, "document_rows": rows,
                                               "raw_text_present": False},
              "methods": {"balanced_match": "exact family×serialization×RAW-period×year-horizon×hashed-publisher×exact-topic; equal cell weight; no minimum support threshold",
                          "horizons": [1, 2, 3], "bootstrap": {"replicates": REPLICATES, "seed": SEED,
                                                                "unit": "document within matched publisher×topic cell, resampled with replacement; per-document class composition, cells equally weighted"},
                          "influence": "leave one hashed publisher or exact source topic out; within-NIKL diagnostic, not independent-source replication",
                          "tail": "per-document frozen marker counts per 1000 RAW Unicode codepoints, zero-marker share; no normalization"},
              "balanced_document_bootstrap": paired,
              "document_tail_diagnostics": tails,
              "limitations": ["NIKL CSV/JSON are separate raw representations and do not count as independent replications.",
                              "Only one corpus family is in scope; independent source-held-out replication is unavailable.",
                              "Publisher and topic are metadata, not authorship or semantic-function gold labels.",
                              "No normalized representation was observed; no raw/normalized mixing.",
                              "No marker, topic, source, period, or threshold retuning after outcome exposure.",
                              "P45 remains OPEN pending final mechanism-persistence adjudication."]}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    receipt_path.write_text(json.dumps({"schema": result["schema"], "input_table_sha256": table_sha,
                                        "input_document_rows": rows, "output_name": output.name,
                                        "output_sha256": sha256(output), "output_bytes": output.stat().st_size,
                                        "status": "OPEN", "raw_text_present": False}, indent=2) + "\n", encoding="utf-8")
    return result


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("table", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--receipt", type=Path, required=True)
    args = ap.parse_args()
    r = analyze(args.table, args.output, args.receipt)
    print(json.dumps({"status": "PASS", "documents": r["input"]["document_rows"],
                      "comparisons": len(r["balanced_document_bootstrap"]["comparisons"]),
                      "tail_cells": len(r["document_tail_diagnostics"])}, ensure_ascii=True), flush=True)


if __name__ == "__main__":
    main()

