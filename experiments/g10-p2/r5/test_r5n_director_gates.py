import copy
import json
from pathlib import Path
import unittest
from r5n_validate_gates import validate

DATA = json.loads((Path(__file__).parent / 'r5n_director_gate_registry.json').read_text())

class DirectorTests(unittest.TestCase):
    def test_live_registry(self): self.assertTrue(validate(DATA))
    def test_schema(self):
        d = copy.deepcopy(DATA); d['schema']='bad'
        with self.assertRaises(ValueError): validate(d)
    def test_missing_gate(self):
        d = copy.deepcopy(DATA); d['gates'].pop()
        with self.assertRaises(ValueError): validate(d)
    def test_duplicate_gate(self):
        d = copy.deepcopy(DATA); d['gates'].append(d['gates'][0])
        with self.assertRaises(ValueError): validate(d)
    def test_bad_state(self):
        d = copy.deepcopy(DATA); d['gates'][0]['status']='DONE_CONFIRMED'
        with self.assertRaises(ValueError): validate(d)
    def test_no_promotion(self):
        d = copy.deepcopy(DATA); d['no_auto_promotion']=False
        with self.assertRaises(ValueError): validate(d)
    def test_human_hold(self):
        d = copy.deepcopy(DATA); d['overall_stage']='G10-P2 VALIDATED'
        with self.assertRaises(ValueError): validate(d)
    def test_call_count(self):
        d = copy.deepcopy(DATA); d['new_provider_calls']=3
        with self.assertRaises(ValueError): validate(d)
    def test_quality_dependency(self):
        d = copy.deepcopy(DATA); d['dependencies']['quality_claim'].remove('G4-EDITORIAL')
        with self.assertRaises(ValueError): validate(d)

if __name__=='__main__': unittest.main()
