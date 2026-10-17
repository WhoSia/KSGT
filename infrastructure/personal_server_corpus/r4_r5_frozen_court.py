"""Freeze audited source components and run the machine-only mechanism court."""
import argparse
import datetime
import hashlib
import json
import pathlib
import shutil
import sqlite3
import sys
import time

ROOT = pathlib.Path('C:/KSGT_SERVER')
PRIOR = ROOT / '70_RUNS/p62_r4_r3_20261013'
RUN = ROOT / '70_RUNS/p62_r4_r5_20261014'
OUT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'
sys.path[:0] = [str(PRIOR / 'baseline_code'), str(PRIOR / 'code')]
import p62_reference as ref
import p62_r3_typed_inference as typed
import p62_r3_span_admission as typed_admission
import p62_r4_discourse as r4
import p62_r4_guarded_v3 as v3
from p62_r4_admission_v3 import admit_graph
import p62_r4_r3_transfer_gate as gate
import p62_r4_r5_mechanisms as mechanisms
from p62_r4_r3_source_witness import strict as strict_surface

SEED = 'P62-R4-R5-preoutcome-v1'
CODE = ['p62_reference.py', 'p62_r3_typed_inference.py',
        'p62_r3_span_admission.py', 'p62_r4_discourse.py',
        'p62_r4_group_algebra.py', 'p62_r4_guarded_v3.py',
        'p62_r4_admission_v3.py', 'p62_r4_r3_transfer_gate.py',
        'p62_r4_r5_mechanisms.py', 'r4_r5_frozen_court.py']


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def read_db(name):
    path = RUN / name
    return sqlite3.connect(path.as_uri() + '?mode=ro', uri=True)


def read_report(name):
    return json.loads((OUT / name).read_text(encoding='utf-8'))


