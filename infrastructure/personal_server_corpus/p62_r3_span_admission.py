"""Source-span admission is distinct from a model proposal or semantic reference."""
from p62_r3_stream_inference import stream_coordinates,provenance,COUNT
def admit(forms,target,result):
 for key in ('unit','start','end'):
  if type(target.get(key)) is not int:raise ValueError('Target offsets must be integers')
 offsets,source_start,_=stream_coordinates(forms,target)
 span=result.get('selected_global_span')
 if span is None:return {'status':'ABSTAIN','admitted_selected_global_span':None,'semantic_ground_truth':None}
 if not isinstance(span,list) or len(span)!=2 or any(type(x) is not int for x in span):raise ValueError('Invalid selected span identity')
 a,b=span
 if not 0<=a<b<=source_start:raise ValueError('Selected source span is not strictly pre-target')
 witnesses=provenance(offsets,a,b)
 if len(witnesses)!=1:return {'status':'HOLD_MULTIUNIT_EXPRESSION_WITNESS','admitted_selected_global_span':None,'original_proposal':span,'original_unit_spans':witnesses,'semantic_ground_truth':None}
 w=witnesses[0];text=forms[w['unit']][w['start']:w['end']]
 if COUNT.fullmatch(text) is None:raise ValueError('Selected span is not an exact unchanged numeric-group fragment')
 if not any(m.start()==w['start'] and m.end()==w['end'] for m in COUNT.finditer(forms[w['unit']])):
  return {'status':'HOLD_TRUNCATED_OR_CONTEXT_INVALID_FRAGMENT','admitted_selected_global_span':None,'original_proposal':span,'semantic_ground_truth':None}
 return {'status':'VERIFIED_SOURCE_FRAGMENT_ONLY','admitted_selected_global_span':span,'original_unit_span':w,'semantic_ground_truth':None,'reference_licensed':False}
