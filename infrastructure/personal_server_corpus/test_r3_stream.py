"""Original authored adversarial fixtures; no independent semantic evidence."""
import unittest
import p62_reference as ref
from p62_r3_stream_inference import infer
def target(forms):
 for i,s in enumerate(forms):
  m=ref.TARGET.search(s)
  if m:return {'unit':i,'start':m.start(),'end':m.end(),'observed':True}
class StreamTests(unittest.TestCase):
 def test_unique_plural(self):
  f=['학생 세 명.','그 중 발표자가 있다.'];r=infer(f,target(f));self.assertEqual(r['status'],'PROVISIONAL_SOURCE_GROUP');self.assertEqual(r['nodes'][0]['cardinality'],3)
 def test_singular_abstain(self):
  f=['학생 한 명.','그 중 발표했다.'];self.assertEqual(infer(f,target(f))['status'],'ABSTAIN_NO_ADMISSIBLE_GROUP')
 def test_unknown_cardinality_abstain(self):
  f=['학생 여러 명.','그 중 발표했다.'];self.assertEqual(infer(f,target(f))['status'],'ABSTAIN_NO_ADMISSIBLE_GROUP')
 def test_quoted_numeric_trap(self):
  f=['"학생 세 명"이라는 문구.','그 중 발표했다.'];r=infer(f,target(f));self.assertIsNone(r['selected_global_span']);self.assertIn('QUOTED_CUE_RULE',r['excluded'][0]['exclusion_reasons'])
 def test_hypothetical_numeric_trap(self):
  f=['만약 학생 세 명이 온다면 그 중 발표했다.'];self.assertIsNone(infer(f,target(f))['selected_global_span'])
 def test_negation_trap(self):
  f=['학생 세 명이 없었다.','그 중 발표했다.'];r=infer(f,target(f));self.assertIsNone(r['selected_global_span']);self.assertIn('NEGATION_CUE_RULE',r['excluded'][0]['exclusion_reasons'])
 def test_competing_groups_abstain(self):
  f=['학생 세 명과 교사 두 명.','그 중 발표했다.'];r=infer(f,target(f));self.assertEqual(r['status'],'ABSTAIN_COMPETING_GROUPS');self.assertEqual(len(r['candidate_global_spans']),2)
 def test_segmentation_invariant(self):
  a=['학생 세 명.','아침이었다.','그 중 발표했다.'];b=['학생',' 세 명.아침이었다.그 중 발표했다.'];self.assertEqual(''.join(a),''.join(b));ra=infer(a,target(a));rb=infer(b,target(b));self.assertEqual(ra['selected_global_span'],rb['selected_global_span']);self.assertEqual(ra['prefix_sha256'],rb['prefix_sha256'])
 def test_suffix_noninterference(self):
  a=['학생 세 명.','그 중 발표했다.','교사 두 명.'];b=['학생 세 명.','그 중 열 마리였다.','새 후행 문맥.'];self.assertEqual(infer(a,target(a))['selected_global_span'],infer(b,target(b))['selected_global_span'])
 def test_multispan_source_witness(self):
  f=['학생 세',' 명.그 중 발표했다.'];r=infer(f,target(f));self.assertEqual(len(r['nodes'][0]['source_spans']),2)
 def test_window_limit(self):
  f=['학생 세 명.'+'아'*1100,'그 중 발표했다.'];self.assertIsNone(infer(f,target(f))['selected_global_span'])
 def test_filter_ablation_exposes_quoted_trap(self):
  f=['"학생 세 명"이라는 문구.','그 중 발표했다.'];self.assertIsNotNone(infer(f,target(f),filters=False)['selected_global_span'])
if __name__=='__main__':unittest.main()
