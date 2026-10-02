#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,hashlib,io,json,os,zipfile
from collections import Counter
from pathlib import Path

STRUCTURED={".json",".jsonl",".csv",".tsv"}

def sha256(path:Path)->str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda:f.read(1024*1024),b""):h.update(chunk)
    return h.hexdigest()

def schema_for(z:zipfile.ZipFile,name:str):
    ext=Path(name).suffix.lower()
    raw=z.read(name)
    if ext==".json":
        obj=json.loads(raw.decode("utf-8-sig","replace"))
        out={"type":type(obj).__name__}
        if isinstance(obj,dict):out["keys"]=list(obj.keys())[:50]
        elif isinstance(obj,list) and obj and isinstance(obj[0],dict):
            out["row_keys"]=list(obj[0].keys())[:50]
        return out
    if ext==".jsonl":
        for line in raw.decode("utf-8-sig","replace").splitlines():
            if line.strip():
                obj=json.loads(line); return {"type":"jsonl","row_keys":list(obj)[:50] if isinstance(obj,dict) else []}
        return {"type":"jsonl","row_keys":[]}
    if ext in (".csv",".tsv"):
        delim="\t" if ext==".tsv" else ","
        header=next(csv.reader(io.StringIO(raw.decode("utf-8-sig","replace")),delimiter=delim),[])
        return {"type":ext[1:],"header":header[:100]}
    return None

def probe(path:Path):
    with zipfile.ZipFile(path) as z:
        infos=[i for i in z.infolist() if not i.is_dir()]
        ext=Counter(Path(i.filename).suffix.lower() or "<none>" for i in infos)
        candidates=[i.filename for i in infos if Path(i.filename).suffix.lower() in STRUCTURED]
        schemas={}
        for name in candidates[:8]:
            try:schemas[name]=schema_for(z,name)
            except Exception as e:schemas[name]={"error":type(e).__name__}
        largest=sorted(infos,key=lambda i:i.file_size,reverse=True)[:10]
        return {
          "schema":"ksgt.g9.p45.archive-probe.v1",
          "archive_name":path.name,"archive_bytes":path.stat().st_size,
          "sha256":sha256(path),"member_count":len(infos),
          "extensions":dict(ext),"structured_member_count":len(candidates),
          "sample_schemas":schemas,
          "largest_members":[{"name":i.filename,"bytes":i.file_size} for i in largest],
          "raw_content_emitted":False
        }

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("archive",type=Path)
    ap.add_argument("--output",type=Path)
    args=ap.parse_args(); out=probe(args.archive)
    txt=json.dumps(out,ensure_ascii=False,sort_keys=True,indent=2)
    if args.output:args.output.write_text(txt+"\n",encoding="utf-8")
    else:print(txt)
if __name__=="__main__":main()
