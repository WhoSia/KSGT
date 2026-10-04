#!/usr/bin/env python3
"""Static contract tests for G9-P46 learned/hybrid rival admission."""
import unittest

REQUIRED = {
    "frozen_mapping",
    "temporal_alignment",
    "source_transport",
    "counterfactual_selectivity",
    "decision_distance",
}

def admissible_report(report):
    return REQUIRED.issubset(report) and not report.get("semantic_names_from_correlation", False)

class LearnedContractTests(unittest.TestCase):
    def test_accuracy_only_report_is_rejected(self):
        self.assertFalse(admissible_report({"accuracy":0.99}))
    def test_semantic_name_from_correlation_is_rejected(self):
        r={k:0 for k in REQUIRED}
        r["semantic_names_from_correlation"]=True
        self.assertFalse(admissible_report(r))
    def test_full_nonsemantic_report_is_admissible(self):
        r={k:0 for k in REQUIRED}
        self.assertTrue(admissible_report(r))

if __name__=="__main__":
    unittest.main()
