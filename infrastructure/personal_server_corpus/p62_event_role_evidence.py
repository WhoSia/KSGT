"""Source-witnessed surface relations for machine-only candidate competition.

The labels below describe visible Korean strings. They are neither parsed
semantic roles nor independent antecedent judgments.
"""
import hashlib
import re


VERSION = "P62-EVENT-ROLE-v1"
NOUN = re.compile(r"([가-힣]{2,})\s*$")
COMPOUND_NOUN = re.compile(r"([가-힣]{2,}\s+[가-힣]{2,})\s*$")
PARTICLES = ("에게서", "께서", "에게", "에서", "으로", "부터", "은", "는", "이", "가", "을", "를", "에", "도", "만")
CUE = {"이": "NOMINATIVE_CUE", "가": "NOMINATIVE_CUE", "을": "ACCUSATIVE_CUE",
       "를": "ACCUSATIVE_CUE", "은": "TOPIC_OR_CONTRAST_CUE", "는": "TOPIC_OR_CONTRAST_CUE"}
PREDICATE = re.compile(r"[가-힣]{1,}(?:다|했다|였다|됐다|있다|없다)")
COORD = re.compile(r"(?:와|과)\s+(?=[가-힣\d])|(?:^|\s)(?:및|그리고)\s+")


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def quote_stack(text, stop):
    stack = []
    opening = {"“": "”", "‘": "’"}
    closing = {value: key for key, value in opening.items()}
    for i, char in enumerate(text[:stop]):
        if char in opening:
            stack.append((char, i))
        elif char in closing:
            if not stack or stack[-1][0] != closing[char]:
                return None
            stack.pop()
    return tuple(stack)


def _witness(unit, index, start, end):
    if not 0 <= start < end <= len(unit):
        raise ValueError("Invalid original-unit span")
    return {"unit": index, "start": start, "end": end,
            "sha256": digest(unit[start:end])}


def source_relation(forms, node, target):
    """Return visible phrase/cue/predicate spans and explicit uncertainty."""
    witness = node["witness"]
    i, start, end = (witness[key] for key in ("unit", "start", "end"))
    if i >= len(forms) or not 0 <= start < end <= len(forms[i]):
        raise ValueError("Source node outside original unit")
    unit = forms[i]
    if digest(unit[start:end]) != witness["sha256"]:
        raise ValueError("Source node fragment digest mismatch")
    offsets = [0]
    for form in forms:
        offsets.append(offsets[-1] + len(form))
    global_end = offsets[i] + end
    target_start = offsets[target["unit"]] + target["start"]
    if global_end > target_start:
        raise ValueError("Future source node")
    prior = unit[max(0, start-32):start]
    noun_candidates = []
    for pattern in (NOUN, COMPOUND_NOUN):
        match = pattern.search(prior)
        if match:
            a = max(0, start-32) + match.start(1)
            item = _witness(unit, i, a, a + len(match.group(1)))
            if item not in noun_candidates:
                noun_candidates.append(item)
    noun_span = noun_candidates[0] if len(noun_candidates) == 1 else None
    limit = target["start"] if i == target["unit"] else len(unit)
    suffix = unit[end:min(limit, end+48)]
    particle = next((p for p in PARTICLES if suffix.startswith(p)), None)
    particle_span = _witness(unit, i, end, end+len(particle)) if particle else None
    attachment_ambiguous = bool(particle and len(suffix) > len(particle) and suffix[len(particle)].isalpha())
    clause_end = min(limit, min((p for p in (unit.find(c, end, limit) for c in ".?!\n") if p >= 0), default=limit))
    predicate_candidates = []
    for match in PREDICATE.finditer(unit[end:clause_end]):
        a = end + match.start()
        predicate_candidates.append(_witness(unit, i, a, end + match.end()))
    predicate_span = predicate_candidates[0] if len(predicate_candidates) == 1 else None
    between = unit[end:clause_end]
    coord = bool(COORD.search(between[:24])) or bool(node.get("conditional_union"))
    full = "".join(forms)
    source_quote = quote_stack(full, offsets[i] + start)
    target_quote = quote_stack(full, target_start)
    reasons = []
    if len(noun_candidates) > 1:
        reasons.append("COMPETING_NP_BOUNDARIES")
    if not noun_candidates:
        reasons.append("NO_VISIBLE_NOUN_PHRASE_CANDIDATE")
    if particle_span is None:
        reasons.append("NO_ADJACENT_PARTICLE_CUE")
    if attachment_ambiguous:
        reasons.append("AMBIGUOUS_PARTICLE_ATTACHMENT")
    if len(predicate_candidates) > 1:
        reasons.append("COMPETING_EVENT_ATTACHMENTS")
    if not predicate_candidates:
        reasons.append("NO_VISIBLE_PREDICATE_CANDIDATE")
    if source_quote is None or target_quote is None:
        reasons.append("MALFORMED_QUOTATION_DELIMITER")
    elif source_quote != target_quote:
        reasons.append("CROSS_QUOTATION_SCOPE")
    if coord:
        reasons.append("COORDINATION_PARSE_AMBIGUOUS")
    return {"node_id": node["id"], "noun_phrase_surface": noun_span,
            "noun_phrase_parse_alternatives": noun_candidates,
            "particle_surface": particle_span, "particle_cue": CUE.get(particle, "OTHER_CUE") if particle else None,
            "predicate_surface": predicate_span,
            "predicate_parse_alternatives": predicate_candidates,
            "source_quote_stack": source_quote,
            "target_quote_stack": target_quote, "reasons": reasons,
            "semantic_role": None, "human_ground_truth": None}


