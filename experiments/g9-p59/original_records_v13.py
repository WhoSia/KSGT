#!/usr/bin/env python3
"""KSGT G9-P59 internal §v1.3: original-record audit, never a Korean-quality scorer."""
import argparse, collections, hashlib, json, pathlib, sys, zipfile

def sha(data):
    return hashlib.sha256(data).hexdigest()

def audit_p53(files):
    rows=[]; archives=[]
    for p in map(pathlib.Path,files):
        raw=p.read_bytes()
        with zipfile.ZipFile(p) as z:
            names=[x for x in z.namelist() if x.startswith("outcomes/") and x.endswith(".json")]
            if len(names)!=1: raise ValueError("EXPECTED_ONE_OUTCOME_JSON")
            packet=json.loads(z.read(names[0]))
            src=packet.get("documents",packet.get("results",packet.get("rows")))
            if not isinstance(src,list): raise ValueError("UNKNOWN_P53_OUTCOME_SCHEMA")
            archives.append({"archive":p.name,"sha256":sha(raw),"rows":len(src),
                             "model":packet.get("model",{}).get("repo")})
            for i,r in enumerate(src):
                output=r.get("output",r.get("model_output"))
                if not isinstance(output,str): raise ValueError("MISSING_OUTPUT")
                digest=sha(output.encode("utf-8"))
                if digest != r.get("output_sha256",r.get("text_sha256")):
                    raise ValueError("MODEL_OUTPUT_DIGEST_MISMATCH")
                family=r.get("id",r.get("brief"))
                if not family or not r.get("arm"): raise ValueError("MISSING_SOURCE_OR_ARM")
                source=r.get("source_sha256") or packet.get("source_sha256")
                if not source: raise ValueError("MISSING_SOURCE_RECEIPT")
                rows.append({"sourceFamilyId":"P53:"+family,"sourceReceiptSha256":source,
                  "sourceHashScope":"ROW" if r.get("source_sha256") else "PACKET",
                  "arm":r["arm"],"cohort":r.get("cohort","UNSPECIFIED"),
                  "outputSha256":digest,"archive":p.name,"recordIndex":i,
                  "actualModelOutput":True,"independentHumanRevision":False,
                  "independentHumanPreference":False,"meaningGold":"NOT_ADJUDICATED"})
    families=collections.Counter(x["sourceFamilyId"] for x in rows)
    duplicates=len(rows)-len(set(x["outputSha256"] for x in rows))
    # Cross-archive exposures are controls, NOT independent source works.
    return {"authority":"ACTUAL_MODEL_GENERATIONS_ONLY","archiveReceipts":archives,
      "candidateCount":len(rows),"sourceFamilyCount":len(families),
      "sourceFamilyMultiplicities":dict(sorted(families.items())),
      "exactCandidateDuplicates":duplicates,"independentHumanRevisions":0,
      "independentHumanPreferences":0,"rows":rows}

KOSEND_FIELDS={"usage_type","sentence_options","sentence_answer","usage_options","usage_answer"}
def audit_kosend(path):
    doc=json.loads(pathlib.Path(path).read_text(encoding="utf-8-sig"))
    if not isinstance(doc,list): raise ValueError("EXPECTED_ARRAY")
    seen=set();repeat=none=empty=bad=0
    for r in doc:
        if set(r)!=KOSEND_FIELDS: raise ValueError("KOSEND_REAL_SCHEMA_MISMATCH")
        for mode in ("sentence","usage"):
            options=r[mode+"_options"]; answers=r[mode+"_answer"]
            if not isinstance(options,list) or not isinstance(answers,list):
                raise ValueError("KOSEND_LIST_EXPECTED")
            alphabet={x[0] for x in options if isinstance(x,str) and x}
            if any(ans!="N" and ans not in alphabet for ans in answers):
                bad+=1
        key=json.dumps(r["sentence_options"],ensure_ascii=False)
        repeat+=key in seen;seen.add(key)
        none+="N" in r["sentence_answer"]
        empty+=not r["sentence_answer"]
    return {"authority":"ANNOTATION_SCHEMA_READ_NO_HUMAN_WITNESS",
      "rows":len(doc),"fields":sorted(KOSEND_FIELDS),"optionRepeatRows":repeat,
      "sentenceNoCandidateN":none,"sentenceEmptyAnswers":empty,
      "invalidOptionAnswerRows":bad,"rowAnnotatorProvenance":"ABSENT",
      "wholeKoreanProseGold":False}

