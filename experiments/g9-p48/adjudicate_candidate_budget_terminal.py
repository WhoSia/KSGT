#!/usr/bin/env python3
"""Deterministically adjudicate the presealed P48 terminal rule."""
from __future__ import annotations
import argparse, json
from pathlib import Path

STYLE={
  "run_id":37419144116,
  "A1_format_pass_rate":0.71875,
  "A3_format_pass_rate":0.96875,
  "rescue":8,
  "abstain":1,
  "status":"PASS_LEGALITY_SELECTION_TRANSPORT_ONLY"
}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--packet",type=Path,required=True); ap.add_argument("--result",type=Path,required=True); ap.add_argument("--out",type=Path,required=True)
    a=ap.parse_args(); packet=json.loads(a.packet.read_text()); result=json.loads(a.result.read_text())
    if packet.get("old_new_overlap") != 0: raise SystemExit("freshness violation: old_new_overlap != 0")
    k12=result["summary"]["12"]["K1_HARD_CARGO"]
    hard_nonworse=k12["A3_cargo_pass_all_n"] >= k12["A1_cargo_pass_all_n"]
    selection_improves=k12["A3_coverage"] > k12["A1_top_legal_rate"]
    style_transport=STYLE["A3_format_pass_rate"] > STYLE["A1_format_pass_rate"] and STYLE["status"].startswith("PASS")
    architecture_pass=hard_nonworse and selection_improves and style_transport
    labels=[]
    for st in ["K1_HARD_CARGO","K2_GENERIC"]:
        x=result["transition"][st]["prospective_interpretation"]
        if x != "NO_K4_ABSTAINERS": labels.append(x)
    mechanism=(labels[0] if labels and all(x==labels[0] for x in labels) else "MIXED") if labels else "NO_K4_ABSTAINERS"
    terminal=(
      "AUTHORITY_GATED_SET_VALUED_GENERATION_REENTRY_PASS_LOCAL_BETTER_KOREAN_WRITING_NOT_ESTABLISHED"
      if architecture_pass else
      "SELECTIVE_DECODER_EFFECT_REPLICATES_BUT_HARD_PRESERVATION_OR_COVERAGE_TRADEOFF_BLOCKS_GENERATION_REENTRY"
    )
    out={
      "schema":"ksgt.g9.p48.terminal-adjudication.v1",
      "phase":"G9-P48","status":"TERMINAL_ADJUDICATED",
      "canonical_candidate_budget_run_id":37435838070,
      "freshness":{"old_new_overlap":packet["old_new_overlap"],"packet_status":packet["status"]},
      "candidate_budget":result,
      "fixed_stylekqc_evidence":STYLE,
      "terminal_tests":{
        "K12_K1_A3_hard_cargo_nonworse_than_A1":hard_nonworse,
        "K12_K1_A3_selection_coverage_gt_A1_top_legal_rate":selection_improves,
        "independent_stylekqc_legality_selection_transport":style_transport
      },
      "candidate_scarcity_vs_overconstraint":mechanism,
      "architecture_level_reentry_pass":architecture_pass,
      "terminal_verdict":terminal,
      "better_korean_writing":"NOT_ESTABLISHED",
      "writing_quality_reason":"Hard-token retention, format legality, abstention behavior and hidden-reference distance do not by themselves authorize general Korean writing-quality claims.",
      "private_text_export":False,"fresh_human_recruitment":False
    }
    a.out.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in out.items() if k!="candidate_budget"},ensure_ascii=False))
if __name__=="__main__":main()
