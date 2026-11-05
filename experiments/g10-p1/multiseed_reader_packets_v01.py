#!/usr/bin/env python3
"""Make 6 blinded reader booklets from TWO genuine G10 cross-family raw JSON reports.
Each booklet contains one pair per source work; no model IDs or arm IDs in public packets.
This tool does not assign votes or infer human preferences.
"""
import hashlib, json, pathlib, secrets, sys

SOURCE_ARMS = {"RICH_MEANINGFUL", "ROLE_AWARE_PLAN_V05"}
SOURCES = ("SCI_SHUFFLED_02", "NARR_REFERENTS_02", "NOTICE_TWO_EVENTS_02")
MODELS = ("openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b")

def build(reports):
    if len(reports) != 2 or any(r.get("schema") != "ksgt.g10.p1.crossfamily-output.v01" or r.get("status") != "MODEL_REQUESTS_ATTEMPTED" for r in reports):
        raise ValueError("TWO_ACTUAL_CROSSFAMILY_REPORTS_REQUIRED")
    booklets = [dict(schema="ksgt.g10.p1.reader-packet-v02", status="UNRATED_REAL_MODEL_OUTPUTS",pairs=[]) for _ in range(6)]
    keys = []
    for src in SOURCES:
        combinations = []
        for r in reports:
            for model in MODELS:
                selected = [x for x in r["rows"] if x["taskId"]==src and x["model"]==model and x["arm"] in SOURCE_ARMS]
                if len(selected) != 2 or any(x["outcome"] != "GENERATED" or not x.get("text") for x in selected):
                    raise ValueError("MISSING_REAL_TEXT_PAIR")
                if {x["arm"] for x in selected} != SOURCE_ARMS:
                    raise ValueError("DUPLICATE_OR_WRONG_ARM")
                combinations.append((r["id"],model,selected))
        secrets.SystemRandom().shuffle(combinations)
        for i,(run,model,selected) in enumerate(combinations):
            if secrets.randbelow(2): selected.reverse()
            a,b = selected
            pid="KSGT-"+secrets.token_hex(8)
            booklets[i]["pairs"].append(dict(pairId=pid,genre=src.split("_")[0],A=a["text"],B=b["text"],readerPreference=None))
            keys.append(dict(pairId=pid,packet=i+1,sourceWork=src,run=run,model=model,A_arm=a["arm"],B_arm=b["arm"],
                A_sha256=hashlib.sha256(a["text"].encode()).hexdigest(),B_sha256=hashlib.sha256(b["text"].encode()).hexdigest()))
    if any(len(b["pairs"]) != 3 for b in booklets): raise ValueError("INVALID_PACKET_BALANCE")
    return booklets,dict(schema="ksgt.g10.p1.private-reader-map-v02",status="PRIVATE_NEVER_SHOW_TO_RATERS",pairs=keys)

def main(argv):
    if len(argv)!=3: raise SystemExit("USAGE: multiseed_reader_packets_v01.py RUN1.json RUN2.json OUT_DIR")
    r=[json.loads(pathlib.Path(p).read_text(encoding="utf-8")) for p in argv[:2]]
    folder=pathlib.Path(argv[2]); folder.mkdir(parents=True,exist_ok=False)
    booklets,key=build(r)
    for i,b in enumerate(booklets,1):
        (folder/f"reader_packet_{i:02d}.json").write_text(json.dumps(b,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    # Write private linkage outside the public packet folder.
    (folder.parent/(folder.name+"_PRIVATE_MAPPING.json")).write_text(json.dumps(key,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"packets":len(booklets),"pairs":len(key["pairs"]),"humanRatings":0}))
if __name__=="__main__":main(sys.argv[1:])
