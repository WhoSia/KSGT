"""Provisional P61 source lineage and document-equal directional diagnostics.

Private text and identifiers are never suitable for public publication.
Rule-generated candidates are not adjudicated antecedents.
"""
import argparse, collections, datetime, gzip, hashlib, heapq, json, math, re, shutil, sqlite3, time, unicodedata
from pathlib import Path
import numpy as np
from context_surfaces_bounded import TARGET, CUE
try:
    from pipeline_v5 import spans
except ImportError:
    from pipeline import spans

COUNTER=re.compile(r"(?P<number>\d+|한|하나|두|둘|세|셋|네|몇|여러)\s*(?P<counter>명|개|곳|가지|건|팀|편|마리)(?![가-힣])")
META=re.compile(r"(?:라는|이라는)\s*(?:표현|말|단어)|(?:표현|단어)\s*[\"'“‘]")
NUMBERS={"한":1,"하나":1,"두":2,"둘":2,"세":3,"셋":3,"네":4}
METRICS=("NUMERIC_CUE","COMPATIBLE_COUNTER_PROXY","LEXICAL_PERSISTENCE","TOPIC_BALANCED_CUE","CENTRAL_CUE","PSEUDOANCHOR_CUE")
def digest(p):
    h=hashlib.sha256()
    with Path(p).open("rb") as f:
        for b in iter(lambda:f.read(1048576),b""):h.update(b)
    return h.hexdigest()
def normalized(forms):
    return " ".join(unicodedata.normalize("NFC"," ".join(forms)).split())
def fingerprint(forms):
    b=normalized(forms).encode("utf-8")
    return hashlib.sha256(b"P61-normalized-v1\0"+b).hexdigest(),hashlib.sha512(b).hexdigest(),len(b)
def family(release):
    if "WRITTEN" in release:return "WRITTEN"
    return "ANNUAL" if re.search(r"20(?:20|21|22|23|24|25)",release) else "AGGREGATE"
def length_bin(n):
    return "01_04" if n<5 else "05_09" if n<10 else "10_19" if n<20 else "20_39" if n<40 else "40_PLUS"
def lexical(text):
    text=TARGET.sub(" ",text);text=COUNTER.sub(" ",text)
    tokens=re.findall(r"[가-힣]{2,}",text)
    return {t[i:i+2] for t in tokens for i in range(len(t)-1)}
def jaccard(a,b):
    return len(a&b)/len(a|b) if a|b else 0.
def groups(forms,indexes):
    result=[]
    for j in indexes:
        for m in COUNTER.finditer(forms[j]):
            raw=m.group("number");number=int(raw) if raw.isdigit() else NUMBERS.get(raw)
            result.append({"unit":j,"start":m.start(),"end":m.end(),"counter":m.group("counter"),
                           "cardinality":number,"plural_rule":number is None or number>1})
    return result
def assess(forms,i,target,w):
    n=len(forms)
    if i<w or i+w>=n:return None
    past=list(range(i-w,i));future=list(range(i+1,i+w+1))
    a=groups(forms,past);b=groups(forms,future)
    p=int(any(CUE.search(forms[j]) for j in past));f=int(any(CUE.search(forms[j]) for j in future))
    after=COUNTER.search(forms[i][target.end():target.end()+80])
    counter=after.group("counter") if after else None
    cp=int(any(x["plural_rule"] and x["counter"]==counter for x in a)) if counter else None
    cf=int(any(x["plural_rule"] and x["counter"]==counter for x in b)) if counter else None
    lex=lexical(forms[i]);pa=jaccard(lex,lexical(" ".join(forms[j] for j in past)))
    fu=jaccard(lex,lexical(" ".join(forms[j] for j in future)))
    alternatives=[j for j in range(w,n-w) if j!=i and not TARGET.search(forms[j])]
    pseudo=min(alternatives,key=lambda j:(abs(j-i),j)) if alternatives else None
    pd=None
    if pseudo is not None:
        pd=int(any(CUE.search(forms[j]) for j in range(pseudo-w,pseudo)))-int(any(CUE.search(forms[j]) for j in range(pseudo+1,pseudo+w+1)))
    diff=p-f;central=.25<=i/(n-1)<=.75
    values={"NUMERIC_CUE":diff,"COMPATIBLE_COUNTER_PROXY":None if cp is None else cp-cf,
            "LEXICAL_PERSISTENCE":pa-fu,"TOPIC_BALANCED_CUE":diff if abs(pa-fu)<=.02 else None,
            "CENTRAL_CUE":diff if central else None,"PSEUDOANCHOR_CUE":pd}
    plural=[x for x in a if x["plural_rule"]]
    if META.search(forms[i]):category="QUOTED_OR_METALINGUISTIC"
    elif len(plural)>1:category="MULTIPLE_COMPETING_GROUPS"
    elif plural:category="PLAUSIBLE_PAST_GROUP"
    elif a:category="SINGLETON_GROUP_NEGATIVE"
    elif any(x["plural_rule"] for x in b):category="FORWARD_ONLY"
    else:category="NO_GROUP_CUE"
    item={"target_unit":i,"target_start":target.start(),"target_end":target.end(),"window":w,
          "rule_category":category,"past_candidates":a,"future_descriptive_controls":b,
          "target_counter_proxy":counter,"past_lexical_jaccard":pa,"future_lexical_jaccard":fu,
          "pseudoanchor_unit":pseudo,"candidate_authority":"PROVISIONAL_RULE_GENERATED",
          "ground_truth":None,"adjudication_status":"UNRESOLVED_NOT_ADJUDICATED"}
    return values,item
