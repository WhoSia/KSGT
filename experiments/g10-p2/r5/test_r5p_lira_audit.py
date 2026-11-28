import copy
import json
import unittest
from pathlib import Path
from r5p_lira_audit import audit_lines,evaluate,AuditError
ROOT=Path(__file__).parent
TEXT=(ROOT/'r5p_lira_line_audit.md').read_text(encoding='utf-8')
DATA=json.loads((ROOT/'r5p_lira_decisions.json').read_text(encoding='utf-8'))
class Tests(unittest.TestCase):
    def test_real_24_lines(self):self.assertEqual(evaluate(TEXT,DATA)['lines_audited'],24)
    def test_non_scored_rejected(self):
        with self.assertRaisesRegex(AuditError,'UNSCORED'):evaluate(TEXT+'Bad new sentence',DATA)
    def test_blank_line_rejected(self):
        with self.assertRaisesRegex(AuditError,'UNSCORED'):evaluate(TEXT+'\n',DATA)
    def test_line_order_rejected(self):
        with self.assertRaisesRegex(AuditError,'MISNUMBERED'):evaluate(TEXT.replace('L005','L004',1),DATA)
    def test_unknown_source_rejected(self):
        with self.assertRaisesRegex(AuditError,'UNREGISTERED'):evaluate(TEXT.replace('[S1]','[FAKE]',1),DATA)
    def test_low_evidence_fact_rejected(self):
        with self.assertRaisesRegex(AuditError,'FACT_WITH_LOW'):evaluate(TEXT.replace('E=0.95','E=0.20',1),DATA)
    def test_quality_stage_hold(self):
        d=copy.deepcopy(DATA);d['overall_stage']='G10-P2 PASS'
        with self.assertRaisesRegex(AuditError,'QUALITY_STAGE'):evaluate(TEXT,d)
    def test_human_forgery(self):
        d=copy.deepcopy(DATA);d['independent_reader_outcomes']=1
        with self.assertRaisesRegex(AuditError,'HUMAN_COUNT'):evaluate(TEXT,d)
    def test_unregistered_decision_source(self):
        d=copy.deepcopy(DATA);d['decisions'][0]['source_ids']=['INVENTED']
        with self.assertRaisesRegex(AuditError,'UNREGISTERED_DECISION'):evaluate(TEXT,d)
    def test_falsely_executable(self):
        d=copy.deepcopy(DATA);d['decisions'][0]['can_execute_now']=False
        with self.assertRaisesRegex(AuditError,'FALSELY_EXECUTABLE'):evaluate(TEXT,d)
    def test_boolean_score_invalid(self):
        d=copy.deepcopy(DATA);d['decisions'][0]['scores']['info']=True
        with self.assertRaisesRegex(AuditError,'INVALID_SCORE'):evaluate(TEXT,d)
    def test_priority_order(self):
        out=evaluate(TEXT,DATA);self.assertEqual(out['decisions'][0]['id'],'D2-BLIND-EVAL-PREREG')
    def test_source_removal_rejected(self):
        d=copy.deepcopy(DATA);d['sources'].pop('S1')
        with self.assertRaisesRegex(AuditError,'UNREGISTERED'):evaluate(TEXT,d)
if __name__=='__main__':unittest.main()
