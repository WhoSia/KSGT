#!/usr/bin/env python3
"""Inspect a KoLLA-like M2 ZIP without exporting any learner text.

Output is aggregate metadata only. Do not infer essay IDs or reader preferences.
"""
import argparse
import collections
import hashlib
import json
import re
import zipfile
from pathlib import Path

M2 = 'KoLLA_multi-refs.m2'
EDIT_PATTERN = re.compile(r'^A\s+(\-?\d+)\s+(\-?\d+)\|\|\|(.+?)\|\|\|(.*?)\|\|\|.*?\|\|\|.*?\|\|\|([^|]+)$')


def sha(b):
    return hashlib.sha256(b).hexdigest()


def corrected(source, edits):
    """Reconstruct one annotation's surface with strict no-overlap edits."""
    toks = source.split()
    accepted = []
    for a, b, typ, replacement in edits:
        if typ == 'noop':
            if a != -1 or b != -1:
                raise ValueError('NOOP_OFFSETS')
            continue
        if a < 0 or b < a or b > len(toks):
            raise ValueError('OFFSET_RANGE')
        accepted.append((a, b, replacement))
    # For insertion, two same-anchor edits are ambiguous; never guess ordering.
    occupied = sorted(accepted)
    for i in range(1, len(occupied)):
        old, cur = occupied[i - 1], occupied[i]
        if old[1] > cur[0] or (old[0] == old[1] == cur[0] == cur[1]):
            raise ValueError('OVERLAPPING_EDITS')
    for a, b, replacement in sorted(accepted, key=lambda p: (p[0], p[1]), reverse=True):
        toks[a:b] = replacement.split() if replacement and replacement != '-NONE-' else []
    return ' '.join(toks)


def parse_m2(m2):
    blocks = [block for block in m2.decode('utf-8-sig').split('\n\n') if block.strip()]
    audit = collections.Counter()
    types = collections.Counter()
    annotators = collections.Counter()
    invalid = collections.Counter()
    paired = collections.Counter()
    for block in blocks:
        lines = block.splitlines()
        if sum(line.startswith('S ') for line in lines) != 1 or not lines[0].startswith('S '):
            raise ValueError('MALFORMED_SOURCE_BLOCK')
        source = lines[0][2:]
        edits = collections.defaultdict(list)
        for line in lines[1:]:
            if not line.strip():
                continue
            match = EDIT_PATTERN.fullmatch(line)
            if not match:
                raise ValueError('MALFORMED_EDIT_ROW')
            a, b, typ, replacement, who = match.groups()
            a, b = int(a), int(b)
            if who not in ('0', '1'):
                raise ValueError('UNKNOWN_ANNOTATOR')
            edits[who].append((a, b, typ, replacement))
            types[typ] += 1
            audit['all_annotations'] += 1
            audit['non_noop_annotations'] += typ != 'noop'
        audit['source_blocks'] += 1
        for who in edits:
            annotators[who] += 1
        if set(edits) == {'0', '1'}:
            paired['paired'] += 1
            try:
                a = corrected(source, edits['0'])
                b = corrected(source, edits['1'])
            except ValueError as e:
                invalid[str(e)] += 1
                continue
            if a == b:
                paired['exact_agreement'] += 1
                if a == ' '.join(source.split()):
                    paired['both_keep'] += 1
                else:
                    paired['same_change'] += 1
            else:
                paired['disagree'] += 1
                pa = a == ' '.join(source.split())
                pb = b == ' '.join(source.split())
                if pa:
                    paired['annotator_0_keep_only'] += 1
                elif pb:
                    paired['annotator_1_keep_only'] += 1
                else:
                    paired['different_changes'] += 1
        elif set(edits) == {'0'}:
            paired['unpaired_annotator_1_missing'] += 1
        else:
            raise ValueError('INCOMPLETE_ANNOTATOR_0')
    return {
        'source_blocks': audit['source_blocks'],
        'all_annotations': audit['all_annotations'],
        'non_noop_annotations': audit['non_noop_annotations'],
        'annotator_presence': dict(sorted(annotators.items())),
        'paired': dict(sorted(paired.items())),
        'unreconstructed_pairs_by_reason': dict(sorted(invalid.items())),
        'distinct_edit_types': len(types),
    }


def inspect(path):
    raw = Path(path).read_bytes()
    with zipfile.ZipFile(path) as z:
        if z.testzip() is not None:
            raise ValueError('ZIP_CRC_FAILURE')
        if M2 not in z.namelist():
            raise ValueError('M2_MISSING')
        bytes_ = z.read(M2)
        contents = parse_m2(bytes_)
        return {'schema': 'ksgt.g10p2.r5o.kolla-aggregate.v1',
                'zip_sha256': sha(raw), 'zip_bytes': len(raw),
                'm2_sha256': sha(bytes_), 'm2_bytes': len(bytes_),
                'zip_entries': len(z.namelist()),
                **contents,
                'document_boundary': 'UNVERIFIED',
                'rights_for_public_learner_text': 'NOT_GRANTED_BY_THIS_AUDIT',
                'native_korean_prose_quality_gold': False,
                'source_work_disjoint_certified': False,
                'model_calls': 0,
                'raw_text_exported': False}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--zip', required=True)
    p.add_argument('--out', help='aggregates only; never outputs learner text')
    args = p.parse_args()
    data = inspect(args.zip)
    s = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True)
    if args.out:
        out = Path(args.out)
        if out.exists() or out.resolve() == Path(args.zip).resolve():
            raise ValueError('OUTPUT_MUST_BE_NEW_AND_NOT_SOURCE')
        out.write_text(s+'\n', encoding='utf-8')
    print(s)

if __name__ == '__main__':
    main()
