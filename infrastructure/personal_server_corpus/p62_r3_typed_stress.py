"""Exhaustive original two-group typed-frame stress, not corpus semantic gold."""
import json,pathlib,datetime
import p62_reference as ref
from p62_r3_typed_inference import infer
def run():
 counters=['명','마리','건'];counts={'cases':0,'counter_or_cardinality_violations':0,'future_unit_violations':0,'forward_candidate_violations':0,'ambiguous_cases':0,'abstained_cases':0,'selected_cases':0}
 for ca in counters:
  for cb in counters:
   for a in range(2,7):
    for b in range(2,7):
     for requested in counters:
      for n in range(1,9):
       forms=[f'집단 에이 {a} {ca}과 집단 비 {b} {cb}.',f'그 중 {n} {requested}.','후행 통제.']
       m=ref.TARGET.search(forms[1]);t={'unit':1,'start':m.start(),'end':m.end(),'observed':True};r=infer(forms,t);counts['cases']+=1
       compatible={tuple(x) for x in r['candidate_global_spans']}
       for node in r['prefix_nodes']:
        span=(node['global_start'],node['global_end'])
        if span in compatible and (node['counter']!=requested or node['cardinality']<n):counts['counter_or_cardinality_violations']+=1
        if node['global_end']>len(forms[0])+t['start']:counts['forward_candidate_violations']+=1
       control=infer(forms[:-1]+['999 マリ, unrelated future.'],t)
       counts['future_unit_violations']+=control['selected_global_span']!=r['selected_global_span'] or control['candidate_global_spans']!=r['candidate_global_spans']
       counts['selected_cases']+=r['selected_global_span'] is not None;counts['abstained_cases']+=r['selected_global_span'] is None;counts['ambiguous_cases']+=len(compatible)>1
 result={'status':'EXECUTED','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'original_authored_typed_frames':counts,'semantic_ground_truth':None,'scope':'Compatibility in declared individual-group counter/cardinality frames only; coordinated union groups, actual discourse reference, naturalness and human accuracy are outside this oracle'}
 assert counts['cases']==5400
 assert counts['counter_or_cardinality_violations']==counts['future_unit_violations']==counts['forward_candidate_violations']==0
 return result
if __name__=='__main__':
 out=pathlib.Path(r'C:\KSGT_SERVER\70_RUNS\p62_r3_20261012\TYPED_EXHAUSTIVE_STRESS_RESULTS.json')
 if out.exists():raise FileExistsError('Preserve prior results')
 result=run();out.write_text(json.dumps(result,indent=2),encoding='utf8');print(json.dumps(result))
