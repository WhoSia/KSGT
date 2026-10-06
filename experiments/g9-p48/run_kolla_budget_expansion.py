#!/usr/bin/env python3
"""Run nested K=4/8/12 authority-gated decoding on a fresh KoLLA packet."""
from __future__ import annotations
import argparse, hashlib, json, re
from collections import Counter, defaultdict
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

REPO="Qwen/Qwen2.5-0.5B-Instruct"
SHA="7ae557604adf67be50417f59c2c2f167def9a775"
SEEDS=[4811,4812,4813,4814,4815,4816,4817,4818,4819,4820,4821,4822]
BUDGETS=[4,8,12]
MAX_NEW=128
META_RE=re.compile(r"^(수정된\s*문장|다듬은\s*문장|교정된\s*문장|답변|결과|다음과\s*같이)\s*[:：]",re.I)

def lev(a,b):
    if len(a)>len(b):a,b=b,a
    prev=list(range(len(a)+1))
    for i,cb in enumerate(b,1):
        cur=[i]
        for j,ca in enumerate(a,1): cur.append(min(cur[-1]+1,prev[j]+1,prev[j-1]+(ca!=cb)))
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

def generate_batch(model,tok,prompts,seed):
    enc=tok(prompts,return_tensors="pt",padding=True)
    torch.manual_seed(seed)
    with torch.no_grad():
        out=model.generate(**enc,max_new_tokens=MAX_NEW,do_sample=True,num_beams=1,temperature=0.7,top_p=0.9,
                           return_dict_in_generate=True,output_scores=True,pad_token_id=tok.eos_token_id)
    gen_ids=out.sequences[:,enc["input_ids"].shape[1]:]
    texts=tok.batch_decode(gen_ids,skip_special_tokens=True)
    ts=model.compute_transition_scores(out.sequences,out.scores,normalize_logits=True)
    scores=[]
    for row in ts:
        vals=row[row<0]; scores.append(float(vals.mean().item()) if len(vals) else float("-inf"))
    return texts,scores

def chunks(xs,n):
    for i in range(0,len(xs),n):yield xs[i:i+n]

ap=argparse.ArgumentParser(); ap.add_argument("--source",type=Path,required=True); ap.add_argument("--gold",type=Path,required=True); ap.add_argument("--out",type=Path,required=True)
a=ap.parse_args(); items=[json.loads(x) for x in a.source.read_text(encoding="utf-8").splitlines() if x.strip()]
tok=AutoTokenizer.from_pretrained(REPO,revision=SHA,trust_remote_code=False,padding_side="left")
if tok.pad_token_id is None:tok.pad_token=tok.eos_token
model=AutoModelForCausalLM.from_pretrained(REPO,revision=SHA,trust_remote_code=False,torch_dtype=torch.float32); model.eval()
prompts=[prompt_text(tok,x["source"]) for x in items]
K=max(BUDGETS); cand=[[None]*K for _ in items]; scores=[[None]*K for _ in items]
for k,seed in enumerate(SEEDS):
    all_t=[]; all_s=[]
    for bp in chunks(prompts,8):
        tt,ss=generate_batch(model,tok,bp,seed); all_t.extend(tt); all_s.extend(ss)
    for i,(tt,ss) in enumerate(zip(all_t,all_s)): cand[i][k]=tt; scores[i][k]=ss

# Freeze all candidate text hashes, scores, and legality before opening gold.
base=[]
for i,item in enumerate(items):
    legal=[]; reasons=[]
    for c in cand[i]:
        f,fr=format_legal(c); cg,miss=cargo_legal(item,c); legal.append(f and cg); reasons.append({"format":fr,"missing_cargo_count":miss})
    by_budget={}
    for b in BUDGETS:
        a1=max(range(b),key=lambda j:(scores[i][j],-j)); li=[j for j in range(b) if legal[j]]
        a3=max(li,key=lambda j:(scores[i][j],-j)) if li else None
        by_budget[str(b)]={"A1_index":a1,"A1_legal":legal[a1],"A3_index":a3,"A3_abstain":a3 is None,"legal_count":len(li)}
    first_legal=next((j+1 for j,v in enumerate(legal) if v),None)
    base.append({"item_id":item["item_id"],"stratum":item["stratum"],"source_sha256":item["source_sha256"],
                 "candidate_hashes":[hashlib.sha256(x.encode()).hexdigest() for x in cand[i]],"scores":scores[i],"legal":legal,
                 "legality_reasons":reasons,"first_legal_rank":first_legal,"budgets":by_budget})
