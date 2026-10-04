#!/usr/bin/env python3
"""KSGT G9-P45/P46 replay for AI-Hub 017 source-data ZIPs.

Input is a directory containing the eight source ZIPs extracted from the user's
017.7z. QA-label ZIPs are intentionally excluded. The script:
- verifies exact source-ZIP SHA-256 identities;
- decodes UTF-8 strictly and parses source JSON with JSONDecoder(strict=False)
  only to tolerate source-embedded control characters;
- quarantines conflicting repeated doc_id values;
- collapses exact cross-ID duplicates deterministically;
- replays frozen EDF-v0.1 metrics exactly;
- computes the separate P46 exclusive-event robustness lane.

No raw article text is emitted.
"""
from __future__ import annotations
import argparse, collections, hashlib, io, json, math, re, statistics, zipfile
from pathlib import Path
from typing import Any, Iterable

EXPECTED={
"TS_span_extraction.zip":"9bc49f45a671cdca1d160919de1cd291ee94f2ceee06b800e32c1ab04fa43785",
"TS_span_inference.zip":"eee7f1f9c82cecde368cc929ca9a93ed042207e732bb9f09a1c3314e94347392",
"TS_text_entailment.zip":"20f97d562f46122360dd9b1203429ff7777aa3f90fa889ae33bbd18613cd9e3e",
"TS_unanswerable.zip":"3c85d51a4d47a0684da2b1cbe762ddac7843895c8574ca8b1b12caaddcabc78c",
"VS_span_extraction.zip":"bbf1a30620e32e55aebfb2e4975f14c880ba712bf888bed94bbe47163fcf2896",
"VS_span_inference.zip":"c37b925db1392d0eb89950b212674564a61697ed0723f199d19e5194695cb6f4",
"VS_text_entailment.zip":"bcbc391106c96b7a98cb64ffbe145aa70933d8cf48b6d5580cfbf52c8665bc58",
"VS_unanswerable.zip":"6e41603463432f999a3972e00462983cf0dfaee476adfe327e3a2b98476fd39c",
}
EDF={
"CONTRAST":["그러나","그런데","하지만","그렇지만","반면","오히려","도리어","그럼에도","비록"],
"CAUSE_RESULT":["그래서","그러므로","따라서","때문에","그러자","그리하여","결국","그러니","그러면","이에"],
"TEMPORAL":["그때","이때","먼저","뒤에","후에","마침내","이윽고","곧","동안","한동안"],
"EXPANSION":["그리고","또한","또","게다가","더구나","즉","이를테면","예컨대","다시 말해"],
}
CLASSES=tuple(EDF)
MARKERS=[m for c in CLASSES for m in EDF[c]]
M2C={m:c for c,ms in EDF.items() for m in ms}
ORDER={m:i for i,m in enumerate(MARKERS)}
EXCLUSIVE_RE=re.compile("|".join(re.escape(m) for m in sorted(MARKERS,key=lambda m:(-len(m),ORDER[m]))))
IDX={c:[i for i,m in enumerate(MARKERS) if M2C[m]==c] for c in CLASSES}
SUPPORT_BINS=((1,9,"1-9"),(10,49,"10-49"),(50,199,"50-199"),(200,math.inf,"200+"))

def sha256(path:Path)->str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for b in iter(lambda:f.read(8<<20),b""): h.update(b)
    return h.hexdigest()

def iter_data(f:io.TextIOBase,chunk_size:int=1<<20)->Iterable[dict[str,Any]]:
    dec=json.JSONDecoder(strict=False); buf=""; pos=0; found=False; eof=False
    while True:
        if not eof and len(buf)-pos<chunk_size//2:
            more=f.read(chunk_size)
            if more=="": eof=True
            if pos: buf,pos=buf[pos:]+more,0
            else: buf+=more
        if not found:
            i=buf.find('"data"')
            if i<0:
                if eof:return
                if len(buf)>100:buf=buf[-100:]
                continue
            i=buf.find("[",i)
            if i<0:
                if eof:return
                continue
            pos=i+1; found=True
        while pos<len(buf) and (buf[pos].isspace() or buf[pos]==","):pos+=1
        if pos<len(buf) and buf[pos]=="]":return
        try:
            obj,end=dec.raw_decode(buf,pos); pos=end; yield obj
        except json.JSONDecodeError:
            if eof:raise
            more=f.read(chunk_size)
            if more=="":eof=True
            buf,pos=buf[pos:]+more,0

def jsd(a:list[int],b:list[int])->float:
    def norm(v):
        s=sum(v); return [x/s for x in v] if s else [0.0 for _ in v]
    p,q=norm(a),norm(b)
    if not any(p) and not any(q):return 0.0
    eps=1e-12
    p=norm([max(x,eps) for x in p]); q=norm([max(x,eps) for x in q])
    m=[(x+y)/2 for x,y in zip(p,q)]
    return .5*sum(x*math.log2(x/z) for x,z in zip(p,m) if x)+.5*sum(x*math.log2(x/z) for x,z in zip(q,m) if x)

def features(text:str)->tuple[tuple[int,...],tuple[int,...]]:
    legacy=tuple(text.count(m) for m in MARKERS)
    c=collections.Counter(x.group(0) for x in EXCLUSIVE_RE.finditer(text))
    exclusive=tuple(c.get(m,0) for m in MARKERS)
    return legacy,exclusive

def class_vec(markers:list[int]|tuple[int,...])->list[int]:
    return [sum(markers[i] for i in IDX[c]) for c in CLASSES]

def cell_metric(a:dict,b:dict)->tuple[float,float]:
    coarse=jsd(class_vec(a["markers"]),class_vec(b["markers"]))
    within=statistics.mean(jsd([a["markers"][i] for i in IDX[c]],[b["markers"][i] for i in IDX[c]]) for c in CLASSES)
    return coarse,within

