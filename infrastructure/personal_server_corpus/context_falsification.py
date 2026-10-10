"""Exploratory source-stratified falsification with source-component bootstrap."""
import argparse, collections, datetime, gzip, hashlib, json, math, os, sqlite3, time
from pathlib import Path
import numpy as np
from context_surfaces_bounded import TARGET, CUE
try:
    from pipeline_v5 import spans
except ModuleNotFoundError:
    from pipeline import spans
from distant_window_control import starts

CONTROLS=("PRIMARY","PAST_ONLY","FUTURE_ONLY","ADJACENT_FUTURE","MIRROR_REMOTE","REMOTE_ASYMMETRY")
METRICS=[(seg,w,c) for seg in ("SOURCE","ORTHOGRAPHIC","COARSENED") for w in (2,5)
         for c in (CONTROLS if seg=="SOURCE" else ("PRIMARY",))]
def sha(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda:f.read(1048576),b""):h.update(b)
    return h.hexdigest()
def sig(v):return hashlib.sha256(json.dumps(v,ensure_ascii=True,sort_keys=True).encode()).hexdigest()
def weak(meta):
    x=[str(meta[k]).strip() if meta.get(k) is not None else "" for k in ("title","publisher","date")]
    return sig(x) if all(x) else None
def length_bin(n):
    return "01_04" if n<5 else "05_09" if n<10 else "10_19" if n<20 else "20_39" if n<40 else "40_PLUS"
def char_bin(n):return "LE_500" if n<=500 else "501_1500" if n<=1500 else "1501_4000" if n<=4000 else "GT_4000"
def measures(forms,full=True):
    hits=[len(list(TARGET.finditer(t))) for t in forms]
    cues=[bool(CUE.search(t)) for t in forms]
    prefix=[0]
    for cue in cues:prefix.append(prefix[-1]+int(cue))
    n=len(forms);out={};excluded={}
    def has(s,w):return int(prefix[s+w]>prefix[s])
    for w in (2,5):
        keys=CONTROLS if full else ("PRIMARY",)
        vals={k:[0.,0.,0.] for k in keys}
        ex={k:collections.Counter() for k in keys}
        for i,k in enumerate(hits):
            if not k:continue
            if i<w:
                for c in keys:ex[c]["no_full_preceding_window"]+=k
                continue
            true=has(i-w,w);eligible=starts(n,i,w)
            past=[s for s in eligible if s+w<=i-w]
            future=[s for s in eligible if s>=i+1]
            mirror=[(s,2*i-s-w+1) for s in past if 2*i-s+1<=n]
            candidates={"PRIMARY":eligible,"PAST_ONLY":past,"FUTURE_ONLY":future,
                "ADJACENT_FUTURE":[i+1] if i+1+w<=n else [],
                "MIRROR_REMOTE":mirror,"REMOTE_ASYMMETRY":mirror}
            for c in keys:
                windows=candidates[c]
                if not windows:ex[c]["no_admissible_control_window"]+=k;continue
                obs=true
                if c=="REMOTE_ASYMMETRY":
                    obs=sum(has(s,w) for s,t in windows)/len(windows)
                    control=sum(has(t,w) for s,t in windows)/len(windows)
                elif c=="MIRROR_REMOTE":
                    control=sum((has(s,w)+has(t,w))/2 for s,t in windows)/len(windows)
                else:control=sum(has(s,w) for s in windows)/len(windows)
                vals[c][0]+=k;vals[c][1]+=k*obs;vals[c][2]+=k*control
        for c in keys:out[(w,c)]=vals[c];excluded[(w,c)]=dict(ex[c])
    return sum(hits),out,excluded
def document_features(forms):
    if not any(TARGET.search(t) for t in forms):
        return {"units":len(forms),"characters":sum(map(len,forms)),"targets":0,"vector":[0.]*(len(METRICS)*3),"exclusions":{}}
    target_count,source,ex=measures(forms)
    metrics={("SOURCE",w,c):v for (w,c),v in source.items()}
    exclusions={("SOURCE",w,c):v for (w,c),v in ex.items()}
    for seg,units in (("ORTHOGRAPHIC",[t[a:b] for t in forms for a,b in spans(t)]),
                      ("COARSENED",["\n".join(forms[i:i+2]) for i in range(0,len(forms),2)])):
        _,m,e=measures(units,False)
        for (w,c),v in m.items():metrics[(seg,w,c)]=v;exclusions[(seg,w,c)]=e[(w,c)]
    return {"units":len(forms),"characters":sum(map(len,forms)),"targets":target_count,
        "vector":[x for key in METRICS for x in metrics[key]],
        "exclusions":{"/".join(map(str,key)):v for key,v in exclusions.items()}}
