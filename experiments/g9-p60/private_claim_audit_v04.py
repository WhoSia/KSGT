#!/usr/bin/env python3
"""G9-P60-P2 v04: independent cross-language claim and private-byte auditor.

Default GitHub CI only checks public hashes and authority metadata. The optional
private packet stays local and never constitutes independent semantic or reader gold.
"""
import argparse
import copy
import hashlib
import json
import zipfile
from pathlib import Path

P = Path(__file__).resolve().parent
SRC = P.parent / "g9-p53" / "krc_v03" / "new_briefs.json"
PUBLIC = P / "claim_alignment_v04.json"
POLICIES = ["NO_EDIT", "MINIMAL_ATTRIBUTION", "ORDINARY_SMOOTH", "P59_DISCOURSE"]
IDS = ["F1", "F2", "F3", "F4", "F5", "U1", "U2", "U3"]
BASE = "a6edd668bdaa2f35cf38504b27177374d8eb0b95d13d45c92cc2503b40059596"
ZIP_SHA = "e103185725bbc328dbb13ad90fafa83d9cc4089c8829ad1a78e211045e047d46"

def sha(data):
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode("utf8")).hexdigest()

def public_audit(doc, original):
    if doc.get("schema") != "ksgt.p60.p2.claim-alignment.v04":
        raise ValueError("UNEXPECTED_LEDGER_SCHEMA")
    if doc["sourceBriefJsonSha256"] != sha(SRC.read_bytes()):
        raise ValueError("BRIEF_SHA_MISMATCH")
    source = next(x for x in original["briefs"] if x["id"] == "EX09")
    items = source["facts"] + source["uncertainties"]
    if len(items) != 8 or len(doc["sourceClaims"]) != 8:
        raise ValueError("SOURCE_CARDINALITY")
    for i, (claim, text) in enumerate(zip(doc["sourceClaims"], items)):
        if claim["claimId"] != IDS[i] or claim["contentSha256"] != sha(text):
            raise ValueError("SOURCE_QUOTE_SHA_MISMATCH")
    if doc["sourceWorkId"] != "P53_BRIEF:EX09" or doc["split"] != "pilot_train" or doc["freshHoldout"] is not False:
        raise ValueError("SPLIT_ESCAPE")
    if len(doc["policyRecords"]) != 4 or [x["policy"] for x in doc["policyRecords"]] != POLICIES:
        raise ValueError("POLICY_REGISTRY")
    if doc["baseParagraphSha256"] != BASE:
        raise ValueError("PARENT_SHA_CHANGED")
    if doc["measurementAuthority"]["independentKoreanReaderRatings"] != 0 or doc["measurementAuthority"]["independentSemanticAcceptanceCount"] != 0:
        raise ValueError("PREMATURE_SEMANTIC_OR_HUMAN_PROMOTION")
    for r in doc["policyRecords"]:
        if r["parentParagraphSha256"] != BASE or r["split"] != "pilot_train":
            raise ValueError("PARENT_SPLIT_LEAK")
        if r["axes"]["sourceAdmissibility"] != "HOLD_INCOMPLETE_INDEPENDENT_SEMANTIC_REVIEW" or r["axes"]["nativeReaderPreference"] != "NOT_OBSERVED":
            raise ValueError("PREMATURE_SEMANTIC_OR_HUMAN_PROMOTION")
        if len(r["alignment"]) != 8 or [x["claimId"] for x in r["alignment"]] != IDS:
            raise ValueError("ALIGNMENT_NOT_COMPLETE")
        if any(a["judgmentAuthority"] != "AUTHOR_ANNOTATION_NOT_INDEPENDENT_GOLD" for a in r["alignment"]):
            raise ValueError("ANALYST_AS_GOLD")
    return source

