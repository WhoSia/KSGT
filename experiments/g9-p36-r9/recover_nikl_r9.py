import json,re,sys,urllib.request,urllib.parse
out=sys.argv[1]
pages=["https://kli.korean.go.kr/corpus/main/requestMain.do?lang=en","https://kli.korean.go.kr/request/corpusRegist.do?lang=en"]
status={"source":"NIKL Zero Anaphora Corpus 2020","catalog_recovered":False,"annotation_bytes_acquired":False,"gold_execution_ready":False,"authority":"USER_ACQUISITION_REQUIRED"}
for url in pages:
 try:
  req=urllib.request.Request(url,headers={"User-Agent":"KSGT-R9/1.0"})
  html=urllib.request.urlopen(req,timeout=60).read().decode("utf-8","ignore")
  if "Zero Anaphora Corpus 2020" in html or "무형 대용어 복원 말뭉치 2020" in html:
   status["catalog_recovered"]=True;status["catalog_url"]=url;status["catalog_sha256"]=__import__("hashlib").sha256(html.encode()).hexdigest();status["request_or_preview_flow"]=bool(("Request" in html) or ("신청" in html) or ("장바구니" in html));break
 except Exception as e: status["fetch_error"]=type(e).__name__
status["reason"]="Official catalog is reachable, but no unauthenticated direct annotation archive was exposed to this execution lane. Preview/report material is not accepted as gold."
json.dump(status,open(out,"w"),ensure_ascii=False,indent=2);print(json.dumps(status,ensure_ascii=False,indent=2))
