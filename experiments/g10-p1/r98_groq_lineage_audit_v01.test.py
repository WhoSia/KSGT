import unittest
from r98_groq_lineage_audit_v01 import audit,load,usage
class GroqLineageTests(unittest.TestCase):
 def test_invalid_total(self):
  with self.assertRaisesRegex(ValueError,'TOKEN_INCONSISTENCY'):usage({'prompt_tokens':2,'completion_tokens':3,'total_tokens':6})
 def test_negative_reasoning(self):
  with self.assertRaisesRegex(ValueError,'REASONING_INCONSISTENCY'):usage({'prompt_tokens':2,'completion_tokens':3,'total_tokens':5,'completion_tokens_details':{'reasoning_tokens':-1}})
 def test_excess_reasoning(self):
  with self.assertRaisesRegex(ValueError,'REASONING_INCONSISTENCY'):usage({'prompt_tokens':2,'completion_tokens':3,'total_tokens':5,'completion_tokens_details':{'reasoning_tokens':4}})
 def test_usage_ok(self):
  self.assertEqual(usage({'prompt_tokens':2,'completion_tokens':3,'total_tokens':5}),(2,3,5,0))
 def test_missing_usage(self):
  with self.assertRaisesRegex(ValueError,'USAGE_REQUIRED'):usage(None)
 def test_hash_mismatch_blocks_untrusted_zip(self):
  from tempfile import TemporaryDirectory
  from pathlib import Path
  with TemporaryDirectory() as d:
   p=Path(d)/'fake.zip';p.write_bytes(b'not the sealed original')
   with self.assertRaisesRegex(ValueError,'ZIP_HASH_MISMATCH'):load('R8',p)
 def test_all_keys_present(self):
  self.assertEqual(set(('R5','R6','R7','R8')),set(__import__('r98_groq_lineage_audit_v01').EXPECTED))
if __name__=='__main__':unittest.main()
