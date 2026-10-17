"""Bounded real-corpus custody and forced-process-interruption verification."""
import gzip
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import time
import zipfile

ROOT=Path("C:/KSGT_SERVER")
CODE=ROOT/"70_RUNS/corpus_sprint_20261011_code/pipeline.py"
BASE=ROOT/"70_RUNS/corpus_sprint_20261011_pilot"
TRIAL=ROOT/"70_RUNS/corpus_sprint_20261011_restart_trial"

def rows(run):
    db=sqlite3.connect(run/"corpus.sqlite")
    result={}
    for table in ["members","occurrences","canonical"]:
        values=db.execute("SELECT * FROM "+table+" ORDER BY 1,2").fetchall()
        result[table]=hashlib.sha256(json.dumps(values,ensure_ascii=True).encode()).hexdigest()
    db.close()
    return result

def shard_hashes(run):
    result={}
    for kind in ["documents","paragraphs","sentences"]:
        for path in sorted((ROOT/"40_CORPUS"/kind/run.name).glob("*.gz")):
            h=hashlib.sha256()
            with gzip.open(path,"rb") as f:
                for data in iter(lambda:f.read(65536),b""):
                    h.update(data)
            result[kind+"/"+path.name]=h.hexdigest()
    return result

cmd=[sys.executable,str(CODE),"--root",str(ROOT),"--out",str(TRIAL),"--fraction",".0001","--cap","30"]
if TRIAL.exists():
    raise RuntimeError("Use a fresh restart trial directory")
env=dict(os.environ,PYTHONDONTWRITEBYTECODE="1",PYTHONIOENCODING="utf-8")
child=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding="utf-8",env=env)
first=child.stdout.readline()
if not first:
    raise RuntimeError("No committed-member progress before interrupt")
child.terminate()
stdout,stderr=child.communicate(timeout=15)
interrupted_returncode=child.returncode
before=rows(TRIAL)
resumed=subprocess.run(cmd,capture_output=True,text=True,encoding="utf-8",env=env,timeout=60)
if resumed.returncode:
    raise RuntimeError(resumed.stderr)
equal_tables=rows(BASE)==rows(TRIAL)
equal_shards=shard_hashes(BASE)==shard_hashes(TRIAL)
if not equal_tables or not equal_shards:
    raise RuntimeError("Restart altered logical corpus")
# Independently load a complete small genuine JSON member with json.load.
db=sqlite3.connect(BASE/"corpus.sqlite")
member=db.execute("SELECT key,archive,name FROM members WHERE format='json' AND complete=1 ORDER BY declared LIMIT 1").fetchone()
with zipfile.ZipFile(ROOT/"10_INBOX/nikl_legacy_14zip"/member[1]) as z:
    source=json.loads(z.read(member[2]).decode("utf-8-sig"))
expected={(d["id"],source["id"]) for d in source["document"]}
actual=set(db.execute("SELECT doc_id,file_id FROM occurrences WHERE member=?",(member[0],)))
if expected!=actual:
    raise RuntimeError("Independent parsed JSON identity differs")
checked=0
paragraphs={}
for path in (ROOT/"40_CORPUS/paragraphs"/BASE.name).glob("*.gz"):
    with gzip.open(path,"rt",encoding="utf-8") as f:
        for line in f:
            row=json.loads(line)
            paragraphs[row["paragraph_key"]]=row["form"]
for path in (ROOT/"40_CORPUS/sentences"/BASE.name).glob("*.gz"):
    with gzip.open(path,"rt",encoding="utf-8") as f:
        for line in f:
            row=json.loads(line)
            if not 0<=row["start"]<row["end"]<=len(paragraphs[row["paragraph_key"]]):
                raise RuntimeError("Sentence offset outside preserved source paragraph")
            checked+=1
receipt={"status":"VERIFIED","forced_interruption_returncode":interrupted_returncode,
    "first_committed_event":json.loads(first),"resumed_returncode":resumed.returncode,
    "logical_table_hashes_equal":equal_tables,"logical_gzip_shard_hashes_equal":equal_shards,
    "gzip_logical_streams_verified":len(shard_hashes(BASE)),
    "independent_json_load_identity_match":True,"sentence_offsets_checked":checked,
    "byte_identical_gzip_claim":False,"commands":[cmd],
    "scope":"REAL_BOUNDED_PILOT; NOT FULL_CORPUS_RESUME_PROOF"}
db.close()
(BASE/"RESTART_AND_CUSTODY_TEST.json").write_text(json.dumps(receipt,indent=2),encoding="utf-8")
(TRIAL/"restart_commands.log").write_text(resumed.stdout+"\n"+resumed.stderr,encoding="utf-8")
print(json.dumps(receipt))

