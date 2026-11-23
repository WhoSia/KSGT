import copy,json,unittest
from pathlib import Path
from r5t_lira_multiaxis import judge,sensitivity,CourtError
from r5t_evaluation_contract import validate,EvaluationError
P=Path(__file__).parent
D=json.loads((P/'r5t_decisions.json').read_text())
L=(P/'r5t_lira_lines.md').read_text()
class Court(unittest.TestCase):
 def test_lines_scored(self):self.assertEqual(judge(D,L)['lines'],14)
 def test_sensitivity(self):self.assertEqual(sensitivity(D,L)['scenarios'],len(D['decisions'])*7*4)
 def test_unscored(self):
  with self.assertRaisesRegex(CourtError,'UNSCORED'):judge(D,L+'no score')
 def test_forged_gold(self):
  d=copy.deepcopy(D);d['verified_human_outcomes']=2
  with self.assertRaisesRegex(CourtError,'PROMOTION'):judge(d,L)
 def test_forged_bytes(self):
  d=copy.deepcopy(D);d['real_nikl24_raw_acquired']=True
  with self.assertRaisesRegex(CourtError,'RAW_BYTES'):judge(d,L)
 def test_missing_dimension(self):
  d=copy.deepcopy(D);d['decisions'][0]['utility'].pop('reversibility')
  with self.assertRaisesRegex(CourtError,'UTILITY'):judge(d,L)
 def test_unsupported_source(self):
  d=copy.deepcopy(D);d['decisions'][0]['source_ids']=['IMAGINARY']
  with self.assertRaisesRegex(CourtError,'UNSUPPORTED'):judge(d,L)
 def test_blocked_cannot_win(self):
  d=copy.deepcopy(D);x=d['decisions'][-1]
  x['utility']={k:1.0 for k in x['utility']}
  self.assertNotEqual(judge(d,L)['top_executable'],x['id'])
 def test_evidence_not_priority(self):
  r=judge(D,L)['decisions']
  self.assertNotEqual(r[0]['priority'],r[0]['evidence_support'])
 def test_boolean_score(self):
  d=copy.deepcopy(D);d['decisions'][0]['utility']['cost_efficiency']=True
  with self.assertRaisesRegex(CourtError,'INVALID_0_TO_1'):judge(d,L)
 def test_uncertainty_range(self):
  for d in judge(D,L)['decisions']:
   self.assertLessEqual(d['judgment_interval'][0],d['priority'])
   self.assertGreaterEqual(d['judgment_interval'][1],d['priority'])
 def test_six_dimensions_seven(self):
  self.assertEqual(len(D['decisions']),6)
  self.assertEqual(len(D['decisions'][0]['utility']),7)
 def test_no_quality_promotion(self):self.assertFalse(judge(D,L)['quality_promotion'])
 def test_line_reference_missing(self):
  with self.assertRaisesRegex(CourtError,'UNKNOWN_SOURCE'):judge(D,L.replace('[R3]','[INVENTED]'))

class Evaluators(unittest.TestCase):
 R={'work_token':'w','blind_label':'X1','assessor_token':'r','role':'READER','usefulness':4,'naturalness':3}
 A={'work_token':'w','blind_label':'X1','assessor_token':'a','role':'SOURCE_AUDITOR','fidelity_error':'UNCERTAIN'}
 def test_valid_shape(self):self.assertEqual(validate([self.R,self.A])['schema_valid_counts']['READER'],1)
 def test_no_verified_humans(self):self.assertFalse(validate([self.R])['independently_verified_human_outcomes'])
 def test_role_overlap(self):
  a=self.A.copy();a['assessor_token']='r'
  with self.assertRaisesRegex(EvaluationError,'OVERLAP'):validate([self.R,a])
 def test_unblinded(self):
  r=self.R.copy();r['blind_label']='STRONG_DIRECT'
  with self.assertRaisesRegex(EvaluationError,'UNBLINDED'):validate([r])
 def test_boolean_score(self):
  r=self.R.copy();r['usefulness']=True
  with self.assertRaisesRegex(EvaluationError,'BAD_READER_SCORE'):validate([r])
 def test_missing_witness(self):
  a=self.A.copy();a['fidelity_error']='YES'
  with self.assertRaisesRegex(EvaluationError,'MISSING_SPAN'):validate([a])
 def test_no_source_text(self):
  a=self.A.copy();a['source_text']='private'
  with self.assertRaisesRegex(EvaluationError,'LEAK'):validate([a])
 def test_duplicate(self):
  with self.assertRaisesRegex(EvaluationError,'DUPLICATE'):validate([self.R,self.R])
 def test_rating_fidelity_separation(self):
  r=self.R.copy();r['fidelity_error']='YES'
  with self.assertRaisesRegex(EvaluationError,'ROLE_CROSSOVER'):validate([r])
 def test_bad_source(self):
  a=self.A.copy();a['fidelity_error']='MAYBE'
  with self.assertRaisesRegex(EvaluationError,'BAD_FIDELITY'):validate([a])

if __name__=='__main__':unittest.main()
