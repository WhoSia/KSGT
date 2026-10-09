#!/usr/bin/env python3
"""Independent Python audit of P59 §v0.7 authored symbolic histories."""
import copy
import json
import sys
from collections import defaultdict
EXPECTED={"constant":21,"overwrite":42,"gated":168,"window1":24,"window4":72,"window33":168}
def validate(doc):
    if doc.get("schema")!="ksgt.p59.symbolic-histories.v07" or doc.get("authority")!="SYNTHETIC_ONLY":
        raise ValueError("INVALID_SCHEMA_OR_AUTHORITY")
    records=doc["histories"]
    if len(records)!=168:raise ValueError("INCOMPLETE_HISTORIES")
    groups=defaultdict(dict)
    sums={name:0 for name in EXPECTED}
    for h in records:
        target,before,after=h["target"],h["before"],h["after"]
        if target not in range(8) or before not in (0,2,5) or after not in (0,1,2,4,8,16,32):
            raise ValueError("INVALID_FACTOR")
        ev=h["events"]
        if len(ev)!=before+after+1:raise ValueError("INVALID_LENGTH")
        anchors=[(i,x) for i,x in enumerate(ev) if x["tag"]==1]
        if len(anchors)!=1 or anchors[0][0]!=before or anchors[0][1]["id"]!=target:
            raise ValueError("ANCHOR_CHANGED")
        decoy=[x["id"] for x in ev if x["tag"]==0]
        if any(not isinstance(i,int) or i not in range(8) for i in decoy):
            raise ValueError("INVALID_DISTRACTOR")
        group=groups[before,after]
        if target in group:raise ValueError("DUPLICATE_ROW")
        group[target]=tuple(decoy)
        outputs={"constant":0,"overwrite":ev[-1]["id"],
                 "gated":anchors[0][1]["id"]}
        for window in (1,4,33):
            recent=ev[-window:]
            matching=[x["id"] for x in recent if x["tag"]==1]
            outputs[f"window{window}"]=matching[-1] if matching else None
        for name,value in outputs.items():sums[name]+=int(value==target)
    if len(groups)!=21:raise ValueError("FACTOR_COVERAGE")
    for group in groups.values():
        if len(group)!=8 or len(set(group.values()))!=1:
            raise ValueError("TARGET_LEAKED_IN_DISTRACTORS")
    if sums!=EXPECTED:raise ValueError("POLICY_ORACLE_DRIFT")
    return {"audit":"PASS","histories":len(records),"factor_cells":len(groups),
            "target_independent_distractors":True,"policy_correct":sums,
            "authority":"SYNTHETIC_SYMBOLIC_ONLY"}
def test(doc):
    outcome=validate(doc)
    corrupt=copy.deepcopy(doc)
    corrupt["histories"][0]["events"][-1]["id"]=(corrupt["histories"][0]["events"][-1]["id"]+1)%8
    try:validate(corrupt)
    except ValueError:pass
    else:raise AssertionError("NEGATIVE_CONTROL_NOT_DETECTED")
    return outcome
if __name__=="__main__":
    print(json.dumps(test(json.load(sys.stdin)),sort_keys=True))
