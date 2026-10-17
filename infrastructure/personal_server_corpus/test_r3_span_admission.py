"""Original source-boundary falsifiers; no human reference labels."""
import unittest
from p62_r3_span_admission import admit
from p62_r3_typed_inference import infer
from test_r3_stream import target
class AdmissionTests(unittest.TestCase):
 def test_single_unit_fragment_not_semantic_reference(self):
  f=['학생 세 명.','그 중 발표했다.'];r=admit(f,target(f),infer(f,target(f)));self.assertEqual(r['status'],'VERIFIED_SOURCE_FRAGMENT_ONLY');self.assertFalse(r['reference_licensed'])
 def test_cross_unit_numeric_fragment_quarantined(self):
  f=['학생 세',' 명.그 중 발표했다.'];r=admit(f,target(f),infer(f,target(f)));self.assertEqual(r['status'],'HOLD_MULTIUNIT_EXPRESSION_WITNESS');self.assertIsNone(r['admitted_selected_global_span'])
 def test_forward_span_rejected(self):
  f=['학생 세 명.','그 중 두 명.']
  with self.assertRaises(ValueError):admit(f,target(f),{'selected_global_span':[20,23]})
 def test_boolean_span_rejected(self):
  f=['학생 세 명.','그 중 발표했다.']
  with self.assertRaises(ValueError):admit(f,target(f),{'selected_global_span':[False,7]})
 def test_invalid_fragment_rejected(self):
  f=['학생 세 명.','그 중 발표했다.']
  with self.assertRaises(ValueError):admit(f,target(f),{'selected_global_span':[0,2]})
 def test_existing_abstention_preserved(self):
  f=['아침.','그 중 발표했다.'];self.assertEqual(admit(f,target(f),infer(f,target(f)))['status'],'ABSTAIN')
 def test_truncated_numeric_source_witness_quarantined(self):
  f=['학생 123 명.','그 중 발표했다.'];r=admit(f,target(f),{'selected_global_span':[4,8]});self.assertEqual(r['status'],'HOLD_TRUNCATED_OR_CONTEXT_INVALID_FRAGMENT')
if __name__=='__main__':unittest.main()
