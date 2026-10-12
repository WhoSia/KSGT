"""Frozen-cohort stream-architecture mechanical court with shard custody."""
import pathlib,sqlite3,json,gzip,time,collections,datetime,shutil,contextlib
import p62_reference as ref
from p62_r3_typed_inference import infer
from p62_r3_stream_inference import infer as stream_prior,stream_coordinates
from p62_r3_inference import rank
ROOT=pathlib.Path(r'C:\KSGT_SERVER')
RUN=ROOT/'70_RUNS/p62_r3_20261012'
OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R3_TYPED_20261012'
METRICS=('PROPOSAL','AMBIGUOUS_OR_NO_GROUP','HAS_TARGET_CONSTRAINT','STREAM_V1_POLICY_CHANGE','NO_TARGET_CONSTRAINT_POLICY_CHANGE','COUNTER_CONFLICT','CARDINALITY_CONFLICT','MERGE_SEGMENTATION_CHANGE','DIFFERENT_QUOTE_SCOPE_BLOCK','ADJACENT_EXISTENTIAL_BLOCK')
def analyze(forms,strict,work,family,year):
 counts=collections.Counter();targets=0
 for i,text in enumerate(forms):
  for m in ref.TARGET.finditer(text):
   targets+=1;t={'unit':i,'start':m.start(),'end':m.end(),'observed':True};r=infer(forms,t)
   selected=r['selected_global_span'];counts['PROPOSAL']+=selected is not None;counts['AMBIGUOUS_OR_NO_GROUP']+=selected is None
   counts['HAS_TARGET_CONSTRAINT']+=r['target_constraint'] is not None
   counts['STREAM_V1_POLICY_CHANGE']+=stream_prior(forms,t)['selected_global_span']!=selected
   counts['NO_TARGET_CONSTRAINT_POLICY_CHANGE']+=infer(forms,t,use_target_constraints=False)['selected_global_span']!=selected
   offsets,a,b=stream_coordinates(forms,t);merged=infer([''.join(forms)],{'unit':0,'start':a,'end':b,'observed':True})
   counts['MERGE_SEGMENTATION_CHANGE']+=merged['selected_global_span']!=selected
   future=forms[:i+1]+['두 마리. 그 중 다른 후행 통제.'];control=infer(future,t)
   if control['selected_global_span']!=selected or control['candidate_global_spans']!=r['candidate_global_spans']:raise AssertionError('Future units influenced target-local inference')
   for reason,key in [('COUNTER_CONSTRAINT_CONFLICT','COUNTER_CONFLICT'),('CARDINALITY_CONSTRAINT_CONFLICT','CARDINALITY_CONFLICT'),('DIFFERENT_QUOTE_SCOPE_RULE','DIFFERENT_QUOTE_SCOPE_BLOCK'),('ADJACENT_EXISTENTIAL_NEGATION_RULE','ADJACENT_EXISTENTIAL_BLOCK')]:counts[key]+=any(reason in n['exclusion_reasons'] for n in r['blocked'])
 return {'work':work,'strict':strict,'family':str(family),'year':str(year),'paragraphs':len(forms),'targets':targets,'metrics':{k:counts[k] for k in METRICS}}
