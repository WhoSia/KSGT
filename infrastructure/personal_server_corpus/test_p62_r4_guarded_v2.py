"""Preserve the executed v1 coordinator overrestriction and bind observed scopes."""
import copy,unittest
import p62_r4_discourse as base
import p62_r4_guarded as v1
import p62_r4_guarded_v2 as v2
from p62_r4_admission_v2 import admit_graph
from test_p62_r4_guarded import identity,fixture

class Tests(unittest.TestCase):
    def test_distinct_marker_and_modifier_witnesses_admitted(self):
        forms=['학생 세 명과 교사 두 명이 왔다.','그중 네 명이 말했다.']
        target={'unit':1,'start':0,'end':2,'observed':True}
        self.assertEqual(v1.infer(forms,target,identity())['status'],'HOLD_COORDINATOR_TOPOLOGY')
        result=v2.infer(forms,target,identity())
        self.assertEqual(result['status'],'HOLD_UNRESOLVED_COORDINATED_UNION_ONLY')
        self.assertEqual(result['source_admission']['status'],'VERIFIED_TYPED_SOURCE_GRAPH_ONLY')
        self.assertIsNone(result['selected'])
    def test_spaces_around_marker_do_not_fabricate_contiguous_denotation(self):
        forms=['학생 세 명 및 교사 두 명이 왔다.','그중 네 명이 말했다.']
        target={'unit':1,'start':0,'end':2,'observed':True}
        result=v2.infer(forms,target,identity());self.assertEqual(len(result['unions']),1)
        self.assertIsNone(result['unions'][0]['total_cardinality'])
        self.assertFalse(result['unions'][0]['reference_licensed'])
        self.assertEqual(result['source_admission']['status'],'VERIFIED_TYPED_SOURCE_GRAPH_ONLY')
    def test_assertion_self_attestation_rejected(self):
        forms,t=fixture();result=base.infer(forms,t);result['nodes'][0]['assertion']='SURFACE_EXISTENTIAL_NEGATION'
        self.assertEqual(admit_graph(forms,t,result)['status'],'HOLD_SOURCE_ASSERTION_BINDING')
    def test_quote_scope_self_attestation_rejected(self):
        forms,t=fixture();result=base.infer(forms,t);result['nodes'][0]['quote_scope']=(999,)
        self.assertEqual(admit_graph(forms,t,result)['status'],'HOLD_SOURCE_SCOPE_BINDING')
    def test_hypothetical_scope_self_attestation_rejected(self):
        forms,t=fixture();result=base.infer(forms,t);result['nodes'][0]['hypothetical']=True
        self.assertEqual(admit_graph(forms,t,result)['status'],'HOLD_SOURCE_SCOPE_BINDING')
    def test_serialized_scope_roundtrip_admitted(self):
        import json
        forms,t=fixture();result=json.loads(json.dumps(base.infer(forms,t)))
        self.assertEqual(admit_graph(forms,t,result)['status'],'VERIFIED_TYPED_SOURCE_GRAPH_ONLY')

if __name__=='__main__':unittest.main()
