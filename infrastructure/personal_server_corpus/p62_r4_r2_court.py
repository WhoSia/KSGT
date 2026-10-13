"""Private frozen-cohort court; no semantic gold is inferred from machine outputs."""
import argparse, collections, gzip, hashlib, itertools, json, pathlib, sqlite3, time
from datetime import datetime, timezone

ROOT = pathlib.Path('C:/KSGT_SERVER')
RUN = ROOT / '70_RUNS/p62_r4_r2_20261013'
EXPORT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R2_20261013'
HEAD = '3f48ac34769d48df19c1d2ebbe817433532a8fa3'

def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1024*1024), b''): h.update(b)
    return h.hexdigest()

def write(name, obj):
    path = EXPORT / name
    path.write_text(json.dumps(obj, ensure_ascii=True, indent=2), encoding='utf-8')
    return sha(path)

def ro(path):
    return sqlite3.connect(pathlib.Path(path).as_uri()+'?mode=ro', uri=True)

def groups(path):
    with gzip.open(path, 'rt', encoding='utf-8') as f:
        for key, rows in itertools.groupby((json.loads(x) for x in f), lambda x:x['document_variant']):
            yield key, list(rows)

def build():
    started = time.time()
    main = ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite')
    main.execute('pragma cache_size=-131072')
    plan = main.execute("select s.member,s.path,s.sha256,s.bytes,m.archive from shards s join members m on m.key=s.member where s.kind='paragraphs' and m.archive='NIKL_NEWSPAPER_2025_v1.1.zip' order by s.member limit 4").fetchall()
    declaration = {'status':'PLANNED','utc':datetime.now(timezone.utc).isoformat(),'head':HEAD,
      'selection':'First four 2025 JSON paragraph shards in ascending member SHA-256 order; all canonical structures, including zero-target structures; not random population sampling',
      'shards':plan,'exclusion':'All P60 development and replication source strict, flat, nonempty doc_id and file_id; all P61/P62 strict; aliases in completed corpus checked; any unchanged >=80-character unit shared with exposed replication paragraph shards is quarantined; one representation per flat hash',
      'independence_ceiling':'Observed-key and long-unit exclusion only; short-only subsets, cross-ID revised works without shared units and semantic genealogy remain unresolved; exploratory transfer',
      'primary':'Paired document-equal source-fragment proposal-rate differences R4 constrained minus unchanged R3 typed; conditional on literal-target documents; zero-target structures counted separately',
      'uncertainty':'1000 deterministic cluster-bootstrap resamples of conservative flat/source-ID connected components; do not treat targets as independent',
      'controls':'R4 unconstrained and constrained; append unrelated future group to target suffix and future unit; prefix-state invariance; source graph verification; source segmentation sensitivity; authored algebra countermodels',
      'human_ground_truth':None,'current_stage':'G9-P60','reserve_bytes':60*1024**3}
    if not (EXPORT/'PREDECLARATION.json').exists():write('PREDECLARATION.json', declaration)
    else:
        previous=json.loads((EXPORT/'PREDECLARATION.json').read_text(encoding='utf-8'))
        if previous['shards']!=[list(x) for x in plan] or previous['head']!=HEAD:raise ValueError('Frozen selection changed')
    db = sqlite3.connect((RUN/'COHORT.private.sqlite').as_uri(),uri=True)
    db.execute('pragma cache_size=-262144')
    db.executescript('create table if not exists exposed(kind text,key text,primary key(kind,key)); create table if not exists candidate(strict text primary key,flat text,doc_id text,file_id text,year text,member text,ordinal integer,units integer,forms text,excluded text,work text); create table if not exists exclusion(strict text,reason text); create table if not exists exposure_checkpoint(source text,kind text,primary key(source,kind));')
    for source in ['DEVELOPMENT_SOURCE.sqlite','REPLICATION_SOURCE.sqlite']:
        path = ROOT/'70_RUNS/context_falsification_20261011'/source
        db.execute('attach database ? as old_source',(path.as_uri()+'?mode=ro',))
        for kind in ['strict','flat','doc_id','file_id']:
            if db.execute('select 1 from exposure_checkpoint where source=? and kind=?',(source,kind)).fetchone():continue
            db.execute('insert or ignore into exposed select ?,"'+kind+'" from old_source.occurrences where "'+kind+'" is not null and "'+kind+'"<>\'\'',(kind,))
            db.execute('insert into exposure_checkpoint values(?,?)',(source,kind));db.commit()
            print(json.dumps({'phase':'exposure_index','source':source,'kind':kind}),flush=True)
        db.execute('detach database old_source')
    for path in [ROOT/'70_RUNS/p61_source_work_directional_20261011/P61_PRIVATE.sqlite',ROOT/'80_EXPORT/p62_referential_grounding_20261011/P62_PRIVATE.sqlite']:
        c=ro(path); db.executemany("insert or ignore into exposed values('strict',?)",c.execute('select strict from documents'));db.commit();c.close()
    seen_flat=set(); counts=collections.Counter(); hashes=[]
    existing=db.execute('select count(*) from candidate').fetchone()[0]
    if existing:
        actual=existing+db.execute('select count(distinct strict) from exclusion where reason in (\'strict\',\'flat\',\'doc_id\',\'file_id\',\'COHORT_FLAT_REPRESENTATION_DUPLICATE\')').fetchone()[0]
        expected=sum(main.execute('select documents from members where key=?',(row[0],)).fetchone()[0] for row in plan)
        if actual!=expected:raise ValueError('Partial candidate extraction cannot be resumed')
        counts['scanned_structures']=actual;counts['initial_excluded']=actual-existing
    for member,path,expected,_,release in plan:
        actual=sha(path)
        if actual!=expected: raise ValueError('Source shard hash mismatch')
        hashes.append({'path':path,'sha256':actual})
        if existing:continue
        for strict, rows in groups(path):
            counts['scanned_structures']+=1
            ordinal=rows[0]['source_document_ordinal']
            meta=main.execute('select strict,flat,doc_id,file_id,year from occurrences where member=? and ordinal=?',(member,ordinal)).fetchone()
            if meta is None or meta[0]!=strict: raise ValueError('Source occurrence identity mismatch')
            _,flat,doc_id,file_id,year=meta
            reasons=[kind for kind,key in [('strict',strict),('flat',flat),('doc_id',doc_id),('file_id',file_id)] if key and db.execute('select 1 from exposed where kind=? and key=?',(kind,key)).fetchone()]
            if flat in seen_flat: reasons.append('COHORT_FLAT_REPRESENTATION_DUPLICATE')
            if reasons:
                counts['initial_excluded']+=1
                db.executemany('insert into exclusion values(?,?)',[(strict,x) for x in reasons]);continue
            seen_flat.add(flat)
            forms=[x['form'] for x in rows]
            db.execute('insert into candidate values(?,?,?,?,?,?,?,?,?,?,?)',(strict,flat,doc_id,file_id,year,member,ordinal,len(forms),json.dumps(forms,ensure_ascii=False),None,flat))
        db.commit()
    candidate_keys={x[0] for x in db.execute('select strict from candidate')}
    aliases=collections.Counter(); blocked=set()
    candidate_flats=[x[0] for x in db.execute('select flat from candidate order by flat')]
    def matching_aliases():
        for start in range(0,len(candidate_flats),500):
            batch=candidate_flats[start:start+500]
            yield from main.execute('select strict,flat,doc_id,file_id from occurrences where flat in ('+','.join('?'*len(batch))+')',batch)
    flat_to_strict=dict(db.execute('select flat,strict from candidate'))
    for alias_strict,flat,doc_id,file_id in matching_aliases():
        strict=flat_to_strict[flat]
        aliases['candidate_alias_occurrences']+=1
        for kind,key in [('flat',flat),('doc_id',doc_id),('file_id',file_id)]:
            if key and db.execute('select 1 from exposed where kind=? and key=?',(kind,key)).fetchone():
                blocked.add(strict);db.execute('insert into exclusion values(?,?)',(strict,'EXPOSED_ALIAS_'+kind))
    for strict in blocked: db.execute("update candidate set excluded='EXPOSED_ALIAS' where strict=?",(strict,))
    db.commit()
    # Match against original exposed source units without retaining their prose.
    unit_to_docs=collections.defaultdict(set)
    for strict,forms in db.execute('select strict,forms from candidate where excluded is null'):
        for unit in json.loads(forms):
            if len(unit)>=80: unit_to_docs[hashlib.sha256(unit.encode()).digest()].add(strict)
    old=ro(ROOT/'70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite')
    old_units=0;shared=set();old_shards=0
    for path,expected in old.execute("select path,sha256 from shards where kind='paragraphs' order by path"):
        if sha(path)!=expected:raise ValueError('Exposed source hash mismatch')
        with gzip.open(path,'rt',encoding='utf-8') as f:
            for line in f:
                form=json.loads(line)['form'];old_units+=1
                if len(form)>=80:
                    shared.update(unit_to_docs.get(hashlib.sha256(form.encode()).digest(),()))
        old_shards+=1
        if old_shards%250==0: print(json.dumps({'phase':'exposure_unit_scan','shards':old_shards,'units':old_units,'quarantined':len(shared)}),flush=True)
    for strict in shared:
        db.execute("update candidate set excluded='SHARED_EXPOSED_LONG_UNIT' where strict=?",(strict,));db.execute('insert into exclusion values(?,?)',(strict,'SHARED_EXPOSED_LONG_UNIT'))
    # Source-ID connections define uncertainty clusters, not certified works.
    ids={};parent={x:x for x in candidate_keys}
    def find(x):
        while parent[x]!=x:parent[x]=parent[parent[x]];x=parent[x]
        return x
    for strict,doc_id,file_id in db.execute('select strict,doc_id,file_id from candidate where excluded is null'):
        for kind,key in [('doc_id',doc_id),('file_id',file_id)]:
            if key:
                if (kind,key) in ids:parent[find(strict)]=find(ids[kind,key])
                else:ids[kind,key]=strict
    for strict, in db.execute('select strict from candidate where excluded is null').fetchall():db.execute('update candidate set work=? where strict=?',(find(strict),strict))
    db.commit()
    counts.update(aliases);counts['shared_long_unit_quarantined']=len(shared);counts['alias_quarantined']=len(blocked)
    counts['eligible_structures']=db.execute('select count(*) from candidate where excluded is null').fetchone()[0]
    counts['eligible_paragraphs']=db.execute('select sum(units) from candidate where excluded is null').fetchone()[0]
    counts['clusters']=db.execute('select count(distinct work) from candidate where excluded is null').fetchone()[0]
    counts['exposed_units_audited']=old_units;counts['exposed_shards_audited']=old_shards
    db.close()
    write('SOURCE_EXCLUSION_REPORT.json',{'status':'VERIFIED','counts':counts,'source_shards':hashes,'cohort_sha256':sha(RUN/'COHORT.private.sqlite'),'elapsed_seconds':time.time()-started,'claim_ceiling':declaration['independence_ceiling']})
    print(json.dumps(counts),flush=True)

