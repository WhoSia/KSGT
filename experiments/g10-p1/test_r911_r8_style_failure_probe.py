import unittest
from r911_r8_style_failure_probe import analyze_text,paragraphs,probe
class StyleTests(unittest.TestCase):
 def test_paragraphs(self):self.assertEqual(paragraphs('가\n\n나'),['가','나'])
 def test_one_paragraph(self):self.assertEqual(analyze_text('안녕.')['paragraphs'],1)
 def test_meta_marker(self):self.assertEqual(analyze_text('정보가 정확히 보존되어 있습니다.')['surfaceMetaFlags']['source_preservation_meta'],1)
 def test_no_marker(self):self.assertEqual(analyze_text('금요일에 행사가 열립니다.')['surfaceMetaFlags']['source_preservation_meta'],0)
 def test_bad_zip(self):
  from tempfile import TemporaryDirectory
  from pathlib import Path
  with TemporaryDirectory() as d:
   p=Path(d)/'bad.zip';p.write_bytes(b'bad')
   with self.assertRaisesRegex(ValueError,'R8_ZIP_HASH_MISMATCH'):probe(p)
if __name__=='__main__':unittest.main()
