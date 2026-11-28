import itertools
import json
import unittest
from r5s_blind_commitment import (ARMS, LABELS, CommitmentError, audit_public_packet,
    keyed_commitment, old_public_digest, recover_legacy_mapping, verify_keyed)

MAP = dict(zip(LABELS, reversed(ARMS)))
SECRET = bytes.fromhex('d1'*32)  # synthetic-only; NEVER use this key for an actual experiment.
CTX = 'synthetic-work-01'

class R5sTests(unittest.TestCase):
    def test_old_bruteforce_recovers_private_mapping(self):
        self.assertEqual(recover_legacy_mapping(old_public_digest(MAP)), MAP)
    def test_entire_old_space_only_5040(self):
        self.assertEqual(len(list(itertools.permutations(ARMS))), 5040)
    def test_old_packet_rejected(self):
        with self.assertRaisesRegex(CommitmentError, 'PUBLIC_LOW_ENTROPY_COMMITMENT'):
            audit_public_packet({'blind_packet':[{'blind_display_labels':list(LABELS),'assignment_commitment':old_public_digest(MAP)}]})
    def test_new_packet_passes_without_commitment(self):
        out=audit_public_packet({'blind_packet':[{'blind_display_labels':list(LABELS)}]})
        self.assertFalse(out['human_study_authorized'])
    def test_secret_leak_rejected(self):
        with self.assertRaisesRegex(CommitmentError, 'SECRET_IN_PUBLIC_PACKET'):
            audit_public_packet({'blind_packet':[{'blind_display_labels':list(LABELS),'secret':'oops'}]})
    def test_incomplete_labels_rejected(self):
        with self.assertRaisesRegex(CommitmentError, 'INVALID_PUBLIC_LABELS'):
            audit_public_packet({'blind_packet':[{'blind_display_labels':['X1']} ]})
    def test_keyed_commitment_matches(self):
        digest=keyed_commitment(MAP,SECRET,CTX)
        self.assertTrue(verify_keyed(MAP,SECRET,CTX,digest))
    def test_mapping_tamper_detected(self):
        altered=MAP.copy();altered['X1'],altered['X2']=altered['X2'],altered['X1']
        self.assertFalse(verify_keyed(altered,SECRET,CTX,keyed_commitment(MAP,SECRET,CTX)))
    def test_context_replay_detected(self):
        self.assertFalse(verify_keyed(MAP,SECRET,'different-work',keyed_commitment(MAP,SECRET,CTX)))
    def test_different_secret_detected(self):
        self.assertFalse(verify_keyed(MAP,b'e'*32,CTX,keyed_commitment(MAP,SECRET,CTX)))
    def test_short_secret_rejected(self):
        with self.assertRaisesRegex(CommitmentError,'SECRET_TOO_SHORT'):
            keyed_commitment(MAP,b'weak',CTX)
    def test_wrong_bijection_rejected(self):
        duplicate=MAP.copy();duplicate['X1']=duplicate['X2']
        with self.assertRaisesRegex(CommitmentError,'INVALID_BIJECTION'):
            keyed_commitment(duplicate,SECRET,CTX)
    def test_invalid_expected_rejected(self):
        with self.assertRaisesRegex(CommitmentError,'INVALID_EXPECTED'):
            verify_keyed(MAP,SECRET,CTX,'not-a-digest')
    def test_empty_context_rejected(self):
        with self.assertRaisesRegex(CommitmentError,'INVALID_CONTEXT'):
            keyed_commitment(MAP,SECRET,'')
    def test_no_key_in_public_receipt(self):
        out=audit_public_packet({'blind_packet':[{'blind_display_labels':list(LABELS)}]})
        self.assertNotIn(SECRET.hex(),json.dumps(out))

if __name__ == '__main__': unittest.main()
