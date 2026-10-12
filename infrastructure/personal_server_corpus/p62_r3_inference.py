"""P62-R3: strictly pre-target candidate inference and falsifiable ablations.

A future suffix must not influence prefix candidates or rank. All outputs are
surface proposals, never human semantic antecedent judgments.
"""
import collections
import re

import p62_reference as ref
from p62_r2 import canonical_target

PATTERNS = (
    ("NUMERIC_GROUP_FRAGMENT", ref.COUNT),
    ("TOPIC_ARGUMENT_FRAGMENT", ref.TOPIC),
    ("ENUMERATION_FRAGMENT", ref.ENUM),
    ("EVENT_PREDICATE_FRAGMENT", ref.PREDICATE),
)
KINDS = {name: i for i, (name, _) in enumerate(PATTERNS)}
POLICIES = ("PREFIX_ACCESSIBILITY", "PREFIX_RECENCY", "PREFIX_REPETITION")


def prefix_context(item, radius=2):
    canonical_target(item)
    if type(radius) is not int or radius < 0:
        raise ValueError("Nonnegative integer radius required")
    target = item["target"]
    i = target["unit"]
    context = {x["unit"]: x["text"] for x in item["context"]}
    return {j: (text[:target["start"]] if j == i else text)
            for j, text in context.items() if max(0, i-radius) <= j <= i}


def prefix_candidates(item, radius=2):
    target = item["target"]
    prefix = prefix_context(item, radius)
    result = []
    for unit in sorted(prefix):
        for kind, pattern in PATTERNS:
            for m in pattern.finditer(prefix[unit]):
                rel = ref.relation(unit, m.start(), m.end(), target)
                if not rel.startswith("PAST"):
                    continue
                c = {"unit": unit, "start": m.start(), "end": m.end(), "kind": kind,
                     "relation": rel, "candidate_id": ref.key([unit,m.start(),m.end(),kind]),
                     "authority": "MACHINE_PREFIX_ONLY"}
                if kind == "NUMERIC_GROUP_FRAGMENT":
                    raw = m.group("number")
                    num = int(raw) if raw.isdigit() else ref.NUMBERS.get(raw)
                    c.update(counter=m.group("counter"), cardinality=num,
                             plural_rule=num is None or num > 1)
                result.append(c)
    return result


def _bigrams(s):
    words = re.findall(r"[가-힣]{2,}", s)
    return {word[i:i+2] for word in words for i in range(len(word)-1)}


def _scores(item, candidates, policy, radius):
    prefix = prefix_context(item, radius)
    target = item["target"]
    def get(c):
        unit = c["unit"]
        gap = target["unit"] - unit
        char_gap = target["start"] - c["end"] if gap == 0 else 0
        kind = KINDS[c["kind"]]
        plural_penalty = int(c["kind"] != "NUMERIC_GROUP_FRAGMENT" or not c.get("plural_rule"))
        # Remove the candidate itself: lexical 'support' must not count itself.
        remainder = "".join(prefix[j] if j != unit else
                            prefix[j][:c["start"]] + prefix[j][c["end"]:]
                            for j in sorted(prefix) if j <= target["unit"])
        lexical_support = len(_bigrams(prefix[unit][c["start"]:c["end"]]) & _bigrams(remainder))
        tie = c["candidate_id"]
        if policy == "PREFIX_ACCESSIBILITY":
            return (plural_penalty, gap, char_gap, kind, -lexical_support, tie)
        if policy == "PREFIX_RECENCY":
            return (gap, char_gap, plural_penalty, kind, tie)
        if policy == "PREFIX_REPETITION":
            return (-lexical_support, plural_penalty, gap, char_gap, kind, tie)
        raise ValueError("Unknown policy")
    return get


def rank(item, policy="PREFIX_ACCESSIBILITY", radius=2):
    if policy not in POLICIES:
        raise ValueError("Unknown prefix policy")
    cs = prefix_candidates(item, radius)
    if not cs:
        return {"status": "ABSTAIN_NO_PREFIX_PROPOSAL", "policy": policy,
                "chosen": None, "prefix_candidate_count": 0,
                "authority": "MACHINE_PROVISIONAL_NOT_SEMANTIC_GOLD"}
    selected = min(cs, key=_scores(item, cs, policy, radius))
    return {"status": "PROPOSAL", "policy": policy, "chosen": selected,
            "prefix_candidate_count": len(cs),
            "authority": "MACHINE_PROVISIONAL_NOT_SEMANTIC_GOLD"}


def pretarget_signature(item, radius=2):
    """Machine witness for the prefix-invariance contract, not work identity."""
    ctx = prefix_context(item, radius)
    return ref.key([item["target"]["unit"],item["target"]["start"],
                    *[f"{i}:{len(ctx[i])}:{ctx[i]}" for i in sorted(ctx)]], "P62-R3-prefix-v1")


def policy_court(item, radius=2):
    """Compare policies on the same pre-target evidence; no accuracy metric."""
    ranked = {p: rank(item,p,radius) for p in POLICIES}
    chosen = {p: (ranked[p]["chosen"] or {}).get("candidate_id") for p in POLICIES}
    return {"status": "EXECUTED_MACHINE_ONLY", "prefix_signature": pretarget_signature(item,radius),
            "selected_ids": chosen,
            "accessibility_recency_disagree": chosen["PREFIX_ACCESSIBILITY"] != chosen["PREFIX_RECENCY"],
            "accessibility_repetition_disagree": chosen["PREFIX_ACCESSIBILITY"] != chosen["PREFIX_REPETITION"],
            "all_abstain": all(x is None for x in chosen.values()),
            "human_ground_truth": None, "referential_accuracy": None}


def stratified_court(items):
    """Evaluation on supplied items; no claim of corpus representativeness."""
    rows = []
    for item in items:
        if not item["target"]["observed"]:
            continue
        c = policy_court(item)
        rows.append((item, c))
    groups = collections.defaultdict(list)
    for item, court in rows:
        groups[str(item.get("family","UNKNOWN"))].append(court)
    def count(xs):
        return {"observed_targets": len(xs),
                "all_abstain": sum(x["all_abstain"] for x in xs),
                "accessibility_recency_disagree": sum(x["accessibility_recency_disagree"] for x in xs),
                "accessibility_repetition_disagree": sum(x["accessibility_repetition_disagree"] for x in xs)}
    return {"status": "MACHINE_PROVISIONAL", "overall": count([c for _,c in rows]),
            "families": {g: count(xs) for g,xs in sorted(groups.items())},
            "inference_claim": None, "human_labels": 0}
