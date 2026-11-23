import copy
import unittest
from r5v_lock_audit import LockHold,canonical_lock,fidelity_bounds
ARMS=('STRONG_DIRECT','RICH_PROMPT','STATE_AS_TEXT','EXECUTABLE_STATE','EQUAL_COST_ITERATIVE','NO_OP_KEEP','SHAM_STATE')
P={'synthetic_only':True,'study_status':'UNFROZEN','verified_human_outcomes':0}
M={w:{f'X{i}':arm for i,arm in enumerate(ARMS,1)} for w in ('a','b','c','d')}
def fixture():
    out=[]
    for w in M:
        for i,arm in enumerate(ARMS,1):
            out.append({'work_token':w,'blind_label':f'X{i}','role':'READER','assessor_token':'r'+w,'usefulness':4,'naturalness':3})
            out.append({'work_token':w,'blind_label':f'X{i}','role':'SOURCE_AUDITOR','assessor_token':'s'+w,'fidelity_error':'NO'})
    return out
class Tests(unittest.TestCase):
    def test_lock_permutation_invariant(self):
        x=fixture();self.assertEqual(canonical_lock(x,P),canonical_lock(list(reversed(x)),P))
    def test_lock_tamper_sensitive(self):
        x=fixture();y=copy.deepcopy(x);y[0]['usefulness']=5
        self.assertNotEqual(canonical_lock(x,P)['lock_sha256'],canonical_lock(y,P)['lock_sha256'])
    def test_synthetic_flag(self):self.assertFalse(canonical_lock(fixture(),P)['real_unblinding_authorized'])
    def test_real_study_rejected(self):
        p=P.copy();p['synthetic_only']=False
        with self.assertRaisesRegex(LockHold,'REAL_STUDY'):canonical_lock(fixture(),p)
    def test_forged_human_rejected(self):
        p=P.copy();p['verified_human_outcomes']=8
        with self.assertRaisesRegex(LockHold,'REAL_STUDY'):canonical_lock(fixture(),p)
    def test_duplicate(self):
        x=fixture();x.append(x[0])
        with self.assertRaisesRegex(LockHold,'DUPLICATE'):canonical_lock(x,P)
    def test_privileged_mapping(self):
        x=fixture();x[0]['arm']='STRONG_DIRECT'
        with self.assertRaisesRegex(LockHold,'PRIVILEGED'):canonical_lock(x,P)
    def test_same_work_role_overlap(self):
        x=fixture();x[1]['assessor_token']='ra'
        with self.assertRaisesRegex(LockHold,'ROLE_OVERLAP'):canonical_lock(x,P)
    def test_bad_score_bool(self):
        x=fixture();x[0]['usefulness']=True
        with self.assertRaisesRegex(LockHold,'INVALID_READER'):canonical_lock(x,P)
    def test_bad_fidelity(self):
        x=fixture();x[1]['fidelity_error']='MAYBE'
        with self.assertRaisesRegex(LockHold,'INVALID_FIDELITY'):canonical_lock(x,P)
    def test_missing_witness(self):
        x=fixture();x[1]['fidelity_error']='YES'
        with self.assertRaisesRegex(LockHold,'MISSING_WITNESS'):canonical_lock(x,P)
    def test_no_private_seed(self):
        x=fixture();x[0]['private_allocation_seed']='leak'
        with self.assertRaisesRegex(LockHold,'PRIVILEGED'):canonical_lock(x,P)
    def test_zero_fidelity_bounds(self):
        a=fidelity_bounds(fixture(),M);self.assertEqual((a['lower_delta'],a['upper_delta']),(0,0))
    def test_uncertain_target(self):
        x=fixture();next(r for r in x if r['work_token']=='a' and r['blind_label']=='X4' and r['role']=='SOURCE_AUDITOR')['fidelity_error']='UNCERTAIN'
        b=fidelity_bounds(x,M);self.assertEqual((b['lower_delta'],b['upper_delta']),(0,.25))
    def test_uncertain_competitor(self):
        x=fixture();next(r for r in x if r['work_token']=='a' and r['blind_label']=='X3' and r['role']=='SOURCE_AUDITOR')['fidelity_error']='UNCERTAIN'
        b=fidelity_bounds(x,M);self.assertEqual((b['lower_delta'],b['upper_delta']),(-.25,0))
    def test_both_uncertain(self):
        x=fixture()
        for r in x:
            if r['role']=='SOURCE_AUDITOR' and r['blind_label'] in ('X3','X4'):r['fidelity_error']='UNCERTAIN'
        b=fidelity_bounds(x,M);self.assertEqual((b['lower_delta'],b['upper_delta']),(-1,1))
    def test_mapping_missing(self):
        with self.assertRaisesRegex(LockHold,'MAPPING'):fidelity_bounds(fixture(),{})
    def test_missing_audits(self):
        x=[r for r in fixture() if not(r['role']=='SOURCE_AUDITOR' and r['work_token']=='a' and r['blind_label']=='X3')]
        with self.assertRaisesRegex(LockHold,'MISSING_ARM'):fidelity_bounds(x,M)
    def test_order_invariant_bounds(self):self.assertEqual(fidelity_bounds(fixture(),M),fidelity_bounds(list(reversed(fixture())),M))
if __name__=='__main__':unittest.main()
