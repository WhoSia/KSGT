"""Bounded next-P62 source-opportunity census; no reference model evaluation."""
import collections,datetime,hashlib,io,json,pathlib,sqlite3,sys,time,zipfile
BASE=pathlib.Path('C:/KSGT_SERVER');PRIOR=BASE/'70_RUNS/p62_r4_r3_20261013';RUN=BASE/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=BASE/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'
sys.path.insert(0,str(PRIOR/'baseline_code'));sys.path.insert(0,str(PRIOR/'code'))
import pipeline,p62_reference as ref,p62_r4_discourse as r4,p62_r4_guarded_v3 as lexer
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(4*1024**2),b''):h.update(b)
 return h.hexdigest()
def write(n,x):(OUT/n).write_text(json.dumps(x,ensure_ascii=True,indent=2),encoding='utf-8')
def main():
 start=time.time();raw=json.loads((BASE/'80_EXPORT/p62_referential_grounding_20261011/R4_R3_20261013/SOURCE_MEMBER_OPPORTUNITIES.private.json').read_text())['members'];used={x['member'] for x in json.loads((BASE/'80_EXPORT/p62_referential_grounding_20261011/R4_R3_20261013/CUSTODY_SELECTION_PREDECLARATION.private.json').read_text())['selected_members']};plan=[];years=set()
 for x in raw:
  if x['member'] in used or x['previous_container_exposed'] or x['first_document_year'] in years:continue
  plan.append(x);years.add(x['first_document_year'])
  if len(plan)==3:break
 declaration={'status':'PLANNED','utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'purpose':'Find untouched source opportunities for coordination-enriched higher-order/singleton mechanism falsification, not antecedent accuracy','selection':'First unused unexposed annual member per distinct first-document metadata year in ascending member SHA order; first three, no outcome-based reselection','plan':plan,'code_sha256':sha(pathlib.Path(__file__)),'frozen_transfer_reused':False,'reserved_late_reused':False,'reference_inference':'FORBIDDEN','human_ground_truth':None}
 if (OUT/'PREDECLARATION.private.json').exists():raise ValueError('Fresh version required; preserve prior opportunity results')
 write('PREDECLARATION.private.json',declaration)
 main=sqlite3.connect((BASE/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite').as_uri()+'?mode=ro',uri=True);old=sqlite3.connect((BASE/'70_RUNS/p62_r4_r2_20261013/COHORT.private.sqlite').as_uri()+'?mode=ro',uri=True);prior=sqlite3.connect((PRIOR/'UPSTREAM_CUSTODY.private.sqlite').as_uri()+'?mode=ro',uri=True);known_flat={x[0] for x in prior.execute('select flat from docs')};known_ids={x[0] for x in prior.execute('select distinct doc_id from aliases')};counts=collections.Counter();strata=collections.defaultdict(collections.Counter);witnesses=[];verified=[]
 for p in plan:
  archive,name,expected_sha,expected_bytes,expected_docs=main.execute('select archive,name,sha256,bytes,documents from members where key=?',(p['member'],)).fetchone();n=0
  with zipfile.ZipFile(BASE/'10_INBOX/nikl_legacy_14zip'/archive) as z,z.open(name) as source:
   hashed=pipeline.Hashed(source);text=io.TextIOWrapper(io.BufferedReader(hashed,65536),encoding='utf-8-sig');local=collections.Counter()
   for file_id,metadata,doc in pipeline.json_docs(text):
    forms=[u['form'] for u in pipeline.validate(doc,'json')];strict,flat=pipeline.fingerprints(forms);date=str(doc['metadata'].get('date',''));year=datetime.datetime.strptime(date,'%Y%m%d').year
    counts['structures']+=1;counts['paragraphs']+=len(forms);targets=sum(len(list(ref.TARGET.finditer(f))) for f in forms);counts['partitive_targets']+=targets;counts['partitive_target_structures']+=targets>0
    exposed=flat in known_flat or doc['id'] in known_ids or any(old.execute('select 1 from exposed where kind=? and key=?',(k,v)).fetchone() for k,v in [('strict',strict),('flat',flat),('doc_id',doc['id']),('file_id',file_id)])
    counts['known_key_excluded_structures']+=exposed
    for i,f in enumerate(forms):
     ms=list(lexer.kernel.R4_COUNT.finditer(f));chains=[];chain=[]
     for a,b in zip(ms,ms[1:]):
      connected=a.group('counter')==b.group('counter') and r4.COORDINATOR.fullmatch(f[a.end():b.start()]) is not None
      if connected:
       if not chain:chain=[a]
       chain.append(b)
      elif chain:chains.append(chain);chain=[]
     if chain:chains.append(chain)
     for chain in chains:
      cards=[int(m.group('number')) if m.group('number').isdigit() else r4.R4_NUMBERS.get(m.group('number')) for m in chain]
      local['pair_or_larger_chains']+=1;local['higher_order_chains']+=len(chain)>=3;local['singleton_constituent_chains']+=1 in cards;local['partitive_in_same_unit']+=bool(ref.TARGET.search(f))
      if not exposed and (len(chain)>=3 or 1 in cards):
       witnesses.append({'source_member':p['member'],'document_ordinal':n,'strict_private':strict,'publication_year':year,'unit_ordinal':i,'component_spans':[[m.start(),m.end()] for m in chain],'parsed_cardinalities':cards,'unit_sha256':hashlib.sha256(f.encode()).hexdigest(),'partitive_in_same_unit':bool(ref.TARGET.search(f)),'authority':'RAW_SOURCE_LEXICAL_COORDINATION_CANDIDATE_ONLY','human_ground_truth':None})
       counts['known_key_admissible_enrichment_witnesses']+=1
    strata[year]['structures']+=1;strata[year]['targets']+=targets;n+=1
   if hashed.h.hexdigest()!=expected_sha or hashed.count!=expected_bytes or n!=expected_docs:raise ValueError('Raw opportunity-source hash/EOF/count mismatch')
  counts.update(local);verified.append({'member_private':p['member'],'raw_member_sha256':expected_sha,'documents':n,'counts':dict(local)})
 write('ENRICHMENT_SOURCE_WITNESSES.private.json',witnesses)
 report={'status':'EXECUTED','counts':dict(counts),'metadata_year_strata':dict(strata),'verified_source_members':verified,'elapsed_seconds':time.time()-start,'no_reference_model_outcomes_computed':True,'global_semantic_source_work_independence':'HOLD','next_experiment_status':'HOLD_PENDING_COMPLETE_OLD_AND_R4_R3_PASSAGE_AND_ALIAS_CUSTODY','not_claimed':'Known-key exclusions alone do not establish work separation. These witnesses are source-selection candidates, not semantic coordination or antecedent gold.','human_ground_truth':None};write('R4_R4_OPPORTUNITY_REPORT.private.json',report)
 print(json.dumps({k:v for k,v in report.items() if k!='verified_source_members'},indent=2),flush=True)
if __name__=='__main__':main()
