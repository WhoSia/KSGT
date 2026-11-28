import unittest,copy,os
from pathlib import Path
from r6a_nikl_census import read,census,target
from r6a_feedback_pairs import propose,audit
from r6a_family_audit import audit as family
class ActualRelease(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p=Path(os.environ.get('KSGT_NIKL24_ARCHIVE','/mnt/data/NIKL_Instruction-based_Generation_Corpus_for_writing_correction_2024_v1.1.zip'));cls.rows,cls.meta=read(cls.p)
        cls.c=census(cls.rows);cls.f=audit(cls.rows);cls.g=family(cls.rows)
    def test_archive(self):self.assertTrue(self.meta['crc_all_pass']);self.assertEqual(self.meta['archive_bytes'],2512615)
    def test_records(self):self.assertEqual(self.c['records'],1500);self.assertEqual(self.c['counts']['llm_answers'],4650)
    def test_nulls(self):self.assertEqual(self.c['counts']['paragraph_null_form'],24);self.assertEqual(self.c['counts']['sentence_null_form'],1)
    def test_header(self):self.assertEqual(self.c['counts']['missing_standard_header'],2);self.assertEqual(target('가나다.'),'가나다.')
    def test_duplicate_record(self):
        with self.assertRaisesRegex(ValueError,'DUPLICATE_RECORD_ID'):census(self.rows+[self.rows[0]])
    def test_strata(self):
        with self.assertRaisesRegex(ValueError,'STRATUM_COUNTS'):census(self.rows[:-1])
    def test_paired(self):self.assertEqual(self.f['paired_content_organization']['문서']['pairs'],100);self.assertEqual(self.f['paired_content_organization']['문단']['pairs'],89)
    def test_candidate(self):self.assertEqual(self.f['expression_sentence_proposal_status']['REVIEW_CANDIDATE_ONLY'],744);self.assertFalse(self.f['semantic_validation'])
    def test_grouping(self):self.assertEqual(self.g['component_hash']['crossing_components'],0);self.assertGreater(self.g['naive_record_hash']['crossing_components'],0);self.assertFalse(self.g['holdout_frozen'])
class QuoteRules(unittest.TestCase):
    def test_positive(self):self.assertEqual(propose('가나다.','"가나다."에 문제가 있습니다. 그러므로 "가나."로 바꾸어 보실 것을 제안해 드립니다.'),('REVIEW_CANDIDATE_ONLY','가나.'))
    def test_missing_witness(self):self.assertIsNone(propose('가나다.','그러므로 "가나."로 바꾸어 보실 것을 제안해 드립니다.')[1])
    def test_optional(self):self.assertIsNone(propose('가나다.','"가나다." 대신 "가나."로도 쓸 수 있습니다.')[1])
    def test_unchanged(self):self.assertIsNone(propose('가나다.','"가나다." 그러므로 "가나다."로 바꾸어 보실 것을 제안해 드립니다.')[1])
    def test_partial(self):self.assertIsNone(propose('가나다.','"가나다." 그러므로 "가나"로 바꾸어 보실 것을 제안해 드립니다.')[1])
    def test_wrong_suffix(self):self.assertIsNone(propose('가나다.','"가나다." 그러므로 "가나."로 바꾸어 보실 것을 제안해 드립니다. 단, 문맥에 따라 다릅니다.')[1])
if __name__=='__main__':unittest.main()
