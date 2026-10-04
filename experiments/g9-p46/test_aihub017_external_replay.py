#!/usr/bin/env python3
import unittest
from aihub017_external_replay import jsd,features,wilson_lower

class AIHub017ReplayTests(unittest.TestCase):
    def test_zero_jsd(self):
        self.assertAlmostEqual(jsd([1,2,3],[1,2,3]),0.0,places=12)
    def test_exclusive_overlap(self):
        legacy,exclusive=features("또한 또")
        from aihub017_external_replay import MARKERS
        i1,i2=MARKERS.index("또한"),MARKERS.index("또")
        self.assertEqual((legacy[i1],legacy[i2]),(1,2))
        self.assertEqual((exclusive[i1],exclusive[i2]),(1,1))
    def test_wilson_all_successes_15(self):
        self.assertAlmostEqual(wilson_lower(15,15),0.7961166989641514,places=12)

if __name__=="__main__":
    unittest.main()
