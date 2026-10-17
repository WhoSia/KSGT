"""Independent read-only finished-ingestion census and collision-resistant hashes."""
import pathlib,sqlite3,json,hashlib,datetime,time,shutil,os
root=pathlib.Path(r'C:\KSGT_SERVER');out=root/'70_RUNS/p62_r3_20261012';start=time.monotonic()
def digest(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
db=sqlite3.connect((root/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite').as_uri()+'?mode=ro',uri=True)
counts={'members':db.execute('select count(*) from members where complete=1').fetchone()[0],'representations':db.execute('select count(*) from occurrences').fetchone()[0],'canonical_JSON_structures':db.execute('select count(*) from canonical').fetchone()[0],'canonical_paragraphs':db.execute('select sum(paragraphs) from canonical').fetchone()[0],'uncommitted_members':db.execute('select count(*) from members where complete!=1').fetchone()[0]}
rows=db.execute('select path,bytes,sha256 from shards order by path').fetchall();db.close();bad=[];total=0
with (out/'FINISHED_INGESTION_SHARD_CENSUS.private.jsonl').open('x',encoding='utf8') as f:
 for i,(p,size,expected) in enumerate(rows):
  actual=digest(p);n=pathlib.Path(p).stat().st_size;total+=n
  if n!=size or actual!=expected:bad.append({'path':p,'expected_sha256':expected,'actual_sha256':actual})
  f.write(json.dumps({'path':p,'sha256':actual,'bytes':n,'matches':n==size and actual==expected})+'\n')
  if i%2000==0:print(json.dumps({'phase':'INDEPENDENT_SHARD_HASH_CENSUS','shards':i+1}),flush=True)
archives=[]
for p in sorted((root/'10_INBOX/nikl_legacy_14zip').glob('*.zip')):
 archives.append({'name':p.name,'bytes':p.stat().st_size,'sha256':digest(p)});print(json.dumps({'phase':'RAW_ARCHIVE_SHA256','archives':len(archives)}),flush=True)
receipt={'status':'VERIFIED' if not bad and len(archives)==14 else 'HOLD','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'host':os.environ.get('COMPUTERNAME'),'independent_counts':counts,'shards_rehashed':len(rows),'shard_bytes_rehashed':total,'mismatches':bad,'archives':archives,'archive_bytes':sum(x['bytes'] for x in archives),'disk_free_bytes':shutil.disk_usage(root).free,'wall_seconds':time.monotonic()-start,'source_mutations':False,'command':'python r3_census.py'}
(out/'CURRENT_SERVER_AND_INGESTION_CENSUS.json').write_text(json.dumps(receipt,indent=2),encoding='utf8');print(json.dumps({k:v for k,v in receipt.items() if k not in {'archives','mismatches'}}),flush=True)
