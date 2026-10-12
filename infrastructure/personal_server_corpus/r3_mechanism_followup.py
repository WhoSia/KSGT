"""Development-exposed targeted mechanism diagnosis, preserving corpus privacy."""
import pathlib,sqlite3,json,gzip,collections,datetime
import p62_reference as ref
from p62_r3_stream_inference import infer as stream_infer,stream_coordinates
from p62_r3_typed_inference import infer as typed_infer
root=pathlib.Path(r'C:\KSGT_SERVER');base=root/'80_EXPORT/p62_referential_grounding_20261011';out=root/'70_RUNS/p62_r3_20261012'
db=sqlite3.connect((base/'R3_TYPED_20261012/TYPED_CHECKPOINT.private.sqlite').as_uri()+'?mode=ro',uri=True)
chosen=collections.defaultdict(set)
for path,strict in db.execute("select path,strict from means where json_extract(metrics,'$.STREAM_V1_POLICY_CHANGE')>0"):chosen[path].add(strict)
db.close();multi=sqlite3.connect((base/'R3_STREAM_20261012/STREAM_CHECKPOINT.private.sqlite').as_uri()+'?mode=ro',uri=True)
multi_keys=set()
for path,strict in multi.execute("select path,strict from means where json_extract(metrics,'$.MULTIUNIT_WITNESS')>0"):chosen[path].add(strict);multi_keys.add(strict)
multi.close();transitions=collections.Counter();causes=collections.Counter();cross=[];target_count=0;documents=0
def flush(forms,strict,path):
 global target_count,documents
 if strict not in chosen[path]:return
 documents+=1
 for i,s in enumerate(forms):
  for m in ref.TARGET.finditer(s):
   t={'unit':i,'start':m.start(),'end':m.end(),'observed':True};a=stream_infer(forms,t);b=typed_infer(forms,t);target_count+=1
   if a['selected_global_span']!=b['selected_global_span']:
    old=a['selected_global_span'];new=b['selected_global_span']
    kind='NO_PROPOSAL_TO_PROPOSAL' if old is None else 'PROPOSAL_TO_NO_PROPOSAL' if new is None else 'DIFFERENT_PROPOSAL'
    transitions[kind]+=1;causes['TARGET_LOCAL_CONSTRAINT_PRESENT']+=b['target_constraint'] is not None
    for reason in ['NEGATION_CUE_RULE','QUOTED_CUE_RULE']:causes['STREAM_'+reason]+=any(reason in n['exclusion_reasons'] for n in a['excluded'])
    for reason in ['COUNTER_CONSTRAINT_CONFLICT','CARDINALITY_CONSTRAINT_CONFLICT']:causes['TYPED_'+reason]+=any(reason in n['exclusion_reasons'] for n in b['blocked'])
   if strict in multi_keys:
    offsets,start,end=stream_coordinates(forms,t)
    for n in a['nodes']:
     if len(n['source_spans'])>1:
      cross.append({'source_shard':path,'strict_structure':strict,'target_unit':i,'target_span':[t['start'],t['end']],'candidate_global_span':[n['global_start'],n['global_end']],'original_unit_spans':n['source_spans'],'single_original_unit_witness':False,'numeric_fragment_cardinality':n['cardinality'],'selected_stream':a['selected_global_span']==[n['global_start'],n['global_end']],'selected_typed':b['selected_global_span']==[n['global_start'],n['global_end']],'semantic_span_admission':'HOLD_NO_VERIFIED_CONTINUATION_OR_SINGLE_UNIT_EXPRESSION'})
for path in sorted(chosen):
 current=None;forms=[]
 with gzip.open(path,'rt',encoding='utf8') as f:
  for line in f:
   x=json.loads(line)
   if current!=x['document_variant']:
    if current is not None:flush(forms,current,path)
    current=x['document_variant'];forms=[]
   forms.append(x['form'])
 if current is not None:flush(forms,current,path)
print(json.dumps({'documents':documents,'targets':target_count,'transitions':dict(transitions),'cross_unit_cases':len(cross)}))
assert sum(transitions.values())==1197
assert transitions['NO_PROPOSAL_TO_PROPOSAL']-transitions['PROPOSAL_TO_NO_PROPOSAL']==5383-5414
result={'status':'EXECUTED','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Post-outcome development mechanism follow-up, not confirmatory','selected_shards':len(chosen),'selected_documents':documents,'targets_revisited':target_count,'transition_counts':dict(transitions),'overlapping_cause_flags':dict(causes),'multiunit_witnesses':cross,'semantic_accuracy':None,'human_labels':0}
(out/'MECHANISM_FOLLOWUP.private.json').write_text(json.dumps(result,indent=2),encoding='utf8')
