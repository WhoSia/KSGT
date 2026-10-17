"""Original synthetic P62-R3 theorem-counterexample and prefix-policy regressions."""
import copy
import gzip
import json
import random
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from p62_reference import TARGET, observation, rank_candidate
from p62_r3_identity import (
    compare, transport_span, exclusion_court, EXACT, SUBSET, RESEGMENTED,
    NORMALIZED, UNRESOLVED,
)
from p62_r3_inference import (
    prefix_candidates, pretarget_signature, rank, policy_court, stratified_court,
)
from p62_r3_machine_court import run as run_private_court, evaluate_item


def fixture(forms=None, unit=2, work="synthetic-work"):
    if forms is None:
        forms = [
            "학생 세 명, 운동장에 모였다.",
            "고양이 두 마리, 정원에 있었다.",
            "그 중 두 명, 발표를 준비했다.",
            "행사가 시작되었다.",
            "모두 집으로 돌아갔다.",
        ]
    m = TARGET.search(forms[unit])
    if m is None:
        raise ValueError("Fixture must have an observed target")
    target = {"unit": unit, "start": m.start(), "end": m.end(), "observed": True}
    obj = observation(forms,target,
        {"item_id":"synthetic-r3","strict_structure":"synthetic-immutable-id",
         "stratum":"TEST","rule_category":"TEST"},work)
    obj["packet_hash"] = "synthetic-only"
    obj["family"] = "SYNTHETIC"
    return obj


class IdentityTheoryTests(unittest.TestCase):
    def test_strict_equal_never_proves_semantic_work_identity(self):
        r=compare(["같은 문장","두 번째"],["같은 문장","두 번째"])
        self.assertEqual(r["relation"],EXACT)
        self.assertFalse(r["same_work_proven"])
        self.assertEqual(transport_span(["가나다"],["가나다"],
                           {"unit":0,"start":1,"end":3})["span"],
                         {"unit":0,"start":1,"end":3})

    def test_ordered_subset_unique(self):
        a=["첫 문장","끝 문장"]; b=["머리","첫 문장","끝 문장","꼬리"]
        self.assertEqual(compare(a,b)["relation"],SUBSET)
        x=transport_span(a,b,{"unit":1,"start":0,"end":1})
        self.assertEqual(x["span"],{"unit":2,"start":0,"end":1})

    def test_backward_subset_mapping_and_outside(self):
        a=["첫","가나다","끝"];b=["가나다"]
        self.assertEqual(transport_span(a,b,{"unit":1,"start":1,"end":2})["span"],
                         {"unit":0,"start":1,"end":2})
        self.assertEqual(transport_span(a,b,{"unit":0,"start":0,"end":1})["status"],
                         "HOLD_OUTSIDE_SUBSET")

    def test_repeated_subset_is_ambiguous(self):
        a=["반복"];b=["반복","중간","반복"]
        self.assertEqual(compare(a,b)["placements"],[0,2])
        self.assertEqual(transport_span(a,b,{"unit":0,"start":0,"end":1})["status"],
                         "HOLD_AMBIGUOUS_REPEATED_SUBSET")

    def test_same_codepoint_stream_changed_segmentation_maps_inside_one_unit(self):
        a=["가나다","라마"];b=["가나","다라마"]
        self.assertEqual(compare(a,b)["relation"],RESEGMENTED)
        mapped=transport_span(a,b,{"unit":1,"start":0,"end":2})
        self.assertEqual(mapped["span"],{"unit":1,"start":1,"end":3})

    def test_segmentation_crossing_unit_boundary_is_hold(self):
        a=["가나다","라마"];b=["가나","다라","마"]
        self.assertEqual(transport_span(a,b,{"unit":0,"start":1,"end":3})["status"],
                         "HOLD_CROSS_UNIT_OR_AMBIGUOUS")

    def test_unicode_normalization_never_transports_offsets(self):
        a=["e\u0301"]; b=["é"]
        self.assertEqual(compare(a,b)["relation"],NORMALIZED)
        self.assertEqual(transport_span(a,b,{"unit":0,"start":0,"end":1})["span"],None)

    def test_whitespace_diagnostic_not_proof(self):
        a=["가 나"];b=["가  나"]
        self.assertEqual(compare(a,b)["relation"],NORMALIZED)

    def test_framed_relation_not_weak_title(self):
        self.assertEqual(compare(["상반된 내용"],["다른 문장"])["relation"],UNRESOLVED)
        r=exclusion_court([{"id":"a","source_id":"shared","units":["상반된 내용"]},
                            {"id":"b","source_id":"shared","units":["다른 문장"]}])
        self.assertEqual(len(r["hard_exclusion_groups"]),2)
        self.assertEqual(r["unresolved_pair_quarantine"][0]["reason"],
                         "UNVERIFIED_SAME_SOURCE_ID")

    def test_graph_exclusion_transitivity_is_not_semantic_equivalence(self):
        r=exclusion_court([{"id":"a","units":["문장A"]},
                           {"id":"b","units":["문장A","문장B"]},
                           {"id":"c","units":["문장B"]}])
        self.assertEqual(r["hard_exclusion_groups"],[["a","b","c"]])
        self.assertIsNone(r["semantic_work_identity_claim"])
        self.assertTrue(all(not x["semantic_work_equivalence_proven"]
                            for x in r["exact_surface_edges"]))

    def test_unsafe_boolean_offset_rejected(self):
        with self.assertRaises(ValueError):
            transport_span(["가나다"],["가나다"],{"unit":False,"start":0,"end":1})

    def test_empty_source_has_no_identity(self):
        with self.assertRaises(ValueError): compare([],[])


