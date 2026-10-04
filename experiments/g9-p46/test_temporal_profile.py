#!/usr/bin/env python3
import unittest
from temporal_profile import compile_profile

class TemporalProfileTest(unittest.TestCase):
    def test_dense_profile_and_no_raw_reopen(self):
        fixture={
          "multi_horizon":{
            "1":{"pair_count":10,"coarse_jsd":{"median":0.1},"within_class_marker_mean_jsd":{"median":0.2}},
            "2":{"pair_count":9,"coarse_jsd":{"median":0.12},"within_class_marker_mean_jsd":{"median":0.23}},
            "3":{"pair_count":8,"coarse_jsd":{"median":0.13},"within_class_marker_mean_jsd":{"median":0.25}},
          },
          "support_size_sensitivity_by_horizon":{}
        }
        for h,c,f in [("1",0.1,0.2),("2",0.12,0.23),("3",0.13,0.25)]:
            fixture["support_size_sensitivity_by_horizon"][h]={}
            for b in ("1-9","10-49","50-199","200+"):
                fixture["support_size_sensitivity_by_horizon"][h][b]={
                    "n":100,"coarse_jsd":{"median":c},
                    "mean_within_class_marker_jsd":{"median":f}
                }
        out=compile_profile(fixture)
        self.assertFalse(out["raw_source_reopened"])
        self.assertTrue(out["dense_200_plus"]["coarse_nondecreasing"])
        self.assertTrue(out["dense_200_plus"]["within_marker_nondecreasing"])
        self.assertEqual(out["authority"],"DESCRIPTIVE_PROFILE_ONLY_NO_TEMPORAL_SCALING_LAW")

if __name__=="__main__":
    unittest.main()
