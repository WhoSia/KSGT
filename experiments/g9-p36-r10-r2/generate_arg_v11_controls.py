import json,sys
out=sys.argv[1]
def role(slot_id='E1|S1',slot='SUBJECT',ref='R1',auth='BOUND_ENDOPHORIC',recovery='EXPLICIT',sem=None):
    return {'slot_instance_id':slot_id,'syntactic_slot':slot,'semantic_role':sem,'referent':ref,'referent_authority':auth,
      'frame_status':'UNKNOWN','recovery':recovery,'witness':'W' if recovery.startswith('ZERO_') and recovery!='ZERO_GENERIC_OR_EXOPHORIC' else None,
      'particle':None,'role_source':'FRAME_PLUS_CONTEXT'}
def graph(event='E1',slot_id='E1|S1',real=None,ref='R1',auth='BOUND_ENDOPHORIC',sem=None,recovery='EXPLICIT'):
    return {'version':'KSGT-ARG-v1.1','event':{'predicate':'보다','sense':'SEE','instance_id':event},
      'roles':[role(slot_id=slot_id,ref=ref,auth=auth,sem=sem,recovery=recovery)],'scope':{},'discourse':{},'realization':real or {}}
tests=[
 {'id':'same_token_different_order_realization','op':'equivalent','left':graph(real={'order':'A'}),'right':graph(real={'order':'B'}),'expected_pass':True},
 {'id':'different_event_same_type_rejected','op':'equivalent','left':graph(event='E1'),'right':graph(event='E2',slot_id='E2|S1'),'expected_pass':False},
 {'id':'different_slot_instance_same_event_rejected','op':'equivalent','left':graph(slot_id='E1|S1'),'right':graph(slot_id='E1|S2'),'expected_pass':False},
 {'id':'same_token_semantic_role_change_rejected','op':'equivalent','left':graph(sem='AGENT'),'right':graph(sem='EXPERIENCER'),'expected_pass':False},
 {'id':'same_token_referent_change_rejected','op':'equivalent','left':graph(ref='R1'),'right':graph(ref='R2'),'expected_pass':False},
 {'id':'same_token_authority_change_rejected','op':'equivalent','left':graph(ref=None,auth='EXOPHORIC_UNSPECIFIED'),'right':graph(ref=None,auth='UNRESOLVED'),'expected_pass':False},
 {'id':'external_unknown_different_tokens_rejected','op':'equivalent','left':graph(event='E1',slot_id='E1|S1',ref=None,auth='EXOPHORIC_UNSPECIFIED',recovery='ZERO_GENERIC_OR_EXOPHORIC'),'right':graph(event='E2',slot_id='E2|S1',ref=None,auth='EXOPHORIC_UNSPECIFIED',recovery='ZERO_GENERIC_OR_EXOPHORIC'),'expected_pass':False},
 {'id':'missing_event_id_invalid','op':'validate','left':{**graph(), 'event':{'predicate':'보다','sense':'SEE','instance_id':''}},'expected_pass':False}
]
with open(out,'w',encoding='utf8') as w:
    for t in tests:w.write(json.dumps(t,ensure_ascii=False)+'\n')
print(json.dumps({'controls':len(tests)}))
