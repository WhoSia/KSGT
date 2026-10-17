"""Freeze source-component eligibility, then run a restartable machine court."""
import argparse
import collections
import datetime
import hashlib
import json
import pathlib
import shutil
import sqlite3
import sys
import time

ROOT = pathlib.Path("C:/KSGT_SERVER")
PRIOR = ROOT / "70_RUNS/p62_r4_r3_20261013"
R5 = ROOT / "70_RUNS/p62_r4_r5_20261014"
RUN = ROOT / "70_RUNS/p62_event_role_20261017"
OUT = ROOT / "80_EXPORT/p62_referential_grounding_20261011/R6_EVENT_ROLE_20261017"
HERE = pathlib.Path(__file__).resolve().parent
sys.path[:0] = [str(HERE), str(R5), str(PRIOR / "baseline_code"), str(PRIOR / "code")]
import p62_reference as ref
import p62_r4_guarded_v3 as v3
import p62_r4_r5_mechanisms as r5
import p62_r4_r3_transfer_gate as gate
from p62_event_role_evidence import decide

SEED = "P62-EVENT-ROLE-20261017-PREOUTCOME-v1"


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def read_db(path):
    return sqlite3.connect(path.as_uri() + "?mode=ro", uri=True)


def report(name):
    return json.loads((OUT / name).read_text(encoding="utf-8"))


