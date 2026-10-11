"""Original synthetic regressions for R2 identity and annotation authority."""
import hashlib,json,unittest
from p62_reference import observation,key,TARGET,summary
from p62_r2 import *
from p62_counterfactual import measure
from p62_particle import STRICT
class R2Tests(unittest.TestCase):
    def item(self):
        forms=["학생 세 명, 도착했다.","아침이 밝았다.","그 중 두 명, 발표했다.","점심이 왔다.","행사가 끝났다."]
        m=TARGET.search(forms[2]);t={"unit":2,"start":m.start(),"end":m.end(),"observed":True}
        x=observation(forms,t,{"item_id":"fixture","strict_structure":"version","stratum":"TEST","rule_category":"TEST"},"work")
        x["packet_hash"]="sealed";return x
    def judgment(self,x):
        return {"authority":"INDEPENDENT_HUMAN","adjudicator_id":"r","qualification_evidence":"SELF_DECLARED_SYNTHETIC",
            "independence_attestation":True,"timestamp":"2000-01-01T00:00:00Z","item_hash":"sealed",
            "target_identity":canonical_target(x),"judgment":"UNRESOLVED","antecedent_spans":[],
            "omitted_arguments":[],"confidence":0.5}
    def test_legacy_registry_self_verifier_rejected(self):
        from p62_annotation import reviewer_verified
        self.assertFalse(reviewer_verified("r",{"r":{"qualified":True,"independence_verified":True,"verification_evidence":"self","verified_by":"r"}}))
    def test_self_attestation_no_gold(self):
        x=self.item();j=self.judgment(x)
        self.assertFalse(validate_response(x,j,{"r":{"qualified":True,"independence_verified":True}}))
    def test_self_verifier_rejected(self):
        r={"r":{"qualified":True,"independence_verified":True,"verified_by":"r","verification_evidence":"x","verification_timestamp":"x","authority_root":"x"}}
        sha=hashlib.sha256(json.dumps(r,sort_keys=True,separators=(",",":")).encode()).hexdigest()
        self.assertEqual(admissible_registry(r,sha),{})
    def test_unsealed_registry_rejected(self):
        r={"r":{"qualified":True,"independence_verified":True,"verified_by":"other","verification_evidence":"x","verification_timestamp":"x","authority_root":"x"}}
        self.assertEqual(admissible_registry(r),{})
    def test_registry_hash_changed_rejected(self):
        self.assertEqual(admissible_registry({"r":{}},"incorrect"),{})
    def test_framed_target_version(self):
        x=self.item();a=canonical_target(x);x["strict_structure"]="alternative";self.assertNotEqual(a,canonical_target(x))
    def test_framed_target_work(self):
        x=self.item();a=canonical_target(x);x["source_work_key"]="different";self.assertNotEqual(a,canonical_target(x))
    def test_boolean_offset_rejected(self):
        x=self.item();x["target"]["start"]=False
        with self.assertRaises(ValueError):canonical_target(x)
    def test_missing_work_rejected(self):
        x=self.item();x["source_work_key"]=""
        with self.assertRaises(ValueError):canonical_target(x)
    def test_wrong_target_text_rejected(self):
        x=self.item();x["target"]["end"]+=3
        with self.assertRaises(ValueError):canonical_target(x)
    def test_response_wrong_target_identity(self):
        x=self.item();j=self.judgment(x);j["target_identity"]="other"
        with self.assertRaises(ValueError):validate_response(x,j,{})
    def test_pseudoanchor_cannot_resolve_overt_expression(self):
        x=self.item();x["target"]={"unit":2,"start":0,"end":0,"observed":False}
        j=self.judgment(x);j.update(judgment="REFERENTIAL",antecedent_spans=[{"unit":0,"start":0,"end":2}])
        with self.assertRaises(ValueError):validate_response(x,j,{})
    def test_cataphoric_requires_future_span(self):
        x=self.item();j=self.judgment(x);j.update(judgment="CATAPHORIC",antecedent_spans=[{"unit":0,"start":0,"end":2}])
        with self.assertRaises(ValueError):validate_response(x,j,{})
    def test_nonreference_cannot_assert_antecedent(self):
        x=self.item();j=self.judgment(x);j.update(judgment="NONREFERENTIAL",antecedent_spans=[{"unit":0,"start":0,"end":2}])
        with self.assertRaises(ValueError):validate_response(x,j,{})
    def test_boolean_confidence_rejected(self):
        x=self.item();j=self.judgment(x);j["confidence"]=True
        with self.assertRaises(ValueError):validate_response(x,j,{})
    def test_invalid_candidate_relation(self):
        x=self.item();c=dict(x["candidates"][0]);c["relation"]="FUTURE_INTER_CONTROL"
        with self.assertRaises(ValueError):candidate_identity(x,c)
    def test_candidate_identity_carries_source(self):
        x=self.item();c=x["candidates"][0];k=candidate_identity(x,c);x["source_work_key"]="other";self.assertNotEqual(k,candidate_identity(x,c))
    def test_duplicate_collapse(self):
        x=self.item();y=dict(x,item_id="other")
        self.assertEqual(len(group_targets([x,y])),1);self.assertEqual(duplicate_contract([x,y])["status"],"VERIFIED")
    def test_duplicate_conflicting_context_quarantined(self):
        x=self.item();y=dict(x,context=[dict(z) for z in x["context"]]);y["context"][0]["text"]+="변경"
        self.assertEqual(duplicate_contract([x,y])["status"],"HOLD")
    def test_duplicate_conflicting_inventory_quarantined(self):
        x=self.item();y=dict(x,candidates=x["candidates"][:-1])
        self.assertEqual(duplicate_contract([x,y])["status"],"HOLD")
    def test_pseudoanchor_not_negative_gold(self):
        x=self.item();x["target"]["observed"]=False
        self.assertFalse(negative_taxonomy(x)["semantic_negative_admitted"])
    def test_other_demonstrative_quarantine(self):
        x=self.item();x["target"]={"unit":1,"start":0,"end":2,"observed":False};x["context"][1]["text"]="그들은 떠났다."
        self.assertEqual(negative_taxonomy(x)["tier"],"DEMONSTRATIVE_OVERLAPS_PSEUDOANCHOR")
        self.assertFalse(negative_taxonomy(x)["structural_placebo_admitted"])
    def test_pseudoanchor_point_is_not_observed_span(self):
        x=self.item();x["target"]={"unit":1,"start":0,"end":0,"observed":False}
        self.assertTrue(canonical_target(x));self.assertFalse(negative_taxonomy(x)["semantic_negative_admitted"])
    def test_weak_metadata_never_identity(self):
        self.assertEqual(exact_relation(["첫 글"],["다른 글"]),"UNRESOLVED")
    def test_exact_subset(self):
        self.assertEqual(exact_relation(["a"],["x","a","y"]),"EXACT_CONTIGUOUS_UNIT_SUBSET")
    def test_exact_resegmentation(self):
        self.assertEqual(exact_relation(["ab","cd"],["a","bcd"]),"EXACT_CONCATENATION_DIFFERENT_BOUNDARIES")
    def test_segmentation_reversal_same_concat(self):
        a=["세 명.","봄여름가을겨울.","그 중.","아침.","점심.","두 명.","저녁."]
        b=["세 명.","봄","여름","가을겨울.","그 중.","아침.점심.두 명.","저녁."]
        def value(f):
            i=next(i for i,t in enumerate(f) if TARGET.search(t));m=TARGET.search(f[i])
            return summary(f,{"unit":i,"start":m.start(),"end":m.end()})[1]["measures"]["GROUP_INTER_ONLY"]
        self.assertEqual("".join(a),"".join(b));self.assertEqual(value(a),1);self.assertEqual(value(b),-1)
    def test_circular_anchor_flip(self):
        f=["아침.","행사.","학생 세 명, 그 중 두 명, 발표를 맡았다.","발표가 끝났다.","행사가 끝났다."]
        m=TARGET.search(f[2]);t={"unit":2,"start":m.start(),"end":m.end()};v=measure(f,t,STRICT)
        self.assertTrue(v["self_hit"]);self.assertGreater(v["masked"],v["raw"])
    def test_split_moves_work_together(self):
        self.assertEqual(source_work_split("work"),source_work_split("work"))
if __name__=="__main__":unittest.main()
