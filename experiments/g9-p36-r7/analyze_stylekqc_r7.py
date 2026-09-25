import hashlib, json, os, re, statistics, sys, urllib.request
from collections import defaultdict, Counter
import pandas as pd

OUT=sys.argv[1] if len(sys.argv)>1 else "experiments/g9-p36-r7/final"
os.makedirs(OUT,exist_ok=True)
DATASET="wicho/stylekqc-style"

def get_json(url):
    req=urllib.request.Request(url,headers={"User-Agent":"KSGT-R7/1.0"})
    with urllib.request.urlopen(req,timeout=60) as r:return json.load(r)

meta=get_json("https://huggingface.co/api/datasets/"+DATASET)
repo_sha=meta.get("sha")
pq=get_json("https://datasets-server.huggingface.co/parquet?dataset="+DATASET)
files=[x for x in pq.get("parquet_files",[]) if x.get("config") in (None,"default")]
if not files: raise RuntimeError("no parquet files")
frames=[]; file_receipts=[]
for i,x in enumerate(files):
    url=x["url"]; p=f"/tmp/stylekqc-{i}.parquet"
    req=urllib.request.Request(url,headers={"User-Agent":"KSGT-R7/1.0"})
    with urllib.request.urlopen(req,timeout=120) as r:
        data=r.read()
    open(p,"wb").write(data)
    file_receipts.append({"split":x.get("split"),"filename":x.get("filename"),"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()})
    df=pd.read_parquet(p)
    df["_split"]=x.get("split")
    df["_local_index"]=range(len(df))
    frames.append(df)
df=pd.concat(frames,ignore_index=True)
required={"formal","informal","act"}
if not required.issubset(df.columns): raise RuntimeError(f"missing columns {required-set(df.columns)}")

PARTICLES=sorted([
"으로부터","에게서","한테서","에서부터","께서는","에서는","으로","에게","한테","부터","까지","처럼","보다","밖에","마저","조차","이나","이랑","하고","에서","으로","랑","와","과","은","는","이","가","을","를","에","도","만","의","로","께"
],key=len,reverse=True)
DISCOURSE={"저기","야","있잖아","말이야","혹시","좀","그","저","이","아니면","아님"}
TOK=re.compile(r"[가-힣A-Za-z0-9]+")
def toks(s):return TOK.findall(str(s))
def split_particle(tok):
    for p in PARTICLES:
        if tok.endswith(p) and len(tok)>len(p):
            stem=tok[:-len(p)]
            if stem:return stem,p
    return tok,""
def analyze_surface(s):
    raw=toks(s); stems=[]; parts=[]; pairs=[]
    for t in raw:
        stem,p=split_particle(t)
        pairs.append((stem,p,t))
        if p:parts.append((stem,p))
        if stem not in DISCOURSE and len(stem)>=2:stems.append(stem)
    return {"raw":raw,"pairs":pairs,"stems":stems,"particles":parts}
def unique_order(stems):
    seen=set();out=[]
    for x in stems:
        if x not in seen:seen.add(x);out.append(x)
    return out
def inversion_count(a,b):
    common=[x for x in unique_order(a) if x in set(b)]
    common=[x for x in common if b.count(x)==1 and a.count(x)==1]
    if len(common)<3:return 0,len(common)
    pos={x:b.index(x) for x in common};inv=0
    for i in range(len(common)):
        for j in range(i+1,len(common)):
            if pos[common[i]]>pos[common[j]]:inv+=1
    return inv,len(common)
def bigrams(xs):return set(zip(xs,xs[1:]))

particle_change=0; order_proxy=0; deletion_proxy=0
particle_drop=0; particle_swap=0
transport_rows=[]
surface_cache=[]
for idx,row in df.iterrows():
    A=analyze_surface(row["formal"]);B=analyze_surface(row["informal"]);surface_cache.append((A,B))
    amap=defaultdict(set);bmap=defaultdict(set)
    for stem,p,_ in A["pairs"]:amap[stem].add(p)
    for stem,p,_ in B["pairs"]:bmap[stem].add(p)
    changed=[]
    for stem in set(amap)&set(bmap):
        if amap[stem]!=bmap[stem] and (any(amap[stem]) or any(bmap[stem])):
            changed.append(stem)
            if "" in amap[stem]^bmap[stem]:particle_drop+=1
            else:particle_swap+=1
    if changed:particle_change+=1
    inv,ncommon=inversion_count(A["stems"],B["stems"])
    if inv>0:order_proxy+=1
    sa,sb=set(A["stems"]),set(B["stems"]); inter=len(sa&sb);union=len(sa|sb)
    jac=inter/union if union else 1.0
    dele=(bool(sa-sb) or bool(sb-sa)) and jac>=0.4
    if dele:deletion_proxy+=1
    if (changed or inv>0 or dele) and len(transport_rows)<40:
        transport_rows.append({"row":int(idx),"split":row["_split"],"act":int(row["act"]),"formal":row["formal"],"informal":row["informal"],"particle_changed_stems":changed,"order_inversions":inv,"shared_unique_order_stems":ncommon,"surface_deletion_proxy":dele,"stem_jaccard":jac})

# sparse retrieval: informal postings, formal queries
stem_post=defaultdict(set);bg_post=defaultdict(set)
for idx,row in df.iterrows():
    B=surface_cache[idx][1];act=str(row["act"])
    us=set(B["stems"])
    for s in us:stem_post[(act,s)].add(idx)
    for a,b in bigrams(B["stems"]):bg_post[(act,a,b)].add(idx)

retrieved=0;top1=0;candidate_sizes=[];query_postings=0
for idx,row in df.iterrows():
    A=surface_cache[idx][0];act=str(row["act"]);scores=defaultdict(lambda:[0,0])
    for s in set(A["stems"]):
        ids=stem_post.get((act,s),());query_postings+=1
        for j in ids:scores[j][0]+=1
    for a,b in bigrams(A["stems"]):
        ids=bg_post.get((act,a,b),());query_postings+=1
        for j in ids:scores[j][1]+=1
    cand=[]
    for j,(ss,bb) in scores.items():
        if ss>=2 or bb>=1:cand.append((j,ss,bb,2*bb+ss))
    candidate_sizes.append(len(cand))
    if any(j==idx for j,_,_,_ in cand):retrieved+=1
    if cand:
        cand.sort(key=lambda z:(-z[3],-z[2],-z[1],z[0]))
        if cand[0][0]==idx:top1+=1

# controls for detector
control_pairs=[
("particle","내일 노트북을 반품해 주세요","내일 노트북 반품해 줘","particle"),
("order","내일 삼성 노트북을 반품해 줘","삼성 노트북을 내일 반품해 줘","order"),
("deletion","저기 내일 노트북 반품해 줘","내일 노트북 반품해 줘","deletion")
]
ctrl={}
for cid,a,b,kind in control_pairs:
    A=analyze_surface(a);B=analyze_surface(b)
    amap=defaultdict(set);bmap=defaultdict(set)
    for s,p,_ in A["pairs"]:amap[s].add(p)
    for s,p,_ in B["pairs"]:bmap[s].add(p)
    pc=any(amap[s]!=bmap[s] and (any(amap[s]) or any(bmap[s])) for s in set(amap)&set(bmap))
    inv,n=inversion_count(A["stems"],B["stems"])
    sa,sb=set(A["stems"]),set(B["stems"]);j=len(sa&sb)/len(sa|sb) if sa|sb else 1
    de=(bool(sa-sb) or bool(sb-sa)) and j>=0.4
    ctrl[cid]={"particle":pc,"order":inv>0,"deletion_proxy":de,"pass":{"particle":pc,"order":inv>0,"deletion":de}[kind]}

split_counts={str(k):int(v) for k,v in Counter(df["_split"]).items()}
n=len(df)
summary={
 "phase":"G9-P36-R7",
 "corpus":"StyleKQC",
 "dataset":DATASET,
 "repo_sha":repo_sha,
 "file_receipts":file_receipts,
 "rows":n,
 "split_counts":split_counts,
 "authority":"HUMAN_FORMAL_INFORMAL_REWRITE_PAIRS_CORE_CONTENT_AND_INTENT_BY_DATASET_CONSTRUCTION",
 "surface_transport":{
   "particle_realization_change_pairs":particle_change,
   "particle_realization_change_rate":particle_change/n if n else 0,
   "order_inversion_proxy_pairs":order_proxy,
   "order_inversion_proxy_rate":order_proxy/n if n else 0,
   "surface_deletion_compatible_proxy_pairs":deletion_proxy,
   "surface_deletion_compatible_proxy_rate":deletion_proxy/n if n else 0,
   "particle_drop_or_add_stem_events":particle_drop,
   "particle_swap_stem_events":particle_swap,
   "true_ellipsis_authority":"HOLD_NO_ZERO_ARGUMENT_ANNOTATION"
 },
 "sparse_retrieval":{
   "algorithm":"ACT_PLUS_PARTICLE_STRIPPED_STEM_AND_BIGRAM_INVERTED_POSTINGS",
   "global_all_pairs":False,
   "query_posting_lookups":query_postings,
   "paired_target_retrieved":retrieved,
   "paired_target_recall":retrieved/n if n else 0,
   "top1_exact_pair":top1,
   "top1_rate":top1/n if n else 0,
   "candidate_size_mean":sum(candidate_sizes)/len(candidate_sizes) if candidate_sizes else 0,
   "candidate_size_median":statistics.median(candidate_sizes) if candidate_sizes else 0,
   "candidate_size_p95":sorted(candidate_sizes)[min(len(candidate_sizes)-1,int(.95*len(candidate_sizes)))] if candidate_sizes else 0
 },
 "controls":ctrl,
 "validation":{
   "rows_positive":n>0,
   "paired_columns":required.issubset(df.columns),
   "particle_control":ctrl["particle"]["pass"],
   "order_control":ctrl["order"]["pass"],
   "deletion_proxy_control":ctrl["deletion"]["pass"],
   "sparse_not_all_pairs":True
 }
}
summary["validation"]["pass"]=all(summary["validation"].values())
json.dump(summary,open(os.path.join(OUT,"stylekqc_summary.json"),"w"),ensure_ascii=False,indent=2)
with open(os.path.join(OUT,"stylekqc_transport_witnesses.jsonl"),"w") as w:
    for x in transport_rows:w.write(json.dumps(x,ensure_ascii=False)+"\n")
print(json.dumps(summary,ensure_ascii=False,indent=2))
if not summary["validation"]["pass"]:sys.exit(2)
