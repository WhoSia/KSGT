import copy
import unittest
from r5n_source_work_split import allocate, AdmissionError


def row(id_, work, author, **kwargs):
    return {'item_id': id_, 'work_id': work, 'author_id': author, 'rights': 'APPROVED', 'exposed': False,
            'revision_role': 'ORIGINAL', **kwargs}


class SplitTests(unittest.TestCase):
    def test_same_work_remains_one_component(self):
        r = allocate([row('a','W','U'), row('b','W','U', revision_role='EDITED')])
        self.assertEqual(len(r['components']), 1)
        self.assertEqual(r['components'][0]['members'], ['a', 'b'])
    def test_same_author_across_works_stays_together(self):
        r = allocate([row('a','W1','U'), row('b','W2','U')])
        self.assertEqual(len(r['components']), 1)
    def test_explicit_parent_links_versions(self):
        r = allocate([row('a','W1','A'), row('b','W2','B',parent_item_ids=['a'])])
        self.assertEqual(len(r['components']), 1)
    def test_dangling_parent_quarantines(self):
        r = allocate([row('a','W1','A',parent_item_ids=['missing'])])
        self.assertEqual(r['components'][0]['proposed_partition'], 'QUARANTINE')
    def test_missing_author_quarantines(self):
        r = allocate([row('a','W1',None)])
        self.assertIn('AUTHOR_ID_UNVERIFIED',r['components'][0]['hold_reasons'])
    def test_exposed_ripple_through_component(self):
        r = allocate([row('a','W','U',exposed=True), row('b','W','U')])
        self.assertEqual(r['components'][0]['proposed_partition'], 'QUARANTINE')
    def test_rights_missing_quarantines(self):
        r=allocate([row('a','W','U',rights='UNKNOWN')])
        self.assertIn('RIGHTS_UNVERIFIED',r['components'][0]['hold_reasons'])
    def test_duplicate_id_fails(self):
        with self.assertRaises(AdmissionError): allocate([row('a','W','U'),row('a','W','U')])
    def test_same_sha_links_distinct_work_and_author(self):
        h = 'a'*64
        r=allocate([row('a','W1','A',raw_sha256=h),row('b','W2','B',raw_sha256=h)])
        self.assertEqual(len(r['components']),1)
    def test_deterministic_without_row_order_leak(self):
        a=[row('a','W1','A'),row('b','W2','B')]
        one=allocate(a)
        two=allocate(list(reversed(a)))
        self.assertEqual(one,two)
    def test_no_independence_claim_even_with_complete_ids(self):
        r=allocate([row('a','W1','A')])
        self.assertFalse(r['independence_claim'])

if __name__=='__main__': unittest.main()
