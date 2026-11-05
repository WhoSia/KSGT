import unittest,hashlib,json,tempfile
from pathlib import Path
from r910_blind_packet import build,sha,save_new
ZIP='/mnt/data/KSGT_G10-P1_R8_20261105_GPTOSS20B_6works_shared_draft_18calls_RAW.zip'
COHORT='/mnt/data/STAGING_R910_PUBLIC_AUTHOR_COHORT.txt'
class BlindPacketTest(unittest.TestCase):
 def setUp(self):self.p,self.k=build(ZIP,COHORT,b'0'*32)
 def test_counts(self):self.assertEqual((self.p['identicalExcluded'],self.p['nonidenticalPairs']), (2,4))
 def test_no_arm_leak(self):
  text=json.dumps(self.p,ensure_ascii=False)
  for forbidden in ('GENERIC_REVISION','SOURCE_ACCOUNTABLE_REVISION','NOTICE_CONDITION_A','SCIENCE_LIMIT_A','SCENE_UNORDERED_A','PUBLIC_NOTICE_B','SCIENCE_CALIB_B','SCENE_CORRIDOR_B'):
   self.assertNotIn(forbidden,text)
 def test_blind_assignment_deterministic_when_secret_frozen(self):
  a,b=build(ZIP,COHORT,b'0'*32);self.assertEqual(self.p,a);self.assertEqual(self.k,b)
 def test_private_key_carries_arms(self):self.assertEqual(sum(r['status']=='BLINDED' for r in self.k['records']),4)
 def test_source_facts_exposed_for_adjudication(self):
  self.assertTrue(all(p['sourceFacts'] and p['protected'] for p in self.p['works']))
 def test_no_mock_ratings(self):self.assertEqual(self.p['independentReaderRatings'],0);self.assertTrue(all(all(v is None for v in p['readerEvaluation'].values()) for p in self.p['works']))
 def test_different_secret_changes_opaque_ids(self):
  a,_=build(ZIP,COHORT,b'1'*32);self.assertNotEqual([x['pairId'] for x in a['works']],[x['pairId'] for x in self.p['works']])
 def test_short_secret_rejected(self):
  with self.assertRaisesRegex(ValueError,'INSUFFICIENT_BLINDING_SECRET'):build(ZIP,COHORT,b'weak')
 def test_save_no_overwrite(self):
  with tempfile.TemporaryDirectory() as root:
   path=Path(root)/'test.json';save_new(path,self.p)
   with self.assertRaises(FileExistsError):save_new(path,self.p)
 def test_packet_not_heldout(self):self.assertEqual(self.p['authority'],'EXPOSED_INVESTIGATOR_AUTHORED_DEVELOPMENT')
if __name__=='__main__':unittest.main()
