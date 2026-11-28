import unittest,copy,os,json
from pathlib import Path
from r5y_archive_audit import read,audit_a,audit_f,audit_edits,run
from r5y_census import run as census
from r5y_prefix_guard import propose
ROOT=Path(os.environ.get('KSGT_REPLAY_ARCHIVES','/mnt/data'))
class ArchiveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.a,cls.f,cls.c,cls.d=[read(next(ROOT.glob(f'*R5{tag}_'+('16*zip' if tag=='F' else '*zip'))),tag) for tag in 'AFCD']
    def test_replay(self):
        r=run(ROOT);self.assertEqual(sum(v['response_records'] for v in r['archives'].values()),76);self.assertFalse(r['quality_promotion']);self.assertEqual(r['prefix']['counts']['status_changed_slots'],22)
    def test_cost(self):
        a=copy.deepcopy(self.a[:2]);a[0]['rows'][0]['costs']['direct']+=1
        with self.assertRaisesRegex(ValueError,'A_ALLOCATED_COST'):audit_a(*a)
    def test_false_witness(self):
        a=copy.deepcopy(self.a[:2]);a[0]['rows'][0]['extractedState']['observations'][0]['quote']='NOT IN THE SOURCE'
        with self.assertRaisesRegex(ValueError,'A_UNANCHORED_QUOTE'):audit_a(*a)
    def test_false_repeat(self):
        a=copy.deepcopy(self.a[:2]);a[0]['rows'][0]['completions']['observed']['startsByRepeatingPrefix']=True
        with self.assertRaisesRegex(ValueError,'A_REPEAT_FLAG'):audit_a(*a)
    def test_family_leak(self):
        f=copy.deepcopy(self.f[:3]);k='r5f-live/source-and-plan.json';p=json.loads(f[2][k]);p['calls'][1]['exampleIndices']=[p['calls'][1]['sourceIndex']];f[2][k]=json.dumps(p).encode()
        with self.assertRaisesRegex(ValueError,'F_TEST_FAMILY_LEAK'):audit_f(*f)
    def test_raw_mutation(self):
        f=copy.deepcopy(self.f[:3]);f[2]['SmileStyle_original_CC-BY-NC-4.0.tsv']+=b' '
        with self.assertRaisesRegex(ValueError,'F_SOURCE_HASH'):audit_f(*f)
    def test_census(self):
        r=census(ROOT);self.assertTrue(all(r['stored_matches'].values()));self.assertEqual(r['prefix_candidate_removed_chars'],158)
    def test_c_target(self):
        c=copy.deepcopy(self.c[:2]);c[0]['rows'][0]['target']['quote']='new'
        with self.assertRaisesRegex(ValueError,'C_ANCHOR'):audit_edits(*c,*self.d[:2])
    def test_d_parent(self):
        d=copy.deepcopy(self.d[:2]);d[0]['rows'][0]['previousSingleSpan']['text']+='x'
        with self.assertRaisesRegex(ValueError,'D_PARENT_TEXT'):audit_edits(*self.c[:2],*d)
    def test_d_reply(self):
        d=copy.deepcopy(self.d[:2]);w=d[0]['rows'][1]['id']+'_SEAM';r=json.loads(d[1][w]['text']);r['replacement']='x';d[1][w]['text']=json.dumps(r)
        with self.assertRaisesRegex(ValueError,'D_EDIT_REPLAY'):audit_edits(*self.c[:2],*d)
    def test_guard_candidate(self):self.assertEqual(propose('a','a b'),{'status':'REVIEW_CANDIDATE_ONLY','text':'a\nb','removed_chars':2})
    def test_guard_nonboundary(self):self.assertEqual(propose('a','abc')['status'],'REVIEW_NO_CANDIDATE')
    def test_guard_empty_tail(self):self.assertEqual(propose('a','a')['status'],'REVIEW_NO_CANDIDATE')
    def test_guard_keep(self):self.assertEqual(propose('a','b')['text'],'a\nb')
if __name__=='__main__':unittest.main()
