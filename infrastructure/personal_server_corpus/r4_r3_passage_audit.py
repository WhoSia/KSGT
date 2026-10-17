"""Independent exhaustive >=80-codepoint dependency screen for target documents.

Forty-codepoint anchors every forty positions in candidates, scanned at every
position in other sources, guarantee an anchor in every shared >=80 passage.
Every hash/matcher hit is verified against unchanged source strings before use.
Zero-target structures stay in the engineering census outside the evaluation graph.
"""
import collections,gzip,hashlib,io,itertools,json,pathlib,sqlite3,sys,time,zipfile
from r4_r3_inventory import ROOT,RUN,OUT,ro,write
from r4_r3_custody import sha,groups
from p62_r4_r3_source_witness import strict,classify,extend,contiguous,historical_forms
sys.path.insert(0,str(RUN/'vendor'));import ahocorasick
sys.path.insert(0,str(RUN/'baseline_code'));import pipeline
def main():
    start=time.time();c=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');main=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite')
    docs={s:json.loads(f) for s,f in c.execute('select strict,forms from docs where targets>0')};streams={s:''.join(f) for s,f in docs.items()}
    patterns=collections.defaultdict(list);unit_index=collections.defaultdict(list);shorts=collections.defaultdict(list)
    for s,f in docs.items():
        a=streams[s]
        for i in range(0,len(a)-39,40):patterns[a[i:i+40]].append((s,i))
        for i,u in enumerate(f):unit_index[hashlib.sha256(u.encode()).digest()].append((s,i))
        if len(a)<80:shorts[hashlib.sha256(f[0].encode()).digest()].append(s)
    matcher=ahocorasick.Automaton()
    for text,loc in patterns.items():matcher.add_word(text,loc)
    matcher.make_automaton();db=sqlite3.connect(RUN/'TEXT_DEPENDENCY_LINKS.private.sqlite')
    db.executescript('create table if not exists links(left_id text,right_id text,kind text,exposed integer,evidence text,primary key(left_id,right_id,kind,exposed));create table if not exists sources(path text primary key,sha256 text,documents integer,paragraphs integer);')
    def compare(other,forms,exposed,witness):
        b=''.join(forms);found={}
        for end,loc in matcher.iter(b):
            j=end-39
            for s,i in loc:
                if other==s and not exposed:continue
                if s in found:continue
                p=extend(streams[s],b,i,j,40)
                if p['characters']>=80:found[s]=p
        # Exact ordered-unit subsets shorter than eighty characters still count.
        for u in forms:
            for s in shorts.get(hashlib.sha256(u.encode()).digest(),()):
                if s!=other and contiguous(forms,docs[s]):found.setdefault(s,None)
        if len(b)<80:
            for s,i in unit_index.get(hashlib.sha256(forms[0].encode()).digest(),()):
                if s!=other and docs[s][i:i+len(forms)]==forms:found.setdefault(s,None)
        for s,p in found.items():
            kind=classify(docs[s],forms,p);a,z=(s,other) if exposed else tuple(sorted((s,other)))
            evidence={'original_source':witness,'passage':p,'relation':'SOURCE_TEXT_DEPENDENCE_NOT_SEMANTIC_WORK_GOLD'}
            db.execute('insert or ignore into links values(?,?,?,?,?)',(a,z,kind,int(exposed),json.dumps(evidence)))
    # Compare target-positive candidates with one another before partitioning.
    for s,f in docs.items():compare(s,f,False,{'lane':'CANDIDATE_ORIGINAL_UNITS','strict':s})
    db.commit();sources=[]
    old=ro(ROOT/'70_RUNS/context_falsification_20261011/REPLICATION_SOURCE.sqlite')
    sources.extend(old.execute("select path,sha256 from shards where kind='paragraphs' order by path"))
    r2=json.loads((ROOT/'80_EXPORT/p62_referential_grounding_20261011/R4_R2_20261013/PREDECLARATION.json').read_text())
    sources.extend((row[1],row[2]) for row in r2['shards'])
    # Archive-wide quarantine covers unrecovered earlier 2025 news excerpts.
    sources.extend(main.execute("select s.path,s.sha256 from shards s join members m on m.key=s.member where s.kind='paragraphs' and m.archive='NIKL_NEWSPAPER_2025_v1.1.zip' order by s.member"))
    sources=sorted(dict(sources).items());nd=nu=0
    for k,(path,expected) in enumerate(sources):
        actual=sha(path)
        if actual!=expected:raise ValueError('Previously exposed original shard changed')
        prev=db.execute('select sha256 from sources where path=?',(path,)).fetchone()
        if prev:
            if prev[0]!=actual:raise ValueError('Exposure source changed on continuation')
            continue
        d=u=0
        for other,rows in groups(path):
            forms=[r['form'] for r in rows]
            if strict(forms)!=other:raise ValueError('Exposure original-unit fingerprint differs')
            compare(other,forms,True,{'path':path,'source_member':rows[0]['source_member'],'document_ordinal':rows[0]['source_document_ordinal'],'source_sha256':actual})
            d+=1;u+=len(forms)
        db.execute('insert into sources values(?,?,?,?)',(path,actual,d,u));db.commit();nd+=d;nu+=u
        if k%250==0:print(json.dumps({'phase':'complete_exposure_passage_audit','source_shards':k+1,'documents_this_invocation':nd,'paragraphs_this_invocation':nu,'links':db.execute('select count(*) from links').fetchone()[0],'seconds':time.time()-start}),flush=True)
    # Recovered earlier NIKL zero-anaphora source: prose only, no human labels.
    za=RUN/'PRIOR_EXPOSED_ZA.private.zip'
    with zipfile.ZipFile(za) as z:
        for name in z.namelist():
            if not name.endswith('.json'):continue
            with z.open(name) as raw:
                for file_id,meta,doc in pipeline.json_docs(io.TextIOWrapper(raw,encoding='utf-8-sig')):
                    for field,forms in historical_forms(doc):
                        compare(strict(forms),forms,True,{'historical_source':'NIKL_ZA_2025','archive_sha256':sha(za),'member':name,'document_id':doc['id'],'actual_text_field':field})
    # Full recovered KoSEnd and GOLEM are conservatively prior-exposed; labels ignored.
    external=json.loads((RUN/'PRIOR_EXTERNAL_SOURCE_FILES.private.json').read_text())
    external_counts={}
    def strings(x):
        if isinstance(x,str):yield x
        elif isinstance(x,list):
            for y in x:yield from strings(y)
        elif isinstance(x,dict):
            for y in x.values():yield from strings(y)
    for descriptor in external:
        p=RUN/descriptor['name'];raw=p.read_bytes();git=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
        if git!=descriptor['blob']:raise ValueError('Recovered prior source differs from canonical Git blob')
        n=0
        if p.suffix=='.json':
            o=json.loads(raw)
            for value in (o.values() if isinstance(o,dict) else o):
                forms=list(strings(value))
                if forms:compare(strict(forms),forms,True,{'historical_source':descriptor['name'],'git_blob':git});n+=1
        else:
            forms=[line[9:] for line in raw.decode('utf-8').splitlines() if line.startswith('# text = ')]
            if forms:compare(strict(forms),forms,True,{'historical_source':descriptor['name'],'git_blob':git});n=len(forms)
        external_counts[descriptor['name']]=n
    db.commit();report={'status':'VERIFIED','target_documents_audited':len(docs),'candidate_anchor_patterns':len(patterns),'source_shards':len(sources),'original_documents':db.execute('select sum(documents) from sources').fetchone()[0],'original_paragraphs':db.execute('select sum(paragraphs) from sources').fetchone()[0],'link_counts':[list(x) for x in db.execute('select kind,exposed,count(*) from links group by kind,exposed')],'exposed_linked_candidates':db.execute('select count(distinct left_id) from links where exposed=1').fetchone()[0],'recovered_external_counts':external_counts,'elapsed_seconds':time.time()-start,'shared_passage_min_codepoints':80,'global_semantic_work_independence':'HOLD','human_ground_truth':None,'residuals':['Unobserved cross-ID revisions without exact unchanged text','Non-recovered P53 original generated source briefs and earlier small NIKL25 excerpt ledger; 2025 source environment quarantined archive-wide instead','Whole-candidate population zero-target documents are engineering-only, not fully passage-audited evaluation units']}
    write('INDEPENDENT_TEXT_DEPENDENCY_AUDIT.json',report);print(json.dumps(report),flush=True)
if __name__=='__main__':main()
