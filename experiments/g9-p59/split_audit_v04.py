#!/usr/bin/env python3
"""G9-P59 v0.4: independent Python/SQLite provenance & split audit.
Usage: node semantic_critic_v04.cjs --emit-dataset | python3 split_audit_v04.py
No external dependencies, no human preference claims.
"""
import hashlib
import json
import sqlite3
import sys

def audit(document):
    if document.get("schema") != "ksgt.p59.dataset.v04":
        raise ValueError("SCHEMA_MISMATCH")
    rows = document["rows"]
    if not rows:
        raise ValueError("EMPTY_DATASET")
    db = sqlite3.connect(":memory:")
    db.execute("CREATE TABLE samples (id TEXT PRIMARY KEY, scene_id TEXT NOT NULL, split TEXT NOT NULL, digest TEXT UNIQUE NOT NULL)")
    for row in rows:
        if row.get("authority") != "AUTHOR_INTENT_NOT_HUMAN_GOLD":
            raise ValueError("AUTHORITY_ESCALATION")
        if row.get("provenance", {}).get("humanGold") is not False:
            raise ValueError("HUMAN_GOLD_MISREPRESENTED")
        if row.get("holdoutEligible") is not False:
            raise ValueError("UNQUALIFIED_HOLDOUT")
        payload = {k: v for k, v in row.items() if k != "sha256"}
        raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        expected = hashlib.sha256(raw).hexdigest()
        if expected != row.get("sha256"):
            raise ValueError("HASH_MISMATCH")
        db.execute("INSERT INTO samples VALUES (?,?,?,?)",
                   (row["id"], row["sceneId"], row["split"], expected))
    leaked = db.execute(
        "SELECT scene_id FROM samples GROUP BY scene_id HAVING COUNT(DISTINCT split)>1"
    ).fetchall()
    if leaked:
        raise ValueError("SCENE_SPLIT_LEAKAGE")
    split_counts = dict(db.execute("SELECT split, COUNT(*) FROM samples GROUP BY split").fetchall())
    if any(split != "development" for split in split_counts):
        raise ValueError("PREMATURE_EVALUATION_SPLIT")
    return {"audit": "PASS", "rows": len(rows), "scene_families": len(set(r["sceneId"] for r in rows)),
            "split_counts": split_counts, "human_gold": 0, "authority": "SYNTHETIC_ONLY"}

def self_test(document):
    result = audit(document)
    mutated = json.loads(json.dumps(document))
    mutated["rows"][0]["split"] = "heldout"
    payload = {k: v for k, v in mutated["rows"][0].items() if k != "sha256"}
    mutated["rows"][0]["sha256"] = hashlib.sha256(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    try:
        audit(mutated)
    except ValueError as e:
        if str(e) not in ("SCENE_SPLIT_LEAKAGE", "PREMATURE_EVALUATION_SPLIT"):
            raise
    else:
        raise AssertionError("Failed to reject leaked or premature heldout")
    return result

if __name__ == "__main__":
    document = json.load(sys.stdin)
    print(json.dumps(self_test(document), ensure_ascii=False, sort_keys=True))
