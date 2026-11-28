#!/usr/bin/env python3
"""G10-P2 source-work leakage preflight. Never claims inferred independence or human gold.

Input JSON: records [{item_id, work_id, author_id?, raw_sha256?, parent_item_ids?,
                       rights, exposed, revision_role}]. Data contains identifiers only, no text.
"""
import hashlib
import json
from collections import defaultdict
from pathlib import Path


class AdmissionError(ValueError):
    pass


def _hash(s):
    return hashlib.sha256(s.encode('utf-8')).hexdigest()


def allocate(records, seed='ksgt-r5n-preflight', author_disjoint=True):
    if not isinstance(records, list):
        raise AdmissionError('RECORDS_NOT_LIST')
    index = {}
    for r in records:
        if not isinstance(r, dict) or not isinstance(r.get('item_id'), str) or not r['item_id']:
            raise AdmissionError('BAD_ITEM_ID')
        if r['item_id'] in index:
            raise AdmissionError('DUPLICATE_ITEM_ID:' + r['item_id'])
        if r.get('parent_item_ids') is not None and (not isinstance(r['parent_item_ids'], list) or not all(isinstance(x, str) and x for x in r['parent_item_ids'])):
            raise AdmissionError('INVALID_PARENT_SET')
        index[r['item_id']] = r
    root = {id_: id_ for id_ in index}

    def find(x):
        while root[x] != x:
            root[x] = root[root[x]]
            x = root[x]
        return x

    def union(a, b):
        x, y = find(a), find(b)
        if x != y:
            root[max(x, y)] = min(x, y)

    by_work = {}
    by_sha = {}
    by_author = {}
    holds = {}
    for id_, r in index.items():
        reasons = []
        work = r.get('work_id')
        if not isinstance(work, str) or not work.strip():
            reasons.append('WORK_ID_UNVERIFIED')
        else:
            if work in by_work:
                union(id_, by_work[work])
            by_work[work] = id_
        h = r.get('raw_sha256')
        if h is not None:
            if not isinstance(h, str) or len(h) != 64 or any(c not in '0123456789abcdef' for c in h):
                raise AdmissionError('BAD_SHA256')
            if h in by_sha:
                union(id_, by_sha[h])
            by_sha[h] = id_
        for p in r.get('parent_item_ids') or []:
            if p not in index:
                reasons.append('UNRESOLVED_PARENT:' + p)
            else:
                union(id_, p)
        if author_disjoint:
            author = r.get('author_id')
            if not isinstance(author, str) or not author.strip():
                reasons.append('AUTHOR_ID_UNVERIFIED')
            else:
                if author in by_author:
                    union(id_, by_author[author])
                by_author[author] = id_
        if r.get('rights') != 'APPROVED':
            reasons.append('RIGHTS_UNVERIFIED')
        if not isinstance(r.get('exposed'), bool):
            reasons.append('EXPOSURE_UNVERIFIED')
        elif r['exposed']:
            reasons.append('PREVIOUSLY_EXPOSED')
        if r.get('revision_role') not in ('ORIGINAL', 'EDITED'):
            reasons.append('REVISION_ROLE_UNVERIFIED')
        holds[id_] = reasons
    groups = defaultdict(list)
    for id_ in sorted(index):
        groups[find(id_)].append(id_)
    output = []
    for items in groups.values():
        group_holds = sorted({reason for id_ in items for reason in holds[id_]})
        token = _hash(seed + '|' + '|'.join(sorted(items)))
        pct = int(token[:8], 16) / 0xffffffff
        intended = 'TRAIN' if pct < .70 else ('DEV' if pct < .85 else 'TEST')
        output.append({'component_hash': _hash('|'.join(sorted(items))),
                       'members': items, 'proposed_partition': intended if not group_holds else 'QUARANTINE',
                       'hold_reasons': group_holds})
    output.sort(key=lambda g: g['component_hash'])
    return {'schema': 'ksgt.g10p2.r5n.work-leakage-preflight.v1',
            'status': 'PROVISIONAL_NO_INDEPENDENCE_CERTIFICATE',
            'author_disjoint_requested': author_disjoint,
            'records_seen': len(records), 'components': output,
            'quarantined_components': sum(g['proposed_partition'] == 'QUARANTINE' for g in output),
            'independence_claim': False,
            'warning': 'Explicit IDs/group evidence are caller-asserted, not independently verified; near-duplicates and cross-work adaptations require external audit.'}


def main():
    import argparse
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input', required=True)
    p.add_argument('--seed', default='ksgt-r5n-preflight')
    args = p.parse_args()
    records = json.loads(Path(args.input).read_text(encoding='utf-8'))
    print(json.dumps(allocate(records, args.seed), ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
