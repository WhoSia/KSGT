"""Private P62 span proposals and review-state invariants.

All proposals are machine-provisional. No rule creates human ground truth.
Offsets are Unicode code points in unchanged source units, half-open.
"""
import argparse, collections, datetime, gzip, hashlib, html, json, math, random, re, sqlite3, statistics
from pathlib import Path

TARGET = re.compile(r"(?<![가-힣])그\s*중(?:에서|에서도|에|의|은|엔|에는)?(?![가-힣])")
DEMONSTRATIVE = re.compile(r"(?<![가-힣])(?:이들|그들|이것|그것|이런|그런|이러한|그러한|이같은|그같은|나머지)(?:은|는|이|가|을|를|의|에게|도|만)?(?![가-힣])")
COUNT = re.compile(r"(?P<number>\d+|한|하나|두|둘|세|셋|네|넷|몇|여러)\s*(?P<counter>가지|마리|차례|명|개|곳|건|팀|편|번|회)(?![가-힣])")
TOPIC = re.compile(r"(?<![가-힣])(?P<head>[가-힣]{2,18})(?:은|는|이|가|을|를)(?=\s)")
ENUM = re.compile(r"[가-힣]{2,14}(?:와|과|,)[ ]+[가-힣]{2,14}")
PREDICATE = re.compile(r"[가-힣]{1,18}(?:했다|하였다|되었다|있었다|없었다|한다|된다)(?=[ .!?]|$)")
META = re.compile(r"(?:라는|이라고)\s*(?:표현|말|단어)")
NUMBERS = {"한":1,"하나":1,"두":2,"둘":2,"세":3,"셋":3,"네":4,"넷":4}
VERSION = "P62-span-v1"

def digest(path):
    h=hashlib.sha256()
    with Path(path).open("rb") as f:
        for b in iter(lambda:f.read(8*1024*1024),b""):h.update(b)
    return h.hexdigest()

def key(parts, domain="P62"):
    h=hashlib.sha256(domain.encode()+b"\0")
    for p in parts:
        b=str(p).encode("utf-8");h.update(len(b).to_bytes(8,"big"));h.update(b)
    return h.hexdigest()

def relation(unit,start,end,target):
    if unit<target["unit"]:return "PAST_INTER"
    if unit>target["unit"]:return "FUTURE_INTER_CONTROL"
    if end<=target["start"]:return "PAST_INTRA"
    if start>=target["end"]:return "FUTURE_INTRA_CONTROL"
    return "OVERLAPPING_TARGET"

def candidates(forms,target,radius=2):
    result=[]
    for unit in range(max(0,target["unit"]-radius),min(len(forms),target["unit"]+radius+1)):
        text=forms[unit]
        for kind,pattern in [("NUMERIC_GROUP_FRAGMENT",COUNT),("TOPIC_ARGUMENT_FRAGMENT",TOPIC),("ENUMERATION_FRAGMENT",ENUM),("EVENT_PREDICATE_FRAGMENT",PREDICATE)]:
            for m in pattern.finditer(text):
                rel=relation(unit,m.start(),m.end(),target)
                if rel=="OVERLAPPING_TARGET":continue
                entry={"unit":unit,"start":m.start(),"end":m.end(),"kind":kind,"relation":rel,
                       "candidate_id":key([unit,m.start(),m.end(),kind]),"machine_authority":"SURFACE_PROPOSAL_ONLY",
                       "semantic_admissibility":None,"confidence":None}
                if kind=="NUMERIC_GROUP_FRAGMENT":
                    raw=m.group("number");number=int(raw) if raw.isdigit() else NUMBERS.get(raw)
                    entry.update(counter=m.group("counter"),cardinality=number,plural_rule=number is None or number>1)
                result.append(entry)
    return result

def target_counter(forms,target):
    # This compatibility proxy can bind to an unrelated post-target quantity.
    m=COUNT.search(forms[target["unit"]][target["end"]:target["end"]+80])
    return m.group("counter") if m else None

