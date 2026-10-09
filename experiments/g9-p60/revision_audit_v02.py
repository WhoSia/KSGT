#!/usr/bin/env python3
"""G9-P60 P1: independent provenance JSON verification; no private P53 prose required."""
import copy
import json
import re
import sys

SHA = re.compile(r"^[0-9a-f]{64}$")
def audit(doc):
    if doc.get("schema") != "ksgt.p60.provisional-revision-court.v02":
        raise ValueError("BAD_SCHEMA")
    if doc.get("distinctSourceWorks") != 6:
        raise ValueError("SOURCE_COMPONENT_COUNT")
    if (doc.get("independentHumanPreferenceCount") != 0 or
        doc.get("independentSemanticallyAcceptedEdits") != 0 or
        doc.get("empiricallyValidatedImprovementCount") != 0):
        raise ValueError("UNWITNESSED_EVALUATION_PROMOTION")
    records = doc["records"]
    if len(records) != 2 or len({r["id"] for r in records}) != 2:
        raise ValueError("DUPLICATE_OR_MISSING_CANDIDATE")
    base_identifiers = set()
    mutation_count = 0
    for r in records:
        if any(not SHA.fullmatch(r.get(k, "")) for k in
               ("baseParagraphSha256", "revisionParagraphSha256")):
            raise ValueError("INVALID_HASH")
        if (r["sourceSplit"] != "pilot_train" or
            r["sourceComponentId"] != "P53_WORK:EX09" or
            r["sourceWorkId"] != "P53_BRIEF:EX09" or
            not r["historicallyExposed"] or r["freshHoldout"] is not False):
            raise ValueError("CONTAMINATED_OR_UNKNOWN_SOURCE")
        if (r["independentSemanticAdmissibility"] != "HOLD" or
            r["independentHumanPreference"] != "NOT_OBSERVED" or
            r["humanEvidenceIds"] != []):
            raise ValueError("HUMAN_OR_SEMANTIC_GOLD_LAUNDERING")
        if r["kind"] != "ASSISTANT_PROVISIONAL_REVISION":
            raise ValueError("FALSELY_HUMAN_EDIT")
        base_identifiers.add((r["baseParagraphId"], r["baseParagraphSha256"]))
        mutation_count += bool(r["countMutatedRelativeToDraft"])
        if r["surfaceSourceLabelRemoved"] and r["epistemicRisk"] != "ATTRIBUTION_REMOVAL_UNADJUDICATED":
            raise ValueError("UNACKNOWLEDGED_ATTRIBUTION_RISK")
    if len(base_identifiers) != 1 or mutation_count != 1:
        raise ValueError("PAIR_CONTRACT_BROKEN")
    return {"audit": "PASS", "records": len(records),
            "sameBaseParagraph": True, "knownRelativeCountMutation": mutation_count,
            "humanPreferences": 0, "newSourceContentRead": False}

def test(document):
    result = audit(document)
    def poison(change, expected):
        d = copy.deepcopy(document)
        change(d)
        try: audit(d)
        except ValueError as exc:
            if str(exc) != expected: raise
        else: raise AssertionError("MISSING_REJECTION:" + expected)
    poison(lambda d: d["records"][1].update(sourceSplit="pilot_dev"),
           "CONTAMINATED_OR_UNKNOWN_SOURCE")
    poison(lambda d: d["records"][0].update(independentSemanticAdmissibility="PASS"),
           "HUMAN_OR_SEMANTIC_GOLD_LAUNDERING")
    poison(lambda d: d["records"][0].update(kind="HUMAN_REVISION"),
           "FALSELY_HUMAN_EDIT")
    poison(lambda d: d["records"][0].update(epistemicRisk="NONE"),
           "UNACKNOWLEDGED_ATTRIBUTION_RISK")
    poison(lambda d: d["records"][0].update(baseParagraphSha256="invalid"),
           "INVALID_HASH")
    result["negativeControls"] = 5
    return result

if __name__ == "__main__":
    print(json.dumps(test(json.load(sys.stdin)), ensure_ascii=False, sort_keys=True))
