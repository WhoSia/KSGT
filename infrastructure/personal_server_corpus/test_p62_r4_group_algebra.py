"""Authored finite-set countermodels for P62-R4; not semantic Korean gold."""
import itertools
import unittest
from p62_r4_group_algebra import (
    union_bounds, target_test, bounded_join, authored_universe_court,
)
from p62_reference import TARGET
from p62_r4_discourse import infer, verify_graph


class ConditionalUnionAlgebraTests(unittest.TestCase):
    def test_three_plus_two_is_not_a_certain_five(self):
        bounds=union_bounds([3,2])
        self.assertEqual((bounds["lower"],bounds["upper"]),(3,5))
        self.assertIsNone(bounds["exact"])
        self.assertFalse(bounds["semantic_denotation_proven"])
        self.assertEqual(target_test(bounds,4),"UNRESOLVED_OVERLAP_MAY_MATTER")
        self.assertEqual(target_test(bounds,6),
                         "CONDITIONALLY_IMPOSSIBLE_UNDER_SET_ASSUMPTIONS")
        self.assertEqual(target_test(bounds,3),"NOT_REFUTED_NOT_VALIDATED")

    def test_counter_incompatibility_keeps_bounds_unknown(self):
        bounds=union_bounds([3,2],same_counter=False)
        self.assertIsNone(bounds["upper"])
        self.assertEqual(target_test(bounds,4),"HOLD_UNTYPED_OR_UNKNOWN_REQUIREMENT")

    def test_unparsed_component_keeps_bounds_unknown(self):
        self.assertIsNone(union_bounds([3,None])["upper"])
        self.assertIsNone(union_bounds([3,False])["upper"])

    def test_join_associativity_on_interval_bounds(self):
        vals=[{"lower":n,"upper":n} for n in range(1,5)]
        for a,b,c in itertools.product(vals,repeat=3):
            left=bounded_join(bounded_join(a,b),c)
            right=bounded_join(a,bounded_join(b,c))
            self.assertEqual((left["lower"],left["upper"]),
                             (right["lower"],right["upper"]))

    def test_bound_join_is_not_exact_set_union(self):
        a={"lower":3,"upper":3}
        twice=bounded_join(a,a)
        self.assertEqual((twice["lower"],twice["upper"]),(3,6))
        self.assertFalse(twice["exact_denotation_claim"])

    def test_invalid_join_is_hold(self):
        x=bounded_join({"lower":5,"upper":3},{"lower":2,"upper":2})
        self.assertEqual(x["status"],"HOLD_INVALID_OPERAND")

    def test_exhaustive_authored_set_enumeration(self):
        result=authored_universe_court(5)
        self.assertEqual(result["subset_count"],32)
        self.assertEqual(result["ordered_subset_pairs"],1024)
        self.assertGreater(result["distinct_cardinality_counterexamples"],0)
        self.assertEqual(result["qualified_human_judgments"],0)

    def test_r4_graph_preserves_bounds_without_cardinality_promotion(self):
        f=["학생 세 명과 교사 두 명이 모였다.","그 중 한 명이 말했다."]
        m=TARGET.search(f[1])
        t={"unit":1,"start":m.start(),"end":m.end(),"observed":True}
        result=infer(f,t)
        self.assertTrue(verify_graph(f,result))
        self.assertEqual(len(result["unions"]),1)
        union=result["unions"][0]
        self.assertEqual((union["conditional_set_bounds"]["lower"],
                          union["conditional_set_bounds"]["upper"]),(3,5))
        self.assertIsNone(union["total_cardinality"])
        self.assertFalse(union["reference_licensed"])

    def test_tampered_bound_fails_admission(self):
        f=["학생 세 명과 교사 두 명이 모였다.","그 중 한 명이 말했다."]
        m=TARGET.search(f[1])
        t={"unit":1,"start":m.start(),"end":m.end(),"observed":True}
        result=infer(f,t)
        result["unions"][0]["conditional_set_bounds"]["upper"]=3
        self.assertFalse(verify_graph(f,result))


if __name__=="__main__":
    unittest.main()
