"""Recover bounded original singleton witnesses without running inference."""
import collections, datetime, hashlib, io, json, pathlib, shutil, sqlite3, sys, time, zipfile
ROOT=pathlib.Path('C:/KSGT_SERVER'); PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013'
RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013'; OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'
sys.path[:0]=[str(PRIOR/'baseline_code'),str(PRIOR/'code')]
import pipeline,p62_reference as ref
from p62_r4_r3_source_witness import strict
def main():
 start=time.time()
 if shutil.disk_usage(ROOT).free<60*1024**3:raise RuntimeError('Disk reserve HOLD')
 witnesses=json.loads((OUT/'ENRICHMENT_SOURCE_WITNESSES.private.json').read_text())
 wanted=collections.defaultdict(dict)
 for w in witnesses:wanted[w['source_member']][w['document_ordinal']]=w['strict_private']
 source=sqlite3.connect((ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite').as_uri()+'?mode=ro',uri=True)
 db=sqlite3.connect(RUN/'UPSTREAM_CUSTODY.private.sqlite')
 db.execute('create table if not exists docs(strict text primary key,member text,ordinal integer,container text,year integer,targets integer,units integer,flat text,stream text,forms text,excluded text)')
 counts=collections.Counter();members=[]
 for member,ordinals in wanted.items():
  archive,name,expected_sha,expected_bytes,expected_docs=source.execute('select archive,name,sha256,bytes,documents from members where key=?',(member,)).fetchone()
  staged=[];n=0
  with zipfile.ZipFile(ROOT/'10_INBOX/nikl_legacy_14zip'/archive) as z,z.open(name) as raw:
   h=pipeline.Hashed(raw);text=io.TextIOWrapper(io.BufferedReader(h,65536),encoding='utf-8-sig')
   for file_id,meta,doc in pipeline.json_docs(text):
    if n in ordinals:
     forms=[u['form'] for u in pipeline.validate(doc,'json')];s,f=pipeline.fingerprints(forms)
     if s!=ordinals[n] or strict(forms)!=s:raise ValueError('Witness structure mismatch')
     for w in witnesses:
      if w['strict_private']==s:
       unit=forms[w['unit_ordinal']]
       if hashlib.sha256(unit.encode()).hexdigest()!=w['unit_sha256']:raise ValueError('Unit witness mismatch')
       if any(not(0<=a<b<=len(unit)) for a,b in w['component_spans']):raise ValueError('Invalid original span')
     targets=sum(len(list(ref.TARGET.finditer(u))) for u in forms)
     year=datetime.datetime.strptime(str(doc['metadata']['date']),'%Y%m%d').year
     staged.append((s,member,n,file_id,year,targets,len(forms),f,''.join(forms),json.dumps(forms,ensure_ascii=False),'PENDING_PASSAGE_AND_ALIAS_AUDIT'))
     counts['structures']+=1;counts['paragraphs']+=len(forms);counts['targets']+=targets;counts['target_positive_structures']+=targets>0
    n+=1
   if (h.h.hexdigest(),h.count,n)!=(expected_sha,expected_bytes,expected_docs):raise ValueError('Raw source integrity mismatch')
  db.executemany('insert or ignore into docs values(?,?,?,?,?,?,?,?,?,?,?)',staged);db.commit()
  members.append({'member_private':member,'raw_member_sha256':expected_sha,'bytes':expected_bytes,'documents':n,'selected_structures':len(staged)})
 report={'status':'VERIFIED','counts':dict(counts),'raw_members':members,'elapsed_seconds':time.time()-start,'reference_models_called':0,'human_ground_truth':None,'source_work_independence':'HOLD_PENDING_CUSTODY','restart_rows':db.execute('select count(*) from docs').fetchone()[0]}
 (OUT/'ORIGINAL_WITNESS_RECOVERY.private.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
if __name__=='__main__':main()
