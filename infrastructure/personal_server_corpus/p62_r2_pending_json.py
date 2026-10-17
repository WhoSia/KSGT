"""Read-only source-lineage audit of pending 2022 JSON release members."""
import argparse,datetime,hashlib,io,json,pathlib,sqlite3,time,zipfile
import pipeline as parser
def run(root,out):
    root=pathlib.Path(root);out=pathlib.Path(out);start=time.monotonic()
    archive=root/"10_INBOX/nikl_legacy_14zip/NIKLNEWSPAPER_2022_v1.0_JSON.zip"
    db=sqlite3.connect((out/"R2_IDENTITY.private.sqlite").as_uri(),uri=True)
    db.execute("ATTACH DATABASE ? AS active",((root/"70_RUNS/corpus_sprint_20261011_main/corpus.sqlite").as_uri()+"?mode=ro",))
    committed={n for n, in db.execute("select name from active.members where archive=?",(archive.name,))}
    db.execute("""create table if not exists pending_json_links(
        json_member text,json_ordinal int,doc_id text,file_id text,strict text,flat text,
        primary key(json_member,json_ordinal))""")
    db.execute("create index if not exists pending_id on pending_json_links(doc_id,file_id)")
    db.execute("create index if not exists pending_strict on pending_json_links(strict)")
    db.execute("create index if not exists pending_flat on pending_json_links(flat)")
    counts={"parsed_documents":0,"source_id_candidate_documents":0};receipts=[]
    with zipfile.ZipFile(archive) as z:
        members=[x for x in z.infolist() if x.filename.lower().endswith(".json") and x.filename not in committed]
        for member in members:
            h=hashlib.sha256();nbytes=0;nd=0;matched=0
            class Hashed(io.RawIOBase):
                def readable(self):return True
                def readinto(self,b):
                    nonlocal nbytes
                    data=raw.read(len(b));b[:len(data)]=data;nbytes+=len(data);h.update(data);return len(data)
            with z.open(member) as raw:
                text=io.TextIOWrapper(io.BufferedReader(Hashed()),encoding="utf-8-sig",newline="")
                for file_id,file_meta,doc in parser.json_docs(text):
                    counts["parsed_documents"]+=1
                    found=db.execute("select 1 from outside where doc_id=? and file_id=? limit 1",(doc["id"],file_id)).fetchone()
                    if found:
                        units=parser.validate(doc,"json");strict,flat=parser.fingerprints([x["form"] for x in units])
                        db.execute("insert or ignore into pending_json_links values(?,?,?,?,?,?)",
                            (member.filename,nd,doc["id"],file_id,strict,flat));matched+=1;counts["source_id_candidate_documents"]+=1
                    nd+=1
            if nbytes!=member.file_size:raise RuntimeError("Member EOF length mismatch")
            receipts.append({"member":member.filename,"bytes":nbytes,"sha256":h.hexdigest(),"documents":nd,"source_id_candidates":matched,"EOF_CRC_verified":True})
            db.commit();print(json.dumps({"status":"RUNNING","completed_members":len(receipts),"parsed_documents":counts["parsed_documents"]}),flush=True)
    exact=db.execute("""select count(*) from outside o where not exists(select 1 from active_exact_matches a where a.member=o.member and a.ordinal=o.ordinal)
      and exists(select 1 from pending_json_links p where p.strict=o.strict)""").fetchone()[0]
    flat=db.execute("""select count(*) from outside o where not exists(select 1 from active_exact_matches a where a.member=o.member and a.ordinal=o.ordinal)
      and not exists(select 1 from pending_json_links p where p.strict=o.strict)
      and exists(select 1 from pending_json_links p where p.flat=o.flat)""").fetchone()[0]
    conflicts=db.execute("""select count(*) from outside o where not exists(select 1 from active_exact_matches a where a.member=o.member and a.ordinal=o.ordinal)
      and exists(select 1 from pending_json_links p where p.doc_id=o.doc_id and p.file_id=o.file_id)
      and not exists(select 1 from pending_json_links p where p.strict=o.strict or p.flat=o.flat)""").fetchone()[0]
    result={"status":"EXECUTED","archive":archive.name,"scope":"All source members uncommitted at audit start; read-only ZIP streaming, not another ingestion controller",
       "parsed_documents":counts["parsed_documents"],"source_id_candidate_documents":counts["source_id_candidate_documents"],
       "new_exact_structure_occurrences":exact,"new_normalized_flat_only_occurrences":flat,
       "source_id_text_conflicts":conflicts,"member_count":len(receipts),"members":receipts,
       "wall_seconds":time.monotonic()-start,"corpus_or_checkpoint_mutated":False,
       "frozen_evaluation_changed":False,"semantic_equivalence_claim":False}
    (out/"PENDING_RELEASE_GENEALOGY_AUDIT.private.json").write_text(json.dumps(result,indent=2),encoding="utf8")
    db.close();print(json.dumps({k:v for k,v in result.items() if k!="members"}),flush=True)
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--root",required=True);p.add_argument("--out",required=True);a=p.parse_args();run(a.root,a.out)
