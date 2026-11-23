#!/usr/bin/env python3
"""One-factor-at-a-time adversarial scoring input challenge; not probability."""
import copy
import json
from pathlib import Path
from r5p_lira_audit import evaluate, WEIGHTS


def counterfactual(report, doc):
    base = evaluate(report,doc)
    original = base['decisions'][0]['id']
    rows=[]
    for d in doc['decisions']:
        for k in WEIGHTS:
            for shift in (-.2,-.1,.1,.2):
                modified=copy.deepcopy(doc)
                for c in modified['decisions']:
                    if c['id']==d['id']:
                        old=c['scores'][k]
                        c['scores'][k]=round(max(0,min(1,old+shift)),6)
                        break
                result=evaluate(report,modified)['decisions']
                rows.append({'candidate':d['id'],'dimension':k,'delta':shift,
                             'actual_delta':round(c['scores'][k]-old,4),
                             'leader':result[0]['id'],
                             'leader_changed':result[0]['id']!=original})
    return {'base_leader':original,'scenario_count':len(rows),
            'leader_changes':sum(r['leader_changed'] for r in rows),
            'lead_change_cases':[r for r in rows if r['leader_changed']],
            'interpretation':'One-coordinate scoring input challenges only, not empirical significance'}

if __name__=='__main__':
    base=Path(__file__).parent
    doc=json.loads((base/'r5p_lira_decisions.json').read_text())
    report=(base/'r5p_lira_line_audit.md').read_text()
    print(json.dumps(counterfactual(report,doc),ensure_ascii=False,indent=2))
