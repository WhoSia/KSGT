#!/usr/bin/env python3
"""Compile the prospective 24-item P50 PIA source packet, disjoint from P48 and P49."""
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
P50_SALT="KSGT-G9-P50-PIA-v1"

URL_RE=re.compile(r"https?://[^\s]+")
EMAIL_RE=re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
NUMBER_RE=re.compile(r"(?<![A-Za-z0-9])[+-]?[0-9]+(?:[.,:/-][0-9]+)*(?![A-Za-z0-9])")
ASCII_RE=re.compile(r"\b[A-Za-z][A-Za-z0-9._+-]{1,}\b")

def h(x): return hashlib.sha256(x.encode()).hexdigest()

def protected_tokens(s):
    spans=[]; out=[]
    def take(rx,kind):
        for m in rx.finditer(s):
            if any(not (m.end()<=a or m.start()>=b) for a,b in spans): continue
            spans.append((m.start(),m.end())); out.append((kind,m.group(0)))
    take(URL_RE,"URL"); take(EMAIL_RE,"EMAIL"); take(NUMBER_RE,"NUMBER"); take(ASCII_RE,"ASCII_TOKEN")
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
        blocks.append((cur,refs)); cur=None; edits=defaultdict(list)
    for line in text.splitlines()+[""]:
        if line.startswith("S "): flush(); cur=line[2:]
        elif line.startswith("A ") and cur is not None:
            p=line[2:].split("|||"); span=p[0].split()
            if len(p)<2 or len(span)<2: continue
            try: start,end=int(span[0]),int(span[1])
            except ValueError: continue
            repl=p[2] if len(p)>2 else ""; aid=p[-1].strip()
            edits[aid].append((start,end,repl))
        elif not line.strip(): flush()
    return blocks

def ref_identity(refs): return h("\0".join(sorted(refs.values())))
def score(source,refs,salt,stratum): return h(source+"\0"+ref_identity(refs)+"|"+salt+"|"+stratum)
def old_score(source,salt,stratum): return h(source+"|"+salt+"|"+stratum)

# Fetch and verify KoLLA.
req=urllib.request.Request(KOLLA_URL,headers={"User-Agent":"KSGT-G9-P50-PIA"})
with urllib.request.urlopen(req,timeout=120) as r: data=r.read()
if hashlib.md5(data).hexdigest()!=KOLLA_MD5: raise SystemExit("KoLLA MD5 mismatch")

blocks=parse_m2(data.decode("utf-8"))
seen=set(); pools={"KOLLA_K1_HARD_CARGO":[],"KOLLA_K2_GENERIC":[]}
for source,refs in blocks:
    if not source.strip() or len(refs)!=2 or source in seen: continue
    seen.add(source)
    toks=protected_tokens(source)
    st="KOLLA_K1_HARD_CARGO" if toks else "KOLLA_K2_GENERIC"
    pools[st].append((source,refs,toks))

excluded=set()
p49_selected=set()
for st,xs in pools.items():
    p48st="K1_HARD_CARGO" if st.endswith("HARD_CARGO") else "K2_GENERIC"
    old=sorted(xs,key=lambda x:old_score(x[0],P48_KOLLA_INITIAL,p48st))[:16]
    excluded.update(h(x[0]) for x in old)
    fresh=[x for x in xs if h(x[0]) not in excluded]
    budget=sorted(fresh,key=lambda x:old_score(x[0],P48_KOLLA_BUDGET,p48st))[:16]
    excluded.update(h(x[0]) for x in budget)
    p49_pool=[x for x in xs if h(x[0]) not in excluded]
    p49=sorted(p49_pool,key=lambda x:score(x[0],x[1],P49_SALT,st))[:4]
    p49_hashes={h(x[0]) for x in p49}
    p49_selected.update(p49_hashes)
    excluded.update(p49_hashes)

selected=[]
for st,xs in pools.items():
    fresh=[x for x in xs if h(x[0]) not in excluded]
    fresh=sorted(fresh,key=lambda x:score(x[0],x[1],P50_SALT,st))
    if len(fresh)<8: raise SystemExit("insufficient "+st)
    for x in fresh[:8]: selected.append((st,*x))

