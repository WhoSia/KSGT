import json,sys
out=sys.argv[1]
def role(slot,ref="A",recovery="EXPLICIT",witness=None,semantic=None,particle=None,source="FRAME_PLUS_CONTEXT"):
    return {"syntactic_slot":slot,"semantic_role":semantic,"referent":ref,"frame_status":"UNKNOWN","recovery":recovery,
            "witness":witness,"particle":particle,"role_source":source}
def graph(roles,predicate="보다",sense="SEE",scope=None,realization=None):
    return {"version":"KSGT-ARG-v1","event":{"predicate":predicate,"sense":sense},"roles":roles,
            "scope":scope or {},"discourse":{},"realization":realization or {}}
sub=role("SUBJECT","A",particle="이/가")
obj=role("OBJECT","B",particle="을/를")
tests=[
 {"id":"scrambling_same_roles","op":"equivalent","left":graph([sub,obj],realization={"order":["A","B"]}),
  "right":graph([sub,obj],realization={"order":["B","A"]}),"expected_pass":True},
 {"id":"topic_particle_same_slot","op":"equivalent","left":graph([{**sub,"particle":"은/는"},obj]),
  "right":graph([sub,obj]),"expected_pass":True},
 {"id":"recoverable_zero_subject","op":"equivalent","left":graph([sub,obj]),
  "right":graph([{**sub,"recovery":"ZERO_ANAPHORIC","witness":"NIKL:S1:0-1","particle":None},obj]),"expected_pass":True},
 {"id":"zero_without_witness","op":"validate","left":graph([{**sub,"recovery":"ZERO_ANAPHORIC","witness":None},obj]),"expected_pass":False},
 {"id":"particle_only_role_rejected","op":"validate","left":graph([{**sub,"role_source":"PARTICLE_ONLY"},obj]),"expected_pass":False},
 {"id":"syntactic_slot_not_semantic_role","op":"validate","left":graph([{**sub,"semantic_role":"AGENT","role_source":"SYNTACTIC_SLOT_ONLY"},obj]),"expected_pass":False},
 {"id":"slot_change_rejected","op":"equivalent","left":graph([sub,obj]),
  "right":graph([{**sub,"syntactic_slot":"OBJECT"},obj]),"expected_pass":False},
 {"id":"causative_added_causer","op":"equivalent","left":graph([sub,obj]),
  "right":graph([role("CAUSER","C"),sub,obj],predicate="보이다",sense="CAUSE_SEE"),"expected_pass":False},
 {"id":"scope_change_rejected","op":"equivalent","left":graph([sub,obj],scope={"quantifier":"ALL>NEG"}),
  "right":graph([sub,obj],scope={"quantifier":"NEG>ALL"}),"expected_pass":False},
 {"id":"honorific_realization_only","op":"equivalent","left":graph([sub,obj],realization={"honorific":False}),
  "right":graph([sub,obj],realization={"honorific":True}),"expected_pass":True},
 {"id":"generic_exophoric_without_witness","op":"validate","left":graph([role("SUBJECT",None,"ZERO_GENERIC_OR_EXOPHORIC")]),"expected_pass":True}
]
with open(out,"w",encoding="utf-8") as w:
    for t in tests:w.write(json.dumps(t,ensure_ascii=False)+"\n")
print(json.dumps({"controls":len(tests),"out":out}))
