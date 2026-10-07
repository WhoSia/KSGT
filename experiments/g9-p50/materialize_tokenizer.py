#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

import sentencepiece as spm
from datasets import load_dataset

DATASET = "HuggingFaceFW/fineweb-2"
CONFIG = "kor_Hang"
REVISION = "fb08250"
SEED_TEXT = "KSGT-G9-P50-TOKENIZER-v1"
PROTECTED_PATH = Path("experiments/g9-p50/protected_pia_fingerprints.json")
EXCLUDED_HOST_SUFFIXES = ("github.com", "raw.githubusercontent.com", "huggingface.co")


def stable_seed(text: str) -> int:
    return int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")


def host_excluded(url: str) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    return any(host == s or host.endswith("." + s) for s in EXCLUDED_HOST_SUFFIXES)


def normalize_line(text: str) -> str:
    return " ".join(text.replace("\x00", " ").split())


def sha(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def hash_record(record_id: str, url: str, text: str) -> str:
    h = hashlib.sha256()
    h.update(record_id.encode("utf-8", errors="replace"))
    h.update(b"\0")
    h.update(url.encode("utf-8", errors="replace"))
    h.update(b"\0")
    h.update(text.encode("utf-8", errors="replace"))
    return h.hexdigest()


def load_protected() -> tuple[set[str], set[str]]:
    x = json.loads(PROTECTED_PATH.read_text(encoding="utf-8"))
    sources = set(x["normalized_source_sha256"])
    shingles = set(x["word8_shingle_sha256"])
    return sources, shingles


def protected_match(text: str, source_hashes: set[str], shingle_hashes: set[str]) -> bool:
    # Exact normalized document match.
    if sha(text) in source_hashes:
        return True

    # For short protected items, their full-source hash equals the hash of a same-length
    # contiguous n-gram. For longer items, any frozen 8-word shingle is enough to exclude.
    words = text.split()
    targets = source_hashes | shingle_hashes
    max_n = min(8, len(words))
    for n in range(3, max_n + 1):
        for i in range(len(words) - n + 1):
            if sha(" ".join(words[i:i+n])) in targets:
                return True
    return False


def stream_dataset(seed_suffix: str, buffer_size: int):
    ds = load_dataset(
        DATASET,
        CONFIG,
        split="train",
        streaming=True,
        revision=REVISION,
    )
    return ds.shuffle(seed=stable_seed(SEED_TEXT + seed_suffix), buffer_size=buffer_size)


def build_training_sample(target_chars: int, tmp_path: Path) -> dict:
    source_hashes, shingle_hashes = load_protected()
    ds = stream_dataset("", 50_000)

    aggregate = hashlib.sha256()
    selected_hashes = []
    host_counts = Counter()
    chars = docs = skipped_host = skipped_empty = skipped_protected = 0

    with tmp_path.open("w", encoding="utf-8") as fout:
        for row in ds:
            text = normalize_line(str(row.get("text") or ""))
            if not text:
                skipped_empty += 1
                continue
            url = str(row.get("url") or "")
            if host_excluded(url):
                skipped_host += 1
                continue
            if protected_match(text, source_hashes, shingle_hashes):
                skipped_protected += 1
                continue

            rid = str(row.get("id") or "")
            rh = hash_record(rid, url, text)
            aggregate.update(bytes.fromhex(rh))
            if len(selected_hashes) < 5000:
                selected_hashes.append(rh)
            host = (urlparse(url).hostname or "").lower() if url else ""
            if host:
                host_counts[host] += 1
            fout.write(text + "\n")
            chars += len(text)
            docs += 1
            if chars >= target_chars:
                break

    if chars < target_chars:
        raise RuntimeError(f"stream exhausted before target: {chars} < {target_chars}")

    return {
        "dataset": DATASET,
        "config": CONFIG,
        "revision": REVISION,
        "split": "train",
        "selection_seed": SEED_TEXT,
        "shuffle_buffer": 50_000,
        "target_characters": target_chars,
        "realized_characters": chars,
        "documents": docs,
        "skipped_excluded_host": skipped_host,
        "skipped_empty": skipped_empty,
        "skipped_protected_pia": skipped_protected,
        "protected_source_hash_count": len(source_hashes),
        "protected_word8_shingle_count": len(shingle_hashes),
        "sample_aggregate_sha256": aggregate.hexdigest(),
        "first_selected_record_hashes_sha256": hashlib.sha256(
            "\n".join(selected_hashes).encode("utf-8")
        ).hexdigest(),
        "top_hosts": host_counts.most_common(20),
        "raw_text_retained": False,
    }


def train_tokenizer(sample_path: Path, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    prefix = out_dir / "ksgt_g9_p50_sp_unigram_32k"
    spm.SentencePieceTrainer.Train(
        input=str(sample_path),
        model_prefix=str(prefix),
        vocab_size=32768,
        model_type="unigram",
        normalization_rule_name="identity",
        byte_fallback=True,
        character_coverage=0.9995,
        split_digits=True,
        split_by_unicode_script=True,
        split_by_whitespace=True,
        add_dummy_prefix=True,
        hard_vocab_limit=False,
        unk_id=0, bos_id=1, eos_id=2, pad_id=3,
        user_defined_symbols=["<src>", "<ctx>", "<cand>"],
        num_threads=max(1, min(8, os.cpu_count() or 1)),
    )

    model_path = prefix.with_suffix(".model")
    vocab_path = prefix.with_suffix(".vocab")
    proc = spm.SentencePieceProcessor(model_file=str(model_path))
    return {
        "model_path": model_path.name,
        "vocab_path": vocab_path.name,
        "model_sha256": hashlib.sha256(model_path.read_bytes()).hexdigest(),
        "vocab_sha256": hashlib.sha256(vocab_path.read_bytes()).hexdigest(),
        "piece_size": proc.get_piece_size(),
        "unk_id": proc.unk_id(), "bos_id": proc.bos_id(),
        "eos_id": proc.eos_id(), "pad_id": proc.pad_id(),
    }


def diagnostic(tokenizer_model: Path, n_docs: int = 1000) -> dict:
    source_hashes, shingle_hashes = load_protected()
    proc = spm.SentencePieceProcessor(model_file=str(tokenizer_model))
    ds = stream_dataset("-DIAGNOSTIC", 20_000)

    seen = eojeol = pieces = byte_pieces = unk = chars = skipped_protected = 0
    for row in ds:
        text = normalize_line(str(row.get("text") or ""))
        if not text:
            continue
        url = str(row.get("url") or "")
        if host_excluded(url):
            continue
        if protected_match(text, source_hashes, shingle_hashes):
            skipped_protected += 1
            continue
        toks = proc.encode(text, out_type=str)
        seen += 1
        chars += len(text)
        eojeol += max(1, len(text.split()))
        pieces += len(toks)
        byte_pieces += sum(1 for t in toks if t.startswith("<0x") and t.endswith(">"))
        unk += sum(1 for t in toks if t == "<unk>")
        if seen >= n_docs:
            break

    if not seen:
        raise RuntimeError("no diagnostic documents")
    return {
        "documents": seen,
        "characters": chars,
        "eojeol": eojeol,
        "pieces": pieces,
        "tokens_per_eojeol": pieces / eojeol,
        "byte_piece_fraction": byte_pieces / pieces if pieces else None,
        "unk_piece_count": unk,
        "skipped_protected_pia": skipped_protected,
        "authority": "TOKENIZATION_DIAGNOSTIC_ONLY_NOT_WRITING_QUALITY",
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--target-chars", type=int, default=100_000_000)
    ap.add_argument("--out-dir", default="g9_p50_tokenizer_artifact")
    args = ap.parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as td:
        sample_path = Path(td) / "tokenizer_sample.txt"
        sample_receipt = build_training_sample(args.target_chars, sample_path)
        tok_receipt = train_tokenizer(sample_path, out_dir)
        sample_path.unlink(missing_ok=True)

    model_path = out_dir / tok_receipt["model_path"]
    diag = diagnostic(model_path)
    manifest = {
        "schema": "ksgt.g9.p50.tokenizer-execution-receipt.v2",
        "phase": "G9-P50",
        "status": "TOKENIZER_EXECUTED",
        "preseal": "experiments/g9-p50/tokenizer_preseal.json",
        "source_snapshot": "experiments/g9-p50/fineweb2_source_snapshot.json",
        "protected_fingerprints": "experiments/g9-p50/protected_pia_fingerprints.json",
        "sample": sample_receipt,
        "tokenizer": tok_receipt,
        "diagnostic": diag,
        "raw_training_text_in_artifact": False,
        "raw_training_text_in_repo": False,
        "model_training_authorized_by_this_receipt": False,
        "engineering_note": "os._exit(0) is used after durable receipt write to avoid a known CPython/native-extension finalization crash observed in attempt 1; it does not alter tokenizer computation.",
    }
    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Ensure durable artifact bytes and visible logs before bypassing native-extension
    # interpreter finalization (attempt 1 crashed there after model/vocab save).
    with manifest_path.open("rb") as f:
        os.fsync(f.fileno())
    print(json.dumps({
        "status": manifest["status"],
        "revision": REVISION,
        "piece_size": tok_receipt["piece_size"],
        "documents": sample_receipt["documents"],
        "characters": sample_receipt["realized_characters"],
        "skipped_protected_pia": sample_receipt["skipped_protected_pia"],
        "model_sha256": tok_receipt["model_sha256"],
    }, ensure_ascii=False), flush=True)
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(0)


if __name__ == "__main__":
    main()
