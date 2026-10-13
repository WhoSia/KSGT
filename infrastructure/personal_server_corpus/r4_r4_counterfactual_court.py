"""Private source-derived synthetic probes, explicitly not observed references."""
import collections,hashlib,json,pathlib,sqlite3,sys,time
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'
sys.path[:0]=[str(RUN/'code'),str(PRIOR/'code'),str(PRIOR/'baseline_code')]
import p62_r4_guarded_v3 as v3
from p62_r4_r3_source_witness import strict
from p62_r4_r4_conditional_diagnostics import diagnose
def digest(x):return hashlib.sha256(json.dumps(x,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
def main():
 start=time.time();witnesses=json.loads((OUT/'ENRICHMENT_SOURCE_WITNESSES.private.json').read_text());c=sqlite3.connect((RUN/'UPSTREAM_CUSTODY.private.sqlite').as_uri()+'?mode=ro',uri=True)
 declaration={'status':'PLANNED','purpose':'Source-derived authored target-capacity probes only; not observed discourse reference or prospective independent transfer','witness_population_sha256':digest(witnesses),'code_sha256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),'diagnostics_sha256':hashlib.sha256((RUN/'code/p62_r4_r4_conditional_diagnostics.py').read_bytes()).hexdigest(),'construction':'Keep original units up to final coordination component, truncate at its end, append an authored partitive with quantity sum or sum+1 and the same counter. New derived identity. No original-reference or full-original-source admission claim.','probe_quantities':['sum','sum+1'],'exclusions':'Unknown lexical cardinalities retained as explicit HOLD; all selected 159 witnesses retained, including unaudited zero-target structures. Original source-work exclusion not asserted for this controlled development lane.','human_ground_truth':None}
 p=OUT/'COUNTERFACTUAL_PREDECLARATION.private.json'
 if p.exists() and json.loads(p.read_text())!=declaration:raise ValueError('Counterfactual declaration changed')
 if not p.exists():p.write_text(json.dumps(declaration,indent=2),encoding='utf-8')
 rows=[];counts=collections.Counter();dcounts=collections.Counter()
 for w in witnesses:
  cards=w['parsed_cardinalities'];forms=json.loads(c.execute('select forms from docs where strict=?',(w['strict_private'],)).fetchone()[0]);unit=w['unit_ordinal'];a,b=w['component_spans'][-1];m=next(m for m in v3.kernel.R4_COUNT.finditer(forms[unit]) if (m.start(),m.end())==(a,b));counter=m.group('counter')
  if any(type(x) is not int for x in cards):counts['unknown_cardinality_witness_hold']+=1;continue
  for lane,q in [('sum',sum(cards)),('sum_plus_one',sum(cards)+1)]:
   prefix=forms[:unit]+[forms[unit][:b]+' 그중 '+str(q)+counter+'이 이동했다.']
   t={'unit':unit,'start':b+1,'end':b+3,'observed':False,'authority':'AUTHORED_COUNTERFACTUAL_SUFFIX'}
   identity={'strict_structure':strict(prefix),'member_key':w['source_member'],'archive_sha256':'d'*64,'document_ordinal':w['document_ordinal']}
   # The archive token is a declared synthetic fixture marker, never custody proof.
   r=v3.infer(prefix,t,identity);d=diagnose(prefix,t,identity,r)
   counts['probes']+=1;counts[lane+'_probes']+=1;counts[lane+'_v3_proposals']+=r.get('selected') is not None
   for u in d['unions']:dcounts[lane+':'+u['status']]+=1
   rows.append({'source_witness':w,'lane':lane,'authored_quantity':q,'original_reference_observed':False,'derived_source_identity':identity,'v3_status':r['status'],'v3_selected':r.get('selected'),'diagnostics':d,'human_ground_truth':None})
 (OUT/'COUNTERFACTUAL_RESULTS.private.json').write_text(json.dumps(rows,ensure_ascii=True),encoding='utf-8')
 report={'status':'EXECUTED','counts':dict(counts),'diagnostic_union_counts':dict(dcounts),'elapsed_seconds':time.time()-start,'human_ground_truth':None,'semantic_accuracy':None,'claim_ceiling':'Controlled source-derived synthetic quantity experiments, not natural antecedent recovery. Context truncation and authored suffix alter evidence; source-work independence is not established in this development lane.','result_sha256':digest(rows)}
 (OUT/'COUNTERFACTUAL_REPORT.private.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
if __name__=='__main__':main()
