"""Bounded exact-identity lookup in committed full-ingestion metadata; no text merge."""
import argparse,collections,datetime,json,pathlib,sqlite3,time
from p62_reference import digest
def run(root,out):
    root=pathlib.Path(root);out=pathlib.Path(out);start=time.monotonic()
    db=sqlite3.connect((out/"R2_IDENTITY.private.sqlite").as_uri(),uri=True);db.execute("pragma cache_size=-65536")
    db.execute("ATTACH DATABASE ? AS active",((root/"70_RUNS/corpus_sprint_20261011_main/corpus.sqlite").as_uri()+"?mode=ro",))
    before=json.loads((root/"70_RUNS/corpus_sprint_20261011_main/CHECKPOINT.json").read_text())
    db.executescript("""
    CREATE TABLE IF NOT EXISTS active_exact_matches AS
    SELECT o.member,o.ordinal,o.doc_id,o.file_id,o.strict,o.flat,c.first_member,c.ordinal AS json_ordinal,
      j.doc_id AS json_doc_id,j.file_id AS json_file_id,m.archive AS json_release
    FROM outside o JOIN active.canonical c ON c.strict=o.strict
    JOIN active.occurrences j ON j.member=c.first_member AND j.ordinal=c.ordinal
    JOIN active.members m ON m.key=c.first_member;
    CREATE UNIQUE INDEX IF NOT EXISTS active_exact_key ON active_exact_matches(member,ordinal);
    CREATE TABLE IF NOT EXISTS active_remaining AS SELECT o.* FROM outside o
    WHERE NOT EXISTS(SELECT 1 FROM active_exact_matches a WHERE a.member=o.member AND a.ordinal=o.ordinal);
    CREATE TABLE IF NOT EXISTS active_flat_matches AS
    SELECT DISTINCT o.member,o.ordinal,j.strict,j.doc_id,j.file_id,j.member AS json_member,j.ordinal AS json_ordinal
    FROM active_remaining o JOIN active.occurrences j ON j.flat=o.flat WHERE j.format='json';
    CREATE INDEX IF NOT EXISTS active_flat_key ON active_flat_matches(member,ordinal);
    CREATE TABLE IF NOT EXISTS active_id_candidates AS
    SELECT DISTINCT o.member,o.ordinal,j.strict,j.flat,j.member AS json_member,j.ordinal AS json_ordinal
    FROM active_remaining o JOIN active.occurrences j ON j.doc_id=o.doc_id AND j.file_id=o.file_id WHERE j.format='json';
    CREATE INDEX IF NOT EXISTS active_id_key ON active_id_candidates(member,ordinal);
    """)
    db.commit()
    n=db.execute("select count(*) from active_exact_matches").fetchone()[0]
    flat=db.execute("select count(*) from(select distinct member,ordinal from active_flat_matches)").fetchone()[0]
    idonly=db.execute("""select count(*) from (select distinct i.member,i.ordinal from active_id_candidates i
     where not exists(select 1 from active_flat_matches f where f.member=i.member and f.ordinal=i.ordinal))""").fetchone()[0]
    exactsource=db.execute("select sum(doc_id=json_doc_id AND file_id=json_file_id) from active_exact_matches").fetchone()[0]
    unresolved=948240-n-flat-idonly
    after=json.loads((root/"70_RUNS/corpus_sprint_20261011_main/CHECKPOINT.json").read_text())
    result={"status":"EXECUTED","scope":"All frozen outside-graph occurrences compared to committed larger JSON structures; statement snapshots, not global finished corpus",
        "original_outside_occurrences":948240,"exact_unchanged_unit_structure_occurrences":n,
        "exact_structure_same_doc_and_file_ids":exactsource,"normalized_flat_only_occurrences":flat,
        "source_id_only_candidate_occurrences":idonly,"no_observed_exact_or_id_link":unresolved,
        "checkpoint_before":before,"checkpoint_after":after,"wall_seconds":time.monotonic()-start,
        "by_csv_release":[list(x) for x in db.execute("""select o.archive,count(*) from outside o join active_exact_matches a using(member,ordinal) group by o.archive""")],
        "different_source_id_exact_text":"Retain identities/versions; exact text authorizes exclusion grouping, not original-work semantic identity",
        "span_transport":"Only unchanged unit structure allows direct unit/offset reuse. Normalized-flat-only matches remain quarantined.",
        "frozen_evaluation_modified":False,"global_work_independence":"HOLD",
        "active_database_mutated":False,"active_checkpoint_manually_modified":False,
        "remaining_subset_search":"Source-ID-linked candidates inspected separately; absence of exact/id links does not prove absence of cross-ID partial subsets",
        "active_frozen_config_sha256":digest(root/"70_RUNS/corpus_sprint_20261011_main/FROZEN_CONFIG.json")}
    (out/"BROADER_COMMITTED_JSON_IDENTITY_AUDIT.json").write_text(json.dumps(result,indent=2))
    db.close();print(json.dumps(result),flush=True)
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--root",required=True);p.add_argument("--out",required=True)
    a=p.parse_args();run(a.root,a.out)
