"""New authored boundary-reset reversals; never licensed corpus examples."""
import unittest
import p62_reference as ref
import p62_r3_stream_inference as stream
import p62_r4_guarded_v3 as v3
from p62_r4_r3_source_witness import strict,verify_structure_binding
def evaluate(forms):
    i=len(forms)-1;m=ref.TARGET.search(forms[i]);t={'unit':i,'start':m.start(),'end':m.end(),'observed':True};identity={'strict_structure':strict(forms),'member_key':'2'*64,'archive_sha256':'3'*64,'document_ordinal':0};offset=sum(map(len,forms[:i]));j=dict(t,unit=0,start=offset+t['start'],end=offset+t['end']);joined=[''.join(forms)]
    return v3.infer(forms,t,identity),v3.infer(joined,j,identity),stream.infer(forms,t),stream.infer(joined,j),identity,joined
class SegmentationRegressions(unittest.TestCase):
    def test_period_unit_boundary_resets_numeral_guard(self):
        a,b,_,_,_,_=evaluate(['첫 단락은 끝났다.','3명이 왔다. 그중 한 명이 떠났다.'])
        self.assertIsNotNone(a['selected']);self.assertIsNone(b['selected'])
    def test_reset_can_reverse_competition_to_proposal(self):
        a,b,_,_,_,_=evaluate(['2개를 세었다.','3명이 왔다. 그중'])
        self.assertIsNone(a['selected']);self.assertIsNotNone(b['selected'])
    def test_stream_selection_survives_same_codepoints(self):
        _,_,a,b,_,_=evaluate(['첫 단락은 끝났다.','3명이 왔다. 그중 한 명이 떠났다.'])
        self.assertEqual(a['selected_global_span'],b['selected_global_span'])
    def test_counterfactual_join_cannot_attest_original_structure(self):
        _,_,_,_,identity,joined=evaluate(['첫 단락은 끝났다.','3명이 왔다. 그중 한 명이 떠났다.'])
        with self.assertRaises(ValueError):verify_structure_binding(joined,identity)
    def test_structure_binding_does_not_attest_archive(self):
        f=['3명이 왔다. 그중'];o=verify_structure_binding(f,{'strict_structure':strict(f),'verified':True});self.assertEqual(o['archive_custody'],'REQUIRES_EXTERNAL_RAW_WITNESS');self.assertIsNone(o['human_ground_truth'])
if __name__=='__main__':unittest.main()