blob=json.dumps(base,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode(); dsha=hashlib.sha256(blob).hexdigest()
print(json.dumps({"event":"ALL_BUDGET_DECISIONS_FROZEN_BEFORE_GOLD","decision_sha256":dsha,"items":len(base)}))
gold={x["item_id"]:x for x in (json.loads(z) for z in a.gold.read_text(encoding="utf-8").splitlines() if z.strip())}

summary={}; transition={}
for b in BUDGETS:
    bs={}
    for st in ["ALL","K1_HARD_CARGO","K2_GENERIC"]:
        idx=[i for i,x in enumerate(items) if st=="ALL" or x["stratum"]==st]
        n=len(idx); emitted=0; a1legal=0; cargo_a1=0; cargo_a3=0; dist_a1=[]; dist_a3=[]
        for i in idx:
            d=base[i]["budgets"][str(b)]; item=items[i]; refs=gold[item["item_id"]]["references"]
            a1=cand[i][d["A1_index"]]; a1legal+=int(d["A1_legal"]); cargo_a1+=int(cargo_legal(item,a1)[0])
            dist_a1.append(min(lev(a1,r) for r in refs)/max(1,max(len(a1),min(len(r) for r in refs))))
            if d["A3_index"] is not None:
                emitted+=1; a3=cand[i][d["A3_index"]]; cargo_a3+=int(cargo_legal(item,a3)[0])
                dist_a3.append(min(lev(a3,r) for r in refs)/max(1,max(len(a3),min(len(r) for r in refs))))
        bs[st]={"n":n,"A3_coverage":emitted/n,"A3_abstain":n-emitted,"A1_top_legal_rate":a1legal/n,
                "A1_cargo_pass_all_n":cargo_a1/n,"A3_cargo_pass_all_n":cargo_a3/n,
                "A1_mean_ref_distance_diagnostic":sum(dist_a1)/len(dist_a1),
                "A3_mean_ref_distance_diagnostic":None if not dist_a3 else sum(dist_a3)/len(dist_a3)}
    summary[str(b)]=bs

for st in ["ALL","K1_HARD_CARGO","K2_GENERIC"]:
    idx=[i for i,x in enumerate(items) if st=="ALL" or x["stratum"]==st]
    abst4=[i for i in idx if base[i]["budgets"]["4"]["A3_abstain"]]
    rescued8=sum(not base[i]["budgets"]["8"]["A3_abstain"] for i in abst4)
    rescued12=sum(not base[i]["budgets"]["12"]["A3_abstain"] for i in abst4)
    persistent12=len(abst4)-rescued12
    frac=None if not abst4 else rescued12/len(abst4)
    interp="NO_K4_ABSTAINERS" if not abst4 else ("SCARCITY_DOMINANT_LOCAL" if frac>=0.5 else "OVERCONSTRAINT_PERSISTS_LOCAL")
    ranks=Counter(str(base[i]["first_legal_rank"]) if base[i]["first_legal_rank"] is not None else "NONE_WITHIN_12" for i in idx)
    transition[st]={"K4_abstainers":len(abst4),"rescued_by_K8":rescued8,"rescued_by_K12":rescued12,
                    "persistent_K12":persistent12,"K4_abstainer_rescue_fraction_by_K12":frac,
                    "first_legal_rank_distribution":dict(ranks),"prospective_interpretation":interp}

receipt={"schema":"ksgt.g9.p48.candidate-budget-expansion-result.v1","status":"COMPLETE","items":len(items),"budgets":BUDGETS,
         "generator":{"repo":REPO,"sha":SHA},"decision_sha256_before_gold":dsha,"gold_opened_after_decision_freeze":True,
         "summary":summary,"transition":transition,"raw_source_reference_or_generation_persisted":False,
         "authority":"L2_GEC_SELECTIVE_DECODER_MECHANISM_ONLY"}
a.out.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(receipt,ensure_ascii=False))
