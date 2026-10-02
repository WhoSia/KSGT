#!/usr/bin/env python3
"""Feature-only streaming intake for user-supplied NIKL newspaper/written ZIPs.

No extraction, source-text persistence, normalization, or author-name persistence.
The four EDF classes/markers mirror the frozen G9-P45 adapter exactly.
"""
from __future__ import annotations

import argparse
import codecs
import csv
import hashlib
import io
import json
import math
import re
import zipfile
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from typing import Any, BinaryIO, Iterator

EDF = {
    "CONTRAST": ["그러나", "그런데", "하지만", "그렇지만", "반면", "오히려", "도리어", "그럼에도", "비록"],
    "CAUSE_RESULT": ["그래서", "그러므로", "따라서", "때문에", "그러자", "그리하여", "결국", "그러니", "그러면", "이에"],
    "TEMPORAL": ["그때", "이때", "먼저", "뒤에", "후에", "마침내", "이윽고", "곧", "동안", "한동안"],
    "EXPANSION": ["그리고", "또한", "또", "게다가", "더구나", "즉", "이를테면", "예컨대", "다시 말해"],
}

def parse_date(value: Any) -> tuple[int | None, str]:
    """Accept only the source-observed NIKL YYYYMMDD field; no text normalization."""
    if not isinstance(value, (str, int)):
        return None, "MISSING_OR_NONSCALAR"
    raw = str(value)
    if not re.fullmatch(r"\d{8}", raw):
        return None, "UNSUPPORTED_DATE_SHAPE"
    try:
        d = date(int(raw[:4]), int(raw[4:6]), int(raw[6:8]))
    except ValueError:
        return None, "INVALID_CALENDAR_DATE"
    y = d.year
    if y < 1930:
        return y, "OUT_OF_SCOPE_PRE1930"
    if 1940 <= y <= 1944:
        return y, "WARTIME_1940_1944_UNMODELED"
    if 1930 <= y <= 1939:
        return y, "PREWAR_1930S"
    if 1945 <= y <= 1959:
        return y, "POSTLIB_1945_1959"
    if 1960 <= y <= 1979:
        return y, "INDUSTRIAL_1960_1979"
    if 1980 <= y <= 1999:
        return y, "LATE20C_1980_1999"
    if 2000 <= y <= 2008:
        return y, "EARLY_DIGITAL_2000_2008"
    if 2009 <= y <= 2018:
        return y, "NEWS_2009_2018"
    if y == 2019:
        return y, "NEWS_2019"
    if 2020 <= y <= 2022:
        return y, "PRE_CHATGPT_2020_2022_11_29" if d <= date(2022, 11, 29) else "TRANSITION_2022_11_30_2023"
    if y == 2023:
        return y, "TRANSITION_2022_11_30_2023"
    if y >= 2024:
        return y, "POST_2024_MIXED_PROVENANCE"
    return y, "UNKNOWN_PERIOD"

def markers(text: str) -> tuple[dict[str, int], dict[str, dict[str, int]]]:
    detail = {c: {m: text.count(m) for m in ms} for c, ms in EDF.items()}
    return {c: sum(v.values()) for c, v in detail.items()}, detail

def _new_group() -> dict[str, Any]:
    return {"documents": 0, "text_units": 0, "characters": 0,
            "edf": Counter(), "markers": {c: Counter() for c in EDF},
            "topic_features": {},
            "topics": Counter(), "date_shapes": Counter(), "date_errors": Counter(),
            "missing_publisher": 0, "missing_topic": 0, "empty_text_units": 0}

def _topic_cell(g: dict[str, Any], topic: str | None) -> dict[str, Any]:
    return g["topic_features"].setdefault(topic, {
        "documents": 0, "text_units": 0, "characters": 0, "edf": Counter(),
        "markers": {c: Counter() for c in EDF},
    })

def _add_topic_document(g: dict[str, Any], topic: str | None) -> None:
    _topic_cell(g, topic)["documents"] += 1

