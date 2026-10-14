"""Source-bound descriptor/particle-role policies and staged cause evidence.

Descriptor and role categories are surface proxies. No result licenses an
antecedent, participant role in a semantic event, or human ground truth.
"""
import hashlib,json,re
import p62_r4_guarded_v3 as v3
from p62_r4_admission_v3 import admit_graph
from p62_r4_r3_source_witness import verify_structure_binding
from p62_r3_stream_inference import stream_coordinates

VERSION='P62-R4-R5-descriptor-role-stages-v1'
DESCRIPTOR=re.compile(r'([가-힣]{2,12})\s*$')
TARGET_DESCRIPTOR=re.compile(r'^\s*([가-힣]{2,12})\s+(?=(?:\d|하나|한|둘|두|셋|세|넷|네|다섯|여섯|일곱|여덟|아홉|열))')
PARTICLE=re.compile(r'^(에게서|에게|에서|으로|은|는|이|가|을|를|와|과|의|에|도|만)')
ROLE={**dict.fromkeys(['이','가'],'SUBJECT_PARTICLE'),**dict.fromkeys(['은','는'],'TOPIC_PARTICLE'),**dict.fromkeys(['을','를'],'OBJECT_PARTICLE'),**dict.fromkeys(['와','과'],'COORDINATING_PARTICLE'),**dict.fromkeys(['의'],'GENITIVE_PARTICLE'),**dict.fromkeys(['에게','에게서'],'DATIVE_PARTICLE'),**dict.fromkeys(['에','에서','으로'],'LOCATIVE_OR_DIRECTION_PARTICLE'),**dict.fromkeys(['도','만'],'OTHER_PARTICLE')}

def _role(text):
 m=PARTICLE.match(text)
 return ROLE[m.group()] if m else None
def _descriptor(unit,start):
 m=DESCRIPTOR.search(unit[max(0,start-24):start])
 if not m:return None
 absolute=max(0,start-24)+m.start(1)
 return {'surface':m.group(1),'start':absolute,'end':absolute+len(m.group(1)),'authority':'ORIGINAL_SURFACE_ONLY'}
def _target_features(forms,target):
 suffix=forms[target['unit']][target['end']:target['end']+80]
 m=TARGET_DESCRIPTOR.match(suffix)
 descriptor=m.group(1) if m else None
 quantity=v3.kernel.R4_COUNT.search(suffix[:36])
 role=_role(suffix[quantity.end():]) if quantity else None
 return {'descriptor_surface':descriptor,'particle_role_proxy':role,'target_quantity_surface_observed':quantity is not None,
         'authority':'TARGET_SUFFIX_SURFACE_CONSTRAINT_ONLY_NOT_SOURCE_EVIDENCE'}
def _choose(candidates,target_start):
 if not candidates:return {'status':'ABSTAIN_NO_MATCHING_SOURCE_CUE','selected':None,'competing':0}
 ordered=sorted(candidates,key=lambda x:(target_start-x['witness']['global_end'],x['id']))
 best=target_start-ordered[0]['witness']['global_end']
 near=[x for x in ordered if target_start-x['witness']['global_end']-best<=48]
 if len(near)!=1:return {'status':'ABSTAIN_COMPETING_SOURCE_CUES','selected':None,'competing':len(near)}
 return {'status':'PROVISIONAL_SOURCE_FRAGMENT_ONLY','selected':near[0]['id'],'competing':0}
