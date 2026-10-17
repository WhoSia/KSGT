"""Prospective machine transfer court, fail closed on incomplete upstream custody.

Reserved-late text is never passed to inference. Component exclusion and frozen
versions are sealed before outcomes; no human judgment or semantic accuracy.
"""
import argparse,collections,datetime,hashlib,json,pathlib,shutil,sqlite3,time
from r4_r3_inventory import ROOT,RUN,OUT,ro,write
from r4_r3_custody import sha
import p62_r4_r3_transfer_gate as gate
import p62_reference as ref
import p62_r3_stream_inference as stream
import p62_r3_typed_inference as typed
import p62_r3_span_admission as admission
import p62_r4_discourse as r4
import p62_r4_guarded_v3 as v3
from p62_r4_admission_v3 import admit_graph
def freeze():
    c=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');w=ro(RUN/'RAW_OCCURRENCE_WITNESSES.private.sqlite');linksdb=ro(RUN/'TEXT_DEPENDENCY_LINKS.private.sqlite')
    # Existence of the final receipts is necessary; RUNNING progress is insufficient.
    raw=json.loads((OUT/'RAW_OCCURRENCE_WITNESS_REPORT.json').read_text());passages=json.loads((OUT/'INDEPENDENT_TEXT_DEPENDENCY_AUDIT.json').read_text())
    custody=json.loads((OUT/'SOURCE_CUSTODY_CLOSURE.private.json').read_text())
    publication=json.loads((OUT/'PUBLICATION_METADATA_AUTHORITY.json').read_text())
    if publication['status']!='VERIFIED':raise ValueError('Raw publication date witnesses missing')
    if custody['status']!='VERIFIED':raise ValueError('Historical custody unresolved')
    unknown=set(custody['unwitnessed_cross_id_candidate_quarantines'])
    if raw['status']!='VERIFIED' or passages['status']!='VERIFIED':raise ValueError('Incomplete original-source auditor')
    records=[];recs={};linkset=set();links=[]
    targetrows=c.execute('select strict,container,year,excluded from docs where targets>0').fetchall()
    unresolved=set(x[0] for x in w.execute("select distinct candidate from witnesses where relation in ('NORMALIZED_ONLY','CROSS_ID_VERSION_UNRESOLVED')"))
    expected=dict(c.execute('select candidate,count(*) from aliases group by candidate'));actual=dict(w.execute('select candidate,count(*) from witnesses group by candidate'))
    for s,container,year,excluded in targetrows:
        complete=(expected.get(s)==actual.get(s) and s not in unresolved and s not in unknown)
        reasons=set((excluded or '').split(','))
        exposed=bool(reasons & {'strict','flat','doc_id','file_id','R4_R2_EXPOSED'})
        rec={'id':s,'container_sha256':hashlib.sha256(container.encode()).hexdigest(),'publication_year':year,'publication_year_authority':'DOCUMENT_METADATA' if year else 'UNKNOWN','exposed':exposed,'lineage_complete':complete,'human_ground_truth':None}
        records.append(rec);recs[s]=rec
    for left,right,kind,exposed in linksdb.execute('select left_id,right_id,kind,exposed from links order by left_id,right_id,kind'):
        if left==right:recs[left]['exposed']=True;continue
        if right not in recs:
            rec={'id':right,'container_sha256':None,'publication_year':None,'publication_year_authority':'UNKNOWN','exposed':bool(exposed),'lineage_complete':True,'human_ground_truth':None};records.append(rec);recs[right]=rec
        token=(min(left,right),max(left,right),kind)
        if token in linkset:continue
        linkset.add(token);links.append({'left':left,'right':right,'kind':kind,'witness_verified':True})
    m=gate.audit_transfer_split(records,links)
    private={'records':records,'links':links,'manifest':m,'upstream_scope':'All target-positive canonical candidate structures; actual exact archived same-ID witnesses, exhaustive >=80-codepoint stream passages and exact short ordered-unit subsets against recovered previous exposure. Zero-target engineering records outside evaluation graph. Global semantic work independence HOLD.'}
    names=['p62_reference.py','p62_r3_stream_inference.py','p62_r3_typed_inference.py','p62_r3_span_admission.py','p62_r4_discourse.py','p62_r4_group_algebra.py','p62_r4_guarded_v3.py','p62_r4_admission_v3.py','p62_r4_r3_transfer_gate.py','r4_r3_frozen_court.py']
    declaration={'status':'PLANNED','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reference_head':'e9878debde05d5ff10455540adf37884aa618f3e','source_sha256':{n:sha(RUN/n) for n in ['UPSTREAM_CUSTODY.private.sqlite','RAW_OCCURRENCE_WITNESSES.private.sqlite','TEXT_DEPENDENCY_LINKS.private.sqlite']},'code_sha256':{n:sha(RUN/'code'/n) for n in names},'cohort_manifest_sha256':m['manifest_sha256'],'primary':'Paired document-equal admitted source-proposal rate: frozen guarded-v3 minus frozen constrained R4 on frozen-transfer targets; semantic accuracy unavailable','windows':'Unchanged model defaults: 1024 codepoints before target; immediate original-unit target-local quantity within next 80 codepoints; ambiguity gap remains each frozen implementation default','units':'Observed exact-surface dependency component; original structure contributes equally conditional on at least one literal target','uncertainty':'2000 deterministic component and container cluster bootstrap resamples; report counts and small-container limitations; no independent-target inference','comparisons':['R3 stream','R3 typed','R4 constrained','guarded v3','v3 individual-only no-union ablation with identical eligible source graph and ambiguity policy'],'controls':['Append unrelated suffix/future groups without changing existing target-local demand','Counterfactual original-unit joining','Elementary max-to-sum finite-set bound equality on identical graph hypotheses'],'exclusions':'All upstream tainted dependency components; unknown metadata and incomplete raw alias witness custody; normalized-only and unresolved versions; reserved-late never evaluated','human_ground_truth':None,'stage':'G9-P60','reserved_late_inference':'FORBIDDEN'}
    p=OUT/'FROZEN_TRANSFER_PREDECLARATION.json'
    if p.exists():
        old=json.loads(p.read_text());declaration['utc']=old['utc']
        if old!=declaration:raise ValueError('Frozen source, code or estimand changed')
    else:write('FROZEN_COHORT.private.json',private);write(p.name,declaration)
    print(json.dumps({'coverage':m['coverage_status'],'splits':{k:{z:v for z,v in x.items() if z!='tokens'} for k,x in m['by_split'].items()}},indent=2),flush=True)
    return m,declaration
