"""P62-R3: typed text-identity proofs and conservative split-exclusion graph.

Exact surface relations are not authorship, coreference, or semantic work identity.
No normalized-only match licenses Unicode-span transport.
"""
import collections
import unicodedata

EXACT = "EXACT_ORDERED_UNITS"
SUBSET = "EXACT_CONTIGUOUS_UNIT_SUBSET"
RESEGMENTED = "EXACT_CODEPOINT_STREAM_DIFFERENT_BOUNDARIES"
NORMALIZED = "NORMALIZED_ONLY_QUARANTINE"
UNRESOLVED = "UNRESOLVED"


def _validate(units):
    if not isinstance(units, (list, tuple)) or not units or not all(type(x) is str for x in units):
        raise ValueError("Nonempty ordered list of unchanged source units required")


def _weak_form(units):
    # Diagnostic only: destroys information, never authorizes source offsets.
    return " ".join(unicodedata.normalize("NFC", "".join(units)).split())


def compare(left, right):
    """Oriented proof: a span in LEFT is transportable to RIGHT only if unique.

    The result deliberately has no 'same author/work' property.
    """
    _validate(left)
    _validate(right)
    if list(left) == list(right):
        return {"relation": EXACT, "placements": [0], "orientation": "LEFT_IN_RIGHT",
                "same_work_proven": False, "must_not_cross_split": True}
    placements = [i for i in range(len(right) - len(left) + 1)
                  if list(right[i:i + len(left)]) == list(left)]
    if placements:
        return {"relation": SUBSET, "placements": placements, "orientation": "LEFT_IN_RIGHT",
                "same_work_proven": False, "must_not_cross_split": True}
    reverse = [i for i in range(len(left) - len(right) + 1)
               if list(left[i:i + len(right)]) == list(right)]
    if reverse:
        return {"relation": SUBSET, "placements": reverse, "orientation": "RIGHT_IN_LEFT",
                "same_work_proven": False, "must_not_cross_split": True}
    if "".join(left) == "".join(right):
        return {"relation": RESEGMENTED, "placements": [], "orientation": "STREAM_EQUAL",
                "same_work_proven": False, "must_not_cross_split": True}
    if _weak_form(left) == _weak_form(right):
        return {"relation": NORMALIZED, "placements": [], "orientation": "UNPROVEN",
                "same_work_proven": False, "must_not_cross_split": None}
    return {"relation": UNRESOLVED, "placements": [], "orientation": "UNPROVEN",
            "same_work_proven": False, "must_not_cross_split": None}


def _bounds(units):
    result = []
    point = 0
    for unit in units:
        result.append((point, point + len(unit)))
        point += len(unit)
    return result


def transport_span(left, right, span):
    """Map one half-open, nonempty code-point span; reject any ambiguity.

    Mapping is allowed across unchanged ordered units or an exactly equal
    code-point stream, not across normalized text or unverified source IDs.
    A mapped span crossing a unit boundary stays quarantined rather than split.
    """
    proof = compare(left, right)
    if any(type(span.get(k)) is not int for k in ("unit", "start", "end")):
        raise ValueError("Integer, non-boolean Unicode offsets required")
    i, start, end = span["unit"], span["start"], span["end"]
    if not 0 <= i < len(left) or not 0 <= start < end <= len(left[i]):
        raise ValueError("Invalid source span")
    if proof["relation"] in (UNRESOLVED, NORMALIZED):
        return {"status": "HOLD_UNVERIFIED_TEXT_RELATION", "span": None}
    if proof["relation"] == SUBSET and len(proof["placements"]) != 1:
        return {"status": "HOLD_AMBIGUOUS_REPEATED_SUBSET", "span": None}
    if proof["relation"] == SUBSET:
        if proof["orientation"] == "LEFT_IN_RIGHT":
            j = i + proof["placements"][0]
            return {"status": "EXACT_TRANSPORT", "span": {"unit": j, "start": start, "end": end}}
        j = i - proof["placements"][0]
        if not 0 <= j < len(right):
            return {"status": "HOLD_OUTSIDE_SUBSET", "span": None}
        return {"status": "EXACT_TRANSPORT", "span": {"unit": j, "start": start, "end": end}}
    if proof["relation"] == EXACT:
        return {"status": "EXACT_TRANSPORT", "span": {"unit": i, "start": start, "end": end}}
    global_start = _bounds(left)[i][0] + start
    global_end = _bounds(left)[i][0] + end
    possible = [(j, global_start - lo, global_end - lo)
                for j, (lo, hi) in enumerate(_bounds(right))
                if lo <= global_start < global_end <= hi]
    if len(possible) != 1:
        return {"status": "HOLD_CROSS_UNIT_OR_AMBIGUOUS", "span": None}
    j, a, b = possible[0]
    if left[i][start:end] != right[j][a:b]:
        raise AssertionError("Exact code-point transport violated")
    return {"status": "EXACT_TRANSPORT", "span": {"unit": j, "start": a, "end": b}}


def exclusion_court(records):
    """Quadratic reference court for a small, preselected comparison cohort.

    Hard edges certify shared *surface evidence*, not a common author or work.
    Transitive risk components conservatively block conflicting train/test
    assignment; transitivity does not promote pairwise text identity.
    """
    records = list(records)
    for r in records:
        if not isinstance(r.get("id"), str) or not r["id"]:
            raise ValueError("Stable nonempty record ID required")
        _validate(r["units"])
    ids = [r["id"] for r in records]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate identity")
    parent = {x: x for x in ids}
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    def union(a, b):
        a, b = find(a), find(b)
        if a != b:
            parent[max(a, b)] = min(a, b)
    edges = []
    quarantine = []
    for i, a in enumerate(records):
        for b in records[i+1:]:
            proof = compare(a["units"], b["units"])
            relation = proof["relation"]
            if relation in (EXACT, SUBSET, RESEGMENTED):
                union(a["id"], b["id"])
                edges.append({"left": a["id"], "right": b["id"], "relation": relation,
                              "semantic_work_equivalence_proven": False})
            elif relation == NORMALIZED or (a.get("source_id") and a.get("source_id") == b.get("source_id")):
                quarantine.append({"left": a["id"], "right": b["id"],
                                   "reason": "NORMALIZED_ONLY" if relation == NORMALIZED else "UNVERIFIED_SAME_SOURCE_ID"})
    groups = collections.defaultdict(list)
    for x in ids:
        groups[find(x)].append(x)
    groups = [sorted(xs) for xs in groups.values()]
    groups.sort()
    return {"hard_exclusion_groups": groups, "exact_surface_edges": edges,
            "unresolved_pair_quarantine": quarantine,
            "semantic_work_identity_claim": None,
            "global_source_work_independence": "HOLD"}
