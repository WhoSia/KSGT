"""Private, bounded-memory NIKL streaming ingestion and descriptive source audit."""
import argparse
import collections
import csv
import datetime as dt
import gzip
import hashlib
import html
from html.parser import HTMLParser
import io
import json
import os
from pathlib import Path
import platform
import re
import shutil
import sqlite3
import sys
import time
import unicodedata
import zipfile

MAX_OBJECT = 16 * 1024**2
RESERVE = 60 * 1024**3
EXPECTED = {"file_id", "doc_id", "title", "author", "publisher", "date", "sentence_id", "sentence"}
DECODER = json.JSONDecoder()

def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()

def sha(value):
    return hashlib.sha256(value).hexdigest()

def file_sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(4 * 1024**2), b""):
            h.update(b)
    return h.hexdigest()

def atomic(path, obj):
    tmp = path.with_suffix(path.suffix + ".pending")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=True, indent=2)
        f.write("\n")
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)

class Stream:
    """Incrementally decode genuine JSON values, bounded by one source document."""
    def __init__(self, f):
        self.f, self.b, self.eof = f, "", False
    def more(self):
        t = self.f.read(65536)
        if not t:
            self.eof = True
        self.b += t
        if len(self.b.encode("utf-8")) > MAX_OBJECT:
            raise ValueError("JSON object exceeds bounded-memory limit")
    def ws(self):
        while True:
            self.b = self.b.lstrip()
            if self.b or self.eof:
                return
            self.more()
    def peek(self):
        self.ws()
        return self.b[:1]
    def expect(self, token):
        if self.peek() != token:
            raise ValueError("Unexpected JSON structure; expected " + token)
        self.b = self.b[1:]
    def value(self):
        self.ws()
        while True:
            try:
                v, n = DECODER.raw_decode(self.b)
                if n == len(self.b) and not self.eof:
                    self.more()
                    continue
                self.b = self.b[n:]
                return v
            except json.JSONDecodeError:
                if self.eof:
                    raise
                self.more()

def json_docs(f):
    s = Stream(f)
    s.expect("{")
    top, seen = {}, set()
    first = True
    while s.peek() != "}":
        if not first:
            s.expect(",")
        first = False
        key = s.value()
        if not isinstance(key, str) or key in seen:
            raise ValueError("Invalid or duplicate root key")
        seen.add(key)
        s.expect(":")
        if key != "document":
            top[key] = s.value()
            continue
        if not isinstance(top.get("id"), str) or not isinstance(top.get("metadata"), dict):
            raise ValueError("File identity and metadata must precede document array")
        s.expect("[")
        dfirst = True
        while s.peek() != "]":
            if not dfirst:
                s.expect(",")
            dfirst = False
            doc = s.value()
            if not isinstance(doc, dict):
                raise ValueError("Document must be an object")
            yield top["id"], top["metadata"], doc
        s.expect("]")
    s.expect("}")
    if s.peek() or "document" not in seen:
        raise ValueError("Trailing bytes or missing document array")

def csv_docs(f):
    reader = csv.DictReader(f)
    if not reader.fieldnames or not EXPECTED.issubset(reader.fieldnames):
        raise ValueError("CSV header differs from verified schema")
    group, key, size = None, None, 0
    for row in reader:
        if None in row or any(v is None for v in row.values()):
            raise ValueError("Malformed CSV row")
        ident = (row["file_id"].strip(), row["doc_id"].strip())
        if not all(ident) or not row["sentence_id"].strip():
            raise ValueError("Empty CSV file, document, or sentence identity")
        if ident != key:
            if group is not None:
                yield key[0], {}, group
            key, size = ident, 0
            group = {"id": ident[1], "metadata": {
                k: row[k] for k in reader.fieldnames if k not in
                {"file_id", "doc_id", "sentence_id", "sentence"}},
                "sentence": []}
        if any(group["metadata"][k] != row[k] for k in group["metadata"]):
            raise ValueError("Conflicting CSV document metadata inside group")
        size += len(row["sentence"].encode("utf-8"))
        if size > MAX_OBJECT:
            raise ValueError("CSV document exceeds bounded-memory limit")
        group["sentence"].append({"id": row["sentence_id"], "form": row["sentence"]})
    if group is not None:
        yield key[0], {}, group

