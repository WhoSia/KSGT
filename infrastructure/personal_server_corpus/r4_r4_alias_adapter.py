"""Raw original occurrence witnesses for indexed same-ID and exact-flat hits."""
import pathlib,sys,sqlite3
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'
sys.path[:0]=[str(PRIOR/'code'),str(PRIOR/'baseline_code')]
c=sqlite3.connect(RUN/'UPSTREAM_CUSTODY.private.sqlite');m=sqlite3.connect((ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite').as_uri()+'?mode=ro',uri=True);m.execute('pragma cache_size=-131072')
c.execute('create table if not exists aliases(candidate text,member text,ordinal integer,strict text,doc_id text,kind text,primary key(candidate,member,ordinal))')
for s,member,o,flat in list(c.execute('select strict,member,ordinal,flat from docs where targets>0')):
 did=m.execute('select doc_id from occurrences where member=? and ordinal=?',(member,o)).fetchone()[0]
 for am,ao,ast,aid in m.execute('select member,ordinal,strict,doc_id from occurrences where doc_id=? union select member,ordinal,strict,doc_id from occurrences where flat=?',(did,flat)):
  c.execute('insert or ignore into aliases values(?,?,?,?,?,?)',(s,am,ao,ast,aid,'INDEX_CANDIDATE_REQUIRES_RAW_PROOF'))
c.commit();c.close();m.close()
source=(PRIOR/'code/r4_r3_raw_witness.py').read_text()
source=source.replace('from r4_r3_inventory import ROOT,RUN,OUT,ro,write',"import pathlib\nfrom r4_r3_inventory import ro\nROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'\ndef write(n,x):(OUT/n).write_text(json.dumps(x,indent=2),encoding='utf-8')")
source=source.replace("str(RUN/'baseline_code')","str(PRIOR/'baseline_code')")
p=RUN/'r4_r4_raw_witness_executed.py'
if p.exists() and p.read_text()!=source:raise ValueError('Auditor changed on continuation')
p.write_text(source,encoding='utf-8');exec(compile(source,str(p),'exec'),{'__name__':'__main__'})
