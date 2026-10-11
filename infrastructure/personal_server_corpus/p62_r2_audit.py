"""Exhaustive frozen CSV representation audit and private packet readiness census."""
import argparse, collections, datetime, gzip, hashlib, json, pathlib, shutil, sqlite3, time
from p62_reference import digest, key, rank_candidate
from p62_r2 import *

def write(out, name, obj):
    (out/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

def run(root,out):
    root=pathlib.Path(root);out=pathlib.Path(out);start=time.monotonic()
    if shutil.disk_usage(root).free < 60*1024**3: raise RuntimeError("HOLD_DISK_RESERVE")
    prior=root/"80_EXPORT/p62_referential_grounding_20261011"
    db=sqlite3.connect((out/"R2_IDENTITY.private.sqlite").as_uri(),uri=True)
    db.execute("pragma cache_size=-32768")
    db.execute("pragma temp_store=FILE")
    db.execute("ATTACH DATABASE ? AS src",((root/"70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite").as_uri()+"?mode=ro",))
    db.execute("ATTACH DATABASE ? AS p62",((prior/"P62_PRIVATE.sqlite").as_uri()+"?mode=ro",))
    db.executescript("""
    CREATE TABLE IF NOT EXISTS json_refs AS SELECT DISTINCT o.strict,o.flat,w.work,w.split
    FROM src.occurrences o JOIN p62.documents d ON d.strict=o.strict JOIN p62.work_keys w USING(lineage)
    WHERE o.format='json';
    CREATE UNIQUE INDEX IF NOT EXISTS json_strict ON json_refs(strict);
    CREATE INDEX IF NOT EXISTS json_flat ON json_refs(flat);
    CREATE TABLE IF NOT EXISTS json_ids AS SELECT DISTINCT o.doc_id,o.file_id,w.work,o.strict
    FROM src.occurrences o JOIN p62.documents d ON d.strict=o.strict JOIN p62.work_keys w USING(lineage)
    WHERE o.format='json';
    CREATE INDEX IF NOT EXISTS json_id ON json_ids(doc_id,file_id);
    CREATE TABLE IF NOT EXISTS outside AS SELECT o.member,o.ordinal,o.doc_id,o.file_id,o.strict,o.flat,o.year,m.archive
    FROM src.occurrences o JOIN src.members m ON m.key=o.member
    WHERE o.format='csv' AND NOT EXISTS(SELECT 1 FROM json_refs j WHERE j.strict=o.strict);
    CREATE UNIQUE INDEX IF NOT EXISTS outside_key ON outside(member,ordinal);
    CREATE INDEX IF NOT EXISTS outside_flat ON outside(flat);
    CREATE INDEX IF NOT EXISTS outside_id ON outside(doc_id,file_id);
    CREATE TABLE IF NOT EXISTS links AS
    SELECT DISTINCT o.member,o.ordinal,j.work,j.strict,'EXACT_NORMALIZED_FLAT' AS evidence
    FROM outside o JOIN json_refs j ON j.flat=o.flat
    UNION SELECT DISTINCT o.member,o.ordinal,j.work,j.strict,'SOURCE_ID_CANDIDATE' AS evidence
    FROM outside o JOIN json_ids j ON j.doc_id=o.doc_id AND j.file_id=o.file_id;
    CREATE INDEX IF NOT EXISTS link_occ ON links(member,ordinal);
    CREATE INDEX IF NOT EXISTS link_work ON links(work);
    """)
    db.commit()
    total=db.execute("select count(*) from outside").fetchone()[0]
    if total!=948240: raise RuntimeError("Frozen outside population changed")
    counts=dict(db.execute("""select policy,count(*) from (
    select o.member,o.ordinal,case
    when exists(select 1 from links l where l.member=o.member and l.ordinal=o.ordinal and evidence='EXACT_NORMALIZED_FLAT') then 'EXACT_NORMALIZED_FLAT_LINK'
    when exists(select 1 from links l where l.member=o.member and l.ordinal=o.ordinal and evidence='SOURCE_ID_CANDIDATE') then 'SOURCE_ID_REQUIRES_TEXT_REVIEW'
    else 'NO_EXACT_FLAT_OR_SOURCE_ID_LINK' end policy from outside o) group by policy"""))
    unique_csv=db.execute("select count(distinct strict),count(distinct flat) from outside").fetchone()
    crosssplit=db.execute("""select count(*) from (select l.member,l.ordinal from links l join json_refs j on j.strict=l.strict
    group by l.member,l.ordinal having count(distinct j.split)>1)""").fetchone()[0]
    linkedworks=[w for w, in db.execute("select distinct work from links")]
    write(out,"CSV_OUTSIDE_GRAPH_AUDIT.json",{
        "status":"EXECUTED","scope":"All 948,240 frozen outside-JSON CSV occurrences; not full active corpus",
        "occurrences":total,"unique_strict_and_normalized_flat":unique_csv,"classifications":counts,
        "linked_JSON_work_components":len(linkedworks),"outside_occurrences_bridging_P62_splits":crosssplit,
        "by_release":[list(x) for x in db.execute("select archive,count(*),count(distinct strict) from outside group by archive")],
        "by_publication_year":[list(x) for x in db.execute("select year,count(*) from outside group by year")],
        "authority":"Normalized flat matches are whitespace/NFC diagnostic exclusion links, not byte identity or semantic equivalence; source ID alone remains a candidate",
        "unresolved":"No title or approximate-similarity linking. Unmatched records are quarantined from evaluation, not certified independent.",
        "source_hash":digest(root/"70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite"),
        "P62_manifest_hash":digest(prior/"SHA256_OUTPUT_MANIFEST.json")})
    write(out,"CSV_LINKED_WORK_EXCLUSIONS.private.json",{"source_work_keys":linkedworks})
    print(json.dumps({"phase":"CSV_LINK_AUDIT","status":"EXECUTED","counts":counts}),flush=True)
    with gzip.open(prior/"ADJUDICATION_PACKET_V2.private.jsonl.gz","rt",encoding="utf-8") as f:items=list(map(json.loads,f))
    groups=group_targets(items);policies=collections.Counter();unique=[];quarantine=[];dups=[]
    for ident,group in groups.items():
        dc=duplicate_contract(group);policies[dc["policy"]]+=1
        for x in group:
            if x["human_ground_truth"] is not None or x["independent_adjudications"]:raise RuntimeError("Unexpected human labels before seal")
            for c in x["candidates"]:candidate_identity(x,c)
        if dc["status"]=="HOLD":quarantine.extend(x["item_id"] for x in group);continue
        chosen=min(group,key=lambda x:x["item_id"]);chosen=dict(chosen)
        chosen["r2_target_identity"]=ident
        chosen["original_view_item_ids"]=sorted(x["item_id"] for x in group)
        chosen["r2_negative_taxonomy"]=negative_taxonomy(chosen)
        unique.append(chosen)
        if len(group)>1:dups.append({"identity":ident,**dc,"item_ids":chosen["original_view_item_ids"],
            "strata":[x["original_stratum"] for x in group]})
    observed=[x for x in unique if x["target"]["observed"]]
    duplicate_observed={d["identity"] for d in dups}
    excworks=set(linkedworks)
    admitted=[x for x in observed if x["source_work_key"] not in excworks]
    write(out,"TARGET_IDENTITY_AND_DUPLICATE_POLICY.json",{
        "status":"VERIFIED","original_items":len(items),"original_observed_views":sum(x["target"]["observed"] for x in items),
        "unique_all_targets_and_pseudoanchors":len(unique),"unique_observed_targets":len(observed),
        "collapsed_extra_views":len(items)-len(unique),"duplicate_observed_groups":len(duplicate_observed),
        "conflicting_view_items_quarantined":len(quarantine),"policies":dict(policies),
        "primary_denominators":{"ALL_VIEWS_INVALID":sum(x["target"]["observed"] for x in items),
        "COLLAPSE_IDENTICAL_TARGETS":len(observed),
        "EXCLUDE_ALL_REPEATED_TARGET_GROUPS":sum(x["r2_target_identity"] not in duplicate_observed for x in observed),
        "CSV_LINKED_WORK_EXCLUSION":len(admitted)},
        "contract":"Domain-framed SHA256(work snapshot,strict structure,unit,Unicode start,end,observed flag,exact target text). No approximate span transport.",
        "duplicates_private":dups,"quarantined_items":quarantine,"human_accuracy":None})
    pseudo=[x for x in unique if not x["target"]["observed"]]
    taxonomy=collections.Counter(x["r2_negative_taxonomy"]["tier"] for x in pseudo)
    types=collections.Counter(t for x in pseudo for t in x["r2_negative_taxonomy"]["surface_types"])
    strata=collections.defaultdict(collections.Counter)
    for x in pseudo:strata[x["family"]][x["r2_negative_taxonomy"]["tier"]]+=1
    write(out,"PSEUDOANCHOR_ADMISSION_AUDIT.json",{
        "status":"EXECUTED","items":len(pseudo),"original_regex_contaminated_items":sum(x["r2_negative_taxonomy"]["original_demonstratives"]>0 for x in pseudo),
        "expanded_regex_contaminated_items":sum(x["r2_negative_taxonomy"]["expanded_demonstratives"]>0 for x in pseudo),
        "taxonomy":dict(taxonomy),"surface_type_counts":dict(types),
        "by_family":{k:dict(v) for k,v in strata.items()},
        "structural_placebos":sum(x["r2_negative_taxonomy"]["structural_placebo_admitted"] for x in pseudo),
        "semantic_negatives":0,"all_ground_truth_null":True,
        "rules":"Any literal target or screened demonstrative in pseudo unit is excluded from no-demonstrative placebo. Context-only forms are a separate persistence stratum. No semantic nonreference label without independent adjudication."})
    allstrata=collections.Counter(x["original_stratum"] for x in items)
    uniquestrata=collections.Counter(x["original_stratum"] for x in unique)
    feasibility=collections.Counter();differences=collections.Counter()
    for x in unique:
        forms={z["unit"]:z["text"] for z in x["context"]}
        a=rank_candidate(forms,x["target"],x["candidates"],"STRUCTURAL")
        b=rank_candidate(forms,x["target"],x["candidates"],"LEXICAL")
        disagreement=(a or {}).get("candidate_id")!=(b or {}).get("candidate_id")
        x["r2_policy_disagreement"]=disagreement
        feasibility["no_past_candidate"]+=a is None
        feasibility["over_24_candidates"]+=len(x["candidates"])>24
        feasibility["over_3000_context_characters"]+=sum(len(z["text"]) for z in x["context"])>3000
        feasibility["policy_disagreement"]+=disagreement
        x["r2_split"]=source_work_split(x["source_work_key"])
        x["r2_identity_admission"]="CSV_LINK_EXCLUDED" if x["source_work_key"] in excworks else "FROZEN_JSON_GRAPH_ONLY"
    write(out,"FULL_PACKET_READINESS_AUDIT.json",{
        "status":"EXECUTED","original_population":2400,"original_strata":dict(allstrata),
        "canonical_representative_strata":dict(uniquestrata),"unique_items":len(unique),
        "families":dict(collections.Counter(x["family"] for x in unique)),
        "actual_publication_years":dict(collections.Counter(x["publication_year"] for x in unique)),
        "feasibility":dict(feasibility),"original_stratum_inclusion_probability":"UNKNOWN; original priority reservoir is not a probability sample of corpus",
        "duplicate_stratum_policy":"Keep original strata and view IDs; canonical smallest item ID is custody-only, not population reweighting",
        "human_labels":0,"reviewer_qualification":"UNAVAILABLE; no self-attestation promotion"})
    # Source-work split is sealed independently of policy output and human labels.
    splitgroups=collections.defaultdict(set)
    for x in unique:splitgroups[x["r2_split"]].add(x["source_work_key"])
    if splitgroups["REVIEW_PILOT"]&splitgroups["SEALED_EVALUATION"]:raise RuntimeError("Work split leak")
    write(out,"REVIEW_EVALUATION_SPLIT_FREEZE.private.json",{
        "status":"VERIFIED","utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "rule":"Domain-framed source-work hash mod5; pilot if0. Duplicate views travel together.",
        "assignments":[{"target_identity":x["r2_target_identity"],"source_work_key":x["source_work_key"],
            "split":x["r2_split"],"item_id":x["item_id"],"identity_admission":x["r2_identity_admission"]} for x in unique],
        "work_overlap":0,"human_labels_inspected":0,"previous_exposure":"Exploratory machine development exposure retained"})
    with gzip.open(out/"UNIQUE_REVIEW_PACKET.private.jsonl.gz","wt",encoding="utf-8") as f:
        for x in sorted(unique,key=lambda x:x["r2_target_identity"]):f.write(json.dumps(x,ensure_ascii=False)+"\n")
    db.close()
    write(out,"R2_AUDIT_EXECUTION.json",{"status":"EXECUTED","wall_seconds":time.monotonic()-start,"human_judgments":0})
    print(json.dumps({"phase":"PACKET_AUDIT","status":"EXECUTED","unique":len(unique),"observed":len(observed),"taxonomy":dict(taxonomy)}),flush=True)

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--root",required=True);p.add_argument("--out",required=True)
    a=p.parse_args();run(a.root,a.out)
