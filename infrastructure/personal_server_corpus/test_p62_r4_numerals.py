"""P62-R4 numeral coverage and unparsed-target conservative HOLD regressions."""
import unittest
from p62_reference import TARGET
from p62_r4_discourse import infer, verify_graph

def target(forms):
    i=len(forms)-1
    m=TARGET.search(forms[i])
    if m is None:
        raise ValueError("Missing synthetic target")
    return {"unit":i,"start":m.start(),"end":m.end(),"observed":True}


class R4NumeralAdmissibilityTests(unittest.TestCase):
    def test_five_is_parsed_in_source_and_target(self):
        f=["학생 다섯 명이 도착했다.","그 중 세 명이 남았다."]
        r=infer(f,target(f),use_target_constraints=True)
        self.assertEqual(r["nodes"][0]["cardinality"],5)
        self.assertEqual(r["target_local_constraint"]["cardinality"],3)
        self.assertIsNotNone(r["selected"])
        self.assertTrue(verify_graph(f,r))

    def test_five_target_exceeds_three_group(self):
        f=["학생 세 명이 왔다.","그 중 다섯 명이 떠났다."]
        r=infer(f,target(f),use_target_constraints=True)
        self.assertEqual(r["target_local_constraint"]["cardinality"],5)
        self.assertIsNone(r["selected"])
        self.assertEqual(r["status"],"ABSTAIN_NO_ADMISSIBLE_GROUP")

    def test_unknown_quantity_cannot_silently_disable_constraint(self):
        f=["학생 세 명이 왔다.","그 중 스무 명이 떠났다."]
        r=infer(f,target(f),use_target_constraints=True)
        self.assertEqual(r["status"],"HOLD_UNPARSED_TARGET_REQUIREMENT")
        self.assertIsNone(r["selected"])
        self.assertEqual(len(r["nodes"]),1)
        self.assertEqual(r["target_local_constraint"]["status"],"UNPARSED_TARGET_QUANTITY_HOLD")

    def test_unknown_quantity_has_no_effect_on_prefix_state(self):
        a=["학생 세 명이 왔다.","그 중 두 명이 떠났다."]
        b=["학생 세 명이 왔다.","그 중 스무 명이 떠났다."]
        ta,tb=target(a),target(b)
        old,new=infer(a,ta),infer(b,tb)
        self.assertEqual(old["state_sha256"],new["state_sha256"])
        self.assertEqual(old["status"],new["status"])

    def test_unseen_source_group_is_not_fake_known_cardinality(self):
        f=["학생 스무 명이 도착했다.","그 중 한 명이 말했다."]
        r=infer(f,target(f),use_target_constraints=True)
        self.assertEqual(r["nodes"],[])
        self.assertIsNone(r["selected"])
        self.assertFalse(r["human_ground_truth"])

if __name__=="__main__":
    unittest.main()
