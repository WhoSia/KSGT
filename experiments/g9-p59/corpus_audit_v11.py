#!/usr/bin/env python3
"""Independent metadata-only audit for P59 §v1.1. Never reads raw corpus text."""
import json
import sys

def audit(doc):
    if doc.get('schema') != 'ksgt.p59.dataset-authority.v1':
        raise ValueError('INVALID_SCHEMA')
    profiles = doc['profiles']
    assert set(profiles) == {'NIKL_ZA25', 'KOSEND25', 'GOLEM26_KO', 'KOGEM25', 'PARAREVAL25'}
    if doc['observedRawItems'] != 0 or doc['humanKoreanProseGoldCount'] != 0:
        raise ValueError('PROVENANCE_PROMOTION')
    for key, entry in profiles.items():
        if entry['rawLocallyInspected'] is not False:
            raise ValueError('FALSELY_VERIFIED_RAW_' + key)
    nikl = profiles['NIKL_ZA25']
    if nikl['labelKind'] != 'ZERO_ARGUMENT':
        raise ValueError('NIKL_PHENOMENON_DRIFT')
    totals = [sum(member[j] for member in nikl['members']) for j in (1, 2, 3)]
    if totals != [1102, 30346, 62831]:
        raise ValueError('NIKL_COUNTS_DRIFT')
    kosend = profiles['KOSEND25']
    if kosend['labelWarning'] != 'MIXED_HUMAN_PILOT_AND_LLM_ANNOTATION_UNMAPPED':
        raise ValueError('KOSEND_HUMAN_GOLD_LAUNDERING')
    if len(kosend['files']) != 3:
        raise ValueError('KOSEND_PARTITION_COUNT')
    golem = profiles['GOLEM26_KO']
    if golem['splitCounts'] != {'train': 24, 'dev': 3, 'test': 3}:
        raise ValueError('GOLEM_SPLIT_COUNT_DRIFT')
    if golem['license'] != 'CC-BY-NC-4.0_REPOSITORY_SCOPE':
        raise ValueError('GOLEM_LICENSE_DRIFT')
    return {'audit': 'PASS', 'profiles': len(profiles), 'NIKL': dict(zip(('documents', 'sentences', 'ellipsis_slots'), totals)),
            'GOLEM_Korean_story_counts': golem['splitCounts'],
            'raw_ingestion': 0, 'independent_Korean_prose_gold': 0}

def test(doc):
    result = audit(doc)
    def poison(path, val):
        cloned = json.loads(json.dumps(doc))
        cur = cloned
        for k in path[:-1]: cur = cur[k]
        cur[path[-1]] = val
        try: audit(cloned)
        except (ValueError, AssertionError): pass
        else: raise AssertionError('FAILED_NEGATIVE_CONTROL: ' + '.'.join(path))
    poison(['profiles', 'KOSEND25', 'labelWarning'], 'ALL_HUMAN')
    poison(['profiles', 'GOLEM26_KO', 'license'], 'CC0')
    poison(['profiles', 'NIKL_ZA25', 'members'], [['fake', 1, 2, 3]])
    poison(['humanKoreanProseGoldCount'], 500)
    result['negativeControls'] = 4
    return result

if __name__ == '__main__':
    print(json.dumps(test(json.load(sys.stdin)), ensure_ascii=False, sort_keys=True))
