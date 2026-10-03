#!/usr/bin/env python3
"""One-pass feature-only document table builder for the sealed CP4 NIKL inputs.

The only source text held in memory is the current CSV sentence or current JSON
document. No text, source IDs, publisher names, or reversible ID map is written.
"""
from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import io
import json
import os
import sqlite3
import tempfile
import zipfile
from collections import Counter
from pathlib import Path
from typing import Any, BinaryIO

from nikl_stream_audit import EDF, JsonStream, markers, parse_date, sha256

EXPECTED = {
    "NIKL_NEWSPAPER_2020_CSV.zip": (613941144, "dcdf88c9d007c1d4697f6b028be7d92b9710670c66361ee2db6b05f98b8c02db"),
    "NIKL_NEWSPAPER_2020_v1.1_JSON.zip": (614514721, "3b5c0bb3ad1d5b81d0b775955bb91784cf6a94ec84b6e364e2dc23c03d51c4fd"),
    "NIKL_NEWSPAPER_2021_CSV.zip": (913402888, "c75c8724c3264bfc304569fa4a268bd9e1fe40ed4aa409438aa97b91505d88fe"),
    "NIKL_NEWSPAPER_2021_v1.0_JSON.zip": (897518198, "9ef18a11d0501348ea9db9f7b13c8f1e1ec0f184adc1ec758b96a1e3df56b9ad"),
    "NIKL_NEWSPAPER_2022_CSV.zip": (955930766, "c9f8c1fb90805ead6da00d007b8ed9cff9f0fae2fa79a25337ca0eda52100433"),
    "NIKLNEWSPAPER_2022_v1.0_JSON.zip": (939538071, "59681fc5e76e442d48a48d0128284360aaec93d38467c883e246f96ecfbfd0a2"),
    "NIKL_NEWSPAPER_2023_CSV_v1.0.zip": (1031066858, "dd8c7c27dd1583adb7a7ca4f49f3cb670b79de8f63b9aca2d6fa47fa51d61c34"),
    "NIKL_NEWSPAPER_2023_JSON_v1.0.zip": (1013591520, "6facdaf8f231ef2c7a92d34bc8a2be4b1f522cc74571b64ddc228ad8929ed418"),
    "NIKL_NEWSPAPER_2024_v1.0.zip": (1159587840, "b53ac96f9b1ae0e8bd09de675ba110a54cccb95825ac9b2c15c52fa654431cbb"),
    "NIKL_NEWSPAPER_2025_v1.1.zip": (933295416, "4b2716ac2d7aac77cfa3bda8a1cfc78c1cacd2f2d03c486e2f1610cedec1a4b4"),
    "NIKL_WRITTEN_CSV.zip": (1142113256, "fbe0749f99a31b8ab6b766a7c128d5ca22dd063949855320d972bb8afc8cf2d7"),
    "NIKL_WRITTEN_v1.2_JSON.zip": (1157162569, "52b9b6bc76ec24a541fb225e185f747b9686ead0f513e1325970e45faf526515"),
    "NIKL_NEWSPAPER_v2.0_JSON.zip": (4458664875, "6a5193eaeb6e8fec04d437b4b1d205bdc3445f57f589899214590e9fdbd640d9"),
}
MARKER_COLUMNS = [(c, m) for c, ms in EDF.items() for m in ms]
CLASS_COLUMNS = list(EDF)
COUNT_COLUMNS = [f"cls_{i}" for i in range(len(CLASS_COLUMNS))] + [f"m_{i}" for i in range(len(MARKER_COLUMNS))]
BASE_COLUMNS = ["doc_hash", "source_hash", "publisher_hash", "archive", "source_family", "serialization",
                "representation", "year", "period", "date_status", "topic", "characters", "text_units"]


def digest(namespace: str, *parts: str) -> str:
    payload = "KSGT-G9-P45-CP5\0" + namespace + "\0" + "\0".join(parts)
    return hashlib.sha256(payload.encode("utf-8", "surrogatepass")).hexdigest()


def source_family(name: str) -> str:
    return "NIKL_WRITTEN" if "WRITTEN" in name.upper() else "NIKL_NEWSPAPER"