def infer(forms,target,identity,frozen_v3=None):
 verify_structure_binding(forms,identity)
 result=frozen_v3 if frozen_v3 is not None else v3.infer(forms,target,identity)
 fresh=v3.infer(forms,target,identity)
 if v3.digest(result)!=v3.digest(fresh):raise ValueError('Caller-supplied frozen graph or policy differs from source replay')
 offsets,target_start,_=stream_coordinates(forms,target)
 root=v3.kernel.infer(forms,target,use_target_constraints=True)
 source_admission=admit_graph(forms,target,result)
 if result['source_admission']['status']!=source_admission['status']:raise ValueError('Source admission changed')
 feature=_target_features(forms,target)
 evidence=[];eligible=set(result.get('eligible_ids',[]))
 for n in result.get('nodes',[]):
  w=n['witness'];unit=forms[w['unit']];limit=target['start'] if w['unit']==target['unit'] else len(unit)
  if w['global_end']>target_start or w['end']>limit:raise ValueError('Future source node')
  descriptor=_descriptor(unit,w['start']);role=_role(unit[w['end']:min(limit,w['end']+8)])
  if descriptor and unit[descriptor['start']:descriptor['end']]!=descriptor['surface']:raise ValueError('Descriptor source witness mismatch')
  evidence.append({'node_id':n['id'],'original_unit':w['unit'],'numeric_span':[w['start'],w['end']],
                   'descriptor':descriptor,'particle_role_proxy':role,'eligible_under_frozen_v3':n['id'] in eligible,
                   'source_span_sha256':w['sha256'],'semantic_role':None,'human_ground_truth':None})
 by_id={x['node_id']:x for x in evidence}
 pool=[n for n in result.get('nodes',[]) if n['id'] in eligible]
 valid=(source_admission['status']=='VERIFIED_TYPED_SOURCE_GRAPH_ONLY'
        and root['status']!='HOLD_INVALID_QUOTE_SCOPE'
        and result['status'] not in ('HOLD_UNMODELED_TARGET_QUANTITY_BOUNDARY','HOLD_UNPARSED_TARGET_REQUIREMENT'))
 union_evidence=[]
 possible=set(result.get('competing_union_ids',[]))
 for union in result.get('unions',[]):
  marker=union['coordinator_witness'];unit=forms[marker['unit']]
  if hashlib.sha256(unit[marker['start']:marker['end']].encode()).hexdigest()!=marker['sha256']:raise ValueError('Coordinator original witness mismatch')
  union_evidence.append({'union_id':union['id'],'component_ids':union['component_ids'],
   'component_descriptor_surfaces':[(by_id[x]['descriptor'] or {}).get('surface') for x in union['component_ids']],
   'component_particle_role_proxies':[by_id[x]['particle_role_proxy'] for x in union['component_ids']],
   'coordinator_span_sha256':marker['sha256'],
   'membership_overlap':'UNOBSERVED','possible_under_frozen_v3':union['id'] in possible,
   'reference_licensed':False,'human_ground_truth':None})
 d=feature['descriptor_surface'];role=feature['particle_role_proxy']
 m1=_choose([n for n in pool if d is not None and (by_id[n['id']]['descriptor'] or {}).get('surface')==d],target_start) if valid else {'status':'HOLD_SOURCE_OR_SCOPE','selected':None,'competing':0}
 m2=_choose([n for n in pool if role is not None and by_id[n['id']]['particle_role_proxy']==role],target_start) if valid else {'status':'HOLD_SOURCE_OR_SCOPE','selected':None,'competing':0}
 m3=_choose([n for n in pool if d is not None and role is not None and (by_id[n['id']]['descriptor'] or {}).get('surface')==d and by_id[n['id']]['particle_role_proxy']==role],target_start) if valid else {'status':'HOLD_SOURCE_OR_SCOPE','selected':None,'competing':0}
 m4=_choose(pool,target_start) if valid else {'status':'HOLD_SOURCE_OR_SCOPE','selected':None,'competing':0}
 if valid and possible:
  m3={'status':'HOLD_COMPETING_COORDINATED_GROUP','selected':None,'competing':len(possible)}
  m4={'status':'HOLD_COMPETING_COORDINATED_GROUP','selected':None,'competing':len(possible)}
 chain=[{'stage':'ORIGINAL_STRUCTURE','status':'VERIFIED_SOURCE_STRUCTURE_ONLY'},
        {'stage':'SOURCE_SPAN_ADMISSION','status':source_admission['status']},
        {'stage':'ASSERTION_AND_QUOTATION_SCOPE','status':root['status'],'invalid_quote':root['status']=='HOLD_INVALID_QUOTE_SCOPE'},
        {'stage':'TARGET_LOCAL_COMPATIBILITY','status':result['status'],'target_constraint':result.get('target_local_constraint'),
         'masked_earlier_quote_hold':root['status']=='HOLD_INVALID_QUOTE_SCOPE' and result['status']!=root['status']}]
 return {'version':VERSION,'m0_v3_status':result['status'],'m0_v3_selected':(result.get('selected') or {}).get('id'),
         'm1_descriptor':m1,'m2_particle_role':m2,'m3_descriptor_and_role':m3,'m4_staged':m4,
         'target_surface_features':feature,'source_evidence':evidence,'union_evidence':union_evidence,'cause_chain':chain,
         'original_source_custody':'STRUCTURE_BOUND_ARCHIVE_WITNESS_EXTERNAL','reference_licensed':False,
         'semantic_accuracy':None,'human_ground_truth':None,'uncertainty':'Surface descriptors and case particles are not verified semantic features'}

