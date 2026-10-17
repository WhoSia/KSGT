"""Seal the private R5 export with independent checkpoint and hash checks."""
import ctypes
import datetime
import hashlib
import json
import os
import pathlib
import shutil
import sqlite3

ROOT = pathlib.Path('C:/KSGT_SERVER')
RUN = ROOT / '70_RUNS/p62_r4_r5_20261014'
OUT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'
RESERVE = 60 * 1024**3


def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda:stream.read(4*1024*1024),b''):
            h.update(block)
    return h.hexdigest()


def memory():
    class MEMORYSTATUSEX(ctypes.Structure):
        _fields_=[('dwLength',ctypes.c_ulong),('dwMemoryLoad',ctypes.c_ulong),
                 ('ullTotalPhys',ctypes.c_ulonglong),('ullAvailPhys',ctypes.c_ulonglong),
                 ('ullTotalPageFile',ctypes.c_ulonglong),('ullAvailPageFile',ctypes.c_ulonglong),
                 ('ullTotalVirtual',ctypes.c_ulonglong),('ullAvailVirtual',ctypes.c_ulonglong),
                 ('ullAvailExtendedVirtual',ctypes.c_ulonglong)]
    state=MEMORYSTATUSEX();state.dwLength=ctypes.sizeof(MEMORYSTATUSEX)
    if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(state)):
        raise OSError('GlobalMemoryStatusEx failed')
    return {'total_physical_bytes':state.ullTotalPhys,'available_physical_bytes':state.ullAvailPhys,
            'load_percent':state.dwMemoryLoad}


def database(path):
    db=sqlite3.connect(path.as_uri()+'?mode=ro',uri=True)
    result=db.execute('pragma quick_check').fetchone()[0]
    if result!='ok':raise ValueError('SQLite quick_check failed: '+path.name)
    return db


