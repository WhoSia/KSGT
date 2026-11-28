"""Private corpus replay: only aggregate counts, no texts or record IDs emitted."""
import collections, hashlib, json, sys, zipfile
from r6e_obligations import candidates, baseline, ordinal_anchor
from test_r6e_obligations import CASES
SHA='92ca0e42198ff10d45b72771b39ce364343634691bc348cfcc0b47de60df3c54'
def run(path):
    with open(path,'rb') as f:
        if hashlib.file_digest(f,'sha256').hexdigest()!=SHA: raise ValueError('SHA mismatch')
    with zipfile.ZipFile(path) as z:
        if z.testzip() is not None: raise ValueError('CRC mismatch')
        rows=json.loads(z.read('GWIG2402606300.json'))['document']
    groups=collections.defaultdict(collections.Counter)
    for row in rows:
        o=row['output'][0]; role=o['feedback_type']; level=o['text_type']
        if role not in ('내용','조직'): continue
        source=o['instruction'][0]['input_data']; feedback=o['expert_comment'][0]['comment']
        g=groups[role+'/'+level]; g['records']+=1
        old=baseline(feedback); xs=candidates(source,feedback); new={k for x in xs if x['status']=='PROPOSED' for k in x['kinds']}
        g['baseline_records']+=bool(old);g['proposed_records']+=bool(new);g['review_records']+=any(x['status']=='REVIEW' for x in xs)
        for x in xs:
            g[x['status']+'_clauses']+=1
            g[x['status']+'_unique_quote_anchor']+=bool(x['source_spans'])
            a,b=x['feedback_span']; g[x['status']+'_ordinal_anchor']+=ordinal_anchor(source,feedback[a:b],level) is not None
            if x['status']=='PROPOSED':
                for k in x['kinds']:g['proposed_'+k]+=1
    dev={}
    for method in ('keyword','scoped'):
        tp=fp=fn=exact=0
        for feedback,expected in CASES:
            got=baseline(feedback) if method=='keyword' else {k for x in candidates('',feedback) if x['status']=='PROPOSED' for k in x['kinds']}
            tp+=len(got&expected);fp+=len(got-expected);fn+=len(expected-got);exact+=got==expected
        dev[method]={'tp':tp,'fp':fp,'fn':fn,'exact_records':exact,'n':len(CASES)}
    return {'archive_sha256':SHA,'records':len(rows),'groups':groups,'authored_development':dev,'limitations':'Keyword-based candidates; not independent gold; no factual permission; no source content emitted.'}
if __name__=='__main__':print(json.dumps(run(sys.argv[1]),ensure_ascii=False,indent=2))
