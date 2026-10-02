#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,io,json,zipfile
from collections import Counter
from pathlib import Path

WRITERS="GenAI_creativity_scripts/raw_data/writers-2023-06-28.csv"
EVALS="GenAI_creativity_scripts/raw_data/evaluators-2023-07-06.csv"
INNER="GenAI_creativity_scripts.zip"

def nested(path:Path):
    outer=zipfile.ZipFile(path)
    data=outer.read(INNER)
    outer.close()
    return zipfile.ZipFile(io.BytesIO(data))

def rows(z,name):
    return list(csv.DictReader(io.StringIO(z.read(name).decode("utf-8-sig","replace"))))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("archive",type=Path)
    args=ap.parse_args()
    with nested(args.archive) as z:
      w=rows(z,WRITERS); e=rows(z,EVALS)
      wc=Counter(r.get("participant.condition","") for r in w if r.get("participant.condition",""))
      stories={r.get("ai_story_gen.1.player.story_id","") for r in w if r.get("ai_story_gen.1.player.story_id","")}
      story_cols=[c for c in e[0] if c.endswith(".player.story_id")] if e else []
      eval_story_ids=[]
      for r in e:
        for c in story_cols:
          if r.get(c): eval_story_ids.append(r[c])
      out={
        "writers_rows":len(w),"evaluators_rows":len(e),
        "writers_columns":len(w[0]) if w else 0,
        "evaluators_columns":len(e[0]) if e else 0,
        "writer_conditions":dict(wc),
        "writer_unique_story_ids":len(stories),
        "evaluator_story_slots":len(eval_story_ids),
        "evaluator_unique_story_ids":len(set(eval_story_ids)),
        "authority":"GENERATION_SIDE_EXTERNAL_CONTROL_DONOR_ONLY",
        "p45_diachronic_authority":False
      }
      print(json.dumps(out,ensure_ascii=False,sort_keys=True))
if __name__=="__main__": main()