def decide(forms, target, graph, admission):
    """Compare four policies on one admitted graph and one target window."""
    if admission != "VERIFIED_TYPED_SOURCE_GRAPH_ONLY":
        return {"status": "HOLD_SOURCE_ADMISSION", "arms": {}, "evidence": [], "human_ground_truth": None}
    eligible = set(graph.get("eligible_ids", []))
    nodes = [node for node in graph.get("nodes", []) if node["id"] in eligible]
    target_global = sum(map(len, forms[:target["unit"]])) + target["start"]
    nodes = [node for node in nodes if node["witness"]["global_end"] <= target_global]
    evidence = [source_relation(forms, node, target) for node in nodes]
    by_id = {item["node_id"]: item for item in evidence}
    def select(pool):
        if not pool:
            return {"status": "ABSTAIN_NO_ELIGIBLE_EVIDENCE", "selected": None}
        ordered = sorted(pool, key=lambda n: (target_global-n["witness"]["global_end"], n["id"]))
        best = target_global - ordered[0]["witness"]["global_end"]
        nearby = [n for n in ordered if target_global-n["witness"]["global_end"]-best <= 48]
        if len(nearby) != 1:
            return {"status": "ABSTAIN_COMPETING_CANDIDATES", "selected": None}
        return {"status": "PROVISIONAL_SOURCE_FRAGMENT", "selected": nearby[0]["id"]}
    descriptor = re.search(r"^\s*([가-힣]{2,12})\s+(?=(?:\d|하나|한|둘|두|셋|세))", forms[target["unit"]][target["end"]:])
    phrase = descriptor.group(1) if descriptor else None
    a = select([n for n in nodes if phrase and by_id[n["id"]]["noun_phrase_surface"] and
                forms[by_id[n["id"]]["noun_phrase_surface"]["unit"]][by_id[n["id"]]["noun_phrase_surface"]["start"]:by_id[n["id"]]["noun_phrase_surface"]["end"]] == phrase])
    b = select(nodes)
    suffix = forms[target["unit"]][target["end"]:target["end"]+40]
    target_particle = next((p for p in PARTICLES if suffix.startswith(p)), None)
    target_cue = CUE.get(target_particle, "OTHER_CUE") if target_particle else None
    c = select([n for n in nodes if target_cue and by_id[n["id"]]["particle_cue"] == target_cue])
    d_pool = [n for n in nodes if not by_id[n["id"]]["reasons"]]
    d = select(d_pool)
    if graph.get("competing_union_ids") and d["selected"] is not None:
        d = {"status": "HOLD_COMPETING_COORDINATED_GROUP", "selected": None}
    return {"status": "EXECUTED_MACHINE_ONLY", "arms": {"A_DESCRIPTOR": a, "B_PROXIMITY": b,
            "C_PARTICLE": c, "D_NP_EVENT_SURFACE": d}, "evidence": evidence,
            "target_descriptor_observed": phrase is not None, "target_particle_cue_observed": target_cue is not None,
            "semantic_accuracy": None, "human_ground_truth": None}