def document_measure(forms):
    totals=collections.defaultdict(lambda:[0,0.]);items=[];excluded=collections.Counter()
    alltargets=0
    for i,text in enumerate(forms):
        for target in TARGET.finditer(text):
            alltargets+=1
            for w in (2,5):
                result=assess(forms,i,target,w)
                if result is None:
                    excluded[str(w)]+=1
                    if w==2:items.append({"target_unit":i,"target_start":target.start(),"target_end":target.end(),"window":2,
                                         "rule_category":"INSUFFICIENT_SYMMETRIC_CONTEXT","past_candidates":[],
                                         "ground_truth":None,"adjudication_status":"UNRESOLVED_NOT_ADJUDICATED"})
                    continue
                values,item=result;items.append(item)
                if w==2 and item["pseudoanchor_unit"] is not None:
                    items.append({"target_unit":item["pseudoanchor_unit"],"target_start":None,"target_end":None,"window":2,
                                  "rule_category":"PSEUDOANCHOR_NEGATIVE","past_candidates":groups(forms,range(item["pseudoanchor_unit"]-2,item["pseudoanchor_unit"])),
                                  "ground_truth":None,"adjudication_status":"UNRESOLVED_NOT_ADJUDICATED","candidate_authority":"PROVISIONAL_RULE_GENERATED"})
                for name,value in values.items():
                    if value is not None:totals[(w,name)][0]+=1;totals[(w,name)][1]+=value
    return {"targets":alltargets,"metrics":{str(w)+"/"+name:{"eligible_targets":n,"mean_difference":value/n}
        for (w,name),(n,value) in totals.items()},"excluded":dict(excluded)},items

class Union:
    def __init__(self,n):self.p=np.arange(n+1,dtype=np.int64)
    def find(self,x):
        while self.p[x]!=x:self.p[x]=self.p[self.p[x]];x=int(self.p[x])
        return x
    def join(self,a,b):
        a,b=self.find(a),self.find(b)
        if a!=b:self.p[max(a,b)]=min(a,b)

def ro(path):
    return sqlite3.connect("file:"+str(path).replace("\\","/")+"?mode=ro&immutable=1",uri=True)
