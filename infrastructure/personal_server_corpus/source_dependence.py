"""Descriptive source-release and duplicate-policy sensitivity on private parsed text."""
import argparse
import collections
import json
from pathlib import Path
import sqlite3

def analyze(run):
    db=sqlite3.connect(run/"corpus.sqlite")
    db.execute("CREATE TEMP TABLE conflicts AS SELECT doc_id FROM occurrences GROUP BY doc_id HAVING COUNT(DISTINCT flat)>1")
    db.execute("CREATE INDEX temp.conflicts_idx ON conflicts(doc_id)")
    selectors={
        "ALL_REPRESENTATION_OCCURRENCES":"1",
        "WITHIN_RELEASE_STRICT_TEXT_DEDUP":"o.rowid IN (SELECT MIN(x.rowid) FROM occurrences x JOIN members m ON m.key=x.member GROUP BY m.archive,x.strict)",
        "WITHIN_RELEASE_SOURCE_ID_NONCONFLICT":"o.doc_id NOT IN (SELECT doc_id FROM conflicts) AND o.rowid IN (SELECT MIN(x.rowid) FROM occurrences x JOIN members m ON m.key=x.member GROUP BY m.archive,x.doc_id)",
        "GLOBAL_JSON_STRICT_TEXT_DEDUP":"o.format='json' AND o.rowid IN (SELECT MIN(rowid) FROM occurrences WHERE format='json' GROUP BY strict)"
    }
    policies={}
    for policy,where in selectors.items():
        lanes={}
        for archive,fmt,year,feature in db.execute(
                "SELECT m.archive,o.format,o.year,o.feature FROM occurrences o JOIN members m ON m.key=o.member WHERE "+where):
            key=archive+":"+year
            c=lanes.setdefault(key,collections.Counter())
            c["documents"]+=1
            c.update(json.loads(feature))
        result=[]
        for key,c in sorted(lanes.items()):
            row={"source_year_lane":key,**dict(c)}
            row["geujung_per_million_characters"]=c["geujung"]*1e6/c["characters"] if c["characters"] else None
            row["ending_yo_share"]=c["ending_yo"]/c["orthographic_sentences"] if c["orthographic_sentences"] else None
            result.append(row)
        policies[policy]=result
    pairs=[]
    sql="""SELECT a.doc_id,a.flat,a.feature,b.flat,b.feature,ma.archive,mb.archive,a.strict,b.strict
      FROM occurrences a JOIN occurrences b ON a.doc_id=b.doc_id AND a.member<b.member
      JOIN members ma ON ma.key=a.member JOIN members mb ON mb.key=b.member
      WHERE ma.archive<>mb.archive"""
    paircounts={}
    for ident,fa,fea,fb,feb,ar,br,sa,sb in db.execute(sql):
        c=paircounts.setdefault(tuple(sorted((ar,br))),collections.Counter())
        c["same_id_occurrence_pairs"]+=1
        c["flat_text_equal_pairs"]+=int(fa==fb)
        c["strict_source_unit_list_equal_pairs"]+=int(sa==sb)
        if fa==fb:
            a,b=json.loads(fea),json.loads(feb)
            c["literal_geujung_count_equal_pairs"]+=int(a.get("geujung",0)==b.get("geujung",0))
    for (a,b),c in sorted(paircounts.items()):
        pairs.append({"archive_a":a,"archive_b":b,**dict(c)})
    weak=db.execute("""SELECT COUNT(*) FROM (
       SELECT json_extract(metadata,'$.document.title'),
              json_extract(metadata,'$.document.publisher'),
              json_extract(metadata,'$.document.date')
       FROM occurrences GROUP BY 1,2,3 HAVING COUNT(DISTINCT doc_id)>1 AND COUNT(DISTINCT flat)>1)""").fetchone()[0]
    report={"status":"EXECUTED","experiment":"CORPUS_SOURCE_DEPENDENCE",
        "scope":"Exact processed cohort; nonrandom, not a full population estimate",
        "policies":policies,"cross_release_same_id_pairs":pairs,
        "weak_title_publisher_date_groups_with_different_ids_and_text":weak,
        "same_id_text_conflict_groups":db.execute("SELECT COUNT(*) FROM conflicts").fetchone()[0],
        "scientific_ceiling":"Literal surface realization and representation sensitivity only",
        "not_measured":["referent recoverability","ellipsis gold","human preference","causal temporal effect","AI authorship"],
        "semantic_variant_adjudication":"HOLD; no variant deleted or chosen as authoritative",
        "split":"All development-exposed; no source-work-disjoint evaluation holdout claimed"}
    (run/"SOURCE_DEPENDENCE_EXPERIMENT.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
    text="# Source-dependence experiment\n\nStatus: EXECUTED, descriptive cohort only.\n\n"
    text+="Matched source IDs expose cross-format comparability directly. A flattened text match ignores source-unit boundaries and whitespace but retains markup and punctuation, so it is not semantic equivalence. Strict text deduplication preserves boundaries. Different same-ID text is retained and excluded from the nonconflicting-ID policy.\n\n"
    text+="| Release pair | Same-ID occurrence pairs | Flat text matches | Literal-marker count agreement among matches |\n|---|---:|---:|---:|\n"
    for x in pairs:
        text+=f"| {x['archive_a']} / {x['archive_b']} | {x['same_id_occurrence_pairs']} | {x['flat_text_equal_pairs']} | {x.get('literal_geujung_count_equal_pairs',0)} |\n"
    text+=f"\nWeak metadata-only groups: {weak:,}. These do not authorize merging. Same-ID text conflict groups: {report['same_id_text_conflict_groups']:,}. These do not establish revised meaning without private semantic review.\n\n"
    text+="Source/year rates under four policies are retained in the adjacent JSON. No genre or temporal generalization is admitted from the selected small-member cohort. No linguistic model, human preference, antecedent gold, causal effect or successful revision is claimed.\n"
    (run/"SOURCE_DEPENDENCE_EXPERIMENT.md").write_text(text,encoding="utf-8")
    db.close()
    print(json.dumps({"status":"EXECUTED","pairs":pairs,"weak_metadata_groups":weak,"conflicting_source_ids":report["same_id_text_conflict_groups"]}))
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--run",type=Path,required=True)
    analyze(p.parse_args().run)

