#!/usr/bin/env python3
import importlib.util,io,zipfile,tempfile,csv,json
from pathlib import Path
HERE=Path(__file__).resolve().parent

def load(name,file):
    s=importlib.util.spec_from_file_location(name,HERE/file)
    m=importlib.util.module_from_spec(s); assert s.loader; s.loader.exec_module(m); return m
k=load("k","klicke_auxiliary_audit.py")
d=load("d","dryad_creativity_probe.py")

with tempfile.TemporaryDirectory() as td:
    p=Path(td)
    (p/"inventory.csv").write_text("FullName\nC:/x/12345678.csv\nC:/x/87654321.csv\n",encoding="utf-8")
    (p/"demo.csv").write_text(",ID\n0,12345678\n1,87654321\n",encoding="utf-8")
    for fn,names in [("typing.zip",["Typing/12345678.csv","Typing/87654321.csv"]),
                     ("vocab.zip",["Vocabulary/12345678_Vocab.csv"])]:
        with zipfile.ZipFile(p/fn,"w") as z:
            for n in names:z.writestr(n,"x")
    w=k.ids_from_inventory(p/"inventory.csv"); dm=k.ids_from_demographic(p/"demo.csv")
    ty=k.ids_from_zip(p/"typing.zip"); vo=k.ids_from_zip(p/"vocab.zip","_Vocab.csv")
    s=k.summarize(w,dm,ty,vo)
    assert s["writing_demographic_overlap"]==2
    assert s["typing_only_without_vocabulary"]==1
    assert s["authority"]=="AUXILIARY_PROCESS_COVARIATE_ONLY"
print("PASS auxiliary authority and joins")
