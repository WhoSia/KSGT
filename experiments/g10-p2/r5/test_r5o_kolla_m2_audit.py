import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
from r5o_kolla_m2_audit import corrected, parse_m2, inspect

class Tests(unittest.TestCase):
    def test_noop(self):
        self.assertEqual(corrected('가 나', [(-1,-1,'noop','-NONE-')]), '가 나')
    def test_replacement(self):
        self.assertEqual(corrected('가 나', [(1,2,'R:SPELL','다')]), '가 다')
    def test_deletion(self):
        self.assertEqual(corrected('가 나', [(0,1,'U:OTHER','')]), '나')
    def test_insertion(self):
        self.assertEqual(corrected('가 나', [(1,1,'M:OTHER','추가')]), '가 추가 나')
    def test_two_disjoint_edits(self):
        self.assertEqual(corrected('가 나 다 라', [(0,1,'R:SPELL','마'),(3,4,'R:SPELL','바')]), '마 나 다 바')
    def test_duplicate_anchor_quarantined(self):
        with self.assertRaisesRegex(ValueError, 'OVERLAPPING_EDITS'):
            corrected('가 나', [(0,0,'M:PRON','그'),(0,0,'M:SCONJ','그러나')])
    def test_bad_offset_rejected(self):
        with self.assertRaisesRegex(ValueError, 'OFFSET_RANGE'):
            corrected('가 나', [(1,4,'R:SPELL','다')])
    def test_pair_counts(self):
        b=('S 가 나\nA -1 -1|||noop|||-NONE-|||REQUIRED|||-NONE-|||0\nA 1 2|||R:SPELL|||다|||REQUIRED|||-NONE-|||1\n\n').encode()
        x=parse_m2(b)
        self.assertEqual(x['paired']['paired'],1)
        self.assertEqual(x['paired']['annotator_0_keep_only'],1)
    def test_missing_annotator(self):
        b=('S 가\nA -1 -1|||noop|||-NONE-|||REQUIRED|||-NONE-|||0\n\n').encode()
        self.assertEqual(parse_m2(b)['paired']['unpaired_annotator_1_missing'],1)
    def test_bad_schema_rejected(self):
        with self.assertRaisesRegex(ValueError, 'MALFORMED_EDIT_ROW'):
            parse_m2('S 가\nA malformed\n'.encode('utf-8'))
    def test_zip_metadata_does_not_expose_text(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'example.zip'
            with zipfile.ZipFile(p,'w') as z:z.writestr('KoLLA_multi-refs.m2','S 가\nA -1 -1|||noop|||-NONE-|||REQUIRED|||-NONE-|||0\n')
            y=inspect(p)
            self.assertFalse(y['raw_text_exported'])
            self.assertNotIn('가',json.dumps(y,ensure_ascii=False))
            self.assertFalse(y['source_work_disjoint_certified'])

if __name__=='__main__':unittest.main()