class PrefixScienceTests(unittest.TestCase):
    def test_policy_invariant_to_after_target_quantity(self):
        x=fixture()
        a=policy_court(x)
        for suffix in ["두 명", "두 마리", "한 개", "여러 팀", ""] :
            y=copy.deepcopy(x)
            t=y["target"];text=y["context"][2]["text"]
            y["context"][2]["text"]=text[:t["end"]]+suffix+"이 발표했다."
            self.assertEqual(pretarget_signature(y),a["prefix_signature"])
            self.assertEqual(policy_court(y)["selected_ids"],a["selected_ids"])

    def test_structural_legacy_counter_is_future_conditioned(self):
        x=fixture()
        ids=[]
        for suffix in ("두 명, 발표했다.","두 마리, 발표했다."):
            y=copy.deepcopy(x)
            t=y["target"];s=y["context"][2]["text"]
            y["context"][2]["text"]=s[:t["end"]]+suffix
            forms=[z["text"] for z in y["context"]]
            c=rank_candidate(forms,t,y["candidates"],"STRUCTURAL")
            ids.append((c or {}).get("candidate_id"))
        self.assertNotEqual(ids[0],ids[1],
            "Synthetic counterexample must expose the inherited future counter dependency")
        self.assertEqual(policy_court(x)["selected_ids"],
                         policy_court(y)["selected_ids"])

    def test_prefix_policies_never_query_post_target_counter(self):
        x=fixture()
        with patch("p62_reference.target_counter",side_effect=RuntimeError("suffix leak")):
            for name in ("PREFIX_ACCESSIBILITY","PREFIX_RECENCY","PREFIX_REPETITION"):
                self.assertEqual(rank(x,name)["status"],"PROPOSAL")

    def test_prefix_candidates_all_past(self):
        x=fixture()
        cs=prefix_candidates(x)
        self.assertGreater(len(cs),0)
        self.assertTrue(all(c["relation"].startswith("PAST") for c in cs))

    def test_empty_prefix_abstains(self):
        x=fixture(["아침.","점심.","그 중 한 명이 왔다.","저녁.","밤."])
        self.assertEqual(rank(x)["status"],"ABSTAIN_NO_PREFIX_PROPOSAL")

    def test_unknown_policy_rejected(self):
        with self.assertRaises(ValueError):rank(fixture(),"FUTURE_ACCESSIBILITY")

    def test_unicode_future_mutation_property(self):
        x=fixture()
        rng=random.Random(62003)
        suffixes=["세 명", "한 마리", "언어적 부호", "계획", "공백", "숲"]
        original=policy_court(x)["selected_ids"]
        for _ in range(80):
            y=copy.deepcopy(x)
            t=y["target"]
            y["context"][2]["text"]=y["context"][2]["text"][:t["end"]]+"".join(
                rng.choice(suffixes) for __ in range(rng.randrange(1,5)))
            for unit in (3,4):
                y["context"][unit]["text"]="".join(
                    rng.choice(suffixes) for __ in range(rng.randrange(1,6)))
            self.assertEqual(policy_court(y)["selected_ids"],original)

    def test_segmentation_sensitive_no_invariance_claim(self):
        a=["세 명이 왔다.","학생들이 모였다.","그 중 한 명이 발표했다.","박수.","종료."]
        b=["세 ","명이 왔다.","학생들이 모였다.","그 중 한 명이 발표했다.","박수.","종료."]
        self.assertEqual("".join(a),"".join(b))
        xa=fixture(a,2);xb=fixture(b,3)
        self.assertNotEqual(pretarget_signature(xa),pretarget_signature(xb))

    def test_machine_only_grouped_counts_not_accuracy(self):
        x=fixture()
        r=stratified_court([x])
        self.assertEqual(r["overall"]["observed_targets"],1)
        self.assertEqual(r["human_labels"],0)
        self.assertIsNone(r["inference_claim"])
        self.assertEqual(r["families"]["SYNTHETIC"]["observed_targets"],1)


class PrivateCourtContractTests(unittest.TestCase):
    def test_development_machine_metrics_never_become_human_accuracy(self):
        item=fixture()
        row=evaluate_item(item)
        self.assertEqual(row["suffix_attacks"],8)
        self.assertIn("legacy_structural_suffix_attack_changes",row)

    def test_nonnull_human_ground_truth_is_refused(self):
        item=fixture()
        item["human_ground_truth"]={"fictional":"not admissible"}
        with self.assertRaises(ValueError): evaluate_item(item)

    def test_private_output_is_immutable_hash_sealed(self):
        from p62_reference import digest
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);packet=root/"synthetic.jsonl.gz";out=root/"new"
            with gzip.open(packet,"wt",encoding="utf-8") as f:
                f.write(json.dumps(fixture(),ensure_ascii=False)+"\n")
            data=run_private_court(packet,out,digest(packet),expected_items=1)
            self.assertEqual(data["observed_target_count"],1)
            self.assertTrue((out/"R3_SHA256_MANIFEST.json").exists())
            self.assertIsNone(data["human_ground_truth"])
            with self.assertRaises(FileExistsError):
                run_private_court(packet,out,digest(packet),expected_items=1)

    def test_private_court_refuses_wrong_seal(self):
        with tempfile.TemporaryDirectory() as tmp:
            packet=Path(tmp)/"synthetic.gz"
            with gzip.open(packet,"wt",encoding="utf-8") as f:
                f.write(json.dumps(fixture(),ensure_ascii=False)+"\n")
            with self.assertRaises(ValueError):
                run_private_court(packet,Path(tmp)/"out","0"*64,expected_items=1)


if __name__=="__main__":
    unittest.main()
