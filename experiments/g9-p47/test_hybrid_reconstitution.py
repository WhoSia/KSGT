#!/usr/bin/env python3
import unittest
from hybrid_reconstitution import decide

class HybridTests(unittest.TestCase):
    def test_high_score_cannot_override_supported_plurality(self):
        d=decide({"OVERT":0.99,"NULL":0.01},{"OVERT":"SUPPORTED","NULL":"SUPPORTED"},{})
        self.assertEqual(d.status,"SET_VALUED")
        self.assertEqual(d.admissible,frozenset({"OVERT","NULL"}))
        self.assertEqual(d.ranking_hint[0],"OVERT")

    def test_unsupported_high_score_is_not_legalized(self):
        d=decide({"OVERT":0.01,"NULL":0.99},{"OVERT":"SUPPORTED","NULL":"UNSUPPORTED"},{})
        self.assertEqual(d.admissible,frozenset({"OVERT"}))

    def test_promoted_typed_veto_applies_before_score(self):
        d=decide({"OVERT":0.99,"NULL":0.01},{"OVERT":"SUPPORTED","NULL":"SUPPORTED"},{"OVERT":True})
        self.assertEqual(d.admissible,frozenset({"NULL"}))

    def test_unknown_only_abstains(self):
        d=decide({"OVERT":0.7,"NULL":0.3},{"OVERT":"UNKNOWN","NULL":"UNKNOWN"},{})
        self.assertEqual(d.status,"ABSTAIN")

    def test_out_of_domain_abstains(self):
        d=decide({"OVERT":1.0,"NULL":0.0},{"OVERT":"SUPPORTED","NULL":"UNSUPPORTED"},{},False)
        self.assertEqual(d.status,"ABSTAIN")

    def test_all_supported_vetoed_is_conflict_not_forced(self):
        d=decide({"OVERT":0.9,"NULL":0.1},{"OVERT":"SUPPORTED","NULL":"UNSUPPORTED"},{"OVERT":True})
        self.assertEqual(d.status,"REVIEW")

if __name__=="__main__":
    unittest.main()
