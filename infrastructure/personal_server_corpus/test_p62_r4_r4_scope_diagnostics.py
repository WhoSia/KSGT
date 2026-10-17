"""Original authored quote/quantity countermodels, not licensed examples."""
import unittest
from p62_r4_r3_source_witness import strict
from p62_r4_r4_scope_diagnostics import infer

class ScopeDiagnosticsTests(unittest.TestCase):
    def fixture(self,text):
        forms=[text];a=text.index('그중');t={'unit':0,'start':a,'end':a+2,'observed':True}
        i={'strict_structure':strict(forms),'member_key':'b'*64,'archive_sha256':'c'*64,'document_ordinal':0}
        return infer(forms,t,i)
    def test_invalid_quote_masked_by_quantity_guard(self):
        r=self.fixture('” 1명과 1명이 왔다. 그중 2명이 이동했다.')
        self.assertTrue(r['masked_quotation_hold']);self.assertEqual(r['causal_status'],'HOLD_INVALID_QUOTE_SCOPE')
        self.assertEqual(r['frozen_v3_status'],'HOLD_UNMODELED_TARGET_QUANTITY_BOUNDARY');self.assertIsNone(r['selected'])
    def test_valid_quote_not_masked(self):
        r=self.fixture('“1명과 1명이 왔다.” 그중 2명이 이동했다.')
        self.assertFalse(r['masked_quotation_hold']);self.assertIsNone(r['human_ground_truth'])
if __name__=='__main__':unittest.main()
