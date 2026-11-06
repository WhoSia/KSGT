import unittest
from r911_boundary_identification import norm,candidate_gap,replay
class BoundaryTests(unittest.TestCase):
    def test_nfc(self):self.assertEqual(norm('가 나'),'가나')
    def test_inside_gap(self):self.assertEqual(candidate_gap(2,5)['conditionalPossibleBoundaryPositions'],3)
    def test_gap_not_point_identified(self):self.assertFalse(candidate_gap(2,5)['pointIdentifiedUnderAdjacency'])
    def test_single_adjacent_candidate(self):self.assertTrue(candidate_gap(4,5)['pointIdentifiedUnderAdjacency'])
    def test_equal_or_reverse(self):
        for a,b in [(4,4),(5,4)]:
            with self.assertRaises(ValueError):candidate_gap(a,b)
    def test_bad_zip_blocks(self):
        from tempfile import TemporaryDirectory
        from pathlib import Path
        with TemporaryDirectory() as d:
            p=Path(d)/'bad.zip';p.write_bytes(b'not original')
            with self.assertRaisesRegex(ValueError,'SOURCE_ZIP_SHA_MISMATCH'):replay(p,[])
if __name__=='__main__':unittest.main()
