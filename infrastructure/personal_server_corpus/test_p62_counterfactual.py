"""Synthetic tests for particle boundaries and circular counter controls."""
import unittest
from p62_counterfactual import measure
from p62_particle import STRICT,PARTICLE
from p62_reference import TARGET
class P62CounterfactualTests(unittest.TestCase):
    def fixture(self,extra_future=False):
        f=["아침이 밝았다.","행사가 시작되었다.","학생 세 명, 그 중 두 명, 발표를 맡았다.","두 명, 질문했다." if extra_future else "발표가 끝났다.","행사가 끝났다."]
        m=TARGET.search(f[2]);return f,{"unit":2,"start":m.start(),"end":m.end()}
    def test_anchor_mechanically_changes_feature(self):
        f,t=self.fixture();v=measure(f,t,STRICT);self.assertTrue(v["self_hit"]);self.assertEqual(v["masked"]-v["raw"],1)
    def test_other_future_preserved(self):
        f,t=self.fixture(True);v=measure(f,t,STRICT);self.assertTrue(v["self_hit"]);self.assertFalse(v["changed"])
    def test_particle_admission(self):self.assertIsNotNone(PARTICLE.search("세 명이 모였다."))
    def test_not_lexical_counter_prefix(self):self.assertIsNone(PARTICLE.search("세 개발자가 모였다."))
    def test_boundary_context_exclusion(self):
        f,t=self.fixture();self.assertIsNone(measure(f[:3],t,STRICT))
if __name__=="__main__":unittest.main()

