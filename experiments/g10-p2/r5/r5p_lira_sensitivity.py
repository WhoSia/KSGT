#!/usr/bin/env python3
"""Deterministic 3^5 local weight perturbation audit; not statistical uncertainty."""
import itertools
import json
from r5p_lira_audit import WEIGHTS, evaluate
from pathlib import Path


def sensitivity(doc, delta=.10):
    counts={d['id']:0 for d in doc['decisions']}
    scores={d['id']:[] for d in doc['decisions']}
    for offsets in itertools.product([-delta,0,delta],repeat=5):
        weights={k:max(.001, WEIGHTS[k]+offsets[i]) for i,k in enumerate(WEIGHTS)}
        norm=sum(weights.values())
        weights={k:v/norm for k,v in weights.items()}
        byid={}
        for d in doc['decisions']:
            v=d['scores']
            s=sum(weights[k]*(1-v[k] if k=='cost' else v[k]) for k in WEIGHTS)
            byid[d['id']]=s
            scores[d['id']].append(s)
        winner=max(sorted(byid),key=lambda k:byid[k])
        counts[winner]+=1
    return {'scenarios':243,'delta':delta,'winner_counts':counts,
            'bounds':{k:{'min':round(min(v),4),'max':round(max(v),4)} for k,v in scores.items()},
            'note':'Specified weight-space perturbation, not empirical confidence intervals'}


if __name__=='__main__':
    root=Path(__file__).parent
    report=(root/'r5p_lira_line_audit.md').read_text()
    doc=json.loads((root/'r5p_lira_decisions.json').read_text())
    evaluate(report,doc)
    print(json.dumps(sensitivity(doc),ensure_ascii=False,indent=2))
