"""Exploratory common-support length/topic standardization of frozen source-unit effects."""
import argparse,collections,hashlib,json,sqlite3
from pathlib import Path
import numpy as np
from context_falsification import METRICS,length_bin
def load(path,conservative):
    db=sqlite3.connect("file:"+str(path).replace("\\","/")+"?mode=ro&immutable=1",uri=True)
    where=" AND variant NOT IN (SELECT variant FROM exclusions)" if conservative else ""
    query="""SELECT c.cluster,r.topic,r.collection,v.units,v.features FROM rows r JOIN variants v ON r.variant=v.id
        JOIN components c ON c.variant=v.id WHERE r.rid IN
        (SELECT MIN(rid) FROM rows WHERE format='json'"""+where+" GROUP BY variant)"
    clusters=set();cells=collections.defaultdict(lambda:{"total":np.zeros(6),"clusters":set()});vectors={}
    for cluster,topic,collection,n,payload in db.execute(query):
        clusters.add(cluster)
        if not payload:continue
        f=json.loads(payload);v=np.array([x for w in (2,5) for x in f["vector"][METRICS.index(("SOURCE",w,"PRIMARY"))*3:METRICS.index(("SOURCE",w,"PRIMARY"))*3+3]])
        if not np.any(v):continue
        cell=collection+"/"+topic+"/"+length_bin(n)
        cells[cell]["total"]+=v;cells[cell]["clusters"].add(cluster)
        a=vectors.setdefault(cluster,{})
        a[cell]=a.get(cell,np.zeros(6))+v
    db.close();return {"clusters":len(clusters),"cells":cells,"vectors":vectors}
def standardize(data,common,weights,windex,seed,draws=500):
    offset=windex*3
    m=len(common);a=np.zeros((len(data["vectors"]),m*3))
    for i,cells in enumerate(data["vectors"].values()):
        for j,cell in enumerate(common):
            if cell in cells:a[i,j*3:j*3+3]=cells[cell][offset:offset+3]
    informative=a.any(axis=1);a=a[informative]
    n=len(a);total=data["clusters"];p=np.full(n,1/total)
    if total>n:p=np.append(p,(total-n)/total)
    rng=np.random.default_rng(seed);counts=rng.multinomial(total,p,size=draws)[:,:n]
    values=(counts@a).reshape(draws,m,3)
    valid=np.all(values[:,:,0]>0,axis=1)
    b=values[valid];contrast=100*((b[:,:,1]-b[:,:,2])/b[:,:,0])@weights
    point=100*sum(weights[j]*(data["cells"][cell]["total"][offset+1]-data["cells"][cell]["total"][offset+2])/data["cells"][cell]["total"][offset] for j,cell in enumerate(common))
    return {"difference_pp":point,"cluster_bootstrap_95_pp":np.quantile(contrast,[.025,.975]).tolist() if len(contrast) else None,
            "valid_draws":int(valid.sum()),"draws":draws,"resampled_document_components":total}
def run(args):
    dev=load(args.development,False);rep=load(args.replication,True)
    report={"status":"EXECUTED","scope":"EXPLORATORY_FIXED_DEVELOPMENT_WEIGHTS_COMMON_SUPPORT",
        "composition_cells":"Collection label / private topic signature / source-unit length bin",
        "minimum_cell_support":"At least 20 eligible targets and 10 target-bearing source components in both cohorts",
        "development_policy":"GLOBAL_STRICT_STRUCTURE_DEDUP","replication_policy":"CONSERVATIVE_DOCUMENT_EXCLUSION",
        "weights":"Development eligible-target shares within admitted common-support cells; fixed in both bootstraps",
        "uncertainty":"500 ordinary source-component resamples including zero-target components; intervals conditional on fixed support and weights",
        "independent_work_authority":"HOLD; only conservative development-key exclusion established","windows":{}}
    for wi,w in enumerate((2,5)):
        offset=wi*3
        common=sorted(c for c,d in dev["cells"].items() if c in rep["cells"] and d["total"][offset]>=20 and rep["cells"][c]["total"][offset]>=20 and len(d["clusters"])>=10 and len(rep["cells"][c]["clusters"])>=10)
        if not common:report["windows"][str(w)]={"status":"HOLD_NO_COMMON_SUPPORT"};continue
        weights=np.array([dev["cells"][c]["total"][offset] for c in common]);weights/=weights.sum()
        coverage={}
        for name,data in (("development",dev),("replication",rep)):
            admitted=sum(data["cells"][c]["total"][offset] for c in common)
            alltargets=sum(d["total"][offset] for d in data["cells"].values())
            coverage[name]={"admitted_targets":int(admitted),"all_eligible_targets":int(alltargets),"coverage":admitted/alltargets if alltargets else None}
        report["windows"][str(w)]={"common_cells":len(common),"coverage":coverage,
            "fixed_weights":dict(zip(common,weights.tolist())),
            "development":standardize(dev,common,weights,wi,100+w),
            "replication":standardize(rep,common,weights,wi,200+w)}
    args.out.write_text(json.dumps(report,indent=2),encoding="utf-8");print(json.dumps({k:v for k,v in report.items() if k!="windows"}))
    for w,d in report["windows"].items():print(json.dumps({"window":w,**{k:v for k,v in d.items() if k!="fixed_weights"}}))
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--development",type=Path,required=True);p.add_argument("--replication",type=Path,required=True);p.add_argument("--out",type=Path,required=True);run(p.parse_args())

