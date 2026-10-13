"""Typed numeral boundaries: retain observed attached digits, reject clipped values."""
import unittest
import p62_r4_guarded_v2 as v2
import p62_r4_guarded_v3 as v3
from test_p62_r4_guarded import fixture,identity

class Tests(unittest.TestCase):
    def test_attached_arabic_digit_not_blanket_hangul_rejection(self):
        for prefix in ('총3 명이 왔다.','학생3 명이 왔다.'):
            forms,t=fixture(prefix=prefix)
            self.assertIsNone(v2.infer(forms,t,identity())['selected'])
            result=v3.infer(forms,t,identity());self.assertIsNotNone(result['selected'])
            self.assertEqual(result['selected']['cardinality'],3)
    def test_magnitude_native_decimal_and_range_clipping_remain_blocked(self):
        for prefix in ('학생 스물세 명이 왔다.','학생 1만3 명이 왔다.','평균2.5 명이 왔다.','학생2~3 명이 왔다.'):
            forms,t=fixture(prefix=prefix);self.assertEqual(v3.infer(forms,t,identity())['nodes'],[])
    def test_coordinator_and_modifiers_remain_distinct(self):
        forms=['학생 세 명과 교사 두 명이 왔다.','그중 네 명이 말했다.']
        t={'unit':1,'start':0,'end':2,'observed':True};r=v3.infer(forms,t,identity())
        self.assertEqual(r['status'],'HOLD_UNRESOLVED_COORDINATED_UNION_ONLY')
        self.assertEqual(r['source_admission']['status'],'VERIFIED_TYPED_SOURCE_GRAPH_ONLY')
    def test_particle_bypass_remains_hold(self):
        forms,t=fixture('다섯 명이나 말했다.');self.assertEqual(v3.infer(forms,t,identity())['status'],'HOLD_UNMODELED_TARGET_QUANTITY_BOUNDARY')

if __name__=='__main__':unittest.main()
