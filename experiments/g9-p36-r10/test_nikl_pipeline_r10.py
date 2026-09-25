import json,os,tempfile,sys
sys.path.insert(0,os.path.dirname(__file__))
from nikl_schema_r10 import census
from nikl_adapter_r10 import run

def dump(p,x):
    os.makedirs(os.path.dirname(p),exist_ok=True)
    json.dump(x,open(p,"w",encoding="utf-8"),ensure_ascii=False,indent=2)

legacy={"id":"NXZA20TEST","metadata":{"year":"2020","annotation_level":["무형 대용어 복원"]},"document":[
 {"id":"D1","sentence":[
  {"id":"S1","form":"철수가 사과를 샀다.","ZA":[]},
  {"id":"S2","form":"먹었다.","ZA":[{"predicate":{"form":"먹었다","sentence_id":"S2","begin":0,"end":3},
     "antecedent":[{"form":"철수","type":"subject","sentence_id":"S1","begin":0,"end":2},
                   {"form":"사과","type":"object","sentence_id":"S1","begin":4,"end":6}]}]}
 ]}]}

v2025={"id":"NXZA25TEST","metadata":{"year":"2025","annotation_level":["무형 대용어 복원"]},"document":[
 {"id":"D2","sentence":[
  {"id":"T1","form":"영희가 책을 읽었다.","DP":[],"SRL":[],"ZA":[]},
  {"id":"T2","form":"재미있었다.","DP":[],"SRL":[],"ZA":[{"predicate":{"form":"재미있었다","sentence_id":"T2","word_id":1,"begin":0,"end":5},
     "ellipsis":[
       {"restored":{"form":"책이","type":"subject"},"antecedent":{"form":"책","sentence_id":"T1","begin":4,"end":5}},
       {"restored":{"form":"그것이","type":"complement"},"antecedent":{"form":"그것","sentence_id":None,"begin":None,"end":None}}
     ]}]}
 ]}]}

trans={"id":"NXZATRANS","document":[{"id":"D3","sentence":[
 {"id":"U1","form":"왔다.","ZA":[{"predicate":{"form":"왔다","sentence_id":"U1","begin":0,"end":2},
   "restored":[{"form":"민수가","type":"subject"}],
   "antecedent":[{"form":"민수","sentence_id":"U0","begin":0,"end":2}]}]}
]}]}

expect=[("legacy",legacy,"NIKL_ZA_LEGACY_2020_2024",2),
        ("v2025",v2025,"NIKL_ZA_ELLIPSIS_2025",2),
        ("transitional",trans,"NIKL_ZA_TRANSITIONAL_RESTORED",1)]
results=[]
with tempfile.TemporaryDirectory(prefix="ksgt-r10-fixture-") as td:
    for name,obj,fam,n in expect:
        src=os.path.join(td,name+".json");dump(src,obj)
        od=os.path.join(td,name);c=census(src,od)
        if c["state"]!="READY" or c["schema_family_counts"].get(fam)!=1:raise AssertionError((name,c))
        a=run(src,os.path.join(od,"schema_census.json"),od)
        if a["records"]!=n:raise AssertionError((name,a))
        results.append({"name":name,"family":fam,"records":n,"state":"PASS"})
out=sys.argv[1] if len(sys.argv)>1 else "experiments/g9-p36-r10/final/nikl_fixture_tests.json"
os.makedirs(os.path.dirname(out),exist_ok=True);json.dump({"pass":True,"fixtures":results},open(out,"w"),indent=2)
print(json.dumps({"pass":True,"fixtures":results},indent=2))
