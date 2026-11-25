import unittest,os,json
from pathlib import Path
from r6b_feedback_alignment import terminal_candidate,audit,edits,touched
from r6b_shared_edits import apply,shared,summarize
from r6b_discourse_actions import markers,audit_pairs
from r6a_nikl_census import read
S='오늘은 날씨가 맑습니다.'
C='오늘 날씨가 맑습니다.'
def feedback(c):return f'그러므로 "{c}"로 바꾸어 보실 것을 제안해 드립니다.'
class Unit(unittest.TestCase):
 def test_candidate(self):self.assertEqual(terminal_candidate(S,feedback(C))[1],C)
 def test_keep(self):self.assertEqual(terminal_candidate(S,feedback(S))[0],'EXPLICIT_UNCHANGED')
 def test_multiple(self):self.assertIsNone(terminal_candidate(S,feedback(C)+'\n'+feedback(S))[1])
 def test_partial(self):self.assertIsNone(terminal_candidate(S,feedback('맑습니다'))[1])
 def test_other(self):self.assertIsNone(terminal_candidate(S,feedback('완전히 다릅니다.'))[1])
 def test_trailing(self):self.assertIsNone(terminal_candidate(S,feedback(C)+' 추가 설명.')[1])
 def test_source_replacement(self):self.assertEqual(terminal_candidate(S,f'"{S}"를 "{C}"로 바꾸어 보실 것을 제안해 드립니다.')[1],C)
 def test_wrong_source(self):self.assertIsNone(terminal_candidate(S,f'"다른 문장."을 "{C}"로 바꾸어 보실 것을 제안해 드립니다.')[1])
 def test_apply(self):self.assertEqual(apply(S,edits(S,C)),C)
 def test_insert(self):self.assertEqual(touched([(1,1,'가')]),{('B',1)})
 def test_disjoint(self):self.assertEqual(shared('가나다라','마나다라','가나다바'),'가나다라')
 def test_common(self):self.assertEqual(shared('가나다라','마나다라','마나다바'),'마나다라')
 def test_bad_span(self):
  with self.assertRaises(ValueError):apply('가나다',[(0,2,'x'),(1,3,'y')])
 def test_marker(self):self.assertIn('SPLIT',markers('문단을 나누어 제시해야 합니다.'))
 def test_unmarked(self):self.assertEqual(markers('글의 구조가 분명합니다.'),set())
class Actual(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.rows,_=read(Path(os.environ.get('KSGT_NIKL24_ARCHIVE','/mnt/data/NIKL_Instruction-based_Generation_Corpus_for_writing_correction_2024_v1.1.zip')))
  cls.a,cls.c=audit(cls.rows);cls.p=audit_pairs(cls.rows);cls.s=summarize(cls.c)['counts']
 def test_joint(self):self.assertEqual(self.a['counts']['joint'],530)
 def test_legacy_asymmetry(self):self.assertEqual((self.a['counts']['strict_expert'],self.a['counts']['strict_model'],self.a['counts']['strict_joint']),(744,4,2))
 def test_categories(self):self.assertEqual(sum(self.a['surface_comparison'][k] for k in ('EXACT','WHITESPACE_STRIPPED_EQUAL','DIFFERENT_SURFACE')),530)
 def test_projection_partition(self):self.assertEqual(sum(self.s[k] for k in ('unchanged_projection','exact_expert_projection','exact_model_projection','distinct_changed_projection')),273)
 def test_pairs(self):self.assertEqual((self.p['matched']['문단']['pairs'],self.p['matched']['문서']['pairs']),(89,100))
if __name__=='__main__':unittest.main()
