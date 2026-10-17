"""Authored synthetic source-custody falsifiers; never Korean semantic labels."""
import unittest
from p62_r4_r3_source_witness import classify,extend,strict,historical_forms
class SourceWitnessTests(unittest.TestCase):
    def test_eighty_character_passage_has_stride_forty_anchor(self):
        shared=''.join(chr(0x400+i) for i in range(80));b='y'*39+shared+'z'*20
        for offset in range(80):
            a='x'*offset+shared+'q'*40;found=False
            for i in range(0,len(a)-39,40):
                j=b.find(a[i:i+40])
                if j>=0 and extend(a,b,i,j,40)['characters']>=80:found=True;break
            self.assertTrue(found)
    def test_exact_structure(self):self.assertEqual(classify(['abc'],['abc']),'EXACT_STRUCTURE')
    def test_ordered_subset(self):self.assertEqual(classify(['a','b','c'],['b','c']),'EXACT_CONTIGUOUS_UNIT_SUBSET')
    def test_not_reordered_subset(self):self.assertEqual(classify(['a','b','c'],['c','b']),'UNRESOLVED_SOURCE_RELATION')
    def test_resegmentation(self):self.assertEqual(classify(['ab','cd'],['a','bcd']),'EXACT_CODEPOINT_RESEGMENTATION')
    def test_normalized_only(self):self.assertEqual(classify(['a b'],['ab']),'NORMALIZED_ONLY')
    def test_cross_unit_passage(self):
        x='abcdefghij'*10;a=['left'+x[:30],x[30:]+'tail'];b=['other'+x+'end'];p=extend(''.join(a),''.join(b),4,5,40)
        self.assertEqual(classify(a,b,p),'VERIFIED_SHARED_LONG_PASSAGE');self.assertGreaterEqual(p['characters'],100)
    def test_anchor_without_eighty_characters_is_not_evidence(self):
        a,b='a'*40+'x','a'*40+'y';p=extend(a,b,0,0,40)
        with self.assertRaises(ValueError):classify([a],[b],p)
    def test_self_attestation_does_not_verify_passage(self):
        with self.assertRaises(ValueError):classify(['a'*100],['b'*100],{'left_start':0,'right_start':0,'characters':100,'sha256':'0'*64,'witness_verified':True})
    def test_invalid_source_units(self):
        for x in [[],['a',None],'abc']:
            with self.assertRaises(ValueError):strict(x)
    def test_bad_span(self):
        with self.assertRaises(ValueError):extend('ab','ab',-1,0,2)
    def test_domain_structure_boundaries_preserved(self):self.assertNotEqual(strict(['ab','c']),strict(['a','bc']))
    def test_metadata_has_no_authority(self):self.assertEqual(classify(['first'],['second']),'UNRESOLVED_SOURCE_RELATION')
    def test_sentence_only_historical_schema(self):self.assertEqual(historical_forms({'sentence':[{'form':'authored','original_form':'original'}]}),[('sentence.form',['authored']),('sentence.original_form',['original'])])
    def test_missing_prose_fails_closed(self):
        with self.assertRaises(ValueError):historical_forms({'metadata':{'title':'not prose'}})
    def test_invalid_original_field_refused(self):
        with self.assertRaises(ValueError):historical_forms({'sentence':[{'form':42}]})
if __name__=='__main__':unittest.main()
