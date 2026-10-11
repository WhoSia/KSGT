"""Synthetic mechanism and Unicode review regressions."""
import unittest
from p62_reference import *
from p62_controls import evaluate
from p62_review import render
class P62ControlTests(unittest.TestCase):
    def rows(self):return {x["name"]:x for x in evaluate()["cases"]}
    def test_unrelated_numeric_indistinguishable(self):
        r=self.rows();self.assertEqual(r["EXPLICIT_INTER"]["machine"]["measures"]["COUNTER_COMPATIBLE_INTER_ONLY"],r["UNRELATED_NUMERIC"]["machine"]["measures"]["COUNTER_COMPATIBLE_INTER_ONLY"])
    def test_intra_missed_inter(self):
        m=self.rows()["INTRA_PARAGRAPH"]["machine"]["measures"];self.assertEqual(m["GROUP_INTER_ONLY"],0);self.assertEqual(m["GROUP_WITH_INTRA"],1)
    def test_metalinguistic_false_positive(self):
        self.assertEqual(self.rows()["METALINGUISTIC"]["machine"]["measures"]["GROUP_INTER_ONLY"],1)
    def test_future_reversal(self):self.assertEqual(self.rows()["FORWARD_NUMERIC"]["machine"]["measures"]["GROUP_INTER_ONLY"],-1)
    def test_synthetic_not_human(self):self.assertTrue(all(x["human_ground_truth"] is None for x in evaluate()["cases"]))
    def test_unicode_renderer(self):
        x={"item_id":"fixture","packet_hash":"seal","target":{"unit":0,"start":1,"end":2},"context":[{"unit":0,"text":"😀가나다"}],"candidates":[]}
        self.assertIn("Array.from(p.text).slice",render([x],"A"))
    def test_counter_particle_undercoverage_preserved(self):
        self.assertIsNone(COUNT.search("세 명이 모였다."))
        self.assertIsNotNone(COUNT.search("세 명, 모두 모였다."))
    def test_omission_prompts_not_gold(self):
        self.assertEqual(evaluate()["independent_human_judgments"],0)
if __name__=="__main__":unittest.main()

