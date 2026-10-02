#!/usr/bin/env python3
import importlib.util,json,tempfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("p",HERE/"source_contract_probe.py")
m=importlib.util.module_from_spec(spec);assert spec.loader;spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/"x.jsonl"
    rows=[
      {"source":"A","corpus":"C","copyright":"Public Domain","language":"Korean","script":"Hangul","year":1950},
      {"source":"A","corpus":"C","copyright":"Public Domain","language":"Korean","script":"Hangul","year":1951}
    ]
    p.write_text("\n".join(json.dumps(x) for x in rows)+"\n")
    r=m.probe(p,100)
    assert r["auto_contract_admissible"] is True
    assert r["year_min"]==1950 and r["year_max"]==1951
    assert r["provenance"]=="UNINFERRED"
    rows[1]["source"]="B"
    p.write_text("\n".join(json.dumps(x) for x in rows)+"\n")
    r=m.probe(p,100)
    assert r["auto_contract_admissible"] is False
print("PASS source contract probe")
