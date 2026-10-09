#!/usr/bin/env python3
"""G9-P60 P2 v05: cross-language EX10 source contract and EX09 countermodels.
Public CI checks facts and authority only. It does NOT adjudicate Korean semantics.
"""
import argparse,copy,hashlib,json
from pathlib import Path
P=Path(__file__).resolve().parent
SOURCE=P.parent/"g9-p53/krc_v03/new_briefs.json"
LEDGER=P/"solo_ex09_ex10_ledger_v05.json"
SHA=lambda x:hashlib.sha256(x if isinstance(x,bytes) else x.encode("utf8")).hexdigest()
ORDER=["NO_EDIT","MINIMAL_REPAIR","ORDINARY_SMOOTH","P59_DISCOURSE"]
def audit(d,raw):
    if d.get("schema")!="ksgt.p60.p2.solo-ex09-ex10-public-ledger.v05":raise ValueError("SCHEMA")
    if d["sourceBriefSha256"]!=SHA(raw):raise ValueError("SOURCE_SHA")
    x=next(z for z in json.loads(raw)["briefs"] if z["id"]=="EX10")
    items=x["facts"]+x["uncertainties"]
    if len(items)!=8 or len(d["EX10SourceClaims"])!=8:raise ValueError("CARDINALITY")
    for i,(c,value) in enumerate(zip(d["EX10SourceClaims"],items)):
        if c["id"]!=("F" if i<5 else "U")+str(i+1 if i<5 else i-4) or c["sha256"]!=SHA(value):raise ValueError("EX10_CLAIM_SHA")
    if d["sourceUnits"]!=["P53_BRIEF:EX09","P53_BRIEF:EX10"] or "NOT_FRESH" not in d["sourcePairHistory"]:raise ValueError("SOURCE_DISJOINT_MISREPORT")
    if [c["policy"] for c in d["EX10Policies"]]!=ORDER or len({c["sha256"] for c in d["EX10Policies"]})!=4:raise ValueError("FOUR_ARMS")
    if d["EX10Policies"][0]["sha256"]!=d["EX10BaseFullDraftSha256"]:raise ValueError("NOT_ORIGINAL_NO_EDIT")
    for c in d["EX10Policies"]:
        if c["readerPreference"]!="NOT_OBSERVED" or c["independentMeaning"]!="NOT_OBSERVED":raise ValueError("GOLD_OVERPROMOTION")
    e=d["evaluation"]
    if e["sourceComponents"]!=2 or e["humanReaders"]!=0 or e["independentSemanticGold"]!=0 or e["prospectivelyFreshExternalSourceWorks"]!=0 or e["subjectiveHumanRatings"]!=0:raise ValueError("FALSE_INDEPENDENCE")
    if not e["charLengthConfound"] or not e["labelsAndTextsPrivate"]:raise ValueError("MASKING_CONTRACT")
    cm=d["EX09U2CountermodelContract"]
    world=cm["witnessModels"]
    if len(world)!=2 or cm["entails"] is not False:raise ValueError("COUNTERMODEL_INVALID")
    for w in world:
        if not all(w[k] for k in ["sizeEqual","seedTypeEqual","waterEqual","windowPlacementDifferent","sproutsMoreAtWindow"]):raise ValueError("COUNTERMODEL_SOURCE_FAIL")
        if w["measuredLight"] or w["measuredTemp"]:raise ValueError("COUNTERMODEL_MEASUREMENT_FAIL")
    ambient=lambda w:w["soilEqual"] and w["actualTempEqual"] and w["actualLightEqual"]
    if sorted(ambient(w) for w in world)!=[False,True]:raise ValueError("COUNTERMODEL_INSUFFICIENT")
    if cm["verdict"]!="STRICT_EQUALITY_NOT_ENTAILED_AMBIGUOUS_MODAL_EXPECTATION_HOLD":raise ValueError("VERDICT_OVERSTATEMENT")
    return {"test":"PASS","sourceCases":2,"ex10SourceClaims":8,"ex10CandidateCount":4,"symbolicCountermodels":2,"independentHumanPreference":0}
def attack(d,raw):
    examples=[
      ("SOURCE_SHA",lambda x:x.update(sourceBriefSha256="0"*64)),
      ("EX10_CLAIM_SHA",lambda x:x["EX10SourceClaims"][0].update(sha256="0"*64)),
      ("FALSE_INDEPENDENCE",lambda x:x["evaluation"].update(humanReaders=1)),
      ("GOLD_OVERPROMOTION",lambda x:x["EX10Policies"][0].update(independentMeaning="PASS")),
      ("FOUR_ARMS",lambda x:x["EX10Policies"].pop()),
      ("COUNTERMODEL_SOURCE_FAIL",lambda x:x["EX09U2CountermodelContract"]["witnessModels"][1].update(waterEqual=False)),
      ("COUNTERMODEL_INSUFFICIENT",lambda x:x["EX09U2CountermodelContract"]["witnessModels"][1].update(soilEqual=True,actualTempEqual=True,actualLightEqual=True)),
      ("COUNTERMODEL_MEASUREMENT_FAIL",lambda x:x["EX09U2CountermodelContract"]["witnessModels"][0].update(measuredLight=True)),
      ("MASKING_CONTRACT",lambda x:x["evaluation"].update(labelsAndTextsPrivate=False)),
      ("VERDICT_OVERSTATEMENT",lambda x:x["EX09U2CountermodelContract"].update(verdict="HUMAN_SEMANTICS_PASS"))
    ]
    for expected,mutation in examples:
        x=copy.deepcopy(d);mutation(x)
        try:audit(x,raw)
        except ValueError as ex:
            if str(ex)!=expected:raise AssertionError(str(ex)+" != "+expected)
        else:raise AssertionError("NOT_REJECTED_"+expected)
    return len(examples)
def main():
    ap=argparse.ArgumentParser();ap.add_argument("--self-test",action="store_true");args=ap.parse_args()
    d=json.loads(LEDGER.read_text("utf8"));raw=SOURCE.read_bytes();out=audit(d,raw)
    if args.self_test:out["negativeControls"]=attack(d,raw)
    print(json.dumps(out,ensure_ascii=False,indent=2))
if __name__=="__main__":main()
