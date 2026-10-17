"""Original synthetic source-admission and inference-boundary counterexamples."""
import copy,hashlib,unittest
import p62_r4_discourse as base
import p62_r4_guarded as guarded
from p62_r4_admission import admit_graph

def fixture(tail='한 명이 말했다.',prefix='학생 세 명이 도착했다.'):
    forms=[prefix,'그중 '+tail]
    return forms,{'unit':1,'start':0,'end':2,'observed':True}

def identity(name='A'):
    h=lambda s:hashlib.sha256(s.encode()).hexdigest()
    return {'strict_structure':h('structure'+name),'member_key':h('member'+name),'archive_sha256':h('archive'),'document_ordinal':0}

class Tests(unittest.TestCase):
    def test_valid_original_source_fragment(self):
        forms,t=fixture();x=guarded.infer(forms,t,identity())
        self.assertIsNotNone(x['selected']);self.assertEqual(x['source_admission']['status'],'VERIFIED_TYPED_SOURCE_GRAPH_ONLY')
        self.assertIsNone(x['human_ground_truth'])
    def test_cardinality_self_attestation_rejected(self):
        forms,t=fixture();x=base.infer(forms,t);x['nodes'][0]['cardinality']=999
        self.assertTrue(base.verify_graph(forms,x))
        self.assertEqual(admit_graph(forms,t,x)['status'],'HOLD_SOURCE_ATTRIBUTE_BINDING')
    def test_counter_attribute_self_attestation_rejected(self):
        forms,t=fixture();x=base.infer(forms,t);x['nodes'][0]['counter']='개'
        self.assertEqual(admit_graph(forms,t,x)['status'],'HOLD_SOURCE_ATTRIBUTE_BINDING')
    def test_reference_authority_not_self_attested(self):
        forms,t=fixture();x=base.infer(forms,t);x['nodes'][0]['reference_licensed']=True
        self.assertEqual(admit_graph(forms,t,x)['status'],'HOLD_AUTHORITY_OVERCLAIM')
    def test_human_gold_not_self_attested(self):
        forms,t=fixture();x=base.infer(forms,t);x['human_ground_truth']={'correct':True}
        self.assertEqual(admit_graph(forms,t,x)['status'],'HOLD_AUTHORITY_OVERCLAIM')
    def test_unsupported_particles_cannot_disable_quantity(self):
        for suffix in ('다섯 명이나 말했다.','다섯 명밖에 남지 않았다.'):
            forms,t=fixture(suffix);self.assertIsNotNone(base.infer(forms,t,use_target_constraints=True)['selected'])
            x=guarded.infer(forms,t,identity());self.assertIsNone(x['selected']);self.assertEqual(x['status'],'HOLD_UNMODELED_TARGET_QUANTITY_BOUNDARY')
    def test_decimal_clipping_does_not_create_integer_group(self):
        forms,t=fixture('세 명이 말했다.','평균 2.5 명이 참여했다.')
        self.assertIsNotNone(base.infer(forms,t,use_target_constraints=True)['selected'])
        x=guarded.infer(forms,t,identity());self.assertIsNone(x['selected']);self.assertEqual(x['nodes'],[])
    def test_compound_native_numeral_tail_not_three(self):
        forms,t=fixture('한 명이 말했다.','학생 스물세 명이 모였다.')
        self.assertEqual(base.infer(forms,t)['nodes'][0]['cardinality'],3)
        self.assertEqual(guarded.infer(forms,t,identity())['nodes'],[])
    def test_document_local_collision_is_not_pooled(self):
        forms,t=fixture();a=guarded.infer(forms,t,identity('A'));b=guarded.infer(forms,t,identity('B'))
        self.assertEqual(a['selected']['id'],b['selected']['id'])
        self.assertNotEqual(a['scoped_node_ids'],b['scoped_node_ids'])
    def test_counterfactual_suffix_preserves_scoped_prefix_with_fixed_occurrence(self):
        forms,t=fixture();a=guarded.infer(forms,t,identity());forms[1]+=' 미래 세 명.';forms.append('추가 다섯 명.')
        b=guarded.infer(forms,t,identity());self.assertEqual(a['scoped_prefix_state_sha256'],b['scoped_prefix_state_sha256'])
    def test_explicit_source_identity_required(self):
        forms,t=fixture()
        for bad in (None,{},dict(identity(),document_ordinal=True)):
            with self.assertRaises(ValueError):guarded.infer(forms,t,bad)
    def test_global_coordinate_self_attestation_rejected(self):
        forms,t=fixture();x=base.infer(forms,t);x['nodes'][0]['witness']['global_start']+=1
        self.assertNotEqual(admit_graph(forms,t,x)['status'],'VERIFIED_TYPED_SOURCE_GRAPH_ONLY')
    def test_boolean_cardinality_is_not_integer_evidence(self):
        forms,t=fixture();x=base.infer(forms,t);x['nodes'][0]['cardinality']=True
        self.assertEqual(admit_graph(forms,t,x)['status'],'HOLD_SOURCE_ATTRIBUTE_BINDING')
    def test_frozen_module_not_mutated(self):
        self.assertIsNot(base.R4_COUNT,guarded.kernel.R4_COUNT)
        self.assertFalse(base.R4_COUNT.pattern.startswith('(?<!'))

if __name__=='__main__':unittest.main()
