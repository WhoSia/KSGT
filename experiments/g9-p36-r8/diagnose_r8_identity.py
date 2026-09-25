import json,sys,urllib.request,pandas as pd
IDS={"ISrxxvXJQO","o87xfYKQC1"}
pq=json.load(urllib.request.urlopen(urllib.request.Request("https://datasets-server.huggingface.co/parquet?dataset=shwu22/RMR-75K",headers={"User-Agent":"KSGT-R8/1.0"}),timeout=90))
rows=[]
for i,x in enumerate(pq.get("parquet_files",[])):
    data=urllib.request.urlopen(urllib.request.Request(x["url"],headers={"User-Agent":"KSGT-R8/1.0"}),timeout=180).read()
    p=f"/tmp/r8id-{i}.parquet";open(p,"wb").write(data);df=pd.read_parquet(p)
    z=df[df.paper_id.astype(str).isin(IDS)]
    for _,r in z.iterrows():
        rows.append({"paper_id":str(r.paper_id),"paper_title":str(r.paper_title),"review_id":str(r.review_id),"perspective":str(r.perspective),"rebuttal_label":str(r.rebuttal_label),"rebuttal_content":str(r.rebuttal_content)})
out={}
for pid in IDS:
    rr=[r for r in rows if r["paper_id"]==pid]
    out[pid]={"titles":sorted(set(r["paper_title"] for r in rr)),"rows":len(rr),"sample_review_ids":sorted(set(r["review_id"] for r in rr))[:5]}
print(json.dumps(out,ensure_ascii=False,indent=2))