def run():
 if shutil.disk_usage(ROOT).free<60*1024**3:raise RuntimeError('Disk reserve')
 seal={'source_sha256':ref.digest(ROOT/'70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite'),'work_db_sha256':ref.digest(ROOT/'80_EXPORT/p62_referential_grounding_20261011/P62_PRIVATE.sqlite'),'code_sha256':{n:ref.digest(pathlib.Path(__file__).with_name(n)) for n in ['p62_r3_typed_court.py','p62_r3_typed_inference.py','p62_r3_stream_inference.py','p62_r3_inference.py','p62_r2.py','p62_reference.py']},'frozen_estimands':'Document-equal typed proposal/constraint-admission and ablation-change fractions; future-unit invariance must have zero violations; merged-unit boundary changes are measured, not assumed zero; no semantic recovery outcome; source-work bootstrap 1000 draws; all zero-target documents retained','prior_exposure':'Development; no untouched confirmatory claim'}
 resume=OUT.exists()
 if resume:
  if json.loads((OUT/'PREDECLARATION.json').read_text(encoding='utf8'))!=seal:raise RuntimeError('Seal changed')
 else:OUT.mkdir();(OUT/'PREDECLARATION.json').write_text(json.dumps(seal,indent=2),encoding='utf8')
 start=time.monotonic()
 with contextlib.ExitStack() as stack:
  src=stack.enter_context(contextlib.closing(sqlite3.connect((ROOT/'70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite').as_uri()+'?mode=ro',uri=True)))
  lookup=stack.enter_context(contextlib.closing(sqlite3.connect((ROOT/'80_EXPORT/p62_referential_grounding_20261011/P62_PRIVATE.sqlite').as_uri()+'?mode=ro',uri=True)))
  db=stack.enter_context(contextlib.closing(sqlite3.connect(OUT/'TYPED_CHECKPOINT.private.sqlite')))
  db.executescript('create table if not exists completed(path text primary key,sha256 text,structures int,paragraphs int,targets int);create table if not exists means(path text,ordinal int,work text,strict text,family text,year text,paragraphs int,targets int,metrics text,primary key(path,ordinal));')
  for (path,) in src.execute("select path from shards where kind='paragraphs' order by path"):
   sha=ref.digest(path);done=db.execute('select sha256 from completed where path=?',(path,)).fetchone()
   if done:
    if done[0]!=sha:raise RuntimeError('Committed source changed')
    continue
   rows=[];current=None;forms=[]
   def flush():
    if current is not None:
     identity=lookup.execute('select w.work,d.family,d.year from documents d join work_keys w using(lineage) where strict=?',(current,)).fetchone()
     if identity is None:raise RuntimeError('Missing source-work witness')
     rows.append(analyze(forms,current,*identity))
   with gzip.open(path,'rt',encoding='utf8') as f:
    for line in f:
     x=json.loads(line)
     if x['document_variant']!=current:flush();current=x['document_variant'];forms=[]
     forms.append(x['form'])
   flush()
   with db:
    db.executemany('insert into means values(?,?,?,?,?,?,?,?,?)',[(path,i,r['work'],r['strict'],r['family'],r['year'],r['paragraphs'],r['targets'],json.dumps(r['metrics'])) for i,r in enumerate(rows)])
    db.execute('insert into completed values(?,?,?,?,?)',(path,sha,len(rows),sum(x['paragraphs'] for x in rows),sum(x['targets'] for x in rows)))
   print(json.dumps({'shards':db.execute('select count(*) from completed').fetchone()[0],'targets':sum(x['targets'] for x in rows)}),flush=True)
  census=db.execute('select sum(structures),sum(paragraphs),sum(targets) from completed').fetchone();assert census==(886879,10698118,19255)
  metrics=collections.defaultdict(list);totals=collections.Counter();strata=collections.defaultdict(collections.Counter);zero=0
  for work,strict,family,year,paragraphs,targets,payload in db.execute('select work,strict,family,year,paragraphs,targets,metrics from means'):
   if not targets:zero+=1;continue
   bucket='SHORT' if paragraphs<10 else 'MEDIUM' if paragraphs<30 else 'LONG'
   vals=json.loads(payload)
   for k,v in vals.items():metrics[k].append((work,strict,v/targets));totals[k]+=v
   for stratum in [f'FAMILY:{family}',f'YEAR:{year}',f'LENGTH:{bucket}']:
    strata[stratum]['documents']+=1;strata[stratum]['targets']+=targets
    strata[stratum].update(vals)
  result={'status':'EXECUTED','census':census,'zero_target_documents':zero,'target_counts':dict(totals),'document_equal_metrics':{k:ref.bootstrap(v,1000) for k,v in metrics.items()},'strata':{k:dict(v) for k,v in strata.items()},'distant_future_unit_violations':0,'wall_seconds':time.monotonic()-start,'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'semantic_accuracy':None,'human_labels':0,'predeclaration_sha256':ref.digest(OUT/'PREDECLARATION.json')}
  (OUT/'TYPED_ARCHITECTURE_RESULTS.json').write_text(json.dumps(result,indent=2),encoding='utf8')
  (OUT/'RESULT_SHA256.json').write_text(json.dumps({'sha256':ref.digest(OUT/'TYPED_ARCHITECTURE_RESULTS.json'),'status':'VERIFIED'}),encoding='utf8')
  print(json.dumps({'status':'EXECUTED','census':census,'target_counts':dict(totals)}),flush=True)
if __name__=='__main__':run()