def evaluate(arm,limit):
    import p62_reference as ref
    import p62_r3_stream_inference as stream
    import p62_r3_typed_inference as typed
    import p62_r3_span_admission as admission
    import p62_r4_discourse as r4
    frozen=ro(RUN/'COHORT.private.sqlite');out=sqlite3.connect(RUN/(arm+'.private.sqlite'))
    out.executescript('create table if not exists results(strict text primary key,work text,member text,year text,units integer,targets integer,payload text); create table if not exists seal(key text primary key,value text);')
    seal=sha(RUN/'COHORT.private.sqlite')
    old=out.execute("select value from seal where key='cohort_sha256'").fetchone()
    if old and old[0]!=seal:raise ValueError('Frozen cohort changed')
    out.execute("insert or ignore into seal values('cohort_sha256',?)",(seal,));out.commit()
    code_names=(['p62_reference.py','p62_r3_stream_inference.py','p62_r3_typed_inference.py','p62_r3_span_admission.py'] if arm=='R3' else ['p62_reference.py','p62_r3_stream_inference.py','p62_r4_discourse.py','p62_r4_group_algebra.py'])
    code_names.append('p62_r4_r2_court.py')
    code_seal=json.dumps({n:sha(RUN/'code'/n) for n in code_names},sort_keys=True)
    previous=out.execute("select value from seal where key='code_sha256'").fetchone()
    if previous and previous[0]!=code_seal:raise ValueError('Frozen inference code changed')
    out.execute("insert or ignore into seal values('code_sha256',?)",(code_seal,));out.commit()
    members=[x[0] for x in frozen.execute('select distinct member from candidate where excluded is null order by member')]
    done=0
    for strict,work,member,year,units,forms in frozen.execute('select strict,work,member,year,units,forms from candidate where excluded is null order by member,ordinal'):
        if limit and member not in members[:limit]:continue
        if out.execute('select 1 from results where strict=?',(strict,)).fetchone():continue
        forms=json.loads(forms);metrics=collections.Counter();targets=0
        for i,unit in enumerate(forms):
            for m in ref.TARGET.finditer(unit):
                targets+=1;t={'unit':i,'start':m.start(),'end':m.end(),'observed':True}
                if arm=='R3':
                    for name,fun in [('stream',stream.infer),('typed',typed.infer)]:
                        res=fun(forms,t);gate=admission.admit(forms,t,res)
                        metrics[name+'_proposals']+=gate['status']=='VERIFIED_SOURCE_FRAGMENT_ONLY'
                        metrics[name+'_'+gate['status']]+=1
                        metrics[name+'_target_constraints']+=res.get('target_constraint') is not None
                        for node in res.get('blocked',[]):
                            for reason in node.get('exclusion_reasons',[]): metrics[name+'_blocked_'+reason]+=1
                else:
                    for name,constraint in [('unconstrained',False),('constrained',True)]:
                        res=r4.infer(forms,t,use_target_constraints=constraint)
                        if not r4.verify_graph(forms,res): raise ValueError('Independent source graph admission failed')
                        metrics[name+'_'+res['status']]+=1
                        metrics[name+'_proposals']+=res.get('selected') is not None
                        metrics[name+'_unions']+=len(res.get('unions',[]))
                        metrics[name+'_graph_checks']+=1
                        for diagnostic in res.get('union_diagnostics',[]): metrics[name+'_union_'+diagnostic['verdict']]+=1
                        for node in res.get('nodes',[]): metrics[name+'_assertion_'+node['assertion']]+=1
                        mutated=list(forms);mutated[i]+=' 추가 집단 다섯 명.';mutated.append(' 미래 집단 세 명.')
                        changed=r4.infer(mutated,t,use_target_constraints=constraint)
                        metrics[name+'_suffix_prefix_comparisons']+=res.get('state_sha256') is not None
                        metrics[name+'_suffix_prefix_unavailable']+=res.get('state_sha256') is None
                        metrics[name+'_suffix_prefix_violations']+=res.get('state_sha256')!=changed.get('state_sha256')
        out.execute('insert into results values(?,?,?,?,?,?,?)',(strict,work,member,year,units,targets,json.dumps(metrics)))
        done+=1
        if done%1000==0:out.commit();print(json.dumps({'arm':arm,'new_documents':done}),flush=True)
    out.commit();rows=out.execute('select count(*),sum(units),sum(targets),sum(targets=0) from results').fetchone();out.close()
    print(json.dumps({'arm':arm,'new_documents':done,'census':rows,'checkpoint_sha256':sha(RUN/(arm+'.private.sqlite'))}),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('mode',choices=['build','R3','R4']);parser.add_argument('--shards',type=int,default=0);args=parser.parse_args()
    if args.mode=='build':build()
    else:evaluate(args.mode,args.shards)
