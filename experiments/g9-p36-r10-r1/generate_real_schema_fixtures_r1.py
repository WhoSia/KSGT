import json,os,sys
out=sys.argv[1];os.makedirs(out,exist_ok=True)
legacy={'id':'LEGACY','document':[{'id':'D20','sentence':[{'id':'S1','form':'철수가 사과를 샀다.'},{'id':'S2','form':'먹었다.'}],
'ZA':[{'predicate':{'form':'먹었다','sentence_id':'S2','begin':0,'end':3},'antecedent':[{'form':'철수','type':'subject','sentence_id':'S1','begin':0,'end':2},{'form':'누군가','type':'object','sentence_id':'-1','begin':-1,'end':-1}]}]}]}
modern={'id':'MODERN','document':[{'id':'D25','sentence':[{'id':'T1','form':'패치 노트를 읽었다.','ZA':[]},{'id':'T2','form':'수정했다.','ZA':[{'predicate':{'form':'수정했다','sentence_id':'T2'},'ellipsis':[{'restored':{'form':'패치 노트를','type':'object'},'antecedent':[{'form':'패치','sentence_id':'T1','begin':0,'end':2},{'form':'노트','sentence_id':'T1','begin':3,'end':5}]},{'restored':{'form':'그가','type':'subject'},'antecedent':[{'form':'#','sentence_id':'#','begin':-1,'end':-1}]},{'restored':{},'antecedent':[]}]}]}]}]}
for name,obj in [('actual2020.json',legacy),('actual2025.json',modern)]:json.dump(obj,open(os.path.join(out,name),'w'),ensure_ascii=False,indent=2)
print(json.dumps({'out':out,'files':2}))
