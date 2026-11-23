import copy
import json
import re
import unittest
from pathlib import Path
ROOT = Path(__file__).parent

def validate_gate(d):
    if d['application_status'] != 'SUBMITTED_USER_ATTESTED':
        raise ValueError('APPLICATION_PROVENANCE')
    required = ['archive_acquired','archive_sha256_verified','license_fulltext_inspected','actual_schema_verified','human_native_before_after_pair_verified','work_lineage_verified','source_work_disjoint_verified']
    if any(d[k] is not False for k in required):
        raise ValueError('UNSUPPORTED_PROMOTION')
    if d['overall_stage'] != 'G10-P2 OPEN / QUALITY_HOLD' or d['independent_reader_outcomes'] != 0 or d['promote_on_application'] is not False:
        raise ValueError('QUALITY_STAGE')
    return True

class GateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = json.loads((ROOT/'r5q_application_gate.json').read_text())
        cls.lines = (ROOT/'r5q_lira_lines.md').read_text().splitlines()
        cls.decisions = json.loads((ROOT/'r5q_director_decisions.json').read_text())
    def test_current_gate(self): self.assertTrue(validate_gate(self.d))
    def test_no_premature_archive_claim(self):
        x = copy.deepcopy(self.d); x['archive_acquired'] = True
        with self.assertRaisesRegex(ValueError, 'UNSUPPORTED_PROMOTION'):validate_gate(x)
    def test_no_premature_gold_claim(self):
        x = copy.deepcopy(self.d); x['human_native_before_after_pair_verified'] = True
        with self.assertRaisesRegex(ValueError, 'UNSUPPORTED_PROMOTION'):validate_gate(x)
    def test_no_quality_promotion(self):
        x = copy.deepcopy(self.d); x['overall_stage'] = 'G10-P2 VALIDATED'
        with self.assertRaisesRegex(ValueError, 'QUALITY_STAGE'):validate_gate(x)
    def test_application_approved_not_confused(self):
        x = copy.deepcopy(self.d); x['application_status'] = 'DOWNLOAD_APPROVED'
        with self.assertRaisesRegex(ValueError, 'APPLICATION_PROVENANCE'):validate_gate(x)
    def test_line_scores_all(self):
        self.assertEqual(len(self.lines), 16)
        pattern = re.compile(r'L\d{3} \| E=(?:0\.\d{2}|1\.00) \| P=(?:0\.\d{2}|1\.00) \| (?:FACT|INFER|PLAN|HOLD) \| \[[^]]+\] \| .+')
        for i,line in enumerate(self.lines,1):
            self.assertTrue(pattern.fullmatch(line))
            self.assertTrue(line.startswith(f'L{i:03d} |'))
    def test_lira_recompute(self):
        w={'gate':.30,'quality':.30,'info':.20,'feasibility':.15,'cost':.05}
        def score(p):return round(sum(w[k]*(1-v if k=='cost' else v) for k,v in p.items() if k in w),4)
        d=self.decisions
        self.assertAlmostEqual(score(d['base']),.9090)
        self.assertAlmostEqual(score(d['updated']),.9195)
        self.assertAlmostEqual(score(d['comparison']),.9230)
        self.assertEqual(d['decision'],'D1_AND_D2_JOINT_P0')

if __name__ == '__main__': unittest.main()