def extract(args):
    out=args.out;out.mkdir(exist_ok=True)
    db=sqlite3.connect(out/"P61_PRIVATE.sqlite",uri=True);db.execute("PRAGMA journal_mode=WAL");db.execute("PRAGMA cache_size=-32768")
    source=ro(args.source);feat=ro(args.features)
    db.executescript("""CREATE TABLE IF NOT EXISTS documents(variant INTEGER PRIMARY KEY,strict TEXT UNIQUE,
        oldcluster INTEGER,normalized TEXT,secondary TEXT,bytes INTEGER,units INTEGER,year TEXT,
        release TEXT,family TEXT,known_new INTEGER,conflict INTEGER,lineage INTEGER,metrics TEXT);
        CREATE TABLE IF NOT EXISTS release_membership(variant INTEGER,release TEXT,family TEXT);
        CREATE TABLE IF NOT EXISTS checkpoints(path TEXT PRIMARY KEY,documents INTEGER,sha256 TEXT);
        CREATE TABLE IF NOT EXISTS candidates(key TEXT PRIMARY KEY,stratum TEXT,priority TEXT,payload TEXT);
        CREATE TABLE IF NOT EXISTS receipts(key TEXT PRIMARY KEY,payload TEXT);""")
    old=db.execute("SELECT payload FROM receipts WHERE key='extraction_complete'").fetchone()
    if old:return db,json.loads(old[0])
    if not db.execute("SELECT COUNT(*) FROM documents").fetchone()[0]:
        db.execute("ATTACH DATABASE ? AS frozen",("file:"+str(args.features).replace("\\","/")+"?mode=ro&immutable=1",))
        db.executescript("""INSERT INTO documents(variant,strict,oldcluster,units,year,release,family,known_new,conflict)
            SELECT v.id,v.strict,c.cluster,v.units,r.year,r.release,'',1,0 FROM frozen.variants v
            JOIN frozen.components c ON c.variant=v.id JOIN frozen.rows r ON r.variant=v.id
            WHERE r.rid IN(SELECT MIN(rid) FROM frozen.rows WHERE format='json' GROUP BY variant);
            UPDATE documents SET known_new=0 WHERE variant IN(SELECT variant FROM frozen.exclusions
                WHERE reason IN('DEVELOPMENT_KEY_OVERLAP','MULTIPLE_STRUCTURES_IN_SOURCE_COMPONENT','ID_TEXT_CONFLICT'));
            UPDATE documents SET conflict=1 WHERE variant IN(SELECT variant FROM frozen.exclusions WHERE reason='ID_TEXT_CONFLICT');
            INSERT INTO release_membership SELECT DISTINCT variant,release,'' FROM frozen.rows;""")
        for variant,release in db.execute("SELECT variant,release FROM documents").fetchall():
            db.execute("UPDATE documents SET family=? WHERE variant=?",(family(release),variant))
        db.execute("UPDATE release_membership SET family=CASE WHEN release LIKE '%WRITTEN%' THEN 'WRITTEN' WHEN release GLOB '*20[2][0-5]*' THEN 'ANNUAL' ELSE 'AGGREGATE' END")
        db.commit()
    completed={p for p, in db.execute("SELECT path FROM checkpoints")}
    for p,h in db.execute("SELECT path,sha256 FROM checkpoints"):
        if digest(Path(p))!=h:raise ValueError("Checkpoint source shard changed")
    count=0;start=time.perf_counter()
    paths=[Path(p) for p, in source.execute("SELECT path FROM shards WHERE kind='paragraphs' ORDER BY path")]
    for path in paths:
        if str(path) in completed:continue
        if shutil.disk_usage(out).free<60*1024**3:raise RuntimeError("HOLD_DISK_RESERVE")
        current=None;forms=[];nd=0
        def flush():
            nonlocal nd,count
            if current is None:return
            row=db.execute("SELECT variant,year,release,family FROM documents WHERE strict=?",(current,)).fetchone()
            if row is None:raise ValueError("Unknown canonical variant")
            variant,year,release,fam=row
            norm,secondary,size=fingerprint(forms)
            m,items=document_measure(forms)
            db.execute("UPDATE documents SET normalized=?,secondary=?,bytes=?,metrics=? WHERE variant=?",(norm,secondary,size,json.dumps(m),variant))
            for item in items:
                key=hashlib.sha256((current+"/"+str(item["target_unit"])+"/"+str(item["target_start"])+"/"+item["rule_category"]+"/"+str(item["window"])).encode()).hexdigest()
                stratum=fam+"/"+year+"/"+length_bin(len(forms))+"/"+item["rule_category"]
                item.update({"strict_structure":current,"variant":variant,"source_release":release,"publication_year":year,
                             "stratum":stratum,"source_locator":"Frozen paragraph shard, document_variant plus unit index",
                             "gold_authority":"NONE"})
                db.execute("INSERT OR REPLACE INTO candidates VALUES(?,?,?,?)",(key,stratum,key,json.dumps(item,ensure_ascii=False)))
            nd+=1;count+=1
        with gzip.open(path,"rt",encoding="utf-8") as f:
            for line in f:
                row=json.loads(line)
                if row["document_variant"]!=current:
                    flush();forms=[];current=row["document_variant"]
                forms.append(row["form"])
        flush()
        db.execute("INSERT INTO checkpoints VALUES(?,?,?)",(str(path),nd,digest(path)));db.commit()
        if count and count%30000<nd:print(json.dumps({"status":"RUNNING","phase":"P61_STREAMING","documents_this_invocation":count}),flush=True)
    n=db.execute("SELECT COUNT(*) FROM documents WHERE normalized IS NOT NULL").fetchone()[0]
    expected=source.execute("SELECT COUNT(*) FROM canonical").fetchone()[0]
    assert n==expected
    u=Union(int(db.execute("SELECT MAX(variant) FROM documents").fetchone()[0]));first={}
    for variant,old in db.execute("SELECT variant,oldcluster FROM documents"):
        if old in first:u.join(variant,first[old])
        else:first[old]=variant
    first={}
    for variant,norm,secondary,size in db.execute("SELECT variant,normalized,secondary,bytes FROM documents"):
        key=(norm,secondary,size)
        if key in first:u.join(variant,first[key])
        else:first[key]=variant
    db.executemany("UPDATE documents SET lineage=? WHERE variant=?",((u.find(i),i) for i, in db.execute("SELECT variant FROM documents").fetchall()))
    db.execute("UPDATE documents SET known_new=0 WHERE lineage IN(SELECT lineage FROM documents WHERE known_new=0)")
    db.commit()
    info={"status":"VERIFIED","structures":n,"paragraphs":source.execute("SELECT SUM(paragraphs) FROM canonical").fetchone()[0],
          "lineage_components":db.execute("SELECT COUNT(DISTINCT lineage) FROM documents").fetchone()[0],
          "known_new_structures":db.execute("SELECT COUNT(*) FROM documents WHERE known_new=1").fetchone()[0],
          "conflicting_structures":db.execute("SELECT COUNT(*) FROM documents WHERE conflict=1").fetchone()[0],
          "normalized_multi_structure_groups":db.execute("SELECT COUNT(*) FROM(SELECT normalized,secondary,bytes FROM documents GROUP BY normalized,secondary,bytes HAVING COUNT(*)>1)").fetchone()[0],
          "wall_seconds":time.perf_counter()-start,"human_adjudications":0,"independent_work_authority":"HOLD"}
    db.execute("INSERT INTO receipts VALUES('extraction_complete',?)",(json.dumps(info),));db.commit();source.close();feat.close()
    return db,info

