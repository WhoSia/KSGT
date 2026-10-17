"""Paired document-equal frozen-transfer summaries and qualified cluster resampling."""
import collections,json,sqlite3,sys,time
from r4_r3_inventory import ROOT,RUN,OUT,ro,write
import numpy as np
def main():
    start=time.time();manifest=json.loads((OUT/'FROZEN_COHORT.private.json').read_text());gate=manifest['manifest'];parent={r['id']:r['id'] for r in manifest['records']}
    def root(x):
        while parent[x]!=x:parent[x]=parent[parent[x]];x=parent[x]
        return x
    for link in manifest['links']:
        if link['kind'] in ('NORMALIZED_ONLY','CROSS_ID_VERSION_UNRESOLVED'):continue
        a,b=root(link['left']),root(link['right']);parent[max(a,b)]=min(a,b)
    a=ro(RUN/'R3_TRANSFER.private.sqlite');b=ro(RUN/'R4_TRANSFER.private.sqlite');r3={s:json.loads(p) for s,p in a.execute('select strict,payload from results')};rows=[];counts=collections.Counter();stat=collections.defaultdict(collections.Counter);cost=collections.Counter();union=collections.Counter()
    source=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');engineering=source.execute('select count(*),sum(units),sum(targets),sum(targets>0),sum(targets=0) from docs').fetchone()
    for s,member,container,year,units,targets,p in b.execute('select strict,member,container,year,units,targets,payload from results'):
        if s not in r3:raise ValueError('Unpaired structure')
        v=json.loads(p);r=r3[s]
        if len(v)!=targets or len(r)!=targets or [x['target'] for x in v]!=[x['target'] for x in r]:raise ValueError('Paired target identity or denominator mismatch')
        scores={k:0 for k in ['stream','typed','r4_raw','r4','v3','simple_individual']}
        for rv,rr in zip(v,r):
            for k in ['stream','typed']:scores[k]+=rr[k]['admitted'];stat[k][rr[k]['result']['status']]+=1;cost[k]+=rr[k]['elapsed_seconds'];counts[k+'_future_changes']+=rr[k]['future_control_decision_changed']
            for k in ['r4','v3']:scores[k]+=rv[k]['admitted'];stat[k][rv[k]['result']['status']]+=1;cost[k]+=rv[k]['elapsed_seconds']
            scores['r4_raw']+=rv['r4']['proposed'];scores['simple_individual']+=rv['simple_individual']['admitted']
            counts['v3_gains_vs_raw_r4']+=not rv['r4']['proposed'] and rv['v3']['admitted'];counts['v3_losses_vs_raw_r4']+=rv['r4']['proposed'] and not rv['v3']['admitted'];counts['r4_v3_decision_changes']+=rv['r4_v3_decision_changed']
            for k in ['prefix_control_violation','r4_prefix_control_violation','joined_source_status_changed','joined_source_proposal_changed']:counts[k]+=rv[k]
            for name in ['r4','v3']:
                result=rv[name]['result'];union[name+'_union_occurrences']+=len(result.get('unions',[]))
                for n in result.get('nodes',[]):union[name+'_'+n.get('assertion','UNKNOWN')]+=1
                for u in result.get('unions',[]):
                    ns={n['id']:n for n in result['nodes']};cs=[ns[i]['cardinality'] for i in u['component_ids']];bounds=u['conditional_set_bounds']
                    if all(type(x) is int and x>=0 for x in cs):union[name+'_classical_bound_comparisons']+=1;union[name+'_classical_bound_mismatches']+=(bounds['lower'],bounds['upper'])!=(max(cs),sum(cs))
                for x in result.get('union_diagnostics',[]):union[name+'_'+x['verdict']]+=1
        counts.update(scores);counts['targets']+=targets
        rows.append({'strict_private':s,'component_private':root(s),'container_private':container,'year':year,'units':units,'targets':targets,**{k:v/targets for k,v in scores.items()}})
    if set(r3)!={x['strict_private'] for x in rows}:raise ValueError('Unpaired checkpoint population')
    frozen_ids=set(gate['by_split']['frozen_transfer']['tokens']);actual={x['strict_private'] for x in rows}
    if actual!=frozen_ids:raise ValueError('Incomplete frozen population')
    rng=np.random.default_rng(626303)
    def estimate(records,left,right,cluster):
        groups=collections.defaultdict(list)
        for r in records:groups[r[cluster]].append(r[left]-r[right])
        values=list(groups.values());sums=np.array([sum(x) for x in values]);den=np.array([len(x) for x in values]);z=[]
        for _ in range(2000):
            idx=rng.integers(0,len(values),len(values));z.append(float(sums[idx].sum()/den[idx].sum()*100))
        return {'documents':len(records),'clusters':len(values),'document_equal_percentage_points':float(sums.sum()/den.sum()*100),'descriptive_cluster_percentile_interval':list(map(float,np.quantile(z,[.025,.975]))),'qualification':'Conditional descriptive resampling of observed clusters; source containers are not intellectual-work gold or population sampling units.'}
    comparisons={}
    for left,right in [('v3','r4'),('v3','r4_raw'),('r4_raw','typed'),('simple_individual','v3')]:
        comparisons[left+'_minus_'+right]={k:estimate(rows,left,right,k) for k in ['component_private','container_private']}
    strata={}
    for kind in ['year','container_private','length']:
        groups=collections.defaultdict(list)
        for r in rows:
            key=r[kind] if kind!='length' else ('1-5' if r['units']<=5 else ('6-15' if r['units']<=15 else '16+'))
            groups[str(key)].append(r)
        strata[kind]={key:{'documents':len(rs),'targets':sum(x['targets'] for x in rs),'v3_minus_r4_raw':estimate(rs,'v3','r4_raw','component_private')} for key,rs in groups.items()}
    out={'status':'VERIFIED','engineering_census':dict(zip(['structures','paragraphs','targets','target_documents','zero_target_structures'],engineering)),'frozen_transfer_documents':len(rows),'frozen_transfer_targets':counts['targets'],'source_containers':len({r['container_private'] for r in rows}),'metadata_years':sorted({r['year'] for r in rows}),'source_dependency_components':len({r['component_private'] for r in rows}),'counts':dict(counts),'statuses':{k:dict(v) for k,v in stat.items()},'union_and_assertion_counts':dict(union),'model_seconds':dict(cost),'comparisons':comparisons,'private_strata':strata,'elapsed_seconds':time.time()-start,'semantic_accuracy':None,'human_ground_truth':None,'global_semantic_source_work_independence':'HOLD','counterfactual_join_ceiling':'Proposal/status sensitivity on an artificial joined view only; not original-source admission, source-span invariance or semantic accuracy.','reserved_late_inference_count':0}
    write('FROZEN_TRANSFER_RESULTS.private.json',out);write('DOCUMENT_EQUAL_MACHINE_SCORES.private.json',rows);print(json.dumps({k:v for k,v in out.items() if k!='private_strata'},indent=2),flush=True)
if __name__=='__main__':main()
