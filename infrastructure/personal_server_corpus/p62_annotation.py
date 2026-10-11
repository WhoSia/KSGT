"""Private P62 response custody; self-attestation never certifies independent gold."""
import argparse,gzip,json,pathlib,datetime
from p62_reference import validate_judgment,reliability,digest

def reviewer_verified(reviewer,registry):
    r=registry.get(reviewer,{})
    return r.get("qualified") is True and r.get("independence_verified") is True and bool(r.get("verification_evidence")) and bool(r.get("verified_by"))

def admit(items,responses,registry=None):
    registry=registry or {}
    seen=set()
    for j in responses:
        validate_judgment(items[j["item_id"]],j)
        pair=(j["item_id"],j["adjudicator_id"])
        if pair in seen:raise ValueError("Duplicate reviewer/item; preserve revisions in separate ledgers")
        seen.add(pair)
    verified=[j for j in responses if reviewer_verified(j["adjudicator_id"],registry)]
    result={"status":"HOLD" if not verified else "EXECUTED","self_attested_responses":len(responses),
            "verified_independent_responses":len(verified),"unverified_responses":len(responses)-len(verified),
            "packet_ground_truth_mutated":False,"authority":"No automatic semantic gold promotion",
            "reliability":reliability(items,verified) if verified else {"status":"HOLD","kappa":None,"paired_items":0},
            "conflicts":[]}
    group={}
    for j in verified:group.setdefault(j["item_id"],[]).append(j)
    for item,js in group.items():
        if len({(j["judgment"],json.dumps(j.get("antecedent_spans",[]),sort_keys=True)) for j in js})>1:
            result["conflicts"].append({"item_id":item,"status":"HOLD","reviewers":[j["adjudicator_id"] for j in js],
                                       "resolution":None,"instruction":"Preserve independent ledgers before separate adjudication"})
    return result


def evaluate_recovery(items,responses,registry=None):
    """Execute only after independently evidenced, agreeing source-span judgments."""
    custody=admit(items,responses,registry)
    groups={}
    for j in responses:
        if reviewer_verified(j["adjudicator_id"],registry or {}):
            groups.setdefault(j["item_id"],[]).append(j)
    observations={};exclusions={}
    for iid,js in groups.items():
        signatures={(j["judgment"],json.dumps(j.get("antecedent_spans",[]),sort_keys=True)) for j in js}
        item=items[iid]
        if len({j["adjudicator_id"] for j in js})<2 or len(signatures)!=1:
            exclusions[iid]="NO_TWO_INDEPENDENT_AGREEING_JUDGMENTS";continue
        if js[0]["judgment"]!="REFERENTIAL" or not item["target"]["observed"]:
            exclusions[iid]="OUTSIDE_PRIMARY_ORDINARY_EXPLICIT_REFERENCE";continue
        t=item["target"];identity=(item["strict_structure"],t["unit"],t["start"],t["end"])
        previous=observations.get(identity)
        if previous and previous[1]!=js[0]["antecedent_spans"]:
            exclusions[iid]="DUPLICATE_VIEW_GOLD_CONFLICT";observations[identity]=None;continue
        if identity in observations and observations[identity] is None:continue
        observations[identity]=(item,js[0]["antecedent_spans"])
    from p62_reference import rank_candidate,span_iou,bootstrap
    totals={}
    for value in observations.values():
        if value is None:continue
        item,gold=value;forms={x["unit"]:x["text"] for x in item["context"]}
        hit=[]
        for policy in ["STRUCTURAL","LEXICAL"]:
            chosen=rank_candidate(forms,item["target"],item["candidates"],policy)
            hit.append(int(chosen is not None and any(span_iou(chosen,g)>=.5 for g in gold)))
        row=totals.setdefault(item["strict_structure"],[item["source_work_key"],0,0])
        row[1]+=1;row[2]+=hit[0]-hit[1]
    result=bootstrap([(work,doc,total/n) for doc,(work,n,total) in totals.items()])
    return {"status":"EXECUTED" if totals else "HOLD","primary":result if totals else None,
            "semantic_ground_truth_admitted_targets":sum(n for _,n,_ in totals.values()),
            "exclusion_counts":{reason:list(exclusions.values()).count(reason) for reason in set(exclusions.values())},
            "claim_ceiling":"Qualified consensus span alignment only; no writing benefit or future antecedent promotion"}

def execute(packet,response,out,registry=None):
    out=pathlib.Path(out)
    if out.exists():raise FileExistsError("Never overwrite original response custody")
    with gzip.open(packet,"rt",encoding="utf-8") as f:items={x["item_id"]:x for x in map(json.loads,f)}
    responses=json.loads(pathlib.Path(response).read_text(encoding="utf-8"))
    reviewers=json.loads(pathlib.Path(registry).read_text(encoding="utf-8")) if registry else {}
    result=admit(items,responses,reviewers)
    result.update(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),packet_sha256=digest(packet),
                  response_sha256=digest(response),reviewer_registry_sha256=digest(registry) if registry else None,responses=responses)
    out.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--packet",required=True);p.add_argument("--response",required=True);p.add_argument("--out",required=True);p.add_argument("--reviewer-registry")
    a=p.parse_args();execute(a.packet,a.response,a.out,a.reviewer_registry)

