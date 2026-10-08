import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from construction_court import construction,scan_documents
class Tests(unittest.TestCase):
 def test_five_surface_forms_are_exclusive(self):
  cases={"그중에서도":"GEUJUNG_ESEODO","그중에서":"GEUJUNG_ESEO",
   "그중에선":"GEUJUNG_ESEON","그중에":"GEUJUNG_E","그중 50%":"GEUJUNG_BARE"}
  for text,label in cases.items():self.assertEqual(construction(text),label)
 def test_narrow_legacy_form_can_match_synthetic(self):
  c,_=scan_documents([{"sentence":[{"form":"그중 한 컵을 골랐다.","ZA":[]}]}],"DEV")
  self.assertEqual(c["KRC_V07_NARROW_PATTERN_HITS"],1)
 def test_natural_variants_do_not_claim_source_gold(self):
  c,rows=scan_documents([{"sentence":[{"form":"그중에서도 두 번째","ZA":[{}]}]}],"DEV")
  self.assertEqual(c["KRC_V07_NARROW_PATTERN_HITS"],0)
  self.assertEqual(rows[0]["gold_partitive_antecedent"],"NOT_ADJUDICATED")
 def test_context_present_does_not_imply_antecedent_identified(self):
  c,rows=scan_documents([{"sentence":[{"form":"대상이 여럿 있다.","ZA":[]},{"form":"그중에 몇 개","ZA":[]}]}],"DEV")
  self.assertEqual(c["PRECEDING_SENTENCE_EXISTS"],1)
  self.assertEqual(rows[0]["human_writer_preference"],"NOT_OBSERVED")
 def test_reject_multiple_occurrences_without_span_review(self):
  with self.assertRaisesRegex(ValueError,"MULTIPLE_SPANS"):
   scan_documents([{"sentence":[{"form":"그중 하나, 그중 둘","ZA":[]}]}],"DEV")
 def test_public_records_have_no_raw_text(self):
  _,rows=scan_documents([{"sentence":[{"form":"그중 10%","ZA":[]}]}],"DEV")
  for field in ("form","raw_text","source_text","antecedent","sentence"):
   self.assertNotIn(field,rows[0])
if __name__=="__main__":unittest.main()
