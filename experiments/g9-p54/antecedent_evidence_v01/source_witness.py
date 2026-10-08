#!/usr/bin/env python3
"""P54: conservative preceding-sentence source witnesses, NOT antecedent gold."""
import argparse,collections,hashlib,json,re,zipfile
from pathlib import Path
ZIP_SHA="c0d65205de493dca86d98cef02cf1742844a3b9259caf0ec3dc7e48ddd62d05d"
MEMBERS={"NXZA2502512313.json":"b3aaefd241ae351c4c252cc493161d9be02232779a47bd7735195d0de87e8f86","SXZA2502512312.json":"717fbe35db08b91bd62fdfb2a29cdef8a2d91aa85d099f256e82802e8122e0cc"}
NUM=re.compile(r"(?:총\s*)?(?:\d+(?:,\d{3})*|두|세|네|다섯|몇|여러)\s*(?:명|개|건|팀|종|가지|권|장|마리|곳|차례)(?=$|[\s,.!?]|[은는이가을를에도과와]|이다)")
LEX=re.compile("|".join(map(re.escape,("후보","수강생","클래스","제안","팀","팬","종류","드라마","영상들","여행","사람들","유튜버","아티스트","멤버","챔피언","만화","게임","배우","직업","웹툰","팀원"))))
Q=re.compile(r"(\d[\d,]*)\s*(명|개|건|팀|종|가지|권|장|마리|곳)(?=$|[\s,.!?]|[은는이가을를에도과와]|이다)")
T=re.compile(r"그중(?:에서도|에서|에선|에)?\s*(\d[\d,]*)\s*(명|개|건|팀|종|가지|권|장|마리|곳)")
def sha(b):return hashlib.sha256(b).hexdigest()
def quantity(prior,target):
 m=T.search(target)
 if not m:return "NO_NUMERIC_TARGET"
 n=int(m[1].replace(",",""));q=m[2]
 groups=[int(v.replace(",","")) for sentence in prior[-2:] for v,unit in Q.findall(sentence) if unit==q]
 if len(groups)>1:return "MULTIPLE_COMPETING_NUMERIC_CUES"
 if len(groups)==1:return "UNIQUE_NUMERIC_COMPATIBILITY_ONLY" if groups[0]>=n else "NUMERIC_CONTRADICTION"
 return "NO_MATCHING_COUNTER"
def inspect(prior,target,following="",declared=None,writer_policy="CONTEXTUAL"):
 if not isinstance(prior,list) or not all(isinstance(t,str) for t in prior) or not isinstance(target,str) or "그중" not in target:raise ValueError("BAD_CONTEXT")
 if writer_policy not in ("CONTEXTUAL","KEEP","CLARIFY"):raise ValueError("BAD_WRITER_POLICY")
 def cue(x):return bool(NUM.search(x) or LEX.search(x))
 w2=prior[-2:];w5=prior[-5:]
 right=bool(following.strip() and (not target.rstrip().endswith((".","?","!","。","？","！")) or re.search(r"(?:은|는|게|건|가|도|에서|에|중)$",target.rstrip())))
 declared=declared or [];valid=[];errors=[]
 for d in declared:
  if not isinstance(d,dict):raise ValueError("BAD_DECLARATION")
  src=d.get("source_index");quote=d.get("quote");identity=d.get("group_id")
  if not isinstance(src,int) or src>=0 or -src>len(prior) or not isinstance(quote,str) or not quote or not isinstance(identity,str):errors.append("BAD_DECLARATION");continue
  if prior[src].count(quote)!=1 or sum(t.count(quote) for t in prior)!=1:errors.append("NONUNIQUE_SOURCE_QUOTE");continue
  valid.append({"id":identity,"source_index":src,"quote_sha256":sha(quote.encode())})
 if len(set(x["id"] for x in valid))!=len(valid):errors.append("DUPLICATE_GROUP_ID")
 if errors:status="ABSTAIN_INVALID_SOURCE_DECLARATION"
 elif writer_policy=="KEEP":status="KEEP"
 elif len(valid)>1:status="ABSTAIN_COMPETING_GROUPS"
 elif len(valid)==1 and writer_policy=="CLARIFY":status="EXACT_QUOTE_CANDIDATE_REVIEW_ONLY"
 elif len(valid)==1:status="ABSTAIN_WRITER_INTENT_UNKNOWN"
 elif right:status="ABSTAIN_RIGHT_CONTEXT_POSSIBLE"
 elif any(map(cue,w2)) or cue(target.split("그중",1)[0]):status="GROUP_CUE_REVIEW_ONLY"
 else:status="ABSTAIN_NO_VISIBLE_GROUP_CUE"
 return {"status":status,"cue_2":any(map(cue,w2)),"cue_5":any(map(cue,w5)),
 "numeric_cue_2":any(NUM.search(t) for t in w2),"numeric_cue_5":any(NUM.search(t) for t in w5),
 "same_sentence_cue":cue(target.split("그중",1)[0]),"right_context_possible":right,
 "quantity":quantity(prior,target),"source_claim_count":len(valid),
 "proven_antecedent":False,"writer_edit_permission":False,"human_preference":"NOT_OBSERVED"}
