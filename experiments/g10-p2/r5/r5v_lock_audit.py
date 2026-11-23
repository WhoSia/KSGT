#!/usr/bin/env python3
"""KSGT R5v synthetic-only blinded evaluation: canonical outcome locking and missingness bounds.

A digest is NOT an immutable signed lock and confers no real unblinding approval.
"""
import hashlib
import json
from collections import defaultdict

class LockHold(ValueError): pass

FIELDS={'work_token','blind_label','assessor_token','role','usefulness','naturalness','fidelity_error','source_span_token','output_span_token'}
KEY=('work_token','blind_label','role','assessor_token')
LABELS={f'X{i}' for i in range(1,8)}

def _canonical(obj):
    return json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False).encode('utf-8')

def validate_rows(rows):
    if type(rows) is not list or not rows:raise LockHold('EMPTY_OR_BAD_ROWS')
    keys=set();roles=defaultdict(set);out=[]
    for row in rows:
        if type(row) is not dict or set(row)-FIELDS:raise LockHold('UNKNOWN_OR_PRIVILEGED_FIELD')
        if any(type(row.get(k)) is not str or not row[k] for k in KEY):raise LockHold('BAD_ROW_ID')
        if row['blind_label'] not in LABELS:raise LockHold('UNBLINDED_ARM')
        k=tuple(row[x] for x in KEY)
        if k in keys:raise LockHold('DUPLICATE_RATING')
        keys.add(k)
        roles[(row['work_token'],row['assessor_token'])].add(row['role'])
        if row['role']=='READER':
            if not all(type(row.get(x)) is int and 1<=row[x]<=5 for x in ('usefulness','naturalness')):raise LockHold('INVALID_READER_SCORE')
            if any(x in row for x in ('fidelity_error','source_span_token','output_span_token')):raise LockHold('ROLE_FIELD_LEAK')
        elif row['role']=='SOURCE_AUDITOR':
            if row.get('fidelity_error') not in ('YES','NO','UNCERTAIN'):raise LockHold('INVALID_FIDELITY')
            if any(x in row for x in ('usefulness','naturalness')):raise LockHold('ROLE_FIELD_LEAK')
            if row['fidelity_error']=='YES' and not all(type(row.get(x)) is str and row[x] for x in ('source_span_token','output_span_token')):raise LockHold('MISSING_WITNESS')
        else:raise LockHold('INVALID_ROLE')
        out.append(row)
    if any(r!={'READER'} and r!={'SOURCE_AUDITOR'} for r in roles.values()):raise LockHold('ROLE_OVERLAP')
    return sorted(out,key=lambda r:tuple(r[k] for k in KEY))

def canonical_lock(rows,policy):
    if type(policy) is not dict or policy.get('synthetic_only') is not True or policy.get('study_status')!='UNFROZEN' or policy.get('verified_human_outcomes')!=0:
        raise LockHold('REAL_STUDY_LOCK_UNAUTHORIZED')
    safe=validate_rows(rows)
    digest=hashlib.sha256(b'KSGT-R5v-SYNTHETIC-OUTCOME-V1\0'+_canonical(safe)).hexdigest()
    return {'schema':'ksgt.g10p2.r5v.canonical-synthetic-lock.v1','lock_sha256':digest,'row_count':len(safe),
            'synthetic_only':True,'real_lock_verified':False,'real_unblinding_authorized':False,
            'independent_raters_verified':False,'quality_promotion':False}

def fidelity_bounds(rows, arm_key, target='EXECUTABLE_STATE', comparator='STATE_AS_TEXT'):
    """Worst-case bounds for error rate difference when UNKNOWN appears. Fully synthetic.

    For each arm on each work, missing audit labels are [0,1]; observed YES=1, NO=0.
    Returns equally work-weighted interval of target minus comparator; no inference.
    """
    validate_rows(rows)
    if type(arm_key) is not dict or not arm_key:raise LockHold('PRIVATE_MAPPING_REQUIRED')
    by=defaultdict(list)
    for row in rows:
        if row['role']!='SOURCE_AUDITOR':continue
        w,label=row['work_token'],row['blind_label']
        mapping=arm_key.get(w)
        if type(mapping) is not dict or set(mapping)!={f'X{i}' for i in range(1,8)} or len(set(mapping.values()))!=7:raise LockHold('INVALID_PRIVATE_MAPPING')
        arm=mapping.get(label)
        by[(w,arm)].append(row['fidelity_error'])
    deltas=[];unknown_work=0
    for w in sorted(arm_key):
        vals=[]
        for arm in (target,comparator):
            x=by.get((w,arm),[])
            if not x:raise LockHold('MISSING_ARM_AUDIT')
            known=[1 if v=='YES' else 0 for v in x if v!='UNCERTAIN']
            missing=len(x)-len(known)
            vals.append((sum(known)/len(x),(sum(known)+missing)/len(x),missing))
        a,b=vals
        if a[2]+b[2]:unknown_work+=1
        deltas.append((a[0]-b[1],a[1]-b[0]))
    if not deltas:raise LockHold('NO_WORKS')
    return {'schema':'ksgt.g10p2.r5v.fidelity-sensitivity.v1','works':len(deltas),'works_with_uncertainty':unknown_work,
            'lower_delta':round(sum(v[0] for v in deltas)/len(deltas),6),
            'upper_delta':round(sum(v[1] for v in deltas)/len(deltas),6),
            'meaning':'worst-case bounds for unknown source-error labels, not a statistical confidence interval',
            'confirmed_inference':False,'quality_promotion':False}