class Union:
    def __init__(self):self.parent={}
    def find(self,x):
        self.parent.setdefault(x,x)
        while x!=self.parent[x]:
            self.parent[x]=self.parent[self.parent[x]];x=self.parent[x]
        return x
    def join(self,a,b):
        a,b=self.find(a),self.find(b)
        if a!=b:self.parent[max(a,b)]=min(a,b)
def interval(vectors,total_clusters,seed,draws=500):
    if not vectors:return [None]*(len(METRICS))
    a=np.array(list(vectors.values()),dtype=float)
    informative=len(a);zero=total_clusters-informative
    probs=np.full(informative,1/total_clusters)
    if zero:probs=np.append(probs,zero/total_clusters)
    rng=np.random.default_rng(seed)
    weights=rng.multinomial(total_clusters,probs,size=draws)[:,:informative]
    boot=(weights@a).reshape(draws,len(METRICS),3)
    result=[]
    for j in range(len(METRICS)):
        b=boot[:,j];mask=b[:,0]>0
        values=100*(b[mask,1]-b[mask,2])/b[mask,0]
        result.append({"percentile_95_pp":np.quantile(values,[.025,.975]).tolist() if len(values) else None,
            "valid_draws":int(mask.sum()),"requested_draws":draws})
    return result
def development_keys(path):
    db=sqlite3.connect("file:"+str(path).replace("\\","/")+"?mode=ro&immutable=1",uri=True)
    keys={k:set() for k in ("id","strict","flat","weak")}
    for ident,strict,flat,metadata in db.execute("SELECT doc_id,strict,flat,metadata FROM occurrences"):
        keys["id"].add(ident);keys["strict"].add(strict);keys["flat"].add(flat)
        w=weak(json.loads(metadata)["document"])
        if w:keys["weak"].add(w)
    db.close();return keys
class Group:
    def __init__(self):
        self.clusters=set();self.targetclusters=set();self.vectors={};self.n=0;self.zero=0;self.targets=0;self.exclusions=collections.Counter()
    def add(self,row,feat):
        self.n+=1;self.zero+=int(feat["targets"]==0);self.targets+=feat["targets"];c=row["cluster"];self.clusters.add(c)
        if not feat["targets"]:return
        self.targetclusters.add(c)
        vector=np.array(feat["vector"],dtype=float)
        if np.any(vector):
            if c in self.vectors:self.vectors[c]+=vector
            else:self.vectors[c]=vector
        for k,ex in feat["exclusions"].items():
            for reason,count in ex.items():self.exclusions[k+"/"+reason]+=count
    def finish(self,name):
        total=sum(self.vectors.values(),np.zeros(len(METRICS)*3)).reshape(len(METRICS),3)
        intervals=interval(self.vectors,len(self.clusters),int(hashlib.sha256(name.encode()).hexdigest()[:16],16))
        metrics={}
        for j,key in enumerate(METRICS):
            n,a,b=total[j];metrics["/".join(map(str,key))]={"eligible_targets":int(n),"observed_hits":float(a),"expected_control_hits":float(b),
                "observed_rate":a/n if n else None,"expected_control_rate":b/n if n else None,
                "difference_pp":100*(a-b)/n if n else None,"cluster_bootstrap":intervals[j]}
        return {"representation_rows":self.n,"document_components":len(self.clusters),"zero_target_rows":self.zero,
            "components_with_targets":len(self.targetclusters),"all_surface_targets":self.targets,
            "explicit_target_exclusions":dict(self.exclusions),"metrics":metrics}