def summarize(values,seed=6101):
    # Each input is (lineage, eligible targets, one document mean).
    if not values:return {"eligible_documents":0,"difference_pp":None,"interval_95_pp":None}
    groups=collections.defaultdict(lambda:[0.,0.,0])
    for group,n,value in values:groups[group][0]+=value;groups[group][1]+=1;groups[group][2]+=n
    a=np.array(list(groups.values()))
    n=len(a);rng=np.random.default_rng(seed);draws=[]
    for unused in range(1000):
        ix=rng.integers(0,n,n);b=a[ix];draws.append(100*b[:,0].sum()/b[:,1].sum())
    return {"eligible_documents":len(values),"lineage_components":n,"eligible_targets":int(a[:,2].sum()),
            "zero_difference_documents":sum(v==0 for g,t,v in values),
            "difference_pp":float(100*a[:,0].sum()/a[:,1].sum()),
            "interval_95_pp":np.quantile(draws,[.025,.975]).tolist(),"bootstrap_draws":1000}
def analyze(args,db,info):
    families=collections.defaultdict(set)
    for lineage,fam in db.execute("SELECT DISTINCT d.lineage,r.family FROM documents d JOIN release_membership r ON r.variant=d.variant"):
        families[lineage].add(fam)
    lanes=collections.defaultdict(lambda:collections.defaultdict(list));census=collections.Counter();ex=collections.Counter()
    for variant,lineage,year,fam,units,new,conflict,metric in db.execute("SELECT variant,lineage,year,family,units,known_new,conflict,metrics FROM documents"):
        m=json.loads(metric);census["all_documents"]+=1;census["zero_target_documents"]+=not bool(m["targets"])
        for w,v in m["excluded"].items():ex[w]+=v
        keys=["ALL_STRICT","YEAR/"+year,"LENGTH/"+length_bin(units),"PRIMARY_FAMILY/"+fam]
        if new:keys.append("KNOWN_KEY_NEW")
        if len(families[lineage])==1:keys.append("FAMILY_EXCLUSIVE/"+next(iter(families[lineage])))
        else:census["cross_family_documents"]+=1
        hold=int(hashlib.sha256(("P61/"+str(lineage)).encode()).hexdigest()[:16],16)%5==0
        keys.append("HASH_HELDOUT" if hold else "HASH_DEVELOPMENT")
        if not conflict:
            for key in keys:
                for name,value in m["metrics"].items():lanes[key][name].append((lineage,value["eligible_targets"],value["mean_difference"]))
        else:census["excluded_ID_conflict_documents"]+=1
    results={"status":"EXECUTED","stage":"G9-P61_PROPOSED","scope":"PROVISIONAL_RULE_DIAGNOSTICS_NOT_SEMANTIC_GOLD",
             "census":dict(census),"symmetric_window_exclusions":dict(ex),"lineage":info,
             "family_exclusivity":"Conservative exclusion of every component appearing in more than one release family",
             "holdout":"Hash-component split fixed before outcomes; P60 source cohort previously exposed, not confirmatory fresh works",
             "metrics":"100 * equally weighted document means; lexical Jaccard difference uses same scale but is not a probability difference",
             "groups":{key:{metric:summarize(v,int(hashlib.sha256((key+metric).encode()).hexdigest()[:16],16)) for metric,v in group.items()} for key,group in lanes.items()}}
    packet=[]
    for stratum, in db.execute("SELECT DISTINCT stratum FROM candidates ORDER BY stratum"):
        for key,payload in db.execute("SELECT key,payload FROM candidates WHERE stratum=? ORDER BY priority LIMIT 6",(stratum,)):
            packet.append((key,json.loads(payload)))
    # Stratified round robin keeps small and difficult strata rather than first-table majority.
    packet.sort(key=lambda x:(x[1]["stratum"],x[0]))
    if len(packet)>2400:
        by=collections.defaultdict(list)
        for p in packet:by[p[1]["stratum"]].append(p)
        packet=[]
        for rank in range(6):
            for s in sorted(by):
                if rank<len(by[s]) and len(packet)<2400:packet.append(by[s][rank])
    with gzip.open(args.out/"ADJUDICATION_PACKET.private.jsonl.gz","wt",encoding="utf-8") as f:
        for key,item in packet:f.write(json.dumps({"item_id":key,**item},ensure_ascii=False)+"\n")
    results["adjudication_packet"]={"items":len(packet),"rule_categories":dict(collections.Counter(p[1]["rule_category"] for p in packet)),
                                  "strata":len({p[1]["stratum"] for p in packet}),"independent_human_adjudications":0,
                                  "ground_truth":"All null; unresolved","text_storage":"Offsets into original private canonical shards; no prose duplication"}
    (args.out/"P61_DIRECTIONAL_RESULTS.json").write_text(json.dumps(results,indent=2),encoding="utf-8")
    print(json.dumps({"status":"EXECUTED","census":results["census"],"lineage":info,"packet":results["adjudication_packet"]}),flush=True)
    return results
def main():
    p=argparse.ArgumentParser();p.add_argument("--source",type=Path,required=True);p.add_argument("--features",type=Path,required=True);p.add_argument("--out",type=Path,required=True);args=p.parse_args()
    protocol=args.out/"P61_PREDECLARATION.json"
    if not protocol.exists():raise ValueError("Predeclaration required before evaluation")
    lock=args.out/"P61_CODE_LOCK.json";code=digest(__file__);inputs={"source":digest(args.source),"features":digest(args.features),"protocol":digest(protocol)}
    if lock.exists():
        old=json.loads(lock.read_text())
        if old["code_sha256"]!=code or old["inputs"]!=inputs:raise ValueError("Changed code/input requires separate execution label; preserve checkpoint")
    else:lock.write_text(json.dumps({"status":"VERIFIED","utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),"code_sha256":code,"inputs":inputs},indent=2),encoding="utf-8")
    db,info=extract(args);analyze(args,db,info);db.close()
if __name__=="__main__":main()
