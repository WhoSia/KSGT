#!/usr/bin/env python3
"""Generate frozen P49 A1/A3 K=12 surfaces and build two-pass blind owner-repair packet."""
from __future__ import annotations
import argparse, hashlib, json, re
from collections import Counter, defaultdict
from pathlib import Path
import torch
from transformers import AutoTokenizer,AutoModelForCausalLM

REPO="Qwen/Qwen2.5-0.5B-Instruct"
SHA="7ae557604adf67be50417f59c2c2f167def9a775"
SEEDS=list(range(4911,4923));K=12;MAX_NEW=128
META_RE=re.compile(r"^(수정된\s*문장|다듬은\s*문장|교정된\s*문장|바꾼\s*문장|답변|결과|다음과\s*같이)\s*[:：]",re.I)

def h(x):return hashlib.sha256(x.encode()).hexdigest()
def prompt_text(tok,item):
    if item["lane"]=="STYLEKQC_GENERIC":
        inst="다음 한국어 문장을 의미와 사실을 유지하면서 자연스러운 다른 표현으로 바꾸세요. 설명 없이 바꾼 문장 하나만 출력하세요."
    else:
        inst="다음 한국어 문장에서 필요한 부분만 교정하세요. 의미, 사실, 지시 대상은 바꾸지 마세요. 수정이 필요 없으면 원문을 그대로 반환하세요. 설명 없이 수정된 문장 하나만 출력하세요."
    return tok.apply_chat_template([{"role":"user","content":inst+"\n\n문장: "+item["source"]}],tokenize=False,add_generation_prompt=True)

def format_legal(text):
    s=text.strip()
    if not s:return False,"EMPTY"
    if "\n" in s or (chr(96)*3) in s:return False,"MULTILINE_OR_BLOCK"
    if META_RE.search(s):return False,"META_PREFIX"
    return True,"PASS"

def cargo_legal(item,text):
    if item["lane"]!="KOLLA_K1_HARD_CARGO":return True,0
    need=Counter(tok for _,tok in item["protected_tokens"])
    miss=sum(max(0,n-text.count(tok)) for tok,n in need.items())
    return miss==0,miss

def gen(model,tok,prompts,seed):
    enc=tok(prompts,return_tensors="pt",padding=True)
    torch.manual_seed(seed)
    with torch.no_grad():
        out=model.generate(**enc,max_new_tokens=MAX_NEW,do_sample=True,num_beams=1,temperature=.7,top_p=.9,
          return_dict_in_generate=True,output_scores=True,pad_token_id=tok.eos_token_id)
    ids=out.sequences[:,enc["input_ids"].shape[1]:]
    texts=tok.batch_decode(ids,skip_special_tokens=True)
    ts=model.compute_transition_scores(out.sequences,out.scores,normalize_logits=True)
    scores=[]
    for row in ts:
        vals=row[row<0];scores.append(float(vals.mean().item()) if len(vals) else float("-inf"))
    return texts,scores

def chunks(xs,n):
    for i in range(0,len(xs),n):yield xs[i:i+n]

ap=argparse.ArgumentParser()
ap.add_argument("--source",type=Path,required=True);ap.add_argument("--refs",type=Path,required=True);ap.add_argument("--outdir",type=Path,required=True)
a=ap.parse_args();a.outdir.mkdir(parents=True,exist_ok=True)
items=[json.loads(x) for x in a.source.read_text(encoding="utf-8").splitlines() if x.strip()]
refs={x["item_id"]:x for x in (json.loads(z) for z in a.refs.read_text(encoding="utf-8").splitlines() if z.strip())}
tok=AutoTokenizer.from_pretrained(REPO,revision=SHA,trust_remote_code=False,padding_side="left")
if tok.pad_token_id is None:tok.pad_token=tok.eos_token
model=AutoModelForCausalLM.from_pretrained(REPO,revision=SHA,trust_remote_code=False,torch_dtype=torch.float32);model.eval()
prompts=[prompt_text(tok,x) for x in items]
cand=[[None]*K for _ in items];scores=[[None]*K for _ in items]
for k,seed in enumerate(SEEDS):
    all_t=[];all_s=[]
    for bp in chunks(prompts,8):
        tt,ss=gen(model,tok,bp,seed);all_t.extend(tt);all_s.extend(ss)
    for i,(tt,ss) in enumerate(zip(all_t,all_s)):cand[i][k]=tt;scores[i][k]=ss