# Fetch and verify StyleKQC.
req=urllib.request.Request(STYLE_URL,headers={"User-Agent":"KSGT-G9-P50-PIA"})
with urllib.request.urlopen(req,timeout=120) as r: sdata=r.read()
if hashlib.sha256(sdata).hexdigest()!=STYLE_SHA: raise SystemExit("StyleKQC SHA mismatch")

reader=csv.DictReader(io.StringIO(sdata.decode("utf-8")),delimiter="\t",quoting=csv.QUOTE_NONE)
pairs=[]; seenpair=set()
for row in reader:
    if str(row.get("similarity","")).strip()!="1": continue
    a=row.get("sentence1",""); b=row.get("sentence2","")
    if not a.strip() or not b.strip() or a==b or (a,b) in seenpair: continue
    seenpair.add((a,b)); pairs.append((a,b))

p48_style=sorted(pairs,key=lambda x:h(x[0]+"\0"+x[1]+"|"+P48_STYLE))[:32]
p48_style_hashes={h(a) for a,b in p48_style}
p49_style_pool=[x for x in pairs if h(x[0]) not in p48_style_hashes]
p49_style=sorted(p49_style_pool,key=lambda x:h(x[0]+"\0"+h(x[1])+"|"+P49_SALT+"|STYLEKQC_GENERIC"))[:4]
p49_style_hashes={h(a) for a,b in p49_style}
style_excluded=p48_style_hashes|p49_style_hashes
fresh_style=[x for x in pairs if h(x[0]) not in style_excluded]
fresh_style=sorted(fresh_style,key=lambda x:h(x[0]+"\0"+h(x[1])+"|"+P50_SALT+"|STYLEKQC_GENERIC"))
if len(fresh_style)<8: raise SystemExit("insufficient StyleKQC")
for a,b in fresh_style[:8]:
    selected.append(("STYLEKQC_GENERIC",a,{"HIDDEN":b},[]))

selected=sorted(selected,key=lambda x:(x[0],score(x[1],x[2],P50_SALT,x[0])))
sp=Path("p50_pia_source_packet.jsonl")
hp=Path("p50_pia_hidden_refs.jsonl")
counts=defaultdict(int); source_hashes=[]

with sp.open("w",encoding="utf-8") as fs, hp.open("w",encoding="utf-8") as fh:
    for st,source,refs,toks in selected:
        counts[st]+=1
        iid=f"P50-{st}-{counts[st]:02d}"
        sh=h(source); source_hashes.append(sh)
        fs.write(json.dumps({
            "item_id":iid,
            "lane":st,
            "source":source,
            "source_sha256":sh,
            "protected_tokens":toks,
            "task":"minimal Korean correction" if st.startswith("KOLLA") else "meaning-preserving Korean paraphrase"
        },ensure_ascii=False)+"\n")
        fh.write(json.dumps({
            "item_id":iid,
            "references":list(refs.values()),
            "reference_sha256":[h(x) for x in refs.values()]
        },ensure_ascii=False)+"\n")

receipt={
    "schema":"ksgt.g9.p50.pia-source-packet.v1",
    "phase":"G9-P50",
    "status":"PIA_SOURCE_PACKET_COMPILED",
    "selection_salt":P50_SALT,
    "kolla_md5":KOLLA_MD5,
    "stylekqc_sha256":STYLE_SHA,
    "selected_counts":dict(counts),
    "selected_total":len(selected),
    "source_sha256":source_hashes,
    "p48_p49_overlap":0,
    "source_packet_sha256":hashlib.sha256(sp.read_bytes()).hexdigest(),
    "hidden_refs_sha256":hashlib.sha256(hp.read_bytes()).hexdigest(),
    "selection_outcome_blind":True,
    "raw_text_in_receipt":False,
    "authority":"PIA_INSTRUMENT_ENTRY_ONLY_NOT_HUMAN_BURDEN_OR_POPULATION_QUALITY"
}
Path("g9_p50_pia_source_receipt.json").write_text(
    json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"
)
print(json.dumps({k:v for k,v in receipt.items() if k!="source_sha256"},ensure_ascii=False))
