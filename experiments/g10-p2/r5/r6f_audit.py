"""Aggregate-only replay. Corpus text, offsets, and record IDs never exported."""
import collections, hashlib, json, sys, zipfile, time, statistics
from r6e_obligations import candidates, ordinal_anchor
from r6f_targets import rank, lexical_top1, HEADER
from test_r6f_targets import CASES
from r6f_claims import claim_candidates
SHA='92ca0e42198ff10d45b72771b39ce364343634691bc348cfcc0b47de60df3c54'
def run(path):
    with open(path,'rb') as f:
        if hashlib.file_digest(f,'sha256').hexdigest()!=SHA: raise ValueError('SHA mismatch')
    with zipfile.ZipFile(path) as z:
        if z.testzip() is not None: raise ValueError('CRC mismatch')
        rows=json.loads(z.read('GWIG2402606300.json'))['document']
    work=[]; groups=collections.defaultdict(collections.Counter)
    for row in rows:
        o=row['output'][0]; role=o['feedback_type']; level=o['text_type']
        if role not in ('내용','조직'): continue
        source=o['instruction'][0]['input_data']; feedback=o['expert_comment'][0]['comment'];key=role+'/'+level
        groups[key]['records']+=1
        for x in candidates(source,feedback):
            a,b=x['feedback_span'];frag=feedback[a:b];work.append((key,source,frag,level,x))
    times=[]
    for _ in range(7):
        t=time.perf_counter();out=[rank(s,f,l) for _,s,f,l,_ in work];times.append(time.perf_counter()-t)
    for (key,s,f,l,x),r in zip(work,out):
        g=groups[key]; k=x['status'];g[k+'_clauses']+=1;g[k+'_'+r['status']]+=1
        g[k+'_old_anchor']+=bool(x['source_spans'] or ordinal_anchor(s,f,l))
        g[k+'_candidate_nonempty']+=bool(r['candidates']);g[k+'_lexical_top1_nonempty']+=bool(lexical_top1(s,f));g[k+'_multiple_candidates']+=len(r['candidates'])>1
        g[k+'_pair_nonempty']+=bool(r['pair_candidates'])
        if r['status']=='UNRESOLVED' and 'REQUEST_EVIDENCE' in x['kinds']:
            cr=claim_candidates(s,x['kinds'],r);g[k+'_unresolved_evidence_requests']+=1
            for field in ('claims','support','scope_review'):g[k+'_with_'+field]+=bool(cr[field])
            g[k+'_multiple_claims']+=len(cr['claims'])>1
            g[k+'_claim_and_support']+=bool(cr['claims'] and cr['support'])
    dev={}
    for method in ('lexical_top1','candidate_set'):
        exact=covered=extra=empty=0
        for s,f,truth,_ in CASES:
            pred=lexical_top1(HEADER+s,f) if method=='lexical_top1' else rank(HEADER+s,f,'문단')['candidates']
            exact+=set(pred)==set(truth);covered+=bool(truth) and set(truth)<=set(pred);extra+=len(set(pred)-set(truth));empty+=not pred
        dev[method]={'exact':exact,'nonempty_gold_fully_covered':covered,'extra_candidate_count':extra,'empty':empty,'n':len(CASES)}
    return {'archive_sha256':SHA,'records':len(rows),'groups':groups,'authored_development':dev,'rank_calls_per_replay':len(work),'median_seconds':statistics.median(times),'min_seconds':min(times),'max_seconds':max(times),'replays':len(times),'limits':'Candidate coverage not semantic accuracy; no row-level data, no edits, no provider calls.'}
if __name__=='__main__':print(json.dumps(run(sys.argv[1]),ensure_ascii=False,indent=2))
