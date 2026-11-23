import json
import unittest
from pathlib import Path
from r5p_lira_audit import audit_lines
from r5p_lira_counterfactual import counterfactual
P=Path(__file__).parent
DATA=json.loads((P/'r5p_lira_decisions.json').read_text())
REPORT=(P/'r5p_lira_line_audit.md').read_text()
class Tests(unittest.TestCase):
    def test_count(self):self.assertEqual(counterfactual(REPORT,DATA)['scenario_count'],120)
    def test_rank_flip(self):self.assertEqual(counterfactual(REPORT,DATA)['leader_changes'],10)
    def test_d1_feasibility_flip(self):
        x=counterfactual(REPORT,DATA)['lead_change_cases']
        self.assertTrue(any(r['candidate']=='D1-NIKL24-ACCESS' and r['dimension']=='feasibility' and r['delta']==.1 for r in x))
    def test_all_supplement_lines_scored(self):
        x=(P/'r5p_lira_counterfactual_lines.md').read_text()
        self.assertEqual(len(audit_lines(x,set(DATA['sources']))),5)
if __name__=='__main__':unittest.main()
