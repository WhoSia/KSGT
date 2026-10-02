import argparse,collections,json,os
def load_jsonl(p):
    with open(p,encoding="utf-8") as f:return [json.loads(x) for x in f if x.strip()]
def summarize(work,out):
    schema=json.load(open(os.path.join(work,"schema_census.json"),encoding="utf-8"))
    adapter=json.load(open(os.path.join(work,"adapter_summary.json"),encoding="utf-8"))
    receipts=load_jsonl(os.path.join(work,"arg_validation_receipts.jsonl"))
    graphs=load_jsonl(os.path.join(work,"arg_gold_graphs.jsonl"))
    failures=[x for x in receipts if not x.get("pass")]
    slots=collections.Counter();rec=collections.Counter();families=collections.Counter()
    distances=collections.Counter()
    for x in graphs:
        families[x["schema_family"]]+=1
        for r in x["graph"]["roles"]:
            slots[r["syntactic_slot"]]+=1;rec[r["recovery"]]+=1
        d=x["graph"].get("discourse",{}).get("antecedent_sentence_distance")
        if d is not None:distances[str(d)]+=1
    valid=len(receipts)-len(failures)
    rate=(valid/len(receipts)) if receipts else 0
    state="READY_FOR_SCIENTIFIC_ADJUDICATION" if schema["state"]=="READY" and adapter["records"]>0 and rate==1 else "HOLD_GOLD_PIPELINE"
    r={"contract":"KSGT-R10-NIKL-GOLD-v1","state":state,"source_sha256":schema.get("source_sha256"),
       "schema_family_counts":schema.get("schema_family_counts",{}),"za_predicates":schema.get("za_predicates",0),
       "ellipsis_slots":adapter.get("records",0),"rust_validation":{"total":len(receipts),"valid":valid,"rate":rate,
       "failures_by_reason":dict(collections.Counter(e for x in failures for e in x.get("errors",[])))},
       "syntactic_slot_distribution":dict(slots),"recovery_type_distribution":dict(rec),
       "antecedent_sentence_distance_distribution":dict(distances),"schema_families_adapted":dict(families),
       "semantic_role_authority":"EXPLICIT_LINKED_SRL_ONLY_NONE_IN_ZA_ADAPTER_BY_DEFAULT",
       "raw_or_row_level_data_publishable":False}
    os.makedirs(os.path.dirname(out),exist_ok=True);json.dump(r,open(out,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
    print(json.dumps(r,ensure_ascii=False,indent=2));return r
if __name__=="__main__":
    ap=argparse.ArgumentParser();ap.add_argument("work");ap.add_argument("out");a=ap.parse_args();summarize(a.work,a.out)
