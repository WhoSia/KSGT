"""Observed broader-source conflict exclusions and frozen-metric sensitivity."""
import argparse,collections,json,pathlib,sqlite3,time
from p62_reference import bootstrap
def run(root,out):
    root=pathlib.Path(root);out=pathlib.Path(out);start=time.monotonic()
    db=sqlite3.connect((out/"R2_IDENTITY.private.sqlite").as_uri(),uri=True);db.execute("pragma cache_size=-65536")
    db.execute("attach database ? as active",((root/"70_RUNS/corpus_sprint_20261011_main/corpus.sqlite").as_uri()+"?mode=ro",))
    db.execute("attach database ? as p62",((root/"80_EXPORT/p62_referential_grounding_20261011/P62_PRIVATE.sqlite").as_uri()+"?mode=ro",))
    db.executescript("""
    CREATE TABLE IF NOT EXISTS broader_source_guard AS
    SELECT DISTINCT j.work,j.strict AS frozen_strict,o.strict AS observed_strict,o.doc_id,o.file_id
    FROM json_ids j JOIN active.occurrences o ON o.doc_id=j.doc_id AND o.file_id=j.file_id WHERE o.format='json';
    CREATE INDEX IF NOT EXISTS guard_work ON broader_source_guard(work);
    CREATE TABLE IF NOT EXISTS work_quarantine AS SELECT DISTINCT work FROM broader_source_guard
    WHERE frozen_strict<>observed_strict;
    """);db.commit()
    sourceleaks=db.execute("""select count(*) from(select doc_id,file_id from broader_source_guard group by doc_id,file_id having count(distinct work)>1)""").fetchone()[0]
    textbridges=db.execute("""select count(*) from(select observed_strict from broader_source_guard group by observed_strict having count(distinct work)>1)""").fetchone()[0]
    rows=db.execute("""select w.split,count(*),sum(q.work is not null) from p62.documents d join p62.work_keys w using(lineage)
      left join work_quarantine q using(work) group by w.split""").fetchall()
    result={"status":"EXECUTED","scope":"Observed JSON source identities in committed broader corpus against all frozen JSON work keys",
       "source_key_multiple_frozen_work_groups":sourceleaks,"exact_structure_multiple_frozen_work_groups":textbridges,
       "work_components_with_other_observed_structure":db.execute("select count(*) from work_quarantine").fetchone()[0],
       "frozen_structure_counts_and_quarantined_by_original_split":rows,
       "rule":"Different observed structure under the same document/file key triggers conservative exclusion; no automatic semantic merging.",
       "global_work_independence":"HOLD_UNOBSERVED_CROSS_ID_SUBSETS_AND_REVISED_TEXT",
       "wall_seconds":time.monotonic()-start,"human_accuracy":None}
    (out/"SOURCE_WORK_EXCLUSION_EVIDENCE.json").write_text(json.dumps(result,indent=2),encoding="utf8")
    (out/"BROADER_SOURCE_QUARANTINE.private.json").write_text(json.dumps({"source_work_keys":[x[0] for x in db.execute("select work from work_quarantine")]}),encoding="utf8")
    db.close();print(json.dumps(result),flush=True)
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--root",required=True);p.add_argument("--out",required=True);a=p.parse_args();run(a.root,a.out)
