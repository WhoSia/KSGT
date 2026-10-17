"""Replay unchanged R3 typed inference after detecting a result-field adapter error.

The original frozen checkpoint remains immutable. This sidecar changes only
the recorded presence bit, from the actual selected_global_span field.
"""
import hashlib
import json
import pathlib
import sqlite3
import sys

ROOT = pathlib.Path('C:/KSGT_SERVER')
PRIOR = ROOT / '70_RUNS/p62_r4_r3_20261013'
RUN = ROOT / '70_RUNS/p62_r4_r5_20261014'
OUT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'
sys.path[:0] = [str(PRIOR / 'baseline_code')]
import p62_reference as ref
import p62_r3_typed_inference as typed
import p62_r3_span_admission as admission


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    declaration = json.loads((OUT / 'FROZEN_R5_PREDECLARATION.json').read_text())
    old = sqlite3.connect((RUN / 'R5_FROZEN_TRANSFER.private.sqlite').as_uri()+'?mode=ro', uri=True)
    source = sqlite3.connect((RUN / 'UPSTREAM_CUSTODY.private.sqlite').as_uri()+'?mode=ro', uri=True)
    if old.execute('pragma quick_check').fetchone()[0] != 'ok':
        raise ValueError('Original frozen checkpoint failed integrity')
    if (sha(PRIOR / 'baseline_code/p62_r3_typed_inference.py') !=
            declaration['code_sha256']['p62_r3_typed_inference.py']):
        raise ValueError('Frozen R3 typed implementation changed')
    destination = RUN / 'R5_R3_TYPED_CORRECTION.private.sqlite'
    db = sqlite3.connect(destination)
    db.executescript('create table if not exists decisions(strict text primary key,payload text);'
                     'create table if not exists seal(key text primary key,value text);')
    seal = declaration['cohort_manifest_sha256']
    present = db.execute("select value from seal where key='manifest'").fetchone()
    if present and present[0] != seal:
        raise ValueError('Correction restart changed frozen population')
    db.execute("insert or ignore into seal values('manifest',?)", (seal,))
    db.commit()
    new = 0
    for strict, old_payload in old.execute('select strict,payload from results order by strict'):
        if db.execute('select 1 from decisions where strict=?',(strict,)).fetchone():
            continue
        forms_raw = source.execute('select forms from docs where strict=?',(strict,)).fetchone()
        if not forms_raw:
            raise ValueError('Frozen original source structure missing')
        forms = json.loads(forms_raw[0])
        old_rows = json.loads(old_payload)
        corrected = []
        for unit, form in enumerate(forms):
            for match in ref.TARGET.finditer(form):
                target = {'unit': unit, 'start': match.start(), 'end': match.end(), 'observed': True}
                original = old_rows[len(corrected)]
                if original['target'] != target:
                    raise ValueError('Frozen target span mismatch')
                result = typed.infer(forms,target)
                gate = admission.admit(forms,target,result)
                if result['status'] != original['r3_typed']['status'] or gate['status'] != original['r3_typed']['admission']:
                    raise ValueError('Frozen R3 typed decision or admission changed')
                corrected.append({'proposal': result['selected_global_span'] is not None,
                                  'admission': gate['status']})
        if len(corrected) != len(old_rows):
            raise ValueError('Frozen target denominator mismatch')
        db.execute('insert into decisions values(?,?)', (strict,json.dumps(corrected)))
        new += 1
        if new % 25 == 0:
            db.commit()
    db.commit()
    count, proposals = 0, 0
    for payload, in db.execute('select payload from decisions'):
        items = json.loads(payload)
        count += len(items)
        proposals += sum(x['proposal'] and x['admission']=='VERIFIED_SOURCE_FRAGMENT_ONLY' for x in items)
    print(json.dumps({'status':'VERIFIED','new_structures':new,
          'structures':db.execute('select count(*) from decisions').fetchone()[0],
          'targets':count,'admitted_r3_typed_proposals':proposals,
          'original_frozen_checkpoint_preserved':True,
          'root_cause':'Original adapter read selected instead of selected_global_span'}), flush=True)


if __name__ == '__main__':
    main()

