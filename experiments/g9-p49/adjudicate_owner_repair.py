#!/usr/bin/env python3
"""Adjudicate G9-P49 owner repair responses under the prospectively sealed partial order."""
from __future__ import annotations
import argparse,json
from collections import Counter,defaultdict
from pathlib import Path

def lev(a,b):
    if len(a)>len(b):a,b=b,a
    prev=list(range(len(a)+1))
    for i,cb in enumerate(b,1):
        cur=[i]
        for j,ca in enumerate(a,1):
            cur.append(min(cur[-1]+1,prev[j]+1,prev[j-1]+(ca!=cb)))
        prev=cur
    return prev[-1]

def missing_tokens(text,toks):
    if text is None:return None
    need=Counter(tok for _,tok in toks)
    return sum(max(0,n-text.count(tok)) for tok,n in need.items())

def response_vector(row,key):
    if row.get("system_abstain"):
        return {"system_abstain":1,"comparable":False}
    act=row.get("action")
    if act not in {"ACCEPT","REPAIR","REJECT"}:
        raise ValueError(f"missing/invalid human action {row['blind_item_id']}")
    sys=row.get("system_surface") or ""
    miss=missing_tokens(sys,key.get("protected_tokens") or [])
    p_fail=None if not key.get("protected_tokens") else int(miss>0)
    reject=int(act=="REJECT");repair=int(act=="REPAIR")
    if act=="ACCEPT":
        edit=0;span=0.0
    elif act=="REPAIR":
        final=row.get("repaired_text_if_any")
        if not isinstance(final,str) or not final.strip():
            raise ValueError(f"REPAIR requires repaired text {row['blind_item_id']}")
        edit=lev(sys,final);span=edit/max(1,len(sys),len(final))
    else:
        edit=None;span=None
    return {"system_abstain":0,"comparable":True,"p_fail":p_fail,"reject":reject,"repair":repair,
            "edit_chars":edit,"edit_span_fraction":span,"action":act}

def dominance(a,b):
    # returns -1 if a dominates b, +1 if b dominates a, 0 tie, None incomparable
    coords=[]
    for k in ["p_fail","reject","repair","edit_chars","edit_span_fraction"]:
        av,bv=a.get(k),b.get(k)
        if av is None or bv is None:continue
        coords.append((av,bv))
    if not coords:return None
    a_le=all(x<=y for x,y in coords);b_le=all(y<=x for x,y in coords)
    a_str=any(x<y for x,y in coords);b_str=any(y<x for x,y in coords)
    if a_le and a_str:return -1
    if b_le and b_str:return 1
    if not a_str and not b_str:return 0
    return None

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--pass1",type=Path,required=True);ap.add_argument("--pass2",type=Path,required=True)
    ap.add_argument("--key",type=Path,required=True);ap.add_argument("--out",type=Path,required=True)
    a=ap.parse_args()
    rows={}
    for p in [a.pass1,a.pass2]:
        for line in p.read_text(encoding="utf-8").splitlines():
            if line.strip():
                r=json.loads(line);rows[r["blind_item_id"]]=r
    keys={}
    item_blinds=defaultdict(dict)
    for line in a.key.read_text(encoding="utf-8").splitlines():
        if not line.strip():continue
        k=json.loads(line);keys[k["blind_item_id"]]=k;item_blinds[k["item_id"]][k["arm"]]=k["blind_item_id"]
    arm_counts=Counter();actions=defaultdict(Counter);pairs=[];abstain=Counter()
    for bid,k in keys.items():
        v=response_vector(rows[bid],k)
        arm=k["arm"];lane=rows[bid]["source_task"];arm_counts[arm]+=1
        if v["system_abstain"]:abstain[(arm,lane)]+=1
        else:actions[(arm,lane)][v["action"]]+=1
    results=Counter();by_lane=defaultdict(Counter)
    for iid,m in item_blinds.items():
        if "A1" not in m or "A3" not in m:raise ValueError("missing paired arm "+iid)
        k1,k3=keys[m["A1"]],keys[m["A3"]]
        r1,r3=rows[m["A1"]],rows[m["A3"]]
        v1,v3=response_vector(r1,k1),response_vector(r3,k3)
        lane=r1["source_task"]
        if v1["system_abstain"] or v3["system_abstain"]:
            verdict="ABSTENTION_UNIDENTIFIED_WORKFLOW"
        else:
            d=dominance(v3,v1)
            verdict={-1:"A3_DOMINATES",1:"A1_DOMINATES",0:"TIE",None:"INCOMPARABLE"}[d]
        results[verdict]+=1;by_lane[lane][verdict]+=1
        pairs.append({"item_id":iid,"lane":lane,"A1":v1,"A3":v3,"paired_verdict":verdict})
    common_n=sum(v for k,v in results.items() if k!="ABSTENTION_UNIDENTIFIED_WORKFLOW")
    out={
      "schema":"ksgt.g9.p49.owner-repair-adjudication.v1",
      "paired_items":len(item_blinds),"common_emission_items":common_n,
      "paired_verdict_counts":dict(results),
      "paired_verdict_by_lane":{k:dict(v) for k,v in by_lane.items()},
      "action_counts":{f"{arm}|{lane}":dict(c) for (arm,lane),c in actions.items()},
      "abstain_counts":{f"{arm}|{lane}":n for (arm,lane),n in abstain.items()},
      "workflow_gain_eligible":sum(abstain.values())==0,
      "workflow_gain_rule":"False when any system abstention exists unless a separately presealed fallback trace is supplied.",
      "R2_latent_burden":"HOLD_PROCESS_BYTES",
      "pairs":pairs,
      "authority":"OWNER_SINGLE_EDITOR_R0_OPERATIONAL_REPAIR_ONLY"
    }
    a.out.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in out.items() if k!="pairs"},ensure_ascii=False))
if __name__=="__main__":main()