def extract_store(args):
    path=args.out/(args.label+"_FEATURES.sqlite")
    db=sqlite3.connect(path,uri=True)
    db.execute("PRAGMA journal_mode=WAL");db.execute("PRAGMA cache_size=-32768")
    db.execute("CREATE TABLE IF NOT EXISTS variants(id INTEGER PRIMARY KEY,strict TEXT UNIQUE,units INTEGER,characters INTEGER,targets INTEGER,features TEXT)")
    db.execute("CREATE TABLE IF NOT EXISTS receipts(key TEXT PRIMARY KEY,value TEXT)")
    old=db.execute("SELECT value FROM receipts WHERE key='complete'").fetchone()
    if old:
        receipt=json.loads(old[0])
        if receipt["code_sha256"]!=sha(Path(__file__)) or receipt["input_sha256"]!=sha(args.db):
            raise ValueError("Feature cache belongs to different code or source snapshot")
        return db
    if db.execute("SELECT COUNT(*) FROM variants").fetchone()[0]:raise ValueError("Incomplete feature cache requires a new output label; retain prior cache")
    source=sqlite3.connect("file:"+str(args.db).replace("\\","/")+"?mode=ro&immutable=1",uri=True)
    tables={x[0] for x in source.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    paths=[Path(x[0]) for x in source.execute("SELECT path FROM shards WHERE kind='paragraphs' ORDER BY path")] if "shards" in tables else sorted((args.root/"40_CORPUS/paragraphs"/args.corpus_run).glob("*.gz"))
    current=None;forms=[];n=0
    def flush():
        nonlocal n
        if not forms:return
        feat=document_features(forms)
        payload=json.dumps(feat) if feat["targets"] else None
        db.execute("INSERT INTO variants(strict,units,characters,targets,features) VALUES(?,?,?,?,?)",
                   (current,feat["units"],feat["characters"],feat["targets"],payload))
        n+=1
        if n%30000==0:
            db.commit();print(json.dumps({"status":"RUNNING","phase":"FEATURE_EXTRACTION","label":args.label,"structures":n}),flush=True)
    for path in paths:
        with gzip.open(path,"rt",encoding="utf-8") as f:
            for line in f:
                row=json.loads(line)
                if row["document_variant"]!=current:flush();forms=[];current=row["document_variant"]
                forms.append(row["form"])
    flush()
    expected=source.execute("SELECT COUNT(*) FROM canonical").fetchone()[0]
    if n!=expected:raise ValueError("Feature coverage does not match canonical structure count")
    db.execute("INSERT INTO receipts VALUES('complete',?)",(json.dumps({"status":"VERIFIED","structures":n,
        "code_sha256":sha(Path(__file__)),"input_sha256":sha(args.db)}),));db.commit();source.close()
    return db
def build_metadata(db,args,devkeys):
    old=db.execute("SELECT value FROM receipts WHERE key='metadata_complete'").fetchone()
    if old:return json.loads(old[0])
    n=db.execute("SELECT COUNT(*) FROM variants").fetchone()[0]
    parent=np.arange(n+1,dtype=np.int64)
    def find(x):
        while x!=parent[x]:
            parent[x]=parent[parent[x]];x=int(parent[x])
        return x
    def join(a,b):
        a,b=find(a),find(b)
        if a!=b:parent[max(a,b)]=min(a,b)
    db.execute("CREATE TABLE rows(rid INTEGER PRIMARY KEY,variant INTEGER,doc_id TEXT,flat TEXT,year TEXT,format TEXT,release TEXT,weak TEXT,topic TEXT,category TEXT,collection TEXT,development_overlap INTEGER)")
    db.execute("ATTACH DATABASE ? AS source",("file:"+str(args.db).replace("\\","/")+"?mode=ro&immutable=1",))
    db.execute("CREATE TABLE all_source_keys(doc_id TEXT,strict TEXT,flat TEXT,weak TEXT)")
    first_id={};first_flat={};covered=0
    query="SELECT v.id,o.doc_id,o.flat,o.year,o.format,m.archive,o.metadata,o.strict FROM source.occurrences o JOIN source.members m ON m.key=o.member LEFT JOIN variants v ON v.strict=o.strict"
    cursor=db.execute(query)
    for variant,ident,flat,year,fmt,release,metadata,strict in cursor:
        meta=json.loads(metadata);d=meta["document"];w=weak(d)
        db.execute("INSERT INTO all_source_keys VALUES(?,?,?,?)",(ident,strict,flat,w))
        if variant is None:continue
        overlap=bool(devkeys and (ident in devkeys["id"] or flat in devkeys["flat"] or (w and w in devkeys["weak"])))
        if devkeys and not overlap:overlap=strict in devkeys["strict"]
        db.execute("INSERT INTO rows(variant,doc_id,flat,year,format,release,weak,topic,category,collection,development_overlap) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            (variant,ident,flat,year,fmt,release,w,"TOPIC_"+sig(d.get("topic","UNKNOWN"))[:12],
             "CATEGORY_"+sig(meta["file"].get("category","UNKNOWN"))[:12],
             "WRITTEN" if "WRITTEN" in release else "NEWSPAPER",int(overlap)))
        for first,key in ((first_id,ident),(first_flat,flat)):
            if key in first:join(variant,first[key])
            else:first[key]=variant
        covered+=1
        if covered%30000==0:
            db.commit();print(json.dumps({"status":"RUNNING","phase":"SOURCE_COMPONENT_GRAPH","label":args.label,"covered_rows":covered}),flush=True)
    del first_id,first_flat
    db.execute("CREATE TABLE components(variant INTEGER PRIMARY KEY,cluster INTEGER)")
    db.executemany("INSERT INTO components VALUES(?,?)",((i,find(i)) for i in range(1,n+1)))
    db.commit()
    for col in ("variant","doc_id","weak","release"):
        db.execute("CREATE INDEX rows_"+col+" ON rows("+col+")")
    db.executescript("""
        CREATE TEMP TABLE conflicting_ids AS SELECT doc_id FROM all_source_keys GROUP BY doc_id HAVING COUNT(DISTINCT flat)>1;
        CREATE TEMP TABLE multi_clusters AS SELECT cluster FROM components GROUP BY cluster HAVING COUNT(*)>1;
        CREATE TEMP TABLE weak_conflicts AS SELECT weak FROM all_source_keys WHERE weak IS NOT NULL GROUP BY weak HAVING COUNT(DISTINCT strict)>1;
        CREATE TABLE exclusions(variant INTEGER,reason TEXT);
        INSERT INTO exclusions SELECT DISTINCT variant,'ID_TEXT_CONFLICT' FROM rows WHERE doc_id IN (SELECT doc_id FROM conflicting_ids);
        INSERT INTO exclusions SELECT variant,'MULTIPLE_STRUCTURES_IN_SOURCE_COMPONENT' FROM components WHERE cluster IN (SELECT cluster FROM multi_clusters);
        INSERT INTO exclusions SELECT DISTINCT variant,'MISSING_WEAK_IDENTITY_METADATA' FROM rows WHERE weak IS NULL;
        INSERT INTO exclusions SELECT DISTINCT variant,'WEAK_METADATA_DIFFERENT_STRUCTURES' FROM rows WHERE weak IN (SELECT weak FROM weak_conflicts);
        INSERT INTO exclusions SELECT variant,'DEVELOPMENT_KEY_OVERLAP' FROM components WHERE cluster IN
            (SELECT c.cluster FROM rows r JOIN components c ON c.variant=r.variant WHERE r.development_overlap=1);
        CREATE INDEX exclusion_variant ON exclusions(variant);
    """)
    allrows=db.execute("SELECT COUNT(*) FROM source.occurrences").fetchone()[0]
    info={"coverage":{"all_occurrences":allrows,"covered_occurrences":covered,"no_JSON_text_structure":allrows-covered},
        "identity_graph":{"source_components":db.execute("SELECT COUNT(DISTINCT cluster) FROM components").fetchone()[0],
        "multi_structure_components":db.execute("SELECT COUNT(*) FROM multi_clusters").fetchone()[0],
        "conflicting_IDs":db.execute("SELECT COUNT(*) FROM conflicting_ids").fetchone()[0]}}
    db.execute("INSERT INTO receipts VALUES('metadata_complete',?)",(json.dumps(info),));db.commit()
    return info
