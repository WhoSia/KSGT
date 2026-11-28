#!/usr/bin/env python3
"""Descriptive Korean style-operation census, not an editorial-quality reward.

Source: Smilegate AI / Seonghyun Kim (2022), SmileStyle, CC BY-NC 4.0.
Use only for noncommercial research and preserve this attribution.
Original Git commit b362299d1ac9a8a0de2f64eb8f55f3b386e97fad.
"""
import difflib
import hashlib
import json
import re
import statistics
import sys
from pathlib import Path

EXPECTED_SHA256 = "523ce83d6e9154e2357ca759460b487231aa0853bf98b208d0cb624a8e1e69bf"
EXPECTED_GIT_BLOB_SHA1 = "1f666dcb38d4822ff7bb61cf899d568f01c576e8"
EXPECTED_HEADER = (
    "formal informal android azae chat choding emoticon enfp gentle "
    "halbae halmae joongding king naruto seonbi sosim translator"
).split()
NUMBER = re.compile(r"\d+(?:[.,]\d+)*")


def analyze(raw: bytes) -> dict:
    sha256 = hashlib.sha256(raw).hexdigest()
    git_sha1 = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    if (sha256, git_sha1) != (EXPECTED_SHA256, EXPECTED_GIT_BLOB_SHA1):
        raise ValueError("SOURCE_IDENTITY_FAILED: pinned SmileStyle original required")

    lines = raw.decode("utf-8-sig").splitlines()
    if lines[0].split("\t") != EXPECTED_HEADER:
        raise ValueError("HEADER_MISMATCH")
    pairs = []
    separators = 0
    groups = 0
    was_boundary = True
    for row in lines[1:]:
        if not row.strip():
            separators += 1
            was_boundary = True
            continue
        fields = row.split("\t")
        if len(fields) != 17 or not fields[0] or not fields[1]:
            raise ValueError("STYLE_PAIR_MISSING_OR_COLUMN_DRIFT")
        if was_boundary:
            groups += 1
            was_boundary = False
        pairs.append((fields[0], fields[1]))
    if (len(pairs), separators, groups) != (3470, 235, 236):
        raise ValueError("OBSERVED_TSV_BLOCKS_DISAGREE")

    changed, similarity, numeric_changed = [], [], 0
    for formal, informal in pairs:
        matcher = difflib.SequenceMatcher(
            None, formal.split(), informal.split(), autojunk=False
        )
        changed.append(sum(
            max(i2 - i1, j2 - j1)
            for op, i1, i2, j1, j2 in matcher.get_opcodes()
            if op != "equal"
        ))
        similarity.append(
            difflib.SequenceMatcher(None, formal, informal, autojunk=False).ratio()
        )
        numeric_changed += NUMBER.findall(formal) != NUMBER.findall(informal)
    return {
        "schema": "ksgt.g10p2.r5f.smile-style-descriptive-operations.v1",
        "sourceSHA256": sha256,
        "sourceGitBlobSHA1": git_sha1,
        "license": "CC BY-NC 4.0",
        "upstreamREADMEClaimedConversations": 235,
        "observedDelimiterDefinedNonemptyBlocks": groups,
        "separatorRows": separators,
        "pairedUtterances": len(pairs),
        "identicalPairs": sum(n == 0 for n in changed),
        "atMostOneWhitespaceEditToken": sum(n <= 1 for n in changed),
        "atMostTwoWhitespaceEditTokens": sum(n <= 2 for n in changed),
        "atLeastFourWhitespaceEditTokens": sum(n >= 4 for n in changed),
        "meanCharacterSimilarity": round(statistics.mean(similarity), 5),
        "medianCharacterSimilarity": round(statistics.median(similarity), 5),
        "numericTokenSequenceMismatches": numeric_changed,
        "authority": "DESCRIPTIVE_DIFF_ONLY_NOT_A_NATIVE_KOREAN_QUALITY_LABEL",
        "note": (
            "The token count sums max(deleted, inserted) in each difflib "
            "whitespace-segment opcode, not linguistic morphemes. "
            "The 236 contiguous blocks are not independently verified dialogue IDs. "
            "A later human rewrite is not automatically better Korean."
        ),
    }


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python r5f_human_style_operation_census.py PINNED_SMILESTYLE.tsv")
    print(json.dumps(analyze(Path(sys.argv[1]).read_bytes()), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
