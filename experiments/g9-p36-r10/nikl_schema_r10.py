import argparse,collections,hashlib,json,os,tarfile,tempfile,zipfile
from pathlib import Path

KNOWN={"subject":"SUBJECT","주어":"SUBJECT","object":"OBJECT","목적어":"OBJECT",
"complement":"COMPLEMENT","보어":"COMPLEMENT","adjunct":"ADJUNCT","adverbial":"ADJUNCT",
"부사어":"ADJUNCT","필수적 부사어":"ADJUNCT"}

def sha256_file(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for b in iter(lambda:f.read(1<<20),b""):h.update(b)
    return h.hexdigest()

def sha256_tree(root):
    h=hashlib.sha256();root=Path(root)
    for p in sorted(x for x in root.rglob("*") if x.is_file()):
        rel=str(p.relative_to(root)).replace(os.sep,"/")
        h.update(rel.encode("utf-8"));h.update(b"\0");h.update(sha256_file(p).encode());h.update(b"\n")
    return h.hexdigest()

def safe_extract(src,dst):
    src=os.path.abspath(src); dst=os.path.abspath(dst)
    if zipfile.is_zipfile(src):
        with zipfile.ZipFile(src) as z:
            for m in z.infolist():
                out=os.path.abspath(os.path.join(dst,m.filename))
                if not (out==dst or out.startswith(dst+os.sep)):raise RuntimeError("ZIP_PATH_TRAVERSAL")
            z.extractall(dst)
        return "zip"
    if tarfile.is_tarfile(src):
        with tarfile.open(src) as t:
            for m in t.getmembers():
                out=os.path.abspath(os.path.join(dst,m.name))
                if not (out==dst or out.startswith(dst+os.sep)):raise RuntimeError("TAR_PATH_TRAVERSAL")
            t.extractall(dst)
        return "tar"
    raise RuntimeError("UNSUPPORTED_ARCHIVE")

def materialize(src,tmp):
    if os.path.isdir(src):return Path(src),"directory"
    p=Path(src)
    if p.suffix.lower() in {".json",".jsonl"}:
        d=Path(tmp)/"single";d.mkdir();(d/p.name).write_bytes(p.read_bytes());return d,"single"
    d=Path(tmp)/"archive";d.mkdir();kind=safe_extract(src,d);return d,kind

def expand_nested(root,max_depth=3):
    root=Path(root)
    for depth in range(max_depth):
        found=False
        for p in list(root.rglob("*")):
            if not p.is_file():continue
            try:is_arc=zipfile.is_zipfile(p) or tarfile.is_tarfile(p)
            except Exception:is_arc=False
            if not is_arc:continue
            marker=p.with_name(p.name+".extracted")
            if marker.exists():continue
            marker.mkdir()
            safe_extract(str(p),str(marker));found=True
        if not found:break

def json_files(root):
    expand_nested(root)
    return sorted([p for p in Path(root).rglob("*") if p.is_file() and p.suffix.lower() in {".json",".jsonl"}])

def _read_text(p):
    b=Path(p).read_bytes()
    for enc in ("utf-8-sig","utf-8","cp949"):
        try:return b.decode(enc)
        except UnicodeDecodeError:pass
    raise UnicodeDecodeError("unknown",b,0,1,"unsupported encoding")

def load_docs(p):
    text=_read_text(p)
    if p.suffix.lower()==".jsonl":return [json.loads(x) for x in text.splitlines() if x.strip()]
    return [json.loads(text)]

def sentences(x):
    if isinstance(x,dict):
        za=x.get("ZA")
        if isinstance(za,list):yield x
        for v in x.values():yield from sentences(v)
    elif isinstance(x,list):
        for v in x:yield from sentences(v)

def classify(za):
    if not isinstance(za,dict):return "UNRECOGNIZED"
    if isinstance(za.get("ellipsis"),list):
        es=za["ellipsis"]
        if all(isinstance(e,dict) and isinstance(e.get("restored"),dict) and isinstance(e.get("antecedent"),dict) for e in es):
            return "NIKL_ZA_ELLIPSIS_2025"
    if isinstance(za.get("restored"),list) and isinstance(za.get("antecedent"),list):
        return "NIKL_ZA_TRANSITIONAL_RESTORED"
    ants=za.get("antecedent")
    if isinstance(ants,list) and all(isinstance(a,dict) and "type" in a for a in ants):
        return "NIKL_ZA_LEGACY_2020_2024"
    return "UNRECOGNIZED"

def norm_slot(x):
    s=str(x or "").strip()
    return KNOWN.get(s.lower(),KNOWN.get(s,"OTHER:"+s if s else "UNKNOWN"))

def census(src,out_dir):
    os.makedirs(out_dir,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="ksgt-r10-") as tmp:
        root,container=materialize(src,tmp)
        files=json_files(root)
        inventory=[]
        family=collections.Counter();slots=collections.Counter(); top=collections.Counter()
        docs=0;sents=0;za_n=0;ell_n=0;bad=0;parse_fail=[]
        for p in files:
            rel=str(p.relative_to(root))
            inventory.append({"path":rel,"bytes":p.stat().st_size,"sha256":sha256_file(p)})
            try: objs=load_docs(p)
            except Exception as e:
                parse_fail.append({"path":rel,"error":type(e).__name__});continue
            for obj in objs:
                docs+=1
                if isinstance(obj,dict):
                    for k in obj.keys():top[k]+=1
                for s in sentences(obj):
                    sents+=1
                    for z in s.get("ZA",[]):
                        za_n+=1;f=classify(z);family[f]+=1
                        if f=="UNRECOGNIZED":bad+=1;continue
                        if f=="NIKL_ZA_LEGACY_2020_2024":
                            for a in z.get("antecedent",[]):slots[norm_slot(a.get("type"))]+=1;ell_n+=1
                        elif f=="NIKL_ZA_ELLIPSIS_2025":
                            for e in z.get("ellipsis",[]):slots[norm_slot(e.get("restored",{}).get("type"))]+=1;ell_n+=1
                        else:
                            for r in z.get("restored",[]):slots[norm_slot(r.get("type"))]+=1;ell_n+=1
        recognized=za_n-bad
        coverage=(recognized/za_n) if za_n else 0
        state="READY" if za_n>0 and coverage==1 and not parse_fail else ("HOLD_SCHEMA_UNRECOGNIZED" if za_n else "HOLD_NO_ZA")
        receipt={"contract":"KSGT-R10-NIKL-GOLD-v1","source":os.path.basename(src),"source_sha256":sha256_file(src) if os.path.isfile(src) else sha256_tree(src),
        "container":container,"json_files":len(files),"inventory":inventory,"parsed_roots":docs,"sentence_objects":sents,
        "za_predicates":za_n,"ellipsis_slots":ell_n,"schema_family_counts":dict(family),"syntactic_slot_counts":dict(slots),
        "recognized_coverage":coverage,"parse_failures":parse_fail,"top_level_keys":dict(top),"state":state}
        json.dump(receipt,open(os.path.join(out_dir,"schema_census.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
        adapter={"state":state,"accepted_families":[k for k,v in family.items() if v and k!="UNRECOGNIZED"],
        "semantic_role_from_syntactic_slot":False,"row_scoring_authorized":state=="READY"}
        json.dump(adapter,open(os.path.join(out_dir,"adapter_contract.json"),"w",encoding="utf-8"),ensure_ascii=False,indent=2)
        return receipt

if __name__=="__main__":
    ap=argparse.ArgumentParser();ap.add_argument("source");ap.add_argument("out_dir")
    a=ap.parse_args();print(json.dumps(census(a.source,a.out_dir),ensure_ascii=False,indent=2))
