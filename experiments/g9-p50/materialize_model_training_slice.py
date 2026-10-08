#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os, sys
from array import array
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

import sentencepiece as spm
from datasets import load_dataset

DATASET="HuggingFaceFW/fineweb-2"
CONFIG="kor_Hang"
REVISION="fb08250"
TOKENIZER_SEED="KSGT-G9-P50-TOKENIZER-v1"
TRAIN_SEED="KSGT-G9-P50-MODEL-v1"
DEV_SEED="KSGT-G9-P50-MODEL-DEV-v1"
TOKENIZER_TARGET_CHARS=100_000_000
PROTECTED_PATH=Path("experiments/g9-p50/protected_pia_fingerprints.json")
EXCLUDED_HOST_SUFFIXES=("github.com","raw.githubusercontent.com","huggingface.co")

def stable_seed(text:str)->int:
    return int.from_bytes(hashlib.sha256(text.encode()).digest()[:8],"big")

def normalize_line(text:str)->str:
    return " ".join(text.replace("\x00"," ").split())

def sha(text:str)->str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def host_excluded(url:str)->bool:
    try: host=(urlparse(url).hostname or "").lower()
    except Exception: return False
    return any(host==s or host.endswith("."+s) for s in EXCLUDED_HOST_SUFFIXES)

def record_hash(row,text:str)->str:
    h=hashlib.sha256()
    h.update(str(row.get("id") or "").encode("utf-8",errors="replace"))
    h.update(b"\0")
    h.update(str(row.get("url") or "").encode("utf-8",errors="replace"))
    h.update(b"\0")
    h.update(text.encode("utf-8",errors="replace"))
    return h.hexdigest()

def load_protected():
    x=json.loads(PROTECTED_PATH.read_text(encoding="utf-8"))
    return set(x["normalized_source_sha256"]), set(x["word8_shingle_sha256"])

def protected_match(text:str, sources:set[str], shingles:set[str])->bool:
    if sha(text) in sources: return True
    words=text.split()
    targets=sources|shingles
    for n in range(3,min(8,len(words))+1):
        for i in range(len(words)-n+1):
            if sha(" ".join(words[i:i+n])) in targets:
                return True
    return False

def stream(seed_text:str, buffer_size:int=50_000):
    ds=load_dataset(DATASET,CONFIG,split="train",streaming=True,revision=REVISION)
    return ds.shuffle(seed=stable_seed(seed_text),buffer_size=buffer_size)

def eligible(row,sources,shingles):
    text=normalize_line(str(row.get("text") or ""))
    if not text: return None,"empty"
    url=str(row.get("url") or "")
    if host_excluded(url): return None,"host"
    if protected_match(text,sources,shingles): return None,"protected"
    return text,None

def reconstruct_tokenizer_hashes():
    sources,shingles=load_protected()
    selected=set(); chars=0; docs=0; skipped=Counter()
    agg=hashlib.sha256()
    for row in stream(TOKENIZER_SEED):
        text,why=eligible(row,sources,shingles)
        if why:
            skipped[why]+=1; continue
        rh=record_hash(row,text)
        selected.add(rh); agg.update(bytes.fromhex(rh))
        chars += len(text); docs += 1
        if chars>=TOKENIZER_TARGET_CHARS: break
    if chars<TOKENIZER_TARGET_CHARS:
        raise RuntimeError("failed to reconstruct tokenizer-only sample")
    return selected,{
        "documents":docs,"characters":chars,
        "ordered_record_aggregate_sha256":agg.hexdigest(),
        "set_sha256":hashlib.sha256("\n".join(sorted(selected)).encode()).hexdigest(),
        "skipped":dict(skipped)
    }

