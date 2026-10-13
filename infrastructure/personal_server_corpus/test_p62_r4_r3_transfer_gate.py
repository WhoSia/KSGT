"""Original synthetic tests for pre-outcome source-work transfer gating.

These tests do NOT inspect private corpus, recover human Korean antecedents, or
certify globally independent intellectual works.
"""
import copy
import hashlib
import unittest

from p62_r4_r3_transfer_gate import (
    HARD, UNCERTAIN, audit_transfer_split,verify_manifest,
)


def token(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def record(label, container="A", year=2024, exposed=False, complete=True,
           authority="DOCUMENT_METADATA"):
    return {"id":token("RECORD:"+label),
            "container_sha256":token("SOURCE_CONTAINER:"+container),
            "publication_year":year,
            "publication_year_authority":authority,
            "lineage_complete":complete,"exposed":exposed,
            "human_ground_truth":None}


def evidence(a,b,kind,verified=True):
    return {"left":a["id"],"right":b["id"],"kind":kind,
            "witness_verified":verified}


def split_of(manifest,rec):
    for split,data in manifest["by_split"].items():
        if rec["id"] in data["tokens"]:
            return split
    raise AssertionError("Missing record")


class TransferGateTests(unittest.TestCase):
    def test_exposed_exact_alias_excludes_whole_component(self):
        a=record("previous",exposed=True)
        b=record("candidate")
        c=record("disjoint")
        m=audit_transfer_split([a,b,c],[evidence(a,b,"EXACT_STRUCTURE")])
        self.assertEqual(split_of(m,a),"quarantine")
        self.assertEqual(split_of(m,b),"quarantine")
        self.assertNotEqual(split_of(m,c),"quarantine")
        self.assertEqual(m["exact_surface_dependency_edges"],1)
        self.assertEqual(m["global_semantic_source_work_independence"],"HOLD")

    def test_verified_contiguous_subset_is_conservative_dependency(self):
        a,b,c=[record(x) for x in ("A","B","C")]
        m=audit_transfer_split([a,b,c],[
            evidence(a,b,"EXACT_CONTIGUOUS_UNIT_SUBSET"),
            evidence(b,c,"VERIFIED_SHARED_LONG_UNIT")])
        self.assertEqual(split_of(m,a),split_of(m,b))
        self.assertEqual(split_of(m,b),split_of(m,c))
        self.assertEqual(m["components"],1)
        self.assertFalse(m["all_work_identity_edges_semantic_gold"])

    def test_uncertain_normalization_quarantines_endpoints_without_merging(self):
        a,b=[record(x) for x in ("A","B")]
        m=audit_transfer_split([a,b],[evidence(a,b,"NORMALIZED_ONLY")])
        self.assertEqual(m["components"],2)
        self.assertEqual(split_of(m,a),"quarantine")
        self.assertEqual(split_of(m,b),"quarantine")

    def test_unknown_revision_links_not_presented_as_work_identity(self):
        a,b=[record(x) for x in ("A","B")]
        m=audit_transfer_split([a,b],
                               [evidence(a,b,"POTENTIAL_REVISED_WORK_WITHOUT_TEXT_PROOF")])
        self.assertEqual(split_of(m,a),"quarantine")
        self.assertEqual(split_of(m,b),"quarantine")

    def test_unverified_hard_edge_does_not_promote_identity(self):
        a,b=[record(x) for x in ("A","B")]
        m=audit_transfer_split([a,b],[evidence(a,b,"VERIFIED_CROSS_ID_ALIAS",False)])
        self.assertEqual(m["exact_surface_dependency_edges"],0)
        self.assertEqual(m["uncertain_edges"],1)
        self.assertEqual(split_of(m,a),"quarantine")
        self.assertEqual(split_of(m,b),"quarantine")

    def test_metadata_only_is_not_evidence_of_same_work(self):
        a,b=[record(x) for x in ("A","B")]
        m=audit_transfer_split([a,b],[evidence(a,b,"METADATA_SIMILARITY_ONLY")])
        self.assertEqual(m["components"],2)
        self.assertEqual(m["metadata_diagnostic_edges"],1)
        self.assertEqual(m["by_split"]["quarantine"]["records"],0)

    def test_lineage_not_fully_checked_is_hold(self):
        a=record("A",complete=False)
        m=audit_transfer_split([a],[])
        self.assertEqual(split_of(m,a),"quarantine")
        self.assertEqual(m["exclusion_reason_counts_overlapping"]["INCOMPLETE_SOURCE_LINEAGE"],1)

    def test_unknown_year_is_not_guessed_from_archive(self):
        a=record("A",year=None,authority="UNKNOWN")
        m=audit_transfer_split([a],[])
        self.assertEqual(split_of(m,a),"quarantine")
        with self.assertRaises(ValueError):
            audit_transfer_split([record("X",year=2024,authority="UNKNOWN")],[])

    def test_two_containers_one_year_fail_coverage_without_accuracy_claim(self):
        rows=[record(str(i),container=str(i%2),year=2024)
              for i in range(160)]
        m=audit_transfer_split(rows,[])
        self.assertEqual(m["coverage_status"],
                         "HOLD_INSUFFICIENT_SOURCE_CONTAINER_OR_YEAR_COVERAGE")
        self.assertIsNone(m["reference_accuracy"])
        self.assertEqual(m["by_split"]["quarantine"]["records"],0)

    def test_five_containers_three_years_can_pass_descriptive_coverage(self):
        rows=[record(str(i),container=str(i%5),year=2023+(i%3))
              for i in range(240)]
        m=audit_transfer_split(rows,[])
        self.assertEqual(m["coverage_status"],"MACHINE_TRANSFER_COVERAGE_GATE_PASSED")
        self.assertGreaterEqual(m["by_split"]["frozen_transfer"]["observed_containers"],3)
        self.assertGreaterEqual(
            len(m["by_split"]["frozen_transfer"]["observed_document_metadata_years"]),2)
        self.assertEqual(m["global_semantic_source_work_independence"],"HOLD")

    def test_reordered_inputs_produce_identical_sealed_manifest(self):
        rows=[record(str(i),container=str(i%4),year=2020+(i%3))
              for i in range(50)]
        links=[evidence(rows[0],rows[5],"VERIFIED_SHARED_LONG_UNIT"),
               evidence(rows[1],rows[6],"NORMALIZED_ONLY")]
        a=audit_transfer_split(rows,links)
        b=audit_transfer_split(rows[::-1],links[::-1])
        self.assertEqual(a,b)
        self.assertTrue(verify_manifest(a))
        broken=copy.deepcopy(a)
        broken["by_split"]["frozen_transfer"]["records"]+=1
        self.assertFalse(verify_manifest(broken))

    def test_duplicate_link_cannot_inflate_evidence(self):
        a,b=[record(x) for x in ("A","B")]
        link=evidence(a,b,"EXACT_STRUCTURE")
        with self.assertRaises(ValueError):
            audit_transfer_split([a,b],[link,link])

    def test_duplicate_candidate_id_rejected(self):
        a=record("A")
        with self.assertRaises(ValueError):
            audit_transfer_split([a,a],[])

    def test_unknown_endpoint_refused(self):
        a,b=[record(x) for x in ("A","B")]
        with self.assertRaises(ValueError):
            audit_transfer_split([a],[evidence(a,b,"EXACT_STRUCTURE")])

    def test_unrecognized_relation_refused(self):
        a,b=[record(x) for x in ("A","B")]
        with self.assertRaises(ValueError):
            audit_transfer_split([a,b],[evidence(a,b,"SAME_SEMANTIC_WORK_PROVEN")])

    def test_self_attested_human_judgments_refused(self):
        a=record("A")
        a["human_ground_truth"]={"guess":"person 1"}
        with self.assertRaises(ValueError):
            audit_transfer_split([a],[])

    def test_opaque_container_required(self):
        a=record("A")
        a["container_sha256"]="A"
        with self.assertRaises(ValueError):
            audit_transfer_split([a],[])

    def test_empty_population_is_not_success(self):
        with self.assertRaises(ValueError):
            audit_transfer_split([],[])

    def test_split_proportions_total_one_hundred(self):
        m=audit_transfer_split([record(str(i)) for i in range(15)],[])
        self.assertEqual(sum(m["partition_policy_percent"].values()),100)
        self.assertEqual(sum(d["records"] for d in m["by_split"].values()),15)


if __name__=="__main__":
    unittest.main()
