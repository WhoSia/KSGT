import json,sys,urllib.request
out=sys.argv[1]
url="https://kli.korean.go.kr/corpus/main/requestMain.do?lang=en"
status={"source":"NIKL Zero Anaphora Corpus 2020","catalog_url":url,"catalog_recovered":False,"corpus_bytes_acquired":False,"gold_annotation_execution":False,"authority":"SOURCE_RECOVERED_BYTES_HOLD"}
try:
    req=urllib.request.Request(url,headers={"User-Agent":"KSGT-R8/1.0"})
    with urllib.request.urlopen(req,timeout=60) as r:
        html=r.read().decode("utf-8","ignore")
    hit=("Zero Anaphora Corpus 2020" in html) or ("Zero Anaphora" in html) or ("무형 대용어" in html)
    status["catalog_recovered"]=bool(hit)
    status["http_bytes"]=len(html.encode("utf-8"))
    status["description_match"]=("omitted subjects and objects" in html.lower()) or ("주어" in html and "목적어" in html)
except Exception as e:
    status["fetch_error"]=type(e).__name__+":"+str(e)[:180]
json.dump(status,open(out,"w"),ensure_ascii=False,indent=2)
print(json.dumps(status,ensure_ascii=False,indent=2))
