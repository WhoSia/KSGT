"""R4 paired union countermodels: possibility is not source-grounded coreference."""
import unittest
from p62_reference import TARGET
from p62_r4_discourse import infer,verify_graph


def observed(forms):
    i=len(forms)-1
    m=TARGET.search(forms[i])
    if m is None:raise ValueError("Missing target")
    return {"unit":i,"start":m.start(),"end":m.end(),"observed":True}


class R4UnionPossibilityTests(unittest.TestCase):
    def test_four_is_overlap_dependent_not_nonexistent(self):
        f=["학생 세 명과 교사 두 명이 모였다.","그 중 네 명이 말했다."]
        r=infer(f,observed(f),use_target_constraints=True)
        self.assertEqual(r["status"],"HOLD_UNRESOLVED_COORDINATED_UNION_ONLY")
        self.assertEqual(r["union_diagnostics"][0]["verdict"],"UNRESOLVED_OVERLAP_MAY_MATTER")
        self.assertIsNone(r["selected"])
        self.assertTrue(verify_graph(f,r))

    def test_six_is_refuted_only_under_set_assumptions(self):
        f=["학생 세 명과 교사 두 명이 모였다.","그 중 여섯 명이 말했다."]
        r=infer(f,observed(f),use_target_constraints=True)
        self.assertEqual(r["status"],"ABSTAIN_NO_ADMISSIBLE_GROUP")
        self.assertEqual(r["union_diagnostics"][0]["verdict"],
                         "CONDITIONALLY_IMPOSSIBLE_UNDER_SET_ASSUMPTIONS")
        self.assertEqual(r["competing_union_ids"],[])
        self.assertIsNone(r["human_ground_truth"])

    def test_quote_scope_blocks_conditional_union_promotion(self):
        f=['그는 "학생 세 명과 교사 두 명이 왔다"라고 말했다.',
           "그 중 한 명이 발표했다."]
        r=infer(f,observed(f),use_target_constraints=True)
        self.assertEqual(r["union_diagnostics"][0]["verdict"],"HOLD_UNION_UNVERIFIED_ASSERTION_SCOPE")
        self.assertEqual(r["competing_union_ids"],[])
        self.assertIsNone(r["selected"])

    def test_target_suffix_can_change_compatibility_but_not_prefix_state(self):
        a=["학생 세 명과 교사 두 명이 모였다.","그 중 네 명이 말했다."]
        b=["학생 세 명과 교사 두 명이 모였다.","그 중 여섯 명이 말했다."]
        r=infer(a,observed(a),use_target_constraints=True)
        s=infer(b,observed(b),use_target_constraints=True)
        self.assertEqual(r["state_sha256"],s["state_sha256"])
        self.assertEqual(r["prefix_sha256"],s["prefix_sha256"])
        self.assertNotEqual(r["decision_sha256"],s["decision_sha256"])
        self.assertEqual([x["id"] for x in r["unions"]],[x["id"] for x in s["unions"]])

    def test_quoted_coordination_is_evidence_not_actual_world_entity(self):
        f=['그는 "학생 세 명과 교사 두 명이 함께 왔다"라고 말했다.',
           "그 중 두 명이 발표했다."]
        r=infer(f,observed(f))
        self.assertEqual(len(r["unions"]),1)
        self.assertTrue(verify_graph(f,r))
        self.assertIsNone(r["selected"])
        self.assertFalse(r["unions"][0]["reference_licensed"])

if __name__=="__main__":unittest.main()