def simple(v,target_start):
    if v.get('source_admission',{}).get('status')!='VERIFIED_TYPED_SOURCE_GRAPH_ONLY' or v['status'] in ('HOLD_UNMODELED_TARGET_QUANTITY_BOUNDARY','HOLD_UNPARSED_TARGET_REQUIREMENT'):return None
    ids=set(v.get('eligible_ids',[]));nodes=[n for n in v.get('nodes',[]) if n['id'] in ids]
    nodes.sort(key=lambda n:(target_start-n['witness']['global_end'],n['id']))
    near=[n for n in nodes if nodes and nodes[0]['witness']['global_end']-n['witness']['global_end']<=r4.AMBIGUITY_DISTANCE]
    return near[0] if len(near)==1 else None
def evaluate(arm,limit):
    m,d=freeze()
    if m['coverage_status']!='MACHINE_TRANSFER_COVERAGE_GATE_PASSED':raise RuntimeError('Transfer diversity prerequisites HOLD')
    c=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');db=sqlite3.connect(RUN/(arm+'_TRANSFER.private.sqlite'))
    db.executescript('create table if not exists results(strict text primary key,member text,container text,year integer,units integer,targets integer,payload text);create table if not exists seal(key text primary key,value text);')
    seal=json.dumps(d,sort_keys=True);previous=db.execute("select value from seal where key='declaration'").fetchone()
    if previous and previous[0]!=seal:raise ValueError('Restart frozen contract mismatch')
    db.execute("insert or ignore into seal values('declaration',?)",(seal,));db.commit()
    ids=set(m['by_split']['frozen_transfer']['tokens']);records=[x for x in c.execute('select strict,member,ordinal,container,year,units,targets,forms from docs order by member,ordinal') if x[0] in ids]
    members=sorted({x[1] for x in records});config=json.loads((ROOT/'70_RUNS/corpus_sprint_20261011_main/FROZEN_CONFIG.json').read_text());main=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite')
    start=time.time();processed=0
    for s,member,ordinal,container,year,units,targets,raw in records:
        if limit and member not in members[:limit]:continue
        if db.execute('select 1 from results where strict=?',(s,)).fetchone():continue
        if shutil.disk_usage(ROOT).free<60*1024**3:raise RuntimeError('Disk reserve HOLD')
        forms=json.loads(raw);rows=[];seen=0;release=main.execute('select archive from members where key=?',(member,)).fetchone()[0]
        identity={'strict_structure':s,'member_key':member,'archive_sha256':config['archive_sha256'][release],'document_ordinal':ordinal}
        for i,form in enumerate(forms):
            for mt in ref.TARGET.finditer(form):
                t={'unit':i,'start':mt.start(),'end':mt.end(),'observed':True};seen+=1;record={'target':t,'human_ground_truth':None}
                if arm=='R3':
                    for name,fun in [('stream',stream.infer),('typed',typed.infer)]:
                        before=time.perf_counter();r=fun(forms,t);a=admission.admit(forms,t,r)
                        record[name]={'result':r,'source_admission':a,'elapsed_seconds':time.perf_counter()-before,'admitted':a['status']=='VERIFIED_SOURCE_FRAGMENT_ONLY'}
                        changed=list(forms);changed[i]+=' 후행 세 명.';changed.append('미래 다섯 명.')
                        control=fun(changed,t);record[name]['future_control_decision_changed']=r!=control
                else:
                    before=time.perf_counter();base=r4.infer(forms,t,use_target_constraints=True);ba=admit_graph(forms,t,base);record['r4']={'result':base,'source_admission':ba,'elapsed_seconds':time.perf_counter()-before,'proposed':base.get('selected') is not None,'admitted':base.get('selected') is not None and ba['status']=='VERIFIED_TYPED_SOURCE_GRAPH_ONLY'}
                    before=time.perf_counter();v=v3.infer(forms,t,identity);record['v3']={'result':v,'elapsed_seconds':time.perf_counter()-before,'admitted':v.get('selected') is not None}
                    start_global=sum(map(len,forms[:i]))+t['start'];record['simple_individual']={'selected':simple(v,start_global),'admitted':simple(v,start_global) is not None}
                    modified=list(forms);modified[i]+=' 후행 세 명.';modified.append('미래 다섯 명.')
                    control=v3.infer(modified,t,identity);record['prefix_control_violation']=v['scoped_prefix_state_sha256']!=control['scoped_prefix_state_sha256']
                    bc=r4.infer(modified,t,use_target_constraints=True);record['r4_prefix_control_violation']=base['state_sha256']!=bc['state_sha256']
                    joined=[''.join(forms)];offset=sum(map(len,forms[:i]));jt=dict(t,unit=0,start=offset+t['start'],end=offset+t['end']);j=v3.infer(joined,jt,identity)
                    record['joined_source_status_changed']=v['status']!=j['status'];record['joined_source_proposal_changed']=(v.get('selected') is not None)!=(j.get('selected') is not None)
                    record['r4_v3_decision_changed']=(base['status'],(base.get('selected') or {}).get('id'))!=(v['status'],(v.get('selected') or {}).get('id'))
                rows.append(record)
        if seen!=targets:raise ValueError('Frozen target denominator changed')
        db.execute('insert into results values(?,?,?,?,?,?,?)',(s,member,container,year,units,targets,json.dumps(rows,ensure_ascii=False)));processed+=1
        if processed%50==0:db.commit();print(json.dumps({'arm':arm,'new_documents':processed,'seconds':time.time()-start}),flush=True)
    db.commit();print(json.dumps({'status':'EXECUTED','arm':arm,'new_documents':processed,'census':db.execute('select count(*),sum(targets) from results').fetchone(),'elapsed_seconds':time.time()-start}),flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--arm',choices=['freeze','R3','R4'],default='freeze');p.add_argument('--members',type=int,default=0);a=p.parse_args();freeze() if a.arm=='freeze' else evaluate(a.arm,a.members)
