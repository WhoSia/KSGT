"""P62-R4 source-grounded discourse composition, scoped evidence and state replay.

Original Korean surface witnesses remain distinct from semantic entity/coreference
claims. This is a conservative machine-provisional inference instrument.
"""
import hashlib
import json
import re

from p62_reference import TARGET, NUMBERS
from p62_r3_stream_inference import COUNT, stream_coordinates
from p62_r4_group_algebra import union_bounds, target_test

VERSION = "P62-R4-discourse-state-v1"

# Enlarged transparent numeral inventory; unseen quantities must HOLD, not
# silently turn the target-local compatibility test off.
R4_NUMBERS = {**NUMBERS, "다섯":5, "여섯":6, "일곱":7, "여덟":8,
              "아홉":9, "열":10}
R4_COUNT = re.compile(
    r"(?P<number>\d+|하나|한|둘|두|셋|세|넷|네|다섯|여섯|일곱|여덟|아홉|열|몇|여러)"
    r"\s*(?P<counter>가지|마리|차례|명|개|곳|건|팀|편|번|회)"
    r"(?=(?:에게서|으로|에서|에게|은|는|이|가|을|를|의|에|와|과|도|만)?(?:[^가-힣]|$))")
UNPARSED_QUANTITY = re.compile(
    r"^\s*(?P<surface>[가-힣]{1,12}|\d+)\s*(?P<counter>가지|마리|차례|명|개|곳|건|팀|편|번|회)"
    r"(?=(?:은|는|이|가|을|를|의|와|과)?(?:[^가-힣]|$))")

COORDINATOR = re.compile(
    r"^(?P<left>\s*)(?P<marker>와|과|및|그리고)"
    r"(?P<right>\s+(?:[가-힣]{1,16}\s*)?|\s*)$")
HYPOTHETICAL = re.compile(r"만약|가정(?:하면|할 때)?|예를 들어")
EXISTENTIAL_NEGATION = re.compile(
    r"^\s*(?:이|가|은|는|도|만)?\s*(?:없(?:었|다|는|을|습니다)?|존재하지\s*않)")
EVENT_NEGATION = re.compile(r"^\s*(?:이|가|은|는)?\s*[가-힣]{1,18}지\s*않")
SENTENCE_END = re.compile(r"[.!?\n]")
AMBIGUITY_DISTANCE = 48


def _canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":"))


def _id(domain, data):
    return hashlib.sha256((domain + "\0" + _canonical(data)).encode("utf-8")).hexdigest()


def _check_forms(forms):
    if type(forms) not in (list, tuple) or not forms or not all(type(x) is str for x in forms):
        raise ValueError("Nonempty unchanged source-unit strings required")


def _quote_scope(stream, offset):
    """Track exact quotation-open locations rather than unreliable quote parity."""
    stack = []
    for i, ch in enumerate(stream[:offset]):
        if ch == '"' and (i == 0 or stream[i-1] != "\\"):
            if stack and stack[-1][1] == '"':
                stack.pop()
            else:
                stack.append((i, '"'))
        elif ch == '“':
            stack.append((i, '“'))
        elif ch == '”':
            if not stack or stack[-1][1] != '“':
                return None
            stack.pop()
    return tuple(x[0] for x in stack)


def _original_span(forms, offsets, a, b):
    if type(a) is not int or type(b) is not int or not 0 <= a < b <= offsets[-1]:
        return None
    matching = [(j, a - offsets[j], b - offsets[j])
                for j in range(len(forms)) if offsets[j] <= a < b <= offsets[j+1]]
    if len(matching) != 1:
        return None
    unit, start, end = matching[0]
    return {"unit": unit, "start": start, "end": end, "global_start": a,
            "global_end": b, "sha256": hashlib.sha256(
                forms[unit][start:end].encode("utf-8")).hexdigest()}


def verify_witness(forms, witness):
    """Full original-unit/code-point custody, independently of model ranking."""
    _check_forms(forms)
    if type(witness) is not dict or any(type(witness.get(k)) is not int
           for k in ("unit", "start", "end", "global_start", "global_end")):
        return False
    i, a, b = witness["unit"], witness["start"], witness["end"]
    if not 0 <= i < len(forms) or not 0 <= a < b <= len(forms[i]):
        return False
    offset = sum(map(len, forms[:i]))
    if offset + a != witness["global_start"] or offset + b != witness["global_end"]:
        return False
    return hashlib.sha256(forms[i][a:b].encode("utf-8")).hexdigest() == witness.get("sha256")


