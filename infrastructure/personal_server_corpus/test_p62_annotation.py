"""Synthetic reviewer custody tests; no human evidence is created."""
import unittest, tempfile, pathlib, gzip, json
from p62_annotation import *
from p62_reference import import_ledger
import test_p62_reference as fixtures
class P62AnnotationTests(unittest.TestCase):
    def test_self_attestation_cannot_certify(self):
        _,_,x=fixtures.P62Tests().fixture();j=fixtures.P62Tests().judgment();j["item_id"]="synthetic"
        r=admit({"synthetic":x},[j]);self.assertEqual(r["verified_independent_responses"],0);self.assertIsNone(r["reliability"]["kappa"])
    def test_no_grounding_without_humans(self):
        self.assertEqual(evaluate_recovery({},[])["status"],"HOLD")
        self.assertIsNone(evaluate_recovery({},[])["primary"])
    def test_self_attested_import_never_emits_reliability(self):
        # Two self-attested reviewers do not constitute verified independent gold.
        _,_,item=fixtures.P62Tests().fixture()
        a=fixtures.P62Tests().judgment();a.update(item_id="synthetic",adjudicator_id="A")
        b={**a,"adjudicator_id":"B"}
        with tempfile.TemporaryDirectory() as tmp:
            root=pathlib.Path(tmp);packet=root/"packet.jsonl.gz";response=root/"responses.json";out=root/"import.json"
            with gzip.open(packet,"wt",encoding="utf-8") as f:
                f.write(json.dumps(item,ensure_ascii=False)+"\n")
            response.write_text(json.dumps([a,b],ensure_ascii=False),encoding="utf-8")
            import_ledger(packet,response,out)
            record=json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(record["self_attested_response_count"],2)
            self.assertEqual(record["reliability"]["status"],"HOLD")
            self.assertIsNone(record["reliability"]["kappa"])
            self.assertFalse(record["human_ground_truth_promoted"])
    def test_empty_registry(self):self.assertFalse(reviewer_verified("someone",{}))
    def test_verified_requires_all_fields(self):
        self.assertFalse(reviewer_verified("r",{"r":{"qualified":True,"independence_verified":True}}))
    def test_conflict_remains_hold(self):
        _,_,x=fixtures.P62Tests().fixture();a=fixtures.P62Tests().judgment();a.update(item_id="synthetic",adjudicator_id="A")
        b={**a,"adjudicator_id":"B","judgment":"NONREFERENTIAL"}
        registry={k:{"qualified":True,"independence_verified":True,"verification_evidence":"SYNTHETIC_FIXTURE","verified_by":"TEST"} for k in ["A","B"]}
        r=admit({"synthetic":x},[a,b],registry);self.assertEqual(r["conflicts"][0]["status"],"HOLD");self.assertFalse(r["packet_ground_truth_mutated"])
if __name__=="__main__":unittest.main()

