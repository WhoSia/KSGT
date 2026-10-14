"""Original authored fixtures; no human reference annotations."""
import unittest
from p62_r4_r5_role_cues import cue,admitted

class SurfaceCueTests(unittest.TestCase):
 def fixture(self,s):
  a=s.index('세 명');b=s.index('그중')
  return {'unit':0,'start':a,'end':a+3},{'unit':0,'start':b,'end':b+2}
 def test_case_cues_are_not_semantic_roles(self):
  for p,expected in [('이','NOMINATIVE_CUE'),('을','ACCUSATIVE_CUE'),('은','TOPIC_OR_CONTRAST_CUE')]:
   s='학생 세 명'+p+' 왔다. 그중 한 명이 말했다.'
   a,b=self.fixture(s);r=cue([s],a,b)
   self.assertEqual(r['cue_types'],[expected])
   self.assertIsNone(r['semantic_role'])
 def test_quote_scope_held(self):
  s='“학생 세 명이 왔다.” 그중 한 명이 말했다.'
  a,b=self.fixture(s)
  self.assertIn('UNRESOLVED_QUOTATION_ACCESSIBILITY',cue([s],a,b)['uncertainties'])
 def test_future_addition_noninterference(self):
  s='학생 세 명이 왔다. 그중 한 명이 말했다.'
  a,b=self.fixture(s)
  self.assertEqual(cue([s],a,b),cue([s,'미래 문단.'],a,b))
 def test_source_admission_is_separate(self):
  s='학생 세 명이 왔다. 그중 한 명이 말했다.'
  a,b=self.fixture(s);r=cue([s],a,b)
  self.assertEqual(admitted(r,set(),'id')['status'],'HOLD_SOURCE_NOT_IN_ADMITTED_GRAPH')
  self.assertEqual(admitted(r,{'id'},'id')['status'],'SOURCE_SURFACE_CUE_ONLY_NOT_SEMANTIC_ROLE')
 def test_lexical_continuation_not_role(self):
  s='학생 세 명이나 왔다. 그중 한 명이 말했다.'
  a,b=self.fixture(s)
  self.assertIn('AMBIGUOUS_PARTICLE_OR_LEXICAL_CONTINUATION',cue([s],a,b)['uncertainties'])
 def test_boolean_offsets_rejected(self):
  s='학생 세 명이 왔다. 그중 한 명이 말했다.'
  a,b=self.fixture(s);a['start']=True
  with self.assertRaises(ValueError):cue([s],a,b)
if __name__=='__main__':unittest.main()
