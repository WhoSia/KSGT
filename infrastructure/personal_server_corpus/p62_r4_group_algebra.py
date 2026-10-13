"""P62-R4 partial algebra of POSSIBLE finite group-cardinality bounds.

These statements hold only IF source mentions actually denote finite sets of
individuals with their parsed cardinalities. They do not prove denotation,
same-work identity, group membership, coordination semantics, or reference.
"""
from itertools import combinations

VERSION = "P62-R4-conditional-group-bounds-v1"


def _cardinality(value):
    return type(value) is int and value >= 0


def union_bounds(cardinalities, same_counter=True):
    """Tight overlap-agnostic bounds max(|A_i|) <= |union A_i| <= sum(|A_i|)."""
    counts=list(cardinalities)
    if not counts or not same_counter or not all(_cardinality(x) for x in counts):
        return {"status":"HOLD_UNTYPED_OR_UNKNOWN_CARDINALITY",
                "lower":None,"upper":None,"exact":None,
                "semantic_denotation_proven":False}
    return {"status":"CONDITIONAL_FINITE_SET_BOUND",
            "lower":max(counts),"upper":sum(counts),"exact":None,
            "assumptions":["EACH_COMPONENT_DENOTES_FINITE_SET",
                           "OBSERVED_COUNTS_ARE_TRUE_SET_CARDINALITIES",
                           "COMPATIBLE_COUNTING_UNIT",
                           "UNION_COMPOSITION_INTENDED"],
            "overlap_measured":False,"semantic_denotation_proven":False}


def target_test(bounds, required):
    """An upper-bound counterexample can refute only a conditional set model.

    A non-refuted hypothesis is NEVER positive semantic confirmation.
    """
    if bounds.get("status")!="CONDITIONAL_FINITE_SET_BOUND" or not _cardinality(required):
        return "HOLD_UNTYPED_OR_UNKNOWN_REQUIREMENT"
    if required>bounds["upper"]:
        return "CONDITIONALLY_IMPOSSIBLE_UNDER_SET_ASSUMPTIONS"
    if required>bounds["lower"]:
        return "UNRESOLVED_OVERLAP_MAY_MATTER"
    return "NOT_REFUTED_NOT_VALIDATED"


def bounded_join(left,right):
    """Lax union bounds; associative/commutative but NOT an exact set union."""
    for value in (left,right):
        if (not isinstance(value,dict)
                or not _cardinality(value.get("lower"))
                or not _cardinality(value.get("upper"))
                or value["lower"]>value["upper"]):
            return {"status":"HOLD_INVALID_OPERAND","lower":None,"upper":None}
    return {"status":"CONDITIONAL_BOUND_JOIN",
            "lower":max(left["lower"],right["lower"]),
            "upper":left["upper"]+right["upper"],
            "exact_denotation_claim":False}


def authored_universe_court(universe_size=5):
    """Exhaustive oracle over authored mathematical finite sets, NOT Korean gold."""
    if type(universe_size) is not int or not 0<=universe_size<=8:
        raise ValueError("Bounded authored finite universe 0..8")
    universe=tuple(range(universe_size))
    subsets=[frozenset(c) for length in range(universe_size+1)
             for c in combinations(universe,length)]
    pairs=0
    overlap_cases=0
    distinct_possible_union_sizes={}
    for a in subsets:
        for b in subsets:
            pairs+=1
            bounds=union_bounds([len(a),len(b)])
            actual=len(a|b)
            if not bounds["lower"]<=actual<=bounds["upper"]:
                raise AssertionError("A union bound failed under explicit finite set assumptions")
            if a&b:
                overlap_cases+=1
            distinct_possible_union_sizes.setdefault((len(a),len(b)),set()).add(actual)
    # Only abstract tightness/overlap counterexamples; no corpus observation.
    tight_witness=sorted(
        ({"components":[a,b],"possible_union_sizes":sorted(values)}
         for (a,b),values in distinct_possible_union_sizes.items()
         if len(values)>1),
        key=lambda row:tuple(row["components"]))
    return {"status":"FORMAL_AUTHORED_ENUMERATION_PASS",
            "universe_size":universe_size,
            "subset_count":len(subsets),"ordered_subset_pairs":pairs,
            "overlapping_pairs":overlap_cases,
            "distinct_cardinality_counterexamples":len(tight_witness),
            "witnesses":tight_witness,
            "Korean_reference_accuracy":None,
            "qualified_human_judgments":0}
