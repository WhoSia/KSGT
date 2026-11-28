#!/usr/bin/env python3
"""Separate blind-reader and source-auditor *shape* tests, not human-gold verification."""
from collections import defaultdict

class EvaluationError(ValueError):pass

def validate(rows, arm_keys=None):
    if not isinstance(rows,list):raise EvaluationError('NOT_LIST')
    seen=set();assigned=defaultdict(set);count={'READER':0,'SOURCE_AUDITOR':0}
    for x in rows:
        if type(x) is not dict:raise EvaluationError('BAD_ROW')
        role=x.get('role'); work=x.get('work_token'); assessor=x.get('assessor_token');label=x.get('blind_label')
        if role not in count or any(type(v) is not str or not v for v in (work,assessor,label)):
            raise EvaluationError('BAD_IDENTITIES')
        if label not in {'X'+str(i) for i in range(1,8)}:raise EvaluationError('UNBLINDED_LABEL')
        if any(k in x for k in ('arm','model_name','allocation_seed','private_mapping','source_text')):
            raise EvaluationError('PRIVILEGED_FIELD_LEAK')
        key=(role,work,label,assessor)
        if key in seen:raise EvaluationError('DUPLICATE_ASSESSMENT')
        seen.add(key);assigned[(work,assessor)].add(role)
        if role=='READER':
            for k in ('usefulness','naturalness'):
                if type(x.get(k)) is not int or x[k] not in range(1,6):raise EvaluationError('BAD_READER_SCORE')
            if 'fidelity_error' in x:raise EvaluationError('ROLE_CROSSOVER')
        else:
            if x.get('fidelity_error') not in ('YES','NO','UNCERTAIN'):
                raise EvaluationError('BAD_FIDELITY')
            if x['fidelity_error']=='YES' and (not x.get('source_span_token') or not x.get('output_span_token')):
                raise EvaluationError('MISSING_SPAN_WITNESS')
            if any(k in x for k in ('usefulness','naturalness')):raise EvaluationError('ROLE_CROSSOVER')
        count[role]+=1
    if any(len(v)>1 for v in assigned.values()):raise EvaluationError('READER_AUDITOR_OVERLAP_SAME_WORK')
    return {'schema':'ksgt.g10p2.r5t.evaluation-shape.v1','schema_valid_counts':count,
            'independently_verified_human_outcomes':False,'quality_promotion':False,
            'source_work_independence_verified':False}
