"""Paragraph-context surface-cue experiment, without referent or preference gold."""
import argparse
import collections
import gzip
import json
from pathlib import Path
import re
import sqlite3

TARGET=re.compile(r"(?<![가-힣])그\s*중(?:에서|에서도|에|의|은|엔|에는)?(?![가-힣])")
CUE=re.compile(r"(?:\d+|두|세|네|몇|여러)\s*(?:명|개|곳|가지|건|팀|편|마리)(?![가-힣])")

def measure(run, root):
    db=sqlite3.connect("file:"+str(run/"corpus.sqlite").replace("\\","/")+"?mode=ro&immutable=1",uri=True)
    meta={strict:(year,json.loads(m)["file"].get("category","UNKNOWN"))
        for strict,year,m in db.execute("""SELECT c.strict,o.year,o.metadata FROM canonical c JOIN
        occurrences o ON c.first_member=o.member AND c.ordinal=o.ordinal""")}
    db.close()
    out=root/"50_ANNOTATIONS"/run.name
    out.mkdir(parents=True,exist_ok=True)
    counts=collections.Counter()
    lanes={}
    previous=collections.deque(maxlen=5)
    current=None
    with gzip.open(out/"reference_surface_context.jsonl.gz","wt",encoding="utf-8") as annotations:
        for path in sorted((root/"40_CORPUS/paragraphs"/run.name).glob("*.gz")):
            with gzip.open(path,"rt",encoding="utf-8") as f:
                for line in f:
                    row=json.loads(line)
                    if row["document_variant"]!=current:
                        previous.clear()
                        current=row["document_variant"]
                    text=row["form"]
                    counts["paragraphs"]+=1
                    hits=list(TARGET.finditer(text))
                    if hits:
                        year,genre=meta[current]
                        c=lanes.setdefault(str(year)+":"+str(genre),collections.Counter())
                        for hit in hits:
                            has2=any(CUE.search(t) for t in list(previous)[-2:])
                            has5=any(CUE.search(t) for t in previous)
                            rec={"paragraph_key":row["paragraph_key"],"start":hit.start(),"end":hit.end(),
                                 "prior_two_paragraph_numeric_group_surface":has2,
                                 "prior_five_paragraph_numeric_group_surface":has5,
                                 "prior_paragraph_count":len(previous),
                                 "label":"REGEX_SURFACE_CUE_NOT_ANTECEDENT_GOLD"}
                            annotations.write(json.dumps(rec)+"\n")
                            counts["targets"]+=1
                            counts["targets_with_prior2_cue"]+=has2
                            counts["targets_with_prior5_cue"]+=has5
                            c["targets"]+=1
                            c["with_prior2_cue"]+=has2
                            c["with_prior5_cue"]+=has5
                    previous.append(text)
    result={"status":"EXECUTED","experiment":"PARAGRAPH_CONTEXT_SURFACE_CUE",
            "counts":dict(counts),"source_year_genre_lanes":{k:dict(v) for k,v in lanes.items()},
            "target_definition":"Standalone partitive surface plus declared particle variants",
            "cue_definition":"Arabic or selected Korean quantity surface followed by declared count unit",
            "window":"Previous two or five source paragraphs in the same strict document structure",
            "raw_html_preserved":True,"referent_gold":False,"human_preference":False,
            "scope":"Nonrandom processed JSON cohort; descriptive structural co-occurrence only",
            "limitations":["Cue may refer to another group","Relevant antecedents may lack numeric cues",
                "Titles and source paragraph units are retained","No recoverability probability is estimated"]}
    (run/"CONTEXT_SURFACE_EXPERIMENT.json").write_text(json.dumps(result,indent=2,ensure_ascii=True),encoding="utf-8")
    (run/"CONTEXT_SURFACE_EXPERIMENT.md").write_text(
        "# Paragraph-context surface-cue experiment\n\nStatus: EXECUTED.\n\n"+
        f"Scanned {counts['paragraphs']:,} preserved JSON paragraphs. Observed {counts['targets']:,} declared partitive-surface targets; {counts['targets_with_prior2_cue']:,} have a numeric group surface in the preceding two paragraphs and {counts['targets_with_prior5_cue']:,} in the preceding five.\n\n"+
        "These are local surface co-occurrences, not resolved antecedents, recoverability gold or reader preference. Missing numeric cues do not imply inaccessible referents. Longer windows can admit unrelated groups. The cohort is not random and the target regex differs prospectively from the narrow literal marker used in the source-dependence experiment. Original text stays private.\n",encoding="utf-8")
    print(json.dumps({"status":"EXECUTED",**dict(counts)}))
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--run",type=Path,required=True)
    p.add_argument("--root",type=Path,required=True)
    a=p.parse_args()
    measure(a.run,a.root)

