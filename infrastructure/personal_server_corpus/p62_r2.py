"""P62-R2 source-work, target-identity and negative-control admission contracts.

Machine rules do not create independently adjudicated semantic labels.
"""
import collections, hashlib, json, math, re
from p62_reference import key, validate_span, relation, TARGET, DEMONSTRATIVE

VERSION = "P62-R2-v1"
PARTICLE_DEMONSTRATIVE = re.compile(DEMONSTRATIVE.pattern.replace(
    "(?:은|는|이|가|을|를|의|에게|도|만)?(?![가-힣])",
    r"(?:에게서|에게는|으로|에서|에는|에게|은|는|이|가|을|를|의|에|도|만|와|과|로)?(?![가-힣])"))

def canonical_target(item):
    """Framed identity preserves source structure; no approximate span transport."""
    contexts = {x["unit"]: x["text"] for x in item["context"]}
    if len(contexts) != len(item["context"]):
        raise ValueError("Duplicate context unit")
    t = item["target"]
    for name in ("unit", "start", "end"):
        if type(t.get(name)) is not int:
            raise ValueError("Offsets and unit must be integers, not booleans")
    if t.get("observed") is True:
        validate_span(t, contexts)
    elif not 0 <= t["start"] <= t["end"] <= len(contexts[t["unit"]]):
        raise ValueError("Invalid nonobserved pseudoanchor location")
    if type(t.get("observed")) is not bool:
        raise ValueError("Observed flag must be explicit")
    if not item.get("source_work_key") or not item.get("strict_structure"):
        raise ValueError("Source-work and strict structure identities required")
    text = contexts[t["unit"]][t["start"]:t["end"]]
    if t["observed"] and TARGET.fullmatch(text) is None:
        raise ValueError("Observed target is not the sealed target inventory")
    return key([item["source_work_key"], item["strict_structure"], t["unit"],
                t["start"], t["end"], int(t["observed"]), text], "P62-R2-target")

def group_targets(items):
    groups = collections.defaultdict(list)
    for item in items:
        groups[canonical_target(item)].append(item)
    return dict(groups)

def duplicate_contract(group):
    """Different evidence contexts are quarantined, never resolved by first row."""
    contexts = {json.dumps(x["context"], sort_keys=True, ensure_ascii=False) for x in group}
    targets = {json.dumps(x["target"], sort_keys=True) for x in group}
    predictions = {json.dumps(x["candidates"], sort_keys=True, ensure_ascii=False) for x in group}
    if len(contexts) != 1 or len(targets) != 1 or len(predictions) != 1:
        return {"status": "HOLD", "policy": "QUARANTINE_CONFLICTING_VIEWS"}
    return {"status": "VERIFIED", "policy": "COLLAPSE_IDENTICAL_TARGET_VIEWS",
            "representative": min(x["item_id"] for x in group),
            "view_count": len(group)}

def negative_taxonomy(item):
    """Surface-screening taxonomy only, not a nonreferential gold classifier."""
    t = item["target"]
    targettext = next(x["text"] for x in item["context"] if x["unit"] == t["unit"])
    anchor = targettext[t["start"]:t["end"]]
    literal = list(TARGET.finditer(targettext))
    original = list(DEMONSTRATIVE.finditer(targettext))
    broad = list(PARTICLE_DEMONSTRATIVE.finditer(targettext))
    in_anchor = [m for m in broad if m.start() < t["end"] and m.end() > t["start"]]
    context_broad = sum(len(list(PARTICLE_DEMONSTRATIVE.finditer(x["text"])))
                        for x in item["context"] if x["unit"] != t["unit"])
    surface_types = sorted(set(re.sub(r"(?:에게서|에게는|으로|에서|에는|에게|은|는|이|가|을|를|의|에|도|만|와|과|로)$", "",m.group()) for m in broad))
    if t["observed"]: tier = "OBSERVED_TARGET_NOT_NEGATIVE"
    elif literal: tier = "LITERAL_TARGET_IN_PSEUDO_UNIT"
    elif in_anchor: tier = "DEMONSTRATIVE_OVERLAPS_PSEUDOANCHOR"
    elif broad: tier = "OTHER_DEMONSTRATIVE_IN_PSEUDO_UNIT"
    elif context_broad: tier = "DEMONSTRATIVE_ONLY_IN_CONTEXT"
    else: tier = "NO_SCREENED_DEMONSTRATIVE_NOT_SEMANTIC_GOLD"
    return {"tier": tier, "original_demonstratives": len(original),
            "expanded_demonstratives": len(broad), "context_demonstratives": context_broad,
            "surface_types": surface_types, "anchor_characters": len(anchor),
            "semantic_negative_admitted": False,
            "structural_placebo_admitted": not t["observed"] and not literal and not broad,
            "human_ground_truth": None}

