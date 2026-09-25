import json,sys,urllib.request,urllib.parse
inp,out=sys.argv[1:3]
papers={}
for line in open(inp,encoding="utf-8"):
    r=json.loads(line);papers.setdefault(r["paper_id"],r.get("paper_title",""))
def val(x):
    if isinstance(x,dict) and "value" in x:return x["value"]
    return x
rows={pid:{"paper_id":pid,"rmr_title":title,"openreview_found":False,"authors":[],"authorids":[],"openreview_title":""} for pid,title in papers.items()}
status={"source":"OPENREVIEW_PUBLIC_NOTE_BY_FORUM_ID","selected_papers":len(papers),"resolved":0,"authority":"AUTHOR_METADATA_SOURCE_HOLD"}
try:
    base="https://api2.openreview.net/notes?invitation="+urllib.parse.quote("ICLR.cc/2024/Conference/-/Submission",safe="")+"&limit=1000"
    notes=[];offset=0
    while True:
        req=urllib.request.Request(base+"&offset="+str(offset),headers={"User-Agent":"KSGT-R9/1.0","Accept":"application/json"})
        with urllib.request.urlopen(req,timeout=120) as r:data=json.load(r)
        batch=data.get("notes",[])
        if not batch:break
        notes.extend(batch);offset+=len(batch)
        if len(batch)<1000:break
    idx={}
    for n in notes:
        pid=str(n.get("forum") or n.get("id") or "");c=n.get("content",{})
        idx[pid]={"authors":val(c.get("authors",[])) or [],"authorids":val(c.get("authorids",[])) or [],"title":val(c.get("title","")) or ""}
    for pid in rows:
        m=idx.get(pid)
        if m:
            rows[pid].update({"openreview_found":True,"authors":[str(x) for x in m["authors"]],"authorids":[str(x) for x in m["authorids"]],"openreview_title":str(m["title"])})
    status.update({"notes_fetched":len(notes),"resolved":sum(1 for x in rows.values() if x["openreview_found"]),"authority":"OPENREVIEW_METADATA_RECOVERED"})
except Exception as e:
    status["error"]=type(e).__name__+":"+str(e)[:180]
json.dump({**status,"papers":rows},open(out,"w"),ensure_ascii=False,indent=2)
print(json.dumps(status,ensure_ascii=False,indent=2))
