import copy, glob, os, unittest
from pathlib import Path
from r5w_replay import read,replay
from r5w_trace_audit import trace_audit
ROOT=Path(os.environ.get('KSGT_REPLAY_ARCHIVES','/mnt/data'))
class ReplayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        def find(tag):
            matches=list(ROOT.glob('*R5'+tag+'*zip'))
            if len(matches)!=1: raise FileNotFoundError('Specify KSGT_REPLAY_ARCHIVES with exact G/H/I archives')
            return matches[0]
        cls.g,cls.gr,cls.gm=read(find('G'),'r5g-live/final-score.json')
        cls.h,cls.hr,cls.hm=read(find('H'),'r5h-live/final-score.json')
        cls.i,_,cls.im=read(find('I'),'r5i-zero-call/compiled-aggregate-score.json')
    def args(self): return copy.deepcopy((self.g,self.h,self.i,self.gr,self.hr,self.gm,self.hm,self.im))
    def test_real_archive_replay(self):
        r=replay(*self.args());self.assertEqual(r['historical_response_rows'],{'R5g':16,'R5h':16});self.assertEqual(r['distinct_source_ids'],16);self.assertFalse(r['source_independence_certified']);self.assertFalse(r['quality_promotion'])
    def test_costs(self):
        r=replay(*self.args());self.assertEqual(r['recorded_cost_by_arm']['R5g']['LATTICE']['tokens'],11209);self.assertEqual(r['recorded_cost_by_arm']['R5h']['SELECTOR']['tokens'],14811)
    def test_wrong_parent_hash(self):
        a=self.args();a[2]['sourceOriginalSHA256']='0'*64
        with self.assertRaisesRegex(ValueError,'PARENT_SCORE_HASH'):replay(*a)
    def test_parent_reuse_modified(self):
        a=self.args();a[2]['rows'][0]['originalR5hSelected']+='x'
        with self.assertRaisesRegex(ValueError,'PARENT_TEXT'):replay(*a)
    def test_provider_text_modified(self):
        a=self.args();a[3][0]['text']+='x'
        with self.assertRaisesRegex(ValueError,'RESPONSE_TEXT_HASH'):replay(*a)
    def test_duplicate_call(self):
        a=self.args();a[3].append(a[3][0])
        with self.assertRaisesRegex(ValueError,'DUPLICATE_ID'):replay(*a)
    def test_frame_order(self):
        a=self.args();a[2]['rows'][0]['aggregatedSelected']['segments'].reverse()
        with self.assertRaisesRegex(ValueError,'TRACE_FRAME_ORDER'):replay(*a)
    def test_trace_counts(self):
        r=trace_audit(self.h,self.i);self.assertEqual(r['counts']['frame_references'],96);self.assertEqual(r['counts']['joined_segments'],32);self.assertFalse(r['quality_promotion'])
    def test_actor_mismatch(self):
        a=copy.deepcopy(self.i);a['rows'][0]['aggregatedSelected']['segments'][1]['actorID']='WRONG'
        with self.assertRaisesRegex(ValueError,'ACTOR_TRACE'):trace_audit(self.h,a)
    def test_frame_hash_mismatch(self):
        a=copy.deepcopy(self.h);a['rows'][0]['compiledSelected']['trace'][0]['outputText']+='x'
        with self.assertRaisesRegex(ValueError,'FRAME_TEXT_HASH'):trace_audit(a,self.i)
if __name__=='__main__':unittest.main()
