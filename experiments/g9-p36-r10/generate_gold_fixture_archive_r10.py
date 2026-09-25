import json,sys,zipfile,tempfile,os
out=sys.argv[1]
legacy={"id":"NXZA20FIX","metadata":{"year":"2020","annotation_level":["무형 대용어 복원"]},"document":[{"id":"D1","sentence":[
{"id":"S1","form":"철수가 사과를 샀다.","ZA":[]},
{"id":"S2","form":"먹었다.","ZA":[{"predicate":{"form":"먹었다","sentence_id":"S2","begin":0,"end":3},"antecedent":[
{"form":"철수","type":"subject","sentence_id":"S1","begin":0,"end":2},{"form":"사과","type":"object","sentence_id":"S1","begin":4,"end":6}]}]}]}]}
new={"id":"NXZA25FIX","metadata":{"year":"2025","annotation_level":["무형 대용어 복원"]},"document":[{"id":"D2","sentence":[
{"id":"T1","form":"영희가 책을 읽었다.","DP":[],"SRL":[],"ZA":[]},
{"id":"T2","form":"재미있었다.","DP":[],"SRL":[],"ZA":[{"predicate":{"form":"재미있었다","sentence_id":"T2","word_id":1,"begin":0,"end":5},"ellipsis":[
{"restored":{"form":"책이","type":"subject"},"antecedent":{"form":"책","sentence_id":"T1","begin":4,"end":5}},
{"restored":{"form":"그것이","type":"complement"},"antecedent":{"form":"그것","sentence_id":None,"begin":None,"end":None}}]}]}]}]}
os.makedirs(os.path.dirname(out) or ".",exist_ok=True)
with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
    z.writestr("legacy_2020.json",json.dumps(legacy,ensure_ascii=False,indent=2))
    z.writestr("za_2025.json",json.dumps(new,ensure_ascii=False,indent=2))
print(json.dumps({"fixture":out,"families":2,"expected_slots":4}))
