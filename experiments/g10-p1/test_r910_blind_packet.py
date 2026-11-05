"""Blinded R8 reader packet tests. Original data stay outside GitHub.

Run integration tests with:
  KSGT_R8_ZIP=/path/to/sealed-r8.zip
  KSGT_R6_COHORT_JSON=/path/to/author-authored-cohort.json
"""
import json,os,tempfile,unittest
from pathlib import Path
from r910_blind_packet import build,sha,save_new
ZIP=os.environ.get('KSGT_R8_ZIP')
COHORT=os.environ.get('KSGT_R6_COHORT_JSON')
HAS_ORIGINALS=bool(ZIP and COHORT and Path(ZIP).is_file() and Path(COHORT).is_file())

class SyntheticReaderGateTests(unittest.TestCase):
 def test_hash_stable(self):self.assertEqual(sha(b'abc'),sha(b'abc'))
 def test_save_no_overwrite(self):
  with tempfile.TemporaryDirectory() as root:
   path=Path(root)/'test.json';save_new(path,{'schema':'test'})
   with self.assertRaises(FileExistsError):save_new(path,{'schema':'test'})

@unittest.skipUnless(HAS_ORIGINALS,'EXPOSED_R8_RAW_AND_AUTHOR_COHORT_NOT_MOUNTED')
class OriginalR8ReaderPacketTests(unittest.TestCase):
 def setUp(self):self.p,self.k=build(ZIP,COHORT,b'0'*32)
 def test_counts(self):self.assertEqual((self.p['identicalExcluded'],self.p['nonidenticalPairs']), (2,4))
 def test_no_arm_leak(self):
  txt=json.dumps(self.p,ensure_ascii=False)
  for forbidden in ('GENERIC_REVISION','SOURCE_ACCOUNTABLE_REVISION','NOTICE_CONDITION_A','SCIENCE_LIMIT_A','SCENE_UNORDERED_A','PUBLIC_NOTICE_B','SCIENCE_CALIB_B','SCENE_CORRIDOR_B'):
   self.assertNotIn(forbidden,txt)
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
 def test_packet_not_heldout(self):self.assertEqual(self.p['authority'],'EXPOSED_INVESTIGATOR_AUTHORED_DEVELOPMENT')
if __name__=='__main__':unittest.main()
