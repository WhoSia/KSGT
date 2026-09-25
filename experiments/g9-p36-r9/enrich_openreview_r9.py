import json,sys,urllib.request,urllib.parse,time
inp,out=sys.argv[1:3]
papers={}
for line in open(inp,encoding="utf-8"):
    r=json.loads(line); papers.setdefault(r["paper_id"],r.get("paper_title",""))
def val(x):
    if isinstance(x,dict) and "value" in x:return x["value"]
    return x
url="https://api2.openreview.net/notes?invitation="+urllib.parse.quote("ICLR.cc/2024/Conference/-/Submission",safe="")+"&limit=1000"
notes=[]
offset=0
while True:
    u=url+"&offset="+str(offset)
    req=urllib.request.Request(u,headers={"User-Agent":"KSGT-R9/1.0"})
    with urllib.request.urlopen(req,timeout=120) as r:data=json.load(r)
    batch=data.get("notes",[])
    if not batch:break
    notes.extend(batch);offset+=len(batch)
    if len(batch)<1000:break
index={}
for n in notes:
    pid=str(n.get("forum") or n.get("id") or "")
    c=n.get("content",{})
    authors=val(c.get("authors",[])) or []
    authorids=val(c.get("authorids",[])) or []
    title=val(c.get("title","")) or ""
    index[pid]={"authors":[str(x) for x in authors],"authorids":[str(x) for x in authorids],"title":str(title)}
rows={}
for pid,title in papers.items():
    m=index.get(pid)
    rows[pid]={"paper_id":pid,"rmr_title":title,"openreview_found":bool(m),"authors":m["authors"] if m else [],"authorids":m["authorids"] if m else [],"openreview_title":m["title"] if m else ""}
json.dump({"invitation":"ICLR.cc/2024/Conference/-/Submission","notes_fetched":len(notes),"selected_papers":len(papers),"resolved":sum(1 for x in rows.values() if x["openreview_found"]),"papers":rows},open(out,"w"),ensure_ascii=False,indent=2)
print(json.dumps({"notes_fetched":len(notes),"selected_papers":len(papers),"resolved":sum(1 for x in rows.values() if x["openreview_found"])},indent=2))
