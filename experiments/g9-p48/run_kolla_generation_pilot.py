#!/usr/bin/env python3
"""Run P48 A0-A3 on the hidden-gold KoLLA packet."""
from __future__ import annotations
import argparse, hashlib, json, re
from collections import Counter, defaultdict
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

REPO="Qwen/Qwen2.5-0.5B-Instruct"
SHA="7ae557604adf67be50417f59c2c2f167def9a775"
SEEDS=[4801,4802,4803,4804]
K=4
MAX_NEW=128
META_RE=re.compile(r"^(수정된\s*문장|다듬은\s*문장|교정된\s*문장|답변|결과|다음과\s*같이)\s*[:：]",re.I)

def lev(a,b):
    if len(a)>len(b):a,b=b,a
    prev=list(range(len(a)+1))
    for i,cb in enumerate(b,1):
        cur=[i]
        for j,ca in enumerate(a,1):
            cur.append(min(cur[-1]+1,prev[j]+1,prev[j-1]+(ca!=cb)))
        prev=cur
    return prev[-1]

def prompt_text(tok,source):
    msg=[{"role":"user","content":"다음 한국어 문장에서 필요한 부분만 교정하세요. 의미, 사실, 지시 대상은 바꾸지 마세요. 수정이 필요 없으면 원문을 그대로 반환하세요. 설명 없이 수정된 문장 하나만 출력하세요.\n\n문장: "+source}]
    return tok.apply_chat_template(msg,tokenize=False,add_generation_prompt=True)

def format_legal(text):
    s=text.strip()
    if not s:return False,"EMPTY"
    if "\n" in s or (chr(96)*3) in s:return False,"MULTILINE_OR_BLOCK"
    if META_RE.search(s):return False,"META_PREFIX"
    return True,"PASS"

def cargo_legal(item,text):
    if item["stratum"]!="K1_HARD_CARGO":return True,0
    needed=Counter(tok for _,tok in item["protected_tokens"])
    missing=sum(max(0,n-text.count(tok)) for tok,n in needed.items())
    return missing==0,missing

def generate_batch(model,tok,prompts,do_sample,seed=None):
    enc=tok(prompts,return_tensors="pt",padding=True)
    if seed is not None: torch.manual_seed(seed)
    kw={"max_new_tokens":MAX_NEW,"do_sample":do_sample,"num_beams":1,
        "return_dict_in_generate":True,"output_scores":True,"pad_token_id":tok.eos_token_id}
    if do_sample: kw.update({"temperature":0.7,"top_p":0.9})
    with torch.no_grad():
        out=model.generate(**enc,**kw)
    gen_ids=out.sequences[:,enc["input_ids"].shape[1]:]
    texts=tok.batch_decode(gen_ids,skip_special_tokens=True)
    if out.scores:
        ts=model.compute_transition_scores(out.sequences,out.scores,normalize_logits=True)
        scores=[]
        for row in ts:
            vals=row[row<0]
            scores.append(float(vals.mean().item()) if len(vals) else float("-inf"))
    else:scores=[float("-inf")]*len(texts)
    return texts,scores

def chunks(xs,n):
    for i in range(0,len(xs),n):yield xs[i:i+n]

ap=argparse.ArgumentParser()
ap.add_argument("--source",type=Path,required=True)
ap.add_argument("--gold",type=Path,required=True)
ap.add_argument("--out",type=Path,required=True)
a=ap.parse_args()
items=[json.loads(x) for x in a.source.read_text(encoding="utf-8").splitlines() if x.strip()]

tok=AutoTokenizer.from_pretrained(REPO,revision=SHA,trust_remote_code=False,padding_side="left")
if tok.pad_token_id is None:tok.pad_token=tok.eos_token
model=AutoModelForCausalLM.from_pretrained(REPO,revision=SHA,trust_remote_code=False,torch_dtype=torch.float32)
model.eval()
prompts=[prompt_text(tok,x["source"]) for x in items]

a0=[]
for bp in chunks(prompts,8):
    texts,_=generate_batch(model,tok,bp,False)
    a0.extend(texts)

cand=[[None]*K for _ in items]; cs=[[None]*K for _ in items]
for k,seed in enumerate(SEEDS):
    all_t=[]; all_s=[]
    torch.manual_seed(seed)
    for bp in chunks(prompts,8):
        texts,scores=generate_batch(model,tok,bp,True,None)
        all_t.extend(texts); all_s.extend(scores)
    for i,(tt,ss) in enumerate(zip(all_t,all_s)):
        cand[i][k]=tt; cs[i][k]=ss

