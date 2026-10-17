"""Typed proposal/constraint separation; compatibility never establishes reference.

Only prefix spans may propose groups. Immediate target-internal number/counter
may constrain them; later source units cannot propose an antecedent. Alternative
source interpretations and absence of semantic gold remain explicit.
"""
import re
from p62_r3_stream_inference import infer as prior,stream_coordinates,COUNT,AMBIGUITY_GAP
def quote_scope(s):return (s.count('"')%2,s.count('“')-s.count('”'))
def infer(forms,target,use_target_constraints=True):
 offsets,start,end=stream_coordinates(forms,target);stream=''.join(forms)
 base=prior(forms,target,filters=False);target_scope=quote_scope(stream[:start])
 # A target-local constraint may not cross its observed original source unit.
 # Unlike prefix character coordinates, this admission boundary is structural.
 tail=forms[target['unit']][target['end']:target['end']+80];white=re.match(r'\s*',tail).end();quantity=COUNT.match(tail,white)
 constraint=None
 if quantity and use_target_constraints:
  raw=quantity.group('number')
  from p62_reference import NUMBERS
  number=int(raw) if raw.isdigit() else NUMBERS.get(raw)
  constraint={'counter':quantity.group('counter'),'cardinality':number,'global_span':[end+quantity.start(),end+quantity.end()],'authority':'OBSERVED_TARGET_LOCAL_SURFACE_CONSTRAINT_NOT_SEMANTIC_GOLD'}
 admitted=[];blocked=[]
 for n in base['nodes']:
  reasons=[];a=n['global_start'];b=n['global_end'];before=stream[:a]
  boundary=max(before.rfind('.'),before.rfind('!'),before.rfind('?'),before.rfind('\n'))+1
  if quote_scope(before)!=target_scope:reasons.append('DIFFERENT_QUOTE_SCOPE_RULE')
  if re.search('만약|가정|예를 들어',before[boundary:]):reasons.append('HYPOTHETICAL_CUE_RULE')
  if re.match(r'^(?:은|는|이|가|도|만)?\s*(?:없|아니)',stream[b:start]):reasons.append('ADJACENT_EXISTENTIAL_NEGATION_RULE')
  if constraint:
   if n['counter']!=constraint['counter']:reasons.append('COUNTER_CONSTRAINT_CONFLICT')
   elif constraint['cardinality'] is not None and n['cardinality']<constraint['cardinality']:reasons.append('CARDINALITY_CONSTRAINT_CONFLICT')
  node={**n,'exclusion_reasons':reasons};(blocked if reasons else admitted).append(node)
 admitted.sort(key=lambda x:(x['character_distance'],x['node_id']))
 compatible=[] if not admitted else [x for x in admitted if x['character_distance']-admitted[0]['character_distance']<=AMBIGUITY_GAP]
 selected=compatible[0] if len(compatible)==1 else None
 return {'status':'CONSTRAINT_COMPATIBLE_PROPOSAL' if selected else 'ABSTAIN_COMPETING_OR_NO_COMPATIBLE_GROUP','selected_global_span':None if selected is None else [selected['global_start'],selected['global_end']],'candidate_global_spans':[[x['global_start'],x['global_end']] for x in compatible],'target_constraint':constraint,'prefix_nodes':base['nodes'],'blocked':blocked+base['excluded'],'human_ground_truth':None,'semantic_accuracy':None,'authority':'SURFACE_CONSTRAINT_COMPATIBILITY_NOT_ENTAILMENT'}