def counts_for(text: str) -> tuple[list[int], int]:
    classes, detail = markers(text)
    return [classes.get(c, 0) for c in CLASS_COLUMNS] + [detail[c][m] for c, m in MARKER_COLUMNS], len(text)


def table_sql() -> str:
    columns = [f"{name} INTEGER NOT NULL DEFAULT 0" for name in COUNT_COLUMNS]
    return ("CREATE TABLE docs (doc_hash TEXT PRIMARY KEY, source_hash TEXT NOT NULL, publisher_hash TEXT NOT NULL, "
            "archive TEXT NOT NULL, source_family TEXT NOT NULL, serialization TEXT NOT NULL, representation TEXT NOT NULL, "
            "year INTEGER, period TEXT NOT NULL, date_status TEXT NOT NULL, topic TEXT, characters INTEGER NOT NULL DEFAULT 0, "
            "text_units INTEGER NOT NULL DEFAULT 0, " + ", ".join(columns) + ")")


def upsert_sql() -> str:
    allcols = BASE_COLUMNS + COUNT_COLUMNS
    qs = ",".join("?" for _ in allcols)
    add = ["characters=docs.characters+excluded.characters", "text_units=docs.text_units+excluded.text_units"]
    add.extend(f"{c}=docs.{c}+excluded.{c}" for c in COUNT_COLUMNS)
    guard = ("docs.source_hash=excluded.source_hash AND docs.publisher_hash=excluded.publisher_hash AND "
             "docs.archive=excluded.archive AND docs.year IS excluded.year AND docs.period=excluded.period AND "
             "docs.date_status=excluded.date_status AND docs.topic IS excluded.topic")
    return (f"INSERT INTO docs ({','.join(allcols)}) VALUES ({qs}) ON CONFLICT(doc_hash) DO UPDATE SET "
            f"{','.join(add)} WHERE {guard}")


def doc_base(archive: str, fmt: str, source_id: str, publisher: str, raw_date: Any, topic: Any) -> tuple[list[Any], str]:
    fam = source_family(archive)
    year, status = parse_date(raw_date)
    topic_value = str(topic) if topic is not None and str(topic) != "" else None
    pub_value = str(publisher) if publisher is not None and str(publisher) != "" else "UNKNOWN_PUBLISHER"
    identity = str(source_id)
    dh = digest("document", fam, fmt, archive, identity)
    sh = digest("source", fam)
    ph = digest("publisher", fam, pub_value)
    return [dh, sh, ph, archive, fam, fmt, "RAW", year, status, status, topic_value, 0, 0], dh


def increment(base: list[Any], text: str) -> tuple[Any, ...]:
    vals, nchar = counts_for(text)
    row = list(base)
    row[11] = nchar
    row[12] = 1
    return tuple(row + vals)


def process_json(zf: zipfile.ZipFile, archive: str, conn: sqlite3.Connection,
                 member_rows: list[dict[str, Any]]) -> tuple[int, int, list[str]]:
    entries = [x for x in zf.infolist() if not x.is_dir() and x.filename.lower().endswith(".json")]
    errors: list[str] = []
    n_docs = n_units = 0
    sql = upsert_sql()
    seen = set()
    for info in entries:
        member_rows.append({"name_hash": hashlib.sha256(info.filename.encode("utf-8", "replace")).hexdigest()[:16],
                            "bytes": info.file_size, "serialization": "JSON"})
        with zf.open(info) as raw:
            for doc in JsonStream(raw).root_documents():
                meta = doc.get("metadata") if isinstance(doc.get("metadata"), dict) else {}
                ident = str(doc.get("id") or "")
                if not ident:
                    errors.append("MISSING_DOCUMENT_ID")
                    continue
                base, dh = doc_base(archive, "JSON_PARAGRAPH_FORM", ident, meta.get("publisher"),
                                    meta.get("date"), meta.get("topic"))
                if dh in seen:
                    errors.append("DUPLICATE_DOCUMENT_ID_WITHIN_ARCHIVE")
                    continue
                seen.add(dh)
                paragraphs = doc.get("paragraph")
                if not isinstance(paragraphs, list):
                    errors.append("MISSING_PARAGRAPH_ARRAY")
                    paragraphs = []
                n_docs += 1
                for p in paragraphs:
                    if isinstance(p, dict) and isinstance(p.get("form"), str):
                        conn.execute(sql, increment(base, p["form"]))
                        n_units += 1
                del doc
        conn.commit()
    return n_docs, n_units, errors