def write_u16_tokens(path:Path, proc, seed_text:str, target_tokens:int, excluded_hashes:set[str]):
    sources,shingles=load_protected()
    token_sha=hashlib.sha256(); record_set=set(); record_order=hashlib.sha256()
    counts=Counter(); written=0; full_docs=0; truncated_final=False
    host_counts=Counter()
    eos=proc.eos_id()
    with path.open("wb") as f:
        for row in stream(seed_text):
            text,why=eligible(row,sources,shingles)
            if why:
                counts["skipped_"+why]+=1; continue
            rh=record_hash(row,text)
            if rh in excluded_hashes or rh in record_set:
                counts["skipped_role_overlap_or_duplicate"]+=1; continue
            ids=proc.encode(text,out_type=int)+[eos]
            remaining=target_tokens-written
            if remaining<=0: break
            use=ids[:remaining]
            a=array("H",use)
            if sys.byteorder!="little": a.byteswap()
            b=a.tobytes()
            f.write(b); token_sha.update(b)
            record_set.add(rh); record_order.update(bytes.fromhex(rh))
            url=str(row.get("url") or "")
            host=(urlparse(url).hostname or "").lower() if url else ""
            if host: host_counts[host]+=1
            written += len(use)
            if len(use)==len(ids): full_docs += 1
            else: truncated_final=True
            if written>=target_tokens: break
        f.flush(); os.fsync(f.fileno())
    if written!=target_tokens:
        raise RuntimeError(f"token target not met: {written} != {target_tokens}")
    return record_set,{
        "seed":seed_text,"tokens":written,"uint16_bytes":written*2,
        "full_documents":full_docs,"selected_records":len(record_set),
        "truncated_final_document":truncated_final,
        "token_binary_sha256":token_sha.hexdigest(),
        "ordered_record_aggregate_sha256":record_order.hexdigest(),
        "record_set_sha256":hashlib.sha256("\n".join(sorted(record_set)).encode()).hexdigest(),
        "top_hosts":host_counts.most_common(20),
        **dict(counts)
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--tokenizer-model",required=True)
    ap.add_argument("--out-dir",default="g9_p50_training_slice")
    ap.add_argument("--train-tokens",type=int,default=100_000_000)
    ap.add_argument("--dev-tokens",type=int,default=2_000_000)
    args=ap.parse_args()

    out=Path(args.out_dir); out.mkdir(parents=True,exist_ok=True)
    proc=spm.SentencePieceProcessor(model_file=args.tokenizer_model)
    if proc.get_piece_size()!=32768:
        raise RuntimeError(f"unexpected tokenizer piece size {proc.get_piece_size()}")

    tok_hashes,tok_receipt=reconstruct_tokenizer_hashes()
    # Strong reconstruction check against the canonical tokenizer receipt.
    expected_chars=100_002_865
    expected_docs=60_326
    expected_agg="2e2fde1a21e01740db3322d078b6d2c05f26b0f5ef864614bcfc2a59a6aa70f3"
    if (tok_receipt["characters"],tok_receipt["documents"],tok_receipt["ordered_record_aggregate_sha256"]) != (expected_chars,expected_docs,expected_agg):
        raise RuntimeError("tokenizer-only reconstruction does not match canonical receipt")

    train_hashes,train_receipt=write_u16_tokens(out/"train.u16le",proc,TRAIN_SEED,args.train_tokens,tok_hashes)
    dev_excluded=tok_hashes|train_hashes
    dev_hashes,dev_receipt=write_u16_tokens(out/"dev.u16le",proc,DEV_SEED,args.dev_tokens,dev_excluded)

    if tok_hashes & train_hashes: raise RuntimeError("tokenizer/train overlap")
    if tok_hashes & dev_hashes: raise RuntimeError("tokenizer/dev overlap")
    if train_hashes & dev_hashes: raise RuntimeError("train/dev overlap")

    manifest={
      "schema":"ksgt.g9.p50.model-training-slice-receipt.v1",
      "phase":"G9-P50",
      "status":"MODEL_TRAINING_SLICE_MATERIALIZED",
      "source":{"dataset":DATASET,"config":CONFIG,"revision":REVISION,"split":"train"},
      "tokenizer":{
        "piece_size":proc.get_piece_size(),
        "model_sha256":hashlib.sha256(Path(args.tokenizer_model).read_bytes()).hexdigest()
      },
      "tokenizer_only_reconstruction":tok_receipt,
      "train":train_receipt,
      "dev":dev_receipt,
      "pairwise_record_overlap":{"tokenizer_train":0,"tokenizer_dev":0,"train_dev":0},
      "protected_pia":{"source_hashes":24,"phrase_fingerprints":55},
      "raw_text_in_artifact":False,
      "encoding":"unsigned 16-bit little-endian token ids; EOS terminates full documents; final document may be truncated only to hit exact token budget",
      "model_training_authorized_by_receipt":False,
      "authority":"DATA_SLICE_IDENTITY_ONLY"
    }
    (out/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({
      "status":manifest["status"],
      "train_tokens":train_receipt["tokens"],
      "dev_tokens":dev_receipt["tokens"],
      "train_records":train_receipt["selected_records"],
      "dev_records":dev_receipt["selected_records"],
      "train_sha256":train_receipt["token_binary_sha256"],
      "dev_sha256":dev_receipt["token_binary_sha256"]
    },indent=2),flush=True)

    # Native extension finalization can abort after all scientific work is done.
    # Persist and verify every deliverable before bypassing interpreter teardown.
    for filename, expected_bytes, receipt in (
        ("train.u16le", args.train_tokens * 2, train_receipt),
        ("dev.u16le", args.dev_tokens * 2, dev_receipt),
    ):
        p = out / filename
        if p.stat().st_size != expected_bytes:
            raise RuntimeError(f"incorrect byte length for {filename}")
        h = hashlib.sha256()
        with p.open("rb") as fp:
            while True:
                chunk = fp.read(8 * 1024 * 1024)
                if not chunk:
                    break
                h.update(chunk)
        if h.hexdigest() != receipt["token_binary_sha256"]:
            raise RuntimeError(f"re-read SHA mismatch for {filename}")
    manifest_path = out / "manifest.json"
    with manifest_path.open("rb") as fp:
        os.fsync(fp.fileno())
    print("MODEL_SLICE_DURABLE_RECHECK_PASS", flush=True)
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(0)

if __name__=="__main__":
    main()
