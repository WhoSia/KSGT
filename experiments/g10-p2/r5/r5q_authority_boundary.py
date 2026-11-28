"""Explicit, caller-asserted 2024 writing-instruction annotation roles; no schema discovery."""

def classify(meta):
    """Fail-closed typed authority, never infer annotation task from an unknown raw JSON field."""
    typ = meta.get('annotation_role')
    if typ not in {'SOURCE_DRAFT', 'LLM_FEEDBACK', 'EXPERT_EDITED_FEEDBACK', 'ANNOTATED_EXPRESSION_EDIT', 'HUMAN_REWRITE', 'HUMAN_RATING'}:
        return 'UNKNOWN_HOLD'
    if meta.get('schema_seen') is not True or meta.get('rights_inspected') is not True:
        return 'SCHEMA_OR_RIGHTS_HOLD'
    if typ == 'EXPERT_EDITED_FEEDBACK':
        return 'FEEDBACK_NOT_REWRITE'
    if typ == 'HUMAN_REWRITE':
        if not (meta.get('before_text_witness') and meta.get('after_text_witness') and meta.get('source_work_verified')):
            return 'PAIR_OR_LINEAGE_HOLD'
        return 'REWRITE_CANDIDATE_NOT_QUALITY_GOLD'
    if typ == 'HUMAN_RATING':
        return 'RATING_NOT_EDITORIAL_PAIR'
    return 'NOT_EDITORIAL_PAIR'