def _add_text(g: dict[str, Any], text: str, extract_features: bool, topic: str | None = None) -> None:
    g["text_units"] += 1
    if extract_features:
        ec, detail = markers(text)
        g["characters"] += len(text)
        if not text:
            g["empty_text_units"] += 1
        g["edf"].update(ec)
        for cls, values in detail.items():
            g["markers"][cls].update(values)
        tg = _topic_cell(g, topic)
        tg["text_units"] += 1
        tg["characters"] += len(text)
        tg["edf"].update(ec)
        for cls, values in detail.items():
            tg["markers"][cls].update(values)

def _finalize(g: dict[str, Any], extract_features: bool) -> dict[str, Any]:
    out = {"documents": g["documents"], "text_units": g["text_units"],
            "topics": dict(g["topics"]), "date_shapes": dict(g["date_shapes"]),
            "date_errors": dict(g["date_errors"]),
            "missing_publisher": g["missing_publisher"],
            "missing_topic": g["missing_topic"]}
    if extract_features:
        out.update({"characters": g["characters"], "edf": dict(g["edf"]),
                    "markers": {c: dict(g["markers"][c]) for c in EDF},
                    "empty_text_units": g["empty_text_units"],
                    "topic_features": [
                        {"topic": topic, "documents": tg["documents"], "text_units": tg["text_units"],
                         "characters": tg["characters"], "edf": dict(tg["edf"]),
                         "markers": {c: dict(tg["markers"][c]) for c in EDF}}
                        for topic, tg in sorted(g["topic_features"].items(), key=lambda x: (x[0] is not None, x[0] or ""))
                    ]})
    return out

def newspaper_provenance(period: str, year: int | None) -> str:
    if year is not None and year >= 2009 and (year < 2022 or period == "PRE_CHATGPT_2020_2022_11_29"):
        return "INSTITUTIONAL_EDITORIAL_PRE_CHATGPT"
    if period == "POST_2024_MIXED_PROVENANCE":
        return "POST_2024_AI_ASSISTANCE_UNKNOWN"
    return "UNKNOWN"

class JsonStream:
    """Incremental JSON decoder; memory is bounded by one document record."""
    def __init__(self, stream: BinaryIO, chunk_size: int = 1 << 20, max_record_chars: int = 64 << 20):
        self.stream = stream
        self.chunk_size = chunk_size
        self.max_record_chars = max_record_chars
        self.decoder = json.JSONDecoder()
        self.utf8 = codecs.getincrementaldecoder("utf-8-sig")()
        self.text = ""
        self.pos = 0
        self.eof = False

    def fill(self) -> bool:
        data = self.stream.read(self.chunk_size)
        if not data:
            self.text += self.utf8.decode(b"", final=True)
            self.eof = True
            return False
        self.text += self.utf8.decode(data, final=False)
        return True

    def ws(self) -> None:
        while True:
            while self.pos < len(self.text) and self.text[self.pos].isspace():
                self.pos += 1
            if self.pos < len(self.text) or self.eof:
                return
            self.fill()

    def char(self) -> str:
        self.ws()
        if self.pos >= len(self.text):
            raise EOFError("unexpected end of JSON")
        ch = self.text[self.pos]
        self.pos += 1
        return ch

    def value(self) -> Any:
        while True:
            self.ws()
            try:
                obj, end = self.decoder.raw_decode(self.text, self.pos)
                self.pos = end
                if self.pos > self.chunk_size:
                    self.text = self.text[self.pos:]
                    self.pos = 0
                return obj
            except json.JSONDecodeError:
                if self.eof:
                    raise
                if len(self.text) - self.pos >= self.max_record_chars:
                    raise ValueError("JSON_RECORD_EXCEEDS_64MiB_STREAM_BOUND")
                self.fill()

    def root_documents(self) -> Iterator[dict[str, Any]]:
        if self.char() != "{":
            raise ValueError("JSON_ROOT_NOT_OBJECT")
        first = True
        while True:
            self.ws()
            if self.pos >= len(self.text) and not self.eof:
                self.fill(); continue
            if self.char() == "}":
                return
            if not first:
                # comma was consumed above; this branch is only defensive
                raise ValueError("JSON_ROOT_SEPARATOR_INVALID")
            first = False
            self.pos -= 1
            key = self.value()
            if not isinstance(key, str) or self.char() != ":":
                raise ValueError("JSON_ROOT_MEMBER_INVALID")
            if key == "document":
                if self.char() != "[":
                    raise ValueError("JSON_DOCUMENT_NOT_ARRAY")
                item_first = True
                while True:
                    self.ws()
                    ch = self.char()
                    if ch == "]":
                        break
                    if not item_first:
                        if ch != ",":
                            raise ValueError("JSON_DOCUMENT_SEPARATOR_INVALID")
                        ch = self.char()
                    item_first = False
                    self.pos -= 1
                    item = self.value()
                    if not isinstance(item, dict):
                        raise ValueError("JSON_DOCUMENT_MEMBER_NOT_OBJECT")
                    yield item
            else:
                self.value()  # metadata/id are small and discarded
            self.ws()
            ch = self.char()
            if ch == "}":
                return
            if ch != ",":
                raise ValueError("JSON_ROOT_SEPARATOR_INVALID")
            first = True

