#!/usr/bin/env python3
"""Compile fresh P49 owner-repair sources, disjoint from all P48 confirmatory packets."""
from __future__ import annotations
import csv, hashlib, io, json, re, urllib.request
from collections import defaultdict
from pathlib import Path

KOLLA_URL="https://zenodo.org/records/16908784/files/KoLLA_multi-refs.m2?download=1"
KOLLA_MD5="9a6f2e3fea1b39bbb7343445db1167f7"
STYLE_URL="https://raw.githubusercontent.com/cynthia/stylekqc/f12bff2c26779969e1f8e54e1b98fcb8cfeeff77/sts/test.tsv"
STYLE_SHA="60906d8b4c7624000d19a182ae4ecb8dea4c86c03c410b62e7293f97f575b657"
P48_KOLLA_INITIAL="KSGT-G9-P48-KOLLA-PACKET-v1"
P48_KOLLA_BUDGET="KSGT-G9-P48-KOLLA-BUDGET-v1"
P48_STYLE="KSGT-G9-P48-STYLEKQC-PARA-v1.1"
P49_SALT="KSGT-G9-P49-OWNER-REPAIR-v1"

URL_RE=re.compile(r"https?://[^\s]+")
EMAIL_RE=re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
NUMBER_RE=re.compile(r"(?<![A-Za-z0-9])[+-]?[0-9]+(?:[.,:/-][0-9]+)*(?![A-Za-z0-9])")
ASCII_RE=re.compile(r"\b[A-Za-z][A-Za-z0-9._+-]{1,}\b")

def protected_tokens(s):
    spans=[]; out=[]
    def take(rx,kind):
        for m in rx.finditer(s):
            if any(not (m.end()<=a or m.start()>=b) for a,b in spans): continue
            spans.append((m.start(),m.end())); out.append((kind,m.group(0)))
    take(URL_RE,"URL");take(EMAIL_RE,"EMAIL");take(NUMBER_RE,"NUMBER");take(ASCII_RE,"ASCII_TOKEN")
    return out

def apply_edits(source, edits):
    work=source.split()
    for start,end,repl in sorted(edits,key=lambda x:(x[0],x[1]),reverse=True):
        if start<0 or end<0: continue
        rt=[] if repl in {"","-NONE-"} else repl.split()
        work[start:end]=rt
    return " ".join(work)

def parse_m2(text):
    blocks=[]; cur=None; edits=defaultdict(list)
    def flush():
        nonlocal cur,edits
        if cur is None:return
        refs={aid:apply_edits(cur,es) for aid,es in edits.items()}
        blocks.append((cur,refs));cur=None;edits=defaultdict(list)
    for line in text.splitlines()+[""]:
        if line.startswith("S "):flush();cur=line[2:]
        elif line.startswith("A ") and cur is not None:
            p=line[2:].split("|||"); span=p[0].split()
            if len(p)<2 or len(span)<2:continue
            try:start,end=int(span[0]),int(span[1])
            except ValueError:continue
            repl=p[2] if len(p)>2 else "";aid=p[-1].strip()
            edits[aid].append((start,end,repl))
        elif not line.strip():flush()
    return blocks

def h(x): return hashlib.sha256(x.encode()).hexdigest()
def ref_identity(refs): return h("\0".join(sorted(refs.values())))
def kscore(source,salt,stratum): return h(source+"|"+salt+"|"+stratum)
def p49score(source,refs,stratum): return h(source+"\0"+ref_identity(refs)+"|"+P49_SALT+"|"+stratum)

# KoLLA
req=urllib.request.Request(KOLLA_URL,headers={"User-Agent":"KSGT-G9-P49-owner-packet"})
with urllib.request.urlopen(req,timeout=120) as r:data=r.read()
if hashlib.md5(data).hexdigest()!=KOLLA_MD5: raise SystemExit("KoLLA MD5 mismatch")
blocks=parse_m2(data.decode("utf-8"))
seen=set(); pools={"KOLLA_K1_HARD_CARGO":[],"KOLLA_K2_GENERIC":[]}
for source,refs in blocks:
    if not source.strip() or len(refs)!=2 or source in seen:continue
    seen.add(source); toks=protected_tokens(source)
    st="KOLLA_K1_HARD_CARGO" if toks else "KOLLA_K2_GENERIC"
    pools[st].append((source,refs,toks))

