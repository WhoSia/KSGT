"""Authored component-identity counterexamples, not human reference judgments."""
import unittest
from p62_r4_r3_component_bounds import compose
def nodes():return [{'id':x,'scope':'authored-source','cardinality':n} for x,n in [('A',3),('B',2),('C',4)]]
class ComponentBoundsTests(unittest.TestCase):
    def test_shared_component_not_double_counted(self):self.assertEqual(compose(nodes(),[['A','B'],['B','C']])['upper'],9)
    def test_three_way_union_route_retained(self):
        x=compose(nodes(),[['A','B','C']]);self.assertLessEqual(8,x['upper']);self.assertGreater(10,x['upper'])
    def test_unknown_symbol_refused(self):
        with self.assertRaises(ValueError):compose(nodes(),[['D']])
    def test_conflicting_repeated_symbol_refused(self):
        with self.assertRaises(ValueError):compose(nodes()+[{'id':'B','scope':'authored-source','cardinality':9}],[['A','B']])
    def test_mixed_source_scope_hold(self):
        n=nodes();n[1]['scope']='another-source';self.assertEqual(compose(n,[['A','B']])['status'],'HOLD_EMPTY_OR_MIXED_SOURCE_SCOPE')
    def test_repeated_mentions_are_not_entities(self):
        n=nodes()+[{'id':'B-another-mention','scope':'authored-source','cardinality':2}];self.assertEqual(compose(n,[['B','B-another-mention']])['upper'],4)
    def test_bool_not_a_cardinality(self):
        n=nodes();n[0]['cardinality']=True;self.assertEqual(compose(n,[['A']])['status'],'HOLD_UNKNOWN_CARDINALITY')
    def test_self_attested_verified_field_does_not_certify_custody(self):
        n=nodes();n[0]['verified']=True;x=compose(n,[['A']]);self.assertEqual(x['source_custody'],'NOT_CERTIFIED_BY_THIS_FUNCTION');self.assertIsNone(x['human_ground_truth'])
    def test_idempotent_symbol_union(self):self.assertEqual(compose(nodes(),[['A'],['A']])['upper'],3)
    def test_order_invariant(self):self.assertEqual(compose(nodes(),[['A','B'],['C']]),compose(nodes()[::-1],[['C'],['B','A']]))
    def test_unknown_cardinality_hold(self):
        n=nodes();n[0]['cardinality']=None;self.assertEqual(compose(n,[['A']])['status'],'HOLD_UNKNOWN_CARDINALITY')
    def test_empty_not_pass(self):self.assertEqual(compose([],[])['status'],'HOLD_EMPTY_OR_MIXED_SOURCE_SCOPE')
if __name__=='__main__':unittest.main()