def summary(forms,target):
    c=candidates(forms,target)
    past=[x for x in c if x["relation"].startswith("PAST")]
    future=[x for x in c if x["relation"].startswith("FUTURE")]
    counter=target_counter(forms,target)
    def numeric(xs):return any(x["kind"]=="NUMERIC_GROUP_FRAGMENT" and x["plural_rule"] for x in xs)
    def compatible(xs):return any(x["kind"]=="NUMERIC_GROUP_FRAGMENT" and x["plural_rule"] and x["counter"]==counter for x in xs)
    eligible=target["unit"]>=2 and target["unit"]+2<len(forms)
    oldp=[x for x in past if x["relation"]=="PAST_INTER"]
    oldf=[x for x in future if x["relation"]=="FUTURE_INTER_CONTROL"]
    width=min(target["start"],len(forms[target["unit"]])-target["end"],256)
    sp=[x for x in past if x["relation"]=="PAST_INTER" or x["start"]>=target["start"]-width]
    sf=[x for x in future if x["relation"]=="FUTURE_INTER_CONTROL" or x["end"]<=target["end"]+width]
    measures={}
    if eligible:
        measures={"GROUP_WITH_INTRA":int(numeric(past))-int(numeric(future)),
                  "GROUP_INTER_ONLY":int(numeric(oldp))-int(numeric(oldf)),
                  "GROUP_SYMMETRIC_INTRA":int(numeric(sp))-int(numeric(sf)),
                  "TOPIC_ARGUMENT":int(any(x["kind"]=="TOPIC_ARGUMENT_FRAGMENT" for x in past))-int(any(x["kind"]=="TOPIC_ARGUMENT_FRAGMENT" for x in future))}
        if counter:
            measures["COUNTER_COMPATIBLE_WITH_INTRA"]=int(compatible(past))-int(compatible(future))
            measures["COUNTER_COMPATIBLE_INTER_ONLY"]=int(compatible(oldp))-int(compatible(oldf))
            measures["COUNTER_COMPATIBLE_SYMMETRIC_INTRA"]=int(compatible(sp))-int(compatible(sf))
    return c,{"eligible":eligible,"measures":measures,"intra_only_numeric":numeric(past) and not numeric(oldp),
              "future_only_numeric":numeric(future) and not numeric(past),
              "multiple_past_fragments":len(past)>1,"candidate_count":len(c),"counter_proxy":counter}

def mask_order(candidates,item,reviewer_slot):
    return sorted(candidates,key=lambda c:key([item,reviewer_slot,c["candidate_id"]],"P62-order-v1"))

def observation(forms,target,original,work):
    c,s=summary(forms,target)
    used=sorted(set(x["unit"] for x in c)|{target["unit"]})
    # Include the full symmetric context even if no rule proposes a candidate.
    used=sorted(set(used)|set(range(max(0,target["unit"]-2),min(len(forms),target["unit"]+3))))
    return {"schema_version":VERSION,"item_id":original["item_id"],"source_work_key":work,
            "strict_structure":original["strict_structure"],"original_stratum":original["stratum"],
            "target":target,"context":[{"unit":i,"text":forms[i]} for i in used],
            "candidates":c,"machine_predictions":s,"original_machine_category":original["rule_category"],
            "inferred_omissions":[{"observed_span":None,"hypothesis":"Possible omitted argument requires adjudication",
                "evidence_span":{"unit":x["unit"],"start":x["start"],"end":x["end"]},
                "confidence":None,"authority":"UNRESOLVED_MACHINE_PROMPT"} for x in c if x["kind"]=="EVENT_PREDICATE_FRAGMENT"][:8],
            "human_ground_truth":None,"independent_adjudications":[],
            "packet_hash":None,"review_status":"UNREVIEWED"}

def validate_span(span,contexts):
    unit=span["unit"];text=contexts[unit]
    if not isinstance(span["start"],int) or not isinstance(span["end"],int) or not 0<=span["start"]<span["end"]<=len(text):
        raise ValueError("Invalid Unicode source span")
    return True

def validate_judgment(item,j):
    if j.get("authority")!="INDEPENDENT_HUMAN" or not j.get("adjudicator_id") or not j.get("qualification_evidence") or not j.get("independence_attestation"):
        raise ValueError("Independent human provenance is required")
    if not j.get("timestamp") or j.get("item_hash")!=item["packet_hash"]:
        raise ValueError("Timestamp and exact packet hash required")
    statuses={"REFERENTIAL","CATAPHORIC","NONREFERENTIAL","AMBIGUOUS","EXOPHORIC","UNRESOLVED","ABSTAIN"}
    if j.get("judgment") not in statuses:raise ValueError("Invalid judgment")
    contexts={x["unit"]:x["text"] for x in item["context"]}
    for s in j.get("antecedent_spans",[]):
        validate_span(s,contexts)
        rel=relation(s["unit"],s["start"],s["end"],item["target"])
        if j["judgment"]=="REFERENTIAL" and rel.startswith("FUTURE"):
            raise ValueError("Future controls require explicit cataphoric adjudication")
        if rel=="OVERLAPPING_TARGET":raise ValueError("Target is not its own antecedent")
    if j["judgment"] in {"REFERENTIAL","CATAPHORIC"} and not j.get("antecedent_spans"):
        raise ValueError("Resolved judgment requires an evidence span")
    for o in j.get("omitted_arguments",[]):
        if o.get("observed_span") is not None:raise ValueError("Omission is not an observed span")
        if not o.get("evidence_span") or "confidence" not in o:raise ValueError("Omission requires evidence and uncertainty")
        validate_span(o["evidence_span"],contexts)
    if not isinstance(j.get("confidence"),(float,int)) or not 0<=j["confidence"]<=1:raise ValueError("Confidence must be in [0,1]")
    return True

