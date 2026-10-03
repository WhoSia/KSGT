#!/usr/bin/env python3
import importlib.util
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("osa",HERE/"okhc_selective_acquire.py")
m=importlib.util.module_from_spec(spec); assert spec.loader; spec.loader.exec_module(m)
files=m.selected_files("news_archive")
assert len(files)==3
assert files[0]=="news_archive_part_001_of_003.jsonl"
assert files[-1]=="news_archive_part_003_of_003.jsonl"
assert all(x.startswith("news_archive_part_") and x.endswith(".jsonl") for x in files)
assert m.REPO_ID=="seyoungsong/Open-Korean-Historical-Corpus"
try:
    m.selected_files("all")
except ValueError:
    pass
else:
    raise AssertionError("full-repo acquisition must not be silently enabled")
print("PASS OKHC selective acquisition contract")
