"""Authored Korean countermodels for mechanical invariants, not human gold."""
import copy,unittest
import p62_r4_guarded_v3 as v3
from p62_r4_r3_source_witness import strict
from p62_r4_r5_mechanisms import infer

class MechanismTests(unittest.TestCase):
 def fixture(self,text):
  forms=[text];a=text.index('그중');target={'unit':0,'start':a,'end':a+2,'observed':True}
  identity={'strict_structure':strict(forms),'member_key':'b'*64,'archive_sha256':'c'*64,'document_ordinal':2}
  return forms,target,identity
 def test_descriptor_and_role_have_distinct_evidence(self):
  f,t,i=self.fixture('학생 3명이 모였다. 그중 학생 2명이 떠났다.')
  r=infer(f,t,i)
  self.assertEqual(r['target_surface_features']['descriptor_surface'],'학생')
  self.assertEqual(r['target_surface_features']['particle_role_proxy'],'SUBJECT_PARTICLE')
  self.assertTrue(any(x['descriptor'] and x['particle_role_proxy']=='SUBJECT_PARTICLE' for x in r['source_evidence']))
  self.assertIsNone(r['human_ground_truth']);self.assertFalse(r['reference_licensed'])
 def test_role_swap_is_mechanical_sensitivity(self):
  f,t,i=self.fixture('학생 3명이 모였다. 그중 학생 2명을 만났다.')
  r=infer(f,t,i)
  self.assertEqual(r['target_surface_features']['particle_role_proxy'],'OBJECT_PARTICLE')
  self.assertIsNone(r['m2_particle_role']['selected']);self.assertIsNone(r['m3_descriptor_and_role']['selected'])
 def test_repeated_description_preserves_competition(self):
  f,t,i=self.fixture('학생 3명이 모였다. 학생 4명이 있었다. 그중 학생 2명이 떠났다.')
  r=infer(f,t,i)
  self.assertGreaterEqual(sum(x['descriptor'] and x['descriptor']['surface']=='학생' for x in r['source_evidence']),2)
  self.assertIsNone(r['m1_descriptor']['selected'])
 def test_missing_target_descriptor_abstains(self):
  f,t,i=self.fixture('학생 3명이 모였다. 그중 2명이 떠났다.')
  r=infer(f,t,i)
  self.assertIsNone(r['m1_descriptor']['selected']);self.assertIsNone(r['m3_descriptor_and_role']['selected'])
 def test_quote_cause_survives_terminal_quantity_status(self):
  f,t,i=self.fixture('” 학생 3명이 모였다. 그중 2명이 떠났다.')
  r=infer(f,t,i)
  self.assertTrue(r['cause_chain'][-1]['masked_earlier_quote_hold'])
  self.assertEqual(r['cause_chain'][2]['status'],'HOLD_INVALID_QUOTE_SCOPE')
  self.assertIsNone(r['m4_staged']['selected'])
 def test_unmodeled_quantity_does_not_bypass_target_gate(self):
  f,t,i=self.fixture('학생 3명이 왔다. 그중 2회가 있었다.')
  r=infer(f,t,i)
  if r['m0_v3_status']=='HOLD_UNMODELED_TARGET_QUANTITY_BOUNDARY':
   self.assertTrue(all(r[key]['selected'] is None for key in
    ('m1_descriptor','m2_particle_role','m3_descriptor_and_role','m4_staged')))
 def test_false_archive_identity_fails_structure_binding(self):
  f,t,i=self.fixture('학생 3명이 모였다. 그중 학생 2명이 떠났다.')
  with self.assertRaises(ValueError):infer(f+['새 문장.'],t,i)
 def test_self_attested_graph_rejected(self):
  f,t,i=self.fixture('학생 3명이 모였다. 그중 학생 2명이 떠났다.')
  g=v3.infer(f,t,i);g['human_ground_truth']={'correct':True}
  with self.assertRaises(ValueError):infer(f,t,i,g)
 def test_future_suffix_does_not_change_prefix_evidence(self):
  f,t,i=self.fixture('학생 3명이 모였다. 그중 학생 2명이 떠났다.')
  a=infer(f,t,i);changed=f+['미래 학생 9명이 등장했다.'];ii={**i,'strict_structure':strict(changed)};b=infer(changed,t,ii)
  self.assertEqual(a['source_evidence'],b['source_evidence'])
  self.assertEqual(a['m1_descriptor']['status'],b['m1_descriptor']['status'])
 def test_unrelated_event_negation_is_not_entity_gold(self):
  f,t,i=self.fixture('학생 3명이 오지 않았다. 그중 학생 2명이 떠났다.')
  r=infer(f,t,i)
  self.assertTrue(all(x['semantic_role'] is None for x in r['source_evidence']))
  self.assertIsNone(r['semantic_accuracy'])
 def test_surface_collision_does_not_licence_reference(self):
  f,t,i=self.fixture('학생 3명이 왔다. 다른 학생 4명이 왔다. 그중 학생 2명이 갔다.')
  r=infer(f,t,i)
  self.assertGreaterEqual(sum(x['descriptor'] and x['descriptor']['surface']=='학생' for x in r['source_evidence']),2)
  self.assertFalse(r['reference_licensed'])
  self.assertIsNone(r['semantic_accuracy'])
 def test_group_composition_does_not_invent_membership(self):
  f,t,i=self.fixture('학생 3명과 교사 2명이 왔다. 그중 학생 2명이 갔다.')
  r=infer(f,t,i)
  self.assertTrue(all(x['human_ground_truth'] is None for x in r['source_evidence']))
  self.assertTrue(all(x['semantic_role'] is None for x in r['source_evidence']))
  self.assertTrue(all(x['membership_overlap']=='UNOBSERVED' for x in r['union_evidence']))
  if any(x['possible_under_frozen_v3'] for x in r['union_evidence']):
   self.assertIsNone(r['m3_descriptor_and_role']['selected'])
   self.assertIsNone(r['m4_staged']['selected'])
 def test_nested_quote_cause_stages_remain_separate(self):
  f,t,i=self.fixture('“학생 3명이 말했다. ‘교사 2명이 왔다.’” 그중 1명이 떠났다.')
  r=infer(f,t,i)
  self.assertEqual([x['stage'] for x in r['cause_chain']],
   ['ORIGINAL_STRUCTURE','SOURCE_SPAN_ADMISSION','ASSERTION_AND_QUOTATION_SCOPE','TARGET_LOCAL_COMPATIBILITY'])
  self.assertIsNotNone(r['cause_chain'][2]['status'])
  self.assertIsNotNone(r['cause_chain'][3]['status'])
 def test_possible_union_blocks_staged_individual_guess(self):
  f,t,i=self.fixture('2명과 2명이 대기했다. 그중 3명이 이동했다.')
  r=infer(f,t,i)
  self.assertTrue(any(x['possible_under_frozen_v3'] for x in r['union_evidence']))
  self.assertIsNone(r['m3_descriptor_and_role']['selected'])
  self.assertIsNone(r['m4_staged']['selected'])
  self.assertTrue(all(x['membership_overlap']=='UNOBSERVED' for x in r['union_evidence']))
 def test_development_v2_blocks_role_proxy_union_bypass(self):
  import p62_r4_r5_mechanisms_v2 as v2
  f,t,i=self.fixture('3명과 3명이 대기했다. 그중 2명이 이동했다.')
  before=infer(f,t,i);after=v2.infer(f,t,i)
  self.assertTrue(any(x['possible_under_frozen_v3'] for x in before['union_evidence']))
  self.assertIsNotNone(before['m2_particle_role']['selected'])
  self.assertIsNone(after['m2_particle_role']['selected'])
  self.assertEqual(after['m2_particle_role']['status'],'HOLD_COMPETING_COORDINATED_GROUP')
  self.assertEqual(before['m0_v3_selected'],after['m0_v3_selected'])
 def test_source_fingerprint_is_bound_to_original_span(self):
  f,t,i=self.fixture('학생 3명이 모였다. 그중 학생 2명이 떠났다.')
  r=infer(f,t,i)
  self.assertTrue(all(len(x['source_span_sha256'])==64 for x in r['source_evidence']))
  self.assertTrue(all(x['descriptor'] is None or x['descriptor']['authority']=='ORIGINAL_SURFACE_ONLY' for x in r['source_evidence']))
 def test_r3_typed_baseline_uses_actual_selected_global_span(self):
  import p62_r3_typed_inference as typed
  f,t,_=self.fixture('학생 세 명이 왔다. 그중 두 명이 떠났다.')
  result=typed.infer(f,t)
  self.assertIsNotNone(result['selected_global_span'])
  self.assertNotIn('selected',result)
if __name__=='__main__':unittest.main()