decisions=[]
for i,item in enumerate(items):
    legal=[]; reasons=[]
    for j,c in enumerate(cand[i]):
        f,fr=format_legal(c); cg,miss=cargo_legal(item,c)
        legal.append(f and cg)
        reasons.append({"format":fr,"missing_cargo_count":miss})
    a1=max(range(K),key=lambda j:(cs[i][j],-j))
    legal_idx=[j for j in range(K) if legal[j]]
    a3=max(legal_idx,key=lambda j:(cs[i][j],-j)) if legal_idx else None
    decisions.append({
      "item_id":item["item_id"],"stratum":item["stratum"],"source_sha256":item["source_sha256"],
      "a0_hash":hashlib.sha256(a0[i].encode()).hexdigest(),
      "candidate_hashes":[hashlib.sha256(x.encode()).hexdigest() for x in cand[i]],
      "scores":cs[i],"legal":legal,"legality_reasons":reasons,
      "A1_index":a1,"A2_legal_indices":legal_idx,"A3_index":a3,"A3_abstain":a3 is None
    })

decision_blob=json.dumps(decisions,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()
decision_sha=hashlib.sha256(decision_blob).hexdigest()
print(json.dumps({"event":"DECISIONS_FROZEN_BEFORE_GOLD","decision_sha256":decision_sha,"items":len(decisions)}))

gold={x["item_id"]:x for x in (json.loads(z) for z in a.gold.read_text(encoding="utf-8").splitlines() if z.strip())}
agg=defaultdict(Counter); dist=defaultdict(list); item_diag=[]
for i,(item,d) in enumerate(zip(items,decisions)):
    refs=gold[item["item_id"]]["references"]
    arms={"A0":a0[i],"A1":cand[i][d["A1_index"]],"A3":None if d["A3_index"] is None else cand[i][d["A3_index"]]}
    for arm,text in arms.items():
        agg[(item["stratum"],arm)]["n"]+=1
        if text is None:
            agg[(item["stratum"],arm)]["abstain"]+=1; continue
        f,_=format_legal(text); cg,_=cargo_legal(item,text)
        if f:agg[(item["stratum"],arm)]["format_pass"]+=1
        if cg:agg[(item["stratum"],arm)]["cargo_pass"]+=1
        if text in refs:agg[(item["stratum"],arm)]["exact_ref_hit"]+=1
        mind=min(lev(text,r) for r in refs)
        denom=max(1,max(len(text),min(len(r) for r in refs)))
        dist[(item["stratum"],arm)].append(mind/denom)
    ref_reachable=sum(any(c==r for c in cand[i]) for r in refs)
    item_diag.append({
      "item_id":item["item_id"],"stratum":item["stratum"],
      "candidate_distinct":len(set(d["candidate_hashes"])),"legal_count":sum(d["legal"]),
      "A1_A3_diverge":d["A3_index"] is not None and d["A1_index"]!=d["A3_index"],
      "A3_abstain":d["A3_abstain"],"human_reference_exact_reachable_count":ref_reachable
    })

summary={}
for stratum in ["K1_HARD_CARGO","K2_GENERIC"]:
    summary[stratum]={}
    for arm in ["A0","A1","A3"]:
        c=agg[(stratum,arm)]; n=c["n"]; ds=dist[(stratum,arm)]
        summary[stratum][arm]={
          "n":n,"abstain":c["abstain"],
          "format_pass_rate":c["format_pass"]/n if n else None,
          "cargo_pass_rate":c["cargo_pass"]/n if n else None,
          "exact_ref_hit_rate":c["exact_ref_hit"]/n if n else None,
          "mean_normalized_char_distance_to_nearest_ref":sum(ds)/len(ds) if ds else None
        }
    ids=[x for x in item_diag if x["stratum"]==stratum]
    summary[stratum]["SET"]={
      "mean_distinct_candidates":sum(x["candidate_distinct"] for x in ids)/len(ids),
      "mean_legal_candidates":sum(x["legal_count"] for x in ids)/len(ids),
      "A1_A3_divergence_rate":sum(x["A1_A3_diverge"] for x in ids)/len(ids),
      "A3_abstention_rate":sum(x["A3_abstain"] for x in ids)/len(ids),
      "mean_exact_human_refs_reachable_in_K":sum(x["human_reference_exact_reachable_count"] for x in ids)/len(ids)
    }

receipt={
 "schema":"ksgt.g9.p48.kolla-generation-result.v1","status":"COMPLETE",
 "generator":{"repo":REPO,"sha":SHA},"items":len(items),"K":K,"seeds":SEEDS,
 "decision_sha256_before_gold":decision_sha,"gold_opened_after_decision_freeze":True,
 "summary":summary,
 "aggregate_item_diagnostics":{
   "A1_A3_divergence_total":sum(x["A1_A3_diverge"] for x in item_diag),
   "A3_abstain_total":sum(x["A3_abstain"] for x in item_diag),
   "items_with_multiple_distinct_candidates":sum(x["candidate_distinct"]>1 for x in item_diag),
   "items_with_any_exact_human_reference_reachable":sum(x["human_reference_exact_reachable_count"]>0 for x in item_diag)
 },
 "raw_source_reference_or_generation_persisted":False,
 "authority":{"protected_token_retention":"P_HARD_DIAGNOSTIC_K1","reference_exact_or_distance":"DIAGNOSTIC_ONLY_NOT_WRITING_QUALITY","revision_burden":"NOT_CLAIMED","scope":"L2_GEC_BOUNDED_PILOT"}
}
a.out.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(receipt,ensure_ascii=False))