def freeze():
    source = report("SOURCE_OPPORTUNITY_CENSUS.private.json")
    raw = report("RAW_OCCURRENCE_WITNESS_REPORT.json")
    passages = report("INDEPENDENT_TEXT_DEPENDENCY_AUDIT.json")
    if source["status"] != "EXECUTED" or not source["all_original_raw_members_reparsed"]:
        raise ValueError("Original-source inventory incomplete")
    if raw["status"] != "VERIFIED" or passages["status"] != "VERIFIED":
        raise ValueError("Original alias or shared-passage custody incomplete")
    source_db = read_db(RUN / "UPSTREAM_CUSTODY.private.sqlite")
    witness_db = read_db(RUN / "RAW_OCCURRENCE_WITNESSES.private.sqlite")
    link_db = read_db(RUN / "TEXT_DEPENDENCY_LINKS.private.sqlite")
    expected = dict(source_db.execute("select candidate,count(*) from aliases group by candidate"))
    observed = dict(witness_db.execute("select candidate,count(*) from witnesses group by candidate"))
    unresolved = {row[0] for row in witness_db.execute(
        "select distinct candidate from witnesses where relation in ('NORMALIZED_ONLY','CROSS_ID_VERSION_UNRESOLVED')")}
    records = []
    by_id = {}
    for strict, container, year, excluded in source_db.execute(
            "select strict,container,year,excluded from docs where targets>0"):
        row = {"id": strict, "container_sha256": hashlib.sha256(container.encode()).hexdigest(),
               "publication_year": year,
               "publication_year_authority": "DOCUMENT_METADATA" if year else "UNKNOWN",
               "exposed": bool(excluded),
               "lineage_complete": expected.get(strict) == observed.get(strict) and strict not in unresolved,
               "human_ground_truth": None}
        records.append(row)
        by_id[strict] = row
    links = []
    seen = set()
    for left, right, kind, exposed in link_db.execute(
            "select left_id,right_id,kind,exposed from links order by left_id,right_id,kind"):
        if left == right:
            if left in by_id:
                by_id[left]["exposed"] = True
            continue
        if right not in by_id:
            external = {"id": right, "container_sha256": None, "publication_year": None,
                        "publication_year_authority": "UNKNOWN", "exposed": bool(exposed),
                        "lineage_complete": True, "human_ground_truth": None}
            records.append(external)
            by_id[right] = external
        edge = (min(left, right), max(left, right), kind)
        if edge not in seen:
            seen.add(edge)
            links.append({"left": left, "right": right, "kind": kind, "witness_verified": True})
    split = gate.audit_transfer_split(records, links, seed=SEED)
    code_files = [HERE / name for name in
                  ("p62_event_role_evidence.py", "test_p62_event_role_evidence.py",
                   "r6_court.py", "r6_analyze.py", "r6_verify_seal.py",
                   "r6_source_inventory.py", "r6_custody_prepare.py",
                   "r6_alias_adapter.py", "r6_passage_adapter.py")] + [
                  R5 / "p62_r4_r5_mechanisms.py", PRIOR / "baseline_code/p62_reference.py",
                  PRIOR / "baseline_code/p62_r4_guarded_v3.py",
                  PRIOR / "code/p62_r4_r3_transfer_gate.py"]
    declaration = {"status": "PLANNED", "seed": SEED,
                   "source_sha256": {name: sha(RUN / name) for name in
                       ("SOURCE_OPPORTUNITIES.private.sqlite", "UPSTREAM_CUSTODY.private.sqlite",
                        "RAW_OCCURRENCE_WITNESSES.private.sqlite", "TEXT_DEPENDENCY_LINKS.private.sqlite")},
                   "audit_sha256": {name: sha(OUT / name) for name in
                       ("SOURCE_OPPORTUNITY_PREDECLARATION.private.json",
                        "SOURCE_OPPORTUNITY_CENSUS.private.json", "RAW_OCCURRENCE_WITNESS_REPORT.json",
                        "INDEPENDENT_TEXT_DEPENDENCY_AUDIT.json")},
                   "method_sha256": {name: sha(OUT / name) for name in
                       ("P62_EVENT_ROLE_METHOD.md", "P62_EVENT_ROLE_FORMAL_NOTE.md")},
                   "code_sha256": {p.name: sha(p) for p in code_files},
                   "component_manifest_sha256": split["manifest_sha256"],
                   "experimental_unit": "Original JSON source structure; component-level 70/20/10 split",
                   "target": "Literal previously defined partitive target, same original-unit offset",
                   "arms": ["A_R5_DESCRIPTOR", "B_NEAREST_ELIGIBLE", "C_R5_PARTICLE_GROUP",
                            "D_NP_EVENT_SURFACE", "V3_GUARDED_REFERENCE"],
                   "estimand": "Paired document-equal admitted proposal rate; D minus each baseline",
                   "windows": "Frozen R5/v3 1024-codepoint prefix and exact target; D inspects original same-unit source spans",
                   "exclusions": "Prior source key, raw alias, >=80 codepoint shared passage, unresolved normalized/version links",
                   "negative_controls": ["Future source rejection", "Quotation separation", "Coordination ambiguity",
                                         "Nominative/accusative semantic nonpromotion"],
                   "reserved_late_inference": "FORBIDDEN", "human_ground_truth": None,
                   "claim_ceiling": "Machine source-fragment proposals; no semantic antecedent accuracy"}
    path = OUT / "FROZEN_EVENT_ROLE_SPEC.json"
    components = OUT / "FROZEN_EVENT_ROLE_COMPONENTS.private.json"
    custody_path = OUT / "SOURCE_CUSTODY_MANIFEST.private.json"
    source_plan = report("SOURCE_OPPORTUNITY_PREDECLARATION.private.json")
    custody = {"status": "VERIFIED_EXACT_SOURCE_RELATION_ONLY",
               "selected_original_members": source_plan["members"],
               "raw_alias_witness": raw,
               "shared_passage_audit": passages,
               "selected_target_positive_structures": len(by_id) - sum(
                   record["container_sha256"] is None for record in records),
               "source_component_split_sha256": split["manifest_sha256"],
               "split_counts": {key: {name: value for name, value in row.items() if name != "tokens"}
                                for key, row in split["by_split"].items()},
               "global_semantic_work_independence": "HOLD",
               "human_ground_truth": None}
    if path.exists():
        if json.loads(path.read_text(encoding="utf-8")) != declaration:
            raise ValueError("Frozen specification or source/code hash changed")
        if json.loads(custody_path.read_text(encoding="utf-8")) != custody:
            raise ValueError("Frozen source custody changed")
    else:
        components.write_text(json.dumps({"records": records, "links": links, "manifest": split}, indent=2), encoding="utf-8")
        path.write_text(json.dumps(declaration, indent=2), encoding="utf-8")
        custody_path.write_text(json.dumps(custody, indent=2), encoding="utf-8")
    return split, declaration