def freeze():
    raw = read_report('RAW_OCCURRENCE_WITNESS_REPORT.json')
    passages = read_report('INDEPENDENT_TEXT_DEPENDENCY_AUDIT.json')
    custody = read_report('SOURCE_CUSTODY_CLOSURE.private.json')
    inventory = read_report('SOURCE_OPPORTUNITY_CENSUS.private.json')
    if any(r['status'] != 'VERIFIED' for r in (raw, passages, custody)):
        raise ValueError('Original source audit incomplete')
    if inventory['status'] != 'EXECUTED' or not inventory['all_original_raw_members_reparsed']:
        raise ValueError('Full original-source inventory incomplete')
    c = read_db('UPSTREAM_CUSTODY.private.sqlite')
    w = read_db('RAW_OCCURRENCE_WITNESSES.private.sqlite')
    l = read_db('TEXT_DEPENDENCY_LINKS.private.sqlite')
    targets = c.execute('select strict,container,year,excluded from docs where targets>0').fetchall()
    expected = dict(c.execute('select candidate,count(*) from aliases group by candidate'))
    actual = dict(w.execute('select candidate,count(*) from witnesses group by candidate'))
    unknown = set(custody['unwitnessed_cross_id_candidate_quarantines'])
    unresolved = {x[0] for x in w.execute(
        "select distinct candidate from witnesses where relation in ('NORMALIZED_ONLY','CROSS_ID_VERSION_UNRESOLVED')")}
    records = []
    by_id = {}
    for strict, container, year, excluded in targets:
        complete = expected.get(strict) == actual.get(strict) and strict not in unknown | unresolved
        reasons = set((excluded or '').split(','))
        exposed = bool(reasons & {'strict', 'flat', 'doc_id', 'file_id', 'R4_R2_EXPOSED'})
        row = {'id': strict, 'container_sha256': hashlib.sha256(container.encode()).hexdigest(),
               'publication_year': year, 'publication_year_authority': 'DOCUMENT_METADATA' if year else 'UNKNOWN',
               'exposed': exposed, 'lineage_complete': complete, 'human_ground_truth': None}
        records.append(row)
        by_id[strict] = row
    links = []
    seen = set()
    for left, right, kind, exposed in l.execute('select left_id,right_id,kind,exposed from links order by left_id,right_id,kind'):
        if left == right:
            if left in by_id:
                by_id[left]['exposed'] = True
            continue
        if right not in by_id:
            other = {'id': right, 'container_sha256': None, 'publication_year': None,
                     'publication_year_authority': 'UNKNOWN', 'exposed': bool(exposed),
                     'lineage_complete': True, 'human_ground_truth': None}
            by_id[right] = other
            records.append(other)
        edge = (min(left, right), max(left, right), kind)
        if edge not in seen:
            seen.add(edge)
            links.append({'left': left, 'right': right, 'kind': kind, 'witness_verified': True})
    split = gate.audit_transfer_split(records, links, seed=SEED)
    declaration = {
        'status': 'PLANNED', 'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'reference_head': '13255ec9a77c8bd4e3091c6223ab379a92931266',
        'seed': SEED, 'source_sha256': {name: sha(RUN / name) for name in
            ['SOURCE_OPPORTUNITIES.private.sqlite', 'UPSTREAM_CUSTODY.private.sqlite',
             'RAW_OCCURRENCE_WITNESSES.private.sqlite', 'TEXT_DEPENDENCY_LINKS.private.sqlite']},
        'audit_report_sha256': {name: sha(OUT / name) for name in
            ['SOURCE_OPPORTUNITY_PREDECLARATION.private.json', 'SOURCE_OPPORTUNITY_CENSUS.private.json',
             'RAW_OCCURRENCE_WITNESS_REPORT.json', 'INDEPENDENT_TEXT_DEPENDENCY_AUDIT.json',
             'SOURCE_CUSTODY_CLOSURE.private.json']},
        'code_sha256': {name: sha((pathlib.Path(__file__).parent if name in
            ('p62_r4_r5_mechanisms.py', 'r4_r5_frozen_court.py') else
            PRIOR / ('baseline_code' if name.startswith('p62_reference') or name.startswith('p62_r3_') or
                    name.startswith('p62_r4_discourse') or name.startswith('p62_r4_group') or
                    name.startswith('p62_r4_guarded') or name.startswith('p62_r4_admission') else 'code')) / name)
            for name in CODE},
        'cohort_manifest_sha256': split['manifest_sha256'],
        'experimental_unit': 'Exact original source structure; source-dependency components never cross splits',
        'selection': 'First unused nonexposed annual JSON member per first-document metadata year; 70/20/10 component hash split',
        'estimand': 'Paired document-equal admitted source-fragment proposal rate, each mechanism minus frozen guarded v3',
        'arms': ['R3_TYPED', 'R4_CONSTRAINED', 'GUARDED_V3', 'M1_DESCRIPTOR_SURFACE',
                 'M2_PARTICLE_ROLE_PROXY', 'M3_DESCRIPTOR_AND_ROLE', 'M4_STAGED_CAUSE'],
        'controls': ['Future suffix append without altering target-local demand', 'Source span admission replay',
                     'Invalid quotation cause chain', 'Descriptor and particle ablations'],
        'windows': 'Unchanged R3/R4/v3 defaults; 1024-codepoint prefix, same original unit and target offset',
        'exclusion': 'All audited prior exact/source dependencies, incomplete lineage, normalized-only or revised unresolved',
        'uncertainty': 'Document and source-component clustered paired bootstrap; container count explicitly reported',
        'reserved_late_inference': 'FORBIDDEN', 'human_ground_truth': None,
        'claim_ceiling': 'Machine proposals and surface evidence only; no referential semantic accuracy'}
    p = OUT / 'FROZEN_R5_PREDECLARATION.json'
    private = OUT / 'FROZEN_R5_COMPONENTS.private.json'
    if p.exists():
        old = json.loads(p.read_text(encoding='utf-8'))
        declaration['utc'] = old['utc']
        if old != declaration:
            raise ValueError('Frozen source, code or estimand changed')
    else:
        private.write_text(json.dumps({'records': records, 'links': links, 'manifest': split}, indent=2), encoding='utf-8')
        p.write_text(json.dumps(declaration, indent=2), encoding='utf-8')
    print(json.dumps({'coverage_status': split['coverage_status'],
        'splits': {k: {f: x[f] for f in x if f != 'tokens'} for k, x in split['by_split'].items()},
        'edge_count': len(links)}), flush=True)
    return split, declaration


