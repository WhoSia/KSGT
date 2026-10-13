"""Authored P62-R4 source composition, scope and prefix-state falsifiers.

No fixture is an independently adjudicated Korean reference annotation.
"""
import copy
import random
import unittest

from p62_reference import TARGET
from p62_r4_discourse import infer, verify_graph, verify_witness


def target(forms, unit=None):
    matches = [(i,m) for i,source in enumerate(forms) for m in TARGET.finditer(source)]
    if unit is not None:
        matches=[(i,m) for i,m in matches if i==unit]
    if len(matches)!=1:
        raise ValueError("One synthetic target required")
    i,m=matches[0]
    return {"unit":i,"start":m.start(),"end":m.end(),"observed":True}


class OriginalGroupCompositionTests(unittest.TestCase):
    def test_explicit_two_group_coordination_emits_nonfabricated_union(self):
        forms=["학생 세 명과 교사 두 명이 모였다.","그 중 한 명이 발표했다."]
        r=infer(forms,target(forms))
        self.assertEqual(len(r["unions"]),1)
        union=r["unions"][0]
        self.assertEqual(union["kind"],"PROPOSED_COORDINATED_GROUP_UNION")
        self.assertEqual(len(union["component_witnesses"]),2)
        self.assertNotIn("selected_global_span",union)
        self.assertIsNone(union["total_cardinality"])
        self.assertFalse(union["reference_licensed"])
        self.assertTrue(verify_graph(forms,r))
        self.assertEqual(r["status"],"HOLD_COORDINATED_COMPOSITION_AMBIGUOUS")

    def test_explicit_conjunction_never_proves_arithmetic_union(self):
        forms=["학생 세 명과 교사 두 명이 모였다.","그 중 네 명이 나갔다."]
        r=infer(forms,target(forms),use_target_constraints=True)
        self.assertEqual(len(r["unions"]),1)
        self.assertIsNone(r["unions"][0]["total_cardinality"])
        self.assertEqual(r["status"],"HOLD_UNRESOLVED_COORDINATED_UNION_ONLY")
        self.assertEqual(r["union_diagnostics"][0]["verdict"],"UNRESOLVED_OVERLAP_MAY_MATTER")
        self.assertIsNone(r["selected"])
        self.assertTrue(verify_graph(forms,r))

    def test_uncoordinated_adjacency_not_union(self):
        forms=["학생 세 명, 교사 두 명이 모였다.","그 중 한 명이 말했다."]
        r=infer(forms,target(forms))
        self.assertEqual(r["unions"],[])
        self.assertEqual(len(r["nodes"]),2)

    def test_disjunction_is_not_union(self):
        forms=["학생 세 명 또는 교사 두 명이 모였다.","그 중 한 명이 말했다."]
        self.assertEqual(infer(forms,target(forms))["unions"],[])

    def test_contrast_marker_not_union(self):
        forms=["학생 세 명과는 별개로 교사 두 명이 모였다.","그 중 한 명이 말했다."]
        self.assertEqual(infer(forms,target(forms))["unions"],[])

    def test_incompatible_counters_not_union(self):
        forms=["학생 세 명과 고양이 두 마리가 왔다.","그 중 한 명이 말했다."]
        self.assertEqual(infer(forms,target(forms))["unions"],[])

    def test_explicit_word_conjunction(self):
        forms=["학생 세 명 및 교사 두 명이 모였다.","그 중 한 명이 말했다."]
        r=infer(forms,target(forms))
        self.assertEqual(len(r["unions"]),1)
        self.assertTrue(verify_graph(forms,r))

    def test_multiunit_numeric_fragment_never_assembled(self):
        forms=["학생 세"," 명과 교사 두 명이 모였다.","그 중 한 명이 말했다."]
        r=infer(forms,target(forms))
        self.assertTrue(verify_graph(forms,r))
        self.assertEqual(len(r["unions"]),0)
        self.assertEqual(len(r["nodes"]),1)
        self.assertEqual(r["nodes"][0]["counter"],"명")

    def test_separate_unit_groups_never_fabricate_coordination(self):
        forms=["학생 세 명과"," 교사 두 명이 모였다.","그 중 한 명이 말했다."]
        r=infer(forms,target(forms))
        self.assertEqual(len(r["unions"]),0)
        self.assertTrue(verify_graph(forms,r))

    def test_witness_tampering_rejected(self):
        forms=["학생 세 명과 교사 두 명이 왔다.","그 중 한 명이 떠났다."]
        r=infer(forms,target(forms))
        tampered=copy.deepcopy(r)
        tampered["nodes"][0]["witness"]["start"]+=1
        self.assertFalse(verify_graph(forms,tampered))
        self.assertTrue(verify_graph(forms,r))

    def test_normalized_alternative_not_exact_witness(self):
        forms=["학생 세 명이 왔다.","그 중 한 명이 발표했다."]
        r=infer(forms,target(forms))
        normalized=["학생  세 명이 왔다.","그 중 한 명이 발표했다."]
        self.assertFalse(verify_witness(normalized,r["nodes"][0]["witness"]))