def _clause_before(fragment, local_start):
    prior=fragment[:local_start]
    ends=list(SENTENCE_END.finditer(prior))
    return prior[ends[-1].end():] if ends else prior


def _assertion(fragment, local_end):
    """Very local, deliberately non-semantic cue classification."""
    after=fragment[local_end:]
    finish=SENTENCE_END.search(after)
    after=after[:finish.start()] if finish else after
    if EXISTENTIAL_NEGATION.search(after):
        return "SURFACE_EXISTENTIAL_NEGATION"
    if EVENT_NEGATION.search(after):
        return "SURFACE_EVENT_NEGATION"
    return "UNRESOLVED_ASSERTION"


def _target_local(forms, target, use):
    if not use:
        return None
    suffix=forms[target["unit"]][target["end"]:target["end"]+80]
    prefix=re.match(r"\s*",suffix).end()
    m=R4_COUNT.match(suffix,prefix)
    if m is None:
        unknown=UNPARSED_QUANTITY.match(suffix)
        if unknown is not None:
            return {"status":"UNPARSED_TARGET_QUANTITY_HOLD", "surface_sha256":hashlib.sha256(unknown.group().encode("utf-8")).hexdigest(),
                    "authority":"TARGET_LOCAL_SURFACE_ONLY_NOT_ANTECEDENT"}
    if m is None:
        return None
    number=m.group("number")
    cardinality=int(number) if number.isdigit() else R4_NUMBERS.get(number)
    return {"counter":m.group("counter"),"cardinality":cardinality,
            "authority":"OBSERVED_TARGET_LOCAL_CONSTRAINT_NOT_ANTECEDENT"}


