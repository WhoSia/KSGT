"""Authored synthetic regressions; no licensed corpus examples or human gold."""
import copy,unittest
import p62_r4_guarded_v3 as guarded
from p62_r4_r3_source_witness import strict
from p62_r4_r4_conditional_diagnostics import diagnose

class ConditionalDiagnosticsTests(unittest.TestCase):
    def fixture(self,text):
        forms=[text];a=text.index('그중');target={'unit':0,'start':a,'end':a+2,'observed':True}
        identity={'strict_structure':strict(forms),'member_key':'b'*64,'archive_sha256':'c'*64,'document_ordinal':0}
        result=guarded.infer(forms,target,identity)
        return forms,target,identity,result
    def test_singleton_union_remains_overlap_dependent(self):
        f,t,i,r=self.fixture('1명과 1명이 대기했다. 그중 2명이 이동했다.')
        before=copy.deepcopy(r);d=diagnose(f,t,i,r)
        self.assertEqual(d['unions'][0]['status'],'OVERLAP_DEPENDENT_CAPACITY_UNDER_DECLARED_FINITE_SET_PREMISES')
        self.assertEqual(d['unions'][0]['bounds']['upper'],2)
        self.assertFalse(d['reference_licensed']);self.assertIsNone(d['human_ground_truth']);self.assertEqual(r,before)
    def test_impossible_capacity(self):
        f,t,i,r=self.fixture('1명과 1명이 대기했다. 그중 3명이 이동했다.')
        self.assertEqual(diagnose(f,t,i,r)['unions'][0]['status'],'IMPOSSIBLE_UNDER_DECLARED_FINITE_SET_PREMISES')
    def test_no_cross_occurrence_graph(self):
        f,t,i,r=self.fixture('1명과 1명이 대기했다. 그중 2명이 이동했다.');i['document_ordinal']=1
        with self.assertRaises(ValueError):diagnose(f,t,i,r)
    def test_invalid_structure(self):
        f,t,i,r=self.fixture('1명과 1명이 대기했다. 그중 2명이 이동했다.')
        with self.assertRaises(ValueError):diagnose(f+['추가 문장.'],t,i,r)
    def test_self_attestation_cannot_enter(self):
        f,t,i,r=self.fixture('1명과 1명이 대기했다. 그중 2명이 이동했다.');r['human_ground_truth']={'correct':True}
        self.assertEqual(diagnose(f,t,i,r)['status'],'HOLD_AUTHORITY_OVERCLAIM')
    def test_future_suffix_invariance(self):
        f,t,i,r=self.fixture('1명과 1명이 대기했다. 그중 2명이 이동했다.')
        d=diagnose(f,t,i,r)
        ff=f+['9명과 9명이 발표했다.'];ii={**i,'strict_structure':strict(ff)};rr=guarded.infer(ff,t,ii)
        dd=diagnose(ff,t,ii,rr)
        self.assertEqual([(u['status'],u['bounds']['lower'],u['bounds']['upper']) for u in d['unions']],[(u['status'],u['bounds']['lower'],u['bounds']['upper']) for u in dd['unions']])
    def test_edited_policy_flags_cannot_attest_scope(self):
        f,t,i,r=self.fixture('1명과 1명이 대기했다. 그중 2명이 이동했다.');r['blocked']=[]
        self.assertEqual(diagnose(f,t,i,r)['status'],'HOLD_FROZEN_POLICY_BINDING')
    def test_quantity_grid(self):
        for a in range(1,5):
            for b in range(1,5):
                for q in range(1,10):
                    f,t,i,r=self.fixture(f'{a}명과 {b}명이 대기했다. 그중 {q}명이 이동했다.')
                    d=diagnose(f,t,i,r);u=d['unions'][0]
                    expected='IMPOSSIBLE_UNDER_DECLARED_FINITE_SET_PREMISES' if q>a+b else ('GUARANTEED_CAPACITY_UNDER_DECLARED_FINITE_SET_PREMISES' if q<=max(a,b) else 'OVERLAP_DEPENDENT_CAPACITY_UNDER_DECLARED_FINITE_SET_PREMISES')
                    self.assertEqual(u['status'],expected)
if __name__=='__main__':unittest.main()