excluded=set()
for st,xs in pools.items():
    p48st="K1_HARD_CARGO" if st.endswith("HARD_CARGO") else "K2_GENERIC"
    old=sorted(xs,key=lambda x:kscore(x[0],P48_KOLLA_INITIAL,p48st))[:16]
    excluded.update(h(x[0]) for x in old)
    fresh=[x for x in xs if h(x[0]) not in excluded]
    budget=sorted(fresh,key=lambda x:kscore(x[0],P48_KOLLA_BUDGET,p48st))[:16]
    excluded.update(h(x[0]) for x in budget)

selected=[]
for st,xs in pools.items():
    fresh=[x for x in xs if h(x[0]) not in excluded]
    fresh=sorted(fresh,key=lambda x:p49score(x[0],x[1],st))
    if len(fresh)<4:raise SystemExit("insufficient "+st)
    for x in fresh[:4]: selected.append((st,*x))

# StyleKQC
req=urllib.request.Request(STYLE_URL,headers={"User-Agent":"KSGT-G9-P49-owner-packet"})
with urllib.request.urlopen(req,timeout=120) as r:sdata=r.read()
if hashlib.sha256(sdata).hexdigest()!=STYLE_SHA:raise SystemExit("StyleKQC SHA mismatch")
reader=csv.DictReader(io.StringIO(sdata.decode("utf-8")),delimiter="\t",quoting=csv.QUOTE_NONE)
pairs=[]; seenpair=set()
for row in reader:
    if str(row.get("similarity","")).strip()!="1":continue
    a=row.get("sentence1","");b=row.get("sentence2","")
    if not a.strip() or not b.strip() or a==b or (a,b) in seenpair:continue
    seenpair.add((a,b));pairs.append((a,b))
old_style=sorted(pairs,key=lambda x:h(x[0]+"\0"+x[1]+"|"+P48_STYLE))[:32]
old_style_hashes={h(a) for a,b in old_style}
fresh_style=[x for x in pairs if h(x[0]) not in old_style_hashes]
fresh_style=sorted(fresh_style,key=lambda x:h(x[0]+"\0"+h(x[1])+"|"+P49_SALT+"|STYLEKQC_GENERIC"))
if len(fresh_style)<4:raise SystemExit("insufficient StyleKQC")
for a,b in fresh_style[:4]:
    selected.append(("STYLEKQC_GENERIC",a,{"HIDDEN":b},[]))

# Stable lane-local IDs, no output generation yet.
selected=sorted(selected,key=lambda x:(x[0],p49score(x[1],x[2],x[0])))
sp=Path("p49_owner_source_packet.jsonl"); gp=Path("p49_owner_hidden_refs.jsonl")
with sp.open("w",encoding="utf-8") as fs, gp.open("w",encoding="utf-8") as fg:
    counts=defaultdict(int)
    for st,source,refs,toks in selected:
        counts[st]+=1;iid=f"P49-{st}-{counts[st]:02d}"
        fs.write(json.dumps({"item_id":iid,"lane":st,"source":source,"source_sha256":h(source),"protected_tokens":toks},ensure_ascii=False)+"\n")
        fg.write(json.dumps({"item_id":iid,"references":list(refs.values()),"reference_sha256":[h(x) for x in refs.values()]},ensure_ascii=False)+"\n")

sel_hashes=[h(x[1]) for x in selected]
receipt={
 "schema":"ksgt.g9.p49.owner-source-packet.v1","status":"PASS",
 "kolla_md5":KOLLA_MD5,"stylekqc_sha256":STYLE_SHA,
 "selected_counts":dict(counts),"selected_total":len(selected),
 "p48_excluded_source_hashes":len(excluded)+len(old_style_hashes),
 "selected_overlap_with_p48":sum(x in excluded or x in old_style_hashes for x in sel_hashes),
 "source_packet_sha256":hashlib.sha256(sp.read_bytes()).hexdigest(),
 "hidden_refs_sha256":hashlib.sha256(gp.read_bytes()).hexdigest(),
 "selection_outcome_blind":True,"raw_text_in_receipt":False
}
Path("g9_p49_owner_source_receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(receipt,ensure_ascii=False))
if receipt["selected_overlap_with_p48"]!=0:raise SystemExit("P48 overlap")
