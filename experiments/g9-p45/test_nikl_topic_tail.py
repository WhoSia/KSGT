import unittest

from analyze_nikl_topic_tail import average_ranks, correlation, linear_quantile


class TopicTailTests(unittest.TestCase):
    def test_linear_quantile_and_tie_aware_ranks(self):
        self.assertAlmostEqual(linear_quantile([0.0, 1.0, 2.0, 3.0], 0.90), 2.7)
        self.assertEqual(average_ranks([1.0, 1.0, 3.0]), [1.5, 1.5, 3.0])


    def test_exact_representation_concordance(self):
        result = correlation([0.0, 0.1, 0.1, 0.8], [0.0, 0.1, 0.1, 0.8])
        self.assertEqual(result, {"pearson": 1.0, "spearman": 1.0})

