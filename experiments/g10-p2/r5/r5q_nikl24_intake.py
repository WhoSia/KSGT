#!/usr/bin/env python3
"""NIKL 2024 authorized archive intake: metadata and safety only; no corpus text export.

Does not extract anything. The user must independently ensure legal use and permissions.
Archive file receipt cannot establish editor authority, paragraph pairs, or human quality.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

MAX_MEMBERS = 100000
MAX_MEMBER_BYTES = 2 * 1024**3
MAX_TOTAL_UNCOMPRESSED = 30 * 1024**3
MAX_RATIO = 2500


class IntakeError(ValueError):
    pass


def file_sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def checked_name(name):
    if not name or '\\' in name or name.startswith('/') or '\x00' in name:
        raise IntakeError('UNSAFE_MEMBER_PATH')
    p = PurePosixPath(name)
    if any(part in ('..', '.') for part in name.split('/')) or p.is_absolute():
        raise IntakeError('UNSAFE_MEMBER_PATH')
    if ':' in p.parts[0]:
        raise IntakeError('UNSAFE_MEMBER_PATH')
    return name


def inspect_archive(path):
    path = Path(path)
    if not path.is_file() or path.is_symlink():
        raise IntakeError('MISSING_OR_SYMLINKED_ARCHIVE')
    if not zipfile.is_zipfile(path):
        raise IntakeError('NOT_A_ZIP_ARCHIVE')
    total = 0
    counts = {}
    seen = set()
    with zipfile.ZipFile(path) as z:
        infos = z.infolist()
        if not infos or len(infos) > MAX_MEMBERS:
            raise IntakeError('MEMBER_COUNT_BOUND')
        for inf in infos:
            checked_name(inf.filename)
            if inf.filename in seen:
                raise IntakeError('DUPLICATE_MEMBER_NAME')
            seen.add(inf.filename)
            if inf.flag_bits & 1:
                raise IntakeError('ENCRYPTED_MEMBER')
            mode = (inf.external_attr >> 16) & 0o170000
            if mode == 0o120000:
                raise IntakeError('SYMLINK_MEMBER')
            if inf.file_size > MAX_MEMBER_BYTES:
                raise IntakeError('MEMBER_TOO_LARGE')
            if inf.file_size > MAX_RATIO * max(inf.compress_size, 1):
                raise IntakeError('EXCESSIVE_COMPRESSION_RATIO')
            total += inf.file_size
            if total > MAX_TOTAL_UNCOMPRESSED:
                raise IntakeError('TOTAL_UNCOMPRESSED_LIMIT')
            suffix = PurePosixPath(inf.filename.rstrip('/')).suffix.lower() or '[none]'
            counts[suffix] = counts.get(suffix, 0) + 1
        # This reads/decompresses every entry to validate CRC; no content is returned.
        if z.testzip() is not None:
            raise IntakeError('ZIP_CRC_MISMATCH')
    return {
        'schema': 'ksgt.g10p2.r5q.intake-metadata.v1',
        'archive_bytes': path.stat().st_size,
        'archive_sha256': file_sha256(path),
        'archive_format': 'zip',
        'member_count': len(infos),
        'uncompressed_bytes': total,
        'extension_histogram': dict(sorted(counts.items())),
        'crc_all_pass': True,
        'raw_text_exported': False,
        'original_modified': False,
        'actual_editorial_pair_schema_verified': False,
        'work_author_lineage_verified': False,
        'redistribution_rights_verified': False,
        'native_prose_quality_gold': False,
        'stage': 'METADATA_ONLY_PASS_SCHEMA_HOLD'
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', required=True)
    parser.add_argument('--receipt', required=True)
    args = parser.parse_args()
    out = Path(args.receipt)
    if out.exists() or out.resolve() == Path(args.archive).resolve() or out.is_symlink():
        raise IntakeError('RECEIPT_MUST_BE_NEW')
    result = inspect_archive(args.archive)
    with out.open('x', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
