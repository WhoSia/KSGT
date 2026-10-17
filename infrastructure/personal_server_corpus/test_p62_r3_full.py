"""Original synthetic tests for full frozen-cohort R3 scanner."""
import unittest
from p62_r3_full_court import analyze_structure, METRICS

class FullCohortR3Tests(unittest.TestCase):
    def test_full_court_one_target(self):
        forms=["학생 세 명, 운동장에 모였다.","고양이 두 마리, 정원에 있었다.",
               "그 중 두 명, 발표를 준비했다.","행사가 시작되었다.","모두 돌아갔다."]
        r=analyze_structure(forms,"synthetic","synthetic-work","TEST",2026)
        self.assertEqual(r["targets"],1)
        self.assertEqual(r["paragraphs"],5)
        self.assertEqual(set(r["metrics"]),set(METRICS))
        self.assertTrue(all(v in (0,1) for v in r["metrics"].values()))
    def test_zero_target_structure_retained(self):
        r=analyze_structure(["아침.","점심.","저녁."],"synthetic","work","TEST",2026)
        self.assertEqual(r["targets"],0)
        self.assertTrue(all(v==0 for v in r["metrics"].values()))
    def test_no_semantic_accuracy_in_machine_metrics(self):
        self.assertNotIn("SEMANTIC_ACCURACY",METRICS)

if __name__=="__main__":
    unittest.main()