def corpus(archive):
 raw=Path(archive).read_bytes()
 if sha(raw)!=ZIP_SHA:raise ValueError("PINNED_ZIP_SHA_MISMATCH")
 count=collections.Counter();statuses=collections.Counter();subcorpora={}
 with zipfile.ZipFile(archive) as z:
  for filename,digest in MEMBERS.items():
   b=z.read(filename)
   if sha(b)!=digest:raise ValueError("PINNED_MEMBER_SHA_MISMATCH")
   local=collections.Counter()
   for doc in json.loads(b)["document"]:
    rows=doc["sentence"]
    for i,row in enumerate(rows):
     if "그중" not in row["form"]:continue
     prev=[s["form"] for s in rows[max(0,i-5):i]]
     following=rows[i+1]["form"] if i+1<len(rows) else ""
     x=inspect(prev,row["form"],following)
     local["total"]+=1;statuses[x["status"]]+=1
     for label,key in (("prior_2_cue_present","cue_2"),("prior_5_cue_present","cue_5"),("prior_2_numeric_cue_present","numeric_cue_2"),("prior_5_numeric_cue_present","numeric_cue_5"),("same_sentence_cue_present","same_sentence_cue"),("right_context_may_continue","right_context_possible")):
      local[label]+=int(x[key])
     local["prior_2_unique_count_compatible_cue"]+=int(x["quantity"]=="UNIQUE_NUMERIC_COMPATIBILITY_ONLY")
   subcorpora[filename[:2]]=dict(local);count.update(local)
 if count["total"]!=25:raise ValueError("UNEXPECTED_CORPUS_SIZE")
 return {"schema":"ksgt.g9p54.preceding_context_evidence_v1","source_sha256":ZIP_SHA,
 "private_source":True,"aggregate_only":True,"totals":dict(count),"split":subcorpora,"statuses":dict(statuses),
 "ground_truth_antecedents":0,"observed_writer_choices":0,"auto_rewrites":0,
 "meaning":"LEXICAL_AND_NUMERIC_CUES_ONLY_NOT_REFERENCE_RESOLUTION_ACCURACY"}
if __name__=="__main__":
 p=argparse.ArgumentParser();p.add_argument("private_zip");p.add_argument("--out")
 a=p.parse_args();d=corpus(a.private_zip)
 if a.out:
  with open(a.out,"x",encoding="utf8") as f:json.dump(d,f,ensure_ascii=False,indent=2)
 print(json.dumps({"status":"PRIVATE_SOURCE_ANALYZED","counts":d["totals"],"gold":0},ensure_ascii=False))
