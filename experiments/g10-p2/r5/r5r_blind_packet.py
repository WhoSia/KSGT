#!/usr/bin/env python3
"""Create metadata-only G10-P2 seven-arm blind task allocations, never response text.

This is a *preflight* and not a fully frozen, powered or reader-rated preregistration.
Works must have independently audited lineage; caller-supplied flags are not independently authenticated.
"""
import argparse
import hashlib
import hmac
import json
from collections import Counter
from pathlib import Path

ARMS = ('STRONG_DIRECT','RICH_PROMPT','STATE_AS_TEXT','EXECUTABLE_STATE',
        'EQUAL_COST_ITERATIVE','NO_OP_KEEP','SHAM_STATE')

class PacketError(ValueError): pass

def _id(seed, *parts):
    return hmac.new(seed.encode(), '|'.join(parts).encode(), hashlib.sha256).hexdigest()

def validate_config(cfg):
    if not isinstance(cfg, dict) or cfg.get('schema')!='ksgt.g10p2.r5r.preflight-config.v1':
        raise PacketError('BAD_CONFIG_SCHEMA')
    if cfg.get('status')!='UNFROZEN_PREFLIGHT': raise PacketError('MUST_REMAIN_UNFROZEN')
    if cfg.get('human_outcomes') != 0 or cfg.get('new_model_calls')!=0: raise PacketError('OUTCOME_OR_CALL_FORGERY')
    if tuple(cfg.get('arms',()))!=ARMS:raise PacketError('ARM_MISMATCH')
    for k in ('private_allocation_seed','model_identity','source_boundary_audit_id','rubric_revision','cost_contract_revision'):
        if not isinstance(cfg.get(k),str) or not cfg[k].strip():raise PacketError('MISSING_CONFIG:'+k)
    if cfg.get('synthetic_only') is not True:
        raise PacketError('LIVE_STUDY_NOT_AUTHORIZED_BY_PREFLIGHT')
    if cfg.get('source_boundary_verified') is not True:
        raise PacketError('SOURCE_BOUNDARY_NOT_AUDITED')
    if cfg.get('license_reviewed') is not True:
        raise PacketError('LICENSE_NOT_REVIEWED')
    if cfg.get('actual_human_quality_gold') is True:raise PacketError('GOLD_FORGERY')
    return True

def private_key(cfg, tasks):
    """Return local-only label-to-arm mappings. Do NOT commit or share with raters."""
    allocate(cfg, tasks)  # same preflight checks, without changing evidence status
    seed=cfg['private_allocation_seed']
    return {task['task_id']:{f'X{i+1}':arm for i,arm in enumerate(sorted(ARMS, key=lambda a:_id(seed,task['work_id'],a)))} for task in tasks}

def allocate(cfg, tasks):
    validate_config(cfg)
    if not isinstance(tasks,list) or not tasks:raise PacketError('NO_TASKS')
    ids=set(); works=set(); result=[]
    seed=cfg['private_allocation_seed']
    for task in tasks:
        if not isinstance(task,dict):raise PacketError('BAD_TASK')
        required=('task_id','work_id','genre','audience','source_fingerprint','lineage_audit_id')
        if any(not isinstance(task.get(k),str) or not task[k].strip() for k in required):
            raise PacketError('MISSING_TASK_IDENTITY')
        if task['task_id'] in ids:raise PacketError('DUPLICATE_TASK')
        if task['work_id'] in works:raise PacketError('DUPLICATE_WORK')
        ids.add(task['task_id']);works.add(task['work_id'])
        if task['lineage_audit_id']!=cfg['source_boundary_audit_id']:
            raise PacketError('LINEAGE_NOT_ATTESTED')
        if task.get('rights')!='APPROVED' or task.get('exposed') is not False or task.get('parent_work_disjoint') is not True:
            raise PacketError('UNSAFE_WORK')
        if len(task['source_fingerprint'])!=64 or any(x not in '0123456789abcdef' for x in task['source_fingerprint']):
            raise PacketError('BAD_FINGERPRINT')
        if task.get('private_raw_text') is not None or task.get('source_text') is not None:
            raise PacketError('RAW_TEXT_UNSUPPORTED')
        ordered=sorted(ARMS,key=lambda arm:_id(seed,task['work_id'],arm))
        labels={f'X{i+1}':arm for i,arm in enumerate(ordered)}
        result.append({'work_token':_id(seed,task['work_id'])[:24],
                       'task_token':_id(seed,task['task_id'])[:24],
                       'genre':task['genre'],'audience':task['audience'],
                       'blind_display_labels':sorted(labels),
                       'assignment_commitment':hashlib.sha256(json.dumps(labels,sort_keys=True).encode()).hexdigest(),
                       'model_identity':cfg['model_identity']})
    result.sort(key=lambda row:row['task_token'])
    return {'schema':'ksgt.g10p2.r5r.blind-packet.v1',
            'stage':'PREFLIGHT_NOT_FROZEN_NOT_RANDOMIZED_HUMAN_STUDY',
            'blind_packet':result,'works':len(works),'arms':list(ARMS),
            'human_outcomes':0,'source_work_independence_claim':False,
            'reader_study_approval':False,'quality_promotion':False}

def validate_ratings(rows):
    """Reject pretend real ratings; only check future schema without altering gold count."""
    if not isinstance(rows,list):raise PacketError('RATINGS_NOT_LIST')
    seen=set()
    for r in rows:
        if not isinstance(r,dict) or any(k not in r for k in ('work_token','blind_label','rater_token','task_usefulness')):
            raise PacketError('BAD_RATING')
        if r['blind_label'] not in {'X'+str(i) for i in range(1,8)}:raise PacketError('UNBLINDED_ARM')
        if not all(isinstance(r[k],str) and r[k] for k in ('work_token','rater_token')):raise PacketError('BAD_RATER_OR_WORK_TOKEN')
        if type(r['task_usefulness']) is not int or not 1<=r['task_usefulness']<=5:
            raise PacketError('BAD_RATING_VALUE')
        key=(r['work_token'],r['blind_label'],r['rater_token'])
        if key in seen:raise PacketError('DUPLICATE_RATING')
        seen.add(key)
    return {'schema':'ksgt.g10p2.r5r.ratings-schema-preflight.v1','records_shape_valid':len(rows),
            'independently_verified_human_scores':False}

def main():
    p=argparse.ArgumentParser();p.add_argument('--config',required=True);p.add_argument('--tasks',required=True)
    a=p.parse_args();cfg=json.loads(Path(a.config).read_text());tasks=json.loads(Path(a.tasks).read_text())
    print(json.dumps(allocate(cfg,tasks),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
