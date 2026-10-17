"""Reparse raw archived occurrences before admitting same-ID source witnesses."""
import collections,io,json,sqlite3,time,zipfile,sys
from r4_r3_inventory import ROOT,RUN,OUT,ro,write
sys.path.insert(0,str(RUN/'baseline_code'))
import pipeline
def main():
    start=time.time();c=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');db=sqlite3.connect(RUN/'RAW_OCCURRENCE_WITNESSES.private.sqlite');main=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite')
    db.executescript('create table if not exists members(member text primary key,sha256 text,bytes integer,documents integer,witnesses integer);create table if not exists witnesses(candidate text,member text,ordinal integer,relation text,strict text,primary key(candidate,member,ordinal));')
    members=[x[0] for x in c.execute('select distinct member from aliases order by member')]
    for member in members:
        archive,name,fmt,expected_bytes,expected_documents,expected_sha=main.execute('select archive,name,format,bytes,documents,sha256 from members where key=?',(member,)).fetchone()
        done=db.execute('select sha256 from members where member=?',(member,)).fetchone()
        if done:
            if done[0]!=expected_sha:raise ValueError('Restart archived member changed')
            continue
        requests=collections.defaultdict(list)
        for candidate,ordinal,strict,doc_id,kind in c.execute('select candidate,ordinal,strict,doc_id,kind from aliases where member=?',(member,)):
            requests[ordinal].append((candidate,strict,doc_id,kind))
        proofs=[];n=0
        with zipfile.ZipFile(ROOT/'10_INBOX/nikl_legacy_14zip'/archive) as z,z.open(name) as source:
            raw=pipeline.Hashed(source);text=io.TextIOWrapper(io.BufferedReader(raw,65536),encoding='utf-8-sig',errors='strict',newline='')
            for file_id,file_meta,doc in (pipeline.json_docs(text) if fmt=='json' else pipeline.csv_docs(text)):
                if n in requests:
                    forms=[u['form'] for u in pipeline.validate(doc,fmt)];actual,flat=pipeline.fingerprints(forms)
                    for candidate,expected,doc_id,kind in requests[n]:
                        if actual!=expected or doc['id']!=doc_id:raise ValueError('Raw occurrence identity differs from indexed claim')
                        candidate_forms=json.loads(c.execute('select forms from docs where strict=?',(candidate,)).fetchone()[0])
                        if forms==candidate_forms:relation='EXACT_STRUCTURE'
                        elif ''.join(forms)==''.join(candidate_forms):relation='EXACT_CODEPOINT_RESEGMENTATION'
                        elif any(forms[i:i+len(candidate_forms)]==candidate_forms for i in range(len(forms)-len(candidate_forms)+1)) or any(candidate_forms[i:i+len(forms)]==forms for i in range(len(candidate_forms)-len(forms)+1)):relation='EXACT_CONTIGUOUS_UNIT_SUBSET'
                        elif pipeline.fingerprints(candidate_forms)[1]==flat:relation='NORMALIZED_ONLY'
                        else:relation='CROSS_ID_VERSION_UNRESOLVED'
                        proofs.append((candidate,member,n,relation,actual))
                n+=1
            if raw.count!=expected_bytes or raw.h.hexdigest()!=expected_sha or n!=expected_documents:raise ValueError('Raw archive EOF/hash/count differs from committed ingestion')
            actual_sha=raw.h.hexdigest()
        db.executemany('insert or ignore into witnesses values(?,?,?,?,?)',proofs);db.execute('insert into members values(?,?,?,?,?)',(member,actual_sha,raw.count,n,len(proofs)));db.commit()
        print(json.dumps({'phase':'raw_archived_source_witness','members':db.execute('select count(*) from members').fetchone()[0],'occurrence_witnesses':db.execute('select count(*) from witnesses').fetchone()[0],'elapsed_seconds':time.time()-start}),flush=True)
    counts=dict(db.execute('select relation,count(*) from witnesses group by relation'))
    write('RAW_OCCURRENCE_WITNESS_REPORT.json',{'status':'VERIFIED','archived_members':len(members),'counts':counts,'raw_original_text_relation_only':True,'semantic_work_identity':'HOLD','human_ground_truth':None,'elapsed_seconds':time.time()-start})
if __name__=='__main__':main()
