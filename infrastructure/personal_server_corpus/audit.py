"""Read-only ZIP inventory with fresh SHA-256 and durable private receipts.
This program does not ingest corpus text or resolve document overlap.
"""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import platform
import shutil
import sys
import time
import zipfile

RESERVE = 60 * 1024**3

def utc():
    return dt.datetime.now(dt.timezone.utc).isoformat()

def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024**2), b""):
            h.update(block)
    return h.hexdigest()

def write_json(path, obj):
    temp = path.with_suffix(path.suffix + ".pending")
    with temp.open("w", encoding="utf-8", newline="\n") as stream:
        json.dump(obj, stream, ensure_ascii=True, indent=2)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, path)

def unsafe(name):
    normalized = name.replace("\\", "/")
    parts = PurePosixPath(normalized).parts
    return normalized.startswith("/") or ".." in parts or bool(parts and ":" in parts[0])

def audit_archive(path):
    before = path.stat()
    started = time.perf_counter()
    sha = digest(path)
    with zipfile.ZipFile(path) as archive:
        members = archive.infolist()
        formats = {}
        for item in members:
            if not item.is_dir():
                ext = Path(item.filename).suffix.lower()
                formats[ext] = formats.get(ext, 0) + 1
        declared = sum(item.file_size for item in members)
        bad = sum(unsafe(item.filename) for item in members)
    after = path.stat()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
        raise RuntimeError("Input changed during hashing")
    return {
        "archive": path.name, "bytes": before.st_size, "sha256": sha,
        "stat_mtime_ns": after.st_mtime_ns, "member_count": len(members),
        "declared_uncompressed_bytes": declared, "formats": formats,
        "unsafe_member_names": bad, "elapsed_seconds": time.perf_counter() - started,
        "archive_sha_status": "VERIFIED", "full_member_crc_status": "PLANNED",
        "structured_schema_status": "HOLD", "rights_status": "HOLD",
        "release_label": path.name, "document_publication_date": "NOT_INFERRED"
    }