def analyze(args):
    start=time.perf_counter();out=args.out;out.mkdir(parents=True,exist_ok=True)
    os.environ.setdefault("SQLITE_TMPDIR",str(args.root/"90_SCRATCH"))
    db=extract_store(args)
    devkeys=development_keys(args.development) if args.development else None
    info=build_metadata(db,args,devkeys);del devkeys
    result={"status":"EXECUTED","label":args.label,"scope":"EXPLORATORY_NOT_INDEPENDENT_CONFIRMATION",**info,
        "canonical_text_structures":db.execute("SELECT COUNT(*) FROM variants").fetchone()[0],"policies":{},
        "definitions":{"metrics":[list(x) for x in METRICS],"source_cluster":"Connected components of shared document IDs, strict structures and flattened text; weak metadata excluded conservatively, not merged as authority",
        "bootstrap":"500 deterministic ordinary source-component resamples, including zero-target components; exploratory percentile intervals conditional on selected cohort",
        "format_scope":"CSV only where its strict structure is backed by preserved JSON text; unmatched CSV explicitly excluded",
        "control_scope":"All exact admissible windows; SOURCE/PRIMARY exactly reproduces frozen definition; segmentation sensitivities are protocol changes",
        "conservative_exclusion":"Exclude whole structures if any representation fails a declared identity rule; exclude whole components touching any development key"},
        "input_database_sha256":sha(args.db),"code_sha256":sha(Path(__file__)),"commands":list(os.sys.argv)}
    selectors={
        "ALL_COVERED_REPRESENTATIONS":"1",
        "WITHIN_RELEASE_FORMAT_STRICT_STRUCTURE_DEDUP":"r.rid IN (SELECT MIN(rid) FROM rows GROUP BY release,format,variant)",
        "GLOBAL_STRICT_STRUCTURE_DEDUP":"r.rid IN (SELECT MIN(rid) FROM rows WHERE format='json' GROUP BY variant)",
        "CONSERVATIVE_DOCUMENT_EXCLUSION":"r.rid IN (SELECT MIN(rid) FROM rows WHERE format='json' AND variant NOT IN (SELECT variant FROM exclusions) GROUP BY variant)"}
    zero=np.zeros(len(METRICS)*3)
    for policy,where in selectors.items():
        groups={}
        query="""SELECT r.variant,c.cluster,r.release,r.year,r.format,r.topic,r.category,r.collection,
                 v.units,v.characters,v.targets,v.features FROM rows r JOIN variants v ON r.variant=v.id
                 JOIN components c ON c.variant=v.id WHERE """+where
        for variant,cluster,release,year,fmt,topic,category,collection,units,characters,targets,payload in db.execute(query):
            feat=json.loads(payload) if payload else {"targets":0,"vector":zero,"exclusions":{}}
            row={"cluster":cluster}
            lanes=["ALL","RELEASE/"+release,"YEAR/"+year,"FORMAT/"+fmt,"LENGTH/"+length_bin(units),
                   "CHARACTERS/"+char_bin(characters),"TOPIC/"+topic,"CATEGORY/"+category,"COLLECTION/"+collection]
            for lane in lanes:groups.setdefault(lane,Group()).add(row,feat)
        excluded={reason:count for reason,count in db.execute("SELECT reason,COUNT(DISTINCT variant) FROM exclusions GROUP BY reason")} if policy=="CONSERVATIVE_DOCUMENT_EXCLUSION" else {}
        result["policies"][policy]={"excluded_structures_by_reason":excluded,
            "groups":{lane:g.finish(args.label+"/"+policy+"/"+lane) for lane,g in groups.items()}}
        del groups
        print(json.dumps({"status":"EXECUTED","label":args.label,"policy":policy}),flush=True)
    result["wall_seconds"]=time.perf_counter()-start
    path=out/(args.label+"_FALSIFICATION_RESULTS.json");path.write_text(json.dumps(result,indent=2),encoding="utf-8")
    db.close();print(json.dumps({"status":"EXECUTED","result":str(path),"coverage":info["coverage"]}),flush=True)

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--root",type=Path,required=True);p.add_argument("--db",type=Path,required=True)
    p.add_argument("--corpus-run",required=True);p.add_argument("--out",type=Path,required=True);p.add_argument("--label",required=True)
    p.add_argument("--development",type=Path)
    a=p.parse_args();a.out.resolve().relative_to(a.root.resolve());analyze(a)

