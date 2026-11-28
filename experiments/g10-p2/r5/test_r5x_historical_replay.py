import json,unittest,os
from pathlib import Path
from r5x_historical_replay import archive,replay
class Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root=Path(os.environ.get('KSGT_REPLAY_ARCHIVES','/mnt/data'))
        cls.data=[archive(next(root.glob(p)))[0] for p in ('*R4A*zip','*R4B_ORIG*zip','*R4B1*zip')]
    def test_replay(self):
        r=replay(*self.data);self.assertEqual([r['r4a_archived_calls'],r['r4b_incremental_archived_calls'],r['r4b1_incremental_archived_calls']],[60,20,0]);self.assertEqual(r['r4a_selection_agreement'],10);self.assertEqual(r['r4b1_recorded_target_removal'],6);self.assertEqual(r['no_target_unchanged_all'],4);self.assertFalse(r['quality_promotion'])
    def test_nested_mutation(self):
        a,b,c=[dict(d) for d in self.data];b['r4b-original/r4a-original/r4a-frozen-plan.json']+=b' '
        with self.assertRaisesRegex(ValueError,'R4A_NESTED_MISMATCH'):replay(a,b,c)
    def test_posthoc_flag_mutation(self):
        a,b,c=[dict(d) for d in self.data];j=json.loads(c['r4b1-replay.json']);j['rows'][0]['removedOriginalTarget']=False;c['r4b1-replay.json']=json.dumps(j).encode()
        with self.assertRaisesRegex(ValueError,'POSTHOC_SPAN_REPLAY'):replay(a,b,c)
    def test_posthoc_text_mutation(self):
        a,b,c=[dict(d) for d in self.data];j=json.loads(c['r4b1-replay.json']);j['rows'][0]['outputText']+='x';c['r4b1-replay.json']=json.dumps(j).encode()
        with self.assertRaisesRegex(ValueError,'R4B1_OUTPUT_HASH'):replay(a,b,c)
    def test_second_nested_mutation(self):
        a,b,c=[dict(d) for d in self.data];c['r4b-old/r4b-verified-recovery.json']+=b' '
        with self.assertRaisesRegex(ValueError,'R4B_NESTED_MISMATCH'):replay(a,b,c)
if __name__=='__main__':unittest.main()
