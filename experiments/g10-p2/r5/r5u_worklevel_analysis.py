#!/usr/bin/env python3
"""R5u: work-level paired evaluation diagnostics on SYNTHETIC fixtures ONLY.

Never certifies evaluator identity, treatment randomization, independent works,
rights, genuine Korean prose quality, or confirmatory inferential p-values.
"""
import hashlib
import itertools
import json
from collections import defaultdict

ARMS=('STRONG_DIRECT','RICH_PROMPT','STATE_AS_TEXT','EXECUTABLE_STATE','EQUAL_COST_ITERATIVE','NO_OP_KEEP','SHAM_STATE')
TARGET='EXECUTABLE_STATE'
COMPARATORS=('STRONG_DIRECT','STATE_AS_TEXT','EQUAL_COST_ITERATIVE')
LABELS={f'X{i}' for i in range(1,8)}

class AnalysisHold(ValueError):pass

def _canon(x):return json.dumps(x,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode('utf-8')

def _check_mapping(mapping):
    if type(mapping) is not dict or not mapping:raise AnalysisHold('PRIVATE_MAP_REQUIRED')
    for w,v in mapping.items():
        if type(w) is not str or not w or type(v) is not dict or set(v)!=LABELS or set(v.values())!=set(ARMS):
            raise AnalysisHold('INVALID_PRIVATE_MAP')

def validate(rows,mapping,policy):
    """Passes only synthetic, privately decoded fixtures; NEVER genuine human certification."""
    if type(policy) is not dict or policy.get('synthetic_only') is not True or policy.get('study_status')!='UNFROZEN':
        raise AnalysisHold('REAL_STUDY_NOT_AUTHORIZED')
    if policy.get('verified_human_outcomes')!=0 or policy.get('quality_promotion') is not False:
        raise AnalysisHold('HUMAN_OR_QUALITY_FORGERY')
    _check_mapping(mapping)
    if type(rows) is not list or not rows:raise AnalysisHold('EMPTY_OR_INVALID_ROWS')
    seen=set();assigned=defaultdict(set);contained=defaultdict(set)
    privileged={'arm','model','source_text','private_seed','private_mapping','raw_paragraph','name'}
    for r in rows:
        if type(r) is not dict:raise AnalysisHold('BAD_RECORD')
        if privileged.intersection(r):raise AnalysisHold('PRIVILEGED_FIELD_EXPOSED')
        w=r.get('work_token');label=r.get('blind_label');assessor=r.get('assessor_token');role=r.get('role')
        if any(type(s) is not str or not s for s in (w,label,assessor,role)) or w not in mapping or label not in mapping[w]:
            raise AnalysisHold('UNKNOWN_MAPPING_OR_IDENTITY')
        if role not in ('READER','SOURCE_AUDITOR'):raise AnalysisHold('INVALID_ROLE')
        k=(w,label,assessor,role)
        if k in seen:raise AnalysisHold('DUPLICATE_ASSESSMENT')
        seen.add(k);assigned[(w,assessor)].add(role)
        contained[(w,label)].add(role)
        if role=='READER':
            if type(r.get('usefulness')) is not int or not 1<=r['usefulness']<=5:raise AnalysisHold('INVALID_READER_VALUE')
            if type(r.get('naturalness')) is not int or not 1<=r['naturalness']<=5:raise AnalysisHold('INVALID_NATURALNESS_VALUE')
            if 'fidelity_error' in r:raise AnalysisHold('ROLE_MIX')
        else:
            if r.get('fidelity_error') not in ('YES','NO','UNCERTAIN'):raise AnalysisHold('INVALID_FIDELITY')
            if r['fidelity_error']=='YES' and not (r.get('source_span_token') and r.get('output_span_token')):
                raise AnalysisHold('MISSING_WITNESS')
            if 'usefulness' in r or 'naturalness' in r:raise AnalysisHold('ROLE_MIX')
    if any(len(v)>1 for v in assigned.values()):raise AnalysisHold('SAME_WORK_RATER_ROLE_OVERLAP')
    if set(mapping)!=set(w for w,l in contained):raise AnalysisHold('MAPPING_WORK_NOT_COVERED')
    return {'works':len(mapping),'records':len(rows),'status':'SYNTHETIC_SHAPE_PASS_NOT_HUMAN_CERTIFIED'}

def _work_means(rows,mapping):
    values=defaultdict(list)
    for r in rows:
        arm=mapping[r['work_token']][r['blind_label']]
        if r['role']=='READER':
            values[(r['work_token'],arm,'usefulness')].append(r['usefulness'])
            values[(r['work_token'],arm,'naturalness')].append(r['naturalness'])
        elif r['fidelity_error']!='UNCERTAIN':
            values[(r['work_token'],arm,'source_error')].append(int(r['fidelity_error']=='YES'))
    return {key:sum(lst)/len(lst) for key,lst in values.items()}

def _exact_signflip(deltas):
    """Reference 2-sided sign-flip diagnostic; not a validated study p-value."""
    if not 2<=len(deltas)<=16:return None
    t=abs(sum(deltas));total=0;extreme=0
    for signs in itertools.product((-1,1),repeat=len(deltas)):
        total+=1
        if abs(sum(d*s for d,s in zip(deltas,signs)))>=t-1e-10:extreme+=1
    return round(extreme/total,6)

def summarize(rows,mapping,policy):
    check=validate(rows,mapping,policy)
    means=_work_means(rows,mapping)
    out=[]
    for contrast in COMPARATORS:
        for metric in ('usefulness','naturalness','source_error'):
            paired=[];missing=0
            for work in sorted(mapping):
                a=means.get((work,TARGET,metric));b=means.get((work,contrast,metric))
                if a is None or b is None:missing+=1
                else:paired.append(a-b)
            out.append({'contrast':f'{TARGET}_minus_{contrast}','metric':metric,
                        'direction':'lower_is_better' if metric=='source_error' else 'higher_is_better',
                        'works_paired':len(paired),'works_missing':missing,
                        'mean_work_delta':round(sum(paired)/len(paired),6) if paired else None,
                        'signflip_reference_only':_exact_signflip(paired)})
    digest=hashlib.sha256(_canon(sorted(rows,key=lambda r:(r['work_token'],r['blind_label'],r['assessor_token'],r['role'])))).hexdigest()
    return {'schema':'ksgt.g10p2.r5u.worklevel-synthetic.v1','status':'SYNTHETIC_DIAGNOSTICS_ONLY',
            'input_rows_sha256':digest,'independent_human_outcomes':0,'provider_calls_new':0,
            'independence_claim':False,'quality_promotion':False,'confirmed_inference':False,
            'work_count':check['works'],'row_count':check['records'],'contrasts':out,
            'warning':'No blinded live study, no genuine Korean prose outcomes; exact sign flip requires justified exchangeability/randomization and must not be reported as confirmatory evidence.'}


def outcome_lock(rows,policy):
    """One-way synthetic hash receipt; NEVER authorizes real unblinding."""
    if policy.get('synthetic_only') is not True or policy.get('verified_human_outcomes')!=0:
        raise AnalysisHold('REAL_OUTCOME_LOCK_NOT_AUTHORIZED')
    return {'schema':'ksgt.g10p2.r5u.synthetic-lock.v1','lock_digest':hashlib.sha256(_canon(rows)).hexdigest(),
            'lock_status':'SYNTHETIC_DEMONSTRATION_ONLY','private_mapping_disclosed':False,
            'real_study_unblinding_permitted':False}
