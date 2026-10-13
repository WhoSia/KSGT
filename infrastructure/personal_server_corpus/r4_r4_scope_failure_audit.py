"""Versioned post-outcome development audit of masked quotation HOLDs."""
import collections,hashlib,json,pathlib,sqlite3,sys
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'
sys.path[:0]=[str(RUN/'code'),str(PRIOR/'baseline_code'),str(PRIOR/'code')]
import p62_r4_guarded_v3 as guarded
from p62_r4_r3_source_witness import strict
from p62_r4_r4_scope_diagnostics import infer
rows=json.loads((OUT/'COUNTERFACTUAL_RESULTS.private.json').read_text());c=sqlite3.connect((RUN/'UPSTREAM_CUSTODY.private.sqlite').as_uri()+'?mode=ro',uri=True);counts=collections.Counter();mapped=[]
for row in rows:
 w=row['source_witness'];forms=json.loads(c.execute('select forms from docs where strict=?',(w['strict_private'],)).fetchone()[0]);unit=w['unit_ordinal'];a,b=w['component_spans'][-1];m=next(m for m in guarded.kernel.R4_COUNT.finditer(forms[unit]) if (m.start(),m.end())==(a,b));counter=m.group('counter')
 derived=forms[:unit]+[forms[unit][:b]+' 그중 '+str(row['authored_quantity'])+counter+'이 이동했다.'];t={'unit':unit,'start':b+1,'end':b+3,'observed':False}
 if strict(derived)!=row['derived_source_identity']['strict_structure']:raise ValueError('Counterfactual replay source mismatch')
 d=infer(derived,t,row['derived_source_identity'])
 # JSON turns quotation-scope tuples into lists; compare canonical values.
 if d['frozen_v3_status']!=row['v3_status'] or guarded.digest(d['selected'])!=guarded.digest(row['v3_selected']):raise ValueError('Frozen decision replay changed')
 counts['replayed_probes']+=1;counts['masked_quotation_holds']+=d['masked_quotation_hold'];counts['causal:'+d['causal_status']]+=1
 mapped.append({'lane':row['lane'],'source_structure_private':w['strict_private'],'diagnostics':d})
report={'status':'VERIFIED','lane':'POST_OUTCOME_DEVELOPMENT_ONLY','counts':dict(counts),'code_sha256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),'diagnostic_module_sha256':hashlib.sha256((RUN/'code/p62_r4_r4_scope_diagnostics.py').read_bytes()).hexdigest(),'frozen_choices_changed':0,'human_ground_truth':None,'semantic_accuracy':None}
(OUT/'SCOPE_FAILURE_AUDIT.private.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(OUT/'SCOPE_FAILURE_MAPPING.private.json').write_text(json.dumps(mapped),encoding='utf-8');print(json.dumps(report),flush=True)
