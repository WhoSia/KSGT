"""Conditional composition diagnostics, separate from reference selection.

Singleton constituents are finite sets, although they fail the inherited
individual plural-cue policy. Unknown overlap and source scope remain explicit.
No diagnostic licenses an antecedent or changes the frozen guarded-v3 decision.
"""
import p62_r4_guarded_v3 as guarded
from p62_r4_admission_v3 import admit_graph
from p62_r4_r3_source_witness import verify_structure_binding
from p62_r4_r3_component_bounds import compose

VERSION='P62-R4-R4-conditional-diagnostics-v1'

def diagnose(forms,target,identity,result):
    verify_structure_binding(forms,identity)
    scope=guarded.source_scope(identity)
    if result.get('source_scope_sha256')!=scope:
        raise ValueError('Graph belongs to another source occurrence')
    admission=admit_graph(forms,target,result)
    if admission['status']!='VERIFIED_TYPED_SOURCE_GRAPH_ONLY':
        return {'status':admission['status'],'unions':[], 'reference_licensed':False,'human_ground_truth':None}
    # Source-span admission alone does not validate caller-supplied policy flags.
    # Recompute the frozen instrument rather than trusting edited blocked lists.
    if guarded.digest(result)!=guarded.digest(guarded.infer(forms,target,identity)):
        return {'status':'HOLD_FROZEN_POLICY_BINDING','unions':[], 'reference_licensed':False,'human_ground_truth':None}
    nodes={n['id']:n for n in result.get('nodes',[])}
    blocked={b['node_id']:set(b['reasons']) for b in result.get('blocked',[])}
    output=[]
    for union in result.get('unions',[]):
        reasons=set()
        # Individual selection filters do not constitute failures of set union.
        for token in union['component_ids']:
            reasons.update(blocked.get(token,set())-{'NONPLURAL_GROUP','INSUFFICIENT_INDIVIDUAL_GROUP_SIZE','COUNTER_MISMATCH'})
        components=[nodes[i] for i in union['component_ids']]
        conditional=compose([{'id':n['id'],'scope':scope,'cardinality':n['cardinality']} for n in components],[union['component_ids']])
        constraint=result.get('target_local_constraint')
        status='CONDITIONAL_UNION_UNCERTAINTY_ONLY'
        if reasons:status='HOLD_INHERITED_SCOPE_OR_ASSERTION'
        elif conditional['status']!='CONDITIONAL_UNIQUE_SYMBOL_UNION_BOUND':status=conditional['status']
        elif constraint:
            q=constraint.get('cardinality')
            if constraint.get('status')=='UNPARSED_TARGET_QUANTITY_HOLD' or type(q) is not int:
                status='HOLD_TARGET_QUANTITY'
            elif constraint.get('counter')!=union['counter']:status='HOLD_COUNTER_MISMATCH'
            elif q>conditional['upper']:status='IMPOSSIBLE_UNDER_DECLARED_FINITE_SET_PREMISES'
            elif q<=conditional['lower']:status='GUARANTEED_CAPACITY_UNDER_DECLARED_FINITE_SET_PREMISES'
            else:status='OVERLAP_DEPENDENT_CAPACITY_UNDER_DECLARED_FINITE_SET_PREMISES'
        output.append({'union_id':union['id'],'status':status,'blocking_reasons':sorted(reasons),'bounds':conditional,
                       'singleton_constituents':sum(n['cardinality']==1 for n in components),
                       'source_interpretation':'SURFACE_COORDINATION_NOT_DENOTATION_GOLD','reference_licensed':False,'human_ground_truth':None})
    return {'status':'EXECUTED_CONDITIONAL_DIAGNOSTICS_ONLY','instrument_version':VERSION,'unions':output,
            'frozen_v3_status':result['status'],'frozen_v3_selected':result.get('selected'),
            'reference_licensed':False,'human_ground_truth':None,'semantic_accuracy':None}

def infer(forms,target,identity):
    result=guarded.infer(forms,target,identity)
    return diagnose(forms,target,identity,result)
