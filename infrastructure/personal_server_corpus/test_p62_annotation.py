"""Synthetic reviewer custody tests; no human evidence is created."""
import unittest
from p62_annotation import *
import test_p62_reference as fixtures
class P62AnnotationTests(unittest.TestCase):
    def test_self_attestation_cannot_certify(self):
        _,_,x=fixtures.P62Tests().fixture();j=fixtures.P62Tests().judgment();j["item_id"]="synthetic"
        r=admit({"synthetic":x},[j]);self.assertEqual(r["verified_independent_responses"],0);self.assertIsNone(r["reliability"]["kappa"])
    def test_no_grounding_without_humans(self):
        self.assertEqual(evaluate_recovery({},[])["status"],"HOLD")
        self.assertIsNone(evaluate_recovery({},[])["primary"])
    def test_empty_registry(self):self.assertFalse(reviewer_verified("someone",{}))
    def test_verified_requires_all_fields(self):
        self.assertFalse(reviewer_verified("r",{"r":{"qualified":True,"independence_verified":True}}))
    def test_conflict_remains_hold(self):
        _,_,x=fixtures.P62Tests().fixture();a=fixtures.P62Tests().judgment();a.update(item_id="synthetic",adjudicator_id="A")
        b={**a,"adjudicator_id":"B","judgment":"NONREFERENTIAL"}
        registry={k:{"qualified":True,"independence_verified":True,"verification_evidence":"SYNTHETIC_FIXTURE","verified_by":"TEST"} for k in ["A","B"]}
        r=admit({"synthetic":x},[a,b],registry);self.assertEqual(r["conflicts"][0]["status"],"HOLD");self.assertFalse(r["packet_ground_truth_mutated"])
if __name__=="__main__":unittest.main()

