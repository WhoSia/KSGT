import unittest
from pathlib import Path
from r5u_lira_gate import audit_lines,LineHold
TEXT=(Path(__file__).parent/'r5u_lira_lines.md').read_text(encoding='utf-8')
class Tests(unittest.TestCase):
    def test_all_lines(self):self.assertEqual(len(audit_lines(TEXT)),14)
    def test_no_unscored(self):
        with self.assertRaisesRegex(LineHold,'UNSCORED'):audit_lines(TEXT+'unsourced claim')
    def test_missing_source(self):
        with self.assertRaisesRegex(LineHold,'SOURCE_UNVERIFIED'):audit_lines(TEXT.replace('[R1,R2]','[FAKE]',1))
    def test_no_unearned_hold(self):
        with self.assertRaisesRegex(LineHold,'HOLD_NOT_VISIBLE'):audit_lines(TEXT.replace('G4 HOLD다','G4 해제다',1))
if __name__=='__main__':unittest.main()
