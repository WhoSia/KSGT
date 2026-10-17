"""Original synthetic typed-court instrument checks, never semantic gold."""
import unittest
from p62_r3_typed_court import analyze
class TypedCourtTests(unittest.TestCase):
 def test_zero_document(self):
  r=analyze(['아침.'],'synthetic','work','TEST',2026);self.assertEqual(r['targets'],0)
 def test_quantity_conflict_instrument(self):
  r=analyze(['학생 두 명.','그 중 세 명.'],'synthetic','work','TEST',2026);self.assertEqual(r['metrics']['CARDINALITY_CONFLICT'],1);self.assertEqual(r['metrics']['PROPOSAL'],0);self.assertEqual(r['metrics']['HAS_TARGET_CONSTRAINT'],1)
 def test_counter_constraint_changes_ambiguity(self):
  r=analyze(['학생 세 명과 고양이 두 마리.','그 중 두 명.'],'synthetic','work','TEST',2026);self.assertEqual(r['metrics']['NO_TARGET_CONSTRAINT_POLICY_CHANGE'],1);self.assertEqual(r['metrics']['PROPOSAL'],1)
 def test_boundary_sensitivity_is_measured(self):
  r=analyze(['학생 세 명.','그 중','두 마리.'],'synthetic','work','TEST',2026);self.assertEqual(r['metrics']['MERGE_SEGMENTATION_CHANGE'],1)
if __name__=='__main__':unittest.main()