def wilson_lower(k:int,n:int,z:float=1.959963984540054)->float|None:
    if not n:return None
    p=k/n; den=1+z*z/n
    return (p+z*z/(2*n)-z*math.sqrt(p*(1-p)/n+z*z/(4*n*n)))/den

def summarize(rows:list[dict])->dict:
    if not rows:return {"n":0}
    k=sum(r["diff"]>0 for r in rows)
    return {"n":len(rows),"within_gt_coarse":k,"ties":sum(r["diff"]==0 for r in rows),
            "wilson_lower_95":wilson_lower(k,len(rows)),
            "median_coarse_jsd":statistics.median(r["coarse"] for r in rows),
            "median_within_jsd":statistics.median(r["within"] for r in rows),
            "median_difference":statistics.median(r["diff"] for r in rows)}

def run(source_dir:Path)->dict:
    observed={p.name:p for p in source_dir.glob("*.zip")}
    if set(observed)!=set(EXPECTED):
        raise ValueError(f"source ZIP set mismatch: missing={sorted(set(EXPECTED)-set(observed))} extra={sorted(set(observed)-set(EXPECTED))}")
    for name,h in EXPECTED.items():
        if sha256(observed[name])!=h:raise ValueError(f"SHA-256 mismatch: {name}")

    docs={}; conflicts=set(); occurrences=0; source_ufffd=set()
    for name in sorted(EXPECTED):
        zp=observed[name]
        with zipfile.ZipFile(zp) as z:
            members=[x for x in z.namelist() if x.lower().endswith(".json")]
            if len(members)!=1:raise ValueError(f"{name}: expected exactly one JSON")
            with z.open(members[0]) as raw:
                f=io.TextIOWrapper(raw,encoding="utf-8",errors="strict")
                for d in iter_data(f):
                    occurrences+=1
                    did=str(d.get("doc_id") or "")
                    src=str(d.get("doc_source") or "")
                    published=str(d.get("doc_published") or "")
                    dc=d.get("doc_class") if isinstance(d.get("doc_class"),dict) else {}
                    category=str(dc.get("code") or dc.get("class") or "")
                    title=str(d.get("doc_title") or "")
                    paragraphs=d.get("paragraphs") if isinstance(d.get("paragraphs"),list) else []
                    text="\n".join(str(p.get("context") or "") for p in paragraphs if isinstance(p,dict))
                    if "\ufffd" in text:source_ufffd.add(did)
                    if not did or not src or not category or len(published)<4:raise ValueError("required source metadata missing")
                    text_hash=hashlib.sha256(text.encode("utf-8")).hexdigest()
                    fp=(src,published,category,title,text_hash)
                    if did in docs:
                        if docs[did]["fp"]!=fp:conflicts.add(did)
                        continue
                    legacy,exclusive=features(text)
                    docs[did]={"fp":fp,"src":src,"published":published,"year":int(published[:4]),
                               "category":category,"text_hash":text_hash,"legacy":legacy,"exclusive":exclusive}

    eligible=[did for did in docs if did not in conflicts]
    exact=collections.defaultdict(list)
    for did in eligible:
        d=docs[did]; exact[(d["src"],d["published"],d["category"],d["text_hash"])].append(did)
    keep={min(ids) for ids in exact.values()}
    final={did:docs[did] for did in keep}

    def aggregate(rep):
        out={}
        for d in final.values():
            key=(d["year"],d["src"],d["category"])
            if key not in out:out[key]={"documents":0,"markers":[0]*len(MARKERS)}
            out[key]["documents"]+=1
            out[key]["markers"]=[a+b for a,b in zip(out[key]["markers"],d[rep])]
        return out
    def compare(rep):
        agg=aggregate(rep)
        common=sorted({(s,c) for y,s,c in agg if y==2020}&{(s,c) for y,s,c in agg if y==2021})
        rows=[]
        for src,cat in common:
            a,b=agg[(2020,src,cat)],agg[(2021,src,cat)]
            coarse,within=cell_metric(a,b)
            rows.append({"publisher":src,"category":cat,"n_2020":a["documents"],"n_2021":b["documents"],
                         "coarse_jsd":coarse,"mean_within_class_marker_jsd":within,"diff":within-coarse})
        return rows
    legacy=compare("legacy"); exclusive=compare("exclusive")
    primary=summarize(legacy)
    support={}
    for lo,hi,label in SUPPORT_BINS:
        support[label]=summarize([r for r in legacy if lo<=min(r["n_2020"],r["n_2021"])<=hi])
    return {
      "schema":"ksgt.g9.p45.aihub017-runtime.v1",
      "custody":{"source_record_occurrences":occurrences,"unique_doc_ids":len(docs),
                 "conflicting_doc_ids_quarantined":len(conflicts),
                 "cross_id_exact_duplicate_groups":sum(len(v)>1 for v in exact.values()),
                 "cross_id_extra_removed":sum(len(v)-1 for v in exact.values()),
                 "final_articles":len(final),"source_provided_ufffd_doc_ids":len(source_ufffd)},
      "legacy_primary":primary,"support_bins":support,
      "exclusive_primary":summarize(exclusive),"legacy_cells":legacy,
      "verdict":"PASS" if primary["wilson_lower_95"]>0.5 and primary["median_difference"]>0 else "FAIL"
    }

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("source_dir",type=Path); ap.add_argument("--output",type=Path,required=True)
    args=ap.parse_args(); result=run(args.source_dir)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"verdict":result["verdict"],"output":str(args.output)},ensure_ascii=False))
if __name__=="__main__":main()
