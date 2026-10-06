#!/usr/bin/env python3
"""Run G9-P48 StyleKQC generic-only paraphrase robustness pilot."""
from __future__ import annotations
import argparse, hashlib, json, re
from collections import Counter
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

REPO="Qwen/Qwen2.5-0.5B-Instruct"
SHA="7ae557604adf67be50417f59c2c2f167def9a775"
SEEDS=[4801,4802,4803,4804]
K=4; MAX_NEW=128
META_RE=re.compile(r"^(바꾼\s*문장|수정된\s*문장|다듬은\s*문장|답변|결과|다음과\s*같이)\s*[:：]",re.I)

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
    msg=[{"role":"user","content":"다음 한국어 문장을 의미와 사실을 유지하면서 자연스러운 다른 표현으로 바꾸세요. 설명 없이 바꾼 문장 하나만 출력하세요.\n\n문장: "+source}]
    return tok.apply_chat_template(msg,tokenize=False,add_generation_prompt=True)

def legal(text):
    s=text.strip()
    if not s:return False,"EMPTY"
    if "\n" in s or (chr(96)*3) in s:return False,"MULTILINE_OR_BLOCK"
    if META_RE.search(s):return False,"META_PREFIX"
    return True,"PASS"

def generate_batch(model,tok,prompts,do_sample):
    enc=tok(prompts,return_tensors="pt",padding=True)
    kw={"max_new_tokens":MAX_NEW,"do_sample":do_sample,"num_beams":1,
        "return_dict_in_generate":True,"output_scores":True,"pad_token_id":tok.eos_token_id}
    if do_sample:kw.update({"temperature":0.7,"top_p":0.9})
    with torch.no_grad():out=model.generate(**enc,**kw)
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
    tt,_=generate_batch(model,tok,bp,False);a0.extend(tt)

cand=[[None]*K for _ in items]; scores=[[None]*K for _ in items]
for k,seed in enumerate(SEEDS):
    torch.manual_seed(seed); all_t=[];all_s=[]
    for bp in chunks(prompts,8):
        tt,ss=generate_batch(model,tok,bp,True);all_t.extend(tt);all_s.extend(ss)
    for i,(tt,ss) in enumerate(zip(all_t,all_s)):
        cand[i][k]=tt;scores[i][k]=ss

decisions=[]
for i,item in enumerate(items):
    lg=[]; reasons=[]
    for c in cand[i]:
        ok,why=legal(c);lg.append(ok);reasons.append(why)
    a1=max(range(K),key=lambda j:(scores[i][j],-j))
    li=[j for j in range(K) if lg[j]]
    a3=max(li,key=lambda j:(scores[i][j],-j)) if li else None
    decisions.append({
      "item_id":item["item_id"],"source_sha256":item["source_sha256"],
      "candidate_hashes":[hashlib.sha256(x.encode()).hexdigest() for x in cand[i]],
      "scores":scores[i],"legal":lg,"reasons":reasons,"A1_index":a1,"A3_index":a3
    })

blob=json.dumps(decisions,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()
decision_sha=hashlib.sha256(blob).hexdigest()
print(json.dumps({"event":"DECISIONS_FROZEN_BEFORE_GOLD","decision_sha256":decision_sha,"items":len(items)}))

gold={x["item_id"]:x for x in (json.loads(z) for z in a.gold.read_text(encoding="utf-8").splitlines() if z.strip())}
agg={arm:Counter() for arm in ["A0","A1","A3"]}; distances={arm:[] for arm in agg}
rescue=abstain=dormant=0; distinct=[]; legal_sizes=[]; reachable=0
for i,(item,d) in enumerate(zip(items,decisions)):
    ref=gold[item["item_id"]]["references"][0]
    a1=d["A1_index"];a3=d["A3_index"]
    if a3 is None:abstain+=1
    elif a3!=a1:rescue+=1
    else:dormant+=1
    distinct.append(len(set(d["candidate_hashes"])));legal_sizes.append(sum(d["legal"]))
    if any(c==ref for c in cand[i]):reachable+=1
    arms={"A0":a0[i],"A1":cand[i][a1],"A3":None if a3 is None else cand[i][a3]}
    for arm,text in arms.items():
        agg[arm]["n"]+=1
        if text is None:
            agg[arm]["abstain"]+=1;continue
        ok,_=legal(text)
        if ok:agg[arm]["format_pass"]+=1
        if text==ref:agg[arm]["exact_ref_hit"]+=1
        distances[arm].append(lev(text,ref)/max(1,max(len(text),len(ref))))

summary={}
for arm in ["A0","A1","A3"]:
    n=agg[arm]["n"];ds=distances[arm]
    summary[arm]={
      "n":n,"abstain":agg[arm]["abstain"],
      "format_pass_rate":agg[arm]["format_pass"]/n,
      "exact_hidden_positive_hit_rate":agg[arm]["exact_ref_hit"]/n,
      "mean_normalized_char_distance_to_hidden_positive":sum(ds)/len(ds) if ds else None
    }
summary["SET"]={
 "rescue":rescue,"abstain":abstain,"dormant":dormant,
 "rescue_rate":rescue/len(items),"abstain_rate":abstain/len(items),
 "mean_distinct_candidates":sum(distinct)/len(distinct),
 "mean_legal_candidates":sum(legal_sizes)/len(legal_sizes),
 "items_with_exact_hidden_positive_reachable":reachable
}
receipt={
 "schema":"ksgt.g9.p48.stylekqc-paraphrase-result.v1.1","status":"COMPLETE_GENERIC_ONLY",
 "generator":{"repo":REPO,"sha":SHA},"items":len(items),"K":K,"seeds":SEEDS,
 "decision_sha256_before_gold":decision_sha,"gold_opened_after_decision_freeze":True,
 "summary":summary,"raw_source_hidden_positive_or_generation_persisted":False,
 "authority":"FORMAT_PLURALITY_SOURCE_TASK_ROBUSTNESS_ONLY_NOT_CARGO_OR_REGISTER_OR_WRITING_QUALITY"
}
a.out.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(receipt,ensure_ascii=False))
