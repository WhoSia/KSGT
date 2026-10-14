"""Aggregate frozen machine proposals with document and dependency-component uncertainty."""
import collections
import json
import pathlib
import random
import sqlite3
import statistics

ROOT = pathlib.Path('C:/KSGT_SERVER')
RUN = ROOT / '70_RUNS/p62_r4_r5_20261014'
OUT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'
ARMS = ('r3_typed', 'r4', 'v3', 'm1_descriptor', 'm2_particle_role',
        'm3_descriptor_and_role', 'm4_staged')


def interval(values, seed=62045, repetitions=2000):
    if not values:
        return None
    rng = random.Random(seed)
    observed = statistics.mean(values)
    simulated = sorted(statistics.mean(rng.choices(values, k=len(values)))
                       for _ in range(repetitions))
    return {'estimate_pp': 100*observed,
            'cluster_bootstrap_95_pp': [100*simulated[49], 100*simulated[1949]],
            'clusters': len(values), 'repetitions': repetitions}


def arm(row, name):
    if name in ('r3_typed', 'r4', 'v3'):
        baseline = row[name]
        if name == 'r3_typed':
            return baseline['proposal'] and baseline['admission'] == 'VERIFIED_SOURCE_FRAGMENT_ONLY'
        if name == 'r4':
            return baseline['proposal'] and baseline['admission'] == 'VERIFIED_TYPED_SOURCE_GRAPH_ONLY'
        return baseline['proposal'] and baseline['admission'] == 'VERIFIED_TYPED_SOURCE_GRAPH_ONLY'
    return row['r5'][name]['selected'] is not None


