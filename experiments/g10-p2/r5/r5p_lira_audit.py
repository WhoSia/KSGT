#!/usr/bin/env python3
"""KSGT LIRA: auditable research recommendation scores, NOT truth probabilities."""
import argparse
import hashlib
import json
import re
from pathlib import Path

SCHEMA='ksgt.g10p2.lira.v1'
WEIGHTS={'gate': .30, 'quality': .30, 'info': .20, 'feasibility': .15, 'cost': .05}
LINE=re.compile(r'^L(\d{3}) \| E=(0\.\d{2}|1\.00) \| P=(0\.\d{2}|1\.00) \| (FACT|INFER|PLAN|HOLD) \| \[([^\]]+)\] \| (.+)$')

class AuditError(ValueError): pass


def _num(v, label):
    if isinstance(v,bool) or not isinstance(v,(float,int)) or not 0<=v<=1:
        raise AuditError('INVALID_SCORE:'+label)
    return float(v)


def audit_lines(txt, allowed_sources):
    rows=[]
    for idx, line in enumerate(txt.splitlines(),1):
        m=LINE.fullmatch(line)
        if not m or int(m[1])!=idx:
            raise AuditError(f'UNSCORED_OR_MISNUMBERED_LINE:{idx}')
        e,p=float(m[2]),float(m[3]); typ=m[4]
        if not (0<=e<=1 and 0<=p<=1): raise AuditError('SCORE_RANGE')
        sources=m[5].split(',')
        if not all(s in allowed_sources for s in sources):
            raise AuditError('UNREGISTERED_SOURCE:'+str(idx))
        if not m[6].strip():raise AuditError('EMPTY_CLAIM:'+str(idx))
        if typ=='FACT' and e < .50: raise AuditError('FACT_WITH_LOW_EVIDENCE:'+str(idx))
        if typ=='HOLD' and 'HOLD' not in m[6].upper() and '보류' not in m[6]:
            raise AuditError('INVISIBLE_HOLD:'+str(idx))
        rows.append({'line':idx,'evidence':e,'priority':p,'type':typ,'sources':sources,'sha256':hashlib.sha256(line.encode()).hexdigest()})
    if not rows:raise AuditError('EMPTY_REPORT')
    if txt.endswith('\n\n'):raise AuditError('UNSCORED_TRAILING_BLANK_LINE')
    return rows


def evaluate(report, doc):
    if doc.get('schema')!=SCHEMA: raise AuditError('WRONG_SCHEMA')
    if doc.get('overall_stage')!='G10-P2 OPEN / QUALITY_HOLD': raise AuditError('QUALITY_STAGE_UNAUTHORIZED')
    if doc.get('independent_reader_outcomes') !=0: raise AuditError('HUMAN_COUNT_CHANGED_WITHOUT_RECEIPT')
    sources=doc.get('sources',{})
    if not isinstance(sources,dict) or not sources: raise AuditError('MISSING_SOURCES')
    lines=audit_lines(report,set(sources))
    candidates=doc.get('decisions')
    if not isinstance(candidates,list) or not candidates:raise AuditError('NO_DECISIONS')
    seen=set(); results=[]
    for c in candidates:
        key=c.get('id')
        if not isinstance(key,str) or key in seen:raise AuditError('DUPLICATE_DECISION')
        seen.add(key)
        dims=c.get('scores',{})
        if set(dims)!=set(WEIGHTS):raise AuditError('BAD_DIMENSIONS:'+key)
        x={k:_num(v,k) for k,v in dims.items()}
        if c.get('status') not in ('NEXT','PREPARE','WAIT_FOR_SOURCE','DEFER'):
            raise AuditError('BAD_STATUS:'+key)
        if c.get('status')=='NEXT' and not c.get('can_execute_now'):
            raise AuditError('FALSELY_EXECUTABLE:'+key)
        if not c.get('rationale') or not isinstance(c.get('source_ids'),list) or not c['source_ids']:
            raise AuditError('UNSUPPORTED_DECISION:'+key)
        if not all(s in sources for s in c['source_ids']):raise AuditError('UNREGISTERED_DECISION_SOURCE:'+key)
        score=sum(WEIGHTS[k]*(1-v if k=='cost' else v) for k,v in x.items())
        # not a chance of truth: priority only; no automatic quality promotion
        results.append({'id':key,'priority':round(score,4),'status':c['status'],'can_execute_now':bool(c.get('can_execute_now'))})
    results.sort(key=lambda r:(-r['priority'],r['id']))
    return {'schema':'ksgt.g10p2.lira.audit.v1','report_sha256':hashlib.sha256(report.encode()).hexdigest(),
            'lines_audited':len(lines),'decision_count':len(results),'decisions':results,
            'score_semantics':'heuristic audit/priority ratings, NOT calibrated probabilities or human-quality gold',
            'quality_promotion':False,'lines':lines}


def main():
    a=argparse.ArgumentParser();a.add_argument('report');a.add_argument('ledger');a.add_argument('--out');args=a.parse_args()
    text=Path(args.report).read_text(encoding='utf-8');d=json.loads(Path(args.ledger).read_text(encoding='utf-8'))
    out=evaluate(text,d);s=json.dumps(out,ensure_ascii=False,indent=2)+'\n'
    if args.out:
        p=Path(args.out)
        if p.exists():raise AuditError('OUTPUT_ALREADY_EXISTS')
        p.write_text(s,encoding='utf-8')
    print(json.dumps({k:v for k,v in out.items() if k!='lines'},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
