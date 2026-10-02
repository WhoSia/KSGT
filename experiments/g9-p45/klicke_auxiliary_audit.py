#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,io,json,re,zipfile
from pathlib import Path

ID_RE=re.compile(r"(?<!\d)(\d{8})(?!\d)")

def ids_from_inventory(path:Path)->set[str]:
    out=set()
    with path.open(encoding="utf-8-sig",newline="") as f:
        for row in csv.DictReader(f):
            s=" ".join(str(v) for v in row.values())
            out.update(ID_RE.findall(s))
    return out

def ids_from_demographic(path:Path)->set[str]:
    out=set()
    with path.open(encoding="utf-8-sig",newline="") as f:
        for row in csv.DictReader(f):
            x=(row.get("ID") or "").strip()
            if ID_RE.fullmatch(x): out.add(x)
    return out

def ids_from_zip(path:Path,suffix_hint:str="")->set[str]:
    out=set()
    with zipfile.ZipFile(path) as z:
        for n in z.namelist():
            if suffix_hint and suffix_hint not in n: continue
            out.update(ID_RE.findall(Path(n).name))
    return out

def summarize(writing,demographic,typing,vocab):
    return {
      "writing_ids":len(writing),"demographic_ids":len(demographic),
      "typing_ids":len(typing),"vocabulary_ids":len(vocab),
      "writing_demographic_overlap":len(writing&demographic),
      "writing_typing_overlap":len(writing&typing),
      "writing_vocabulary_overlap":len(writing&vocab),
      "typing_vocabulary_overlap":len(typing&vocab),
      "typing_only_without_vocabulary":len(typing-vocab),
      "authority":"AUXILIARY_PROCESS_COVARIATE_ONLY"
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--inventory",type=Path,required=True)
    ap.add_argument("--demographic",type=Path,required=True)
    ap.add_argument("--typing-zip",type=Path,required=True)
    ap.add_argument("--vocab-zip",type=Path,required=True)
    args=ap.parse_args()
    result=summarize(
      ids_from_inventory(args.inventory),
      ids_from_demographic(args.demographic),
      ids_from_zip(args.typing_zip),
      ids_from_zip(args.vocab_zip,"_Vocab.csv")
    )
    print(json.dumps(result,ensure_ascii=False,sort_keys=True))
if __name__=="__main__": main()
