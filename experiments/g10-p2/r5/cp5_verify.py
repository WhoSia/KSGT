#!/usr/bin/env python3
"""Read-only, bounded-memory CP5 multipart verification. Original NIKL bytes never exported."""
import argparse
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys

SCHEMA = 'ksgt.g9.p45.cp5.document-stats-multipart.v1'
HEX64 = re.compile(r'^[0-9a-f]{64}$')
BLOCK = 1024 * 1024
MAX_JSONL_LINE_BYTES = 64 * 1024 * 1024


class CP5Error(Exception):
    pass


def sha_stream(fileobj):
    digest, total = hashlib.sha256(), 0
    while True:
        block = fileobj.read(BLOCK)
        if not block:
            break
        total += len(block)
        digest.update(block)
    return total, digest.hexdigest()


def parse_manifest(manifest):
    data = json.loads(Path(manifest).read_bytes())
    if not isinstance(data, dict) or data.get('schema') != SCHEMA:
        raise CP5Error('SCHEMA_MISMATCH')
    parts = data.get('parts')
    if not isinstance(parts, list) or len(parts) != 10:
        raise CP5Error('EXPECTED_TEN_PARTS')
    if data.get('raw_text_present') is not False:
        raise CP5Error('NOT_A_STATISTICS_ONLY_MANIFEST')
    if data.get('source_table_file') != 'g9_p45_nikl_document_sufficient_stats_cp5.jsonl.gz':
        raise CP5Error('SOURCE_NAME_MISMATCH')
    if type(data.get('source_table_bytes')) is not int or data['source_table_bytes'] <= 0 or not HEX64.fullmatch(str(data.get('source_table_sha256', ''))):
        raise CP5Error('INVALID_SOURCE_CHECKSUM')
    if type(data.get('document_rows')) is not int or data['document_rows'] < 1:
        raise CP5Error('INVALID_ROW_COUNT')
    names = set()
    for i, p in enumerate(parts, 1):
        if not isinstance(p, dict) or p.get('sequence') != i or type(p.get('bytes')) is not int or p['bytes'] <= 0 or not HEX64.fullmatch(str(p.get('sha256', ''))):
            raise CP5Error(f'INVALID_PART_METADATA:{i}')
        name = p.get('file_name')
        if not isinstance(name, str) or Path(name).name != name or '/' in name or '\\' in name or name in names or not name.endswith(f'.part-{i:02d}'):
            raise CP5Error(f'INVALID_PART_NAME:{i}')
        names.add(name)
    if sum(p['bytes'] for p in parts) != data['source_table_bytes']:
        raise CP5Error('SUM_OF_PART_SIZES_MISMATCH')
    return data


class ChainedReader(io.RawIOBase):
    """Consecutively stream verified fragments; no joined gzip artifact on disk."""
    def __init__(self, paths):
        self.paths = iter(paths)
        self.handle = None

    def readable(self):
        return True

    def readinto(self, dst):
        view = memoryview(dst)
        while True:
            if self.handle is None:
                try:
                    self.handle = open(next(self.paths), 'rb')
                except StopIteration:
                    return 0
            n = self.handle.readinto(view)
            if n:
                return n
            self.handle.close()
            self.handle = None

    def close(self):
        if self.handle:
            self.handle.close()
        super().close()


def verify(manifest_path, parts_dir, with_rows=False):
    manifest = parse_manifest(manifest_path)
    root = Path(parts_dir).resolve(strict=True)
    actual = []
    checksum = hashlib.sha256()
    combined_size = 0
    for p in manifest['parts']:
        path = root / p['file_name']
        if not path.is_file() or path.is_symlink() or path.resolve().parent != root:
            raise CP5Error('MISSING_OR_UNSAFE_PART:' + p['file_name'])
        h = hashlib.sha256()
        total = 0
        with path.open('rb') as f:
            while block := f.read(BLOCK):
                total += len(block)
                h.update(block)
                checksum.update(block)
        if total != p['bytes'] or h.hexdigest() != p['sha256']:
            raise CP5Error('PART_HASH_OR_SIZE_MISMATCH:' + p['file_name'])
        actual.append({'name': p['file_name'], 'bytes': total, 'sha256': h.hexdigest(), 'status': 'VERIFIED'})
        combined_size += total
    if combined_size != manifest['source_table_bytes'] or checksum.hexdigest() != manifest['source_table_sha256']:
        raise CP5Error('JOINED_GZIP_SHA_MISMATCH')
    receipt = {'schema': 'ksgt.g10.p2.cp5.verification-receipt.v1',
               'stage': 'CP5_JOINED_BYTES_VERIFIED',
               'source_table_bytes': combined_size,
               'source_table_sha256': checksum.hexdigest(),
               'parts': actual,
               'claimed_rows': manifest['document_rows'],
               'parsed_rows': None,
               'raw_text_present_manifest_claim': False,
               'quality_gold': False}
    if with_rows:
        count = 0
        paths = [root / p['file_name'] for p in manifest['parts']]
        # gzip.GzipFile reads via buffer; compressed bytes remain original, no export.
        with ChainedReader(paths) as source, gzip.GzipFile(fileobj=io.BufferedReader(source, buffer_size=BLOCK)) as decoded:
            while line := decoded.readline(MAX_JSONL_LINE_BYTES + 1):
                if len(line) > MAX_JSONL_LINE_BYTES:
                    raise CP5Error('OVERSIZED_JSONL_LINE:' + str(count + 1))
                if not line.strip():
                    raise CP5Error('EMPTY_JSONL_LINE:' + str(count + 1))
                row = json.loads(line)
                if not isinstance(row, dict):
                    raise CP5Error('NON_OBJECT_ROW:' + str(count + 1))
                count += 1
        if count != manifest['document_rows']:
            raise CP5Error(f'RECORDED_ROW_COUNT_MISMATCH:{count}')
        receipt.update(stage='CP5_JSONL_ROWS_VERIFIED', parsed_rows=count)
    return receipt


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--manifest', required=True)
    ap.add_argument('--parts-dir', required=True)
    ap.add_argument('--rows', action='store_true', help='After hashing, decompress all JSONL rows (no raw text output)')
    ap.add_argument('--receipt', help='Write JSON receipt to a distinct path after a complete PASS')
    args = ap.parse_args()
    try:
        result = verify(args.manifest, args.parts_dir, args.rows)
        if args.receipt:
            dst = Path(args.receipt).resolve()
            if dst.exists() or dst == Path(args.manifest).resolve() or dst.is_relative_to(Path(args.parts_dir).resolve()):
                raise CP5Error('RECEIPT_PATH_MUST_BE_NEW_AND_OUTSIDE_PARTS_DIRECTORY')
            with dst.open('x', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
        print(json.dumps(result, ensure_ascii=False))
    except (CP5Error, OSError, ValueError, json.JSONDecodeError, EOFError) as e:
        print(json.dumps({'stage': 'FAIL_NO_APPROVAL', 'reason': str(e)}), file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
