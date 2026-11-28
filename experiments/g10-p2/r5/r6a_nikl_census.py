"""NIKL v1.1 descriptive audit. Output aggregate counts only; never export text or IDs."""
import collections as C
import hashlib, json, re, statistics, sys, zipfile
from pathlib import Path
from r5q_nikl24_intake import inspect_archive

PIN='92ca0e42198ff10d45b72771b39ce364343634691bc348cfcc0b47de60df3c54'
EXPECTED={('내용','문단'):100,('내용','문서'):100,('조직','문단'):100,('조직','문서'):100,('표현','문단'):150,('표현','문장'):950}

def require(ok,reason):
    if not ok: raise ValueError(reason)

def one(x):
    require(isinstance(x,list) and len(x)==1 and isinstance(x[0],dict),'SINGLE_OBJECT_REQUIRED')
    return x[0]

def target(s):
    require(isinstance(s,str) and bool(s.strip()),'MISSING_TARGET')
    return s.removeprefix('#[input data]\n').strip()

def read(path):
    receipt=inspect_archive(path)
    require(receipt['archive_sha256']==PIN,'WRONG_RELEASE_BYTES')
    with zipfile.ZipFile(path) as z:
        b=z.read('GWIG2402606300.json')
        receipt['member_sha256']={i.filename:hashlib.sha256(z.read(i)).hexdigest() for i in z.infolist()}
    j=json.loads(b)
    require(j['id']=='GWIG2402606300','CORPUS_ID')
    return j['document'],receipt

def census(rows):
    require(len({d['id'] for d in rows})==len(rows),'DUPLICATE_RECORD_ID')
    counts=C.Counter(); groups=C.defaultdict(C.Counter); variants=C.defaultdict(set); targets=C.defaultdict(list); lengths=C.defaultdict(list); normcats=C.Counter(); type_counts=C.Counter(); a2w=C.defaultdict(set);w2a=C.defaultdict(set)
    for d in rows:
        i,o=one(d['input']),one(d['output']); g=(o['feedback_type'],o['text_type']);type_counts[g]+=1;c=groups['/'.join(g)];c['rows']+=1
        require(o['llm_type']=='gpt-4o','UNEXPECTED_MODEL')
        ps=i['paragraph'];ss=[s for p in ps for s in p['sentence']]
        ws={p['id'].split('.')[0] for p in ps};a=i['metadata']['author_id'];require(a and ws,'MISSING_LINEAGE')
        counts['rows_multiple_work_prefixes']+=len(ws)>1
        for w in ws:a2w[a].add(w);w2a[w].add(a)
        for k,nodes in [('paragraph',ps),('sentence',ss)]:
            for n in nodes:
                x,y=n['form'],n['original_form'];require(n['edited'] in ('O','X'),'EDIT_FLAG')
                require(isinstance(y,str) and (x is None or isinstance(x,str)),'FORM_TYPE')
                variants[k,n['id']].add((x,y));counts[k+'_occurrences']+=1;counts[k+'_flag_O']+=n['edited']=='O'
                counts[k+'_null_form']+=x is None;counts[k+'_changed_nonnull']+=x is not None and x!=y
                counts[k+'_flag_mismatch_including_null']+=(n['edited']=='O')!=(x!=y)
                counts[k+'_whitespace_only']+=x is not None and x!=y and ''.join(x.split())==''.join(y.split())
        inst=one(o['instruction']);s=inst['input_data'];t=target(s);counts['missing_standard_header']+=not s.startswith('#[input data]\n');targets[t].append(g)
        if g[1]=='문서':
            forms=[p['form'] for p in ps if p['form'] is not None]
            c['all_nonnull_paragraph_forms_substring']+=bool(forms) and all(f.strip() in t for f in forms)
            c['exact_join']+=t in [sep.join(forms).strip() for sep in ('\n','\n\n',' ')]
        else:
            nodes=ss if g[1]=='문장' else ps
            exact=sum(isinstance(n['form'],str) and t==n['form'].strip() for n in nodes)
            c['exact_target_form']+=exact>0;c['ambiguous_exact']+=exact>1
        expected_tasks=4 if g==('표현','문단') else 3
        require(('task4' in o)==(expected_tasks==4),'TASK4_SCOPE')
        for k in range(1,expected_tasks+1):
            task=one(o[f'task{k}']);require(isinstance(task['answer'],str),'ANSWER_TYPE')
            c[f'task{k}_question_exact']+=task['question']==inst[f'task{k}_question'];counts['llm_answers']+=1
        ex=one(o['expert_comment'])['comment'];last=one(o[f'task{expected_tasks}'])['answer'];require(isinstance(ex,str) and bool(ex.strip()),'EMPTY_EXPERT_COMMENT')
        c['expert_exact_last']=c['expert_exact_last']+(ex==last);c['expert_contains_target']+=t in ex;lengths['/'.join(g)].append((len(t),len(ex),len(last)))
        for n in one(o['reference_norm'])['norm_list']:
            normcats[str(n['class'])+'/'+str(n['category'])]+=1
    require(type_counts==EXPECTED,'STRATUM_COUNTS')
    return {'records':len(rows),'counts':dict(counts),'groups':{k:dict(v) for k,v in sorted(groups.items())},'unique_recorded_source_ids':dict(C.Counter(k for k,_ in variants)), 'conflicting_form_pairs_for_same_id':dict(C.Counter(k for (k,_),v in variants.items() if len(v)>1)), 'author_ids':len(a2w),'work_prefixes':len(w2a),'authors_multiple_work_prefixes':sum(len(v)>1 for v in a2w.values()),'work_prefixes_multiple_authors':sum(len(v)>1 for v in w2a.values()),'exact_distinct_targets':len(targets),'repeated_target_groups':sum(len(v)>1 for v in targets.values()),'cross_stratum_target_groups':sum(len(set(v))>1 for v in targets.values()),'median_lengths_target_expert_last_llm':{k:[statistics.median(x) for x in zip(*v)] for k,v in lengths.items()},'norm_category_occurrences':dict(normcats),'authority':'expert_comment is revised feedback; form is reference input, not a standalone expert rewrite; no new human ratings'}

if __name__=='__main__':
    rows,meta=read(sys.argv[1]);print(json.dumps({'archive':meta,'census':census(rows)},ensure_ascii=False,indent=2))