def main():
    db = sqlite3.connect((RUN / 'R5_FROZEN_TRANSFER.private.sqlite').as_uri() + '?mode=ro', uri=True)
    if db.execute('pragma quick_check').fetchone()[0] != 'ok':
        raise ValueError('Checkpoint integrity failed')
    declaration = json.loads((OUT / 'FROZEN_R5_PREDECLARATION.json').read_text())
    cohort = json.loads((OUT / 'FROZEN_R5_COMPONENTS.private.json').read_text())
    ids = set(cohort['manifest']['by_split']['frozen_transfer']['tokens'])
    results = db.execute('select strict,container,year,units,targets,payload from results').fetchall()
    if {x[0] for x in results} != ids:
        raise ValueError('Frozen-transfer denominator incomplete')
    correction_db = sqlite3.connect((RUN/'R5_R3_TYPED_CORRECTION.private.sqlite').as_uri()+'?mode=ro', uri=True)
    if correction_db.execute('pragma quick_check').fetchone()[0] != 'ok':
        raise ValueError('R3 typed correction checkpoint integrity failed')
    corrections = {strict: json.loads(payload) for strict,payload in
                   correction_db.execute('select strict,payload from decisions')}
    if set(corrections) != ids:
        raise ValueError('R3 typed correction denominator incomplete')
    parent = {x['id']: x['id'] for x in cohort['records']}
    def root(key):
        while key != parent[key]:
            parent[key] = parent[parent[key]]
            key = parent[key]
        return key
    for link in cohort['links']:
        if link['kind'] not in ('EXACT_STRUCTURE', 'EXACT_CONTIGUOUS_UNIT_SUBSET',
                                'EXACT_CODEPOINT_RESEGMENTATION', 'VERIFIED_SHARED_LONG_UNIT',
                                'VERIFIED_SHARED_LONG_PASSAGE', 'VERIFIED_CROSS_ID_ALIAS'):
            continue
        a, b = root(link['left']), root(link['right'])
        if a != b:
            parent[max(a,b)] = min(a,b)
    per_doc = []
    target_counts = collections.Counter()
    year_counts = collections.Counter()
    length_counts = collections.Counter()
    containers = set()
    statuses = collections.Counter()
    cause = collections.Counter()
    surface = collections.Counter()
    controls = collections.Counter()
    discordance = collections.Counter()
    wall = collections.defaultdict(float)
    for strict, container, year, units, targets, payload in results:
        rows = json.loads(payload)
        if len(rows) != targets:
            raise ValueError('Target row mismatch')
        if len(corrections[strict]) != targets:
            raise ValueError('R3 typed correction target count mismatch')
        for row, fixed in zip(rows, corrections[strict]):
            if row['r3_typed']['admission'] != fixed['admission']:
                raise ValueError('R3 typed source admission changed')
            row['r3_typed']['proposal'] = fixed['proposal']
        group = '1-3' if units <= 3 else '4-10' if units <= 10 else '11+'
        containers.add(container)
        year_counts[year] += 1
        length_counts[group] += 1
        values = {name: statistics.mean(arm(r, name) for r in rows) for name in ARMS}
        per_doc.append({'strict': strict, 'component': root(strict), 'container': container,
                        'year': year, 'length': group, 'targets': targets, 'values': values})
        for r in rows:
            for name in ARMS:
                target_counts[name] += int(arm(r, name))
            for name in ('r3_typed', 'r4', 'v3'):
                wall[name] += r[name]['seconds']
                statuses[(name, r[name]['status'])] += 1
            wall['m1_to_m4'] += r['r5_seconds']
            for name in ARMS[3:]:
                statuses[(name, r['r5'][name]['status'])] += 1
                discordance[(name, 'gain_vs_v3')] += int(arm(r,name) and not arm(r,'v3'))
                discordance[(name, 'loss_vs_v3')] += int(arm(r,'v3') and not arm(r,name))
            feature = r['r5']['target_surface_features']
            control = r['future_suffix_control']
            controls['v3_proposal_or_status_changed'] += control['v3_proposal_or_status_changed']
            controls['r5_source_evidence_changed'] += control['r5_source_evidence_changed']
            for name, changed in control['r5_decision_changed'].items():
                controls[name+'_decision_changed'] += changed
            surface['target_descriptor'] += feature['descriptor_surface'] is not None
            surface['target_particle_role'] += feature['particle_role_proxy'] is not None
            surface['source_descriptor'] += any(x['descriptor'] for x in r['r5']['source_evidence'])
            surface['source_particle_role'] += any(x['particle_role_proxy'] for x in r['r5']['source_evidence'])
            chain = r['r5']['cause_chain']
            cause['masked_invalid_quote'] += chain[-1]['masked_earlier_quote_hold']
            cause['invalid_quote_root'] += chain[2]['invalid_quote']
            cause['source_admission_verified'] += chain[1]['status'] == 'VERIFIED_TYPED_SOURCE_GRAPH_ONLY'
    component_rows = collections.defaultdict(list)
    for row in per_doc:
        component_rows[row['component']].append(row)
    report = {
        'status': 'EXECUTED', 'claim_ceiling': declaration['claim_ceiling'],
        'structures': len(per_doc), 'targets': sum(x['targets'] for x in per_doc),
        'source_dependency_components': len(component_rows),
        'observed_source_containers': len(containers),
        'publication_year_structure_counts': dict(sorted(year_counts.items())),
        'document_length_structure_counts': dict(sorted(length_counts.items())),
        'target_proposals': dict(target_counts),
        'document_equal_proposal_percent': {a: 100*statistics.mean(x['values'][a] for x in per_doc)
                                            for a in ARMS},
        'paired_vs_v3_document_clustered': {
            a: interval([x['values'][a]-x['values']['v3'] for x in per_doc], 62045+i)
            for i,a in enumerate(ARMS) if a != 'v3'},
        'paired_vs_v3_dependency_component_clustered': {
            a: interval([statistics.mean(x['values'][a]-x['values']['v3'] for x in group)
                         for group in component_rows.values()], 63045+i)
            for i,a in enumerate(ARMS) if a != 'v3'},
        'status_counts': {f'{a}:{s}': n for (a,s),n in sorted(statuses.items())},
        'target_surface_coverage_counts': dict(surface),
        'future_suffix_control_violation_counts': dict(controls),
        'scope_and_admission_cause_counts': dict(cause),
        'new_arm_target_gain_loss_vs_v3': {f'{a}:{kind}': n for (a,kind),n in sorted(discordance.items())},
        'aggregate_wall_seconds_by_arm': dict(wall),
        'frozen_manifest_sha256': cohort['manifest']['manifest_sha256'],
        'analysis_correction': 'VERSION_2_REPLAY_UNCHANGED_R3_TYPED_SELECTED_GLOBAL_SPAN_FIELD',
        'first_aggregation_preserved': 'R5_FROZEN_MACHINE_RESULTS_V1_INVALID_R3.json',
        'human_ground_truth': None,
    }
    (OUT / 'R5_FROZEN_MACHINE_RESULTS_V2_CORRECTED.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps({k: report[k] for k in ('structures','targets','source_dependency_components',
        'observed_source_containers','target_proposals','document_equal_proposal_percent',
        'paired_vs_v3_document_clustered','scope_and_admission_cause_counts')}), flush=True)


if __name__ == '__main__':
    main()

