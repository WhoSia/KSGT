"""Development-only causal HOLD taxonomy; frozen decisions remain unchanged."""
import p62_r4_guarded_v3 as guarded
from p62_r4_r3_source_witness import verify_structure_binding

def infer(forms,target,identity):
    verify_structure_binding(forms,identity)
    result=guarded.infer(forms,target,identity)
    kernel=guarded.kernel.infer(forms,target,use_target_constraints=True)
    inherited=kernel['status'];reported=result['status']
    causal=inherited if inherited=='HOLD_INVALID_QUOTE_SCOPE' else reported
    return {'status':'EXECUTED_DEVELOPMENT_SCOPE_DIAGNOSTICS','causal_status':causal,
            'frozen_v3_status':reported,'kernel_status':inherited,
            'masked_quotation_hold':inherited=='HOLD_INVALID_QUOTE_SCOPE' and reported!=inherited,
            'selected':result.get('selected'),'reference_licensed':False,
            'human_ground_truth':None,'semantic_accuracy':None,
            'claim_ceiling':'Mechanical root-status preservation, not true discourse scope or reference validation'}
