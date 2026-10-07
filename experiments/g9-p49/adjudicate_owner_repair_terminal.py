#!/usr/bin/env python3
"""Apply the prospectively sealed G9-P49 owner-repair terminal rule."""
from __future__ import annotations
import argparse,json
from pathlib import Path

def c(d,k): return int((d or {}).get(k,0))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--adjudication",type=Path,required=True)
    ap.add_argument("--out",type=Path,required=True)
    a=ap.parse_args()
    d=json.loads(a.adjudication.read_text(encoding="utf-8"))
    pairs=d["pairs"]
    k1=[p for p in pairs if p["lane"]=="KOLLA_K1_HARD_CARGO"]
    def pf(arm,rows):
        vals=[p[arm].get("p_fail") for p in rows if p[arm].get("p_fail") is not None]
        return sum(vals)
    preservation = pf("A3",k1) <= pf("A1",k1)
    counts=d.get("paired_verdict_counts") or {}
    overall = c(counts,"A3_DOMINATES") > c(counts,"A1_DOMINATES")
    fams={
      "KOLLA":{"KOLLA_K1_HARD_CARGO","KOLLA_K2_GENERIC"},
      "STYLEKQC":{"STYLEKQC_GENERIC"}
    }
    fam_result={}
    for name,lanes in fams.items():
        ps=[p for p in pairs if p["lane"] in lanes]
        a3=sum(p["paired_verdict"]=="A3_DOMINATES" for p in ps)
        a1=sum(p["paired_verdict"]=="A1_DOMINATES" for p in ps)
        fam_result[name]={"A3_DOMINATES":a3,"A1_DOMINATES":a1,"pass":a3>=a1}
    transport=all(x["pass"] for x in fam_result.values())
    abstain=bool(d.get("workflow_gain_eligible"))
    owner_pass=preservation and overall and transport and abstain
    if owner_pass:
        verdict="OWNER_REPAIR_BURDEN_REDUCTION_PASS_LOCAL_PRESERVATION_NONINFERIOR"
    elif preservation and overall and not transport:
        verdict="HUMAN_REPAIR_GAIN_TASK_LOCAL_ONLY"
    elif preservation and overall and transport and not abstain:
        verdict="REPAIR_REDUCTION_OFFSET_BY_ABSTENTION_COST"
    elif preservation:
        verdict="PRESERVATION_NONINFERIOR_BUT_HUMAN_REPAIR_NO_GAIN"
    else:
        verdict="P49_FAIL_ARCHITECTURE_SAFETY_GAIN_DOES_NOT_SURVIVE_HUMAN_REPAIR"
    out={
      "schema":"ksgt.g9.p49.owner-repair-terminal-adjudication.v1",
      "tests":{
        "preservation_noninferiority":preservation,
        "overall_strict_owner_repair_gain":overall,
        "cross_task_family_no_sign_destruction":transport,
        "workflow_gain_eligible_without_unobserved_abstention":abstain
      },
      "task_family":fam_result,
      "owner_local_pass":owner_pass,
      "terminal_verdict":verdict,
      "population_authority":"HOLD_REQUIRES_INDEPENDENT_EDITOR_TRANSPORT",
      "R2_latent_burden":"HOLD_PROCESS_BYTES",
      "authority":"OWNER_SINGLE_EDITOR_R0_OPERATIONAL_REPAIR_ONLY"
    }
    a.out.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(out,ensure_ascii=False))
if __name__=="__main__": main()