def run(root, out):
    if root.resolve() != Path("C:/KSGT_SERVER").resolve():
        raise RuntimeError("Unauthorized root")
    if platform.node().upper() != "BOOK-DCFR8U3IME":
        raise RuntimeError("Unauthorized host")
    out.resolve().relative_to(root.resolve())
    if shutil.disk_usage(root).free < RESERVE:
        raise RuntimeError("Free disk reserve breached")
    out.mkdir(parents=True, exist_ok=False)
    started, clock, cpu = utc(), time.perf_counter(), time.process_time()
    files = sorted((root / "10_INBOX/nikl_legacy_14zip").glob("*.zip"))
    if len(files) != 14:
        raise RuntimeError("Expected exactly fourteen archives")
    records = []
    with (out / "progress.jsonl").open("x", encoding="utf-8") as progress:
        for path in files:
            row = audit_archive(path)
            records.append(row)
            event = {"timestamp": utc(), "status": "EXECUTED",
                     "archive": path.name, "completed_archives": len(records),
                     "bytes_hashed": sum(x["bytes"] for x in records)}
            progress.write(json.dumps(event) + "\n")
            progress.flush()
            os.fsync(progress.fileno())
            write_json(out / "HASH_CHECKPOINT.json", {"status": "RUNNING", "archives": records})
            print(json.dumps(event), flush=True)
    total = sum(x["bytes"] for x in records)
    if total != 20268693891:
        raise RuntimeError("Archive total differs from handoff")
    audit = {"status": "EXECUTED", "archive_count": 14, "total_bytes": total,
             "total_declared_uncompressed_bytes": sum(x["declared_uncompressed_bytes"] for x in records),
             "archive_hashes_status": "VERIFIED", "schema_status": "HOLD",
             "integrity_scope": "FRESH_FULL_ARCHIVE_SHA256_AND_CENTRAL_DIRECTORY",
             "full_crc_verified": False, "source_destination_equality_verified": False,
             "archives": records}
    write_json(out / "ARCHIVE_INTEGRITY_AND_SCHEMA_AUDIT.json", audit)
    write_json(out / "CORPUS_SOURCE_REGISTRY.json", {
        "status": "HOLD", "reason": "Approved NIKL purpose and validity period not recovered",
        "private": True, "archives": records,
        "rights_sources_checked": ["local datasets.csv", "bundled English corpus documentation",
            "canonical P59/P60", "Drive P45 acquisition ledger", "NIKL current FAQ"],
        "terms_url": "https://kli.korean.go.kr/boards/faqList.do?lang=ko"})
    write_json(out / "CROSS_RELEASE_OVERLAP_REPORT.json", {
        "status": "HOLD", "observed_document_count": 0, "estimates": None,
        "reason": "Raw-text processing held pending approved purpose and validity period",
        "byte_identical_archive_groups": [
            [x["archive"] for x in records if x["sha256"] == sha]
            for sha in sorted(set(x["sha256"] for x in records))
            if sum(x["sha256"] == sha for x in records) > 1],
        "document_identity_categories": {"same_id_equivalent_text": None,
            "same_id_variant_text": None, "weak_metadata_only": None, "unresolved": None},
        "scope": "Archive byte identity only; not member or document disjointness"})
    write_json(out / "CANONICAL_CORPUS_MANIFEST.json", {
        "status": "HOLD", "documents": 0, "paragraphs": 0, "sentences": 0,
        "shards": [], "canonical_source_selected": False,
        "ingestion_implemented": False, "reason": "Rights gate"})
    report = """# KSGT corpus experiment report

Status: HOLD

No Korean-language experiment was executed. No document overlap rate, linguistic
frequency, human preference, semantic gold, or successful writing model is claimed.

The local rights registry says UNKNOWN. Bundled English PDFs describe corpus
content and structure; they do not establish the owner's approved purpose or
validity period. The current NIKL FAQ limits processing to approved purposes.
Historical CP5 execution does not establish current authorization for these
fourteen releases and private paragraph storage.

Next after rights recovery: a bounded, genuine JSON document parser and CSV
DictReader cross-check, followed by source-dependence of reference surface counts.
Preserve raw paragraph boundaries, HTML-bearing variants, partial dates, and
release identity. Never interpret literal reference markers as recoverability
gold. Compare duplicate policies before claiming genre or temporal variation.

The sprint objective remains incomplete. This receipt is an integrity checkpoint,
not a data-engineering or scientific PASS.
"""
    (out / "KSGT_CORPUS_EXPERIMENT_REPORT.md").write_text(report, encoding="utf-8")
    readme = """# KSGT personal-server integrity checkpoint

Status: HOLD for text ingestion and experiments; fresh archive hashing executed.

Run with existing Windows Python:
    python audit.py --root C:/KSGT_SERVER --out C:/KSGT_SERVER/70_RUNS/NEW_RUN_NAME

The output directory must not exist. Original ZIPs are opened read-only. The
program retains 60 GiB free disk, uses 4 MiB hash blocks, and writes a durable
per-archive checkpoint. This is not a resumable ingestion implementation.
Full member CRC, structured schema validation, document deduplication,
paragraph extraction and experimental analysis remain unimplemented/not run.
Receipts and checkpoints are private. Do not commit them to public GitHub.
No global dependencies, installations, services, deletion, or raw extraction.
"""
    (out / "README.md").write_text(readme, encoding="utf-8")
    outputs = {p.name: {"bytes": p.stat().st_size, "sha256": digest(p)}
               for p in out.iterdir() if p.is_file()}
    receipt = {"status": "HOLD", "started_utc": started, "ended_utc": utc(),
        "command": [sys.executable] + sys.argv, "python": sys.version,
        "host": platform.node(), "os": platform.platform(),
        "logical_processors": os.cpu_count(), "disk_free_bytes_end": shutil.disk_usage(root).free,
        "reserve_bytes": RESERVE, "workers": 1, "hash_block_bytes": 4 * 1024**2,
        "wall_seconds": time.perf_counter() - clock, "process_cpu_seconds": time.process_time() - cpu,
        "peak_memory": "NOT_MEASURED", "failures": [], "row_counts": {
            "archives_hashed": 14, "corpus_documents": 0, "paragraphs": 0, "sentences": 0},
        "input_hashes": {x["archive"]: x["sha256"] for x in records},
        "outputs": outputs, "code_sha256": digest(Path(__file__)),
        "repository_head_read": "027c9b46ccad636cb0d9301098c1b290b696d548",
        "stage": "G9-P60_OPEN", "hold": "NIKL approved use purpose and validity not recovered",
        "future_background_job": False}
    write_json(out / "RUN_RECEIPT.json", receipt)
    print(json.dumps({"status": "HOLD", "hashing": "VERIFIED", "out": str(out)}), flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    run(args.root, args.out)

