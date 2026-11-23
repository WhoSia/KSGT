import json
from pathlib import Path
import re
import unittest
P=Path(__file__).parent
class Tests(unittest.TestCase):
    def setUp(self):
        self.lines=(P/'R5R_LIRA_LINES.md').read_text(encoding='utf-8').splitlines()
        self.dec=json.loads((P/'R5R_DIRECTOR_DECISIONS.json').read_text())
    def test_every_line_scored(self):
        pattern=re.compile(r'^L(\d{3}) \| E=(0\.\d\d|1\.00) \| P=(0\.\d\d|1\.00) \| (FACT|INFER|PLAN|HOLD) \| \[([^]]+)\] \| (.+)$')
        self.assertEqual(len(self.lines),14)
        for i,line in enumerate(self.lines,1):
            m=pattern.fullmatch(line);self.assertIsNotNone(m)
            self.assertEqual(int(m[1]),i)
            self.assertTrue(set(m[5].split(','))<={'R1','R2'})
    def test_hard_gates_fail_closed(self):
        self.assertEqual(self.dec['stage'],'G10-P2 OPEN / QUALITY_HOLD')
        self.assertEqual(self.dec['independent_human_reader_outcomes'],0)
        self.assertTrue(all(v is False for v in self.dec['hard_gates'].values()))
    def test_no_real_corpus_records(self):
        receipt=json.loads((P/'R5R_SYNTHETIC_PREFLIGHT_RECEIPT.json').read_text())
        self.assertEqual(receipt['stage'],'PREFLIGHT_NOT_FROZEN_NOT_RANDOMIZED_HUMAN_STUDY')
        self.assertFalse(receipt['reader_study_approval'])
        self.assertFalse(receipt['source_work_independence_claim'])
        self.assertEqual(receipt['human_outcomes'],0)
        self.assertEqual(receipt['works'],2)
        self.assertEqual(len(receipt['arms']),7)
        self.assertNotIn('SYN-WORK-01',str(receipt))
        self.assertNotIn('STRONG_DIRECT',str(receipt['blind_packet']))
if __name__=='__main__':unittest.main()
