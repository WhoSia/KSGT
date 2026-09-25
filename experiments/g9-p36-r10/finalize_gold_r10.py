import argparse,json,os
def load(p):return json.load(open(p,encoding="utf-8"))
def main(bundle,out):
    b=load(bundle)
    validation={
      "bundle_ready":b.get("state")=="READY_FOR_FINAL_R10_ADJUDICATION",
      "rust_rate_one":b.get("rust_validation",{}).get("rate")==1,
      "gold_slots_nonzero":b.get("ellipsis_slots",0)>0,
      "core_gold":b.get("core_gold_ready") is True
    }
    validation["pass"]=all(validation.values())
    if validation["pass"]:
        verdict="PASS_RELATION_MOTIF_RETIRED_NATIVE_KOREAN_ZERO_ARGUMENT_GOLD_BOUND_ARG_RETURN_TO_ORIGIN_COMPLETE"
        status="CLOSED"
    else:
        verdict="HOLD_GOLD_BINDING_INCOMPLETE"
        status="ACTIVE_GOLD_INTAKE"
    r={"phase":"KSGT Generation IX G9-P36-R10","verdict":verdict,"status":status,
      "gold_binding":{
        "sources":b.get("sources"),"ellipsis_slots":b.get("ellipsis_slots"),
        "syntactic_slot_distribution":b.get("syntactic_slot_distribution",{}),
        "recovery_type_distribution":b.get("recovery_type_distribution",{}),
        "core_gold_ready":b.get("core_gold_ready"),"expanded_gold_ready":b.get("expanded_gold_ready"),
        "argument_recoverability_graph":"KSGT-ARG-v1",
        "binding_authority":"NIKL_ZA_SYNTACTIC_SLOT_AND_RECOVERY_GOLD"
      },
      "authority":{
        "relation_motif_authority_lane":"RETIRED",
        "korean_zero_argument_gold":"BOUND" if validation["pass"] else "HOLD",
        "semantic_role_from_ZA_slot":"NOT_GRANTED",
        "omission_preference_from_recovery_gold":"NOT_GRANTED",
        "cross_language_reuse":"NOT_PROMOTED",
        "MNMC_5":"RETAINED","MNMC_6":"NOT_JUSTIFIED"
      },
      "laws":[
        "ZERO_ARGUMENT_GOLD_CAN_BIND_RECOVERABILITY_WITHOUT_LAUNDERING_SYNTACTIC_SLOT_INTO_SEMANTIC_ROLE",
        "RECOVERY_GOLD_DOES_NOT_ESTABLISH_OMISSION_PREFERENCE",
        "NATIVE_KOREAN_GOLD_CAN_REPLACE_ENGLISH_RELATION_MOTIF_AS_WORLD_CONTACT_FOR_ARGUMENT_RECOVERABILITY_WITHOUT_REVIVING_RETIRED_REUSE_AUTHORITY"
      ],
      "validation":validation}
    os.makedirs(os.path.dirname(out) or ".",exist_ok=True);json.dump(r,open(out,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
    print(json.dumps(r,ensure_ascii=False,indent=2));return 0 if validation["pass"] else 8
if __name__=="__main__":
    ap=argparse.ArgumentParser();ap.add_argument("bundle_receipt");ap.add_argument("out")
    a=ap.parse_args();raise SystemExit(main(a.bundle_receipt,a.out))