def private_audit(doc, packet, archive=None):
    if packet["schema"] != "ksgt.p60.p2.private-policy-packet.v04" or packet["sourceBriefSha256"] != doc["sourceBriefJsonSha256"]:
        raise ValueError("PRIVATE_PACKET_WRONG_SOURCE")
    if packet["sourceArchiveSha256"] != ZIP_SHA or packet["independentReaderCount"] != 0 or packet["independentSemanticGoldCount"] != 0:
        raise ValueError("UNWITNESSED_PRIVATE_AUTHORITY")
    if len(packet["records"]) != 4:
        raise ValueError("PRIVATE_POLICY_COUNT")
    if archive is not None:
        if sha(archive.read_bytes()) != ZIP_SHA:
            raise ValueError("ZIP_SHA_MISMATCH")
        with zipfile.ZipFile(archive) as z:
            rows = json.loads(z.read("outcomes/krc_v03_six_drafts.json"))["documents"]
        original = next(r["output"] for r in rows if r["brief"] == "EX09" and r["arm"] == "K_TYPED_PLAN").split("\n\n")[0]
        if sha(original) != BASE or original != packet["records"][0]["text"]:
            raise ValueError("ORIGINAL_PARAGRAPH_MISMATCH")
    count = 0
    for pub, private in zip(doc["policyRecords"], packet["records"]):
        if private["policy"] != pub["policy"] or sha(private["text"]) != pub["paragraphSha256"]:
            raise ValueError("PRIVATE_TEXT_SHA_MISMATCH")
        if private["originParagraphSha256"] != BASE:
            raise ValueError("PRIVATE_PARENT_SHA_MISMATCH")
        aligned = private["claimAlignment"]
        if len(aligned) != 8:
            raise ValueError("PRIVATE_CLAIM_COUNT")
        commitment = sha(json.dumps(aligned, ensure_ascii=False, separators=(",", ":")))
        if commitment != pub["alignmentWitnessSha256"]:
            raise ValueError("ALIGNMENT_COMMITMENT_MISMATCH")
        for expected, actual in zip(pub["alignment"], aligned):
            if actual["claimId"] != expected["claimId"] or actual["analystInterpretation"] != expected["analystInterpretation"] or actual["judgmentAuthority"] != expected["judgmentAuthority"] or len(actual["surfaceSpans"]) != expected["spanCount"]:
                raise ValueError("PRIVATE_ALIGNMENT_METADATA_MISMATCH")
            for span in actual["surfaceSpans"]:
                start, end = span["beginCodepoint"], span["endCodepoint"]
                if not isinstance(start, int) or not isinstance(end, int) or not (0 <= start < end <= len(private["text"])) or sha(private["text"][start:end]) != span["sha256"]:
                    raise ValueError("PRIVATE_SPAN_SHA_MISMATCH")
                count += 1
    return {"sourceBrief": "EX09", "policies":4, "claimCells":32, "spanHashesChecked":count, "archiveWitness": archive is not None, "historicallyExposedSourceWorks":1, "independentSemanticGold":0, "humanPreferences":0}

def public_tests(doc, original):
    cases = [
      (lambda d:d["sourceClaims"][0].update(contentSha256="0"*64), "SOURCE_QUOTE_SHA_MISMATCH"),
      (lambda d:d.update(split="pilot_dev"), "SPLIT_ESCAPE"),
      (lambda d:d["policyRecords"][0]["axes"].update(sourceAdmissibility="PASS"), "PREMATURE_SEMANTIC_OR_HUMAN_PROMOTION"),
    ]
    for mutate, expected in cases:
        trial=copy.deepcopy(doc); mutate(trial)
        try: public_audit(trial, original)
        except ValueError as exc:
            if str(exc) != expected: raise
        else: raise AssertionError("MISSED_PUBLIC_CONTROL:"+expected)
    return len(cases)

def private_tests(doc, packet):
    cases=[
      (lambda d,p:p["records"][0].update(text=p["records"][0]["text"]+"더"), "PRIVATE_TEXT_SHA_MISMATCH"),
      (lambda d,p:p["records"][2]["claimAlignment"][0]["surfaceSpans"][0].update(sha256="0"*64), "ALIGNMENT_COMMITMENT_MISMATCH"),
      (lambda d,p:p["records"][1].update(originParagraphSha256="0"*64), "PRIVATE_PARENT_SHA_MISMATCH"),
      (lambda d,p:p.update(independentReaderCount=1), "UNWITNESSED_PRIVATE_AUTHORITY"),
      (lambda d,p:p.update(sourceBriefSha256="0"*64), "PRIVATE_PACKET_WRONG_SOURCE"),
      (lambda d,p:p["records"].pop(), "PRIVATE_POLICY_COUNT"),
    ]
    for change, expected in cases:
        d,p=copy.deepcopy(doc),copy.deepcopy(packet);change(d,p)
        try: private_audit(d,p)
        except ValueError as exc:
            if str(exc) != expected: raise
        else: raise AssertionError("MISSED_PRIVATE_CONTROL:"+expected)
    trial=copy.deepcopy(doc)
    trial["policyRecords"][0]["axes"]["sourceAdmissibility"]="PASS"
    try: public_audit(trial, json.loads(SRC.read_text("utf8")))
    except ValueError as exc:
        if str(exc)!="PREMATURE_SEMANTIC_OR_HUMAN_PROMOTION": raise
    else: raise AssertionError("MISSED_UNWITNESSED_SEMANTIC_PASS")
    return len(cases)+1

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--private-packet",type=Path)
    parser.add_argument("--archive",type=Path)
    parser.add_argument("--self-test",action="store_true")
    a=parser.parse_args()
    if a.archive and not a.private_packet: parser.error("--archive requires --private-packet")
    doc=json.loads(PUBLIC.read_text("utf8"))
    original=json.loads(SRC.read_text("utf8"))
    public_audit(doc,original)
    result={"test":"PASS","scope":"PUBLIC_SOURCE_CLAIM_METADATA_ONLY","publicClaims":8,"policyCount":4,"semanticGold":0,"humanPreference":0}
    if a.self_test:result["publicNegativeControls"]=public_tests(doc,original)
    if a.private_packet:
        packet=json.loads(a.private_packet.read_text("utf8"))
        result.update(private_audit(doc,packet,a.archive))
        if a.self_test:result["privateNegativeControls"]=private_tests(doc,packet)
        result["scope"]="PRIVATE_TEXT_BYTE_AND_CLAIM_SPAN_HASH_CHECK"
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=="__main__":main()
