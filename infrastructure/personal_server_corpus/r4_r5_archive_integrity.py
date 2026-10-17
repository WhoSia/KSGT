"""Fresh SHA-256 verification of all fourteen immutable raw archives."""
import datetime
import hashlib
import json
import pathlib
import time

ROOT = pathlib.Path('C:/KSGT_SERVER')
OUT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda:stream.read(4*1024*1024),b''):
            h.update(block)
    return h.hexdigest()


def main():
    start = time.perf_counter()
    config = json.loads((ROOT/'70_RUNS/corpus_sprint_20261011_main/FROZEN_CONFIG.json').read_text())
    rows = []
    for name, expected in sorted(config['archive_sha256'].items()):
        path = ROOT/'10_INBOX/nikl_legacy_14zip'/name
        actual = sha(path)
        rows.append({'name':name,'bytes':path.stat().st_size,'sha256':actual,'match':actual==expected})
        if actual != expected:
            raise ValueError('Immutable raw archive hash mismatch')
        print(json.dumps({'verified_archives':len(rows)}),flush=True)
    report={'status':'VERIFIED','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'archives':rows,'total_bytes':sum(x['bytes'] for x in rows),
            'elapsed_seconds':time.perf_counter()-start}
    (OUT/'FRESH_RAW_ARCHIVE_INTEGRITY.private.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps({'status':report['status'],'archives':len(rows),'total_bytes':report['total_bytes'],
                      'elapsed_seconds':report['elapsed_seconds']}),flush=True)


if __name__=='__main__':main()

