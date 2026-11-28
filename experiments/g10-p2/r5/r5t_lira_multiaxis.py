#!/usr/bin/env python3
"""R5t LIRA/JEV multidimensional, fail-closed research director decision court.

All numbers are explicit researcher judgments, not calibrated probabilities.
No hard gate may be traded for a higher utility score.
"""
import argparse
import copy
import hashlib
import itertools
import json
import re
from pathlib import Path

SCHEMA = 'ksgt.g10p2.r5t.lira.multiaxis.v1'
DIMS = {
    'bottleneck_relief': .22, 'causal_information': .19,
    'language_quality_relevance': .17, 'execution_readiness': .13,
    'reversibility': .09, 'risk_reduction': .10, 'cost_efficiency': .10,
}
EVIDENCE = ('source_directness','reproducibility','independence','completeness')
KINDS = ('FACT','INFER','PLAN','HOLD')
LINE = re.compile(r'^L(\d{3}) \| E=(0\.\d{2}|1\.00) \| P=(0\.\d{2}|1\.00) \| (FACT|INFER|PLAN|HOLD) \| \[([A-Z0-9,]+)\] \| (.+)$')

class CourtError(ValueError): pass

def num(x):
    if type(x) not in (float,int) or not 0 <= x <= 1:
        raise CourtError('INVALID_0_TO_1')
    return float(x)

def score_line(text, sources):
    output=[]
    for index, line in enumerate(text.splitlines(), 1):
        m=LINE.fullmatch(line)
        if not m or int(m[1])!=index:
            raise CourtError(f'UNSCORED_LINE:{index}')
        tags=m[5].split(',')
        if any(t not in sources for t in tags):raise CourtError('UNKNOWN_SOURCE')
        if m[4]=='HOLD' and 'HOLD' not in m[6] and '보류' not in m[6]:
            raise CourtError('INVISIBLE_HOLD')
        output.append(dict(id=f'L{index:03}',E=float(m[2]),P=float(m[3]),kind=m[4],sources=tags,sha256=hashlib.sha256(line.encode()).hexdigest()))
    if not output or text.endswith('\n\n'):raise CourtError('EMPTY_OR_BLANK')
    return output

def judge(doc, lines):
    if doc.get('schema')!=SCHEMA: raise CourtError('SCHEMA')
    if doc.get('stage')!='G10-P2 OPEN / QUALITY_HOLD' or doc.get('verified_human_outcomes')!=0:
        raise CourtError('UNAUTHORIZED_QUALITY_PROMOTION')
    if doc.get('real_nikl24_raw_acquired') is not False:raise CourtError('RAW_BYTES_NOT_VERIFIED')
    sources=doc.get('sources')
    if not isinstance(sources,dict) or not sources:raise CourtError('SOURCES')
    scored=score_line(lines,sources)
    results=[];ids=set()
    for d in doc['decisions']:
        k=d['id']
        if k in ids:raise CourtError('DUPLICATE_DECISION')
        ids.add(k)
        if set(d['utility'])!=set(DIMS):raise CourtError('MISSING_UTILITY_DIMENSION')
        if set(d['evidence'])!=set(EVIDENCE):raise CourtError('MISSING_EVIDENCE_DIMENSION')
        u={a:num(v) for a,v in d['utility'].items()}
        e={a:num(v) for a,v in d['evidence'].items()}
        if d.get('execution_gate') not in ('READY','BLOCKED','PREPARE'):
            raise CourtError('BAD_GATE')
        if not isinstance(d.get('uncertainty'),dict) or set(d['uncertainty'])!=set(DIMS):
            raise CourtError('MISSING_UNCERTAINTY')
        for a,rad in d['uncertainty'].items():
            if num(rad)>.5:raise CourtError('UNJUSTIFIED_PRECISION')
        refs=d.get('source_ids')
        if not isinstance(refs,list) or not refs or any(x not in sources for x in refs):
            raise CourtError('UNSUPPORTED_DECISION')
        utility=sum(DIMS[a]*u[a] for a in DIMS)
        support=sum(e[a] for a in EVIDENCE)/len(EVIDENCE)
        lower=sum(DIMS[a]*max(0,u[a]-d['uncertainty'][a]) for a in DIMS)
        upper=sum(DIMS[a]*min(1,u[a]+d['uncertainty'][a]) for a in DIMS)
        blockers=d.get('blockers')
        if not isinstance(blockers,list) or (d['execution_gate']=='BLOCKED' and not blockers):
            raise CourtError('MISSING_BLOCKERS')
        results.append(dict(id=k,priority=round(utility,4),evidence_support=round(support,4),
                            judgment_interval=[round(lower,4),round(upper,4)],
                            execution_gate=d['execution_gate'],blockers=blockers))
    results.sort(key=lambda r:(-r['priority'],r['id']))
    # A rank is not a recommendation if the current action is blocked; no gate compensation.
    eligible=[d for d in results if d['execution_gate']=='READY']
    top=eligible[0]['id'] if eligible else None
    return dict(schema=SCHEMA,stage=doc['stage'],score_kind='heuristic_not_probability',
                lines=len(scored),line_hashes=scored,decisions=results,
                top_executable=top,quality_promotion=False)

def sensitivity(doc,lines):
    """One-coordinate judgment perturbation at +/- 0.1 and +/- 0.2, plus interval-bound dominance."""
    baseline=judge(doc,lines)
    leader=baseline['top_executable'];total=0;changes=0;examples=[]
    for item in doc['decisions']:
        for dim in DIMS:
            for delta in (-.20,-.10,.10,.20):
                alt=copy.deepcopy(doc)
                row=next(x for x in alt['decisions'] if x['id']==item['id'])
                row['utility'][dim]=round(min(1,max(0,row['utility'][dim]+delta)),4)
                changed=judge(alt,lines)['top_executable']
                total+=1
                if changed!=leader:
                    changes+=1
                    if len(examples)<15:examples.append(dict(id=item['id'],dimension=dim,delta=delta,new_top=changed))
    return dict(scenarios=total,top=leader,top_changes=changes,examples=examples,
                interpretation='Local input-value perturbation; NOT confidence interval or empirical truth odds')

def main():
    p=argparse.ArgumentParser();p.add_argument('registry');p.add_argument('lines');args=p.parse_args()
    d=json.loads(Path(args.registry).read_text(encoding='utf-8'))
    s=Path(args.lines).read_text(encoding='utf-8')
    print(json.dumps({'court':judge(d,s),'sensitivity':sensitivity(d,s)},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
