"""Aggregate source-only failure mechanisms without exporting source prose or IDs."""
import collections
import json
import pathlib
import sqlite3

ROOT = pathlib.Path('C:/KSGT_SERVER')
RUN = ROOT / '70_RUNS/p62_r4_r5_20261014'
OUT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'


def main():
    db = sqlite3.connect((RUN/'R5_FROZEN_TRANSFER.private.sqlite').as_uri()+'?mode=ro',uri=True)
    if db.execute('pragma quick_check').fetchone()[0] != 'ok':
        raise ValueError('Frozen court checkpoint damaged')
    totals = collections.Counter()
    by_year = collections.defaultdict(collections.Counter)
    by_length = collections.defaultdict(collections.Counter)
    by_container = collections.defaultdict(collections.Counter)
    for _, container, year, units, targets, payload in db.execute(
            'select strict,container,year,units,targets,payload from results'):
        rows = json.loads(payload)
        if len(rows) != targets:
            raise ValueError('Frozen target count mismatch')
        length = '1-3' if units<=3 else '4-10' if units<=10 else '11+'
        for row in rows:
            v = row['v3']['proposal'] and row['v3']['admission']=='VERIFIED_TYPED_SOURCE_GRAPH_ONLY'
            r = row['r5']
            d = r['target_surface_features']['descriptor_surface']
            role = r['target_surface_features']['particle_role_proxy']
            eligible = [x for x in r['source_evidence'] if x['eligible_under_frozen_v3']]
            matched_d = [x for x in eligible if d is not None and (x['descriptor'] or {}).get('surface')==d]
            matched_role = [x for x in eligible if role is not None and x['particle_role_proxy']==role]
            matched_both = [x for x in matched_d if x in matched_role]
            m2 = r['m2_particle_role']['selected'] is not None
            totals['m4_source_group_id_differs_from_v3'] += (
                r['m4_staged']['selected'] != r['m0_v3_selected'])
            totals['m2_selected_group_differs_from_v3'] += (
                m2 and r['m2_particle_role']['selected'] != r['m0_v3_selected'])
            facts = {'targets':1,'v3_proposals':int(v),'m2_proposals':int(m2),
                     'target_descriptor_observed':int(d is not None),
                     'target_particle_proxy_observed':int(role is not None),
                     'eligible_source_descriptor_match':int(bool(matched_d)),
                     'eligible_source_particle_match':int(bool(matched_role)),
                     'eligible_source_joint_match':int(bool(matched_both)),
                     'possible_coordination':int(any(x['possible_under_frozen_v3'] for x in r['union_evidence'])),
                     'm2_gain_vs_v3':int(m2 and not v),'m2_loss_vs_v3':int(v and not m2)}
            totals.update(facts)
            by_year[year].update({k:facts[k] for k in ('targets','v3_proposals','m2_proposals')})
            by_length[length].update({k:facts[k] for k in ('targets','v3_proposals','m2_proposals')})
            by_container[container].update({k:facts[k] for k in ('targets','v3_proposals','m2_proposals')})
            if m2 and not v:
                totals['m2_gain_v3_status:'+row['v3']['status']] += 1
    container_values = sorted((dict(x) for x in by_container.values()),
                              key=lambda x:(x['targets'],x['v3_proposals'],x['m2_proposals']))
    report = {'status':'VERIFIED','scope':'FROZEN_MACHINE_DIAGNOSTIC_POST_OUTCOME',
              'counts':dict(sorted(totals.items())),
              'by_publication_year':{str(k):dict(v) for k,v in sorted(by_year.items())},
              'by_document_length':{k:dict(v) for k,v in sorted(by_length.items())},
              'source_container_aggregate_sorted_without_ids':container_values,
              'human_ground_truth':None,'semantic_accuracy':None}
    (OUT/'R5_FAILURE_DIAGNOSTICS.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report),flush=True)


if __name__ == '__main__':
    main()

