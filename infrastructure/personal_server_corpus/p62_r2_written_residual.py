"""Bounded parsed-source review of written CSV records still quarantined after metadata audits."""
import argparse,collections,hashlib,io,json,pathlib,sqlite3,time,zipfile
import pipeline as parser
from p62_r2 import exact_relation
from p62_reference import digest
def run(root,out):
    root=pathlib.Path(root);out=pathlib.Path(out);start=time.monotonic()
    db=sqlite3.connect((out/"R2_IDENTITY.private.sqlite").as_uri(),uri=True)
    db.execute("attach database ? as src",((root/"70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite").as_uri()+"?mode=ro",))
    targets=db.execute("select member,ordinal,doc_id,file_id,strict,flat from final_csv_admission where admission='UNRESOLVED_QUARANTINE'").fetchall()
    lookup={(x[0],x[1]):x for x in targets};members=sorted({x[0] for x in targets})
    zip_path=root/"10_INBOX/nikl_legacy_14zip/NIKL_WRITTEN_v1.2_JSON.zip";cases=[];csvreceipts=[];jsonreceipts={}
    with zipfile.ZipFile(zip_path) as jz:
        file_candidates={pathlib.PurePosixPath(x.filename).stem:x for x in jz.infolist() if x.filename.lower().endswith(".json")}
        for memberkey in members:
            archive,name,expected=db.execute("select archive,name,sha256 from src.members where key=?",(memberkey,)).fetchone()
            memberbytes=0;h=hashlib.sha256();nd=0;nu=0
            class Hashed(io.RawIOBase):
                def readable(self):return True
                def readinto(self,b):
                    nonlocal memberbytes
                    data=raw.read(len(b));b[:len(data)]=data;h.update(data);memberbytes+=len(data);return len(data)
            with zipfile.ZipFile(root/"10_INBOX/nikl_legacy_14zip"/archive) as cz,cz.open(name) as raw:
                stream=io.TextIOWrapper(io.BufferedReader(Hashed()),encoding="utf-8-sig",newline="")
                for file_id,filemeta,doc in parser.csv_docs(stream):
                    units=parser.validate(doc,"csv");nu+=len(units)
                    requested=lookup.get((memberkey,nd))
                    if requested:
                        forms=[u["form"] for u in units];strict,flat=parser.fingerprints(forms)
                        if strict!=requested[4] or doc["id"]!=requested[2] or file_id!=requested[3]:
                            raise RuntimeError("CSV custody mismatch")
                        candidate=file_candidates.get(file_id);resolved=False
                        if candidate and candidate.file_size<=4*1024**2:
                            data=jz.read(candidate);obj=json.loads(data.decode("utf-8-sig"))
                            jsonreceipts[candidate.filename]={"sha256":hashlib.sha256(data).hexdigest(),"bytes":len(data),"EOF_CRC_verified":True}
                            if obj["id"]==file_id:
                                for jd in obj["document"]:
                                    if jd["id"]!=doc["id"]:continue
                                    ju=parser.validate(jd,"json");jf=[u["form"] for u in ju];js,jflat=parser.fingerprints(jf)
                                    classification=exact_relation(forms,jf)
                                    if classification=="UNRESOLVED" and flat==jflat:classification="NORMALIZED_FLAT_ONLY_QUARANTINE"
                                    ranges=[]
                                    if classification=="EXACT_CONTIGUOUS_UNIT_SUBSET" and len(forms)<=len(jf):
                                        ranges=[[i,i+len(forms)] for i in range(len(jf)-len(forms)+1) if jf[i:i+len(forms)]==forms]
                                    cases.append({"CSV_member":memberkey,"CSV_ordinal":nd,"JSON_member":candidate.filename,
                                        "parsed_source_ids_match":True,"CSV_structure":strict,"JSON_structure":js,
                                        "classification":classification,"CSV_units":len(forms),"JSON_units":len(jf),
                                        "exact_subset_JSON_unit_ranges":ranges,"semantic_revision_proven":False})
                                    resolved=True
                        if not resolved:cases.append({"CSV_member":memberkey,"CSV_ordinal":nd,"classification":"UNRESOLVED_QUARANTINE","reason":"No verified parsed identifier counterpart; filename never suffices"})
                    nd+=1
            if h.hexdigest()!=expected:raise RuntimeError("CSV raw member changed")
            csvreceipts.append({"member":memberkey,"sha256":h.hexdigest(),"bytes":memberbytes,"documents":nd,"rows":nu,"EOF_CRC_verified":True})
    if len(cases)!=len(targets):raise RuntimeError("Nonunique or missing written source candidate")
    counts=collections.Counter(x["classification"] for x in cases)
    db.execute("create table if not exists written_final_links(member text,ordinal int,classification text,JSON_structure text,primary key(member,ordinal))")
    for x in cases:db.execute("insert or ignore into written_final_links values(?,?,?,?)",(x["CSV_member"],x["CSV_ordinal"],x["classification"],x.get("JSON_structure")))
    db.commit();db.close()
    result={"status":"EXECUTED","scope":"All 512 final metadata-unlinked written CSV occurrences",
        "occurrences":len(targets),"classifications":dict(counts),"cases":cases,"raw_CSV_receipts":csvreceipts,
        "raw_JSON_member_receipts":jsonreceipts,"raw_JSON_members":len(jsonreceipts),
        "raw_JSON_bytes":sum(x["bytes"] for x in jsonreceipts.values()),
        "maximum_JSON_member_bytes":max(x["bytes"] for x in jsonreceipts.values()),
        "wall_seconds":time.monotonic()-start,"semantic_revision_proven":False,
        "rule":"Filename/file-ID equality is discovery only; parsed document/file IDs and actual ordered source units determine relations. No weak metadata merge.",
        "frozen_evaluation_changed":False}
    (out/"WRITTEN_RESIDUAL_SOURCE_REVIEW.private.json").write_text(json.dumps(result,indent=2),encoding="utf8")
    print(json.dumps({k:v for k,v in result.items() if k not in {"cases","raw_CSV_receipts","raw_JSON_member_receipts"}}),flush=True)
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--root",required=True);p.add_argument("--out",required=True);a=p.parse_args();run(a.root,a.out)
