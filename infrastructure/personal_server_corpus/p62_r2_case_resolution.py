"""Exact unit-level review of remaining same-source-ID CSV/JSON candidates."""
import argparse,collections,gzip,hashlib,io,json,pathlib,sqlite3,time,zipfile
import pipeline as parser
from p62_reference import digest
from p62_r2 import exact_relation
def run(root,out):
    root=pathlib.Path(root);out=pathlib.Path(out);start=time.monotonic()
    db=sqlite3.connect((out/"R2_IDENTITY.private.sqlite").as_uri(),uri=True,timeout=30)
    db.execute("attach database ? as src",((root/"70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite").as_uri()+"?mode=ro",))
    db.execute("attach database ? as active",((root/"70_RUNS/corpus_sprint_20261011_main/corpus.sqlite").as_uri()+"?mode=ro",))
    rows=db.execute("""select distinct i.member,i.ordinal,i.strict,o.strict,o.doc_id,o.file_id,m.archive,m.name,m.sha256
      from active_id_candidates i join outside o using(member,ordinal) join src.members m on m.key=o.member
      where not exists(select 1 from active_flat_matches f where f.member=i.member and f.ordinal=i.ordinal)
      UNION SELECT DISTINCT o.member,o.ordinal,p.strict,o.strict,o.doc_id,o.file_id,m.archive,m.name,m.sha256
      FROM pending_json_links p JOIN outside o ON o.doc_id=p.doc_id AND o.file_id=p.file_id JOIN src.members m ON m.key=o.member
      WHERE p.strict<>o.strict AND p.flat<>o.flat""").fetchall()
    requested=collections.defaultdict(set);jsonwanted=set()
    for mem,ord,jstrict,cstrict,doc,file,archive,name,sha in rows:requested[mem].add(ord);jsonwanted.add(jstrict)
    csvforms={};csvmeta={};receipts=[]
    for mem,ordinals in requested.items():
        archive,name,expected=db.execute("select archive,name,sha256 from src.members where key=?",(mem,)).fetchone()
        memberbytes=0;h=hashlib.sha256();nd=0;nu=0
        class Hashed(io.RawIOBase):
            def readable(self):return True
            def readinto(self,b):
                nonlocal memberbytes
                data=raw.read(len(b));b[:len(data)]=data;h.update(data);memberbytes+=len(data);return len(data)
        with zipfile.ZipFile(root/"10_INBOX/nikl_legacy_14zip"/archive) as z,z.open(name) as raw:
            stream=io.TextIOWrapper(io.BufferedReader(Hashed()),encoding="utf-8-sig",newline="")
            for file_id,filemeta,doc in parser.csv_docs(stream):
                units=parser.validate(doc,"csv");nu+=len(units)
                if nd in ordinals:
                    forms=[u["form"] for u in units];strict,flat=parser.fingerprints(forms)
                    expectedstrict=db.execute("select strict from outside where member=? and ordinal=?",(mem,nd)).fetchone()[0]
                    if strict!=expectedstrict:raise RuntimeError("CSV source custody mismatch")
                    csvforms[(mem,nd)]=forms;csvmeta[(mem,nd)]=[u["id"] for u in units]
                nd+=1
        if h.hexdigest()!=expected:raise RuntimeError("CSV member bytes changed")
        receipts.append({"source_member":mem,"sha256":h.hexdigest(),"bytes":memberbytes,"documents":nd,"rows":nu,"EOF_CRC_verified":True})
        print(json.dumps({"phase":"RAW_CSV_CASE_REVIEW","members":len(receipts),"rows":sum(x["rows"] for x in receipts)}),flush=True)
    jsonforms={};paths={}
    for strict in jsonwanted:
        row=db.execute("""select s.path,s.sha256 from active.canonical c join active.shards s on s.member=c.first_member
            where c.strict=? and s.kind='paragraphs'""",(strict,)).fetchone()
        if not row:
            member,doc_id,file_id=db.execute("select json_member,doc_id,file_id from pending_json_links where strict=? limit 1",(strict,)).fetchone()
            archive=root/"10_INBOX/nikl_legacy_14zip/NIKLNEWSPAPER_2022_v1.0_JSON.zip"
            with zipfile.ZipFile(archive) as z,z.open(member) as raw:
                stream=io.TextIOWrapper(raw,encoding="utf-8-sig",newline="")
                for fid,fmeta,doc in parser.json_docs(stream):
                    if doc["id"]==doc_id and fid==file_id:
                        forms=[u["form"] for u in parser.validate(doc,"json")]
                        if parser.fingerprints(forms)[0]!=strict:raise RuntimeError("Pending JSON changed")
                        jsonforms[strict]=forms
            continue
        paths[row[0]]=row[1]
    for path,sha in paths.items():
        if digest(path)!=sha:raise RuntimeError("JSON shard custody mismatch")
        current=None;forms=[]
        def flush():
            if current in jsonwanted:jsonforms[current]=list(forms)
        with gzip.open(path,"rt",encoding="utf8") as f:
            for x in map(json.loads,f):
                if x["document_variant"]!=current:flush();current=x["document_variant"];forms=[]
                forms.append(x["form"])
        flush()
    cases=[]
    for mem,ordinal,js,cs,doc,file,archive,name,sha in rows:
        a=csvforms[(mem,ordinal)];b=jsonforms[js];classification=exact_relation(a,b)
        cases.append({"CSV_member":mem,"CSV_ordinal":ordinal,"JSON_structure":js,"CSV_structure":cs,
            "classification":classification,"CSV_units":len(a),"JSON_units":len(b),
            "CSV_unit_id_sha256":hashlib.sha256(json.dumps(csvmeta[(mem,ordinal)]).encode()).hexdigest(),
            "source_ids_match":True,"semantic_revision_proven":False,
            "span_transport_admitted":classification=="EXACT_ORDERED_UNITS",
            "same_work_candidate_only":classification=="UNRESOLVED"})
    result={"status":"EXECUTED","scope":"All larger-committed-JSON source-ID-only candidates for frozen outside occurrences",
        "candidate_occurrences":len(set((x[0],x[1]) for x in rows)),"candidate_pairs":len(cases),
        "classifications":dict(collections.Counter(x["classification"] for x in cases)),
        "raw_CSV_receipts":receipts,"JSON_shards_rehashed":len(paths),"cases":cases,
        "wall_seconds":time.monotonic()-start,"semantic_revision_claim":False,
        "rule":"Exact unchanged units and contiguous subsets only. Source IDs narrow candidates; unresolved text never merged.",
        "previous_P61_falsifications_preserved":True}
    (out/"SOURCE_ID_SUBSET_REVIEW.private.json").write_text(json.dumps(result,indent=2),encoding="utf8")
    db.close();print(json.dumps({k:v for k,v in result.items() if k not in {"cases","raw_CSV_receipts"}}),flush=True)
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--root",required=True);p.add_argument("--out",required=True);a=p.parse_args();run(a.root,a.out)
