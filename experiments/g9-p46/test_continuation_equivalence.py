#!/usr/bin/env python3
import unittest

def continuation_equivalent(a,b):
    keys=("semantic_veto","abstention","admissible_actions","authority")
    return all(a[k]==b[k] for k in keys)

class ContinuationEquivalenceTests(unittest.TestCase):
    def test_same_snapshot_but_different_future_action_is_not_equivalent(self):
        a={"snapshot":[0.1,0.9],"semantic_veto":"PASS","abstention":"NO",
           "admissible_actions":("KEEP","REWRITE"),"authority":"LOCAL"}
        b={"snapshot":[0.1,0.9],"semantic_veto":"PASS","abstention":"NO",
           "admissible_actions":("KEEP",),"authority":"LOCAL"}
        self.assertEqual(a["snapshot"],b["snapshot"])
        self.assertFalse(continuation_equivalent(a,b))

    def test_basis_difference_can_be_false_plurality(self):
        a={"snapshot":[1,0],"semantic_veto":"PASS","abstention":"NO",
           "admissible_actions":("KEEP",),"authority":"LOCAL"}
        b={"snapshot":[0,1],"semantic_veto":"PASS","abstention":"NO",
           "admissible_actions":("KEEP",),"authority":"LOCAL"}
        self.assertNotEqual(a["snapshot"],b["snapshot"])
        self.assertTrue(continuation_equivalent(a,b))

if __name__=="__main__":
    unittest.main()
