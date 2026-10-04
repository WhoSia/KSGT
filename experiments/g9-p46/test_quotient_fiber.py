#!/usr/bin/env python3
import math
import unittest

from quotient_fiber import (
    exclusive_marker_counts,
    legacy_substring_counts,
    quotient_fiber_decomposition,
)


class QuotientFiberTests(unittest.TestCase):
    def setUp(self):
        self.map = {"a": "X", "b": "X", "c": "Y", "d": "Y"}

    def test_exact_decomposition(self):
        out = quotient_fiber_decomposition(
            {"a": 40, "b": 10, "c": 20, "d": 30},
            {"a": 10, "b": 40, "c": 35, "d": 15},
            self.map,
        )
        self.assertLess(abs(out["identity_residual"]), 1e-12)
        self.assertAlmostEqual(
            out["total_motion"],
            out["quotient_motion"] + out["fiber_motion"],
            places=12,
        )

    def test_fiber_only_change(self):
        out = quotient_fiber_decomposition(
            {"a": 45, "b": 5, "c": 45, "d": 5},
            {"a": 5, "b": 45, "c": 5, "d": 45},
            self.map,
        )
        self.assertAlmostEqual(out["quotient_motion"], 0.0, places=12)
        self.assertGreater(out["fiber_motion"], 0.0)
        self.assertAlmostEqual(out["total_motion"], out["fiber_motion"], places=12)

    def test_quotient_only_change(self):
        out = quotient_fiber_decomposition(
            {"a": 40, "b": 10, "c": 8, "d": 2},
            {"a": 8, "b": 2, "c": 40, "d": 10},
            self.map,
        )
        self.assertGreater(out["quotient_motion"], 0.0)
        self.assertAlmostEqual(out["fiber_motion"], 0.0, places=12)
        self.assertAlmostEqual(out["total_motion"], out["quotient_motion"], places=12)

    def test_nested_marker_overlap_is_representation_sensitive(self):
        markers = ["또한", "또"]
        text = "또한 또"
        legacy = legacy_substring_counts(text, markers)
        exclusive = exclusive_marker_counts(text, markers)
        self.assertEqual(legacy, {"또한": 1, "또": 2})
        self.assertEqual(exclusive, {"또한": 1, "또": 1})

    def test_unmapped_marker_fails_closed(self):
        with self.assertRaises(KeyError):
            quotient_fiber_decomposition({"a": 1, "z": 1}, {"a": 1}, self.map)


if __name__ == "__main__":
    unittest.main()
