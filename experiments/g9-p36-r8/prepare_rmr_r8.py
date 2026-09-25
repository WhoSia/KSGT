import hashlib,json,os,re,sys,urllib.request
import pandas as pd

OUT=sys.argv[1] if len(sys.argv)>1 else "experiments/g9-p36-r8/final"
os.makedirs(OUT,exist_ok=True)
DATASET="shwu22/RMR-75K"
EXCLUDE={"zzqn5G9fjn","6cMmSnOpCs"}
def get_json(url):
    req=urllib.request.Request(url,headers={"User-Agent":"KSGT-R8/1.0"})
    with urllib.request.urlopen(req,timeout=90) as r:return json.load(r)
pq=get_json("https://datasets-server.huggingface.co/parquet?dataset="+DATASET)
files=pq.get("parquet_files",[])
if not files: raise RuntimeError("no parquet export")
frames=[]; receipts=[]
for i,x in enumerate(files):
    url=x["url"]; p=f"/tmp/rmr75k-{i}.parquet"
    req=urllib.request.Request(url,headers={"User-Agent":"KSGT-R8/1.0"})
    with urllib.request.urlopen(req,timeout=180) as r:data=r.read()
    open(p,"wb").write(data)
    receipts.append({"split":x.get("split"),"filename":x.get("filename"),"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()})
    frames.append(pd.read_parquet(p))
df=pd.concat(frames,ignore_index=True)
need={"paper_id","review_id","perspective","rebuttal_content","rebuttal_label"}
if not need.issubset(df.columns): raise RuntimeError(f"missing {need-set(df.columns)}")
def admitted(pid):
    if pid in EXCLUDE:return False
    b=hashlib.sha256(("KSGT-G9-P36-R8-HOLDOUT|"+pid).encode()).digest()[0]
    return b<32
all_papers=sorted(set(map(str,df.paper_id)))
selected={p for p in all_papers if admitted(p)}
sub=df[df.paper_id.astype(str).isin(selected)].copy()
norm_re=re.compile(r"\s+")
def norm(s):
    s=str(s).lower()
    s=re.sub(r"[\W_]+"," ",s,flags=re.UNICODE)
    return norm_re.sub(" ",s).strip()
seen=set();rows=[]
for _,r in sub.iterrows():
    pid=str(r.paper_id); txt=str(r.rebuttal_content or "").strip()
    if not txt:continue
    k=(pid,norm(txt))
    if k in seen:continue
    seen.add(k)
    rows.append({"paper_id":pid,"review_id":str(r.review_id),"perspective":str(r.perspective),"rebuttal_label":str(r.rebuttal_label),"rebuttal_content":txt})
with open(os.path.join(OUT,"rmr_holdout.jsonl"),"w") as w:
    for x in rows:w.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"dataset":DATASET,"file_receipts":receipts,"total_rows":int(len(df)),"total_papers":len(all_papers),"excluded_known_example_papers":sorted(EXCLUDE),"selected_papers":len(selected),"selected_rows_before_dedupe":int(len(sub)),"deduped_rows":len(rows),"holdout_rule":"sha256(KSGT-G9-P36-R8-HOLDOUT|paper_id).first_byte<32","freshness":"PROSPECTIVE_HASH_HOLDOUT_EXCLUDING_PRESEAL_PUBLIC_EXAMPLES"}
json.dump(summary,open(os.path.join(OUT,"rmr_prepare_summary.json"),"w"),indent=2)
print(json.dumps(summary,indent=2))
