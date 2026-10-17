"""Original synthetic corpus-kernel regressions, not independently labeled usage."""
import unittest
from p62_r3_stream_court import analyze,METRICS
class CourtTests(unittest.TestCase):
 def test_zero_targets_retained(self):
  r=analyze(['아침.','점심.'],'synthetic','work','TEST',2026);self.assertEqual(r['targets'],0);self.assertTrue(all(v==0 for v in r['metrics'].values()))
 def test_partition_of_target_decisions(self):
  r=analyze(['학생 세 명.','그 중 발표했다.'],'synthetic','work','TEST',2026);self.assertEqual(r['targets'],1);self.assertEqual(sum(r['metrics'][k] for k in ('PROPOSAL','AMBIGUOUS','NO_GROUP')),1);self.assertEqual(set(r['metrics']),set(METRICS))
 def test_filter_ablation_is_counted(self):
  r=analyze(['"학생 세 명"이라는 문구.','그 중 발표했다.'],'synthetic','work','TEST',2026);self.assertEqual(r['metrics']['NO_FILTER_POLICY_CHANGE'],1);self.assertEqual(r['metrics']['QUOTED_CUE_EXCLUSION'],1)
 def test_particle_coverage_exposes_old_inventory_gap(self):
  r=analyze(['학생 세 명과 교사 두 명.','그 중 발표했다.'],'synthetic','work','TEST',2026);self.assertEqual(r['metrics']['PARTICLE_EXTRA_CUE'],1);self.assertEqual(r['metrics']['AMBIGUOUS'],1)
if __name__=='__main__':unittest.main()