def exact_relation(a, b):
    """Evidence for representational relations, without weak-metadata merging."""
    if a == b: return "EXACT_ORDERED_UNITS"
    if not a or not b: return "UNRESOLVED"
    short, long = (a,b) if len(a)<=len(b) else (b,a)
    if any(long[i:i+len(short)] == short for i in range(len(long)-len(short)+1)):
        return "EXACT_CONTIGUOUS_UNIT_SUBSET"
    if "".join(a) == "".join(b):
        return "EXACT_CONCATENATION_DIFFERENT_BOUNDARIES"
    return "UNRESOLVED"

def source_work_split(component):
    return "REVIEW_PILOT" if int(key([component], "P62-R2-review-split")[:16],16)%5==0 else "SEALED_EVALUATION"

def admissible_registry(registry, expected_sha=None):
    """Registry custody must come from a separately frozen authority root."""
    raw = json.dumps(registry, sort_keys=True, separators=(",",":")).encode()
    actual = hashlib.sha256(raw).hexdigest()
    if expected_sha is None or actual != expected_sha: return {}
    return {rid:r for rid,r in registry.items()
            if r.get("qualified") is True and r.get("independence_verified") is True
            and r.get("verified_by") and r["verified_by"] != rid
            and r.get("verification_evidence") and r.get("verification_timestamp")
            and r.get("authority_root")}

def validate_response(item, response, registry, expected_registry_sha=None):
    from p62_reference import validate_judgment
    canonical_target(item)
    if response.get("target_identity") != canonical_target(item):
        raise ValueError("Exact source-work/target identity mismatch")
    for s in response.get("antecedent_spans", []):
        if any(type(s.get(k)) is not int for k in ("unit","start","end")):
            raise ValueError("Invalid span index type")
    if type(response.get("confidence")) not in (float,int) or not math.isfinite(response["confidence"]):
        raise ValueError("Finite numeric confidence required")
    validate_judgment(item,response)
    if not item["target"]["observed"] and response["judgment"] in {"REFERENTIAL","CATAPHORIC"}:
        raise ValueError("A pseudoanchor has no observed expression to resolve")
    if response["judgment"]=="CATAPHORIC" and not any(
        relation(s["unit"],s["start"],s["end"],item["target"]).startswith("FUTURE")
        for s in response.get("antecedent_spans",[])):
        raise ValueError("Cataphoric judgment requires explicit future evidence")
    if response["judgment"]=="NONREFERENTIAL" and response.get("antecedent_spans"):
        raise ValueError("Nonreferential judgment cannot assert antecedents")
    if response.get("item_hash") != item.get("packet_hash"):
        raise ValueError("Packet custody mismatch")
    return response["adjudicator_id"] in admissible_registry(registry,expected_registry_sha)

def candidate_identity(item, candidate):
    canonical_target(item)
    contexts={x["unit"]:x["text"] for x in item["context"]}
    if any(type(candidate.get(k)) is not int for k in ("unit","start","end")):
        raise ValueError("Invalid candidate offset type")
    validate_span(candidate,contexts)
    rel=relation(candidate["unit"],candidate["start"],candidate["end"],item["target"])
    if rel != candidate["relation"] or rel=="OVERLAPPING_TARGET":
        raise ValueError("Candidate temporal relation mismatch")
    return key([item["source_work_key"],item["strict_structure"],candidate["unit"],
                candidate["start"],candidate["end"],contexts[candidate["unit"]][candidate["start"]:candidate["end"]]],
               "P62-R2-evidence-span")