def process_csv(zf: zipfile.ZipFile, archive: str, conn: sqlite3.Connection,
                member_rows: list[dict[str, Any]], batch_size: int = 20000) -> tuple[int, int, list[str]]:
    entries = [x for x in zf.infolist() if not x.is_dir() and x.filename.lower().endswith(".csv")]
    errors: list[str] = []
    n_units = 0
    sql = upsert_sql()
    batch: list[tuple[Any, ...]] = []
    last_key = None
    last_base = None
    for info in entries:
        member_rows.append({"name_hash": hashlib.sha256(info.filename.encode("utf-8", "replace")).hexdigest()[:16],
                            "bytes": info.file_size, "serialization": "CSV"})
        with zf.open(info) as raw:
            text = io.TextIOWrapper(raw, encoding="utf-8-sig", errors="strict", newline="")
            reader = csv.DictReader(text)
            required = {"doc_id", "file_id", "publisher", "date", "sentence"}
            if not reader.fieldnames or not required.issubset(reader.fieldnames):
                raise ValueError("CSV_REQUIRED_SCHEMA_MISMATCH")
            for row in reader:
                identity = str(row.get("file_id") or "") + "/" + str(row.get("doc_id") or "")
                if identity == "/":
                    errors.append("MISSING_DOCUMENT_ID")
                    continue
                # Reuse the ID hash for consecutive sentence rows in the same article.
                cache_key = (identity, str(row.get("publisher") or ""), str(row.get("date") or ""), str(row.get("topic") or ""))
                if cache_key != last_key:
                    last_base, _ = doc_base(archive, "CSV_SENTENCE", identity, row.get("publisher"),
                                            row.get("date"), row.get("topic"))
                    last_key = cache_key
                batch.append(increment(last_base, row.get("sentence") or ""))
                n_units += 1
                if len(batch) >= batch_size:
                    before = conn.total_changes
                    conn.executemany(sql, batch)
                    # A zero-row guarded conflict indicates inconsistent metadata for an ID.
                    if conn.total_changes - before < len(batch):
                        errors.append("DUPLICATE_OR_INCONSISTENT_DOCUMENT_METADATA")
                    conn.commit()
                    batch.clear()
            if hasattr(text, "detach"):
                text.detach()
    if batch:
        before = conn.total_changes
        conn.executemany(sql, batch)
        if conn.total_changes - before < len(batch):
            errors.append("DUPLICATE_OR_INCONSISTENT_DOCUMENT_METADATA")
        conn.commit()
    n_docs = conn.execute("SELECT COUNT(*) FROM docs WHERE archive=?", (archive,)).fetchone()[0]
    return n_docs, n_units, errors


def write_table(conn: sqlite3.Connection, output: Path) -> tuple[int, str]:
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as raw, gzip.GzipFile(fileobj=raw, mode="wb", mtime=0, filename="") as gz:
        for tup in conn.execute("SELECT * FROM docs ORDER BY archive, doc_hash"):
            row = dict(zip(BASE_COLUMNS + COUNT_COLUMNS, tup))
            classes = {c: row.pop(f"cls_{i}") for i, c in enumerate(CLASS_COLUMNS)}
            marker_counts = {c: {} for c in CLASS_COLUMNS}
            for i, (c, marker) in enumerate(MARKER_COLUMNS):
                marker_counts[c][marker] = row.pop(f"m_{i}")
            row["class_counts"] = classes
            row["marker_counts"] = marker_counts
            line = json.dumps(row, ensure_ascii=False, separators=(",", ":")).encode("utf-8") + b"\n"
            gz.write(line)
    digest_hex = sha256(output)
    return output.stat().st_size, digest_hex


