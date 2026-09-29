import json,os,sys
out=sys.argv[1];os.makedirs(out,exist_ok=True)
D=["semantic_fidelity","referential_recoverability","discourse_coherence","information_structure_fit","register_style_fit","non_redundancy"]
def obj(vals):
    return {k:{"lo":v[0],"hi":v[1]} for k,v in zip(D,vals)}
cases={
"future_only_omission_infeasible":{
 "actions":[
  {"name":"OMIT","feasible":False,"objectives":obj([(1,1)]*6)},
  {"name":"OVERT","feasible":True,"objectives":obj([(0.8,1)]*6)}
 ],"expected":["OVERT"]},
"robust_omit_dominates":{
 "actions":[
  {"name":"OMIT","feasible":True,"objectives":obj([(1,1),(1,1),(0.9,1),(0.9,1),(0.9,1),(0.9,1)])},
  {"name":"OVERT","feasible":True,"objectives":obj([(1,1),(0.7,0.8),(0.7,0.8),(0.7,0.8),(0.7,0.8),(0.4,0.6)])}
 ],"expected":["OMIT"]},
"tradeoff_preserves_frontier":{
 "actions":[
  {"name":"OMIT","feasible":True,"objectives":obj([(1,1),(0.8,1),(0.8,1),(0.7,1),(0.9,1),(0.9,1)])},
  {"name":"OVERT","feasible":True,"objectives":obj([(1,1),(1,1),(0.9,1),(0.9,1),(0.7,1),(0.4,0.7)])}
 ],"expected":["OMIT","OVERT"]},
"role_uncertainty_prevents_collapse":{
 "actions":[
  {"name":"OMIT","feasible":True,"objectives":obj([(0.7,1),(0.6,1),(0.7,1),(0.6,1),(0.8,1),(0.8,1)])},
  {"name":"OVERT","feasible":True,"objectives":obj([(0.8,1),(0.8,1),(0.8,1),(0.7,1),(0.7,1),(0.4,0.8)])}
 ],"expected":["OMIT","OVERT"]},
"three_way_open_frontier":{
 "actions":[
  {"name":"OMIT","feasible":True,"objectives":obj([(1,1),(0.7,1),(0.8,1),(0.7,1),(0.9,1),(0.9,1)])},
  {"name":"OVERT","feasible":True,"objectives":obj([(1,1),(1,1),(0.9,1),(0.9,1),(0.7,1),(0.4,0.7)])},
  {"name":"PRONOMINAL_OR_MARKED","feasible":True,"objectives":obj([(1,1),(0.9,1),(0.8,1),(0.8,1),(0.8,1),(0.7,0.9)])}
 ],"expected":["OMIT","OVERT","PRONOMINAL_OR_MARKED"]}
}
for n,c in cases.items():
    exp=c.pop("expected")
    json.dump(c,open(os.path.join(out,n+".json"),"w"),indent=2)
    json.dump(exp,open(os.path.join(out,n+".expected.json"),"w"))
print(json.dumps({"cases":len(cases),"names":list(cases)}))
