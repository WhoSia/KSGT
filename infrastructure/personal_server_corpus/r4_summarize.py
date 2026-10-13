"""Paired document-equal machine summaries with explicit clustering limits."""
import collections,json,pathlib,sqlite3
import numpy as np
ROOT=pathlib.Path('C:/KSGT_SERVER');RUN=ROOT/'70_RUNS/p62_r4_r2_20261013';OUT=ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R2_20261013'
def ro(name):return sqlite3.connect((RUN/name).as_uri()+'?mode=ro',uri=True)
def load(name):return {row[0]:json.loads(row[1]) for row in ro(name).execute('select strict,payload from results')}
def bootstrap(values,keys):
    if not values:return None
    groups=collections.defaultdict(list)
    for key,value in zip(keys,values):groups[key].append(value)
    arrays=list(groups.values());rng=np.random.default_rng(62402);draws=[]
    for _ in range(1000):draws.append(np.mean([v for i in rng.integers(0,len(arrays),len(arrays)) for v in arrays[i]]))
    return {'estimate_pp':float(np.mean(values)),'percentile_interval_pp':[float(x) for x in np.quantile(draws,[.025,.975])],'clusters':len(arrays),'draws':1000,'scope':'Conditional descriptive resampling; two source-container clusters do not support reliable population inference' if len(arrays)<10 else 'Operational observed-ID clustering, not globally certified world-work independence'}

def run():
    r3=load('R3.private.sqlite');r4=load('R4.private.sqlite');guarded=load('GUARDED.private.sqlite')
    assert set(r3)==set(r4)==set(guarded)
    totals={}
    for name,records in [('R3',r3),('R4',r4),('GUARDED',guarded)]:
        counter=collections.Counter()
        for payload in records.values():counter.update(payload)
        totals[name]=dict(counter)
    rows=[];c=ro('COHORT.private.sqlite');target_counts=dict(ro('R3.private.sqlite').execute('select strict,targets from results'))
    for strict,work,doc_id,year,units in c.execute('select strict,work,doc_id,year,units from candidate where excluded is null'):
        n=target_counts[strict]
        if not n:continue
        rows.append({'strict':strict,'work':work,'doc_id':doc_id or strict,'year':year or 'UNKNOWN','length':'SHORT_1_TO_5' if units<=5 else 'MEDIUM_6_TO_20' if units<=20 else 'LONG_21_PLUS','targets':n,
          'R4_MINUS_R3':100*(r4[strict].get('constrained_proposals',0)-r3[strict].get('typed_proposals',0))/n,
          'GUARDED_MINUS_R4':100*(guarded[strict].get('proposals',0)-r4[strict].get('constrained_proposals',0))/n,
          'R4_CONSTRAINT_ABLATION':100*(r4[strict].get('constrained_proposals',0)-r4[strict].get('unconstrained_proposals',0))/n})
    estimates={}
    for metric in ['R4_MINUS_R3','GUARDED_MINUS_R4','R4_CONSTRAINT_ABLATION']:
        estimates[metric]={'source_container_clustered':bootstrap([r[metric] for r in rows],[r['work'] for r in rows]),'observed_document_ID_sensitivity':bootstrap([r[metric] for r in rows],[r['doc_id'] for r in rows])}
    strata={}
    for field in ['year','length']:
        strata[field]={}
        for value in sorted({r[field] for r in rows}):
            selected=[r for r in rows if r[field]==value]
            strata[field][value]={'target_documents':len(selected),'targets':sum(r['targets'] for r in selected),'R4_MINUS_R3':bootstrap([r['R4_MINUS_R3'] for r in selected],[r['work'] for r in selected])}
    result={'status':'VERIFIED','structures':len(r3),'paragraphs':c.execute('select sum(units) from candidate where excluded is null').fetchone()[0],'targets':sum(target_counts.values()),'target_documents':len(rows),'zero_target_structures':len(r3)-len(rows),'source_container_clusters':len({r['work'] for r in rows}),'totals':totals,'paired_document_equal_estimands':estimates,'strata':strata,'human_ground_truth':None,'semantic_accuracy':None,'claim_ceiling':'Machine proposal rates and construction consistency only. Single release, two source containers, unresolved semantic work genealogy, post hoc guarded architecture; no population semantic generalization.'}
    (OUT/'PAIRED_MACHINE_RESULTS.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result),flush=True)

if __name__=='__main__':run()
