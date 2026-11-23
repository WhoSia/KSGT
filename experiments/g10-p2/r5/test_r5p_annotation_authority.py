import copy
import unittest
from r5p_annotation_authority import audit, classify


def row(**kw):
    d = {'item_id':'x', 'task':'CONTENT_FEEDBACK', 'output_role':'EXPERT_EDITED_FEEDBACK', 'unit':'PARAGRAPH',
         'schema_inspected':True, 'rights_status':'CONFIRMED_FOR_THIS_USE', 'source_witness_verified':True,
         'source_work_id':'W', 'author_identity_verified':True, 'exposure_status':'FROZEN_AND_AUDITED'}
    d.update(kw)
    return d

class Admission(unittest.TestCase):
    def test_expert_feedback_never_source_rewrite(self):
        x=classify(row());self.assertEqual(x['family'],'EXPERT_CORRECTED_FEEDBACK');self.assertFalse(x['source_rewrite_admitted'])
    def test_llm_feedback_not_human(self):
        self.assertEqual(classify(row(output_role='LLM_FEEDBACK'))['family'],'LLM_GENERATED_FEEDBACK')
    def test_unverified_schema(self):
        self.assertIn('UNINSPECTED_ACTUAL_SCHEMA', classify(row(schema_inspected=False))['holds'])
    def test_licensed_native_rewrite_candidate(self):
        x=classify(row(task='WHOLE_TEXT_REWRITE',output_role='HUMAN_REWRITE',
                       unit='PARAGRAPH',before_after_pair_verified=True,editor_independent_of_model=True))
        self.assertTrue(x['source_rewrite_admitted']);self.assertFalse(x['human_prose_quality_gold'])
    def test_sentence_rewrite_not_complete_prose(self):
        x=classify(row(task='WHOLE_TEXT_REWRITE',output_role='HUMAN_REWRITE',
                       unit='SENTENCE',before_after_pair_verified=True,editor_independent_of_model=True))
        self.assertIn('NOT_COMPLETE_PROSE', x['holds'])
    def test_annotated_expression_not_rewrite(self):
        x=classify(row(task='EXPRESSION_CORRECTION',output_role='ANNOTATED_EXPRESSION_EDIT',
                       before_after_pair_verified=True))
        self.assertFalse(x['source_rewrite_admitted'])
    def test_reader_must_be_blind(self):
        x=classify(row(task='HUMAN_READER_RATING',output_role='HUMAN_RATING', independent_blind_reader=False))
        self.assertFalse(x['independent_reader_outcome_admitted'])
    def test_reader_correct_role(self):
        x=classify(row(task='HUMAN_READER_RATING',output_role='HUMAN_RATING', independent_blind_reader=True))
        self.assertTrue(x['independent_reader_outcome_admitted'])
    def test_missing_rights_hold(self):
        self.assertIn('RIGHTS_UNCONFIRMED', classify(row(rights_status='UNKNOWN'))['holds'])
    def test_missing_source_work_hold(self):
        self.assertIn('SOURCE_WORK_ID_UNKNOWN', classify(row(source_work_id=None))['holds'])
    def test_duplicate_id_fail(self):
        with self.assertRaisesRegex(ValueError,'DUPLICATE_ID'):audit([row(),row()])
    def test_no_raw_text_keys_in_output(self):
        x=audit([row(source_text='PERSONAL TEXT', correction='PERSONAL OUTPUT')]);self.assertNotIn('PERSONAL',str(x))
    def test_wrong_role_mismatch(self):
        self.assertIn('REWRITE_ROLE_MISMATCH', classify(row(task='WHOLE_TEXT_REWRITE'))['holds'])
    def test_unverified_exposure_hold(self):
        self.assertIn('EXPOSURE_UNVERIFIED',classify(row(exposure_status='UNKNOWN'))['holds'])
    def test_never_quality_superiority(self):
        self.assertFalse(audit([row()])['writing_quality_superiority_certified'])

if __name__ == '__main__': unittest.main()
