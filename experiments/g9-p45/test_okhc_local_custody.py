#!/usr/bin/env python3
import json, subprocess, tempfile, zipfile
from pathlib import Path

HERE=Path(__file__).resolve().parent
SCRIPT=HERE/"okhc_local_custody.py"

with tempfile.TemporaryDirectory() as td:
    root=Path(td)
    j=root/"sample.jsonl"
    j.write_text(
      json.dumps({"year":1950,"source":"s","corpus":"c","copyright":"Public Domain","text":"가"})+"\n"+
      json.dumps({"year":2005,"source":"s2","corpus":"c2","copyright":"CC BY","text":"나"})+"\n",
      encoding="utf-8"
    )
    z=root/"pack.zip"
    with zipfile.ZipFile(z,"w",compression=zipfile.ZIP_DEFLATED) as zz:
        zz.writestr("inner.jsonl", json.dumps({"year":1988,"source":"z","corpus":"zc","copyright":"PD","text":"다"})+"\n")
    out=root/"manifest.json"
    subprocess.check_call(["python",str(SCRIPT),str(root),"--output",str(out),"--sample-rows","2"])
    obj=json.loads(out.read_text(encoding="utf-8"))
    assert obj["file_count"]==2
    assert obj["full_sha256_complete"] is True
    assert all(x["sha256"] and len(x["sha256"])==64 for x in obj["files"])
    assert all("text" not in json.dumps(x.get("probe",{}), ensure_ascii=False) for x in obj["files"])
    assert any("zip_member_count" in x.get("probe",{}) for x in obj["files"])
    print("PASS okhc local custody")
