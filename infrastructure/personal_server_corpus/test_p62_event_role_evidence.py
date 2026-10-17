"""Original synthetic counterexamples for source surface-role admission."""
import unittest

from p62_event_role_evidence import decide, digest, source_relation


def fixture(sentence, numeral="세 명", target="그중"):
    start = sentence.index(numeral)
    end = start + len(numeral)
    target_start = sentence.index(target)
    node = {"id": "synthetic-node", "witness": {"unit": 0, "start": start, "end": end,
            "global_end": end, "sha256": digest(numeral)}}
    demand = {"unit": 0, "start": target_start, "end": target_start+len(target)}
    graph = {"eligible_ids": [node["id"]], "nodes": [node], "competing_union_ids": []}
    return [sentence], node, demand, graph


class SourceRoleEvidenceTests(unittest.TestCase):
    def test_nominative_is_a_cue_not_agent(self):
        forms, node, target, graph = fixture("학생 세 명이 왔다. 그중 한 명이 말했다.")
        evidence = source_relation(forms, node, target)
        self.assertEqual(evidence["particle_cue"], "NOMINATIVE_CUE")
        self.assertIsNone(evidence["semantic_role"])
        self.assertEqual(decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["status"], "PROVISIONAL_SOURCE_FRAGMENT")

    def test_accusative_is_a_cue_not_patient(self):
        forms, node, target, _ = fixture("학생 세 명을 만났다. 그중 한 명이 말했다.")
        evidence = source_relation(forms, node, target)
        self.assertEqual(evidence["particle_cue"], "ACCUSATIVE_CUE")
        self.assertIsNone(evidence["semantic_role"])

    def test_constituent_order_does_not_create_semantic_role(self):
        forms, node, target, graph = fixture("어제 학생 세 명을 만났다. 그중 한 명이 말했다.")
        self.assertIsNone(source_relation(forms, node, target)["semantic_role"])
        ordered = fixture("학생 세 명을 어제 만났다. 그중 한 명이 말했다.")
        first = decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["status"]
        second = decide(ordered[0], ordered[2], ordered[3], "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["status"]
        self.assertEqual(first, "ABSTAIN_NO_ELIGIBLE_EVIDENCE")
        self.assertEqual(second, "PROVISIONAL_SOURCE_FRAGMENT")

    def test_role_swap_does_not_change_v1_proposal(self):
        first = fixture("학생 세 명이 왔다. 그중 한 명이 말했다.")
        second = fixture("학생 세 명을 만났다. 그중 한 명이 말했다.")
        left = decide(first[0], first[2], first[3], "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")
        right = decide(second[0], second[2], second[3], "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")
        self.assertEqual(left["arms"]["D_NP_EVENT_SURFACE"], right["arms"]["D_NP_EVENT_SURFACE"])
        self.assertNotEqual(left["evidence"][0]["particle_cue"], right["evidence"][0]["particle_cue"])

    def test_coordination_requires_abstention(self):
        forms, node, target, graph = fixture("학생 세 명과 교사 두 명이 왔다. 그중 한 명이 말했다.")
        self.assertIn("COORDINATION_PARSE_AMBIGUOUS", source_relation(forms, node, target)["reasons"])
        self.assertIsNone(decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["selected"])

    def test_lexical_gwa_inside_result_is_not_a_coordinator(self):
        forms, node, target, graph = fixture("학생 세 명이 결과를 말했다. 그중 한 명이 말했다.")
        self.assertNotIn("COORDINATION_PARSE_AMBIGUOUS", source_relation(forms, node, target)["reasons"])

    def test_quote_scope_requires_abstention(self):
        forms, node, target, graph = fixture("“학생 세 명이 왔다.” 그중 한 명이 말했다.")
        self.assertIn("CROSS_QUOTATION_SCOPE", source_relation(forms, node, target)["reasons"])
        self.assertIsNone(decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["selected"])

    def test_single_curly_quote_scope_requires_abstention(self):
        forms, node, target, graph = fixture("‘학생 세 명이 왔다.’ 그중 한 명이 말했다.")
        self.assertIn("CROSS_QUOTATION_SCOPE", source_relation(forms, node, target)["reasons"])
        self.assertIsNone(decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["selected"])

    def test_mismatched_nested_quotes_hold(self):
        forms, node, target, graph = fixture("“‘학생 세 명이 왔다.” 그중 한 명이 말했다.")
        self.assertIn("MALFORMED_QUOTATION_DELIMITER", source_relation(forms, node, target)["reasons"])

    def test_future_source_rejected(self):
        forms, node, target, _ = fixture("그중 한 명이 말했다. 학생 세 명이 왔다.")
        with self.assertRaises(ValueError):
            source_relation(forms, node, target)

    def test_future_suffix_append_does_not_change_decision(self):
        forms, node, target, graph = fixture("학생 세 명이 왔다. 그중 한 명이 말했다.")
        first = decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")
        later = decide(forms + ["교사 두 명을 만났다."], target, graph,
                       "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")
        self.assertEqual(first["arms"], later["arms"])
        self.assertEqual(first["evidence"], later["evidence"])

    def test_wrong_digest_rejected(self):
        forms, node, target, _ = fixture("학생 세 명이 왔다. 그중 한 명이 말했다.")
        node["witness"]["sha256"] = digest("다른 수")
        with self.assertRaises(ValueError):
            source_relation(forms, node, target)

    def test_unadmitted_graph_is_hold(self):
        forms, _, target, graph = fixture("학생 세 명이 왔다. 그중 한 명이 말했다.")
        self.assertEqual(decide(forms, target, graph, "UNVERIFIED")["status"], "HOLD_SOURCE_ADMISSION")

    def test_nearby_competition_abstains(self):
        forms, node, target, graph = fixture("학생 세 명이 왔다. 교사 두 명이 왔다. 그중 한 명이 말했다.")
        second = "두 명"
        a = forms[0].index(second)
        graph["nodes"].append({"id": "second-node", "witness": {"unit": 0, "start": a,
            "end": a+len(second), "global_end": a+len(second), "sha256": digest(second)}})
        graph["eligible_ids"].append("second-node")
        self.assertEqual(decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["B_PROXIMITY"]["status"], "ABSTAIN_COMPETING_CANDIDATES")

    def test_particle_prefix_is_ambiguous(self):
        forms, node, target, graph = fixture("학생 세 명이나 왔다. 그중 한 명이 말했다.")
        self.assertIn("AMBIGUOUS_PARTICLE_ATTACHMENT", source_relation(forms, node, target)["reasons"])
        self.assertIsNone(decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["selected"])

    def test_missing_visible_predicate_abstains(self):
        forms, node, target, graph = fixture("학생 세 명이. 그중 한 명이 말했다.")
        self.assertIn("NO_VISIBLE_PREDICATE_CANDIDATE", source_relation(forms, node, target)["reasons"])
        self.assertIsNone(decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["selected"])

    def test_competing_noun_phrase_boundaries_are_explicit(self):
        forms, node, target, graph = fixture("서울 학생 세 명이 왔다. 그중 한 명이 말했다.")
        evidence = source_relation(forms, node, target)
        self.assertEqual(len(evidence["noun_phrase_parse_alternatives"]), 2)
        self.assertIn("COMPETING_NP_BOUNDARIES", evidence["reasons"])
        self.assertIsNone(decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["selected"])

    def test_competing_predicate_attachments_are_explicit(self):
        forms, node, target, graph = fixture("학생 세 명이 왔다고 말했다. 그중 한 명이 말했다.")
        evidence = source_relation(forms, node, target)
        self.assertGreaterEqual(len(evidence["predicate_parse_alternatives"]), 2)
        self.assertIn("COMPETING_EVENT_ATTACHMENTS", evidence["reasons"])
        self.assertIsNone(decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["selected"])

    def test_post_target_predicate_cannot_supply_source_event(self):
        forms, node, target, graph = fixture("학생 세 명이 그중 한 명이 왔다.")
        self.assertIn("NO_VISIBLE_PREDICATE_CANDIDATE", source_relation(forms, node, target)["reasons"])
        self.assertIsNone(decide(forms, target, graph, "VERIFIED_TYPED_SOURCE_GRAPH_ONLY")["arms"]["D_NP_EVENT_SURFACE"]["selected"])


if __name__ == "__main__":
    unittest.main()
