"""Conservative observed lineage components, not certified authors or a heldout split."""
from collections import defaultdict,Counter
import hashlib,json,sys
from r6a_nikl_census import read,one,target

def audit(rows):
    roots=list(range(len(rows)));groups=defaultdict(list)
    def find(i):
        while roots[i]!=i:
            roots[i]=roots[roots[i]];i=roots[i]
        return i
    def join(i,j):
        a,b=find(i),find(j)
        if a!=b:roots[max(a,b)]=min(a,b)
    for ix,d in enumerate(rows):
        i,o=one(d['input']),one(d['output']);a=i['metadata']['author_id'];t=target(one(o['instruction'])['input_data']);keys={('author',a),('target',t)}
        for p in i['paragraph']:
            keys.add(('work_prefix',p['id'].split('.')[0]));keys.add(('paragraph_id',p['id']))
            for s in p['sentence']:keys.add(('sentence_id',s['id']))
        for k in keys:
            if groups[k]:join(ix,groups[k][0])
            groups[k].append(ix)
    comps=defaultdict(list)
    for ix in range(len(rows)):comps[find(ix)].append(ix)
    # Diagnostic assignment only: record-hash 80/20 versus group-hash 80/20.
    # Never release row IDs or designate any data as a prospective holdout here.
    def label(s):return hashlib.sha256(('R6A-DIAGNOSTIC-'+s).encode()).digest()[0]<51
    naive={ix:label(d['id']) for ix,d in enumerate(rows)}
    grouped={ix:label(min(rows[j]['id'] for j in v)) for v in comps.values() for ix in v}
    def report(assign):
        crosses=[v for v in comps.values() if len({assign[ix] for ix in v})>1]
        return {'diagnostic_test_rows':sum(assign.values()),'crossing_components':len(crosses),'rows_in_crossing_components':sum(map(len,crosses)),'crossing_keys_by_kind':dict(Counter(k[0] for k,v in groups.items() if len({assign[ix] for ix in v})>1))}
    return {'components':len(comps),'largest_component':max(map(len,comps.values()),default=0),'component_size_histogram':dict(sorted(Counter(map(len,comps.values())).items())),'naive_record_hash':report(naive),'component_hash':report(grouped),'unseen_author_work_certified':False,'holdout_frozen':False,'warning':'Prefix is a conservative observed grouping key; near duplicates and original author identity unresolved. Whole dataset already processed for descriptive development.'}

if __name__=='__main__':print(json.dumps(audit(read(sys.argv[1])[0]),ensure_ascii=False,indent=2))