def audit_golem(path):
    text=pathlib.Path(path).read_text(encoding="utf-8-sig")
    docs=token_rows=entity_tagged=empty_nodes=0
    for line in text.splitlines():
        if line.startswith("# newdoc id = "): docs+=1
        if not line or line.startswith("#"): continue
        fields=line.split("\t")
        if len(fields)!=10: raise ValueError("CONLLU_NOT_TEN_COLUMNS")
        if not(fields[0].isdigit() or "." in fields[0] or "-" in fields[0]):
            raise ValueError("CONLLU_TOKEN_ID")
        token_rows+=1
        empty_nodes+= "." in fields[0]
        entity_tagged+="Entity=" in fields[9]
    return {"authority":"ORIGINAL_COREFUD_SYNTAX_ONLY","sourceDocuments":docs,
      "tokenRows":token_rows,"emptyNodes":empty_nodes,
      "entityTaggedRows":entity_tagged,"actualEntityClusters":"NOT_COMPUTED",
      "wholeKoreanProseGold":False}

def self_test():
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        root=pathlib.Path(d)
        sample={"usage_type":"declarative form","sentence_options":["A: 종결"],
          "sentence_answer":["N"],"usage_options":["A: 독백"],"usage_answer":["A"]}
        p=root/"easy.json";p.write_text(json.dumps([sample,sample],ensure_ascii=False))
        x=audit_kosend(p)
        assert x["optionRepeatRows"]==1 and x["sentenceNoCandidateN"]==2
        p.write_text(json.dumps([dict(sample,sentence_answer=["B"])]))
        try: audit_kosend(p)
        except ValueError as e: assert str(e)=="KOSEND_REAL_SCHEMA_MISMATCH" or str(e)=="KOSEND_LIST_EXPECTED" or not e
        else: raise AssertionError("BAD_ANSWER_ACCEPTED")
        q=root/"test.conllu";q.write_text("# newdoc id = synthetic\n1\t형태\t형태\tNOUN\t_\t_\t0\troot\t_\tEntity=(e1)\n")
        y=audit_golem(q)
        assert y["sourceDocuments"]==1 and y["entityTaggedRows"]==1
        with zipfile.ZipFile(root/"x.zip","w") as z:
            packet={"model":{"repo":"mock"},"source_sha256":sha(b"source"),
              "documents":[{"id":"SCENE","arm":"B","output":"가","text_sha256":sha("가".encode())}]}
            z.writestr("outcomes/x.json",json.dumps(packet,ensure_ascii=False))
        z=audit_p53([root/"x.zip"])
        assert z["candidateCount"]==1 and z["independentHumanRevisions"]==0
        packet["documents"][0]["text_sha256"]="0"*64
        with zipfile.ZipFile(root/"bad.zip","w") as f:f.writestr("outcomes/x.json",json.dumps(packet,ensure_ascii=False))
        try:audit_p53([root/"bad.zip"])
        except ValueError as e: assert str(e)=="MODEL_OUTPUT_DIGEST_MISMATCH"
        else:raise AssertionError("FALSE_DIGEST_ACCEPTED")
    return {"test":"PASS","source":"FABRICATED_CONTROL_ONLY","negativeCases":2}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--p53",nargs="*");ap.add_argument("--kosend",nargs="*")
    ap.add_argument("--golem",nargs="*");ap.add_argument("--ledger-out")
    args=ap.parse_args()
    out={"selfTest":self_test()}
    if args.p53:
        out["p53"]=audit_p53(args.p53)
        if args.ledger_out:
            pathlib.Path(args.ledger_out).write_text(json.dumps(
                {"schema":"ksgt.p59.paragraph-ledger.v1",
                 "authority":"MODEL_OUTPUTS_WITHOUT_INDEPENDENT_WRITER_EDITS",
                 "records":out["p53"]["rows"]},ensure_ascii=False,indent=2),
                 encoding="utf-8")
    if args.kosend:out["kosend"]={pathlib.Path(p).name:audit_kosend(p) for p in args.kosend}
    if args.golem:out["golem"]={pathlib.Path(p).name:audit_golem(p) for p in args.golem}
    # P53 original prose is intentionally not emitted by this metadata-only tool.
    print(json.dumps(out,ensure_ascii=False,indent=2))
if __name__=="__main__":main()