def court(limit):
    split, declaration = freeze()
    if split['coverage_status'] != 'MACHINE_TRANSFER_COVERAGE_GATE_PASSED':
        raise RuntimeError('Frozen-transfer source diversity gate HOLD')
    rows = read_db('UPSTREAM_CUSTODY.private.sqlite').execute(
        'select strict,member,ordinal,container,year,units,targets,forms from docs order by member,ordinal').fetchall()
    selected = set(split['by_split']['frozen_transfer']['tokens'])
    rows = [x for x in rows if x[0] in selected]
    members = sorted({x[1] for x in rows})
    db = sqlite3.connect(RUN / 'R5_FROZEN_TRANSFER.private.sqlite')
    db.executescript('create table if not exists results(strict text primary key, member text, container text, year integer, units integer, targets integer, payload text);'
                     'create table if not exists seal(key text primary key,value text);')
    seal = json.dumps(declaration, sort_keys=True)
    existing = db.execute("select value from seal where key='declaration'").fetchone()
    if existing and existing[0] != seal:
        raise ValueError('Restart declaration mismatch')
    db.execute("insert or ignore into seal values('declaration',?)", (seal,))
    db.commit()
    main = sqlite3.connect((ROOT / '70_RUNS/corpus_sprint_20261011_main/corpus.sqlite').as_uri() + '?mode=ro', uri=True)
    config = json.loads((ROOT / '70_RUNS/corpus_sprint_20261011_main/FROZEN_CONFIG.json').read_text())
    member_archive = dict(main.execute('select key,archive from members'))
    start = time.perf_counter()
    processed = 0
    for strict, member, ordinal, container, year, units, targets, raw in rows:
        if limit and member not in members[:limit]:
            continue
        if db.execute('select 1 from results where strict=?', (strict,)).fetchone():
            continue
        if shutil.disk_usage(ROOT).free < 60 * 1024 ** 3:
            raise RuntimeError('System disk reserve HOLD')
        forms = json.loads(raw)
        identity = {'strict_structure': strict, 'member_key': member,
                    'archive_sha256': config['archive_sha256'][member_archive[member]],
                    'document_ordinal': ordinal}
        decisions = []
        for i, form in enumerate(forms):
            for match in ref.TARGET.finditer(form):
                target = {'unit': i, 'start': match.start(), 'end': match.end(), 'observed': True}
                t0 = time.perf_counter()
                tr = typed.infer(forms, target)
                ta = typed_admission.admit(forms, target, tr)
                t1 = time.perf_counter()
                rr = r4.infer(forms, target, use_target_constraints=True)
                ra = admit_graph(forms, target, rr)
                t2 = time.perf_counter()
                vr = v3.infer(forms, target, identity)
                t3 = time.perf_counter()
                new = mechanisms.infer(forms, target, identity, vr)
                t4 = time.perf_counter()
                future = forms + ['미래 교사 9명이 등장했다.']
                counterfactual_identity = dict(identity, strict_structure=strict_surface(future))
                future_v3 = v3.infer(future, target, counterfactual_identity)
                future_new = mechanisms.infer(future, target, counterfactual_identity, future_v3)
                future_control = {
                    'authored_synthetic_future_only': True,
                    'v3_proposal_or_status_changed': (vr['status'], (vr.get('selected') or {}).get('id')) !=
                                                     (future_v3['status'], (future_v3.get('selected') or {}).get('id')),
                    'r5_source_evidence_changed': new['source_evidence'] != future_new['source_evidence'],
                    'r5_decision_changed': {key: (new[key]['status'], new[key]['selected']) !=
                         (future_new[key]['status'], future_new[key]['selected'])
                         for key in ('m1_descriptor','m2_particle_role','m3_descriptor_and_role','m4_staged')},
                }
                decisions.append({'target': target, 'human_ground_truth': None,
                    'r3_typed': {'status': tr['status'], 'proposal': tr.get('selected') is not None,
                                 'admission': ta['status'], 'seconds': t1-t0},
                    'r4': {'status': rr['status'], 'proposal': rr.get('selected') is not None,
                           'admission': ra['status'], 'seconds': t2-t1},
                    'v3': {'status': vr['status'], 'proposal': vr.get('selected') is not None,
                           'admission': vr['source_admission']['status'], 'seconds': t3-t2},
                    'r5': new, 'r5_seconds': t4-t3, 'future_suffix_control': future_control})
        if len(decisions) != targets:
            raise ValueError('Frozen target denominator changed')
        db.execute('insert into results values(?,?,?,?,?,?,?)',
                   (strict, member, container, year, units, targets, json.dumps(decisions, ensure_ascii=False)))
        processed += 1
        if processed % 25 == 0:
            db.commit()
            print(json.dumps({'new_structures': processed, 'elapsed_seconds': time.perf_counter()-start}), flush=True)
    db.commit()
    print(json.dumps({'status': 'EXECUTED', 'new_structures': processed,
         'census': db.execute('select count(*),sum(targets) from results').fetchone(),
         'elapsed_seconds': time.perf_counter()-start}), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--freeze-only', action='store_true')
    parser.add_argument('--members', type=int, default=0)
    args = parser.parse_args()
    freeze() if args.freeze_only else court(args.members)

