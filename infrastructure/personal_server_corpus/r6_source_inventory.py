"""Pre-outcome raw-source inventory for descriptor and role opportunities."""
import collections,datetime,hashlib,io,json,pathlib,shutil,sqlite3,sys,time,zipfile
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';R4=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';RUN=ROOT/'70_RUNS/p62_event_role_20261017';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R6_EVENT_ROLE_20261017'
sys.path[:0]=[str(PRIOR/'baseline_code'),str(PRIOR/'code')]
import pipeline,p62_reference as ref,p62_r4_guarded_v3 as v3,p62_r4_discourse as r4
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(4*1024**2),b''):h.update(b)
 return h.hexdigest()
def write(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=True,indent=2),encoding='utf-8')
def select():
 source=json.loads((ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R3_20261013/SOURCE_MEMBER_OPPORTUNITIES.private.json').read_text())['members']
 old={x['member'] for x in json.loads((ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R3_20261013/CUSTODY_SELECTION_PREDECLARATION.private.json').read_text())['selected_members']}
 new={x['member'] for x in json.loads((ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013/PREDECLARATION.private.json').read_text())['plan']}
 r5={x['member'] for x in json.loads((ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014/SOURCE_OPPORTUNITY_PREDECLARATION.private.json').read_text())['members']}
 seen=set();plan=[]
 for x in source:
  if x['member'] in old|new|r5 or x['previous_container_exposed'] or x['first_document_year'] in seen:continue
  plan.append(x);seen.add(x['first_document_year'])
 return plan
def main(limit):
 RUN.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
 plan=select();declaration={'status':'PLANNED','selection':'First unused nonexposed annual JSON member per distinct first-document metadata year in ascending member-key order, first five; R4-R3, R4-R4, and R4-R5 source members excluded; no target outcome consulted','members':plan,'selection_code_sha256':sha(pathlib.Path(__file__)),'prior_R4_R3_R4_R4_R4_R5_source_member_exclusions':True,'model_inference':'FORBIDDEN_DURING_INVENTORY','human_ground_truth':None}
 p=OUT/'SOURCE_OPPORTUNITY_PREDECLARATION.private.json'
 if p.exists():
  previous=json.loads(p.read_text())
  if previous['members']!=declaration['members'] or previous['selection']!=declaration['selection']:raise ValueError('Changed source selection')
 if not p.exists():write(p.name,declaration)
 if len(plan)!=5:raise RuntimeError('Unexpected five-year source diversity')
 db=sqlite3.connect(RUN/'SOURCE_OPPORTUNITIES.private.sqlite');db.execute('pragma cache_size=-131072')
 db.executescript('create table if not exists sources(member text primary key,sha256 text,bytes integer,documents integer,paragraphs integer,targets integer);create table if not exists targets(strict text primary key,member text,ordinal integer,file_id text,doc_id text,flat text,year integer,forms text,target_count integer,descriptor_hits integer,role_hits integer,competition_targets integer,source_coordination_hits integer);')
 main=sqlite3.connect((ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite').as_uri()+'?mode=ro',uri=True);start=time.time()
 for x in plan[:limit or len(plan)]:
  if shutil.disk_usage(ROOT).free<60*1024**3:raise RuntimeError('Disk reserve HOLD')
  member=x['member'];archive,name,expected_sha,expected_bytes,expected_docs=main.execute('select archive,name,sha256,bytes,documents from members where key=?',(member,)).fetchone()
  previous=db.execute('select sha256,bytes,documents from sources where member=?',(member,)).fetchone()
  if previous:
   if previous!=(expected_sha,expected_bytes,expected_docs):raise ValueError('Restart member identity changed')
   continue
  local=collections.Counter();rows=[];n=0
  with zipfile.ZipFile(ROOT/'10_INBOX/nikl_legacy_14zip'/archive) as z,z.open(name) as raw:
   h=pipeline.Hashed(raw);text=io.TextIOWrapper(io.BufferedReader(h,65536),encoding='utf-8-sig')
   for file_id,meta,doc in pipeline.json_docs(text):
    forms=[u['form'] for u in pipeline.validate(doc,'json')];strict,flat=pipeline.fingerprints(forms)
    date=str(doc['metadata'].get('date',''));year=datetime.datetime.strptime(date,'%Y%m%d').year
    target_count=sum(len(list(ref.TARGET.finditer(f))) for f in forms)
    local['documents']+=1;local['paragraphs']+=len(forms);local['targets']+=target_count;local['target_positive_structures']+=target_count>0
    if target_count:
     descriptor_hits=role_hits=coordination_hits=competition_targets=0
     for unit in forms:
      ms=list(v3.kernel.R4_COUNT.finditer(unit))
      for m in ms:
       before=unit[max(0,m.start()-24):m.start()]
       descriptor_hits+=bool(r4.re.search(r'[가-힣]{2,12}\s*$',before))
       role_hits+=bool(r4.re.match(r'(?:은|는|이|가|을|를|에게|에|와|과|의|도|만)',unit[m.end():]))
      coordination_hits+=sum(a.group('counter')==b.group('counter') and r4.COORDINATOR.fullmatch(unit[a.end():b.start()]) is not None for a,b in zip(ms,ms[1:]))
     for i,f in enumerate(forms):
      for target in ref.TARGET.finditer(f):
       target_start=target.start();prior=''.join(forms[:i])+f[:target_start]
       competition_targets+=len(list(v3.kernel.R4_COUNT.finditer(prior[-1024:])))>=2
     rows.append((strict,member,n,file_id,doc['id'],flat,year,json.dumps(forms,ensure_ascii=False),target_count,descriptor_hits,role_hits,competition_targets,coordination_hits))
    n+=1
   if (h.h.hexdigest(),h.count,n)!=(expected_sha,expected_bytes,expected_docs):raise ValueError('Original raw member hash/bytes/EOF mismatch')
  db.executemany('insert or ignore into targets values(?,?,?,?,?,?,?,?,?,?,?,?,?)',rows)
  db.execute('insert into sources values(?,?,?,?,?,?)',(member,expected_sha,expected_bytes,n,local['paragraphs'],local['targets']));db.commit()
  print(json.dumps({'phase':'raw_opportunity_complete','completed_members':db.execute('select count(*) from sources').fetchone()[0],'source_structures':db.execute('select sum(documents) from sources').fetchone()[0],'target_positive_structures':db.execute('select count(*) from targets').fetchone()[0],'targets':db.execute('select sum(targets) from sources').fetchone()[0],'elapsed_seconds':time.time()-start}),flush=True)
 census={'status':'EXECUTED' if not limit else 'RUNNING','completed_members':db.execute('select count(*) from sources').fetchone()[0],'structures':db.execute('select sum(documents) from sources').fetchone()[0],'paragraphs':db.execute('select sum(paragraphs) from sources').fetchone()[0],'targets':db.execute('select sum(targets) from sources').fetchone()[0],'target_positive_structures':db.execute('select count(*) from targets').fetchone()[0],'descriptor_surface_hits':db.execute('select sum(descriptor_hits) from targets').fetchone()[0],'role_particle_hits':db.execute('select sum(role_hits) from targets').fetchone()[0],'targets_with_two_or_more_preceding_numeral_cues':db.execute('select sum(competition_targets) from targets').fetchone()[0],'source_coordination_hits':db.execute('select sum(source_coordination_hits) from targets').fetchone()[0],'publication_years':sorted(set(y for y, in db.execute('select year from targets'))),'elapsed_seconds':time.time()-start,'all_original_raw_members_reparsed':not limit,'source_work_independence':'PENDING_EXCLUSION_AUDIT','model_outcomes_inspected':False,'human_ground_truth':None}
 write('SOURCE_OPPORTUNITY_CENSUS.private.json',census);print(json.dumps(census),flush=True)
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('--limit',type=int,default=0);main(p.parse_args().limit)

