"""Predeclared full-cohort anchor-exclusion diagnostic; no semantic labels."""
import argparse,collections,gzip,json,pathlib,sqlite3,time
from p62_reference import TARGET,NUMBERS,key,digest,bootstrap
from p62_particle import STRICT,PARTICLE
def plural(m):
    n=m.group("number");n=int(n) if n.isdigit() else NUMBERS.get(n)
    return n is None or n>1
def measure(forms,t,pattern):
    i=t["unit"];end=t["end"];n=len(forms)
    if i<2 or i+2>=n:return None
    anchor=pattern.search(forms[i][end:end+80])
    if not anchor:return None
    counter=anchor.group("counter");anchor_start=end+anchor.start();anchor_end=end+anchor.end()
    width=min(t["start"],len(forms[i])-end,256)
    p=f=masked=False;self_hit=False
    for j in range(i-2,i+3):
        for m in pattern.finditer(forms[j]):
            if not plural(m) or m.group("counter")!=counter:continue
            if j<i or (j==i and m.end()<=t["start"] and m.start()>=t["start"]-width):p=True
            future=j>i or (j==i and m.start()>=end and m.end()<=end+width)
            if future:
                f=True
                own=j==i and m.start()==anchor_start and m.end()==anchor_end
                if own:self_hit=True
                else:masked=True
    return {"raw":int(p)-int(f),"masked":int(p)-int(masked),"self_hit":self_hit,
            "anchor_plural":plural(anchor),"changed":f!=masked}
def run(root,out):
    root=pathlib.Path(root);out=pathlib.Path(out);start=time.monotonic()
    seal=json.loads((out/"ANCHOR_EXCLUSION_PREDECLARATION.json").read_text(encoding="utf-8"))
    if digest(__file__)!=seal["code_sha256"]:raise RuntimeError("Anchor code changed")
    s=sqlite3.connect((root/"70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite").as_uri()+"?mode=ro",uri=True)
    db=sqlite3.connect((out/"P62_PRIVATE.sqlite").as_uri()+"?mode=ro",uri=True)
    rows=collections.defaultdict(list);den=collections.Counter();counts=collections.Counter();strata=collections.defaultdict(list)
    for path, in s.execute("select path from shards where kind='paragraphs' order by path"):
        current=None;forms=[]
        def flush():
            if current is None:return
            counts["structures"]+=1;counts["paragraphs"]+=len(forms);tot=collections.defaultdict(lambda:[0,0])
            work,family,year= db.execute("select w.work,d.family,d.year from documents d join work_keys w using(lineage) where strict=?",(current,)).fetchone()
            for i,text in enumerate(forms):
                for m in TARGET.finditer(text):
                    counts["targets"]+=1;t={"unit":i,"start":m.start(),"end":m.end()}
                    for regime,pattern in [("STRICT",STRICT),("PARTICLE",PARTICLE)]:
                        v=measure(forms,t,pattern)
                        if v is None:continue
                        counts[regime+"/eligible"]+=1;counts[regime+"/self_hit"]+=v["self_hit"];counts[regime+"/changed_future"]+=v["changed"]
                        for metric,value in [("RAW",v["raw"]),("MASKED",v["masked"]),("PAIRED_CHANGE",v["masked"]-v["raw"])]:
                            k=regime+"/"+metric;tot[k][0]+=1;tot[k][1]+=value
            for k,(n,v) in tot.items():
                r=(work,current,v/n);rows[k].append(r);den[k]+=n
                strata[family+"/"+k].append(r)
        with gzip.open(path,"rt",encoding="utf-8") as f:
            for x in map(json.loads,f):
                if x["document_variant"]!=current:flush();current=x["document_variant"];forms=[]
                forms.append(x["form"])
        flush()
    result={"status":"EXECUTED","counts":dict(counts),"metrics":{k:{**bootstrap(v),"eligible_targets":den[k]} for k,v in rows.items()},
            "family_strata":{k:bootstrap(v,300) for k,v in strata.items()},"wall_seconds":time.monotonic()-start,
            "claim_ceiling":"Mechanically excludes the unique quantity used to define counter compatibility; neither raw nor masked metric is semantic reference"}
    (out/"ANCHOR_EXCLUSION_RESULTS.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps({"status":"EXECUTED","counts":dict(counts)}),flush=True)
    s.close();db.close()
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--root",required=True);p.add_argument("--out",required=True);a=p.parse_args();run(a.root,a.out)

