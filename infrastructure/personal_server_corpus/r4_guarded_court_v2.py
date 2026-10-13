"""Post-frozen-result guarded-instrument sensitivity; no semantic confirmation."""
import collections,hashlib,json,pathlib,sqlite3,time
import p62_reference as ref
import p62_r4_discourse as old
import p62_r4_guarded_v2 as new

ROOT=pathlib.Path('C:/KSGT_SERVER');RUN=ROOT/'70_RUNS/p62_r4_r2_20261013'
OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R2_20261013'
def ro(path):return sqlite3.connect(path.as_uri()+'?mode=ro',uri=True)
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def run():
    declaration={'status':'PLANNED','version':new.VERSION,'scope':'Post hoc machine-provisional sensitivity after preserved v1 coordinator failure; not confirmatory','changes':['Correct separate coordinator marker and modifier bridge','Bind assertion and quote/hypothetical fields to observed source rules','Retain numeral-boundary and source-occurrence guards'],'human_ground_truth':None,'cohort_sha256':digest(RUN/'COHORT.private.sqlite'),'code_sha256':{n:digest(RUN/'code'/n) for n in ['p62_r4_admission_v2.py','p62_r4_guarded_v2.py','r4_guarded_court_v2.py']}}
    declaration_path=OUT/'GUARDED_V2_INSTRUMENT_PREDECLARATION.json'
    if declaration_path.exists():
        if json.loads(declaration_path.read_text())!=declaration:raise ValueError('Guarded court seal changed')
    else:declaration_path.write_text(json.dumps(declaration,indent=2),encoding='utf-8')
    c=ro(RUN/'COHORT.private.sqlite');result=sqlite3.connect(RUN/'GUARDED_V2.private.sqlite')
    result.execute('create table if not exists results(strict text primary key,work text,targets integer,payload text)')
    rows=0;start=time.time();archive=json.loads((OUT/'ARCHIVE_INTEGRITY.json').read_text())['archives'];archive_sha=next(x['sha256'] for x in archive if x['name']=='NIKL_NEWSPAPER_2025_v1.1.zip')
    for strict,work,member,ordinal,forms in c.execute('select strict,work,member,ordinal,forms from candidate where excluded is null order by member,ordinal'):
        if result.execute('select 1 from results where strict=?',(strict,)).fetchone():continue
        forms=json.loads(forms);counts=collections.Counter();targets=0
        identity={'strict_structure':strict,'member_key':member,'archive_sha256':archive_sha,'document_ordinal':ordinal}
        for i,unit in enumerate(forms):
            for m in ref.TARGET.finditer(unit):
                targets+=1;t={'unit':i,'start':m.start(),'end':m.end(),'observed':True}
                baseline=old.infer(forms,t,use_target_constraints=True);guarded=new.infer(forms,t,identity)
                counts[guarded['status']]+=1;counts['proposals']+=guarded['selected'] is not None
                counts['decision_changed']+=(baseline['status'],(baseline.get('selected') or {}).get('id'))!=(guarded['status'],(guarded.get('selected') or {}).get('id'))
                counts['proposal_gained']+=baseline.get('selected') is None and guarded['selected'] is not None
                counts['proposal_lost']+=baseline.get('selected') is not None and guarded['selected'] is None
                changed=list(forms);changed[i]+=' 미래 세 명.';changed.append('후행 다섯 명.')
                control=new.infer(changed,t,identity)
                counts['suffix_prefix_comparisons']+=guarded.get('state_sha256') is not None
                counts['suffix_prefix_violations']+=guarded['scoped_prefix_state_sha256']!=control['scoped_prefix_state_sha256']
                joined=[''.join(forms)];offset=sum(map(len,forms[:i]));jt={'unit':0,'start':offset+t['start'],'end':offset+t['end'],'observed':True}
                segment=old.infer(joined,jt,use_target_constraints=True)
                counts['segmentation_proposal_changed']+=(baseline.get('selected') is not None)!=(segment.get('selected') is not None)
                counts['segmentation_status_changed']+=baseline['status']!=segment['status']
                counts['segmentation_extra_union_occurrences']+=len(segment.get('unions',[]))-len(baseline.get('unions',[]))
        result.execute('insert into results values(?,?,?,?)',(strict,work,targets,json.dumps(counts)));rows+=1
        if rows%10000==0:result.commit();print(json.dumps({'guarded_documents':rows}),flush=True)
    result.commit();print(json.dumps({'guarded_new_documents':rows,'elapsed_seconds':time.time()-start}),flush=True)

if __name__=='__main__':run()
