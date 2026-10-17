"""Prospectively declared P62 particle-boundary sensitivity; machine-provisional only."""
import argparse,collections,gzip,json,pathlib,re,sqlite3,time
import p62_reference as ref
from p62_reference import key,digest,bootstrap
STRICT=ref.COUNT
PARTICLE=re.compile(STRICT.pattern.replace("(?![가-힣])",r"(?=(?:(?:에서도|에게|에서|으로|에는|은|는|이|가|을|를|의|에|도|만|와|과|로)(?![가-힣])|[^가-힣]|$))"))
def compare(forms,t):
    # Restore the caller's regex even if a parser or summary raises.
    previous=ref.COUNT
    try:
        ref.COUNT=STRICT
        a,sa=ref.summary(forms,t)
        ref.COUNT=PARTICLE
        b,sb=ref.summary(forms,t)
        return a,sa,b,sb
    finally:
        ref.COUNT=previous
def run(root,out):
    root=pathlib.Path(root);out=pathlib.Path(out);start=time.monotonic()
    seal=json.loads((out/"PARTICLE_SENSITIVITY_PREDECLARATION.json").read_text(encoding="utf-8"))
    if digest(__file__)!=seal["code_sha256"]:raise RuntimeError("Particle extension code changed")
    source=sqlite3.connect((root/"70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite").as_uri()+"?mode=ro",uri=True)
    db=sqlite3.connect((out/"P62_PRIVATE.sqlite").as_uri()+"?mode=ro",uri=True)
    packets=collections.defaultdict(list)
    with gzip.open(out/"ADJUDICATION_PACKET.private.jsonl.gz","rt",encoding="utf-8") as f:
        for x in map(json.loads,f):packets[x["strict_structure"]].append(x)
    result=collections.defaultdict(list);targets=collections.Counter();counts=collections.Counter();items=[]
    for path, in source.execute("select path from shards where kind='paragraphs' order by path"):
        forms=[];current=None
        def flush():
            nonlocal forms,current
            if current is None:return
            counts["structures"]+=1;counts["paragraphs"]+=len(forms)
            work,=db.execute("select w.work from documents d join work_keys w using(lineage) where strict=?",(current,)).fetchone()
            totals=collections.defaultdict(lambda:[0,0]);alltargets=0
            for i,text in enumerate(forms):
                counts["strict_counter_spans"]+=len(list(STRICT.finditer(text)));counts["particle_counter_spans"]+=len(list(PARTICLE.finditer(text)))
                for m in ref.TARGET.finditer(text):
                    alltargets+=1;counts["targets"]+=1;t={"unit":i,"start":m.start(),"end":m.end(),"observed":True}
                    a,sa,b,sb=compare(forms,t)
                    counts["strict_no_past_candidate"]+=not any(c["relation"].startswith("PAST") for c in a)
                    counts["particle_no_past_candidate"]+=not any(c["relation"].startswith("PAST") for c in b)
                    for k,v in sb["measures"].items():totals["PARTICLE/"+k][0]+=1;totals["PARTICLE/"+k][1]+=v
                    for k in set(sa["measures"])&set(sb["measures"]):
                        # Same targets and document denominators for these paired rule changes.
                        v=sb["measures"][k]-sa["measures"][k];totals["PAIRED_CHANGE/"+k][0]+=1;totals["PAIRED_CHANGE/"+k][1]+=v
            counts["zero_target_structures"]+=alltargets==0
            for k,(n,v) in totals.items():result[k].append((work,current,v/n));targets[k]+=n
            for x in packets.get(current,[]):
                target=x["target"]
                previous=ref.COUNT
                try:
                    ref.COUNT=PARTICLE
                    cs=ref.candidates(forms,target)
                finally:
                    ref.COUNT=previous
                x["previous_item_hash"]=x["packet_hash"];x["candidate_regime"]="P62_PARTICLE_SENSITIVITY_V2";x["candidates"]=cs
                x["machine_predictions"]={"authority":"PROVISIONAL_SPAN_PROPOSALS_ONLY","previous_regime":"P62_STRICT_V1"}
                x["packet_hash"]=key([json.dumps({**x,"packet_hash":None},sort_keys=True,ensure_ascii=False)],"P62-item-particle-v2")
                assert x["human_ground_truth"] is None;items.append(x)
        with gzip.open(path,"rt",encoding="utf-8") as f:
            for x in map(json.loads,f):
                if x["document_variant"]!=current:flush();current=x["document_variant"];forms=[]
                forms.append(x["form"])
        flush()
        if counts["structures"]%100000<len(forms):
            print(json.dumps({"status":"RUNNING","phase":"PARTICLE_SENSITIVITY","structures":counts["structures"]}),flush=True)
    metrics={k:{**bootstrap(v),"eligible_targets":targets[k],"authority":"MACHINE_PROVISIONAL"} for k,v in result.items()}
    obj={"status":"EXECUTED","counts":dict(counts),"metrics":metrics,"wall_seconds":time.monotonic()-start,
         "counter_denominators":"PARTICLE counter eligibility differs; PAIRED_CHANGE uses exact common eligible targets",
         "semantic_claim":"NONE; particle coverage does not establish antecedence"}
    (out/"PARTICLE_SENSITIVITY_RESULTS.json").write_text(json.dumps(obj,indent=2),encoding="utf-8")
    with gzip.open(out/"ADJUDICATION_PACKET_V2.private.jsonl.gz","wt",encoding="utf-8") as f:
        for x in sorted(items,key=lambda x:x["item_id"]):f.write(json.dumps(x,ensure_ascii=False)+"\n")
    assert len(items)==2400
    print(json.dumps({"status":"EXECUTED","counts":dict(counts),"packet_items":len(items)}),flush=True)
    db.close();source.close()
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--root",required=True);p.add_argument("--out",required=True);a=p.parse_args();run(a.root,a.out)

