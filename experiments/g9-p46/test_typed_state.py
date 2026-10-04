#!/usr/bin/env python3
import unittest
from typed_state import TypedState, quotient_equivalent, safe_to_auto

class TypedStateTests(unittest.TestCase):
    CORE=frozenset({"predicate_sense","arguments","actuality","projection_world","negation_scope"})
    FULL=CORE|frozenset({"information_structure","relational_stance_register"})

    def s(self,**kw):
        support=kw.pop("support_state","VALIDATED")
        decision=kw.pop("decision_state","AUTO")
        return TypedState.from_mapping(kw,support,decision)

    def test_surface_realizers_can_collapse_under_core_projection(self):
        a=self.s(predicate_sense="ADD",arguments=("A0","A1"),actuality="ACTUAL",
                 projection_world="ACTUAL",negation_scope="NONE",marker="또")
        b=self.s(predicate_sense="ADD",arguments=("A0","A1"),actuality="ACTUAL",
                 projection_world="ACTUAL",negation_scope="NONE",marker="또한")
        self.assertTrue(quotient_equivalent(a,b,self.CORE))

    def test_negation_projection_order_must_not_collapse(self):
        a=self.s(predicate_sense="REPORT",arguments=("A0","P"),actuality="ACTUAL",
                 projection_world="REPORT",negation_scope="EMBEDDED_NEG")
        b=self.s(predicate_sense="REPORT",arguments=("A0","P"),actuality="NEGATED",
                 projection_world="REPORT",negation_scope="MATRIX_NEG")
        self.assertFalse(quotient_equivalent(a,b,self.CORE))

    def test_speech_level_can_split_full_projection(self):
        base=dict(predicate_sense="STATE",arguments=("A0",),actuality="ACTUAL",
                  projection_world="ACTUAL",negation_scope="NONE",information_structure="SAME")
        a=self.s(**base,relational_stance_register="POLITE")
        b=self.s(**base,relational_stance_register="PLAIN")
        self.assertTrue(quotient_equivalent(a,b,self.CORE))
        self.assertFalse(quotient_equivalent(a,b,self.FULL))

    def test_unknown_cannot_auto_pass(self):
        a=self.s(predicate_sense="UNKNOWN",arguments="UNKNOWN",actuality="UNKNOWN",
                 projection_world="UNKNOWN",negation_scope="UNKNOWN",
                 support_state="UNSUPPORTED",decision_state="ABSTAIN")
        self.assertFalse(safe_to_auto(a))

    def test_authority_difference_blocks_quotient(self):
        base=dict(predicate_sense="ADD",arguments=("A0","A1"),actuality="ACTUAL",
                  projection_world="ACTUAL",negation_scope="NONE")
        a=self.s(**base,support_state="VALIDATED",decision_state="AUTO")
        b=self.s(**base,support_state="INDUCED",decision_state="REVIEW")
        self.assertFalse(quotient_equivalent(a,b,self.CORE))

if __name__=="__main__":
    unittest.main()
