"""Independent read-only verification of the sealed private R5 export."""
import hashlib
import json
import pathlib
import sqlite3

ROOT=pathlib.Path('C:/KSGT_SERVER')
OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'


def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda:stream.read(4*1024*1024),b''):
            h.update(block)
    return h.hexdigest()


def main():
    manifest=json.loads((OUT/'SHA256_MANIFEST.json').read_text())
    expected={row['path']:row for row in manifest['files']}
    actual={x.relative_to(OUT).as_posix() for x in OUT.rglob('*')
            if x.is_file() and x.name!='SHA256_MANIFEST.json'}
    if set(expected)!=actual or len(expected)!=manifest['count']:
        raise ValueError('Export membership mismatch')
    for name,row in expected.items():
        path=OUT/name
        if path.stat().st_size!=row['bytes'] or sha(path)!=row['sha256']:
            raise ValueError('Export digest mismatch: '+name)
    for path in (OUT/'private_run_evidence').glob('*.sqlite'):
        db=sqlite3.connect(path.as_uri()+'?mode=ro',uri=True)
        if db.execute('pragma quick_check').fetchone()[0]!='ok':
            raise ValueError('Copied SQLite integrity mismatch: '+path.name)
    receipt=json.loads((OUT/'RUN_RECEIPT.json').read_text())
    if receipt['checkpoint_census']['frozen_structures']!=273 or receipt['reserved_late_inference']!=0:
        raise ValueError('Receipt denominator or late-split assertion mismatch')
    print(json.dumps({'status':'VERIFIED','hash_entries':len(expected),
                      'copied_sqlite_checked':len(list((OUT/'private_run_evidence').glob('*.sqlite'))),
                      'mismatches':0,'sha256_manifest':sha(OUT/'SHA256_MANIFEST.json')}),flush=True)


if __name__=='__main__':main()

