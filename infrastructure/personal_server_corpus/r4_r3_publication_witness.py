"""Independently bind evaluation publication years to raw document metadata."""
import datetime,io,json,sqlite3,zipfile,time
from r4_r3_inventory import ROOT,RUN,OUT,ro,write
import sys
sys.path.insert(0,str(RUN/'baseline_code'));import pipeline
def main():
    start=time.time();c=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');main=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite');db=sqlite3.connect(RUN/'PUBLICATION_METADATA_WITNESSES.private.sqlite')
    db.executescript('create table if not exists dates(strict text primary key,year integer,date text,member text,ordinal integer);create table if not exists sources(member text primary key,sha256 text,documents integer);')
    for member, in c.execute('select distinct member from docs where targets>0 order by member'):
        if db.execute('select 1 from sources where member=?',(member,)).fetchone():continue
        archive,name,expected_sha,expected_bytes,expected_n=main.execute('select archive,name,sha256,bytes,documents from members where key=?',(member,)).fetchone()
        needed={o:(s,container,y) for s,o,container,y in c.execute('select strict,ordinal,container,year from docs where member=? and targets>0',(member,))};proofs=[];n=0
        with zipfile.ZipFile(ROOT/'10_INBOX/nikl_legacy_14zip'/archive) as z,z.open(name) as source:
            raw=pipeline.Hashed(source);text=io.TextIOWrapper(io.BufferedReader(raw,65536),encoding='utf-8-sig')
            for file_id,meta,doc in pipeline.json_docs(text):
                if n in needed:
                    s,container,year=needed[n];date=str(doc['metadata'].get('date',''));parsed=datetime.datetime.strptime(date,'%Y%m%d')
                    if len(date)!=8 or parsed.year!=year or file_id!=container or pipeline.fingerprints([u['form'] for u in doc['paragraph']])[0]!=s:raise ValueError('Raw publication-metadata authority mismatch')
                    proofs.append((s,parsed.year,date,member,n))
                n+=1
            if raw.h.hexdigest()!=expected_sha or raw.count!=expected_bytes or n!=expected_n:raise ValueError('Raw publication source EOF integrity mismatch')
        db.executemany('insert into dates values(?,?,?,?,?)',proofs);db.execute('insert into sources values(?,?,?)',(member,expected_sha,n));db.commit()
        print(json.dumps({'publication_members':db.execute('select count(*) from sources').fetchone()[0],'target_documents_verified':db.execute('select count(*) from dates').fetchone()[0],'seconds':time.time()-start}),flush=True)
    expected=c.execute('select count(*) from docs where targets>0').fetchone()[0];actual=db.execute('select count(*) from dates').fetchone()[0]
    if expected!=actual:raise ValueError('Incomplete raw publication-year witness coverage')
    write('PUBLICATION_METADATA_AUTHORITY.json',{'status':'VERIFIED','target_documents':actual,'source_members':db.execute('select count(*) from sources').fetchone()[0],'year_counts':dict(db.execute('select year,count(*) from dates group by year')),'authority':'Original JSON document.metadata.date independently reparsed, calendar-validated, bound to exact occurrence and source-container ID. Metadata date is not external verification of real-world publication.','elapsed_seconds':time.time()-start})
if __name__=='__main__':main()
