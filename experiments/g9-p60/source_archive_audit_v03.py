#!/usr/bin/env python3
"""G9-P60-P2 optional private P53 ZIP witness; public CI runs metadata-only.
No raw source or model prose leaves stdout. Human style remains unobserved.
"""
import argparse
import copy
import hashlib
import json
import re
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
BRIEF_FILE = HERE.parent / 'g9-p53' / 'krc_v03' / 'new_briefs.json'
EDIT_FILE = HERE / 'provisional_edits_v01.json'
BRIEF_SHA = '722403f11ecdc621c8966e3285184a62e9a945a4263797c9ca107d4d7d948ead'
ZIP_SHA = 'e103185725bbc328dbb13ad90fafa83d9cc4089c8829ad1a78e211045e047d46'
BASE = 'a6edd668bdaa2f35cf38504b27177374d8eb0b95d13d45c92cc2503b40059596'
LABEL = re.compile(r'자료\s+\d+에\s+따르면,?\s*')

def sha(data):
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode('utf8')).hexdigest()

def gate(brief, edits):
    if brief['id'] != 'EX09' or len(brief['facts']) != 5 or '두 상자' not in brief['facts'][0] or '두 상자' not in brief['facts'][2]:
        raise ValueError('SOURCE_FACT_CHANGED')
    if '측정하지 않았다' not in brief['facts'][4]:
        raise ValueError('SOURCE_EPISTEMIC_CHANGED')
    rows = edits['candidates']
    if len(rows) != 2 or len(set(r['candidateId'] for r in rows)) != 2:
        raise ValueError('CANDIDATES_NOT_TWO')
    for r in rows:
        if r['originSourceId'] != 'P53_BRIEF:EX09' or r['componentId'] != 'P53_WORK:EX09' or r['inheritedSplit'] != 'pilot_train':
            raise ValueError('SOURCE_SPLIT_ESCAPE')
        if r['baseParagraphSha256'] != BASE:
            raise ValueError('WRONG_ORIGINAL_PARAGRAPH')
        if r['sourceLicenseAndMeaning'] != 'NOT_ADJUDICATED' or r['humanPreference'] != 'NOT_OBSERVED':
            raise ValueError('UNWITNESSED_GOLD')
    return True

def archive_check(archive, edits):
    raw = Path(archive).read_bytes()
    if sha(raw) != ZIP_SHA:
        raise ValueError('ARCHIVE_SHA_MISMATCH')
    with zipfile.ZipFile(archive) as z:
        packet = json.loads(z.read('outcomes/krc_v03_six_drafts.json'))
    docs = packet['documents']
    if len(docs) != 6 or len({(d['brief'], d['arm']) for d in docs}) != 6 or any(sha(d['output']) != d['text_sha256'] for d in docs):
        raise ValueError('ORIGINAL_OUTPUT_SHA_MISMATCH')
    full = next(d['output'] for d in docs if d['brief'] == 'EX09' and d['arm'] == 'K_TYPED_PLAN')
    paragraph = full.split('\n\n')[0]
    if sha(full) != 'ec903a7fb499b7e53c16ddaa1491174e6651f8f2446af6460f268e0f06e712d2' or sha(paragraph) != BASE:
        raise ValueError('BASE_DRAFT_SHA_MISMATCH')
    if len(LABEL.findall(paragraph)) != 4:
        raise ValueError('UNEXPECTED_SOURCE_LABELS')
    smooth = LABEL.sub('', paragraph)
    drift = smooth.replace('두 상자', '세 상자', 1)
    mapped = {r['editOperator']: r['revisionParagraphSha256'] for r in edits['candidates']}
    if sha(smooth) != mapped['SOURCE_LABEL_REMOVAL'] or sha(drift) != mapped['SOURCE_LABEL_REMOVAL_PLUS_COUNT_DRIFT']:
        raise ValueError('REVISION_BYTES_NOT_REPRODUCED')
    return {'archiveSha256': sha(raw), 'baseParagraphSha256': BASE,
            'reconstructedProvisionalEdits': 2, 'removedInternalLabels': 4,
            'sourceFact': 'TWO_BOXES', 'driftFact': 'THREE_BOXES',
            'countDrift': 'FAIL_AGAINST_FROZEN_AUTHORED_EX09_SOURCE',
            'independentHumanPreference': 'NOT_OBSERVED'}

def tests(brief, edits):
    bad = [
        (lambda b, e: b['facts'].__setitem__(0, '세 상자'), 'SOURCE_FACT_CHANGED'),
        (lambda b, e: b['facts'].__setitem__(4, '빛과 온도는 측정했다.'), 'SOURCE_EPISTEMIC_CHANGED'),
        (lambda b, e: e['candidates'][1].update(inheritedSplit='pilot_dev'), 'SOURCE_SPLIT_ESCAPE'),
        (lambda b, e: e['candidates'][1].update(baseParagraphSha256='0'*64), 'WRONG_ORIGINAL_PARAGRAPH'),
        (lambda b, e: e['candidates'][0].update(humanPreference='PREFERRED'), 'UNWITNESSED_GOLD'),
        (lambda b, e: e['candidates'].pop(), 'CANDIDATES_NOT_TWO'),
    ]
    for damage, expected in bad:
        b, e = copy.deepcopy(brief), copy.deepcopy(edits)
        damage(b, e)
        try:
            gate(b, e)
        except ValueError as exc:
            if str(exc) != expected:
                raise
        else:
            raise AssertionError('MISSING_REJECTION:' + expected)
    return len(bad)

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--archive', type=Path)
    p.add_argument('--self-test', action='store_true')
    a = p.parse_args()
    raw = BRIEF_FILE.read_bytes()
    if sha(raw) != BRIEF_SHA:
        raise ValueError('FROZEN_BRIEF_BYTES_CHANGED')
    brief = next(x for x in json.loads(raw)['briefs'] if x['id'] == 'EX09')
    edits = json.loads(EDIT_FILE.read_text(encoding='utf8'))
    gate(brief, edits)
    output = {'stage': 'G9-P60', 'phase': 'P2', 'schema': 'ksgt.p60.p2.archive-audit.v03',
              'frozenSourceSha256': BRIEF_SHA, 'candidateCount': 2,
              'privateZipBytesChecked': a.archive is not None,
              'humanPreference': 'NOT_OBSERVED', 'test': 'PASS'}
    if a.archive is not None:
        output['archiveWitness'] = archive_check(a.archive, edits)
    if a.self_test:
        output['negativeControls'] = tests(brief, edits)
    print(json.dumps(output, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
