"""Read-only independent integrity checks and private SHA-256 delivery seal."""
import datetime
import hashlib
import json
import os
import pathlib
import shutil
import sqlite3
import sys
import time

ROOT = pathlib.Path("C:/KSGT_SERVER")
RUN = ROOT / "70_RUNS/p62_event_role_20261017"
OUT = ROOT / "80_EXPORT/p62_referential_grounding_20261011/R6_EVENT_ROLE_20261017"
ARCHIVES = ROOT / "10_INBOX/nikl_legacy_14zip"


def sha(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def check_db(path):
    db = sqlite3.connect(path.as_uri()+"?mode=ro", uri=True)
    result = db.execute("pragma quick_check").fetchone()[0]
    if result != "ok":
        raise ValueError(f"SQLite quick_check failed: {path.name}")
    return {"bytes": path.stat().st_size, "sha256": sha(path)}


def main():
    begun = time.time()
    expected = json.loads((ROOT / "70_RUNS/corpus_sprint_20261011_main/FROZEN_CONFIG.json").read_text())["archive_sha256"]
    archives = {}
    for name, wanted in sorted(expected.items()):
        path = ARCHIVES / name
        actual = sha(path)
        if actual != wanted:
            raise ValueError(f"Raw archive SHA-256 mismatch: {name}")
        archives[name] = {"bytes": path.stat().st_size, "sha256": actual}
    db_names = ("SOURCE_OPPORTUNITIES.private.sqlite", "UPSTREAM_CUSTODY.private.sqlite",
                "RAW_OCCURRENCE_WITNESSES.private.sqlite", "TEXT_DEPENDENCY_LINKS.private.sqlite",
                "EVENT_ROLE_FROZEN.private.sqlite")
    databases = {name: check_db(RUN / name) for name in db_names}
    result = json.loads((OUT / "EVENT_ROLE_MACHINE_RESULTS.json").read_text())
    frozen = json.loads((OUT / "FROZEN_EVENT_ROLE_SPEC.json").read_text())
    commands = json.loads((OUT / "EXECUTION_COMMANDS.json").read_text())
    if not commands or any("command" not in row or "exit_code" not in row for row in commands):
        raise ValueError("Execution command ledger incomplete")
    if frozen["reserved_late_inference"] != "FORBIDDEN" or result["reserved_late_inference"] != 0:
        raise ValueError("Reserved-late exposure invariant failed")
    if shutil.disk_usage(ROOT).free < 60 * 1024 ** 3:
        raise ValueError("System-volume reserve breached")
    receipt = {"status": "VERIFIED", "utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
               "host": os.environ.get("COMPUTERNAME"), "python": sys.version.split()[0],
               "logical_processors": os.cpu_count(), "disk_free_bytes": shutil.disk_usage(ROOT).free,
               "disk_reserve_bytes": 60 * 1024 ** 3,
               "raw_archives": {"count": len(archives), "bytes": sum(x["bytes"] for x in archives.values()),
                                "sha256": {name: x["sha256"] for name, x in archives.items()}},
               "databases": databases, "source_census": {k: result[k] for k in
                   ("structures", "targets", "source_dependency_components", "source_containers")},
               "frozen_spec_sha256": sha(OUT / "FROZEN_EVENT_ROLE_SPEC.json"),
               "machine_report_sha256": sha(OUT / "EVENT_ROLE_MACHINE_RESULTS.json"),
               "commands": commands,
               "human_ground_truth": None, "semantic_accuracy": None,
               "global_semantic_work_independence": "HOLD",
               "elapsed_seconds": time.time()-begun}
    (OUT / "RUN_RECEIPT.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    files = [p for p in OUT.rglob("*") if p.is_file() and p.name != "SHA256_MANIFEST.json"]
    files += [RUN / name for name in db_names]
    manifest = {"status": "VERIFIED", "created_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "entries": [{"path": str(p), "bytes": p.stat().st_size, "sha256": sha(p)}
                            for p in sorted(files, key=str)]}
    (OUT / "SHA256_MANIFEST.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    mismatches = [e["path"] for e in manifest["entries"] if sha(pathlib.Path(e["path"])) != e["sha256"]]
    if mismatches:
        raise ValueError("Manifest rehash mismatch")
    print(json.dumps({"status": "VERIFIED", "raw_archives": len(archives),
                      "manifest_entries": len(manifest["entries"]), "mismatches": 0,
                      "manifest_sha256": sha(OUT / "SHA256_MANIFEST.json"),
                      "elapsed_seconds": time.time()-begun}), flush=True)


if __name__ == "__main__":
    main()
