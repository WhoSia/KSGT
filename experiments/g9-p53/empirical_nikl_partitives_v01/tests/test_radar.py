import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]))
from nikl_partitive_radar import scan_documents,sha,canonical

class RadarTest(unittest.TestCase):
 def test_candidates_do_not_become_partitive_gold(self):
  d=[{"id":"d1","sentence":[
   {"id":"s1","form":"두 집합이 있다.","ZA":[]},
   {"id":"s2","form":"그중 하나를 썼다.","original_form":"그중 하나를 썼다.","ZA":[{"ellipsis":[]}]},
   {"id":"s3","form":"나머지 둘은 남았다.","ZA":[]}]}]
  a,m=scan_documents(d,"DEV")
  self.assertEqual(a["geujung_sentences"],1)
  self.assertEqual(a["geujung_has_za_annotation"],1)
  self.assertEqual(a["naemaji_literals"],1)
  self.assertFalse(m[0]["proven_group_antecedent"])
  self.assertEqual(m[0]["manual_partitive_gold"],"NOT_ADJUDICATED")
  self.assertNotIn("form",m[0])
 def test_literal_and_sentence_counts_are_distinct(self):
  a,m=scan_documents([{"id":"d","sentence":[{"id":"s","form":"그중 하나, 그중 둘.","ZA":[]}]}],"DEV")
  self.assertEqual(a["geujung_sentences"],1)
  self.assertEqual(a["geujung_literals"],2)
  self.assertEqual(a["geujung_has_prior_sentence"],0)
 def test_invalid_annotations_rejected(self):
  with self.assertRaisesRegex(ValueError,"ZA_ANNOTATION_LIST_MISSING"):
   scan_documents([{"sentence":[{"form":"그중 하나"}]}],"DEV")
 def test_opaque_hashes_are_deterministic(self):
  self.assertEqual(sha(canonical(["a","b"])),sha(canonical(["a","b"])))
  self.assertNotEqual(sha(canonical(["a","b"])),sha(canonical(["a","c"])))
if __name__=="__main__":unittest.main()
