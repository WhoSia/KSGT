"""Recount restricted corpus metadata locally; emit aggregate metrics only."""
import difflib,statistics,json,sys,zipfile,hashlib,re
from pathlib import Path
from r5y_prefix_guard import propose
from r5y_archive_audit import read,check

def run(root):
    a,_,_,_=read(next(Path(root).glob('*R5A_*zip')),'A'); f,_,data,_=read(next(Path(root).glob('*R5F_16*zip')),'F');raw=data['SmileStyle_original_CC-BY-NC-4.0.tsv'];rows=[l.split('\t') for l in raw.decode().splitlines()[1:]];check(all(len(r)==17 for r in rows),'TSV_COLUMNS');pairs=[(r[0],r[1]) for r in rows if any(x.strip() for x in r)];check(all(x and y for x,y in pairs),'MISSING_PAIR');dist=[];sim=[]
    for x,y in pairs:
        dist.append(sum(max(i2-i1,j2-j1) for op,i1,i2,j1,j2 in difflib.SequenceMatcher(None,x.split(),y.split(),autojunk=False).get_opcodes() if op!='equal'))
        sim.append(difflib.SequenceMatcher(None,x,y,autojunk=False).ratio())
    p=next(Path(root).glob('*R5F_3470*zip'))
    with zipfile.ZipFile(p) as z:
        check(z.testzip() is None,'CENSUS_CRC');stored=json.loads(z.read(z.namelist()[0]))
    actual={'pairedUtterances':len(pairs),'identicalPairs':sum(x==y for x,y in pairs),'atMostOneWhitespaceEditToken':sum(d<=1 for d in dist),'atMostTwoWhitespaceEditTokens':sum(d<=2 for d in dist),'atLeastFourWhitespaceEditTokens':sum(d>=4 for d in dist),'meanCharacterSimilarity':round(statistics.mean(sim),5),'medianCharacterSimilarity':round(statistics.median(sim),5),'numericTokenSequenceMismatches':sum(re.findall(r'\d+',x)!=re.findall(r'\d+',y) for x,y in pairs)}
    candidates=[]
    for r in a['rows']:
        for arm,c in r['completions'].items():
            q=propose(r['sharedPrefix']['text'],c['continuation']);candidates.append({'work':r['id'],'arm':arm,'status':q['status'],'removed_chars':q['removed_chars']})
    return {'census_archive_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'actual':actual,'stored_matches':{k:actual[k]==stored[k] for k in actual},'prefix_candidate_counts':{s:sum(x['status']==s for x in candidates) for s in sorted({x['status'] for x in candidates})},'prefix_candidate_removed_chars':sum(x['removed_chars'] for x in candidates),'prefix_changed_candidates':[x for x in candidates if x['status']!='KEEP'],'quality_promotion':False,'new_provider_calls':0,'human_ratings':0,'attribution':'Smilegate AI / Seonghyun Kim (2022), SmileStyle; CC BY-NC 4.0; https://github.com/smilegate-ai/korean_smile_style_dataset'}
if __name__=='__main__':print(json.dumps(run(sys.argv[1]),ensure_ascii=False,indent=2))
