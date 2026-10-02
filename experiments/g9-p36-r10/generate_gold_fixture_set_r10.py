import json,os,sys,zipfile,io
out=sys.argv[1];os.makedirs(out,exist_ok=True)
legacy={"id":"NXZA20FIX","metadata":{"year":"2020","annotation_level":["무형 대용어 복원"]},"document":[{"id":"D1","sentence":[
{"id":"S1","form":"철수가 사과를 샀다.","ZA":[]},{"id":"S2","form":"먹었다.","ZA":[{"predicate":{"form":"먹었다","sentence_id":"S2","begin":0,"end":3},"antecedent":[{"form":"철수","type":"subject","sentence_id":"S1","begin":0,"end":2},{"form":"사과","type":"object","sentence_id":"S1","begin":4,"end":6}]}]}]}]}
new={"id":"NXZA25FIX","metadata":{"year":"2025","annotation_level":["무형 대용어 복원"]},"document":[{"id":"D2","sentence":[
{"id":"T1","form":"영희가 책을 읽었다.","DP":[],"SRL":[],"ZA":[]},{"id":"T2","form":"재미있었다.","DP":[],"SRL":[],"ZA":[{"predicate":{"form":"재미있었다","sentence_id":"T2","word_id":1,"begin":0,"end":5},"ellipsis":[{"restored":{"form":"책이","type":"subject"},"antecedent":{"form":"책","sentence_id":"T1","begin":4,"end":5}},{"restored":{"form":"그것이","type":"complement"},"antecedent":{"form":"그것","sentence_id":None,"begin":None,"end":None}}]}]}]}]}
with zipfile.ZipFile(os.path.join(out,"nikl2020.zip"),"w",zipfile.ZIP_DEFLATED) as z:z.writestr("legacy.json",json.dumps(legacy,ensure_ascii=False))
inner=io.BytesIO()
with zipfile.ZipFile(inner,"w",zipfile.ZIP_DEFLATED) as z:z.writestr("za2025.json",json.dumps(new,ensure_ascii=False))
with zipfile.ZipFile(os.path.join(out,"nikl2025_nested.zip"),"w",zipfile.ZIP_DEFLATED) as z:z.writestr("delivery/data_inner.zip",inner.getvalue())
print(json.dumps({"out":out,"files":["nikl2020.zip","nikl2025_nested.zip"]}))
