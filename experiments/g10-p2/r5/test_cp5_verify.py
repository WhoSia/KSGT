import gzip
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from cp5_verify import verify, parse_manifest, CP5Error


class Tests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name)
        rows = [json.dumps({'i': i, 'marker_count': i % 2}).encode() + b'\n' for i in range(6)]
        archive = gzip.compress(b''.join(rows), mtime=0)
        # Ensure ten meaningful fragments with a short compressed payload.
        k, r = divmod(len(archive), 10)
        splits = [archive[i*k + min(i,r):(i+1)*k+min(i+1,r)] for i in range(10)]
        self.manifest = {'schema': 'ksgt.g9.p45.cp5.document-stats-multipart.v1',
            'representation': 'byte exact parts', 'source_table_file': 'g9_p45_nikl_document_sufficient_stats_cp5.jsonl.gz',
            'source_table_bytes': len(archive), 'source_table_sha256': hashlib.sha256(archive).hexdigest(),
            'document_rows': len(rows), 'raw_text_present': False, 'parts': []}
        for i, b in enumerate(splits, 1):
            name = f'g9_p45_nikl_document_sufficient_stats_cp5.gz.part-{i:02d}'
            (self.path / name).write_bytes(b)
            self.manifest['parts'].append({'file_name': name, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'sequence': i})
        self.manifest_path = self.path / 'manifest.json'
        self.save()

    def tearDown(self):
        self.tmp.cleanup()

    def save(self):
        self.manifest_path.write_text(json.dumps(self.manifest), encoding='utf-8')

    def test_hash(self):
        self.assertEqual(verify(self.manifest_path, self.path)['stage'], 'CP5_JOINED_BYTES_VERIFIED')

    def test_rows(self):
        self.assertEqual(verify(self.manifest_path, self.path, True)['parsed_rows'], 6)

    def test_missing(self):
        (self.path / self.manifest['parts'][0]['file_name']).unlink()
        with self.assertRaisesRegex(CP5Error, 'MISSING_OR_UNSAFE_PART'):
            verify(self.manifest_path, self.path)

    def test_tamper(self):
        p = self.path / self.manifest['parts'][0]['file_name']
        b = bytearray(p.read_bytes()); b[0] ^= 1; p.write_bytes(b)
        with self.assertRaisesRegex(CP5Error, 'PART_HASH_OR_SIZE_MISMATCH'):
            verify(self.manifest_path, self.path)

    def test_order(self):
        self.manifest['parts'][1]['sequence'] = 9; self.save()
        with self.assertRaisesRegex(CP5Error, 'INVALID_PART_METADATA'):
            parse_manifest(self.manifest_path)

    def test_path_escape(self):
        self.manifest['parts'][0]['file_name'] = '../part-01'; self.save()
        with self.assertRaisesRegex(CP5Error, 'INVALID_PART_NAME'):
            parse_manifest(self.manifest_path)

    def test_declared_size(self):
        self.manifest['source_table_bytes'] += 1; self.save()
        with self.assertRaisesRegex(CP5Error, 'SUM_OF_PART_SIZES_MISMATCH'):
            parse_manifest(self.manifest_path)

    def test_expected_rows(self):
        self.manifest['document_rows'] = 7; self.save()
        with self.assertRaisesRegex(CP5Error, 'RECORDED_ROW_COUNT_MISMATCH'):
            verify(self.manifest_path, self.path, True)

    def test_joined_hash(self):
        self.manifest['source_table_sha256'] = '0'*64; self.save()
        with self.assertRaisesRegex(CP5Error, 'JOINED_GZIP_SHA_MISMATCH'):
            verify(self.manifest_path, self.path)


if __name__ == '__main__':
    unittest.main()