def _add_document(groups: dict[tuple[str, int | None, str], dict[str, Any]], doc: dict[str, Any], fmt: str,
                  seen_ids: set[str] | None = None, extract_features: bool = True) -> None:
    meta = doc.get("metadata") or {}
    if not isinstance(meta, dict):
        meta = {}
    rawdate = meta.get("date")
    year, period = parse_date(rawdate)
    publisher = str(meta.get("publisher") or "UNKNOWN_PUBLISHER")
    g = groups.setdefault((period, year, publisher), _new_group())
    ident = str(doc.get("id") or "")
    if seen_ids is not None:
        if not ident:
            g["date_errors"]["MISSING_DOCUMENT_ID"] += 1
            return
        if ident in seen_ids:
            g["date_errors"]["DUPLICATE_DOCUMENT_ID"] += 1
            return
        seen_ids.add(ident)
        g["documents"] += 1
    else:
        g["documents"] += 1
    g["date_shapes"]["YYYYMMDD" if isinstance(rawdate, (str, int)) and re.fullmatch(r"\d{8}", str(rawdate)) else "OTHER"] += 1
    if year is None:
        g["date_errors"][period] += 1
    topic = str(meta.get("topic") or "")
    _add_topic_document(g, topic or None)
    if topic:
        g["topics"][topic] += 1
    else:
        g["missing_topic"] += 1
    if publisher == "UNKNOWN_PUBLISHER":
        g["missing_publisher"] += 1
    paragraphs = doc.get("paragraph")
    if not isinstance(paragraphs, list):
        g["date_errors"]["MISSING_PARAGRAPH_ARRAY"] += 1
        return
    for item in paragraphs:
        if isinstance(item, dict) and isinstance(item.get("form"), str):
            _add_text(g, item["form"], extract_features, topic or None)
        else:
            g["date_errors"]["MALFORMED_PARAGRAPH_FORM"] += 1

