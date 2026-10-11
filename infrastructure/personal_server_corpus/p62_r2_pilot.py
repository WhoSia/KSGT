"""Freeze a probability-described private pilot within the deduplicated packet frame."""
import argparse,collections,datetime,gzip,json,pathlib
from p62_reference import key,digest
from p62_r2 import canonical_target
from p62_review import render
def build(out,limit=64):
    out=pathlib.Path(out)
    if (out/"HUMAN_REVIEW_PILOT.private.jsonl.gz").exists():raise FileExistsError("Pilot already sealed")
    seal=json.loads((out/"STRUCTURAL_LEXICAL_REVIEW_PREDECLARATION.json").read_text())
    if seal["human_labels_available"]!=0:raise ValueError("Pilot must precede human labels")
    with gzip.open(out/"UNIQUE_REVIEW_PACKET.private.jsonl.gz","rt",encoding="utf8") as f:items=list(map(json.loads,f))
    frame=[x for x in items if x["r2_split"]=="REVIEW_PILOT" and x["r2_identity_admission"]=="FROZEN_JSON_GRAPH_ONLY"
           and sum(len(z["text"]) for z in x["context"])<=3000]
    # One randomly keyed representative per work is an explicitly narrower pilot frame.
    bywork=collections.defaultdict(list)
    for x in frame:bywork[x["source_work_key"]].append(x)
    workframe=[min(xs,key=lambda x:key([x["r2_target_identity"]],"P62-R2-work-review-choice")) for xs in bywork.values()]
    bins=collections.defaultdict(list)
    for x in workframe:
        if x["target"]["observed"]:
            no_past=not any(c["relation"].startswith("PAST") for c in x["candidates"])
            task="TARGET_NO_PAST" if no_past else ("TARGET_DISAGREE" if x["r2_policy_disagreement"] else "TARGET_AGREE")
        else:task="PSEUDO_"+x["r2_negative_taxonomy"]["tier"]
        bins[x["family"]+"/"+task].append(x)
    ordered=sorted(bins)
    allocations={k: min(2,len(bins[k])) for k in ordered}
    if sum(allocations.values())>limit:raise ValueError("Increase pilot limit or prospectively coarsen strata")
    while sum(allocations.values())<min(limit,len(workframe)):
        options=[k for k in ordered if allocations[k]<len(bins[k])]
        if not options:break
        k=max(options,key=lambda k:(len(bins[k])/(allocations[k]+1),k))
        allocations[k]+=1
    pilot=[];weights=[]
    for k in ordered:
        xs=sorted(bins[k],key=lambda x:key([x["r2_target_identity"]],"P62-R2-pilot-sample-v1"))
        n=allocations[k];N=len(xs)
        for x in xs[:n]:
            x=dict(x);x["pilot_stratum"]=k;x["pilot_sampling"]={
                "conditional_frame_size":N,"sample_size":n,"conditional_inclusion_probability":n/N,
                "conditional_design_weight":N/n,"original_corpus_inclusion_probability":None,
                "original_packet_stratum":x["original_stratum"],
                "work_representative_frame":"One keyed representative per eligible pilot work; not all-target corpus frame"}
            pilot.append(x);weights.append({"target_identity":x["r2_target_identity"],**x["pilot_sampling"]})
    ids={x["r2_target_identity"] for x in pilot};works={x["source_work_key"] for x in pilot}
    evalitems=[x for x in items if x["r2_split"]=="SEALED_EVALUATION"]
    if works&{x["source_work_key"] for x in evalitems}:raise RuntimeError("Pilot/evaluation work overlap")
    with gzip.open(out/"HUMAN_REVIEW_PILOT.private.jsonl.gz","wt",encoding="utf8") as f:
        for x in pilot:f.write(json.dumps(x,ensure_ascii=False)+"\n")
    folder=out/"human_review_pilot";folder.mkdir()
    for slot in ["A","B"]:
        orderedpilot=sorted(pilot,key=lambda x:key([x["r2_target_identity"],slot],"P62-R2-pilot-order"))
        for offset in range(0,len(orderedpilot),16):
            batch=orderedpilot[offset:offset+16];html=render(batch,slot)
            mapping=json.dumps({x["item_id"]:canonical_target(x) for x in batch})
            html=html.replace("const items=","const targetIdentities="+mapping+";const items=",1)
            html=html.replace("item_hash:items.find(x=>x.item_id===id).item_hash,","item_hash:items.find(x=>x.item_id===id).item_hash,target_identity:targetIdentities[id],")
            html=html.replace("<h1>Private span review</h1>","<h1>Private P62-R2 review pilot</h1><p>Observed=false denotes a nonobserved zero-width pseudoanchor location, not an omitted argument or referring-expression span. Abstain or record an alternate expression in rationale; no semantic negative is supplied.</p>")
            (folder/("review_"+slot+"_"+str(offset//16+1)+".private.html")).write_text(html,encoding="utf8")
    manifest={"status":"VERIFIED","utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "full_original_population":2400,"unique_packet_items":len(items),"eligible_pilot_target_frame":len(frame),
        "one_representative_per_work_frame":len(workframe),"selected_items":len(pilot),"selected_source_works":len(works),
        "observed_targets":sum(x["target"]["observed"] for x in pilot),
        "pseudoanchors":sum(not x["target"]["observed"] for x in pilot),
        "strata":[{"stratum":k,"N":len(bins[k]),"n":allocations[k]} for k in ordered],
        "weights":weights,"pilot_evaluation_work_overlap":0,
        "all_human_ground_truth_null":True,"independent_reviewers":0,"genuine_review_status":"HOLD_NOT_RUN",
        "human_policy":"Separate independently verified reviewers; no consultation or machine predictions; preserve raw ledgers before adjudication.",
        "probability_ceiling":"Known conditional n/N only in enumerated representative pilot frame; original packet priority-reservoir and corpus weights unknown.",
        "packet_sha256":digest(out/"HUMAN_REVIEW_PILOT.private.jsonl.gz"),
        "split_sha256":digest(out/"REVIEW_EVALUATION_SPLIT_FREEZE.private.json"),
        "estimand_sha256":digest(out/"STRUCTURAL_LEXICAL_REVIEW_PREDECLARATION.json"),
        "feasibility_exclusion":"Contexts >3000 characters outside this pilot; retained in full packet; no silent population redefinition",
        "evaluation_unique_items":len(evalitems),"evaluation_observed_targets":sum(x["target"]["observed"] for x in evalitems)}
    (out/"HUMAN_REVIEW_PILOT_MANIFEST.json").write_text(json.dumps(manifest,indent=2),encoding="utf8")
    (folder/"README.md").write_text("# Private P62-R2 review pilot\n\nOpen the A or B HTML files locally and review independently. Export immutable JSON response ledgers to this private directory. Self-attestation is custody metadata, not qualification. Use p62_r2_response.py with the frozen declaration and packet. No responses exist yet. See ANNOTATION_GUIDELINES_R2.md. All source text remains private.\n",encoding="utf8")
    print(json.dumps({k:v for k,v in manifest.items() if k not in {"weights","strata"}}),flush=True)
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--out",required=True);p.add_argument("--limit",type=int,default=64)
    a=p.parse_args();build(a.out,a.limit)
