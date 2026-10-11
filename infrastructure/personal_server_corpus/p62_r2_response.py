"""Private immutable R2 response import; no self-attested semantic gold."""
import argparse,collections,gzip,json,pathlib,datetime
from p62_reference import digest,rank_candidate,span_iou,bootstrap
from p62_r2 import canonical_target,validate_response,admissible_registry
def import_responses(packet,response,declaration,out,registry_path=None,binding_path=None):
    out=pathlib.Path(out)
    if out.exists():raise FileExistsError("Never overwrite response custody")
    seal=json.loads(pathlib.Path(declaration).read_text(encoding="utf8"))
    if binding_path is None:raise ValueError("Exact frozen packet binding required")
    binding=json.loads(pathlib.Path(binding_path).read_text(encoding="utf8"))
    if digest(declaration)!=binding["declaration_sha256"] or digest(packet) not in binding["allowed_packet_sha256"]:
        raise ValueError("Frozen packet/declaration identity mismatch")
    with gzip.open(packet,"rt",encoding="utf8") as f:rows=list(map(json.loads,f))
    items={x["item_id"]:x for x in rows}
    if len(items)!=len(rows) or len({canonical_target(x) for x in rows})!=len(rows):
        raise ValueError("Packet has duplicate item or target identities")
    responses=json.loads(pathlib.Path(response).read_text(encoding="utf8"))
    registry=json.loads(pathlib.Path(registry_path).read_text(encoding="utf8")) if registry_path else {}
    admitted_registry=admissible_registry(registry,seal.get("reviewer_registry_sha256"))
    seen=set();verified=[];unverified=[]
    for j in responses:
        pair=(j["item_id"],j["adjudicator_id"])
        if pair in seen:raise ValueError("Duplicate reviewer/item; preserve revision in separate ledger")
        seen.add(pair)
        ok=validate_response(items[j["item_id"]],j,registry,seal.get("reviewer_registry_sha256"))
        (verified if ok else unverified).append(j)
    groups=collections.defaultdict(list)
    for j in verified:groups[j["item_id"]].append(j)
    exclusions=collections.Counter();totals={};conflicts=[]
    for iid,js in groups.items():
        item=items[iid]
        if item["r2_split"]!="SEALED_EVALUATION":exclusions["PILOT_NOT_EVALUATION"]+=1;continue
        if item["r2_identity_admission"]!="FROZEN_JSON_GRAPH_ONLY":exclusions["SOURCE_IDENTITY_QUARANTINE"]+=1;continue
        sig={(j["judgment"],json.dumps(j.get("antecedent_spans",[]),sort_keys=True)) for j in js}
        if len({j["adjudicator_id"] for j in js})<2:exclusions["NEED_TWO_VERIFIED_REVIEWERS"]+=1;continue
        if len(sig)!=1:
            exclusions["INDEPENDENT_JUDGMENT_CONFLICT"]+=1;conflicts.append({"item_id":iid,"resolution":None});continue
        if not item["target"]["observed"] or js[0]["judgment"]!="REFERENTIAL":
            exclusions["OUTSIDE_ORDINARY_EXPLICIT_PRIMARY"]+=1;continue
        forms={z["unit"]:z["text"] for z in item["context"]};gold=js[0]["antecedent_spans"]
        hits=[]
        for policy in ["STRUCTURAL","LEXICAL"]:
            c=rank_candidate(forms,item["target"],item["candidates"],policy)
            hits.append(int(c is not None and any(span_iou(c,g)>=.5 for g in gold)))
        from p62_r2_diagnostics import no_counter_rank
        c=no_counter_rank(item);ablation=int(c is not None and any(span_iou(c,g)>=.5 for g in gold))
        n=totals.setdefault(item["strict_structure"],[item["source_work_key"],0,0,0]);n[1]+=1;n[2]+=hits[0]-hits[1];n[3]+=ablation-hits[1]
    primary=bootstrap([(w,d,v/n) for d,(w,n,v,ab) in totals.items()],2000) if totals else None
    result={"status":"EXECUTED" if totals else "HOLD","utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "responses_received":len(responses),"verified_responses":len(verified),"unverified_responses":len(unverified),
        "independent_registry_admitted":bool(admitted_registry),"primary":primary,
        "primary_scored_targets":sum(n for _,n,_,_ in totals.values()),
        "no_post_target_counter_ablation":bootstrap([(w,d,ab/n) for d,(w,n,v,ab) in totals.items()],2000) if totals else None,"exclusions":dict(exclusions),"conflicts":conflicts,
        "human_ground_truth_mutated":False,"packet_sha256":digest(packet),"response_sha256":digest(response),
        "declaration_sha256":digest(declaration),"original_responses":responses,
        "claim_ceiling":"Qualified consensus span alignment only, no writing effect; all prerequired ablations remain necessary before substantive superiority.",
        "reliability":{"status":"HOLD","kappa":None,"reason":"No qualified independent labels admitted" if not verified else "Separate frozen reliability analysis required"}}
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf8");return result
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--packet",required=True);p.add_argument("--response",required=True);p.add_argument("--declaration",required=True);p.add_argument("--out",required=True);p.add_argument("--reviewer-registry");p.add_argument("--packet-binding",required=True)
    a=p.parse_args();import_responses(a.packet,a.response,a.declaration,a.out,a.reviewer_registry,a.packet_binding)
