"""R5s: audit and repair short-domain blinding commitments. Synthetic preflight only.

A public unkeyed SHA256 of a 7-arm permutation can be recovered by enumerating 7! options.
Public V2 evidence commitment is keyed HMAC with a separately held >=256-bit secret.
Synthetic test fixtures MUST NOT be used for live human-study assignment.
"""
import hashlib
import hmac
import itertools
import json
import re

ARMS = ('STRONG_DIRECT','RICH_PROMPT','STATE_AS_TEXT','EXECUTABLE_STATE',
        'EQUAL_COST_ITERATIVE','NO_OP_KEEP','SHAM_STATE')
LABELS = tuple(f'X{i}' for i in range(1, 8))

class CommitmentError(ValueError):
    pass

def canon(mapping):
    if not isinstance(mapping, dict) or set(mapping) != set(LABELS) or set(mapping.values()) != set(ARMS):
        raise CommitmentError('INVALID_BIJECTION')
    if any(type(k) is not str or type(v) is not str for k, v in mapping.items()):
        raise CommitmentError('INVALID_BIJECTION')
    return json.dumps(mapping, sort_keys=True, ensure_ascii=True, separators=(',', ':')).encode('utf-8')

def old_public_digest(mapping):
    """Legacy R5r exact digest (INSECURE): only for reproducing the failure."""
    return hashlib.sha256(json.dumps(mapping, sort_keys=True).encode()).hexdigest()

def recover_legacy_mapping(digest):
    """Demonstrate exhaustive 7! public-keyless inversion of old commitment."""
    if not isinstance(digest, str) or not re.fullmatch(r'[0-9a-f]{64}', digest):
        raise CommitmentError('INVALID_DIGEST')
    for permutation in itertools.permutations(ARMS):
        mapping = dict(zip(LABELS, permutation))
        if hmac.compare_digest(old_public_digest(mapping), digest):
            return mapping
    raise CommitmentError('LEGACY_DIGEST_NOT_FOUND')

def keyed_commitment(mapping, secret, context):
    """Domain-separated keyed binding, with key kept ONLY in the restricted custodian vault."""
    if type(secret) is not bytes or len(secret) < 32:
        raise CommitmentError('SECRET_TOO_SHORT_OR_INVALID')
    if not isinstance(context, str) or not context.strip() or len(context) > 256:
        raise CommitmentError('INVALID_CONTEXT')
    message = b'KSGT-R5s-BLIND-COMMITMENT-V1\x00' + context.encode('utf-8') + b'\x00' + canon(mapping)
    return hmac.new(secret, message, hashlib.sha256).hexdigest()

def verify_keyed(mapping, secret, context, expected):
    if not isinstance(expected, str) or not re.fullmatch(r'[0-9a-f]{64}', expected):
        raise CommitmentError('INVALID_EXPECTED_DIGEST')
    return hmac.compare_digest(keyed_commitment(mapping, secret, context), expected)

def audit_public_packet(packet):
    """Reject old public brute-force-invertible 7-arm commitments; no private mapping output."""
    if not isinstance(packet, dict) or not isinstance(packet.get('blind_packet'), list):
        raise CommitmentError('INVALID_PACKET')
    count = 0
    for row in packet['blind_packet']:
        if not isinstance(row, dict):
            raise CommitmentError('INVALID_PACKET_ROW')
        if 'assignment_commitment' in row:
            raise CommitmentError('PUBLIC_LOW_ENTROPY_COMMITMENT')
        if set(row.get('blind_display_labels', [])) != set(LABELS):
            raise CommitmentError('INVALID_PUBLIC_LABELS')
        if any(k in row for k in ('arm_to_label', 'label_to_arm', 'private_allocation_seed', 'secret', 'private_key')):
            raise CommitmentError('SECRET_IN_PUBLIC_PACKET')
        count += 1
    return {'schema':'ksgt.g10p2.r5s.blind-public-audit.v1',
            'rows_checked':count, 'legacy_commitment_exposure':False,
            'human_study_authorized':False, 'quality_promotion':False}
