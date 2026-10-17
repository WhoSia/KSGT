"""Close historical-source and cross-ID custody before the prospective selector."""
import collections,hashlib,json,sqlite3,zipfile,time
from r4_r3_inventory import ROOT,RUN,OUT,ro,write
from r4_r3_custody import sha
from p62_r4_r3_source_witness import extend,classify,strict
def main():
    start=time.time();progress=json.loads((OUT/'INDEPENDENT_TEXT_DEPENDENCY_AUDIT.json').read_text())
    if progress['status']!='VERIFIED':raise ValueError('Full passage audit unfinished')
    coverage=json.loads((OUT/'PRIOR_GRAPH_COVERAGE.json').read_text())
    if any(coverage['original_structure_keys_outside_audited_replication_graph'].values()):raise ValueError('Historical structure exposure incomplete')
    c=ro(RUN/'UPSTREAM_CUSTODY.private.sqlite');main=ro(ROOT/'70_RUNS/corpus_sprint_20261011_main/corpus.sqlite');db=sqlite3.connect(RUN/'TEXT_DEPENDENCY_LINKS.private.sqlite')
    docs={s:json.loads(f) for s,f in c.execute('select strict,forms from docs where targets>0')};unknown=set();crossids=collections.Counter()
    for s,flat in c.execute('select strict,flat from docs where targets>0'):
        witnessed={(m,o) for m,o in c.execute('select member,ordinal from aliases where candidate=?',(s,))}
        for m,o,st,did in main.execute('select member,ordinal,strict,doc_id from occurrences where flat=?',(flat,)):
            crossids['matching_occurrences']+=1
            if (m,o) not in witnessed:unknown.add(s);crossids['unwitnessed_cross_id_occurrences']+=1
    p53=[]
    for name in ['KRC_v0.3_Frozen_Qwen3_4B_Six_Korean_Passages.zip','G9P53_Qwen3_8B_B_Original.zip','G9P53_Qwen3_14B_B_Original.zip']:
        p=RUN/name;h=sha(p);texts=[]
        with zipfile.ZipFile(p) as z:
            for n in z.namelist():
                if n.endswith('/'):continue
                text=z.read(n).decode('utf-8-sig');texts.append((n,text))
                if n.endswith('.json'):
                    def strings(x):
                        if isinstance(x,str):yield x
                        elif isinstance(x,list):
                            for y in x:yield from strings(y)
                        elif isinstance(x,dict):
                            for y in x.values():yield from strings(y)
                    texts.extend((n+':decoded-string',s) for s in strings(json.loads(text)))
        matches=0
        for n,text in texts:
            if len(text)<80:continue
            other=strict([text])
            for s,f in docs.items():
                a=''.join(f)
                for i in range(0,len(a)-39,40):
                    j=text.find(a[i:i+40])
                    while j>=0:
                        witness=extend(a,text,i,j,40)
                        if witness['characters']>=80:
                            kind=classify(f,[text],witness);e=json.dumps({'archive':name,'archive_sha256':h,'member':n,'passage':witness,'authority':'EXACT_ORIGINAL_TEXT_ONLY'})
                            db.execute('insert or ignore into links values(?,?,?,?,?)',(s,other,kind,1,e));matches+=1;break
                        j=text.find(a[i:i+40],j+1)
                    if j>=0 and witness['characters']>=80:break
        p53.append({'name':name,'sha256':h,'text_views':len(texts),'matching_candidate_views':matches})
    db.commit();db.close()
    report={'status':'VERIFIED','cross_id_exact_flat_diagnostic':dict(crossids),'unwitnessed_cross_id_candidate_quarantines':sorted(unknown),'p53_original_archives':p53,'historical_graph_coverage':coverage,'exposure_scope':'P60 development/P61/P62/R2/R3 exact original JSON footprint, all R4-R2 source shards, entire 2025 news environment conservatively tainted, recovered NIKL-ZA, complete KoSEnd/GOLEM and P53 original outputs/metadata. CP5 has no prose. Unobserved cross-ID rewritten works remain HOLD.','semantic_source_work_independence':'HOLD','elapsed_seconds':time.time()-start,'human_ground_truth':None}
    write('SOURCE_CUSTODY_CLOSURE.private.json',report);print(json.dumps({k:v for k,v in report.items() if k not in ['unwitnessed_cross_id_candidate_quarantines','historical_graph_coverage']}),flush=True)
if __name__=='__main__':main()
