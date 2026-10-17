"""Small, fail-closed singleton mechanism court, not reference accuracy."""
import argparse,collections,datetime,hashlib,json,pathlib,shutil,sqlite3,sys,time
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'
sys.path[:0]=[str(RUN/'code'),str(PRIOR/'code'),str(PRIOR/'baseline_code')]
import p62_reference as ref,p62_r3_stream_inference as stream,p62_r3_typed_inference as typed,p62_r4_discourse as r4,p62_r4_guarded_v3 as v3
from p62_r4_r4_conditional_diagnostics import diagnose
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=True,indent=2),encoding='utf-8')
def ro(p):return sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
def freeze():
 receipts=[json.loads((OUT/n).read_text()) for n in ['INDEPENDENT_TEXT_DEPENDENCY_AUDIT.json','RAW_OCCURRENCE_WITNESS_REPORT.json','SOURCE_CUSTODY_CLOSURE.private.json']]
 if any(x['status']!='VERIFIED' for x in receipts):raise ValueError('Custody incomplete')
 c=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');l=ro(RUN/'TEXT_DEPENDENCY_LINKS.private.sqlite');w=ro(RUN/'RAW_OCCURRENCE_WITNESSES.private.sqlite')
 excluded={r[0] for r in l.execute('select left_id from links where exposed=1')}
 excluded.update(receipts[2]['unwitnessed_cross_id_candidate_quarantines'])
 excluded.update(r[0] for r in w.execute("select candidate from witnesses where relation in ('NORMALIZED_ONLY','CROSS_ID_VERSION_UNRESOLVED')"))
 expected=dict(c.execute('select candidate,count(*) from aliases group by candidate'));actual=dict(w.execute('select candidate,count(*) from witnesses group by candidate'))
 for s,n in expected.items():
  if actual.get(s)!=n:excluded.add(s)
 # No graph component is silently split. Connected candidates are excluded here.
 for a,b in l.execute('select left_id,right_id from links where exposed=0'):excluded.update([a,b])
 docs=[s for s, in c.execute('select strict from docs where targets>0 order by strict') if s not in excluded]
 files=[RUN/'UPSTREAM_CUSTODY.private.sqlite',RUN/'TEXT_DEPENDENCY_LINKS.private.sqlite',RUN/'RAW_OCCURRENCE_WITNESSES.private.sqlite',RUN/'r4_r4_mechanism_court.py',RUN/'code/p62_r4_r4_conditional_diagnostics.py']
 files.extend(PRIOR/'baseline_code'/n for n in ['p62_reference.py','p62_r3_stream_inference.py','p62_r3_typed_inference.py','p62_r3_span_admission.py','p62_r4_discourse.py','p62_r4_guarded_v3.py','p62_r4_group_algebra.py','p62_r4_admission_v3.py'])
 declaration={'status':'PLANNED','source_and_code_sha256':{str(p):sha(p) for p in files},'eligible_structures_private':docs,'excluded_structures_private':sorted(excluded),'estimand':'Paired descriptive counts on observed targets in the complete admissible singleton-enriched bounded population; no confirmatory transfer claim','window':'Unchanged 1024-codepoint frozen defaults and original-unit immediate target-local quantity','partition':'All admissible items form one frozen mechanism court. No v4 training or reference-selector changes; no reserved-late inference. Too few target clusters for a generalization estimate.','comparisons':['unchanged R3 stream','unchanged R3 typed','unchanged constrained R4','unchanged guarded v3','separate conditional diagnostics; v3 selected nodes unchanged'],'human_ground_truth':None,'semantic_accuracy':None,'global_semantic_work_independence':'HOLD'}
 p=OUT/'FROZEN_MECHANISM_PREDECLARATION.private.json'
 if p.exists() and json.loads(p.read_text())!=declaration:raise ValueError('Frozen court changed')
 if not p.exists():write(p.name,declaration)
 return declaration
def main(limit):
 start=time.time();d=freeze();c=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');main=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite');config=json.loads((ROOT/'70_RUNS/corpus_sprint_20261011_main/FROZEN_CONFIG.json').read_text())
 db=sqlite3.connect(RUN/'MECHANISM_COURT.private.sqlite');db.executescript('create table if not exists results(strict text primary key,payload text);create table if not exists seal(value text);')
 seal=json.dumps(d,sort_keys=True);old=db.execute('select value from seal').fetchone()
 if old and old[0]!=seal:raise ValueError('Restart seal differs')
 if not old:db.execute('insert into seal values(?)',(seal,));db.commit()
 new=0
 for s in d['eligible_structures_private'][:limit or None]:
  if db.execute('select 1 from results where strict=?',(s,)).fetchone():continue
  if shutil.disk_usage(ROOT).free<60*1024**3:raise RuntimeError('Disk reserve HOLD')
  member,o,year,raw=c.execute('select member,ordinal,year,forms from docs where strict=?',(s,)).fetchone();forms=json.loads(raw);archive=main.execute('select archive from members where key=?',(member,)).fetchone()[0]
  identity={'strict_structure':s,'member_key':member,'archive_sha256':config['archive_sha256'][archive],'document_ordinal':o};rows=[]
  for i,form in enumerate(forms):
   for m in ref.TARGET.finditer(form):
    t={'unit':i,'start':m.start(),'end':m.end(),'observed':True}
    a=stream.infer(forms,t);b=typed.infer(forms,t);base=r4.infer(forms,t,use_target_constraints=True);g=v3.infer(forms,t,identity);diag=diagnose(forms,t,identity,g)
    rows.append({'target':t,'stream':a,'typed':b,'r4':base,'v3':g,'conditional_diagnostics':diag,'human_ground_truth':None})
  db.execute('insert into results values(?,?)',(s,json.dumps({'year':year,'member_private':member,'targets':rows},ensure_ascii=False,sort_keys=True)));db.commit();new+=1
 payload=list(db.execute('select strict,payload from results order by strict'));counts=collections.Counter();diagcounts=collections.Counter();containers=set();years=set()
 for s,raw in payload:
  r=json.loads(raw);containers.add(r['member_private']);years.add(r['year']);counts['structures']+=1
  for item in r['targets']:
   counts['targets']+=1
   for arm in ['stream','typed','r4','v3']:counts[arm+'_proposals']+=item[arm].get('selected') is not None
   counts['v3_unions']+=len(item['v3'].get('unions',[]))
   for u in item['conditional_diagnostics']['unions']:diagcounts[u['status']]+=1
   if item['conditional_diagnostics'].get('frozen_v3_selected')!=item['v3'].get('selected'):raise ValueError('Diagnostic changed reference choice')
 logical_sha=hashlib.sha256(json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
 report={'status':'EXECUTED','new_structures':new,'counts':dict(counts),'conditional_status_counts':dict(diagcounts),'observed_source_containers':len(containers),'publication_years':sorted(years),'excluded_target_structures':len(d['excluded_structures_private']),'logical_output_sha256':logical_sha,'checkpoint_integrity':db.execute('pragma quick_check').fetchone()[0],'elapsed_seconds':time.time()-start,'human_ground_truth':None,'semantic_accuracy':None,'uncertainty':'No population inference: sparse purposive mechanism cohort; report exact denominators, not an unstable bootstrap interval','completion':'COMPLETE' if len(payload)==len(d['eligible_structures_private']) else 'BOUNDED_PARTIAL'}
 write('MECHANISM_COURT_LATEST.private.json',report);print(json.dumps(report),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--limit',type=int,default=0);main(p.parse_args().limit)
