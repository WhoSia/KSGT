"""Original authored type-constraint cases, never independent human labels."""
import unittest
from test_r3_stream import target
from p62_r3_typed_inference import infer
class TypedTests(unittest.TestCase):
 def test_unrelated_negation_not_existence_denial(self):
  f=['학생 세 명이 모였고 불편은 없었다.','그 중 발표했다.'];self.assertIsNotNone(infer(f,target(f))['selected_global_span'])
 def test_shared_quoted_discourse(self):
  f=['"학생 세 명이 왔다. 그 중 발표했다."'];self.assertIsNotNone(infer(f,target(f))['selected_global_span'])
 def test_quote_scope_difference_blocks(self):
  f=['"학생 세 명"이라는 문구.','그 중 발표했다.'];self.assertIsNone(infer(f,target(f))['selected_global_span'])
 def test_adjacent_existence_denial_blocks(self):
  f=['학생 세 명이 없었다.','그 중 발표했다.'];self.assertIsNone(infer(f,target(f))['selected_global_span'])
 def test_target_counter_is_constraint_not_candidate(self):
  a=['학생 세 명과 고양이 두 마리.','그 중 두 명.'];b=['학생 세 명과 고양이 두 마리.','그 중 한 마리.'];ra=infer(a,target(a));rb=infer(b,target(b));self.assertIsNotNone(ra['selected_global_span']);self.assertNotEqual(ra['selected_global_span'],rb['selected_global_span']);self.assertTrue(all(n['global_end']<ra['target_constraint']['global_span'][0] for n in ra['prefix_nodes']))
 def test_cardinality_conflict_abstains(self):
  f=['학생 두 명.','그 중 세 명.'];self.assertIsNone(infer(f,target(f))['selected_global_span']);self.assertIn('CARDINALITY_CONSTRAINT_CONFLICT',infer(f,target(f))['blocked'][0]['exclusion_reasons'])
 def test_distant_future_cannot_change_constraint(self):
  a=['학생 세 명.','그 중 두 명.','새 문단 세 마리.'];b=a[:-1]+['다른 후행 열 건.'];self.assertEqual(infer(a,target(a))['selected_global_span'],infer(b,target(b))['selected_global_span'])
 def test_resegmentation_same_constraints(self):
  a=['학생 세 명.','그 중 두 명.'];b=['학생 세',' 명.그 중 두 명.'];self.assertEqual(infer(a,target(a))['selected_global_span'],infer(b,target(b))['selected_global_span'])
 def test_next_unit_quantity_not_target_local(self):
  a=['학생 세 명.','그 중','다른 문단.'];b=a[:-1]+['두 마리.'];self.assertEqual(infer(a,target(a))['selected_global_span'],infer(b,target(b))['selected_global_span']);self.assertIsNone(infer(b,target(b))['target_constraint'])
if __name__=='__main__':unittest.main()