def infer(forms, target, window=1024, use_target_constraints=False):
    """Construct a typed mention/group graph by reading units in time order.

    Future units and target-unit suffix are absent from the state-building input.
    Target-local constraints are optional, separately recorded, and never
    themselves become source candidates.
    """
    _check_forms(forms)
    if type(window) is not int or window < 1:
        raise ValueError("Positive integer source window required")
    offsets, target_start, target_end = stream_coordinates(forms, target)
    original="".join(forms)
    prefix=original[:target_start]
    lower=max(0, target_start-window)
    target_scope=_quote_scope(original,target_start)
    if target_scope is None:
        return {"status":"HOLD_INVALID_QUOTE_SCOPE","selected":None,"nodes":[],
                "unions":[],"scope_rejects":[],"source_custody":"HOLD",
                "human_ground_truth":None,"semantic_accuracy":None}
    nodes=[]
    events=[]
    for j, source in enumerate(forms):
        if offsets[j]>=target_start:
            break
        limit = min(len(source), max(0,target_start-offsets[j]))
        visible=source[:limit]
        for m in R4_COUNT.finditer(visible):
            a=offsets[j]+m.start()
            b=offsets[j]+m.end()
            if a<lower:
                continue
            witness=_original_span(forms,offsets,a,b)
            if witness is None or not verify_witness(forms,witness):
                raise AssertionError("Evidence from original unit must be exact")
            raw=m.group("number")
            cardinality=int(raw) if raw.isdigit() else R4_NUMBERS.get(raw)
            scope=_quote_scope(prefix,a)
            fragment=_clause_before(visible,m.start())
            hypothetical=bool(HYPOTHETICAL.search(fragment))
            node={"id":_id("R4_GROUP",[a,b,m.group(),j]),
                  "kind":"GROUP_MENTION_NOT_ENTITY_GOLD",
                  "witness":witness,
                  "counter":m.group("counter"),
                  "cardinality":cardinality,
                  "quote_scope":scope,
                  "hypothetical":hypothetical,
                  "assertion":_assertion(visible,m.end()),
                  "source_time":a,
                  "reference_licensed":False}
            nodes.append(node)
            events.append({"type":"OBSERVED_GROUP_MENTION","node_id":node["id"],
                           "source_time":a})
    nodes.sort(key=lambda x:(x["source_time"],x["id"]))
    unions=[]
    # Composition witnesses must be inside one unchanged source unit, not a
    # fabricated contiguous span covering a discontinuous group denotation.
    for left,right in zip(nodes,nodes[1:]):
        w1,w2=left["witness"],right["witness"]
        if w1["unit"]!=w2["unit"] or w1["global_end"]>=w2["global_start"]:
            continue
        if left["quote_scope"]!=right["quote_scope"] or left["hypothetical"]!=right["hypothetical"]:
            continue
        if left["counter"]!=right["counter"]:
            continue
        j=w1["unit"]
        between=forms[j][w1["end"]:w2["start"]]
        m=COORDINATOR.fullmatch(between)
        if m is None:
            continue
        marker_start=w1["end"]+m.start("marker")
        marker_end=w1["end"]+m.end("marker")
        marker=_original_span(forms,offsets,offsets[j]+marker_start,
                              offsets[j]+marker_end)
        if marker is None or not verify_witness(forms,marker):
            raise AssertionError("Coordinator original span missing")
        union={"id":_id("R4_UNION",[left["id"],right["id"],marker["sha256"]]),
               "kind":"PROPOSED_COORDINATED_GROUP_UNION",
               "component_ids":[left["id"],right["id"]],
               "component_witnesses":[w1,w2],
               "coordinator_witness":marker,
               "counter":left["counter"],
               "total_cardinality":None,
               "conditional_set_bounds":union_bounds(
                   [left["cardinality"],right["cardinality"]],
                   same_counter=left["counter"]==right["counter"]),
               "total_cardinality_reason":"MEMBERSHIP_OVERLAP_NOT_ESTABLISHED",
               "quote_scope":left["quote_scope"],
               "hypothetical":left["hypothetical"],
               "reference_licensed":False}
        unions.append(union)
        events.append({"type":"SURFACE_COORDINATION_PROPOSED",
                       "node_id":union["id"],"source_time":w2["global_end"]})
    blocked=[]
    eligible=[]
    for node in nodes:
        reasons=[]
        if node["quote_scope"] is None or node["quote_scope"]!=target_scope:
            reasons.append("DIFFERENT_OR_UNKNOWN_QUOTATION_SCOPE")
        if node["hypothetical"] and not HYPOTHETICAL.search(
                _clause_before(forms[target["unit"]][:target["start"]],
                               target["start"])):
            reasons.append("UNTRANSPORTED_HYPOTHETICAL_SCOPE")
        if node["assertion"]=="SURFACE_EXISTENTIAL_NEGATION":
            reasons.append("EXISTENTIAL_ASSERTION_NOT_ENTITY_PRESENCE")
        if node["cardinality"] is None:
            reasons.append("UNKNOWN_GROUP_CARDINALITY")
        if node["cardinality"] is not None and node["cardinality"]<2:
            reasons.append("NONPLURAL_GROUP")
        if reasons:
            blocked.append({"node_id":node["id"],"reasons":reasons})
        else:
            eligible.append(node)
    constraint=_target_local(forms,target,use_target_constraints)
    if constraint is not None and constraint.get("status")=="UNPARSED_TARGET_QUANTITY_HOLD":
        eligible=[]
    elif constraint is not None:
        retained=[]
        for node in eligible:
            reasons=[]
            if constraint["counter"]!=node["counter"]:
                reasons.append("COUNTER_MISMATCH")
            elif constraint["cardinality"] is not None and node["cardinality"]<constraint["cardinality"]:
                reasons.append("INSUFFICIENT_INDIVIDUAL_GROUP_SIZE")
            if reasons:
                blocked.append({"node_id":node["id"],"reasons":reasons})
            else:
                retained.append(node)
        eligible=retained
    # A component blocked for individual-group cardinality can still be part
    # of a conditionally possible union. Model that case explicitly rather
    # than silently calling it "no admissible group".
    evidence_by_id={n["id"]:n for n in nodes}
    blocked_reasons={x["node_id"]:x["reasons"] for x in blocked}
    scope_reasons={"DIFFERENT_OR_UNKNOWN_QUOTATION_SCOPE",
                   "UNTRANSPORTED_HYPOTHETICAL_SCOPE",
                   "EXISTENTIAL_ASSERTION_NOT_ENTITY_PRESENCE",
                   "UNKNOWN_GROUP_CARDINALITY",
                   "NONPLURAL_GROUP"}
    union_diagnostics=[]
    possible_unions=[]
    for union in unions:
        members=[evidence_by_id[x] for x in union["component_ids"]]
        if any(set(blocked_reasons.get(m["id"],[])) & scope_reasons for m in members):
            verdict="HOLD_UNION_UNVERIFIED_ASSERTION_SCOPE"
        elif constraint is not None and constraint.get("status")=="UNPARSED_TARGET_QUANTITY_HOLD":
            verdict="HOLD_UNPARSED_TARGET_REQUIREMENT"
        elif constraint is not None and constraint["counter"]!=union["counter"]:
            verdict="CONDITIONALLY_REFUTED_COUNTER_TYPE"
        elif constraint is not None:
            verdict=target_test(union["conditional_set_bounds"],constraint["cardinality"])
        else:
            verdict="POSSIBLE_UNDER_SET_ASSUMPTIONS_NOT_SEMANTIC_GOLD"
        union_diagnostics.append({"union_id":union["id"],"verdict":verdict,
                                  "semantic_reference_admitted":False})
        if verdict in ("POSSIBLE_UNDER_SET_ASSUMPTIONS_NOT_SEMANTIC_GOLD",
                       "NOT_REFUTED_NOT_VALIDATED",
                       "UNRESOLVED_OVERLAP_MAY_MATTER"):
            possible_unions.append(union)
    eligible.sort(key=lambda n:(target_start-n["witness"]["global_end"],n["id"]))
    near=([n for n in eligible if
           (target_start-n["witness"]["global_end"])-
           (target_start-eligible[0]["witness"]["global_end"])<=AMBIGUITY_DISTANCE]
          if eligible else [])
    selected=None
    if constraint is not None and constraint.get("status")=="UNPARSED_TARGET_QUANTITY_HOLD":
        status="HOLD_UNPARSED_TARGET_REQUIREMENT"
    elif possible_unions and near:
        status="HOLD_COORDINATED_COMPOSITION_AMBIGUOUS"
    elif possible_unions:
        status="HOLD_UNRESOLVED_COORDINATED_UNION_ONLY"
    elif len(near)>1:
        status="ABSTAIN_COMPETING_GROUPS"
    elif not near:
        status="ABSTAIN_NO_ADMISSIBLE_GROUP"
    else:
        selected=near[0]
        status="PROVISIONAL_SINGLE_GROUP_SOURCE_FRAGMENT"
    # A prefix-state hash must NOT incorporate optional post-target constraints.
    prefix_state={"version":VERSION,"window":window,
                  "prefix_sha256":hashlib.sha256(prefix.encode("utf-8")).hexdigest(),
                  "target_global_start":target_start,
                  "node_ids":[x["id"] for x in nodes],
                  "union_ids":[x["id"] for x in unions],
                  "events":events}
    state_digest=_id("R4_PREFIX_STATE",prefix_state)
    decision_digest=_id("R4_DECISION",{
        "prefix_state_sha256":state_digest,
        "blocked":blocked,
        "eligible_ids":[n["id"] for n in eligible],
        "possible_union_ids":[u["id"] for u in possible_unions],
        "union_diagnostics":union_diagnostics,
        "target_local_constraint":constraint,
        "status":status,
        "selected_id":selected["id"] if selected else None})
    return {"status":status,"selected":selected,
            "nodes":nodes,"unions":unions,"blocked":blocked,
            "eligible_ids":[n["id"] for n in eligible],
            "competing_union_ids":[u["id"] for u in possible_unions],
            "union_diagnostics":union_diagnostics,"decision_sha256":decision_digest,
            "target_local_constraint":constraint,"state_sha256":state_digest,
            "prefix_sha256":prefix_state["prefix_sha256"],"events":events,
            "source_custody":"STRICT_UNIT_WITNESSES_VERIFIED",
            "human_ground_truth":None,"semantic_accuracy":None,
            "scope_authority":"SURFACE_SCOPE_PROPOSALS_NOT_TRUTH"}


def verify_graph(forms, result):
    """Independent source-span admission for both components and coordination."""
    _check_forms(forms)
    id_to_node={x["id"]:x for x in result.get("nodes",[])}
    if len(id_to_node)!=len(result.get("nodes",[])):
        return False
    for node in result.get("nodes",[]):
        if not verify_witness(forms,node["witness"]):
            return False
    for union in result.get("unions",[]):
        ids=union.get("component_ids",[])
        if len(ids)!=2 or any(x not in id_to_node for x in ids):
            return False
        if any(not verify_witness(forms,w) for w in union["component_witnesses"]):
            return False
        if [id_to_node[i]["witness"] for i in ids]!=union["component_witnesses"]:
            return False
        if not verify_witness(forms,union["coordinator_witness"]):
            return False
        if union["total_cardinality"] is not None or union["reference_licensed"] is not False:
            return False
        expected=union_bounds(
            [id_to_node[i]["cardinality"] for i in ids],
            same_counter=id_to_node[ids[0]]["counter"]==id_to_node[ids[1]]["counter"])
        if union.get("conditional_set_bounds")!=expected:
            return False
    return True