def court(limit):
    split, declaration = freeze()
    if split["coverage_status"] != "MACHINE_TRANSFER_COVERAGE_GATE_PASSED":
        raise RuntimeError("New source diversity gate HOLD")
    selected = set(split["by_split"]["frozen_transfer"]["tokens"])
    source_db = read_db(RUN / "UPSTREAM_CUSTODY.private.sqlite")
    rows = [row for row in source_db.execute(
        "select strict,member,ordinal,container,year,targets,forms from docs order by member,ordinal")
        if row[0] in selected]
    members = sorted({row[1] for row in rows})
    checkpoint = sqlite3.connect(RUN / "EVENT_ROLE_FROZEN.private.sqlite")
    checkpoint.executescript("create table if not exists results(strict text primary key,member text,container text,year integer,targets integer,payload text);"
                             "create table if not exists seal(key text primary key,value text);")
    seal = json.dumps(declaration, sort_keys=True)
    prior_seal = checkpoint.execute("select value from seal where key='declaration'").fetchone()
    if prior_seal and prior_seal[0] != seal:
        raise ValueError("Restart declaration mismatch")
    checkpoint.execute("insert or ignore into seal values('declaration',?)", (seal,))
    checkpoint.commit()
    main = read_db(ROOT / "70_RUNS/corpus_sprint_20261011_main/corpus.sqlite")
    archive = dict(main.execute("select key,archive from members"))
    config = json.loads((ROOT / "70_RUNS/corpus_sprint_20261011_main/FROZEN_CONFIG.json").read_text())
    started = time.perf_counter()
    started_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
    initial_free = shutil.disk_usage(ROOT).free
    added = 0
    for strict, member, ordinal, container, year, count, raw in rows:
        if limit and member not in members[:limit]:
            continue
        if checkpoint.execute("select 1 from results where strict=?", (strict,)).fetchone():
            continue
        if shutil.disk_usage(ROOT).free < 60 * 1024 ** 3:
            raise RuntimeError("System disk reserve HOLD")
        forms = json.loads(raw)
        identity = {"strict_structure": strict, "member_key": member,
                    "archive_sha256": config["archive_sha256"][archive[member]],
                    "document_ordinal": ordinal}
        decisions = []
        for i, form in enumerate(forms):
            for match in ref.TARGET.finditer(form):
                target = {"unit": i, "start": match.start(), "end": match.end(), "observed": True}
                graph = v3.infer(forms, target, identity)
                old = r5.infer(forms, target, identity, graph)
                new = decide(forms, target, graph, graph["source_admission"]["status"])
                decisions.append({"target": target, "r5_a": old["m1_descriptor"],
                                  "r5_c": old["m2_particle_role"], "v3_status": graph["status"],
                                  "v3_selected": (graph.get("selected") or {}).get("id"),
                                  "new": new, "human_ground_truth": None})
        if len(decisions) != count:
            raise ValueError("Target denominator changed after freeze")
        checkpoint.execute("insert into results values(?,?,?,?,?,?)",
                           (strict, member, container, year, count,
                            json.dumps(decisions, ensure_ascii=False)))
        added += 1
        if added % 25 == 0:
            checkpoint.commit()
    checkpoint.commit()
    census = checkpoint.execute("select count(*),sum(targets) from results").fetchone()
    return {"status": "EXECUTED", "new_structures": added,
            "completed_structures": census[0], "targets": census[1],
            "started_utc": started_utc,
            "finished_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "disk_free_before_bytes": initial_free,
            "disk_free_after_bytes": shutil.disk_usage(ROOT).free,
            "elapsed_seconds": time.perf_counter()-started}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--freeze-only", action="store_true")
    parser.add_argument("--members", type=int, default=0)
    args = parser.parse_args()
    result = freeze() if args.freeze_only else court(args.members)
    if args.freeze_only:
        split, _ = result
        result = {"coverage_status": split["coverage_status"], "by_split":
                  {k: {name: value for name, value in row.items() if name != "tokens"}
                   for k, row in split["by_split"].items()}}
    print(json.dumps(result), flush=True)
