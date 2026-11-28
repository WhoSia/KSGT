import copy
import unittest
from r5r_blind_packet import ARMS,PacketError,allocate,private_key,validate_ratings
C={'schema':'ksgt.g10p2.r5r.preflight-config.v1','status':'UNFROZEN_PREFLIGHT','human_outcomes':0,
   'new_model_calls':0,'arms':list(ARMS),'private_allocation_seed':'private-synthetic-only',
   'model_identity':'SYNTHETIC-NOT-REAL','source_boundary_audit_id':'AUDIT-SYNTH',
   'rubric_revision':'draft-1','cost_contract_revision':'draft-1',
   'source_boundary_verified':True,'license_reviewed':True,'actual_human_quality_gold':False,'synthetic_only':True}
T={'task_id':'t1','work_id':'w1','genre':'설명문','audience':'고등학생','source_fingerprint':'a'*64,
   'lineage_audit_id':'AUDIT-SYNTH','rights':'APPROVED','exposed':False,'parent_work_disjoint':True}
class Tests(unittest.TestCase):
    def test_packet(self):
        x=allocate(C,[T]);self.assertEqual(x['works'],1);self.assertEqual(len(x['blind_packet'][0]['blind_display_labels']),7)
        self.assertFalse(x['quality_promotion']);self.assertFalse(x['reader_study_approval'])
    def test_determinism(self):self.assertEqual(allocate(C,[T]),allocate(C,[T]))
    def test_order_independent(self):
        t=copy.deepcopy(T);t.update(work_id='w2',task_id='t2',source_fingerprint='b'*64)
        self.assertEqual(allocate(C,[T,t]),allocate(C,[t,T]))
    def test_duplicate_work(self):
        t=copy.deepcopy(T);t['task_id']='t2'
        with self.assertRaisesRegex(PacketError,'DUPLICATE_WORK'):allocate(C,[T,t])
    def test_exposed_rejected(self):
        t=copy.deepcopy(T);t['exposed']=True
        with self.assertRaisesRegex(PacketError,'UNSAFE_WORK'):allocate(C,[t])
    def test_rights_rejected(self):
        t=copy.deepcopy(T);t['rights']='UNKNOWN'
        with self.assertRaisesRegex(PacketError,'UNSAFE_WORK'):allocate(C,[t])
    def test_lineage_rejected(self):
        t=copy.deepcopy(T);t['lineage_audit_id']='other'
        with self.assertRaisesRegex(PacketError,'LINEAGE_NOT_ATTESTED'):allocate(C,[t])
    def test_private_text_rejected(self):
        t=copy.deepcopy(T);t['source_text']='secret'
        with self.assertRaisesRegex(PacketError,'RAW_TEXT_UNSUPPORTED'):allocate(C,[t])
    def test_unfrozen_only(self):
        c=copy.deepcopy(C);c['status']='FROZEN'
        with self.assertRaisesRegex(PacketError,'MUST_REMAIN_UNFROZEN'):allocate(c,[T])
    def test_false_gold(self):
        c=copy.deepcopy(C);c['human_outcomes']=1
        with self.assertRaisesRegex(PacketError,'OUTCOME_OR_CALL_FORGERY'):allocate(c,[T])
    def test_false_license(self):
        c=copy.deepcopy(C);c['license_reviewed']=False
        with self.assertRaisesRegex(PacketError,'LICENSE_NOT_REVIEWED'):allocate(c,[T])
    def test_private_key_distinct_from_public(self):
        public=allocate(C,[T]);key=private_key(C,[T]);self.assertEqual(set(key['t1']),set(public['blind_packet'][0]['blind_display_labels']))
        self.assertNotIn('STRONG_DIRECT',str(public['blind_packet'][0]))
    def test_live_study_cannot_be_claimed(self):
        c=copy.deepcopy(C);c['synthetic_only']=False
        with self.assertRaisesRegex(PacketError,'LIVE_STUDY_NOT_AUTHORIZED'):allocate(c,[T])
    def test_rating_empty(self):self.assertEqual(validate_ratings([])['records_shape_valid'],0)
    def test_rating_reject_unblind(self):
        with self.assertRaisesRegex(PacketError,'UNBLINDED_ARM'):validate_ratings([dict(work_token='w',blind_label='STRONG_DIRECT',rater_token='r',task_usefulness=5)])
    def test_rating_reject_boolean(self):
        with self.assertRaisesRegex(PacketError,'BAD_RATING_VALUE'):validate_ratings([dict(work_token='w',blind_label='X1',rater_token='r',task_usefulness=True)])
    def test_duplicate_rating(self):
        a=dict(work_token='w',blind_label='X1',rater_token='r',task_usefulness=3)
        with self.assertRaisesRegex(PacketError,'DUPLICATE_RATING'):validate_ratings([a,a])
if __name__=='__main__':unittest.main()
