import hashlib,json,os,re,sys,urllib.request
import pandas as pd
OUT=sys.argv[1] if len(sys.argv)>1 else "experiments/g9-p36-r9/final"
os.makedirs(OUT,exist_ok=True)
DATASET="shwu22/RMR-75K"; EXCLUDE={"zzqn5G9fjn","6cMmSnOpCs"}
def get_json(url):
    req=urllib.request.Request(url,headers={"User-Agent":"KSGT-R9/1.0"})
    with urllib.request.urlopen(req,timeout=90) as r:return json.load(r)
pq=get_json("https://datasets-server.huggingface.co/parquet?dataset="+DATASET)
frames=[];receipts=[]
for i,x in enumerate(pq.get("parquet_files",[])):
    data=urllib.request.urlopen(urllib.request.Request(x["url"],headers={"User-Agent":"KSGT-R9/1.0"}),timeout=180).read()
    p=f"/tmp/rmr75k-r9-{i}.parquet";open(p,"wb").write(data)
    receipts.append({"split":x.get("split"),"filename":x.get("filename"),"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()})
    frames.append(pd.read_parquet(p))
df=pd.concat(frames,ignore_index=True)
need={"paper_id","review_id","perspective","rebuttal_content","rebuttal_label"}
if not need.issubset(df.columns):raise RuntimeError(f"missing {need-set(df.columns)}")
def bucket(pid):
    return hashlib.sha256(("KSGT-G9-P36-R8-HOLDOUT|"+pid).encode()).digest()[0]
def admitted(pid):
    b=bucket(pid)
    return pid not in EXCLUDE and 32<=b<64
allp=sorted(set(map(str,df.paper_id))); selected={p for p in allp if admitted(p)}
sub=df[df.paper_id.astype(str).isin(selected)].copy()
norm_re=re.compile(r"\s+")
def norm(s):
    s=str(s).lower();s=re.sub(r"[\W_]+"," ",s,flags=re.UNICODE);return norm_re.sub(" ",s).strip()
seen=set();rows=[]
for _,r in sub.iterrows():
    pid=str(r.paper_id);txt=str(r.rebuttal_content or "").strip()
    if not txt:continue
    k=(pid,norm(txt))
    if k in seen:continue
    seen.add(k)
    rows.append({"paper_id":pid,"paper_title":str(r.paper_title) if "paper_title" in df.columns else "","review_id":str(r.review_id),"perspective":str(r.perspective),"rebuttal_label":str(r.rebuttal_label),"rebuttal_content":txt})
with open(os.path.join(OUT,"rmr_holdout.jsonl"),"w") as w:
    for x in rows:w.write(json.dumps(x,ensure_ascii=False)+"\n")
summary={"dataset":DATASET,"columns":list(map(str,df.columns)),"file_receipts":receipts,"total_rows":int(len(df)),"total_papers":len(allp),"selected_papers":len(selected),"selected_rows_before_dedupe":int(len(sub)),"deduped_rows":len(rows),"bucket":"32<=sha256(KSGT-G9-P36-R8-HOLDOUT|paper_id).first_byte<64","r8_overlap_papers":sum(1 for p in selected if bucket(p)<32),"freshness":"DISJOINT_PROSPECTIVE_R9_BUCKET"}
json.dump(summary,open(os.path.join(OUT,"rmr_prepare_summary.json"),"w"),indent=2)
print(json.dumps(summary,indent=2))
