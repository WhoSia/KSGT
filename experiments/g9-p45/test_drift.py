#!/usr/bin/env python3
import importlib.util,json,tempfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("d",HERE/"diachronic_drift.py")
d=importlib.util.module_from_spec(spec); assert spec.loader; spec.loader.exec_module(d)

def row(period,rep,contrast,expansion,marker):
    return {"period":period,"source":"S","genre":"news","register":"institutional",
            "provenance":"KNOWN","representation":rep,
            "edf":{"CONTRAST":contrast,"CAUSE_RESULT":0,"TEMPORAL":0,"EXPANSION":expansion},
            "markers":{"CONTRAST":marker,"CAUSE_RESULT":{},"TEMPORAL":{},"EXPANSION":{"그리고":expansion}}}
rows=[
 row("A","RAW",10,10,{"그러나":10}),
 row("B","RAW",10,10,{"하지만":10}),
 row("B","NORMALIZED_SOURCE_PROVIDED",10,10,{"그러나":10})
]
g=d.aggregate(rows)
pairs=d.eligible_pairs(g)
assert len(pairs)==1
res=d.compare(*pairs[0])
assert res["coarse_jsd"] < 1e-9
assert res["marker_jsd"]["CONTRAST"] > 0.9
try:
    ra=next(x for x in g.items() if x[0][5]=="RAW")
    rb=next(x for x in g.items() if x[0][5]=="NORMALIZED_SOURCE_PROVIDED")
    d.compare(ra,rb)
    raise AssertionError("representation mixing was not blocked")
except ValueError as e:
    assert "REPRESENTATION_MIX_FORBIDDEN" in str(e)
print("PASS drift geometry and representation firewall")
