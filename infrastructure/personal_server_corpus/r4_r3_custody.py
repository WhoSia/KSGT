"""Private bounded upstream custody audit, independent of transfer selector flags.

Never certify semantic work independence from undetected text relationships.
Missing historical text custody blocks prospective evaluation rather than silently
setting lineage_complete. Outputs contain private identifiers and stay local.
"""
import argparse, collections, gzip, hashlib, itertools, json, pathlib, re, shutil, sqlite3, time
from r4_r3_inventory import ROOT,RUN,OUT,ro,write
import p62_reference as ref
def sha(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(4*1024**2),b''):h.update(b)
    return h.hexdigest()
def groups(path):
    with gzip.open(path,'rt',encoding='utf-8') as f:
        for strict,it in itertools.groupby(map(json.loads,f),lambda x:x['document_variant']):
            rows=list(it);yield strict,rows
def fingerprints(forms):
    return hashlib.sha256(json.dumps(forms,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def source_census():
    main=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite')
    old=ro(ROOT/'70_RUNS/p62_r4_r2_20261013/COHORT.private.sqlite')
    # Conservative archive-level quarantine for earlier NIKL-2025 excerpts and
    # non-reservoir P59/P60 text whose precise transport ledger is absent locally.
    banned={'NIKL_NEWSPAPER_2025_v1.1.zip','NIKL_WRITTEN_v1.2_JSON.zip'}
    rows=[]
    for key,archive,name in main.execute("select key,archive,name from members where format='json' order by key"):
        if archive in banned or archive=='NIKL_NEWSPAPER_v2.0_JSON.zip':continue
        x=main.execute('select file_id,metadata from occurrences where member=? order by ordinal limit 1',(key,)).fetchone()
        if x is None:continue
        exposed=old.execute("select 1 from exposed where kind='file_id' and key=?",(x[0],)).fetchone() is not None
        d=str(json.loads(x[1]).get('document',{}).get('date',''))
        y=int(d[:4]) if re.fullmatch(r'[12][0-9]{7}',d) else None
        s=main.execute("select path,sha256,bytes from shards where member=? and kind='paragraphs'",(key,)).fetchone()
        rows.append({'member':key,'archive':archive,'path':s[0],'sha256':s[1],'bytes':s[2],'first_document_year':y,'container_private':x[0],'previous_container_exposed':exposed})
    # Selection uses custody/metadata only, no inference outcomes or favorable seeds.
    selected=[];counts=collections.Counter()
    for r in rows:
        y=r['first_document_year']
        if not r['previous_container_exposed'] and y is not None and counts[y]<2:
            selected.append(r);counts[y]+=1
    declaration={'status':'PLANNED','selection':'First two unexposed annual-release members per first-document metadata year in ascending member SHA order; complete canonical shard populations; bounded operational cohort, not probability population sample','selected_members':selected,'quarantined_archive_families':sorted(banned),'global_semantic_work_independence':'HOLD','prior_exposure_custody':'All locally recoverable P60/P61/P62/R2/R3 plus all four R4-R2 shards; nonlocal P59/P60 material still requires provenance resolution','no_outcomes_inspected':True,'human_ground_truth':None}
    p=OUT/'CUSTODY_SELECTION_PREDECLARATION.private.json'
    if p.exists():
        if json.loads(p.read_text())!=declaration:raise ValueError('Prospective source selection changed')
    else:write(p.name,declaration)
    write('SOURCE_MEMBER_OPPORTUNITIES.private.json',{'status':'EXECUTED','members':rows})
    print(json.dumps({'available_annual_members':len(rows),'not_previously_exposed_containers':sum(not r['previous_container_exposed'] for r in rows),'selected_members':len(selected),'selection_first_document_years':dict(counts),'status':'PLANNED_SOURCE_AUDIT'}),flush=True)
    return selected
def audit(limit=0):
    start=time.time();plan=source_census();main=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite');old=ro(ROOT/'70_RUNS/p62_r4_r2_20261013/COHORT.private.sqlite')
    db=sqlite3.connect(RUN/'UPSTREAM_CUSTODY.private.sqlite');db.execute('pragma cache_size=-131072')
    db.executescript('create table if not exists docs(strict text primary key,member text,ordinal integer,container text,year integer,targets integer,units integer,flat text,stream text,forms text,excluded text); create table if not exists sources(member text primary key,sha256 text,documents integer); create table if not exists links(candidate text,other text,kind text,evidence text,primary key(candidate,other,kind)); create table if not exists aliases(candidate text,member text,ordinal integer,strict text,doc_id text,kind text,primary key(candidate,member,ordinal));')
    for r in plan[:limit or len(plan)]:
        if shutil.disk_usage(ROOT).free<60*1024**3:raise RuntimeError('Disk reserve HOLD')
        actual=sha(r['path'])
        if actual!=r['sha256']:raise ValueError('Source hash mismatch')
        prev=db.execute('select sha256 from sources where member=?',(r['member'],)).fetchone()
        if prev:
            if prev[0]!=actual:raise ValueError('Restart source changed')
            continue
        count=0
        for strict,rows in groups(r['path']):
            forms=[x['form'] for x in rows];ordinal=rows[0]['source_document_ordinal']
            if fingerprints(forms)!=strict:raise ValueError('Original-unit structural fingerprint mismatch')
            occurrence=main.execute('select strict,flat,doc_id,file_id,metadata from occurrences where member=? and ordinal=?',(r['member'],ordinal)).fetchone()
            if not occurrence or occurrence[0]!=strict or any(x['source_member']!=r['member'] or x['source_document_ordinal']!=ordinal or x['source_ordinal']!=i for i,x in enumerate(rows)):raise ValueError('Original occurrence custody mismatch')
            _,flat,doc_id,container,meta=occurrence;date=str(json.loads(meta).get('document',{}).get('date',''));year=int(date[:4]) if re.fullmatch(r'[12][0-9]{7}',date) else None
            targets=sum(len(list(ref.TARGET.finditer(x))) for x in forms)
            reasons=[k for k,v in [('strict',strict),('flat',flat),('doc_id',doc_id),('file_id',container)] if v and old.execute('select 1 from exposed where kind=? and key=?',(k,v)).fetchone()]
            # All four R4-R2 candidate shard bodies were machine-exposed, including quarantines.
            if old.execute('select 1 from candidate where strict=?',(strict,)).fetchone():reasons.append('R4_R2_EXPOSED')
            if year is None:reasons.append('UNKNOWN_PUBLICATION_YEAR')
            stream=hashlib.sha256(''.join(forms).encode()).hexdigest()
            values=(strict,r['member'],ordinal,container,year,targets,len(forms),flat,stream,json.dumps(forms,ensure_ascii=False),','.join(sorted(reasons)) or None)
            oldrow=db.execute('select member,ordinal,stream from docs where strict=?',(strict,)).fetchone()
            if oldrow and oldrow[2]!=stream:raise ValueError('Strict identity collision')
            db.execute('insert or ignore into docs values(?,?,?,?,?,?,?,?,?,?,?)',values)
            for k in reasons:db.execute('insert or ignore into links values(?,?,?,?)',(strict,strict,'EXPOSED_'+k,json.dumps({'source':r['member'],'ordinal':ordinal})))
            # Indexed same-ID aliases: differing surface text is unresolved, never merged by title.
            for am,ao,ast,aflat,aid in main.execute('select member,ordinal,strict,flat,doc_id from occurrences where doc_id=?',(doc_id,)):
                kind='INDEX_EXACT_STRUCTURE_PENDING_WITNESS' if ast==strict else ('NORMALIZED_ONLY_PENDING_WITNESS' if aflat==flat else 'CROSS_ID_VERSION_UNRESOLVED')
                db.execute('insert or ignore into aliases values(?,?,?,?,?,?)',(strict,am,ao,ast,aid,kind))
                if ast!=strict:
                    db.execute("update docs set excluded=coalesce(excluded||',','')||? where strict=?",(kind,strict))
            count+=1
        db.execute('insert into sources values(?,?,?)',(r['member'],actual,count));db.commit()
        print(json.dumps({'phase':'upstream_original_unit_audit','members':db.execute('select count(*) from sources').fetchone()[0],'structures':db.execute('select count(*) from docs').fetchone()[0],'full_regex_targets':db.execute('select sum(targets) from docs').fetchone()[0],'seconds':time.time()-start}),flush=True)
    write('UPSTREAM_AUDIT_PROGRESS.json',{'status':'RUNNING' if limit else 'EXECUTED','source_hashes_verified':db.execute('select count(*) from sources').fetchone()[0],'structures':db.execute('select count(*) from docs').fetchone()[0],'literal_targets':db.execute('select coalesce(sum(targets),0) from docs').fetchone()[0],'excluded_so_far':db.execute('select count(*) from docs where excluded is not null').fetchone()[0],'elapsed_seconds':time.time()-start,'remaining_prerequisites':['Actual original-text validation of pending same-ID alias witnesses','Exact text-stream/resegmentation and long-passage dependencies against all historical exposure','Nonlocal P59/P60 exposure custody resolution'],'lineage_complete':False,'transfer_evaluation':'NOT_EXECUTED','human_ground_truth':None})
    db.close()
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--members',type=int,default=0);a=p.parse_args();audit(a.members)
