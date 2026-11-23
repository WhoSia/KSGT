import copy
import unittest
from r5u_worklevel_analysis import ARMS,AnalysisHold,summarize,outcome_lock,validate
P={'synthetic_only':True,'study_status':'UNFROZEN','verified_human_outcomes':0,'quality_promotion':False}
M={f'w{i}':{f'X{j+1}':a for j,a in enumerate(ARMS)} for i in range(4)}
def fixture():
    rows=[]
    for i,w in enumerate(M):
        for j,a in enumerate(ARMS,1):
            rows.append(dict(work_token=w,blind_label=f'X{j}',role='READER',assessor_token=f'read-{w}',usefulness=4 if a=='EXECUTABLE_STATE' else 3,naturalness=4 if a=='EXECUTABLE_STATE' else 3))
            rows.append(dict(work_token=w,blind_label=f'X{j}',role='SOURCE_AUDITOR',assessor_token=f'audit-{w}',fidelity_error='NO'))
    return rows
class Tests(unittest.TestCase):
    def setUp(self):self.rows=fixture()
    def test_all_synthetic(self):
        v=summarize(self.rows,M,P);self.assertEqual(v['work_count'],4);self.assertEqual(len(v['contrasts']),9)
        self.assertFalse(v['quality_promotion']);self.assertEqual(v['independent_human_outcomes'],0)
    def test_work_means_not_rating_count(self):
        v=summarize(self.rows,M,P);self.assertTrue(all(x['works_paired']==4 for x in v['contrasts']))
        self.assertEqual(v['contrasts'][0]['mean_work_delta'],1)
    def test_unknown_not_fake_negative(self):
        a=copy.deepcopy(self.rows)
        for x in a:
            if x['role']=='SOURCE_AUDITOR' and x['work_token']=='w0' and x['blind_label']=='X4':x['fidelity_error']='UNCERTAIN'
        v=summarize(a,M,P);self.assertEqual(v['contrasts'][2]['works_missing'],1)
    def test_pair_absence_not_zero(self):
        a=[x for x in self.rows if not(x['work_token']=='w0' and x['blind_label']=='X4' and x['role']=='READER')]
        v=summarize(a,M,P);self.assertEqual(v['contrasts'][0]['works_missing'],1)
    def test_order_invariance(self):self.assertEqual(summarize(self.rows,M,P),summarize(list(reversed(self.rows)),M,P))
    def test_signflip_not_claim(self):self.assertFalse(summarize(self.rows,M,P)['confirmed_inference'])
    def test_public_output_no_arm_key(self):self.assertNotIn('read-w0',str(summarize(self.rows,M,P)))
    def test_real_rejected(self):
        q=P.copy();q['synthetic_only']=False
        with self.assertRaisesRegex(AnalysisHold,'REAL_STUDY'):summarize(self.rows,M,q)
    def test_human_forgery_rejected(self):
        q=P.copy();q['verified_human_outcomes']=1
        with self.assertRaisesRegex(AnalysisHold,'HUMAN_OR'):summarize(self.rows,M,q)
    def test_quality_forgery_rejected(self):
        q=P.copy();q['quality_promotion']=True
        with self.assertRaisesRegex(AnalysisHold,'HUMAN_OR'):summarize(self.rows,M,q)
    def test_privileged_field(self):
        a=copy.deepcopy(self.rows);a[0]['arm']='EXECUTABLE_STATE'
        with self.assertRaisesRegex(AnalysisHold,'PRIVILEGED'):validate(a,M,P)
    def test_dupe(self):
        with self.assertRaisesRegex(AnalysisHold,'DUPLICATE'):validate(self.rows+[self.rows[0]],M,P)
    def test_same_role_overlap(self):
        a=copy.deepcopy(self.rows);a[1]['assessor_token']=a[0]['assessor_token']
        with self.assertRaisesRegex(AnalysisHold,'SAME_WORK'):validate(a,M,P)
    def test_invalid_rating_bool(self):
        a=copy.deepcopy(self.rows);a[0]['usefulness']=True
        with self.assertRaisesRegex(AnalysisHold,'INVALID_READER'):validate(a,M,P)
    def test_missing_source_witness(self):
        a=copy.deepcopy(self.rows);a[1]['fidelity_error']='YES'
        with self.assertRaisesRegex(AnalysisHold,'MISSING_WITNESS'):validate(a,M,P)
    def test_bad_mapping(self):
        m=copy.deepcopy(M);m['w0']['X1']='STRONG_DIRECT';m['w0']['X2']='STRONG_DIRECT'
        with self.assertRaisesRegex(AnalysisHold,'INVALID_PRIVATE_MAP'):validate(self.rows,m,P)
    def test_bad_work(self):
        m=copy.deepcopy(M);m.pop('w0')
        with self.assertRaisesRegex(AnalysisHold,'UNKNOWN_MAPPING'):validate(self.rows,m,P)
    def test_lock_never_unblinds(self):
        r=outcome_lock(self.rows,P);self.assertFalse(r['real_study_unblinding_permitted']);self.assertFalse(r['private_mapping_disclosed'])
    def test_lock_real_fails(self):
        q=P.copy();q['synthetic_only']=False
        with self.assertRaisesRegex(AnalysisHold,'REAL_OUTCOME'):outcome_lock(self.rows,q)
    def test_mapping_not_output(self):
        o=str(summarize(self.rows,M,P));self.assertNotIn('private_mapping',o)
    def test_unknown_fidelity_missing_all(self):
        a=copy.deepcopy(self.rows)
        for x in a:
            if x['role']=='SOURCE_AUDITOR':x['fidelity_error']='UNCERTAIN'
        v=summarize(a,M,P);self.assertEqual(v['contrasts'][2]['works_paired'],0);self.assertIsNone(v['contrasts'][2]['mean_work_delta'])
    def test_empty(self):
        with self.assertRaisesRegex(AnalysisHold,'EMPTY'):validate([],M,P)
class AdditionalCourtTests(unittest.TestCase):
    def test_signflip_bound_four_works(self):
        res=summarize(fixture(),M,P)
        self.assertEqual(res['contrasts'][0]['signflip_reference_only'],0.125)
    def test_two_raters_on_one_work_do_not_create_extra_work(self):
        rows=fixture()
        extra=copy.deepcopy(rows[0]);extra['assessor_token']='second-rater'
        rows.append(extra)
        r=summarize(rows,M,P)
        self.assertEqual(r['row_count'],57)
        self.assertEqual(r['contrasts'][0]['works_paired'],4)
        self.assertAlmostEqual(r['contrasts'][0]['mean_work_delta'],1)

if __name__=="__main__": unittest.main()