def run(raw_dir: Path, output: Path, receipt_path: Path) -> dict[str, Any]:
    # Strict source-scope reconciliation occurs before any archive content is opened.
    observed = {p.name for p in raw_dir.glob("*.zip")}
    missing = sorted(set(EXPECTED) - observed)
    if missing:
        raise ValueError(f"sealed CP4 archives missing: {missing}")
    selected = [raw_dir / n for n in EXPECTED]
    custody = []
    for path in selected:
        size, expected_hash = EXPECTED[path.name]
        actual_size = path.stat().st_size
        if actual_size != size:
            raise ValueError(f"sealed size mismatch: {path.name} expected {size} got {actual_size}")
        actual_hash = sha256(path)
        if actual_hash != expected_hash:
            raise ValueError(f"sealed SHA-256 mismatch: {path.name}")
        custody.append({"name": path.name, "bytes": size, "sha256": actual_hash, "matches_cp4": True})
    temp = tempfile.NamedTemporaryFile(prefix="g9p45-cp5-", suffix=".sqlite", delete=False)
    temp.close()
    temp_path = Path(temp.name)
    total_docs = total_units = 0
    archive_results = []
    try:
        conn = sqlite3.connect(temp_path)
        conn.execute("PRAGMA journal_mode=OFF")
        conn.execute("PRAGMA synchronous=OFF")
        conn.execute("PRAGMA temp_store=FILE")
        conn.execute(table_sql())
        for path in selected:
            name = path.name
            with zipfile.ZipFile(path) as zf:
                members: list[dict[str, Any]] = []
                has_csv = any(not x.is_dir() and x.filename.lower().endswith(".csv") for x in zf.infolist())
                if has_csv:
                    docs, units, errors = process_csv(zf, name, conn, members)
                    fmt = "CSV"
                else:
                    docs, units, errors = process_json(zf, name, conn, members)
                    fmt = "JSON"
            total_docs += docs
            total_units += units
            archive_results.append({"archive": name, "serialization": fmt, "documents": docs,
                                    "text_units": units, "members": members, "errors": errors,
                                    "complete": not errors})
            print(json.dumps({"archive": name, "documents": docs, "text_units": units,
                              "errors": len(errors)}, ensure_ascii=True), flush=True)
        table_bytes, table_hash = write_table(conn, output)
        conn.close()
    finally:
        try:
            temp_path.unlink()
        except FileNotFoundError:
            pass
    receipt = {
        "schema": "ksgt.g9.p45.nikl-document-sufficient-stats.cp5.v1", "checkpoint": "G9-P45-CP5B",
        "status": "OPEN", "raw_text_retained": False, "source_text_uploaded": False,
        "source_normalized_representation": "NOT_OBSERVED; RAW ONLY",
        "input_scope": {"archive_count": len(custody), "archives": custody,
                         "additional_unsealed_archives_excluded": sorted(observed - set(EXPECTED)),
                         "source_contract_gate": "PASS_FOR_PREVIOUSLY_ADMITTED_NIKL_SOURCE_IDENTITY; written lane remains UNKNOWN genre/register/provenance; out-of-range 2004-2008 remain HOLD"},
        "method": {"streaming": True, "archive_extraction": False, "raw_text_retained": False,
                   "normalization": False, "document_grain": "archive × serialization × source document ID",
                   "csv_document_aggregation": "CSV file_id/doc_id sentence rows aggregated by hashed identity",
                   "json_document_aggregation": "paragraph[].form aggregated within source document",
                   "id_hash": "domain-separated SHA-256; no reversible mapping retained",
                   "character_count": "Python Unicode codepoint count on raw text units; no normalization",
                   "frozen_edf_v": "KSGT-EDF-v0.1", "feature_fields": ["class_counts", "individual marker_counts"]},
        "output": {"name": output.name, "bytes": table_bytes, "sha256": table_hash,
                   "document_rows": total_docs, "text_units": total_units},
        "archives": archive_results,
        "limitations": ["CSV and JSON remain distinct source representations and are not independent replications.",
                        "Publisher metadata is not authorship evidence.", "No normalized representation observed.",
                        "No genre/provenance escalation for NIKL Written.", "P45 remains OPEN."]}
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "PASS" if all(x["complete"] for x in archive_results) else "HOLD",
                      "documents": total_docs, "text_units": total_units, "table_bytes": table_bytes,
                      "table_sha256": table_hash, "receipt": str(receipt_path)}, ensure_ascii=True), flush=True)
    return receipt


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("raw_dir", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--receipt", type=Path, required=True)
    args = ap.parse_args()
    run(args.raw_dir, args.output, args.receipt)


if __name__ == "__main__":
    main()

