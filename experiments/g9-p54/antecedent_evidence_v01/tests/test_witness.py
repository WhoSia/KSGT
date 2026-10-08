import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from source_witness import inspect,quantity
class Cases(unittest.TestCase):
 def test_numerical_cue_not_gold(self):
  a=inspect(["총 12건이다."],"그중 4건을 골랐다.")
  self.assertTrue(a["cue_2"]);self.assertFalse(a["proven_antecedent"])
 def test_amount_compatible_is_not_gold(self):
  self.assertEqual(quantity(["5팀이 참가했다."],"그중 2팀이 남았다."),"UNIQUE_NUMERIC_COMPATIBILITY_ONLY")
 def test_amount_inconsistent(self):
  self.assertEqual(quantity(["1팀이 참가했다."],"그중 2팀이 남았다."),"NUMERIC_CONTRADICTION")
 def test_multiple_candidates(self):
  self.assertEqual(quantity(["5팀과 4팀이 참가했다."],"그중 2팀이 남았다."),"MULTIPLE_COMPETING_NUMERIC_CUES")
 def test_percent_needs_separate_semantics(self):
  self.assertEqual(quantity(["총 50건이다."],"그중 92%에 답했다."),"NO_NUMERIC_TARGET")
 def test_source_only_abstains(self):
  self.assertEqual(inspect(["돌아갔다."],"그중 하나")["status"],"ABSTAIN_NO_VISIBLE_GROUP_CUE")
 def test_right_continuation_hold(self):
  self.assertEqual(inspect(["여행 이야기다."],"그중에서 좋은 여행은","지난번이었다.")["status"],"ABSTAIN_RIGHT_CONTEXT_POSSIBLE")
 def test_exact_witness_plus_author_clear(self):
  x=inspect(["파란 컵 두 개다."],"그중 한 컵",declared=[{"group_id":"C","source_index":-1,"quote":"파란 컵 두 개"}],writer_policy="CLARIFY")
  self.assertEqual(x["status"],"EXACT_QUOTE_CANDIDATE_REVIEW_ONLY");self.assertFalse(x["writer_edit_permission"])
 def test_contextual_author_abstains(self):
  x=inspect(["파란 컵 두 개다."],"그중 한 컵",declared=[{"group_id":"C","source_index":-1,"quote":"파란 컵 두 개"}])
  self.assertEqual(x["status"],"ABSTAIN_WRITER_INTENT_UNKNOWN")
 def test_keep_veto(self):
  x=inspect(["파란 컵 두 개다."],"그중 한 컵",declared=[{"group_id":"C","source_index":-1,"quote":"파란 컵 두 개"}],writer_policy="KEEP")
  self.assertEqual(x["status"],"KEEP")
 def test_invalid_or_duplicate_quotations(self):
  x=inspect(["두 컵, 두 컵"],"그중 한 컵",declared=[{"group_id":"C","source_index":-1,"quote":"두 컵"}],writer_policy="CLARIFY")
  self.assertEqual(x["status"],"ABSTAIN_INVALID_SOURCE_DECLARATION")
 def test_source_only_no_human_evidence(self):
  x=inspect(["사람들이다."],"그중 한 사람")
  self.assertEqual(x["human_preference"],"NOT_OBSERVED")
if __name__=="__main__":unittest.main()