class Plain(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
    def handle_data(self, d):
        self.parts.append(d)

def visible(text):
    if re.search(r"</?[A-Za-z][^>]*>", text):
        p = Plain()
        p.feed(text)
        return "".join(p.parts)
    return html.unescape(text)

def fingerprints(forms):
    # Strict structure identity preserves source unit boundaries and original text.
    strict = sha(json.dumps(forms, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
    # Cross-format diagnostic ignores Unicode whitespace and unit boundaries only.
    flat = "".join(re.sub(r"\s+", "", unicodedata.normalize("NFC", t)) for t in forms)
    return strict, sha(flat.encode("utf-8"))

def spans(text):
    # Orthographic segmentation is a proxy, not a linguistically validated sentence label.
    starts, last = [], 0
    for m in re.finditer(r'[.!?。！？]+(?:[”’"\u0027])?(?=\s|$)', text):
        starts.append((last, m.end()))
        last = m.end()
    if last < len(text):
        starts.append((last, len(text)))
    return [(a, b) for a, b in starts if text[a:b].strip()]

def features(forms):
    c = collections.Counter()
    c["units"] = len(forms)
    for text in forms:
        t = visible(text)
        c["characters"] += len(t)
        c["html_units"] += int(t != text)
        c["geujung"] += len(re.findall(r"(?<![가-힣])그\s*중(?![가-힣])", t))
        c["geu"] += len(re.findall(r"(?<![가-힣])그(?:는|가|를|의)?(?![가-힣])", t))
        c["geunyeo"] += len(re.findall(r"(?<![가-힣])그녀(?:는|가|를|의)?(?![가-힣])", t))
        for a, b in spans(t):
            end = re.sub(r'[\s.!?。！？”’"\u0027]+$', "", t[a:b])
            c["orthographic_sentences"] += 1
            c["ending_yo"] += int(end.endswith("요"))
            c["ending_da"] += int(end.endswith("다"))
    return dict(c)

def validate(doc, fmt):
    if not isinstance(doc.get("id"), str) or not doc["id"].strip():
        raise ValueError("Missing document ID")
    if not isinstance(doc.get("metadata"), dict):
        raise ValueError("Missing document metadata")
    units = doc.get("paragraph" if fmt == "json" else "sentence")
    if not isinstance(units, list) or not units:
        raise ValueError("Missing source text units")
    for u in units:
        if not isinstance(u, dict) or not isinstance(u.get("id"), str) or not u["id"]:
            raise ValueError("Missing text unit ID")
        if not isinstance(u.get("form"), str):
            raise ValueError("Non-string source form")
    return units

def init_db(db):
    db.executescript("""
    PRAGMA journal_mode=WAL;
    PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS members(
      key TEXT PRIMARY KEY, archive TEXT, name TEXT, format TEXT, bytes INTEGER,
      declared INTEGER, complete INTEGER, documents INTEGER, sha256 TEXT);
    CREATE TABLE IF NOT EXISTS occurrences(
      member TEXT, ordinal INTEGER, doc_id TEXT, file_id TEXT, strict TEXT, flat TEXT,
      year TEXT, format TEXT, feature TEXT, metadata TEXT, PRIMARY KEY(member,ordinal));
    CREATE INDEX IF NOT EXISTS identity_idx ON occurrences(doc_id);
    CREATE INDEX IF NOT EXISTS text_idx ON occurrences(flat);
    CREATE TABLE IF NOT EXISTS shards(
      member TEXT, kind TEXT, path TEXT, bytes INTEGER, sha256 TEXT,
      PRIMARY KEY(member,kind));
    CREATE TABLE IF NOT EXISTS canonical(
      strict TEXT PRIMARY KEY, first_member TEXT, ordinal INTEGER, paragraphs INTEGER);
    """)

class Hashed(io.RawIOBase):
    def __init__(self, source):
        self.source, self.h, self.count = source, hashlib.sha256(), 0
    def readable(self):
        return True
    def readinto(self, b):
        data = self.source.read(len(b))
        b[:len(data)] = data
        self.h.update(data)
        self.count += len(data)
        return len(data)

def select_members(root, fraction):
    chosen, registry = [], []
    for p in sorted((root / "10_INBOX/nikl_legacy_14zip").glob("*.zip")):
        with zipfile.ZipFile(p) as z:
            items = sorted((i for i in z.infolist() if i.filename.lower().endswith((".json", ".csv"))),
                           key=lambda i: (i.file_size, i.filename))
        total = sum(i.file_size for i in items)
        selected, n = [], 0
        for item in items:
            if selected and n >= total * fraction:
                break
            selected.append(item)
            n += item.file_size
        chosen.extend((p, i) for i in selected)
        registry.append({"archive": p.name, "data_members": len(items), "selected_members": len(selected),
                         "total_declared_data_bytes": total, "selected_declared_bytes": n,
                         "selection": "ASCENDING_MEMBER_SIZE_THEN_NAME",
                         "random_sample": False})
    return chosen, registry

def run(root, out, fraction, cap):
    if root.resolve() != Path("C:/KSGT_SERVER").resolve() or platform.node().upper() != "BOOK-DCFR8U3IME":
        raise ValueError("Unauthorized host or root")
    out.resolve().relative_to(root.resolve())
    out.mkdir(parents=True, exist_ok=True)
    for path in ["documents", "paragraphs", "sentences"]:
        (root / "40_CORPUS" / path / out.name).mkdir(parents=True, exist_ok=True)
    ledger_path = root / "70_RUNS/corpus_sprint_20261011_integrity/ARCHIVE_INTEGRITY_AND_SCHEMA_AUDIT.json"
    ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    for item in ledger["archives"]:
        source = root / "10_INBOX/nikl_legacy_14zip" / item["archive"]
        stat = source.stat()
        if stat.st_size != item["bytes"] or stat.st_mtime_ns != item["stat_mtime_ns"]:
            raise ValueError("Input stat changed since fresh archive hashing")
    config = {"fraction":fraction,"cap":cap,"code_sha256":file_sha(Path(__file__)),
              "archive_sha256":{x["archive"]:x["sha256"] for x in ledger["archives"]}}
    frozen = out / "FROZEN_CONFIG.json"
    if frozen.exists():
        previous = json.loads(frozen.read_text(encoding="utf-8"))
        if previous != config:
            left, right = dict(previous), dict(config)
            left.pop("fraction")
            right.pop("fraction")
            receipt = json.loads((out / "RUN_RECEIPT.json").read_text(encoding="utf-8"))
            if left != right or config["fraction"] <= previous["fraction"] or receipt["status"] != "EXECUTED":
                raise ValueError("Incompatible continuation or incomplete prior cohort")
            with (out / "COHORT_EXPANSION.jsonl").open("a",encoding="utf-8") as f:
                f.write(json.dumps({"timestamp":now(),"old_fraction":previous["fraction"],
                    "new_fraction":config["fraction"],"status":"PLANNED",
                    "reason":"Prospectively authorized scale expansion, unchanged parser and inputs"})+"\n")
    atomic(frozen, config)
    db = sqlite3.connect(out / "corpus.sqlite")
    init_db(db)
    started, clock = now(), time.perf_counter()
    atomic(out / "RUN_RECEIPT.json", {"status":"RUNNING","started_utc":started,
        "command":[sys.executable]+sys.argv,"pid":os.getpid(),"host":platform.node(),
        "input_hashes":config["archive_sha256"],"code_sha256":config["code_sha256"],
        "workers":1,"reserve_bytes":RESERVE,"completed":False})
    selected, registry = select_members(root, fraction)
    atomic(out / "CORPUS_SOURCE_REGISTRY.json", {"status": "RUNNING",
        "rights": "OWNER_CONFIRMED_APPROVED_PRIVATE_KSGT_USE_2026_10_11",
        "approval_record": "User explicitly confirmed approval in current conversation",
        "signed_agreement_independently_read": False, "sources": registry})
    processed = 0
    failures = []
    for archive, member in selected:
        key = sha((archive.name + "\0" + member.filename).encode("utf-8"))
        prior = db.execute("SELECT complete,documents FROM members WHERE key=?", (key,)).fetchone()
        if prior and (prior[0] or (cap and prior[1] >= cap)):
            continue
        if prior:
            raise ValueError("Use a new run directory when changing incomplete-member cap")
        if shutil.disk_usage(root).free < RESERVE + 512 * 1024**2:
            raise ValueError("Disk reserve at risk")
        fmt = Path(member.filename).suffix.lower()[1:]
        paths = [root / "40_CORPUS" / d / out.name / (key + ".jsonl.gz") for d in ["documents", "paragraphs", "sentences"]]
        pending = [p.with_suffix(p.suffix + ".pending") for p in paths]
        handles = [gzip.open(p, "wt", encoding="utf-8", compresslevel=3) for p in pending]
        n, complete = 0, True
        db.execute("BEGIN")
        try:
            with zipfile.ZipFile(archive) as z, z.open(member) as source:
                raw = Hashed(source)
                text = io.TextIOWrapper(io.BufferedReader(raw, 65536), encoding="utf-8-sig", errors="strict", newline="")
                iterator = json_docs(text) if fmt == "json" else csv_docs(text)
                for file_id, file_meta, doc in iterator:
                    units = validate(doc, fmt)
                    forms = [u["form"] for u in units]
                    strict, flat = fingerprints(forms)
                    date = str(doc["metadata"].get("date", ""))
                    year = date[:4] if re.fullmatch(r"[12][0-9]{3}[0-9]{4}", date) else "UNKNOWN"
                    feat = features(forms)
                    db.execute("INSERT INTO occurrences VALUES(?,?,?,?,?,?,?,?,?,?)",
                        (key, n, doc["id"], file_id, strict, flat, year, fmt,
                         json.dumps(feat), json.dumps({"file": file_meta, "document": doc["metadata"]}, ensure_ascii=False)))
                    isnew = False
                    if fmt == "json":
                        isnew = db.execute("INSERT OR IGNORE INTO canonical VALUES(?,?,?,?)",
                            (strict, key, n, len(units))).rowcount == 1
                    rec = {"occurrence_id": key + ":" + str(n), "archive": archive.name,
                           "member": member.filename, "file_id": file_id, "document_id": doc["id"],
                           "strict_text_structure_sha256": strict, "flat_text_sha256": flat,
                           "metadata": doc["metadata"], "file_metadata": file_meta,
                           "publication_year": year, "format": fmt, "canonical_text_written": isnew}
                    rec["source_unit_ids"] = [u["id"] for u in units]
                    handles[0].write(json.dumps(rec, ensure_ascii=False) + "\n")
                    if fmt == "csv":
                        for sentence_ordinal, unit in enumerate(units):
                            handles[2].write(json.dumps({"occurrence_id":rec["occurrence_id"],
                                "source_sentence_id":unit["id"],"source_sentence_ordinal":sentence_ordinal,
                                "source_member":key,"label":"SOURCE_CSV_SENTENCE_ID_NO_DUPLICATED_TEXT"})+"\n")
                    if isnew:
                        for j, u in enumerate(units):
                            pid = strict + ":" + str(j)
                            handles[1].write(json.dumps({"paragraph_key": pid, "document_variant": strict,
                                "source_id": u["id"], "source_ordinal": j, "form": u["form"],
                                "source_member": key, "source_document_ordinal": n}, ensure_ascii=False) + "\n")
                            for k, (a, b) in enumerate(spans(u["form"])):
                                handles[2].write(json.dumps({"paragraph_key": pid, "sentence_ordinal": k,
                                    "start": a, "end": b, "unit": "UNICODE_CODEPOINT",
                                    "label": "ORTHOGRAPHIC_PROXY_NOT_SOURCE_SENTENCE_GOLD"}) + "\n")
                    n += 1
                    if cap and n >= cap:
                        complete = False
                        break
                if complete and raw.count != member.file_size:
                    raise ValueError("Member EOF length mismatch")
                member_sha = raw.h.hexdigest() if complete else None
            for h in handles:
                h.close()
            # Commit only after output shards have closed and reached their final names.
            for p, final in zip(pending, paths):
                os.replace(p, final)
            for kind, final in zip(["documents","paragraphs","sentences"],paths):
                db.execute("INSERT INTO shards VALUES(?,?,?,?,?)",
                    (key,kind,str(final),final.stat().st_size,file_sha(final)))
            db.execute("INSERT INTO members VALUES(?,?,?,?,?,?,?,?,?)",
                (key, archive.name, member.filename, fmt, raw.count, member.file_size, int(complete), n, member_sha))
            db.commit()
        except Exception as exc:
            db.rollback()
            for h in handles:
                h.close()
            failures.append({"member_key": key, "error": type(exc).__name__, "message": str(exc)})
            atomic(out / "FAILURE.json", {"status": "HOLD", "failures": failures})
            raise
        processed += 1
        event = {"timestamp": now(), "status": "EXECUTED", "archive": archive.name,
                 "member_key": key, "documents": n, "full_member_crc": complete,
                 "completed_members_this_invocation": processed, "disk_free_bytes": shutil.disk_usage(root).free}
        with (out / "progress.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(event) + "\n")
            f.flush()
            os.fsync(f.fileno())
        print(json.dumps(event), flush=True)
        atomic(out / "CHECKPOINT.json", {"status": "RUNNING", "last_member": key,
            "completed_members": db.execute("SELECT COUNT(*) FROM members").fetchone()[0],
            "documents":db.execute("SELECT COUNT(*) FROM occurrences").fetchone()[0]})
    summarize(db, out, registry, started, time.perf_counter() - clock, cap, fraction)
    db.close()

def summarize(db, out, registry, started, wall, cap, fraction):
    total = db.execute("SELECT COUNT(*) FROM occurrences").fetchone()[0]
    canonical, paragraphs = db.execute("SELECT COUNT(*),COALESCE(SUM(paragraphs),0) FROM canonical").fetchone()
    conflicts = db.execute("SELECT COUNT(*) FROM (SELECT doc_id FROM occurrences GROUP BY doc_id HAVING COUNT(DISTINCT flat)>1)").fetchone()[0]
    same = db.execute("SELECT COUNT(*) FROM (SELECT doc_id FROM occurrences GROUP BY doc_id HAVING COUNT(DISTINCT member)>1 AND COUNT(DISTINCT flat)=1)").fetchone()[0]
    exact = db.execute("SELECT COUNT(*) FROM (SELECT strict FROM occurrences GROUP BY strict HAVING COUNT(DISTINCT member)>1)").fetchone()[0]
    overlap = {"status": "EXECUTED", "scope": "EXHAUSTIVE_WITHIN_PROCESSED_COHORT_NOT_GLOBAL_ESTIMATE",
        "document_occurrences": total, "same_id_flat_equivalent_cross_member_groups": same,
        "same_id_different_flat_text_groups": conflicts, "strict_structure_cross_member_groups": exact,
        "byte_identical_document_count": None, "semantic_equivalence_claim": False,
        "weak_metadata_group_count": None, "unresolved": "Different flat text requires variant review",
        "canonicalization": "NFC; delete Unicode whitespace; concatenate source units; retain HTML and punctuation",
        "strict_identity": "SHA256 of JSON list of unchanged source forms, preserving unit boundaries"}
    atomic(out / "CROSS_RELEASE_OVERLAP_REPORT.json", overlap)
    members = [dict(zip(["key","archive","name","format","bytes","declared","complete","documents","sha256"], row))
               for row in db.execute("SELECT * FROM members")]
    atomic(out / "ARCHIVE_INTEGRITY_AND_SCHEMA_AUDIT.json", {"status": "EXECUTED",
        "full_member_crc_verified_count": sum(x["complete"] for x in members), "members": members,
        "csv_header_required": sorted(EXPECTED), "json_identity": "root.id is file; document[].id is document",
        "archive_hash_ledger": "../corpus_sprint_20261011_integrity/ARCHIVE_INTEGRITY_AND_SCHEMA_AUDIT.json"})
    aggregate = {}
    for fmt, year, strict, feature in db.execute("""SELECT format,year,strict,feature FROM occurrences
        WHERE format=\'csv\' OR rowid IN (SELECT MIN(rowid) FROM occurrences WHERE format=\'json\' GROUP BY strict)
        ORDER BY member,ordinal"""):
        lane = fmt + ":" + year
        c = aggregate.setdefault(lane, collections.Counter())
        c["documents"] += 1
        c.update(json.loads(feature))
    atomic(out / "EXPERIMENT_COUNTS.json", {"status": "EXECUTED", "counts": {k:dict(v) for k,v in aggregate.items()},
        "json_policy": "GLOBAL_STRICT_STRUCTURE_DEDUP", "csv_policy": "ALL_OCCURRENCES_COMPLEMENTARY",
        "sampling": "NONRANDOM_MEMBER_SIZE_COHORT; NO_POPULATION_OR_CAUSAL_ESTIMATE"})
    report = "# KSGT corpus experiment report\n\nStatus: EXECUTED descriptive surface measurement; interpretation remains bounded.\n\n"
    report += f"Processed {total:,} representation document occurrences and stored {canonical:,} unique JSON text structures / {paragraphs:,} paragraphs.\n\n"
    report += "The experiment counts literal reference surfaces and orthographic sentence-ending proxies by actual metadata date year. JSON retains paragraph boundaries. CSV uses genuine sentence IDs and document groups. No reference recoverability, ellipsis gold, human preference, causal AI effect, or writing-model improvement is measured.\n\n"
    report += "Selection is by smallest member first within every release. It is a deliberate engineering cohort, not a random population sample. Release and format comparisons are descriptive and source composition remains confounded. Exact structure deduplication does not remove near duplicates or semantically adjudicate revised versions.\n\n"
    report += "| Format/year | Documents | Orthographic sentences | Literal partitive marker | Ending da | Ending yo |\n|---|---:|---:|---:|---:|---:|\n"
    for lane,c in sorted(aggregate.items()):
        report += f"| {lane} | {c['documents']} | {c['orthographic_sentences']} | {c['geujung']} | {c['ending_da']} | {c['ending_yo']} |\n"
    report += "\nNext: match publishers and document identities across paired representations, inspect retained variants privately, and compare reference-marker rates under exact-text and source-work exclusion. Zero literal hits are not evidence of no anaphora.\n"
    (out / "KSGT_CORPUS_EXPERIMENT_REPORT.md").write_text(report, encoding="utf-8")
    atomic(out / "CANONICAL_CORPUS_MANIFEST.json", {"status": "EXECUTED", "canonical_scope": "PROCESSED_JSON_COHORT",
        "representation_documents": total, "unique_json_text_structures": canonical, "paragraphs": paragraphs,
        "sentence_label": "ORTHOGRAPHIC_PROXY", "sentence_text_duplicated": False,
        "source_variants_retained": True, "dedup_policy": "UNCHANGED_FORM_LIST_HASH",
        "identity_semantic_conflicts_quarantined_for_future_evaluation": True,
        "split_status": "HOLD_NO_SOURCE_WORK_DISJOINT_HOLDOUT_DECLARED",
        "member_level_restart": "COMMITTED_MEMBERS_SKIPPED; UNCOMMITTED_SHARDS_REWRITTEN",
        "archive_fraction_requested": fraction, "per_member_document_cap": cap,
        "selected_sources": registry})
    with (out / "SHARD_HASH_MANIFEST.jsonl").open("w",encoding="utf-8") as f:
        for row in db.execute("SELECT member,kind,path,bytes,sha256 FROM shards ORDER BY member,kind"):
            f.write(json.dumps(dict(zip(["member","kind","path","bytes","sha256"],row)))+"\n")
    atomic(out / "CHECKPOINT.json", {"status": "EXECUTED", "members": len(members), "documents":total})
    outputs = {p.name: {"bytes":p.stat().st_size,"sha256":file_sha(p)}
               for p in out.glob("*") if p.is_file() and p.suffix != ".sqlite" and "sqlite-" not in p.name and p.name != "RUN_RECEIPT.json"}
    atomic(out / "RUN_RECEIPT.json", {"status": "EXECUTED", "started_utc": started, "ended_utc": now(),
        "command": [sys.executable] + sys.argv, "wall_seconds_this_invocation": wall,
        "host": platform.node(), "python":sys.version, "workers":1, "disk_free_bytes":shutil.disk_usage(out).free,
        "reserve_bytes":RESERVE, "maximum_source_object_bytes":MAX_OBJECT, "failures":[],
        "code_sha256":file_sha(Path(__file__)), "row_counts":{"documents":total,"unique_json_structures":canonical,"paragraphs":paragraphs},
        "output_hashes":outputs, "background_job_claim":False,
        "repository_head_read":"027c9b46ccad636cb0d9301098c1b290b696d548"})
    atomic(out / "CHECKPOINT.json", {"status": "EXECUTED", "members": len(members), "documents":total})

if __name__ == "__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--root",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--fraction",type=float,default=.01)
    p.add_argument("--cap",type=int,default=0)
    a=p.parse_args()
    if not 0 < a.fraction <= 1 or a.cap < 0:
        p.error("Invalid cohort bounds")
    run(a.root,a.out,a.fraction,a.cap)

