#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import random
import shutil
import tempfile
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

import sentencepiece as spm
from datasets import load_dataset

DATASET = "HuggingFaceFW/fineweb-2"
CONFIG = "kor_Hang"
SEED_TEXT = "KSGT-G9-P50-TOKENIZER-v1"
EXCLUDED_HOST_SUFFIXES = (
    "github.com",
    "raw.githubusercontent.com",
    "huggingface.co",
)


def stable_seed(text: str) -> int:
    return int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")


def host_excluded(url: str) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    return any(host == s or host.endswith("." + s) for s in EXCLUDED_HOST_SUFFIXES)


def normalize_line(text: str) -> str:
    # Deliberately no Unicode compatibility normalization.
    return " ".join(text.replace("\x00", " ").split())


def hash_record(record_id: str, url: str, text: str) -> str:
    h = hashlib.sha256()
    h.update(record_id.encode("utf-8", errors="replace"))
    h.update(b"\0")
    h.update(url.encode("utf-8", errors="replace"))
    h.update(b"\0")
    h.update(text.encode("utf-8", errors="replace"))
    return h.hexdigest()


def build_training_sample(target_chars: int, tmp_path: Path) -> dict:
    ds = load_dataset(DATASET, CONFIG, split="train", streaming=True)
    ds = ds.shuffle(seed=stable_seed(SEED_TEXT), buffer_size=50_000)

    aggregate = hashlib.sha256()
    selected_hashes = []
    host_counts = Counter()
    chars = 0
    docs = 0
    skipped_host = 0
    skipped_empty = 0

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
            rid = str(row.get("id") or "")
            rh = hash_record(rid, url, text)
            aggregate.update(bytes.fromhex(rh))
            if len(selected_hashes) < 5000:
                selected_hashes.append(rh)
            host = (urlparse(url).hostname or "").lower() if url else ""
            if host:
                host_counts[host] += 1
            fout.write(text)
            fout.write("\n")
            chars += len(text)
            docs += 1
            if chars >= target_chars:
                break

    if chars < target_chars:
        raise RuntimeError(f"stream exhausted before target: {chars} < {target_chars}")

    return {
        "dataset": DATASET,
        "config": CONFIG,
        "split": "train",
        "selection_seed": SEED_TEXT,
        "shuffle_buffer": 50_000,
        "target_characters": target_chars,
        "realized_characters": chars,
        "documents": docs,
        "skipped_excluded_host": skipped_host,
        "skipped_empty": skipped_empty,
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
        unk_id=0,
        bos_id=1,
        eos_id=2,
        pad_id=3,
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
        "unk_id": proc.unk_id(),
        "bos_id": proc.bos_id(),
        "eos_id": proc.eos_id(),
        "pad_id": proc.pad_id(),
    }


def diagnostic(tokenizer_model: Path, n_docs: int = 1000) -> dict:
    proc = spm.SentencePieceProcessor(model_file=str(tokenizer_model))
    ds = load_dataset(DATASET, CONFIG, split="train", streaming=True)
    ds = ds.shuffle(seed=stable_seed(SEED_TEXT + "-DIAGNOSTIC"), buffer_size=20_000)

    seen = 0
    eojeol = 0
    pieces = 0
    byte_pieces = 0
    unk = 0
    chars = 0

    for row in ds:
        text = normalize_line(str(row.get("text") or ""))
        if not text:
            continue
        url = str(row.get("url") or "")
        if host_excluded(url):
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
        # Raw sample must not survive artifact packaging.
        sample_path.unlink(missing_ok=True)

    model_path = out_dir / tok_receipt["model_path"]
    diag = diagnostic(model_path)

    manifest = {
        "schema": "ksgt.g9.p50.tokenizer-execution-receipt.v1",
        "phase": "G9-P50",
        "status": "TOKENIZER_EXECUTED",
        "preseal": "experiments/g9-p50/tokenizer_preseal.json",
        "sample": sample_receipt,
        "tokenizer": tok_receipt,
        "diagnostic": diag,
        "raw_training_text_in_artifact": False,
        "raw_training_text_in_repo": False,
        "model_training_authorized_by_this_receipt": False,
    }
    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
