"""Replay previously exposed source-derived probes for staged cause diagnostics only."""
import collections
import json
import pathlib
import sqlite3
import sys

ROOT = pathlib.Path('C:/KSGT_SERVER')
PRIOR = ROOT / '70_RUNS/p62_r4_r3_20261013'
OLD = ROOT / '70_RUNS/p62_r4_r4_opportunity_20261013'
OLD_OUT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'
RUN = ROOT / '70_RUNS/p62_r4_r5_20261014'
OUT = ROOT / '80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'
sys.path[:0] = [str(RUN),str(PRIOR/'baseline_code'),str(PRIOR/'code')]
import p62_r4_guarded_v3 as v3
from p62_r4_r3_source_witness import strict
from p62_r4_r5_mechanisms import infer


def main():
    rows = json.loads((OLD_OUT/'COUNTERFACTUAL_RESULTS.private.json').read_text())
    c = sqlite3.connect((OLD/'UPSTREAM_CUSTODY.private.sqlite').as_uri()+'?mode=ro',uri=True)
    counts = collections.Counter()
    for row in rows:
        witness = row['source_witness']
        forms = json.loads(c.execute('select forms from docs where strict=?',
                                     (witness['strict_private'],)).fetchone()[0])
        unit = witness['unit_ordinal']
        _, end = witness['component_spans'][-1]
        match = next(x for x in v3.kernel.R4_COUNT.finditer(forms[unit]) if x.end()==end)
        counter = match.group('counter')
        derived = forms[:unit] + [forms[unit][:end]+' 그중 '+str(row['authored_quantity'])+counter+'이 이동했다.']
        target = {'unit':unit,'start':end+1,'end':end+3,'observed':False}
        if strict(derived) != row['derived_source_identity']['strict_structure']:
            raise ValueError('Prior source-derived probe changed')
        result = infer(derived,target,row['derived_source_identity'])
        if result['m0_v3_status'] != row['v3_status']:
            raise ValueError('Frozen guarded-v3 status changed')
        counts['replayed_prior_source_derived_probes'] += 1
        masked = result['cause_chain'][-1]['masked_earlier_quote_hold']
        counts['masked_invalid_quotation_hold'] += masked
        if masked:
            if result['cause_chain'][2]['status'] != 'HOLD_INVALID_QUOTE_SCOPE':
                raise ValueError('Masked quotation root cause lost')
            if result['m4_staged']['selected'] is not None:
                raise ValueError('Invalid quotation selected a staged source group')
            counts['masked_hold_with_m4_abstention'] += 1
    report = {'status':'VERIFIED','lane':'PRIOR_EXPOSED_SOURCE_DERIVED_DIAGNOSTIC_ONLY',
              'counts':dict(counts),'frozen_v3_status_changes':0,
              'natural_observed_corpus_targets':0,'human_ground_truth':None,
              'semantic_accuracy':None}
    (OUT/'R5_PRIOR_SCOPE_REPLAY.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report),flush=True)


if __name__ == '__main__':
    main()