def process_json_archive(path: Path, extract_features: bool) -> dict[str, Any]:
    groups: dict[tuple[str, int | None, str], dict[str, Any]] = {}
    members = []
    errors = []
    seen_ids: set[str] = set()
    with zipfile.ZipFile(path) as z:
        json_entries = [x for x in z.infolist() if not x.is_dir() and x.filename.lower().endswith(".json")]
        for info in json_entries:
            members.append({"name_hash": hashlib.sha256(info.filename.encode("utf-8", "replace")).hexdigest()[:16],
                            "uncompressed_bytes": info.file_size})
            before = sum(g["documents"] for g in groups.values())
            try:
                with z.open(info) as raw:
                    for doc in JsonStream(raw).root_documents():
                        _add_document(groups, doc, "JSON_PARAGRAPH_FORM", seen_ids, extract_features)
                        del doc
            except Exception as exc:
                errors.append({"member_name_hash": members[-1]["name_hash"],
                               "error": type(exc).__name__, "message": str(exc)[:160]})
            after = sum(g["documents"] for g in groups.values())
            if after == before and not errors:
                errors.append({"member_name_hash": members[-1]["name_hash"],
                               "error": "ZERO_DOCUMENTS_PARSED", "message": "no complete document records"})
    return {"json_members": len(json_entries), "member_manifest": members,
            "groups": {f"{p}|{y}|{pub}": _finalize(g, extract_features) for (p, y, pub), g in sorted(groups.items(), key=lambda x: str(x[0]))},
            "errors": errors, "complete": not errors,
            "text_unit": "source field document.paragraph[].form; not asserted equivalent to CSV sentence"}