def reliability(items,judgments):
    grouped=collections.defaultdict(dict)
    for j in judgments:
        item=items[j["item_id"]];validate_judgment(item,j)
        if j["adjudicator_id"] in grouped[j["item_id"]]:raise ValueError("Duplicate adjudicator/item")
        grouped[j["item_id"]][j["adjudicator_id"]]=j["judgment"]
    pair=collections.Counter()
    for group in grouped.values():
        ids=sorted(group)
        if len(ids)==2 and all(group[i]!="ABSTAIN" for i in ids):pair[(ids[0],ids[1])]+=1
    if not pair:return {"status":"HOLD","independent_labels":len(judgments),"paired_items":0,"kappa":None}
    reviewers,n=pair.most_common(1)[0]
    cells=collections.Counter((g[reviewers[0]],g[reviewers[1]]) for g in grouped.values()
                              if set(g)==set(reviewers) and all(g[i]!="ABSTAIN" for i in reviewers))
    n=sum(cells.values());agree=sum(v for (a,b),v in cells.items() if a==b)/n
    aa=collections.Counter();bb=collections.Counter()
    for (a,b),v in cells.items():aa[a]+=v;bb[b]+=v
    chance=sum(aa[k]*bb[k] for k in set(aa)|set(bb))/n**2
    return {"status":"EXECUTED","paired_items":n,"agreement":agree,"kappa":(agree-chance)/(1-chance) if chance<1 else None,
            "scope":"Observed qualified independent pair only; no fabricated labels"}

def review_html(items,slot):
    # Prediction-blind, not fully double-blind: source positions expose chronology.
    view=[]
    for x in items:
        view.append({"item_id":x["item_id"],"item_hash":x["packet_hash"],"target":x["target"],
                     "context":x["context"],"candidates":[{k:v for k,v in c.items() if k in {"candidate_id","unit","start","end"}}
                        for c in mask_order(x["candidates"],x["item_id"],slot)]})
    encoded=json.dumps(view,ensure_ascii=False).replace("<","\\u003c").replace(">","\\u003e")
    return """<!doctype html><meta charset="utf-8"><title>Private KSGT P62 review</title>
<style>body{max-width:1000px;margin:30px auto;font-family:system-ui}pre{white-space:pre-wrap}textarea{width:100%;height:140px}button{padding:10px}mark{background:#ffe08c}</style>
<h1>Private span review</h1><p>Prediction-blind presentation. Candidate order is randomized; chronology is visible. All machine predictions and release labels are hidden. Abstain when evidence is inadequate.</p>
<label>Adjudicator ID <input id="who"></label><label> Qualification evidence <input id="qual"></label>
<label><input id="ind" type="checkbox">I attest independence from machine predictions and other judgments</label>
<button onclick="save()">Export response ledger</button><button onclick="prev()">Previous</button><button onclick="next()">Next</button>
<div id="view"></div><script>
const items=__DATA__;let pos=0;const responses={};
function el(tag,text){let x=document.createElement(tag);x.textContent=text;return x}
function show(){let x=items[pos],v=document.getElementById('view');v.replaceChildren();v.append(el('h2',(pos+1)+' / '+items.length));
for(let p of x.context){let pre=el('pre','Unit '+p.unit+String.fromCharCode(10)+p.text);v.append(pre)}
v.append(el('p','Target Unicode span: '+JSON.stringify(x.target)));
for(let c of x.candidates){let p=x.context.find(p=>p.unit===c.unit);v.append(el('p',c.candidate_id.slice(0,10)+' | unit '+c.unit+' ['+c.start+','+c.end+') '+p.text.slice(c.start,c.end)))}
v.append(el('p','Enter JSON judgment. You may add antecedent spans beyond listed candidates within the displayed context. Statuses: REFERENTIAL, CATAPHORIC, NONREFERENTIAL, AMBIGUOUS, EXOPHORIC, UNRESOLVED, ABSTAIN. Record evidence spans, confidence, negative_control_quality and rationale. Omitted arguments: observed_span=null plus evidence_span and confidence.'));
let t=document.createElement('textarea');t.id='response';t.value=responses[x.item_id]||JSON.stringify({judgment:'ABSTAIN',antecedent_spans:[],omitted_arguments:[],confidence:0,negative_control_quality:'UNRESOLVED',rationale:''},null,2);v.append(t)}
function capture(){responses[items[pos].item_id]=document.getElementById('response').value}
function next(){capture();pos=Math.min(items.length-1,pos+1);show()}function prev(){capture();pos=Math.max(0,pos-1);show()}
function save(){capture();let who=document.getElementById('who').value,qual=document.getElementById('qual').value;
if(!who||!qual||!document.getElementById('ind').checked){alert('Provenance fields required. Self-attestation alone does not certify qualification.');return}
try{let rows=Object.entries(responses).map(([id,value])=>({...JSON.parse(value),item_id:id,item_hash:items.find(x=>x.item_id===id).item_hash,adjudicator_id:who,qualification_evidence:qual,independence_attestation:true,authority:'INDEPENDENT_HUMAN',timestamp:new Date().toISOString()}));
let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(rows,null,2)],{type:'application/json'}));a.download='P62_HUMAN_RESPONSES.private.json';a.click()}catch(e){alert(e.message)}}show();
</script>""".replace("__DATA__",encoded)

