"""Original synthetic Korean fixtures only; no licensed source text."""
import collections, json, pathlib, tempfile, unittest
from p62_reference import *

class P62Tests(unittest.TestCase):
    def fixture(self):
        forms=["세 학생이 왔다.","그 중 한 명이 떠났다.","두 교사가 남았다."]
        t={"unit":1,"start":0,"end":4,"observed":True}
        original={"item_id":"synthetic","strict_structure":"fixture","stratum":"TEST","rule_category":"TEST"}
        x=observation(forms,t,original,"work");x["packet_hash"]="sealed"
        return forms,t,x
    def judgment(self):
        return {"authority":"INDEPENDENT_HUMAN","adjudicator_id":"synthetic-reviewer","qualification_evidence":"SYNTHETIC_TEST_ONLY",
                "independence_attestation":True,"timestamp":"2000-01-01T00:00:00Z","item_hash":"sealed","judgment":"UNRESOLVED",
                "antecedent_spans":[],"omitted_arguments":[],"confidence":.3}
    def test_framed_key(self):self.assertNotEqual(key(["ab","c"]),key(["a","bc"]))
    def test_domain(self):self.assertNotEqual(key(["a"],"one"),key(["a"],"two"))
    def test_future_not_antecedent(self):
        _,_,x=self.fixture();j=self.judgment();j.update(judgment="REFERENTIAL",antecedent_spans=[{"unit":2,"start":0,"end":2}])
        with self.assertRaises(ValueError):validate_judgment(x,j)
    def test_cataphoric_explicit(self):
        _,_,x=self.fixture();j=self.judgment();j.update(judgment="CATAPHORIC",antecedent_spans=[{"unit":2,"start":0,"end":2}])
        self.assertTrue(validate_judgment(x,j))
    def test_null_ground_truth(self):
        _,_,x=self.fixture();self.assertIsNone(x["human_ground_truth"]);self.assertEqual(x["independent_adjudications"],[])
    def test_no_machine_gold(self):
        _,_,x=self.fixture();j=self.judgment();j["authority"]="MACHINE"
        with self.assertRaises(ValueError):validate_judgment(x,j)
    def test_span_unicode(self):
        self.assertTrue(validate_span({"unit":0,"start":0,"end":3},{0:"가나다"}))
        with self.assertRaises(ValueError):validate_span({"unit":0,"start":0,"end":4},{0:"가나다"})
    def test_omission_not_span(self):
        _,_,x=self.fixture();j=self.judgment();j["omitted_arguments"]=[{"observed_span":{"start":0}}]
        with self.assertRaises(ValueError):validate_judgment(x,j)
    def test_omission_evidence(self):
        _,_,x=self.fixture();j=self.judgment();j["omitted_arguments"]=[{"observed_span":None,"evidence_span":{"unit":0,"start":0,"end":2},"confidence":None}]
        self.assertTrue(validate_judgment(x,j))
    def test_empty_human_reliability(self):self.assertIsNone(reliability({},[])["kappa"])
    def test_independent_ids_required(self):
        _,_,x=self.fixture();j=self.judgment();j["adjudicator_id"]=""
        with self.assertRaises(ValueError):validate_judgment(x,j)
    def test_duplicate_reviewer_rejected(self):
        _,_,x=self.fixture();j=self.judgment();j["item_id"]="synthetic"
        with self.assertRaises(ValueError):reliability({"synthetic":x},[j,j])
    def test_random_order_reproducible(self):
        f,t,_=self.fixture();cs=candidates(f,t)
        self.assertEqual(mask_order(cs,"i","A"),mask_order(list(reversed(cs)),"i","A"))
    def test_prediction_mask(self):
        _,_,x=self.fixture();s=review_html([x],"A")
        self.assertNotIn("machine_predictions",s);self.assertNotIn("SURFACE_PROPOSAL_ONLY",s)
        self.assertIn("ABSTAIN",s);self.assertIn("\\u003c",review_html([{**x,"context":[{"unit":0,"text":"</script>"}]}],"A"))
    def test_same_unit_relation(self):
        t={"unit":1,"start":5,"end":8}
        self.assertEqual(relation(1,0,4,t),"PAST_INTRA");self.assertEqual(relation(1,9,12,t),"FUTURE_INTRA_CONTROL")
    def test_event_counter(self):
        self.assertEqual(COUNT.search("세 차례 실패했다.").group("counter"),"차례")
    def test_overlap_excluded(self):
        f,t,_=self.fixture()
        self.assertTrue(all(c["relation"]!="OVERLAPPING_TARGET" for c in candidates(f,t)))
    def test_symmetric_exclusion(self):
        f,t,_=self.fixture();self.assertFalse(summary(f,t)[1]["eligible"])
    def test_zero_difference_retained(self):
        r=bootstrap([("a","d1",0),("b","d2",1)],50);self.assertEqual(r["zero_difference_documents"],1);self.assertEqual(r["estimate_pp"],50)
    def test_clusters_move_versions(self):
        r=bootstrap([("a","d1",0),("a","d2",1)],20);self.assertEqual(r["components"],1);self.assertEqual(r["interval95_pp"],[50,50])
    def test_identity_different_not_merge(self):
        self.assertEqual(source_link_classification(2,2),"UNRESOLVED_DIFFERENT_TEXT")
    def test_structural_vs_representation(self):
        self.assertEqual(source_link_classification(2,1),"SAME_FLATTENED_TEXT_DIFFERENT_STRUCTURE")
    def test_span_alignment(self):
        self.assertEqual(span_iou({"unit":0,"start":0,"end":4},{"unit":0,"start":2,"end":6}),1/3)
    def test_no_past_candidate(self):
        self.assertIsNone(rank_candidate(["아침."],{"unit":0,"start":0,"end":1},[]))
    def test_no_ledger_overwrite(self):
        with tempfile.TemporaryDirectory() as td:
            p=pathlib.Path(td)/"existing";p.write_text("preserve")
            with self.assertRaises(FileExistsError):import_ledger("missing","missing",p)
if __name__=="__main__":unittest.main()

