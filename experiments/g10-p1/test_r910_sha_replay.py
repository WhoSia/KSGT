"""R9.10 corpus bridge tests.
Synthetic tests run on any machine; original-archive integration requires two env vars.

KSGT_KOLLA_ZIP=/private/path/16908784.zip
KSGT_UD_SNAPSHOT=/private/path/private-ud-dev-test-receipt.json
"""
import copy,json,os,tempfile,unittest
from pathlib import Path
from r910_sha_replay import replay,norm,sha,parse_m2
ZIP=os.environ.get('KSGT_KOLLA_ZIP')
UD=os.environ.get('KSGT_UD_SNAPSHOT')
HAS_ORIGINALS=bool(ZIP and UD and Path(ZIP).is_file() and Path(UD).is_file())

class SyntheticSHAReplayTests(unittest.TestCase):
    def test_normalization_equivalent(self):self.assertEqual(sha(norm('한 국어')),sha(norm('한국어')))
    def test_nfc_equivalent(self):self.assertEqual(norm('가'),norm('가'))
    def test_normalization_preserves_content(self):self.assertNotEqual(sha(norm('가')),sha(norm('나')))
    def test_m2_parsing_rejects_bad_structure(self):
        with self.assertRaisesRegex(ValueError,'UNEXPECTED_M2_RECORD'):parse_m2(b'X invalid\n\n')

@unittest.skipUnless(HAS_ORIGINALS,'ORIGINAL_KOLLA_UD_FILES_NOT_MOUNTED')
class OriginalColdReplayIntegrationTests(unittest.TestCase):
    def test_aggregate_matches_historical_counts(self):
        r=replay(ZIP,UD)
        self.assertEqual((r['candidateUDRows'],r['unique'],r['missing'],r['ambiguous']),(246,180,62,4))
        self.assertEqual(r['sourceM2Blocks'],1418)
    def test_span_and_order_with_tied_numbers_excluded(self):
        r=replay(ZIP,UD)
        self.assertEqual((r['candidateGroupSpans'],r['spansInterleavingCount'],r['withinGroupComparablePairs'],r['withinGroupSequenceInversions'],r['withinGroupSameNumberPairsExcluded']),(59,0,279,0,3))
    def test_original_zip_digest_enforced(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'fake.zip';p.write_bytes(b'fake')
            with self.assertRaisesRegex(ValueError,'UNSEALED_KOLLA_ARCHIVE'):replay(p,UD)
    def test_ud_blob_digest_enforced(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'fake.json';j=json.loads(Path(UD).read_text('utf-8-sig'));j['metadata'][0]['gitBlob']='0'*40;p.write_text(json.dumps(j),encoding='utf8')
            with self.assertRaisesRegex(ValueError,'UNPINNED_UD_BLOB'):replay(ZIP,p)
    def test_duplicate_ud_id_enforced(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'fake.json';j=json.loads(Path(UD).read_text('utf-8-sig'));j['rows'].append(copy.deepcopy(j['rows'][0]));p.write_text(json.dumps(j),encoding='utf8')
            with self.assertRaisesRegex(ValueError,'REPEATED_UD_ID'):replay(ZIP,p)
    def test_does_not_promote_essay_boundaries(self):
        r=replay(ZIP,UD);self.assertFalse(r['originalEssayMapCertified']);self.assertFalse(r['rawLearnerTextPublished'])
if __name__=='__main__':unittest.main()
