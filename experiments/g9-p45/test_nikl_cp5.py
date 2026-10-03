#!/usr/bin/env python3
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from analyze_nikl_cp5_derived import shapley_decompose
from nikl_document_sufficient_stats_cp5 import counts_for, digest, doc_base, increment


class CP5Tests(unittest.TestCase):
    def test_identifier_hash_is_domain_separated_and_deterministic(self):
        a = digest("document", "archive", "id")
        self.assertEqual(a, digest("document", "archive", "id"))
        self.assertNotEqual(a, digest("publisher", "archive", "id"))
        self.assertEqual(len(a), 64)

    def test_feature_counts_are_frozen_substring_counts(self):
        counts, chars = counts_for("그러나 그래서")
        self.assertEqual(chars, 7)
        self.assertEqual(sum(counts[:4]), 2)

    def test_document_row_has_no_text_or_raw_identity(self):
        base, _ = doc_base("NIKL_NEWSPAPER_2020_CSV.zip", "CSV_SENTENCE", "private-id",
                           "publisher", "20200101", "exact-topic")
        row = dict(zip(["doc_hash", "source_hash", "publisher_hash", "archive", "source_family", "serialization",
                        "representation", "year", "period", "date_status", "topic", "characters", "text_units"]
                       + [f"f{i}" for i in range(len(counts_for("x")[0]))],
                       increment(base, "그러나 secret text")))
        self.assertNotIn("private-id", repr(row))
        self.assertNotIn("secret text", repr(row))
        self.assertEqual(row["representation"], "RAW")
        self.assertEqual(row["topic"], "exact-topic")

    def test_shapley_decomposition_identity_on_common_support(self):
        def cell(n, counts):
            return {"documents": n, "edf": counts, "markers": {}}
        a = {("p1", "t1"): cell(10, {"CONTRAST": 1, "CAUSE_RESULT": 1}),
             ("p2", "t2"): cell(10, {"EXPANSION": 1, "TEMPORAL": 1})}
        b = {("p1", "t1"): cell(10, {"CONTRAST": 2}),
             ("p2", "t2"): cell(10, {"EXPANSION": 1, "TEMPORAL": 1})}
        out = shapley_decompose(a, b)
        self.assertEqual(out["status"], "COMMON_SUPPORT_SHAPLEY")
        for v in out["per_class_common_support_shapley_effects"].values():
            self.assertLess(abs(v["identity_residual"]), 1e-12)


if __name__ == "__main__":
    unittest.main()