frozen=[]
for i,item in enumerate(items):
    legal=[];why=[]
    for c in cand[i]:
        f,fr=format_legal(c);cg,miss=cargo_legal(item,c);legal.append(f and cg);why.append({"format":fr,"missing_cargo":miss})
    a1=max(range(K),key=lambda j:(scores[i][j],-j));li=[j for j,v in enumerate(legal) if v]
    a3=max(li,key=lambda j:(scores[i][j],-j)) if li else None
    frozen.append({
      "item_id":item["item_id"],"lane":item["lane"],"source_sha256":item["source_sha256"],
      "A1_index":a1,"A3_index":a3,"A3_abstain":a3 is None,"legal_count":len(li),
      "candidate_hashes":[h(x) for x in cand[i]],"scores":scores[i],"legal":legal,"legality_reasons":why
    })
decision_sha=hashlib.sha256(json.dumps(frozen,sort_keys=True,separators=(",",":")).encode()).hexdigest()
# Do not print raw text.
print(json.dumps({"event":"A1_A3_FROZEN","items":len(items),"decision_sha256":decision_sha,
                  "A3_abstain":sum(x["A3_abstain"] for x in frozen)}))

# deterministic 2/2 A1/A3 in pass1 within each lane, opposite in pass2
lane_order=defaultdict(list)
for i,item in enumerate(items):
    key=h(item["source_sha256"]+"|P49-ARM")
    lane_order[item["lane"]].append((key,i))
pass1_arm={}
for lane,xs in lane_order.items():
    for rank,(_,i) in enumerate(sorted(xs)):
        pass1_arm[i]="A1" if rank%2==0 else "A3"

pass_rows={1:[],2:[]};key_rows=[]
for i,(item,dec) in enumerate(zip(items,frozen)):
    arms={1:pass1_arm[i],2:("A3" if pass1_arm[i]=="A1" else "A1")}
    for p in [1,2]:
        arm=arms[p]
        if arm=="A1":surface=cand[i][dec["A1_index"]];ab=False
        else:
            ab=dec["A3_index"] is None
            surface=None if ab else cand[i][dec["A3_index"]]
        blind=h(item["source_sha256"]+f"|PASS{p}|P49-BLIND")[:16]
        pass_rows[p].append({
          "blind_item_id":blind,"pass_id":p,"source_task":item["lane"],
          "source_text":item["source"],"system_surface":surface,"system_abstain":ab,
          "action":None,"repaired_text_if_any":None,"optional_reason_tag":None,
          "evaluator_scope":"OWNER_SINGLE_EDITOR"
        })
        key_rows.append({"blind_item_id":blind,"pass_id":p,"item_id":item["item_id"],"arm":arm,
                         "source_sha256":item["source_sha256"],"hidden_references":refs[item["item_id"]]["references"],
                         "protected_tokens":item["protected_tokens"],"A1_index":dec["A1_index"],"A3_index":dec["A3_index"],
                         "A3_abstain":dec["A3_abstain"],"legality_reasons":dec["legality_reasons"]})
# independent deterministic display order
for p in [1,2]:
    pass_rows[p]=sorted(pass_rows[p],key=lambda x:h(x["blind_item_id"]+f"|PASS{p}|P49-ORDER"))
    path=a.outdir/f"p49_owner_repair_pass{p}.jsonl"
    with path.open("w",encoding="utf-8") as f:
        for row in pass_rows[p]:f.write(json.dumps(row,ensure_ascii=False)+"\n")
with (a.outdir/"p49_owner_hidden_key.jsonl").open("w",encoding="utf-8") as f:
    for row in key_rows:f.write(json.dumps(row,ensure_ascii=False)+"\n")
receipt={
 "schema":"ksgt.g9.p49.owner-repair-packet.v1","status":"PASS",
 "items":len(items),"human_slots":24,"passes":2,
 "lane_counts":dict(Counter(x["lane"] for x in items)),
 "pass1_arm_counts":dict(Counter(pass1_arm.values())),
 "A3_abstain_items":sum(x["A3_abstain"] for x in frozen),
 "decision_sha256_before_human":decision_sha,
 "pass1_sha256":hashlib.sha256((a.outdir/"p49_owner_repair_pass1.jsonl").read_bytes()).hexdigest(),
 "pass2_sha256":hashlib.sha256((a.outdir/"p49_owner_repair_pass2.jsonl").read_bytes()).hexdigest(),
 "hidden_key_sha256":hashlib.sha256((a.outdir/"p49_owner_hidden_key.jsonl").read_bytes()).hexdigest(),
 "condition_labels_in_human_packet":False,"hidden_refs_in_human_packet":False,
 "gate_mutation":False,"authority":"OWNER_SINGLE_EDITOR_PILOT_ONLY"
}
(a.outdir/"g9_p49_owner_packet_receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(receipt,ensure_ascii=False))
