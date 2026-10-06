#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json
from pathlib import Path
import torch
from huggingface_hub import HfApi
from transformers import AutoTokenizer, AutoModelForCausalLM

REPO="Qwen/Qwen2.5-0.5B-Instruct"
info=HfApi().model_info(REPO)
sha=info.sha
print(json.dumps({"event":"MODEL_SHA_RESOLVED_BEFORE_P48_ITEMS","repo":REPO,"sha":sha},ensure_ascii=False))

tok=AutoTokenizer.from_pretrained(REPO,revision=sha,trust_remote_code=False)
model=AutoModelForCausalLM.from_pretrained(REPO,revision=sha,trust_remote_code=False,torch_dtype=torch.float32)
model.eval()
messages=[{"role":"user","content":"다음 문장을 의미를 바꾸지 않고 자연스럽게 다듬어 주세요: 오늘 회의는 예정대로 진행됩니다."}]
text=tok.apply_chat_template(messages,tokenize=False,add_generation_prompt=True)
inputs=tok(text,return_tensors="pt")
with torch.no_grad():
    out=model.generate(**inputs,max_new_tokens=96,do_sample=False,num_beams=1)
gen=tok.decode(out[0][inputs["input_ids"].shape[-1]:],skip_special_tokens=True)
receipt={
 "schema":"ksgt.g9.p48.generator-smoke.v1",
 "status":"PASS" if len(gen.strip())>0 else "FAIL_EMPTY",
 "repo":REPO,
 "resolved_sha":sha,
 "scientific_packet_rows":0,
 "generation":{"do_sample":False,"num_beams":1,"max_new_tokens":96},
 "output_char_count":len(gen),
 "output_sha256":hashlib.sha256(gen.encode("utf-8")).hexdigest(),
 "raw_output_persisted":False,
 "authority":"EXECUTION_SMOKE_ONLY_NO_SCIENTIFIC_RESULT"
}
Path("g9_p48_generator_smoke.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(receipt,ensure_ascii=False))
