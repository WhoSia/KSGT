import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile, ZipInfo
from unittest.mock import patch
from r5q_nikl24_intake import inspect_archive, IntakeError


class TestNikl24Intake(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.path = self.root / 'test.zip'

    def tearDown(self):
        self.tmp.cleanup()

    def archive(self, entries):
        with ZipFile(self.path, 'w') as z:
            for name, content in entries:
                z.writestr(name, content)

    def test_ok_metadata_only(self):
        self.archive([('docs/a.json', '{"private": "confidential"}')])
        d = inspect_archive(self.path)
        self.assertEqual(d['member_count'], 1)
        self.assertFalse(d['raw_text_exported'])
        self.assertNotIn('confidential', str(d))
        self.assertFalse(d['actual_editorial_pair_schema_verified'])

    def test_zip_crc_mismatch(self):
        self.archive([('a.txt', b'abcXYZ')])
        x = bytearray(self.path.read_bytes())
        at = x.find(b'abcXYZ')
        self.assertGreater(at, 0)
        x[at] ^= 1
        self.path.write_bytes(x)
        with self.assertRaisesRegex(IntakeError, 'ZIP_CRC_MISMATCH'):
            inspect_archive(self.path)

    def test_path_traversal(self):
        self.archive([('../leak.txt', 'x')])
        with self.assertRaisesRegex(IntakeError, 'UNSAFE_MEMBER_PATH'):
            inspect_archive(self.path)

    def test_backslash_traversal(self):
        self.archive([('..\\leak.txt', 'x')])
        with self.assertRaisesRegex(IntakeError, 'UNSAFE_MEMBER_PATH'):
            inspect_archive(self.path)

    def test_absolute_path(self):
        self.archive([('/tmp/leak.txt', 'x')])
        with self.assertRaisesRegex(IntakeError, 'UNSAFE_MEMBER_PATH'):
            inspect_archive(self.path)

    def test_duplicate(self):
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            self.archive([('a.txt', 'one'), ('a.txt', 'two')])
        with self.assertRaisesRegex(IntakeError, 'DUPLICATE_MEMBER_NAME'):
            inspect_archive(self.path)

    def test_too_many_entries(self):
        self.archive([('a.txt', 'x'), ('b.txt', 'y')])
        with patch('r5q_nikl24_intake.MAX_MEMBERS', 1):
            with self.assertRaisesRegex(IntakeError, 'MEMBER_COUNT_BOUND'):
                inspect_archive(self.path)

    def test_high_ratio(self):
        self.archive([('a.txt', '123')])
        with patch('nikl24_intake.MAX_RATIO', 0):
            with self.assertRaisesRegex(IntakeError, 'EXCESSIVE_COMPRESSION_RATIO'):
                inspect_archive(self.path)

    def test_missing(self):
        with self.assertRaisesRegex(IntakeError, 'MISSING_OR_SYMLINKED_ARCHIVE'):
            inspect_archive(self.path)

    def test_bad_format(self):
        self.path.write_bytes(b'plain text')
        with self.assertRaisesRegex(IntakeError, 'NOT_A_ZIP_ARCHIVE'):
            inspect_archive(self.path)

    def test_symlinked_archive(self):
        source = self.root / 'original.zip'
        with ZipFile(source, 'w') as z:
            z.writestr('a.txt', 'hello')
        try:
            self.path.symlink_to(source)
        except (OSError, NotImplementedError):
            self.skipTest('symlink not permitted')
        with self.assertRaisesRegex(IntakeError, 'MISSING_OR_SYMLINKED_ARCHIVE'):
            inspect_archive(self.path)

    def test_oversized_member(self):
        self.archive([('a.txt', 'large')])
        with patch('nikl24_intake.MAX_MEMBER_BYTES', 1):
            with self.assertRaisesRegex(IntakeError, 'MEMBER_TOO_LARGE'):
                inspect_archive(self.path)


if __name__ == '__main__':
    unittest.main()
