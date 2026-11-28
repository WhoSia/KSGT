#!/usr/bin/env python3
"""Fail closed on malformed director gates or unsupported promotion claims."""
import json
from pathlib import Path

ALLOWED = {'HOLD', 'PARTIAL', 'PASS', 'BLOCKED', 'DEFERRED'}
REQUIRED = {'G0-CUSTODY', 'G1-CP5', 'G2-P36', 'G3-P62', 'G4-EDITORIAL', 'G5-EVAL', 'G6-CODE'}


def validate(data):
    if data.get('schema') != 'ksgt.g10p2.director.gates.v1':
        raise ValueError('schema')
    gates = data.get('gates')
    if not isinstance(gates, list) or {x.get('id') for x in gates} != REQUIRED or len(gates) != len(REQUIRED):
        raise ValueError('gate inventory')
    for gate in gates:
        if gate.get('status') not in ALLOWED or not isinstance(gate.get('pass_requires'), list) or not gate['pass_requires']:
            raise ValueError('invalid gate')
        if not isinstance(gate.get('evidence'), list) or not isinstance(gate.get('not_evidence'), list):
            raise ValueError('evidence fields')
    if data.get('no_auto_promotion') is not True:
        raise ValueError('automatic promotion prohibited')
    if data.get('independent_reader_outcomes') == 0 and 'QUALITY_HOLD' not in data.get('overall_stage', ''):
        raise ValueError('human quality evidence absent')
    if data.get('new_provider_calls') != 0 or data.get('provider_calls_historical') != 340:
        raise ValueError('provider provenance drift')
    if set(data.get('dependencies', {}).get('quality_claim', [])) != {'G4-EDITORIAL', 'G5-EVAL', 'G6-CODE'}:
        raise ValueError('quality gate dependency')
    return True


if __name__ == '__main__':
    validate(json.loads((Path(__file__).parent / 'r5n_director_gate_registry.json').read_text()))
    print('Director gate schema PASS; no quality-promotion evidence inferred')