def main():
    if shutil.disk_usage(ROOT).free < RESERVE:
        raise RuntimeError('Disk reserve HOLD')
    declaration=json.loads((OUT/'FROZEN_R5_PREDECLARATION.json').read_text())
    cohort=json.loads((OUT/'FROZEN_R5_COMPONENTS.private.json').read_text())
    result=json.loads((OUT/'R5_FROZEN_MACHINE_RESULTS_V2_CORRECTED.json').read_text())
    raw=json.loads((OUT/'FRESH_RAW_ARCHIVE_INTEGRITY.private.json').read_text())
    if raw['status']!='VERIFIED' or len(raw['archives'])!=14 or not all(x['match'] for x in raw['archives']):
        raise ValueError('Raw archive integrity incomplete')
    for name,expected in declaration['source_sha256'].items():
        if sha(RUN/name)!=expected:raise ValueError('Frozen source hash changed: '+name)
    for name,expected in declaration['code_sha256'].items():
        path=(RUN/name) if (RUN/name).exists() else ROOT/'70_RUNS/p62_r4_r3_20261013'/('code' if name=='p62_r4_r3_transfer_gate.py' else 'baseline_code')/name
        if sha(path)!=expected:raise ValueError('Frozen code changed: '+name)
    frozen=database(RUN/'R5_FROZEN_TRANSFER.private.sqlite')
    corrected=database(RUN/'R5_R3_TYPED_CORRECTION.private.sqlite')
    development=database(RUN/'R5_V2_DEVELOPMENT.private.sqlite')
    expected_frozen=set(cohort['manifest']['by_split']['frozen_transfer']['tokens'])
    actual_frozen={x[0] for x in frozen.execute('select strict from results')}
    expected_development=set(cohort['manifest']['by_split']['machine_development']['tokens'])
    actual_development={x[0] for x in development.execute('select strict from results')}
    late=set(cohort['manifest']['by_split']['reserved_late']['tokens'])
    if actual_frozen!=expected_frozen or actual_development!=expected_development or late & (actual_frozen|actual_development):
        raise ValueError('Source component split boundary or denominator mismatch')
    if {x[0] for x in corrected.execute('select strict from decisions')}!=actual_frozen:
        raise ValueError('Corrected R3 denominator mismatch')
    if result['structures']!=len(actual_frozen) or result['targets']!=281:
        raise ValueError('Frozen aggregate denominator mismatch')
    if result['human_ground_truth'] is not None:
        raise ValueError('Unqualified human ground truth supplied')
    evidence=OUT/'private_run_evidence'
    evidence.mkdir(exist_ok=True)
    for path in sorted(RUN.iterdir()):
        if path.is_file() and path.suffix.lower() in ('.py','.sqlite','.log'):
            if path.name.startswith('SEAL_DELIVERY'):
                continue
            target=evidence/path.name
            if target.exists() and sha(target)!=sha(path):
                target=evidence/(path.name+'.'+sha(path)[:12])
                if target.exists() and sha(target)!=sha(path):
                    raise ValueError('Versioned sealed copy differs: '+path.name)
            if not target.exists():shutil.copy2(path,target)
    timings={}
    for name in ('SOURCE_INVENTORY.log','PASSAGE_AUDIT.log','BOUNDED_COURT.log',
                 'FULL_COURT.log','V2_FULL.log','RAW_ARCHIVE_INTEGRITY.log'):
        path=RUN/name
        if path.exists():timings[name]={'last_write_utc':datetime.datetime.fromtimestamp(path.stat().st_mtime,datetime.timezone.utc).isoformat(),
                                        'bytes':path.stat().st_size}
    receipt={
      'status':'VERIFIED','created_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
      'host':os.environ.get('COMPUTERNAME'),'system':'Windows personal server',
      'hardware':{'logical_processors':os.cpu_count(),**memory(),
                  'free_system_volume_bytes':shutil.disk_usage(ROOT).free,
                  'disk_reserve_bytes':RESERVE},
      'reference_head':'13255ec9a77c8bd4e3091c6223ab379a92931266',
      'official_stage':'G9-P60','pr_state':'DRAFT_UNMERGED_AT_FREEZE',
      'source_archives':{'count':len(raw['archives']),'bytes':raw['total_bytes'],
                         'integrity_file':'FRESH_RAW_ARCHIVE_INTEGRITY.private.json'},
      'source_census':{'structures':181248,'paragraphs':1665187,'target_positive_structures':1655,
                       'zero_target_structures':179593,'targets':1717,
                       'archived_alias_witnesses':3176,'prior_source_shards_audited':3668,
                       'prior_source_documents_audited':2192191,'prior_source_paragraphs_audited':23299531},
      'split':{key:{k:v for k,v in value.items() if k!='tokens'}
               for key,value in cohort['manifest']['by_split'].items()},
      'checkpoint_census':{'frozen_structures':len(actual_frozen),'frozen_targets':result['targets'],
                           'r3_correction_structures':corrected.execute('select count(*) from decisions').fetchone()[0],
                           'development_structures':len(actual_development),
                           'reserved_late_structures_unexposed':len(late)},
      'commands':[
        'python r4_r5_source_inventory.py --members 1',
        'python r4_r5_source_inventory.py',
        'python r4_r5_custody_prepare.py',
        'python r4_r5_alias_adapter.py',
        'python r4_r5_passage_adapter.py',
        'python r4_r5_close_custody.py',
        'python r4_r5_frozen_court.py --freeze-only',
        'python r4_r5_frozen_court.py --members 1',
        'python r4_r5_frozen_court.py --members 1',
        'python r4_r5_frozen_court.py',
        'python r4_r5_r3_typed_correction.py',
        'python r4_r5_analyze.py',
        'python r4_r5_prior_scope_replay.py',
        'python r4_r5_failure_diagnostics.py',
        'python r4_r5_v2_development_court.py --members 1',
        'python r4_r5_v2_development_court.py --members 1',
        'python r4_r5_v2_development_court.py',
        'python r4_r5_archive_integrity.py'],
      'timing_evidence':timings,
      'failures_preserved':[
        'Inventory v1 elapsed timer clobbered by target offset; v1 source and log retained, v2 corrected.',
        'First authored invalid-quotation fixture failed to reach the intended quantity guard; failed v1 fixture retained and corrected.',
        'First full-suite discovery used an overlapping prior test import path; rerun with intended path passed 80 tests.',
        'First frozen aggregation read R3 typed selected instead of selected_global_span; V1 report retained as invalid, unchanged baseline replayed into byte-stable correction sidecar and V2 report.',
        'Initial delivery reseal rejected a changed in-flight seal log; v2 preserves both log versions and skips active seal logs.'],
      'original_model_frozen_choices_changed':0,
      'reserved_late_inference':0,'human_ground_truth':None,'semantic_accuracy':None,
      'global_semantic_source_work_independence':'HOLD',
    }
    (OUT/'RUN_RECEIPT.json').write_text(json.dumps(receipt,indent=2),encoding='utf-8')
    files=[]
    for path in sorted(OUT.rglob('*')):
        if path.is_file() and path.name!='SHA256_MANIFEST.json':
            files.append({'path':path.relative_to(OUT).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)})
    manifest={'status':'VERIFIED','created_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'files':files,'count':len(files),'hash_algorithm':'SHA-256',
              'self_excluded_from_hash_list':True}
    (OUT/'SHA256_MANIFEST.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(json.dumps({'status':'VERIFIED','files':len(files),'free_bytes':receipt['hardware']['free_system_volume_bytes'],
                      'frozen_structures':len(actual_frozen),'reserved_late_inference':0}),flush=True)


if __name__=='__main__':main()

