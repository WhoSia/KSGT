"""Prepare an explicit target source graph; indexed aliases are not proof."""
import collections,hashlib,json,pathlib,sqlite3,sys,time
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';R4=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';RUN=ROOT/'70_RUNS/p62_r4_r5_20261014';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R5_20261014'
def ro(p):
 c=sqlite3.connect(p.as_uri()+'?mode=ro',uri=True);c.execute('pragma cache_size=-131072');return c
def main():
 start=time.time();source=ro(RUN/'SOURCE_OPPORTUNITIES.private.sqlite');main=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite');old=ro(ROOT/'70_RUNS/p62_r4_r2_20261013/COHORT.private.sqlite');r3=ro(PRIOR/'UPSTREAM_CUSTODY.private.sqlite')
 r4plan=json.loads((ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013/PREDECLARATION.private.json').read_text())['plan'];r4members=[x['member'] for x in r4plan]
 r4keys=collections.defaultdict(set)
 for member in r4members:
  for s,f,d,fi in main.execute('select strict,flat,doc_id,file_id from occurrences where member=?',(member,)):
   for k,v in [('strict',s),('flat',f),('doc_id',d),('file_id',fi)]:
    if v:r4keys[k].add(v)
 r3flat={x[0] for x in r3.execute('select flat from docs')}
 db=sqlite3.connect(RUN/'UPSTREAM_CUSTODY.private.sqlite');db.execute('pragma cache_size=-131072')
 db.executescript('create table if not exists docs(strict text primary key,member text,ordinal integer,container text,year integer,targets integer,units integer,flat text,stream text,forms text,excluded text);create table if not exists sources(member text primary key,sha256 text,documents integer);create table if not exists aliases(candidate text,member text,ordinal integer,strict text,doc_id text,kind text,primary key(candidate,member,ordinal));')
 for member,h,bytes,n,paras,target in source.execute('select * from sources'):
  db.execute('insert or ignore into sources values(?,?,?)',(member,h,n))
 counts=collections.Counter()
 for s,member,o,file_id,doc_id,flat,year,raw,n,desc,roles,competition,coord in source.execute('select * from targets'):
  forms=json.loads(raw);actual=hashlib.sha256(json.dumps(forms,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
  if actual!=s:raise ValueError('Original target structure fingerprint mismatch')
  reasons=[k for k,v in [('strict',s),('flat',flat),('doc_id',doc_id),('file_id',file_id)] if v and old.execute('select 1 from exposed where kind=? and key=?',(k,v)).fetchone()]
  reasons+=['R4_R3_'+k for k,v in [('strict',s),('flat',flat)] if (r3.execute('select 1 from docs where strict=?',(s,)).fetchone() if k=='strict' else flat in r3flat)]
  reasons+=['R4_R4_'+k for k,v in [('strict',s),('flat',flat),('doc_id',doc_id),('file_id',file_id)] if v in r4keys[k]]
  q='select member,ordinal,strict,doc_id from occurrences where doc_id=? union select member,ordinal,strict,doc_id from occurrences where flat=?'
  aliases=list(main.execute(q,(doc_id,flat)))
  for am,ao,ast,aid in aliases:
   kind='INDEX_EXACT_STRUCTURE_PENDING_WITNESS' if ast==s else 'INDEX_EXACT_FLAT_OR_REVISED_UNRESOLVED'
   db.execute('insert or ignore into aliases values(?,?,?,?,?,?)',(s,am,ao,ast,aid,kind))
   if ast!=s:reasons.append('NONEXACT_ALIAS_PENDING')
  db.execute('insert or ignore into docs values(?,?,?,?,?,?,?,?,?,?,?)',(s,member,o,file_id,year,n,len(forms),flat,hashlib.sha256(''.join(forms).encode()).hexdigest(),raw,','.join(sorted(set(reasons))) or None))
  counts['target_structures']+=1;counts['targets']+=n;counts['known_key_quarantines']+=bool(reasons);counts['indexed_aliases']+=len(aliases)
 db.commit()
 report={'status':'EXECUTED','counts':dict(counts),'r4_r4_prior_members_scanned':len(r4members),'r4_r4_prior_key_cardinalities':{k:len(v) for k,v in r4keys.items()},'r4_r3_prior_flat_keys':len(r3flat),'elapsed_seconds':time.time()-start,'indexed_alias_authority':'PENDING_RAW_ORIGINAL_PROOF','full_passage_custody':'PENDING','human_ground_truth':None}
 (OUT/'SOURCE_GRAPH_PREPARATION.private.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
if __name__=='__main__':main()