def bootstrap(rows,draws=1000):
    # Each row: work key, document key, document-equal mean.
    if not rows:return {"documents":0,"components":0,"estimate_pp":None,"interval95_pp":None}
    groups=collections.defaultdict(list)
    for work,doc,value in rows:groups[work].append(value)
    g=list(groups.values());rng=random.Random(62001);vals=[]
    for _ in range(draws):
        chosen=[g[rng.randrange(len(g))] for __ in g]
        vals.append(100*sum(sum(x) for x in chosen)/sum(len(x) for x in chosen))
    vals.sort()
    return {"documents":len(rows),"components":len(g),"zero_difference_documents":sum(v==0 for _,_,v in rows),
            "estimate_pp":100*statistics.mean(v for _,_,v in rows),
            "interval95_pp":[vals[int(.025*(draws-1))],vals[int(.975*(draws-1))]],"bootstrap_draws":draws}


def bigrams(text):
    words=re.findall(r"[가-힣]{2,}",text)
    return {w[i:i+2] for w in words for i in range(len(w)-1)}

def rank_candidate(forms,target,cs,policy="STRUCTURAL",direction="PAST"):
    selected=[c for c in cs if c["relation"].startswith(direction)]
    if not selected:return None
    counter=target_counter(forms,target)
    targetlex=bigrams(TARGET.sub(" ",forms[target["unit"]]))
    def score(c):
        text=forms[c["unit"]][c["start"]:c["end"]];lex=bigrams(text)
        sim=len(lex&targetlex)/len(lex|targetlex) if lex|targetlex else 0
        distance=abs(c["unit"]-target["unit"])
        if policy=="LEXICAL":return (-sim,distance,c["start"],c["candidate_id"])
        kinds={"NUMERIC_GROUP_FRAGMENT":0,"ENUMERATION_FRAGMENT":1,"TOPIC_ARGUMENT_FRAGMENT":2,"EVENT_PREDICATE_FRAGMENT":3}
        match=c.get("counter")==counter and counter is not None and c.get("plural_rule",False)
        return (not match,kinds[c["kind"]],distance,abs(c["end"]-target["start"]) if distance==0 else 0,c["candidate_id"])
    return min(selected,key=score)

def span_iou(a,b):
    if a["unit"]!=b["unit"]:return 0
    overlap=max(0,min(a["end"],b["end"])-max(a["start"],b["start"]))
    return overlap/(max(a["end"],b["end"])-min(a["start"],b["start"])) if overlap else 0

def source_link_classification(strict_count,flat_count):
    if strict_count==1:return "EXACT_STRUCTURAL_IDENTITY"
    if flat_count==1:return "SAME_FLATTENED_TEXT_DIFFERENT_STRUCTURE"
    return "UNRESOLVED_DIFFERENT_TEXT"

def import_ledger(packet,response,out):
    if Path(out).exists():raise FileExistsError("Never overwrite a judgment ledger")
    with gzip.open(packet,"rt",encoding="utf-8") as f:items={x["item_id"]:x for x in map(json.loads,f)}
    judgments=json.loads(Path(response).read_text(encoding="utf-8"))
    for j in judgments:validate_judgment(items[j["item_id"]],j)
    result={"status":"EXECUTED","qualification_verification":"SELF_ATTESTED_NOT_INDEPENDENTLY_CERTIFIED",
            "human_ground_truth_promoted":False,"responses":judgments,"reliability":reliability(items,judgments)}
    Path(out).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--packet",required=True);p.add_argument("--response",required=True);p.add_argument("--out",required=True)
    a=p.parse_args();import_ledger(a.packet,a.response,a.out)

