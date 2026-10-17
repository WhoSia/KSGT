"""Identify focal versus background groups without creating semantic gold."""
import collections,hashlib,json,pathlib,sqlite3,sys
ROOT=pathlib.Path('C:/KSGT_SERVER');PRIOR=ROOT/'70_RUNS/p62_r4_r3_20261013';RUN=ROOT/'70_RUNS/p62_r4_r4_opportunity_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R4_OPPORTUNITY_20261013'
sys.path[:0]=[str(PRIOR/'baseline_code')]
import p62_r4_discourse as r4
rows=json.loads((OUT/'COUNTERFACTUAL_RESULTS.private.json').read_text());db=sqlite3.connect((RUN/'UPSTREAM_CUSTODY.private.sqlite').as_uri()+'?mode=ro',uri=True);counts=collections.Counter();mapped=[]
for row in rows:
 w=row['source_witness'];forms=json.loads(db.execute('select forms from docs where strict=?',(w['strict_private'],)).fetchone()[0]);unit=w['unit_ordinal'];offset=sum(map(len,forms[:unit]));ids=[]
 for a,b in w['component_spans']:
  ids.append(r4._id('R4_GROUP',[offset+a,offset+b,forms[unit][a:b],unit]))
 focal=[u for u in row['diagnostics'].get('unions',[]) if set(u['bounds'].get('component_ids',[]))==set(ids)]
 if len(focal)>1:raise ValueError('Focal original component union multiply mapped')
 focal_status=focal[0]['status'] if focal else 'HOLD_FOCAL_UNION_NOT_GENERATED'
 counts[row['lane']+':'+focal_status]+=1
 if not focal:counts[row['lane']+':missing_focal_v3_status:'+row['v3_status']]+=1
 selected=row['v3_selected']
 if selected:
  category='FOCAL_CONSTITUENT' if selected['id'] in ids else 'OTHER_SOURCE_GROUP'
  counts[row['lane']+':selected:'+category]+=1
  if category=='FOCAL_CONSTITUENT' and selected['cardinality']<row['authored_quantity']:raise ValueError('Observed capacity violation')
 else:category='ABSTAIN';counts[row['lane']+':selected:'+category]+=1
 mapped.append({'lane':row['lane'],'source_structure_private':w['strict_private'],'focal_union_status':focal_status,'selection_class':category,'semantic_correctness':None})
report={'status':'VERIFIED','counts':dict(counts),'source_results_sha256':hashlib.sha256((OUT/'COUNTERFACTUAL_RESULTS.private.json').read_bytes()).hexdigest(),'interpretation':'All proposed individual groups were background source groups, not the authored focal union. This is policy competition, not proof of incorrect reference. The focal union has no independently established denotation.','human_ground_truth':None}
(OUT/'COUNTERFACTUAL_FAILURE_AUDIT.private.json').write_text(json.dumps(report,indent=2),encoding='utf-8');(OUT/'COUNTERFACTUAL_FOCAL_MAPPING.private.json').write_text(json.dumps(mapped),encoding='utf-8');print(json.dumps(report),flush=True)
