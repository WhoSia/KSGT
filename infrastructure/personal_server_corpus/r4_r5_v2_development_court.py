"""Bounded development-only replay of the post-transfer union guard."""
import argparse
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
sys.path[:0] = [str(RUN),str(PRIOR/'baseline_code'),str(PRIOR/'code')]
import p62_reference as ref
import p62_r4_guarded_v3 as v3
import p62_r4_r5_mechanisms as v1
import p62_r4_r5_mechanisms_v2 as v2


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main(limit):
    frozen = json.loads((OUT/'FROZEN_R5_COMPONENTS.private.json').read_text())
    selected = set(frozen['manifest']['by_split']['machine_development']['tokens'])
    declaration = {'status':'PLANNED','lane':'POST_TRANSFER_MACHINE_DEVELOPMENT_ONLY',
                   'source_split':'machine_development','manifest_sha256':frozen['manifest']['manifest_sha256'],
                   'v1_sha256':sha(RUN/'p62_r4_r5_mechanisms.py'),
                   'v2_sha256':sha(RUN/'p62_r4_r5_mechanisms_v2.py'),
                   'hypothesis':'A possible coordinated union must block M2 individual source-fragment selection',
                   'reserved_late_inference':'FORBIDDEN','human_ground_truth':None}
    path = OUT/'R5_V2_DEVELOPMENT_PREDECLARATION.json'
    if path.exists():
        if json.loads(path.read_text()) != declaration:
            raise ValueError('Development declaration changed')
    else:
        path.write_text(json.dumps(declaration,indent=2),encoding='utf-8')
    source = sqlite3.connect((RUN/'UPSTREAM_CUSTODY.private.sqlite').as_uri()+'?mode=ro',uri=True)
    rows = [x for x in source.execute('select strict,member,ordinal,container,year,targets,forms from docs order by member,ordinal')
            if x[0] in selected]
    members = sorted({x[1] for x in rows})
    db = sqlite3.connect(RUN/'R5_V2_DEVELOPMENT.private.sqlite')
    db.executescript('create table if not exists results(strict text primary key,member text,targets int,v1_m2 int,v2_m2 int,union_holds int);'
                     'create table if not exists seal(key text primary key,value text);')
    seal = json.dumps(declaration,sort_keys=True)
    previous = db.execute("select value from seal where key='declaration'").fetchone()
    if previous and previous[0]!=seal:
        raise ValueError('Development restart declaration mismatch')
    db.execute("insert or ignore into seal values('declaration',?)",(seal,));db.commit()
    start = time.perf_counter()
    new = 0
    config = json.loads((ROOT/'70_RUNS/corpus_sprint_20261011_main/FROZEN_CONFIG.json').read_text())
    main_db = sqlite3.connect((ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite').as_uri()+'?mode=ro',uri=True)
    archives = dict(main_db.execute('select key,archive from members'))
    for strict,member,ordinal,container,year,targets,raw in rows:
        if limit and member not in members[:limit]:
            continue
        if db.execute('select 1 from results where strict=?',(strict,)).fetchone():
            continue
        if shutil.disk_usage(ROOT).free < 60*1024**3:
            raise RuntimeError('Disk reserve HOLD')
        forms = json.loads(raw)
        identity = {'strict_structure':strict,'member_key':member,
                    'archive_sha256':config['archive_sha256'][archives[member]],
                    'document_ordinal':ordinal}
        a=b=holds=seen=0
        for unit, form in enumerate(forms):
            for match in ref.TARGET.finditer(form):
                target = {'unit':unit,'start':match.start(),'end':match.end(),'observed':True}
                graph = v3.infer(forms,target,identity)
                old = v1.infer(forms,target,identity,graph)
                new_result = v2.infer(forms,target,identity,graph)
                if old['m0_v3_selected']!=new_result['m0_v3_selected']:
                    raise ValueError('Frozen v3 choice altered')
                a += old['m2_particle_role']['selected'] is not None
                b += new_result['m2_particle_role']['selected'] is not None
                holds += new_result['frozen_v1_choice_changed_only_by_union_guard']
                seen += 1
        if seen!=targets:
            raise ValueError('Development target count changed')
        db.execute('insert into results values(?,?,?,?,?,?)',(strict,member,targets,a,b,holds))
        new += 1
        if new%50==0:
            db.commit()
    db.commit()
    count = db.execute('select count(*),sum(targets),sum(v1_m2),sum(v2_m2),sum(union_holds) from results').fetchone()
    report = {'status':'EXECUTED','lane':'POST_TRANSFER_MACHINE_DEVELOPMENT_ONLY',
              'new_structures':new,'completed_structures':count[0],
              'targets':count[1],'v1_m2_proposals':count[2],'v2_m2_proposals':count[3],
              'union_guard_holds':count[4], 'elapsed_seconds':time.perf_counter()-start,
              'reserved_late_inference':0,'semantic_accuracy':None,'human_ground_truth':None}
    (OUT/'R5_V2_DEVELOPMENT_RESULT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--members',type=int,default=0)
    args=parser.parse_args()
    main(args.members)

