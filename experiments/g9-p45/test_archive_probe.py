#!/usr/bin/env python3
import importlib.util,json,tempfile,zipfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location("p",HERE/"archive_probe.py")
p=importlib.util.module_from_spec(s); assert s.loader; s.loader.exec_module(p)
with tempfile.TemporaryDirectory() as td:
    zpath=Path(td)/"x.zip"
    with zipfile.ZipFile(zpath,"w") as z:
        z.writestr("a.json",json.dumps({"id":"x","metadata":{},"document":[]}))
        z.writestr("b.csv","doc_id,sentence_id,form\n1,2,test\n")
        z.writestr("manual.pdf",b"%PDF")
    r=p.probe(zpath)
    assert r["member_count"]==3
    assert r["sample_schemas"]["a.json"]["keys"]==["id","metadata","document"]
    assert r["sample_schemas"]["b.csv"]["header"][:3]==["doc_id","sentence_id","form"]
    assert r["raw_content_emitted"] is False
print("PASS archive probe")
