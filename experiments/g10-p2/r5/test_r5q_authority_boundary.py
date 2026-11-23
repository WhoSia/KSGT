import unittest


from r5q_authority_boundary import classify


class Tests(unittest.TestCase):
    def test_feedback_not_rewrite(self):
        self.assertEqual(classify({'annotation_role':'EXPERT_EDITED_FEEDBACK','schema_seen':True,'rights_inspected':True,'before_text_witness':True,'after_text_witness':True,'source_work_verified':True}),'FEEDBACK_NOT_REWRITE')
    def test_unknown(self): self.assertEqual(classify({}), 'UNKNOWN_HOLD')
    def test_no_rights(self): self.assertEqual(classify({'annotation_role':'HUMAN_REWRITE','schema_seen':True}), 'SCHEMA_OR_RIGHTS_HOLD')
    def test_bare_human_rewrite(self): self.assertEqual(classify({'annotation_role':'HUMAN_REWRITE','schema_seen':True,'rights_inspected':True}), 'PAIR_OR_LINEAGE_HOLD')
    def test_correctly_linked_rewrite_still_not_gold(self):
        d={'annotation_role':'HUMAN_REWRITE','schema_seen':True,'rights_inspected':True,'before_text_witness':True,'after_text_witness':True,'source_work_verified':True}
        self.assertEqual(classify(d),'REWRITE_CANDIDATE_NOT_QUALITY_GOLD')
    def test_human_rating_not_pair(self): self.assertEqual(classify({'annotation_role':'HUMAN_RATING','schema_seen':True,'rights_inspected':True}),'RATING_NOT_EDITORIAL_PAIR')

if __name__=='__main__': unittest.main()
