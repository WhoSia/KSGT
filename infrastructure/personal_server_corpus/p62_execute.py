"""Execute P62 against frozen P61 inputs; never mutate the active ingestion database."""
import argparse, collections, datetime, gzip, hashlib, json, os, pathlib, shutil, sqlite3, time
from p62_reference import *
def ro(p):
    return sqlite3.connect(pathlib.Path(p).as_uri()+"?mode=ro",uri=True)
def write(out,name,value):
    (out/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def log(out,value):
    value.update(utc=datetime.datetime.now(datetime.timezone.utc).isoformat())
    with (out/"PROGRESS.jsonl").open("a",encoding="utf-8") as f:f.write(json.dumps(value)+"\n")
    print(json.dumps(value),flush=True)
def audit(source,p61,out,db):
    db.execute("ATTACH DATABASE ? AS prior",(str(p61/"P61_PRIVATE.sqlite"),))
    db.executescript("""CREATE TABLE IF NOT EXISTS documents AS SELECT variant,strict,lineage,family,year,units,known_new,conflict,normalized,secondary,bytes FROM prior.documents;
    CREATE UNIQUE INDEX IF NOT EXISTS strict_idx ON documents(strict);
    CREATE INDEX IF NOT EXISTS lineage_idx ON documents(lineage);
    CREATE TABLE IF NOT EXISTS work_keys(lineage INTEGER PRIMARY KEY,work TEXT UNIQUE,split TEXT);
    CREATE TABLE IF NOT EXISTS checkpoint(path TEXT PRIMARY KEY,sha TEXT,documents INTEGER);
    CREATE TABLE IF NOT EXISTS metrics(strict TEXT PRIMARY KEY,payload TEXT);
    CREATE TABLE IF NOT EXISTS packet(item TEXT PRIMARY KEY,payload TEXT);""")
    if db.execute("select count(*) from work_keys").fetchone()[0]==0:
        cur=None;members=[]
        def flush():
            if cur is not None:
                k=key(sorted(members),"P62-work-snapshot-v1")
                split="EVALUATION" if int(key([k],"P62-split-v1")[:8],16)%5==0 else "DEVELOPMENT"
                db.execute("insert into work_keys values(?,?,?)",(cur,k,split))
        for strict,lineage in db.execute("select strict,lineage from documents order by lineage,strict"):
            if lineage!=cur:flush();cur=lineage;members=[]
            members.append(strict)
        flush();db.commit()
    s=ro(source)
    total=s.execute("select count(*) from occurrences").fetchone()[0]
    tally=collections.Counter();conflicts=[];repeated=0;crossfile=0
    for doc,file,n,strict,flat in s.execute("""select doc_id,file_id,count(*),count(distinct strict),count(distinct flat)
            from occurrences where doc_id<>'' group by doc_id,file_id having count(*)>1"""):
        repeated+=1
        if strict==1:tally["EXACT_STRUCTURAL_IDENTITY_GROUPS"]+=1
        elif flat==1:tally["SAME_FLATTENED_TEXT_DIFFERENT_STRUCTURE_GROUPS"]+=1
        else:
            tally["DIFFERENT_TEXT_SOURCE_KEY_GROUPS"]+=1
            conflicts.append({"private_doc_id":doc,"private_file_id":file,"occurrences":n,"structures":strict,"flat_versions":flat})
    crossfile=s.execute("select count(*) from (select doc_id from occurrences where doc_id<>'' group by doc_id having count(distinct file_id)>1)").fetchone()[0]
    normalized=db.execute("select count(*) from (select normalized,secondary,bytes from documents group by normalized,secondary,bytes having count(*)>1)").fetchone()[0]
    missing=s.execute("select sum(doc_id=''),sum(file_id='') from occurrences").fetchone()
    resolved=json.loads((p61/"CONFLICT_FRAGMENT_RESOLUTION.json").read_text(encoding="utf-8"))
    write(out,"SOURCE_WORK_LINEAGE_AUDIT.json",{"status":"EXECUTED","scope":"All frozen P61 source occurrences; not full active corpus","source_occurrences":total,
        "json_structures":db.execute("select count(*) from documents").fetchone()[0],"repeated_source_key_groups":repeated,"classification":dict(tally),
        "normalized_multi_structure_groups":normalized,"cross_file_same_document_id_groups":crossfile,"missing_doc_id":missing[0],"missing_file_id":missing[1],
        "p61_six_case_resolution_inherited_with_hash":digest(p61/"CONFLICT_FRAGMENT_RESOLUTION.json"),"different_text_groups":len(conflicts),
        "identity_rules":"No weak metadata or approximate-similarity merge; exact source keys and prior exact text graph only. Alternative structures retained.",
        "global_source_work_identity":"HOLD","candidate_revised_text":"Not established; different text requires subset/continuation review","known_fragment_resolution":resolved})
    write(out,"SOURCE_ID_CONFLICTS.private.json",conflicts)
    # Audit observed identity links against snapshot work split without exporting IDs.
    s.execute("ATTACH DATABASE ? AS new",(str(out/"P62_PRIVATE.sqlite"),))
    leaks=s.execute("""select count(*) from (select o.doc_id,o.file_id from occurrences o join new.documents d on d.strict=o.strict
         join new.work_keys w on w.lineage=d.lineage where o.doc_id<>'' group by o.doc_id,o.file_id having count(distinct w.split)>1)""").fetchone()[0]
    years=db.execute("select split,count(distinct year) from documents d join work_keys w using(lineage) group by split").fetchall()
    bysplit=db.execute("select split,count(*),count(distinct lineage) from documents d join work_keys w using(lineage) group by split").fetchall()
    crossfamily=db.execute("select count(*) from (select lineage from documents group by lineage having count(distinct family)>1)").fetchone()[0]
    write(out,"SOURCE_WORK_DISJOINTNESS_REPORT.json",{"status":"EXECUTED","split_counts":bysplit,"actual_year_counts":years,"observed_source_key_cross_split_groups":leaks,
        "cross_family_components":crossfamily,"split_rule":"Domain-framed SHA-256 of sorted strict component membership; mod 5 = 0 evaluation",
        "independence":"EXPLORATORY_PREVIOUSLY_EXPOSED","not_certified":["Global same-work independence","Full-corpus fragment completeness","Fresh confirmatory holdout"],
        "fragment_guard":"P61 component graph plus six reviewed fragment/subset corrections; unresolved source changes remain HOLD"})
    if leaks:raise RuntimeError("HOLD_SOURCE_KEY_SPLIT_LEAK")
    s.close();log(out,{"phase":"IDENTITY_AUDIT","status":"EXECUTED","groups":dict(tally)})
def run(a):
    out=pathlib.Path(a.out);out.mkdir(exist_ok=True,parents=True)
    lock=json.loads((out/"EXECUTION_LOCK.json").read_text(encoding="utf-8"))
    for name,p in lock["locked_paths"].items():
        if digest(p["path"])!=p["sha256"]:raise RuntimeError("Frozen input/code mismatch: "+name)
    db=sqlite3.connect(out/"P62_PRIVATE.sqlite");db.execute("pragma journal_mode=WAL");db.execute("pragma cache_size=-32768")
    source=pathlib.Path(a.source);p61=pathlib.Path(a.p61)
    audit(source,p61,out,db)
    packets=collections.defaultdict(list)
    with gzip.open(p61/"ADJUDICATION_PACKET.private.jsonl.gz","rt",encoding="utf-8") as f:
        for x in map(json.loads,f):packets[x["strict_structure"]].append(x)
    con=ro(source);paths=con.execute("select path,sha256 from shards where kind='paragraphs' order by path").fetchall()
    completed=dict(db.execute("select path,sha from checkpoint"));count=0
    start=time.monotonic()
    for path,expected in paths:
        if path in completed:
            if digest(path)!=completed[path]:raise RuntimeError("Completed shard changed")
            continue
        if shutil.disk_usage(out).free<60*1024**3:raise RuntimeError("HOLD_DISK_RESERVE")
        if digest(path)!=expected:raise RuntimeError("Frozen source shard hash mismatch")
        current=None;forms=[];nd=0
        def flush():
            nonlocal count,nd
            if current is None:return
            d=db.execute("select d.variant,d.family,d.year,d.units,d.lineage,w.work,w.split from documents d join work_keys w using(lineage) where strict=?",(current,)).fetchone()
            if not d:raise RuntimeError("Unknown structure")
            assert len(forms)==d[3]
            totals=collections.defaultdict(lambda:[0,0]);stats=collections.Counter();broad=0;targets=0
            for i,text in enumerate(forms):
                broad+=len(list(DEMONSTRATIVE.finditer(text)))
                for m in TARGET.finditer(text):
                    targets+=1;target={"unit":i,"start":m.start(),"end":m.end(),"observed":True}
                    c,sm=summary(forms,target)
                    stats["intra_only_numeric"]+=sm["intra_only_numeric"];stats["future_only_numeric"]+=sm["future_only_numeric"]
                    stats["multiple_past_fragments"]+=sm["multiple_past_fragments"];stats["candidate_fragments"]+=len(c)
                    a=rank_candidate(forms,target,c);b=rank_candidate(forms,target,c,"LEXICAL")
                    stats["rule_comparison_targets"]+=1
                    stats["structural_vs_lexical_disagreement"]+=(a or {}).get("candidate_id")!=(b or {}).get("candidate_id")
                    stats["no_past_candidate_targets"]+=a is None
                    stats["excluded_symmetric_two"]+=not sm["eligible"]
                    for k,v in sm["measures"].items():totals[k][0]+=1;totals[k][1]+=v
            payload={"strict":current,"work":d[5],"split":d[6],"family":d[1],"year":d[2],"units":d[3],
                     "targets":targets,"additional_demonstrative_surfaces":broad,"stats":dict(stats),
                     "metrics":{k:{"n":v[0],"mean":v[1]/v[0]} for k,v in totals.items()}}
            db.execute("insert into metrics values(?,?)",(current,json.dumps(payload)))
            for original in packets.get(current,[]):
                if original["target_start"] is None:
                    target={"unit":original["target_unit"],"start":0,"end":0,"observed":False,"type":"PSEUDOANCHOR_NO_OBSERVED_TARGET"}
                else:
                    target={"unit":original["target_unit"],"start":original["target_start"],"end":original["target_end"],"observed":True}
                    assert TARGET.fullmatch(forms[target["unit"]][target["start"]:target["end"]])
                item=observation(forms,target,original,d[5])
                item["split"]=d[6];item["family"]=d[1];item["publication_year"]=d[2];item["document_units"]=d[3]
                item["packet_hash"]=key([json.dumps(item,ensure_ascii=False,sort_keys=True)],"P62-item-v1")
                db.execute("insert into packet values(?,?)",(item["item_id"],json.dumps(item,ensure_ascii=False)))
            count+=1;nd+=1
        with gzip.open(path,"rt",encoding="utf-8") as f:
            for row in map(json.loads,f):
                if row["document_variant"]!=current:flush();current=row["document_variant"];forms=[]
                forms.append(row["form"])
        flush();db.execute("insert into checkpoint values(?,?,?)",(path,expected,nd));db.commit()
        if count%30000<nd:log(out,{"status":"RUNNING","phase":"SPAN_CENSUS","documents_this_invocation":count})
        if a.stop_after and count>=a.stop_after:raise RuntimeError("INJECTED_BOUNDED_STOP")
    report(out,db,start)
    db.close();con.close()
def report(out,db,start):
    sums=collections.Counter();rows=collections.defaultdict(list);den=collections.Counter();strata=collections.defaultdict(list)
    for strict,payload in db.execute("select strict,payload from metrics"):
        x=json.loads(payload);sums["structures"]+=1;sums["paragraphs"]+=x["units"];sums["targets"]+=x["targets"]
        sums["zero_target_structures"]+=x["targets"]==0;sums["additional_demonstrative_surfaces"]+=x["additional_demonstrative_surfaces"];sums.update(x["stats"])
        for metric,m in x["metrics"].items():
            r=(x["work"],strict,m["mean"]);rows[metric].append(r);den[metric]+=m["n"]
            for label in [x["family"],"YEAR/"+x["year"],"SPLIT/"+x["split"],"LENGTH/"+("SHORT" if x["units"]<10 else "MID" if x["units"]<40 else "LONG")]:
                strata[label+"/"+metric].append(r)
    results={k:{**bootstrap(v),"eligible_targets":den[k],"authority":"MACHINE_PROVISIONAL"} for k,v in rows.items()}
    sub={k:bootstrap(v,300) for k,v in strata.items()}
    write(out,"MACHINE_CANDIDATE_AUDIT.json",{"status":"EXECUTED","counts":dict(sums),"metrics":results,"strata":sub,"wall_seconds_this_invocation":time.monotonic()-start,
         "semantic_recovery_estimand":"NOT_EXECUTED_NO_HUMAN_LABELS","topic_argument_is_not_coreference":True})
    items=[json.loads(p) for p, in db.execute("select payload from packet order by item")]
    assert len(items)==2400 and all(x["human_ground_truth"] is None for x in items)
    with gzip.open(out/"ADJUDICATION_PACKET.private.jsonl.gz","wt",encoding="utf-8") as f:
        for x in items:f.write(json.dumps(x,ensure_ascii=False)+"\n")
    quality=collections.Counter();candidatecounts=[]
    for x in items:
        ctx={p["unit"]:p["text"] for p in x["context"]}
        if x["target"]["observed"]:validate_span(x["target"],ctx)
        quality["pseudoanchor_items"]+=not x["target"]["observed"]
        quality["pseudoanchor_has_other_demonstrative"]+=not x["target"]["observed"] and bool(DEMONSTRATIVE.search(ctx[x["target"]["unit"]]))
        quality["pseudoanchor_has_literal_target"]+=not x["target"]["observed"] and bool(TARGET.search(ctx[x["target"]["unit"]]))
        quality["no_candidate_items"]+=len(x["candidates"])==0
        quality["possible_intra_past_items"]+=any(c["relation"]=="PAST_INTRA" for c in x["candidates"])
        quality["possible_future_control_items"]+=any(c["relation"].startswith("FUTURE") for c in x["candidates"])
        quality["metalinguistic_surface_items"]+=bool(META.search(ctx[x["target"]["unit"]]))
        quality["inferred_omission_prompts"]+=len(x["inferred_omissions"])
        for c in x["candidates"]:validate_span(c,ctx)
        candidatecounts.append(len(x["candidates"]))
    write(out,"ADJUDICATION_PACKET_MANIFEST.json",{"status":"VERIFIED","items":len(items),"source_structures":len(set(x["strict_structure"] for x in items)),
         "population":"Unchanged P61 stratified instrument; not representative random sample","all_human_ground_truth_null":True,
         "independent_human_judgments":0,"quality_counts":dict(quality),"candidate_fragments":sum(candidatecounts),"maximum_candidates_per_item":max(candidatecounts),
         "packet_sha256":digest(out/"ADJUDICATION_PACKET.private.jsonl.gz"),
         "masking":"Prediction and release labels hidden; candidate order independently randomized by A/B slot; chronology visible, not certified double-blind",
         "reliability":reliability({x["item_id"]:x for x in items},[])})
    review=out/"private_review";review.mkdir(exist_ok=True)
    # Preserve population and all cases. A priority list is a separate view.
    for slot in ["A","B"]:
        ordered=sorted(items,key=lambda x:key([x["item_id"],slot],"P62-item-order"))
        for b in range(0,len(ordered),100):
            (review/("review_"+slot+"_"+str(b//100+1).zfill(2)+".private.html")).write_text(review_html(ordered[b:b+100],slot),encoding="utf-8")
    priority=sorted(items,key=lambda x:(-(x["machine_predictions"]["multiple_past_fragments"]+x["machine_predictions"]["intra_only_numeric"]+x["machine_predictions"]["future_only_numeric"]),x["item_id"]))
    write(out,"PRIORITY_VIEW.private.json",{"population_unchanged":True,"purpose":"Review prioritization only, not an evaluation subset","item_order":[x["item_id"] for x in priority]})
    db.execute("pragma wal_checkpoint(TRUNCATE)")
    log(out,{"status":"EXECUTED","phase":"P62_COMPLETE","counts":dict(sums),"packet_items":len(items)})
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--source",required=True);p.add_argument("--p61",required=True);p.add_argument("--out",required=True);p.add_argument("--stop-after",type=int,default=0)
    run(p.parse_args())

