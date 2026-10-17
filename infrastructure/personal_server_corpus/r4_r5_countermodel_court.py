"""Exhaustive authored surface countermodels; never independent Korean labels."""
import collections
import hashlib
import itertools
import json
import pathlib
import sys
import time

ROOT = pathlib.Path('C:/KSGT_SERVER')
PRIOR = ROOT / '70_RUNS/p62_r4_r3_20261013'
RUN = ROOT / '70_RUNS/p62_r4_r5_20261014'
OUT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'
sys.path[:0] = [str(RUN), str(PRIOR / 'baseline_code'), str(PRIOR / 'code')]
from p62_r4_r3_source_witness import strict
from p62_r4_r5_mechanisms import infer


def main():
    start = time.perf_counter()
    surfaces = ('학생', '교사', '연구원')
    particles = ('이', '을', '은', '에게')
    counts = collections.Counter()
    for source_descriptor, source_particle, target_descriptor, target_particle in itertools.product(
            surfaces, particles, surfaces, particles):
        form = (f'{source_descriptor} 3명{source_particle} 왔다. '
                f'교사 4명이 있었다. 그중 {target_descriptor} 2명{target_particle} 떠났다.')
        forms = [form]
        at = form.index('그중')
        target = {'unit': 0, 'start': at, 'end': at+2, 'observed': True}
        identity = {'strict_structure': strict(forms), 'member_key': 'b'*64,
                    'archive_sha256': 'c'*64, 'document_ordinal': 1}
        result = infer(forms, target, identity)
        counts['authored_frames'] += 1
        chosen = result['m3_descriptor_and_role']['selected']
        if chosen is not None:
            evidence = [x for x in result['source_evidence'] if x['node_id'] == chosen]
            if len(evidence) != 1:
                raise ValueError('Selected group without unique source witness')
            item = evidence[0]
            if (item['descriptor'] or {}).get('surface') != result['target_surface_features']['descriptor_surface']:
                raise ValueError('Descriptor mismatch')
            if item['particle_role_proxy'] != result['target_surface_features']['particle_role_proxy']:
                raise ValueError('Particle role-proxy mismatch')
            if any(x['possible_under_frozen_v3'] for x in result['union_evidence']):
                raise ValueError('Unresolved coordinated group ignored')
            counts['m3_source_fragment_proposals'] += 1
        if result['human_ground_truth'] is not None or result['semantic_accuracy'] is not None:
            raise ValueError('Authored frame contaminated with semantic gold')
        counts['no_semantic_gold'] += 1
    report = {'status': 'VERIFIED', 'scope': 'AUTHORED_SYNTHETIC_ONLY',
              'counts': dict(counts), 'elapsed_seconds': time.perf_counter()-start,
              'model_sha256': hashlib.sha256((RUN/'p62_r4_r5_mechanisms.py').read_bytes()).hexdigest(),
              'human_ground_truth': None, 'semantic_accuracy': None}
    (OUT/'R5_AUTHORED_COUNTERMODEL_REPORT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report), flush=True)


if __name__ == '__main__':
    main()