def process_csv_archive(path: Path, extract_features: bool) -> dict[str, Any]:
    groups: dict[tuple[str, int | None, str], dict[str, Any]] = {}
    seen: dict[str, tuple[tuple[str, int | None, str], str, str]] = {}
    members = []
    errors = []
    with zipfile.ZipFile(path) as z:
        csv_entries = [x for x in z.infolist() if not x.is_dir() and x.filename.lower().endswith(".csv")]
        for info in csv_entries:
            members.append({"name_hash": hashlib.sha256(info.filename.encode("utf-8", "replace")).hexdigest()[:16],
                            "uncompressed_bytes": info.file_size})
            try:
                with z.open(info) as raw:
                    text = io.TextIOWrapper(raw, encoding="utf-8-sig", errors="strict", newline="")
                    reader = csv.DictReader(text)
                    required = {"doc_id", "file_id", "publisher", "date", "sentence"}
                    if not reader.fieldnames or not required.issubset(reader.fieldnames):
                        raise ValueError("CSV_REQUIRED_SCHEMA_MISMATCH")
                    for row in reader:
                        year, period = parse_date(row.get("date"))
                        publisher = str(row.get("publisher") or "UNKNOWN_PUBLISHER")
                        group_key = (period, year, publisher)
                        g = groups.setdefault(group_key, _new_group())
                        docid = str(row.get("file_id") or "") + "/" + str(row.get("doc_id") or "")
                        topic = str(row.get("topic") or "")
                        raw_date = str(row.get("date") or "")
                        if not docid or docid == "/":
                            g["date_errors"]["MISSING_DOCUMENT_ID"] += 1
                        elif docid not in seen:
                            seen[docid] = (group_key, topic, raw_date)
                            g["documents"] += 1
                            g["date_shapes"]["YYYYMMDD" if re.fullmatch(r"\d{8}", raw_date) else "OTHER"] += 1
                            if year is None:
                                g["date_errors"][period] += 1
                            if topic:
                                g["topics"][topic] += 1
                            else:
                                g["missing_topic"] += 1
                            _add_topic_document(g, topic or None)
                            if publisher == "UNKNOWN_PUBLISHER":
                                g["missing_publisher"] += 1
                        elif seen[docid] != (group_key, topic, raw_date):
                            g["date_errors"]["DOCUMENT_METADATA_INCONSISTENT"] += 1
                        _add_text(g, row.get("sentence") or "", extract_features, topic or None)
                    text.detach()
            except Exception as exc:
                errors.append({"member_name_hash": members[-1]["name_hash"],
                               "error": type(exc).__name__, "message": str(exc)[:160]})
    # CSV is sentence-level; distinct article count is carried in each group by hashed ID census separately.
    total_docs = len(seen)
    return {"csv_members": len(csv_entries), "member_manifest": members,
            "distinct_article_ids_archive_total": total_docs,
            "groups": {f"{p}|{y}|{pub}": _finalize(g, extract_features) for (p, y, pub), g in sorted(groups.items(), key=lambda x: str(x[0]))},
            "errors": errors, "complete": not errors,
            "text_unit": "source field sentence; RAW only"}

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(4 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def jsd(a: list[int], b: list[int]) -> float:
    def norm(v: list[int]) -> list[float]:
        s = sum(v)
        return [x / s for x in v] if s else [0.0 for _ in v]
    p, q = norm(a), norm(b)
    if not any(p) and not any(q):
        return 0.0
    eps = 1e-12
    p = norm([max(x, eps) for x in p]); q = norm([max(x, eps) for x in q])
    m = [(x + y) / 2 for x, y in zip(p, q)]
    return 0.5 * sum(x * math.log2(x / z) for x, z in zip(p, m) if x) + 0.5 * sum(x * math.log2(x / z) for x, z in zip(q, m) if x)

def archive_summary(path: Path, mode: str) -> dict[str, Any]:
    with zipfile.ZipFile(path) as z:
        entries = [x for x in z.infolist() if not x.is_dir()]
        ext = Counter(Path(x.filename).suffix.lower() or "<none>" for x in entries)
    is_csv = ext.get(".csv", 0) > 0
    extract_features = mode == "features"
    parsed = process_csv_archive(path, extract_features) if is_csv else process_json_archive(path, extract_features)
    family = "NIKL_WRITTEN" if "WRITTEN" in path.name.upper() else "NIKL_NEWSPAPER"
    for cell_key, cell in parsed["groups"].items():
        period, year_s, _publisher = cell_key.split("|", 2)
        try: year = int(year_s)
        except ValueError: year = None
        if family == "NIKL_NEWSPAPER":
            cell["genre"] = "NEWS"
            cell["register"] = "INSTITUTIONAL_EDITORIAL"
            cell["provenance"] = newspaper_provenance(period, year)
            if "NEWSPAPER_V2.0" in path.name.upper():
                cell["edition_scope"] = "WITHIN_CATALOG_DECLARED_2009_2018" if year is not None and 2009 <= year <= 2018 else "OUTSIDE_CATALOG_DECLARED_2009_2018"
            else:
                cell["edition_scope"] = "PER_ARCHIVE_DECLARED_RANGE_NOT_REVALIDATED"
            cell["classification_basis"] = "NIKL newspaper source identity + exact item date; institutional publication only, not a human-authorship claim"
        else:
            cell["genre"] = "UNKNOWN"
            cell["register"] = "UNKNOWN"
            cell["provenance"] = "UNKNOWN"
            cell["edition_scope"] = "NOT_ASSIGNED"
            cell["classification_basis"] = "NIKL written corpus; subgenre/register/provenance not assigned"
    return {"name": path.name, "bytes": path.stat().st_size, "sha256": sha256(path),
            "member_count": len(entries), "extensions": dict(ext),
            "uncompressed_bytes": sum(x.file_size for x in entries),
            "source_family": family, "serialization": "CSV" if is_csv else "JSON",
            "representation": "RAW", **parsed}

def drift_tables(files: list[dict[str, Any]]) -> dict[str, Any]:
    # Keep publisher, serialization, year, and archive/version separate. A year
    # is comparable only when exactly one archive supplies that source-format cell.
    by_year: dict[tuple[str, str, str, str, int], list[tuple[dict[str, Any], str]]] = defaultdict(list)
    for f in files:
        for key, g in f["groups"].items():
            period, year_s, publisher = key.split("|", 2)
            try: year = int(year_s)
            except ValueError: continue
            by_year[(f["source_family"], f["serialization"], publisher, period, year)].append((g, f["name"]))
    collisions = [{"source_family": k[0], "serialization": k[1], "publisher": k[2], "period": k[3], "year": k[4],
                   "archives": [x[1] for x in v]} for k, v in sorted(by_year.items()) if len(v) > 1]
    eligible: dict[tuple[str, str, str, str], list[tuple[int, dict[str, Any], str]]] = defaultdict(list)
    for (family, serialization, publisher, period, year), cells in by_year.items():
        if len(cells) == 1:
            g, archive = cells[0]
            eligible[(family, serialization, publisher, period)].append((year, g, archive))
    comparisons = []
    nonconsecutive_gaps = []
    for (family, serialization, publisher, period), rows in sorted(eligible.items()):
        rows.sort(key=lambda x: x[0])
        for (ya, a, archive_a), (yb, b, archive_b) in zip(rows, rows[1:]):
            if yb != ya + 1:
                nonconsecutive_gaps.append({"source_family": family, "serialization": serialization,
                                            "publisher": publisher, "period": period, "archive_a": archive_a,
                                            "archive_b": archive_b, "year_a": ya, "year_b": yb,
                                            "gap_years": yb - ya,
                                            "reason": "not_an_adjacent_calendar_year; omitted from annual estimate"})
                continue
            comparisons.append({
                "source_family": family, "serialization": serialization, "publisher": publisher,
                "archive_a": archive_a, "archive_b": archive_b,
                "year_a": ya, "year_b": yb, "period": period,
                "period_a": period, "period_b": period,
                "edition_scope_a": a.get("edition_scope", "NOT_RECORDED"),
                "edition_scope_b": b.get("edition_scope", "NOT_RECORDED"),
                "gap_years": yb - ya,
                "coarse_class_jsd": jsd([a["edf"].get(c, 0) for c in EDF],
                                         [b["edf"].get(c, 0) for c in EDF]),
                "within_class_marker_jsd": {
                    c: jsd([a["markers"].get(c, {}).get(m, 0) for m in EDF[c]],
                           [b["markers"].get(c, {}).get(m, 0) for m in EDF[c]])
                    for c in EDF
                },
                "documents_a": a["documents"], "documents_b": b["documents"],
                "text_units_a": a["text_units"], "text_units_b": b["text_units"],
                "interpretation": "SURFACE_MARKER_DISTRIBUTION_ONLY; no semantic-function validation"
            })
    return {"annual_adjacent_calendar_year_pairs": comparisons,
            "omitted_nonconsecutive_year_gaps": nonconsecutive_gaps,
            "ambiguous_year_source_collisions": collisions,
            "period_pooling": "HOLD_UNTIL_SOURCE_OVERLAP_AND_EDITION_IDENTITY_ARE_RESOLVED",
            "pair_rule": "same NIKL source family, serialization, publisher, and fixed period; unique archive per period-year; adjacent calendar years only; no CSV/JSON pooling"}

def topic_drift_tables(files: list[dict[str, Any]]) -> dict[str, Any]:
    by_year: dict[tuple[str, str, str, str, str | None, int], list[tuple[dict[str, Any], str, str]]] = defaultdict(list)
    for f in files:
        for key, g in f["groups"].items():
            period, year_s, publisher = key.split("|", 2)
            try:
                year = int(year_s)
            except ValueError:
                continue
            for tf in g.get("topic_features", []):
                by_year[(f["source_family"], f["serialization"], publisher, period,
                         tf.get("topic"), year)].append((tf, f["name"], g.get("edition_scope", "NOT_RECORDED")))
    collisions = [{"source_family": k[0], "serialization": k[1], "publisher": k[2],
                   "period": k[3], "topic": k[4], "year": k[5],
                   "archives": [x[1] for x in v]} for k, v in sorted(by_year.items(), key=lambda x: str(x[0])) if len(v) > 1]
    eligible: dict[tuple[str, str, str, str, str | None], list[tuple[int, dict[str, Any], str, str]]] = defaultdict(list)
    for (family, serialization, publisher, period, topic, year), cells in by_year.items():
        if len(cells) == 1:
            tf, archive, scope = cells[0]
            eligible[(family, serialization, publisher, period, topic)].append((year, tf, archive, scope))
    pairs = []
    gaps = []
    for (family, serialization, publisher, period, topic), rows in sorted(eligible.items(), key=lambda x: str(x[0])):
        rows.sort(key=lambda x: x[0])
        for (ya, a, archive_a, scope_a), (yb, b, archive_b, scope_b) in zip(rows, rows[1:]):
            if yb != ya + 1:
                gaps.append({"source_family": family, "serialization": serialization, "publisher": publisher,
                             "period": period, "topic": topic, "archive_a": archive_a, "archive_b": archive_b,
                             "year_a": ya, "year_b": yb, "gap_years": yb - ya})
                continue
            pairs.append({
                "source_family": family, "serialization": serialization, "publisher": publisher,
                "period": period, "topic": topic, "archive_a": archive_a, "archive_b": archive_b,
                "edition_scope_a": scope_a, "edition_scope_b": scope_b,
                "year_a": ya, "year_b": yb,
                "coarse_class_jsd": jsd([a["edf"].get(c, 0) for c in EDF], [b["edf"].get(c, 0) for c in EDF]),
                "within_class_marker_jsd": {
                    c: jsd([a["markers"].get(c, {}).get(m, 0) for m in EDF[c]],
                           [b["markers"].get(c, {}).get(m, 0) for m in EDF[c]]) for c in EDF
                },
                "documents_a": a["documents"], "documents_b": b["documents"],
                "text_units_a": a["text_units"], "text_units_b": b["text_units"],
                "interpretation": "TOPIC_CONDITIONED_SURFACE_MARKER_DISTRIBUTION_ONLY"
            })
    return {"annual_adjacent_topic_pairs": pairs,
            "omitted_nonconsecutive_topic_gaps": gaps,
            "ambiguous_topic_year_source_collisions": collisions,
            "pair_rule": "same source family, serialization, publisher, fixed period, exact source topic; unique archive per cell; adjacent calendar years only; no pooling"}

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("archives", nargs="+", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--mode", choices=("census", "features"), default="census")
    args = ap.parse_args()
    extract_features = args.mode == "features"
    results = []
    for path in args.archives:
        result = archive_summary(path, args.mode)
        results.append(result)
        print(json.dumps({"archive": path.name, "mode": args.mode,
                          "complete": result["complete"],
                          "groups": len(result["groups"]),
                          "parse_errors": len(result["errors"])}, ensure_ascii=False), flush=True)
    payload = {"schema": "ksgt.g9.p45.nikl-stream-census.v1",
               "phase": "G9-P45", "status": "OPEN",
               "mode": args.mode,
               "method": "full archive streaming; no extraction; no raw text persistence; no normalization",
               "feature_contract": "KSGT-EDF-v0.1 exact frozen markers and class membership" if extract_features else "NOT_RUN_OUTCOME_BLIND_CENSUS",
               "topic_feature_contract": "exact source topic labels; no mapping, recoding, merging, or pooling" if extract_features else "NOT_RUN",
               "provenance_rule": "UNKNOWN pending explicit NIKL source-contract admission; date controls period only",
               "files": results,
               "drift": drift_tables(results) if extract_features else {"status": "NOT_RUN_BEFORE_CENSUS_FREEZE"},
               "topic_conditioned_drift": topic_drift_tables(results) if extract_features else {"status": "NOT_RUN_BEFORE_TOPIC_PRESEAL"},
               "admission": {"source_identity": "user-supplied NIKL official-corpus ZIP family",
                             "package_terms": "not independently revalidated in this execution; source PDFs present in ZIPs; local analysis only",
                             "raw_text_retained": False,
                             "source_normalized_representation": "NOT_OBSERVED; RAW only",
                             "publisher_name_role": "source metadata; never author-identity proof"},
               "limitations": ["CSV versus JSON text-unit equivalence not presumed",
                               "no normalized-source representation observed or emitted",
                               "publisher/topic composition retained; no corpus-wide pooled inference",
                               "NIKL and OKHC are separate source families",
                               "article-level sampling uncertainty not estimated in this pass"]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "mode": args.mode, "archives": len(results),
                      "complete": all(x["complete"] for x in results),
                      "total_bytes": sum(x["bytes"] for x in results)}, ensure_ascii=False))

if __name__ == "__main__":
    main()

