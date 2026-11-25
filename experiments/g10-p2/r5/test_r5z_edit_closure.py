import unittest,os,tempfile
from pathlib import Path
from r5z_edit_closure import closure, apply, digest
from r5z_replay import run
class Test(unittest.TestCase):
    def test_facet(self): self.assertEqual(closure(range(4),{0:['a']},[(0,1,'a','b'),(0,2,'x','c'),(1,3,'b','d')]),{0,1,3})
    def test_cycle(self): self.assertEqual(closure([0,1],{0:['a']},[(0,1,'a','b'),(1,0,'b','a')]),{0,1})
    def test_disconnected(self): self.assertEqual(closure([0,1],{0:['a']},[]),{0})
    def test_bad_edge(self):
        with self.assertRaisesRegex(ValueError,'BAD_EDGE'): closure([0],{0:['a']},[(0,1,'a','b')])
    def test_bad_seed(self):
        with self.assertRaisesRegex(ValueError,'BAD_SEED'): closure([0],{1:['a']},[])
    def test_preserve(self): self.assertEqual(apply('가. 나. 다.',digest('가. 나. 다.'),[(0,2),(3,5),(6,8)],{1:'라.'},{1}),'가. 라. 다.')
    def test_stale(self):
        with self.assertRaisesRegex(ValueError,'STALE_SOURCE'):apply('가','x',[(0,1)],{0:'나'},{0})
    def test_missing(self):
        with self.assertRaisesRegex(ValueError,'CLOSURE_EDIT_MISMATCH'):apply('가',digest('가'),[(0,1)],{},{0})
    def test_overlap(self):
        with self.assertRaisesRegex(ValueError,'BAD_SPAN'):apply('가나',digest('가나'),[(0,2),(1,2)],{0:'다'},{0})
    def test_mutated_archive(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'bad.zip';p.write_bytes(b'bad')
            with self.assertRaisesRegex(ValueError,'ARCHIVE_SHA_MISMATCH'):run(p)
    def test_real(self):
        p=next(Path(os.environ.get('KSGT_REPLAY_ARCHIVES','/mnt/data')).glob('*R5C_*zip'));r,private=run(p);self.assertEqual(len(r['cases']),4);self.assertFalse(r['quality_promotion']);self.assertTrue(all(x['closure_chars_in_scope']<=x['contiguous_chars_in_scope'] for x in r['cases']));self.assertEqual(len(private),4);self.assertEqual(sum(x['route']=='COMPARE_FULL_REWRITE' for x in r['cases']),1)
if __name__=='__main__': unittest.main()
