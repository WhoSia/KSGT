#!/usr/bin/env python3
"""G10-P2: provenance-safe admission of Korean writing annotation metadata.

Public output contains metadata/status only; no document contents. Every record must
supply actual inspected schema/rights evidence; task labels never prove human gold.
"""
import argparse
import json
from collections import Counter
from pathlib import Path

SCHEMA = 'ksgt.g10p2.r5p.annotation-authority.v1'
ROLES = {'ORIGINAL', 'LLM_FEEDBACK', 'EXPERT_EDITED_FEEDBACK', 'HUMAN_REWRITE', 'ANNOTATED_EXPRESSION_EDIT', 'HUMAN_RATING'}
TASKS = {'CONTENT_FEEDBACK', 'ORGANIZATION_FEEDBACK', 'EXPRESSION_CORRECTION', 'WHOLE_TEXT_REWRITE', 'HUMAN_READER_RATING'}
LEVELS = {'SENTENCE', 'PARAGRAPH', 'DOCUMENT'}


def classify(row):
    if not isinstance(row, dict) or not isinstance(row.get('item_id'), str) or not row['item_id']:
        raise ValueError('BAD_ITEM_ID')
    task, role, level = row.get('task'), row.get('output_role'), row.get('unit')
    if task not in TASKS or role not in ROLES or level not in LEVELS:
        raise ValueError('BAD_ONTOLOGY')
    holds = []
    def hold(reason):
        if reason not in holds:
            holds.append(reason)
    if row.get('schema_inspected') is not True: hold('UNINSPECTED_ACTUAL_SCHEMA')
    if row.get('rights_status') != 'CONFIRMED_FOR_THIS_USE': hold('RIGHTS_UNCONFIRMED')
    if row.get('source_witness_verified') is not True: hold('SOURCE_WITNESS_UNVERIFIED')
    if not isinstance(row.get('source_work_id'), str) or not row['source_work_id'].strip(): hold('SOURCE_WORK_ID_UNKNOWN')
    if row.get('author_identity_verified') is not True: hold('AUTHOR_LINK_UNVERIFIED')
    if row.get('exposure_status') != 'FROZEN_AND_AUDITED': hold('EXPOSURE_UNVERIFIED')
    # A human reviewed feedback is still feedback ABOUT a draft, not an edited draft.
    if role == 'EXPERT_EDITED_FEEDBACK':
        family = 'EXPERT_CORRECTED_FEEDBACK'
    elif role == 'LLM_FEEDBACK':
        family = 'LLM_GENERATED_FEEDBACK'
    elif role == 'ANNOTATED_EXPRESSION_EDIT':
        family = 'EXPRESSION_ANNOTATION'
    elif role == 'HUMAN_REWRITE':
        family = 'POTENTIAL_SOURCE_EDIT_PAIR'
    elif role == 'HUMAN_RATING':
        family = 'POTENTIAL_READER_OUTCOME'
    else:
        family = 'SOURCE_ONLY'
    if task == 'WHOLE_TEXT_REWRITE' and role != 'HUMAN_REWRITE': hold('REWRITE_ROLE_MISMATCH')
    if task == 'HUMAN_READER_RATING' and role != 'HUMAN_RATING': hold('RATING_ROLE_MISMATCH')
    if role == 'HUMAN_REWRITE' and task != 'WHOLE_TEXT_REWRITE': hold('EDIT_TASK_NOT_WHOLE_TEXT_REWRITE')
    if role == 'HUMAN_RATING' and row.get('independent_blind_reader') is not True: hold('BLIND_READER_NOT_VERIFIED')
    if role == 'HUMAN_REWRITE':
        if row.get('before_after_pair_verified') is not True: hold('ORIGINAL_REVISED_PAIR_UNVERIFIED')
        if level == 'SENTENCE': hold('NOT_COMPLETE_PROSE')
        if row.get('editor_independent_of_model') is not True: hold('EDITOR_INDEPENDENCE_UNVERIFIED')
    if role == 'ANNOTATED_EXPRESSION_EDIT' and row.get('before_after_pair_verified') is not True:
        hold('EXPRESSION_OUTPUT_PAIR_UNVERIFIED')
    # Human-edited critique cannot ever be classified as a source rewrite.
    rewrite_admitted = family == 'POTENTIAL_SOURCE_EDIT_PAIR' and not holds
    reader_admitted = family == 'POTENTIAL_READER_OUTCOME' and not holds
    return {'item_id': row['item_id'], 'family': family, 'holds': sorted(holds),
            'source_rewrite_admitted': rewrite_admitted,
            'independent_reader_outcome_admitted': reader_admitted,
            'human_prose_quality_gold': False}  # Needs separate validity court.


def audit(rows):
    if not isinstance(rows, list): raise ValueError('EXPECTED_LIST')
    ids = set()
    results = []
    for row in rows:
        result = classify(row)
        if result['item_id'] in ids: raise ValueError('DUPLICATE_ID')
        ids.add(result['item_id'])
        results.append(result)
    counts = Counter(r['family'] for r in results)
    holds = Counter(h for r in results for h in r['holds'])
    return {'schema': SCHEMA, 'entries': len(results), 'families': dict(sorted(counts.items())),
            'hold_counts': dict(sorted(holds.items())),
            'source_rewrite_candidates_admitted': sum(r['source_rewrite_admitted'] for r in results),
            'independent_reader_outcomes_admitted': sum(r['independent_reader_outcome_admitted'] for r in results),
            'source_work_disjointness_certified': False,
            'writing_quality_superiority_certified': False, 'raw_text_exported': False,
            'item_results': results}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--metadata-json', required=True)
    p.add_argument('--output', help='New, non-sensitive JSON receipt; must not overwrite source')
    args = p.parse_args()
    input_path = Path(args.metadata_json).resolve()
    result = audit(json.loads(input_path.read_text('utf-8')))
    payload = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if args.output:
        path = Path(args.output).resolve()
        if path.exists() or path == input_path: raise ValueError('OUTPUT_MUST_BE_NEW')
        path.write_text(payload, encoding='utf-8')
    else:
        print(payload)

if __name__ == '__main__': main()
