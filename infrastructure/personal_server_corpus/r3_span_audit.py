"""Full frozen-target admission audit; original model predictions stay intact."""
import pathlib,sqlite3,gzip,json,collections,datetime,time
import p62_reference as ref
from p62_r3_typed_inference import infer
from p62_r3_span_admission import admit
root=pathlib.Path(r'C:\KSGT_SERVER');base=root/'80_EXPORT/p62_referential_grounding_20261011';out=root/'70_RUNS/p62_r3_20261012';start=time.monotonic()
db=sqlite3.connect((base/'R3_TYPED_20261012/TYPED_CHECKPOINT.private.sqlite').as_uri()+'?mode=ro',uri=True);groups=collections.defaultdict(dict)
for path,strict,work,targets in db.execute('select path,strict,work,targets from means where targets>0'):groups[path][strict]=(work,targets)
db.close();totals=collections.Counter();quarantine=[];means=[]
for path,documents in sorted(groups.items()):
 current=None;forms=[]
 def flush():
  if current not in documents:return
  work,expected=documents[current];targets=raw=accepted=0
  for i,s in enumerate(forms):
   for m in ref.TARGET.finditer(s):
    targets+=1;t={'unit':i,'start':m.start(),'end':m.end(),'observed':True};r=infer(forms,t);gate=admit(forms,t,r)
    raw+=r['selected_global_span'] is not None;accepted+=gate['admitted_selected_global_span'] is not None
    if gate['status'].startswith('HOLD'):
     quarantine.append({'source_shard':path,'strict_structure':current,'source_work':work,'target':t,'source_span_gate':gate})
    totals[gate['status']]+=1
  assert targets==expected
  totals['TARGETS']+=targets;totals['RAW_PROPOSALS']+=raw;totals['ADMITTED_PROPOSALS']+=accepted
  means.append((work,current,accepted/targets))
 with gzip.open(path,'rt',encoding='utf8') as f:
  for line in f:
   x=json.loads(line)
   if x['document_variant']!=current:
    if current is not None:flush()
    current=x['document_variant'];forms=[]
   if current in documents:forms.append(x['form'])
 if current is not None:flush()
 print(json.dumps({'target_documents':len(means)}),flush=True)
assert totals['TARGETS']==19255 and totals['RAW_PROPOSALS']==5383 and len(means)==15318
result={'status':'EXECUTED','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'counts':dict(totals),'quarantine':quarantine,'admitted_proposal_fraction_document_equal':ref.bootstrap(means,1000),'original_model_results_preserved':True,'semantic_accuracy':None,'human_labels':0,'code_sha256':{n:ref.digest(pathlib.Path(__file__).with_name(n)) for n in ['r3_span_audit.py','p62_r3_span_admission.py','p62_r3_typed_inference.py','p62_r3_stream_inference.py','p62_reference.py']},'wall_seconds':time.monotonic()-start}
(out/'SPAN_ADMISSION_AUDIT.private.json').write_text(json.dumps(result,indent=2),encoding='utf8');print(json.dumps({k:v for k,v in result.items() if k not in {'quarantine','code_sha256'}}))
