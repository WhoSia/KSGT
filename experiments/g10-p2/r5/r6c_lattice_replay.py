"""Local differential analysis. Input corpus never leaves local subprocess; output aggregates only."""
import collections, itertools, json, statistics, subprocess, sys, time
from r6a_nikl_census import read
from r6b_feedback_alignment import audit, edits
from r6b_shared_edits import shared

def reference(a,b):
    n,m=len(a),len(b);stride=m+1;size=(n+1)*stride
    d=[0]*size;w=[0]*size;w[-1]=1
    for i in range(n,-1,-1):
        for j in range(m,-1,-1):
            k=i*stride+j
            if k==size-1:continue
            best=n+m+1;count=0
            if i<n and j<m:
                l=k+stride+1;best=d[l]+(a[i]!=b[j]);count=w[l]
            if i<n:
                l=k+stride;v=d[l]+1
                if v<best:best,count=v,w[l]
                elif v==best:count+=w[l]
            if j<m:
                l=k+1;v=d[l]+1
                if v<best:best,count=v,w[l]
                elif v==best:count+=w[l]
            d[k]=best;w[k]=count
    p=[0]*size;p[0]=1;possible=[];forced=[]
    for k in range(size):
        if not p[k]:continue
        i,j=divmod(k,stride)
        opts=[]
        if i<n and j<m:opts.append((k+stride+1,int(a[i]!=b[j]),'keep' if a[i]==b[j] else 'replace',b[j]))
        if i<n:opts.append((k+stride,1,'delete',''))
        if j<m:opts.append((k+1,1,'insert',b[j]))
        for l,c,kind,t in opts:
            if c+d[l]!=d[k]:continue
            p[l]+=p[k]
            if kind=='keep':continue
            edge=dict(i=i,j=j,kind=kind,text=t);possible.append(edge)
            if p[k]*w[l]==w[0]:forced.append(edge)
    return dict(distance=d[0],paths=str(w[0]),possible=possible,forced=forced)

def native(binary,pairs,full=False):
    payload=''.join(json.dumps(dict(source=a,target=b),ensure_ascii=False)+'\n' for a,b in pairs)
    proc=subprocess.run([binary]+(["--full"] if full else []),input=payload,text=True,capture_output=True,check=True)
    out=[json.loads(s) for s in proc.stdout.splitlines()]
    if len(out)!=len(pairs):raise ValueError('RESPONSE_COUNT')
    return out

def small_oracle(a,b):
    # Enumerate all edit paths, independently of the DP; only tiny synthetic strings.
    def paths(i,j):
        if (i,j)==(len(a),len(b)):yield 0,();return
        if i<len(a) and j<len(b):
            c=int(a[i]!=b[j]);e=((i,j,'replace',b[j]),) if c else ()
            for n,p in paths(i+1,j+1):yield n+c,e+p
        if i<len(a):
            for n,p in paths(i+1,j):yield n+1,((i,j,'delete',''),)+p
        if j<len(b):
            for n,p in paths(i,j+1):yield n+1,((i,j,'insert',b[j]),)+p
    allp=list(paths(0,0));best=min(x[0] for x in allp);ps=[set(p) for d,p in allp if d==best]
    return best,len(ps),set.union(*ps),set.intersection(*ps)

def key(e):return (e['i'],e['j'],e['kind'],e['text'])
def check_synthetic(binary):
    words=[''.join(w) for n in range(4) for w in itertools.product('가😀',repeat=n)]
    pairs=list(itertools.product(words,repeat=2))+[('가\u0301','가'),('가','가'),('','\t'),('\r\n','\n')]
    band=native(binary,pairs);assert band==native(binary,pairs,True)
    for (a,b),r in zip(pairs,band):
        d,n,p,f=small_oracle(a,b)
        assert (r['distance'],int(r['paths']),set(map(key,r['possible'])),set(map(key,r['forced'])))==(d,n,p,f)
        assert r==reference(a,b)
    return len(pairs)

def projectable(r):
    # Deliberately exclude insertions: several target insertions at one source boundary can reorder.
    return {(e['i'],e['kind'],e['text']) for e in r['forced'] if e['kind']!='insert'}

def run(path,binary):
    rows,_=read(path);_,cases=audit(rows);pairs=[(t,c) for _,t,e,m,*_ in cases for c in (e,m)]
    ntest=check_synthetic(binary);ts={'go_band_seconds':[],'go_full_seconds':[],'python_reference_seconds':[]}
    st=time.perf_counter();g=native(binary,pairs);full_go=time.perf_counter()-st
    st=time.perf_counter();p=[reference(*x) for x in pairs];full_py=time.perf_counter()-st
    st=time.perf_counter();f=native(binary,pairs,True);full_native=time.perf_counter()-st
    assert g==p==f,'DIFFERENTIAL_FAILURE'
    bench=pairs[::9]
    for k in range(3):
        funcs=[('go_band_seconds',lambda:native(binary,bench)),('go_full_seconds',lambda:native(binary,bench,True)),('python_reference_seconds',lambda:[reference(*x) for x in bench])]
        for name,fn in (funcs if k%2==0 else funcs[::-1]):
            st=time.perf_counter();res=fn();ts[name].append(time.perf_counter()-st)
            assert res==g[::9]
    counts=collections.Counter();role=collections.defaultdict(collections.Counter)
    for (src,c),r,k in zip(pairs,g,itertools.cycle(['expert','model'])):
        z=role[k];z['proposals']+=1;z['ambiguous_optimal_paths']+=int(r['paths'])>1;z['no_forced_edits_when_changed']+=src!=c and not r['forced'];z['forced_edit_edges']+=len(r['forced']);z['possible_edit_edges']+=len(r['possible']);z['distance_total']+=r['distance'];z['sequence_matcher_proxy_total']+=sum(max(b-a,len(t)) for a,b,t in edits(src,c))
    for i,(_,t,e,m,*_) in enumerate(cases):
        if e==m:continue
        x,y=g[2*i:2*i+2];both=projectable(x)&projectable(y);new=''.join(next((v for a,k,v in both if a==j),c) for j,c in enumerate(t))
        old=shared(t,e,m);counts['different_pairs']+=1;counts['either_ambiguous']+=int(x['paths'])>1 or int(y['paths'])>1;counts['forced_noninsert_projection_unchanged']+=new==t;counts['forced_projection_equals_old']+=new==old;counts['forced_projection_equals_expert']+=new==e;counts['forced_projection_equals_model']+=new==m
    return {'source_pairs':len(cases),'proposal_pairs':len(pairs),'synthetic_exhaustive_cases':ntest,'differential_all_equal':True,'roles':role,'projection':counts,'full_seconds':{'go_band':full_go,'go_full':full_native,'python':full_py},'benchmark_pairs':len(bench),'timings':ts,'median_seconds':{k:statistics.median(v) for k,v in ts.items()},'limits':'Exact minimum unit-cost codepoint paths, not linguistic edits; forced projection excludes inserts, oracle-assisted retrospective, not quality metric. Python reference is same algorithm not R6b speed baseline. No raw text or row IDs.'}
if __name__=='__main__':print(json.dumps(run(sys.argv[1],sys.argv[2]),ensure_ascii=False,indent=2))