class ScopeTests(unittest.TestCase):
    def test_unrelated_negation_does_not_erase_group(self):
        forms=["학생 세 명이 왔다. 행사는 취소되지 않았다.","그 중 한 명이 말했다."]
        r=infer(forms,target(forms))
        self.assertEqual(r["status"],"PROVISIONAL_SINGLE_GROUP_SOURCE_FRAGMENT")
        self.assertEqual(len(r["blocked"]),0)
        self.assertIsNotNone(r["selected"])

    def test_direct_existence_negation_blocked_not_erased(self):
        forms=["학생 세 명이 없었다.","그 중 한 명이 말했다."]
        r=infer(forms,target(forms))
        self.assertEqual(len(r["nodes"]),1)
        self.assertEqual(r["nodes"][0]["assertion"],"SURFACE_EXISTENTIAL_NEGATION")
        self.assertIn("EXISTENTIAL_ASSERTION_NOT_ENTITY_PRESENCE",r["blocked"][0]["reasons"])
        self.assertIsNone(r["selected"])

    def test_event_negation_keeps_mention_not_asserted_existence(self):
        forms=["학생 세 명은 출석하지 않았다.","그 중 한 명이 말했다."]
        r=infer(forms,target(forms))
        self.assertNotEqual(r["nodes"][0]["assertion"],"SURFACE_EXISTENTIAL_NEGATION")
        self.assertEqual(len(r["nodes"]),1)

    def test_quote_scope_separate_quotes_not_conflated(self):
        forms=['그는 "학생 세 명이 왔다"라고 말했다. "그 중 한 명이 떠났다"']
        r=infer(forms,target(forms))
        self.assertEqual(len(r["nodes"]),1)
        self.assertIn("DIFFERENT_OR_UNKNOWN_QUOTATION_SCOPE",r["blocked"][0]["reasons"])
        self.assertIsNone(r["selected"])

    def test_internal_quoted_discourse_preserves_candidate(self):
        forms=['그는 "학생 세 명이 왔다. 그 중 한 명이 떠났다"라고 말했다.']
        r=infer(forms,target(forms))
        self.assertEqual(r["status"],"PROVISIONAL_SINGLE_GROUP_SOURCE_FRAGMENT")
        self.assertIsNotNone(r["selected"])

    def test_hypothetical_not_promoted_across_scope(self):
        forms=["만약 학생 세 명이 온다면.","그 중 한 명이 말했다."]
        r=infer(forms,target(forms))
        self.assertIn("UNTRANSPORTED_HYPOTHETICAL_SCOPE",r["blocked"][0]["reasons"])
        self.assertIsNone(r["selected"])

    def test_no_source_group_abstains(self):
        forms=["아침에 행사가 시작됐다.","그 중 한 명이 말했다."]
        r=infer(forms,target(forms))
        self.assertEqual(r["status"],"ABSTAIN_NO_ADMISSIBLE_GROUP")
        self.assertEqual(r["human_ground_truth"],None)


class TemporalAndCompatibilityTests(unittest.TestCase):
    def test_future_paragraph_edits_do_not_change_prefix_state(self):
        forms=["학생 세 명이 모였다.","그 중 한 명이 말했다.","여기 세 마리가 나타났다."]
        t=target(forms)
        original=infer(forms,t)
        rng=random.Random(62004)
        for _ in range(70):
            f=list(forms)
            f[1]=f[1][:t["end"]]+rng.choice(["한 명","세 마리","많았다","아무도 없다",""])
            f[2]=rng.choice(["모든 것이 달라졌다.","고양이 다섯 마리가 왔다.",""])
            r=infer(f,t)
            self.assertEqual(r["prefix_sha256"],original["prefix_sha256"])
            self.assertEqual(r["state_sha256"],original["state_sha256"])
            self.assertEqual(r["status"],original["status"])

    def test_target_local_suffix_may_change_compatibility_without_new_antecedents(self):
        f=["학생 세 명이 모였다.","그 중 두 명이 말했다."]
        t=target(f)
        a=infer(f,t,use_target_constraints=True)
        changed=["학생 세 명이 모였다.","그 중 다섯 명이 말했다."]
        b=infer(changed,t,use_target_constraints=True)
        self.assertEqual(a["prefix_sha256"],b["prefix_sha256"])
        self.assertEqual([n["id"] for n in a["nodes"]],[n["id"] for n in b["nodes"]])
        self.assertIsNotNone(a["selected"])
        self.assertIsNone(b["selected"])

    def test_no_target_local_constraints_has_suffix_invariance(self):
        f=["학생 세 명이 모였다.","그 중 두 명이 말했다."]
        t=target(f)
        a=infer(f,t)
        g=["학생 세 명이 모였다.","그 중 다섯 명이 말했다."]
        b=infer(g,t)
        self.assertEqual(a["state_sha256"],b["state_sha256"])

    def test_integer_offset_types_must_be_exact(self):
        f=["학생 세 명이 모였다.","그 중 한 명이 말했다."]
        t=target(f)
        t["start"]=True
        with self.assertRaises((ValueError,TypeError,IndexError)):
            infer(f,t)

    def test_different_unit_segmentation_can_change_source_admission(self):
        f=["학생 세 명이 왔다.","그 중 한 명이 발표했다."]
        g=["학생 세"," 명이 왔다.","그 중 한 명이 발표했다."]
        self.assertEqual("".join(f),"".join(g))
        self.assertEqual(len(infer(f,target(f))["nodes"]),1)
        self.assertEqual(len(infer(g,target(g))["nodes"]),0)

    def test_unknown_cardinality_is_not_assumed(self):
        f=["학생 여러 명이 모였다.","그 중 한 명이 말했다."]
        r=infer(f,target(f))
        self.assertEqual(len(r["nodes"]),1)
        self.assertEqual(r["nodes"][0]["cardinality"],None)
        self.assertIsNone(r["selected"])

    def test_result_never_claims_reference_accuracy(self):
        f=["학생 세 명이 모였다.","그 중 한 명이 말했다."]
        r=infer(f,target(f))
        self.assertIsNone(r["semantic_accuracy"])
        self.assertIsNone(r["human_ground_truth"])
        self.assertFalse(r["selected"]["reference_licensed"])


if __name__=="__main__":
    unittest.main()
