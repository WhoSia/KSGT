#!/usr/bin/env python3
"""G9-P46 R6 authority-aware decision pseudometric tests."""
from __future__ import annotations
from dataclasses import dataclass
from typing import FrozenSet

@dataclass(frozen=True)
class Decision:
    actions: FrozenSet[str]
    veto: str
    abstain: str
    authority: str

def rho(a: Decision,b: Decision)->int:
    return int(a != b)

def empirical_distance(a:list[Decision],b:list[Decision])->float:
    if len(a)!=len(b) or not a:
        raise ValueError("aligned nonempty decision lists required")
    return sum(rho(x,y) for x,y in zip(a,b))/len(a)

def equivalent(a:list[Decision],b:list[Decision])->bool:
    return empirical_distance(a,b)==0.0

class Tests:
    pass

if __name__=="__main__":
    import unittest
    class R6Tests(unittest.TestCase):
        def d(self,acts=("KEEP",),v="PASS",ab="NO",au="LOCAL"):
            return Decision(frozenset(acts),v,ab,au)
        def test_false_plurality_collapses_basis_difference(self):
            a=[self.d(), self.d(("LOCAL_REWRITE",))]
            b=[self.d(), self.d(("LOCAL_REWRITE",))]
            self.assertTrue(equivalent(a,b))
        def test_trigger_changes_future_action_blocks_merge(self):
            source_only=[self.d(), self.d()]
            trigger_conditioned=[self.d(), self.d(("LOCAL_REWRITE",))]
            self.assertGreater(empirical_distance(source_only,trigger_conditioned),0)
        def test_authority_difference_blocks_merge(self):
            a=[self.d(au="LOCAL")]
            b=[self.d(au="SEMANTIC")]
            self.assertFalse(equivalent(a,b))
        def test_abstention_cannot_be_hidden(self):
            a=[self.d(ab="NO")]
            b=[self.d(ab="YES",acts=("ABSTAIN",))]
            self.assertFalse(equivalent(a,b))
    unittest.main()
