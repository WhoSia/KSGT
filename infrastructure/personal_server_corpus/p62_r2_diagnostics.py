"""Machine-provisional duplicate-policy and candidate-rank diagnostics, never accuracy."""
import argparse,collections,gzip,json,pathlib
from p62_reference import key,rank_candidate,bootstrap
from p62_r2 import canonical_target
def no_counter_rank(item):
    t=item["target"];cs=[c for c in item["candidates"] if c["relation"].startswith("PAST")]
    kinds={"NUMERIC_GROUP_FRAGMENT":0,"ENUMERATION_FRAGMENT":1,"TOPIC_ARGUMENT_FRAGMENT":2,"EVENT_PREDICATE_FRAGMENT":3}
    return min(cs,key=lambda c:(kinds[c["kind"]],abs(c["unit"]-t["unit"]),
         abs(c["end"]-t["start"]) if c["unit"]==t["unit"] else 0,c["candidate_id"])) if cs else None
def matched_control_candidates(item):
    t=item["target"];forms={z["unit"]:z["text"] for z in item["context"]}
    width=min(t["start"],len(forms[t["unit"]])-t["end"],256)
    cs=[]
    for c in item["candidates"]:
        dist=c["unit"]-t["unit"]
        if dist and t["unit"]-dist not in forms:continue
        if not dist:
            if c["relation"]=="PAST_INTRA" and c["start"]<t["start"]-width:continue
            if c["relation"]=="FUTURE_INTRA_CONTROL" and c["end"]>t["end"]+width:continue
        cs.append(c)
    return cs
def measure(items):
    groups=collections.defaultdict(list);targets=0
    for x in items:
        if not x["target"]["observed"]:continue
        t=x["target"]
        if t["unit"]<2 or t["unit"]+2>=x["document_units"]:continue
        cs=matched_control_candidates(x)
        def hit(direction,inter=False):
            return any(c["relation"].startswith(direction) and (not inter or "INTER" in c["relation"])
                and c["kind"]=="NUMERIC_GROUP_FRAGMENT" and c.get("plural_rule") for c in cs)
        groups[x["strict_structure"]].append((x["source_work_key"],int(hit("PAST",True))-int(hit("FUTURE",True)),
               int(hit("PAST"))-int(hit("FUTURE"))));targets+=1
    result={}
    for i,name in [(1,"GROUP_INTER_ONLY_PACKET_PROXY"),(2,"GROUP_SYMMETRIC_PACKET_PROXY")]:
        rows=[(xs[0][0],doc,sum(v[i] for v in xs)/len(xs)) for doc,xs in groups.items()]
        result[name]={**bootstrap(rows,1000),"eligible_target_views":targets}
    return result
def run(parent,out):
    parent=pathlib.Path(parent);out=pathlib.Path(out)
    with gzip.open(parent/"ADJUDICATION_PACKET_V2.private.jsonl.gz","rt",encoding="utf8") as f:original=list(map(json.loads,f))
    with gzip.open(out/"UNIQUE_REVIEW_PACKET.private.jsonl.gz","rt",encoding="utf8") as f:unique=list(map(json.loads,f))
    repeats={canonical_target(x) for x in unique if len(x["original_view_item_ids"])>1}
    counts=collections.Counter();eligible=0
    for x in unique:
        if not x["target"]["observed"]:continue
        forms={z["unit"]:z["text"] for z in x["context"]}
        a=rank_candidate(forms,x["target"],x["candidates"],"STRUCTURAL")
        b=rank_candidate(forms,x["target"],x["candidates"],"LEXICAL")
        c=no_counter_rank(x);eligible+=1
        counts["structural_vs_lexical_disagreement"]+=(a or {}).get("candidate_id")!=(b or {}).get("candidate_id")
        counts["no_counter_vs_structural_disagreement"]+=(a or {}).get("candidate_id")!=(c or {}).get("candidate_id")
        counts["no_counter_vs_lexical_disagreement"]+=(c or {}).get("candidate_id")!=(b or {}).get("candidate_id")
        counts["no_past_candidate"]+=a is None
        counts["matched_future_candidate_exists"]+=any(c["relation"].startswith("FUTURE") for c in matched_control_candidates(x))
    result={"status":"EXECUTED","authority":"MACHINE_PROVISIONAL_SELECTED_PACKET_ONLY_NOT_SEMANTIC_ACCURACY",
        "unique_observed_targets":eligible,"rule_counts":dict(counts),"duplicate_policy_sensitivities":{
        "ALL_ORIGINAL_OBSERVED_VIEWS":measure(original),
        "COLLAPSE_IDENTICAL_TARGETS":measure(unique),
        "EXCLUDE_ALL_REPEATED_TARGET_GROUPS":measure([x for x in unique if canonical_target(x) not in repeats])},
        "no_counter_ablation":"Removes the post-target counter from ranking; otherwise same candidate inventory, kinds and distance tie-breakers",
        "paired_control_definition":"Only equal +/- unit distances represented in displayed context; same-unit width=min(left,right,256), no overlapping target",
        "sampling_ceiling":"Priority-selected packet; weights not corpus probabilities. Policies change denominators; no causal comparison.",
        "human_labels":0,"referential_accuracy":None}
    (out/"MACHINE_ADMISSIBILITY_AND_DUPLICATE_SENSITIVITY.json").write_text(json.dumps(result,indent=2),encoding="utf8")
    print(json.dumps({"status":"EXECUTED","unique_observed":eligible,"counts":dict(counts)}))
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--parent",required=True);p.add_argument("--out",required=True);a=p.parse_args();run(a.parent,a.out)
