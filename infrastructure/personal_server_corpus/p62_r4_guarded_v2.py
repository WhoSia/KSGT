"""R4-R2 guarded instrument: isolated numeral tokens and source-scoped graph IDs.

The frozen baseline module is loaded in a separate namespace and is never mutated.
Caller-supplied source identity requires external corpus custody verification.
"""
import hashlib,importlib.util,json,pathlib,re
import p62_r4_discourse as base
from p62_r4_admission_v2 import admit_graph

VERSION='P62-R4-R2-guarded-v2'
spec=importlib.util.spec_from_file_location('_ksgt_r4_guarded_kernel',pathlib.Path(base.__file__))
kernel=importlib.util.module_from_spec(spec)
spec.loader.exec_module(kernel)
kernel.R4_COUNT=re.compile(r'(?<![가-힣\d.,+\-~∼–−])'+base.R4_COUNT.pattern)
number_words='|'.join(sorted(base.R4_NUMBERS,key=len,reverse=True))
QUANTITY_START=re.compile(r'^\s*(?:\d+(?:[.,]\d+)*|'+number_words+r')\s*(?:가지|마리|차례|명|개|곳|건|팀|편|번|회)')

def digest(value):
    return hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def source_scope(identity):
    if not isinstance(identity,dict):raise ValueError('Explicit source occurrence identity required')
    for field in ('strict_structure','member_key','archive_sha256'):
        if not isinstance(identity.get(field),str) or not re.fullmatch('[0-9a-f]{64}',identity[field]):
            raise ValueError('Invalid source identity digest')
    if type(identity.get('document_ordinal')) is not int or identity['document_ordinal']<0:
        raise ValueError('Invalid source document ordinal')
    return digest({field:identity[field] for field in ('strict_structure','member_key','archive_sha256','document_ordinal')})

def infer(forms,target,source_identity,use_target_constraints=True):
    scope=source_scope(source_identity)
    result=kernel.infer(forms,target,use_target_constraints=use_target_constraints)
    tail=forms[target['unit']][target['end']:target['end']+80]
    if use_target_constraints and result.get('target_local_constraint') is None and QUANTITY_START.match(tail):
        result['status']='HOLD_UNMODELED_TARGET_QUANTITY_BOUNDARY'
        result['selected']=None
    admission=admit_graph(forms,target,result)
    if admission['status']!='VERIFIED_TYPED_SOURCE_GRAPH_ONLY':
        result['status']=admission['status'];result['selected']=None
    result['source_admission']=admission
    result['instrument_version']=VERSION
    result['source_scope_sha256']=scope
    result['source_identity_authority']='CALLER_BOUND_OCCURRENCE_REQUIRES_EXTERNAL_CUSTODY_NOT_WORLD_WORK_GOLD'
    result['scoped_node_ids']={node['id']:digest(['SOURCE_OCCURRENCE_GROUP',scope,node['id']]) for node in result.get('nodes',[])}
    result['scoped_union_ids']={union['id']:digest(['SOURCE_OCCURRENCE_UNION',scope,union['id']]) for union in result.get('unions',[])}
    result['scoped_prefix_state_sha256']=digest([VERSION,scope,result.get('state_sha256'),result['scoped_node_ids'],result['scoped_union_ids']])
    result['guarded_decision_sha256']=digest([VERSION,result.get('decision_sha256'),result['status'],result.get('selected'),admission])
    return result
