"""Paired document-equal and stratified mechanical sensitivities, exploratory."""
import pathlib,sqlite3,json,collections,datetime
import p62_reference as ref
root=pathlib.Path(r'C:\KSGT_SERVER');base=root/'80_EXPORT/p62_referential_grounding_20261011';out=root/'70_RUNS/p62_r3_20261012'
def rows(p,table,payload):
 db=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True)
 xs={s:(w,f,y,n,t,json.loads(m)) for s,w,f,y,n,t,m in db.execute(f'select strict,work,family,year,paragraphs,targets,{payload} from {table} where targets>0')};db.close();return xs
stream=rows(base/'R3_STREAM_20261012/STREAM_CHECKPOINT.private.sqlite','means','metrics')
typed=rows(base/'R3_TYPED_20261012/TYPED_CHECKPOINT.private.sqlite','means','metrics')
baseline=rows(base/'R3_FULL_20261012_v2/R3_CHECKPOINT.private.sqlite','document_means','metrics_json')
assert set(stream)==set(typed)==set(baseline) and len(typed)==15318
paired=[];groups=collections.defaultdict(lambda:collections.defaultdict(list));census=collections.defaultdict(collections.Counter)
for s,(w,f,y,n,t,m) in typed.items():
 assert stream[s][:5]==typed[s][:5]==baseline[s][:5]
 delta=(m['PROPOSAL']-stream[s][5]['PROPOSAL'])/t;paired.append((w,s,delta))
 length='SHORT' if n<10 else 'MEDIUM' if n<30 else 'LONG'
 for key in [f'FAMILY:{f}',f'YEAR:{y}',f'LENGTH:{length}']:
  census[key]['documents']+=1;census[key]['targets']+=t
  for metric,value in [('TYPED_PROPOSAL',m['PROPOSAL']/t),('TYPED_MINUS_STREAM_PROPOSAL',delta),('LOCAL_CONSTRAINT_ABLATION_CHANGE',m['NO_TARGET_CONSTRAINT_POLICY_CHANGE']/t),('LEGACY_LEX_SUFFIX_CHANGE',baseline[s][5]['LEX_SUFFIX_CHANGED']/t)]:groups[key][metric].append((w,s,value))
results={}
for key,metrics in groups.items():
 results[key]={'denominators':dict(census[key]),'metrics':{k:ref.bootstrap(v,1000 if len(v)>=30 else 100) for k,v in metrics.items()},'thin_stratum':census[key]['documents']<30}
result={'status':'EXECUTED','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'paired_typed_minus_stream_proposal_fraction_pp':ref.bootstrap(paired,1000),'strata':results,'publication_year_authority':'Inherited frozen source metadata, never archive release filename; family is release family, not adjudicated genre','source_format':'JSON_STRUCTURAL_ONLY','source_work_independence':'Observed frozen work graph only; global semantic independence remains HOLD','experimental_unit':'Exact source structure; target-conditioned document equal, recorded work-component bootstrap; zero-target census retained separately','confirmatory':False,'semantic_accuracy':None}
(out/'STRATIFIED_PAIRED_MECHANICAL_SENSITIVITY.json').write_text(json.dumps(result,indent=2),encoding='utf8');print(json.dumps({'status':'EXECUTED','paired':result['paired_typed_minus_stream_proposal_fraction_pp'],'strata':len(results)}))
