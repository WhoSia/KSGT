#!/usr/bin/env python3
"""Independent JS->Python/SQLite SHA and source-family split check (synthetic only)."""
import copy
import hashlib
import json
import sqlite3
import sys

def sha_payload(row):
    data={k:v for k,v in row.items() if k!='sha256'}
    return hashlib.sha256(json.dumps(data,ensure_ascii=False,separators=(',',':')).encode('utf-8')).hexdigest()

def fact_fingerprint(text):
    head,suffix=text.split('이 모임에 참석했다.')
    if suffix or '명과 ' not in head:
        raise ValueError('UNRECOGNIZED_SOURCE_FACT')
    fragments=head.split('명과 ')
    groups=[p+'명' for p in fragments[:-1]]+[fragments[-1]]
    return hashlib.sha256(json.dumps(sorted(groups),ensure_ascii=False,separators=(',',':')).encode()).hexdigest()

def audit(document):
    if document.get('schema')!='ksgt.p59.dataset.v05' or document.get('humanPreference')!='NOT_OBSERVED':
        raise ValueError('SCHEMA_OR_AUTHORITY')
    rows=document['rows']
    db=sqlite3.connect(':memory:')
    db.execute('CREATE TABLE rows (id TEXT PRIMARY KEY, family TEXT NOT NULL, scene TEXT NOT NULL, fingerprint TEXT NOT NULL, split TEXT NOT NULL, digest TEXT UNIQUE NOT NULL)')
    for row in rows:
        if sha_payload(row)!=row['sha256']:
            raise ValueError('HASH_MISMATCH')
        if row['provenance']['humanGold'] is not False or row['splitAuthority']!='SYNTHETIC_FAMILY_ONLY':
            raise ValueError('GOLD_AUTHORITY_ESCALATION')
        if row['intent']['authority']!='AUTHOR_DECLARED_ONLY':
            raise ValueError('INTENT_AUTHORITY_ESCALATION')
        if row['readerState']['authority']!='EXPERIMENTAL_DECLARATION_NOT_HUMAN_INFERENCE':
            raise ValueError('READER_AUTHORITY_ESCALATION')
        db.execute('INSERT INTO rows VALUES (?,?,?,?,?,?)',(row['id'],row['source']['family'],row['source']['sceneId'],
                fact_fingerprint(row['source']['fact']),row['split'],row['sha256']))
    for key in ('family','scene','fingerprint'):
        if db.execute(f'SELECT {key} FROM rows GROUP BY {key} HAVING COUNT(DISTINCT split)>1').fetchall():
            raise ValueError('SOURCE_FAMILY_LEAK_'+key)
    splits=dict(db.execute('SELECT split, COUNT(*) FROM rows GROUP BY split'))
    if splits!={'development':16,'validation':8,'synthetic_holdout':8}:
        raise ValueError('SPLIT_COUNTS')
    template_families={r['templateFamily'] for r in rows}
    return {'audit':'PASS','rows':len(rows),'scenes':len(set(r['source']['sceneId'] for r in rows)),
            'splits':splits,'distinct_templates':len(template_families),
            'authority':'SYNTHETIC_TEMPLATE_SHARED_ACROSS_SPLITS_NO_HUMAN_GOLD'}

def self_test(document):
    report=audit(document)
    tampered=copy.deepcopy(document)
    tampered['rows'][0]['split']='validation'
    tampered['rows'][0]['sha256']=sha_payload(tampered['rows'][0])
    try:audit(tampered)
    except ValueError as e:
        if not str(e).startswith('SOURCE_FAMILY_LEAK_'):
            raise
    else:raise AssertionError('False split passed')
    alias=copy.deepcopy(document)
    alias['rows'][0]['source']['family']='invented-alias'
    alias['rows'][0]['source']['sceneId']='invented-id'
    alias['rows'][0]['split']='validation'
    alias['rows'][0]['sha256']=sha_payload(alias['rows'][0])
    try:audit(alias)
    except ValueError as e:
        if str(e)!='SOURCE_FAMILY_LEAK_fingerprint':
            raise
    else:raise AssertionError('Source alias leakage passed')
    return report

if __name__=='__main__':
    print(json.dumps(self_test(json.load(sys.stdin)),sort_keys=True,ensure_ascii=False))
