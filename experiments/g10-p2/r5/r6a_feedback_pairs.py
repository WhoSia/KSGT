"""Development-only feedback pairing and conservative quoted proposal recovery.
No proposal is automatically accepted as an expert gold revision. Never export corpus text.
"""
from collections import defaultdict,Counter
import re, json, sys, statistics, difflib
from r6a_nikl_census import read, one, target

QUOTES=re.compile(r'"([^"\n]+)"|“([^”\n]+)”|‘([^’\n]+)’|\'([^\'\n]+)\'')
SUFFIX=re.compile(r'(?:으)?로 바꾸어 보실 것을 제안해 드립니다\.$')
CONCLUSION=re.compile(r'(?:그러므로|따라서|이에 따라)\s*$')

def propose(source,comment):
    """Only a final explicitly recommended whole-sentence quotation with source witness."""
    m=list(QUOTES.finditer(comment));q=[next(x for x in a.groups() if x) for a in m]
    if len(q)<2 or source not in q[:-1]:return 'NO_FULL_SOURCE_WITNESS',None
    if not SUFFIX.fullmatch(comment[m[-1].end():].strip()):return 'NO_EXPLICIT_FINAL_RECOMMENDATION',None
    if not CONCLUSION.search(comment[:m[-1].start()]):return 'NO_IMMEDIATE_CONCLUSION',None
    result=q[-1]
    if not source.endswith(('.','?','!')) or not result.endswith(('.','?','!')) or result==source:return 'NOT_CHANGED_SENTENCE',None
    if any(c in result for c in '"“”‘’\''):return 'AMBIGUOUS_NESTED_QUOTE',None
    return 'REVIEW_CANDIDATE_ONLY',result

def audit(rows):
    groups=defaultdict(list); statuses=Counter(); stats=Counter(); dist=Counter(); paired=defaultdict(list)
    for d in rows:
        i,o=one(d['input']),one(d['output']);g=(o['feedback_type'],o['text_type']);t=target(one(o['instruction'])['input_data']);ex=one(o['expert_comment'])['comment'];last=one(o['task4' if 'task4' in o else 'task3'])['answer'];a=i['metadata']['author_id'];w=frozenset(p['id'].split('.')[0] for p in i['paragraph']);groups[t].append((g,a,w,ex,last))
        if g!=('표현','문장'):continue
        if sum(isinstance(s['form'],str) and t==s['form'].strip() for p in i['paragraph'] for s in p['sentence'])!=1:
            statuses['NO_UNIQUE_INPUT_FORM']+=1;continue
        st,c=propose(t,ex);statuses[st]+=1
        if c is None:continue
        # Mechanical indicators only, not a semantic or grammatical evaluator.
        n=sum(max(i2-i1,j2-j1) for op,i1,i2,j1,j2 in difflib.SequenceMatcher(None,t,c,autojunk=False).get_opcodes() if op!='equal');dist['1' if n==1 else '2-5' if n<=5 else '6-10' if n<=10 else '11+']+=1
        stats['numeric_sequence_changed']+=re.findall(r'\d+',t)!=re.findall(r'\d+',c)
        stats['whitespace_only']+=''.join(t.split())==''.join(c.split())
        stats['proposal_shorter']+=len(c)<len(t);stats['proposal_longer']+=len(c)>len(t);stats['proposal_same_length']+=len(c)==len(t)
    duplicates=Counter();cross=Counter()
    for t,g in groups.items():
        if len(g)<2:continue
        duplicates['+'.join('/'.join(x) for x in sorted(y[0] for y in g))]+=1
        if len({x[1] for x in g})!=1 or len({x[2] for x in g})!=1:cross['lineage_disagreement']+=1;continue
        if len(g)==2 and {x[0][0] for x in g}=={'내용','조직'} and g[0][0][1]==g[1][0][1]:
            co,org=sorted(g,key=lambda x:x[0][0]); # Korean lexical order: 내용, 조직
            paired[co[0][1]].append((len(co[3]),len(org[3]),len(co[4]),len(org[4]),co[3]==org[3]))
    return {'same_target_group_types':dict(duplicates),'duplicate_group_lineage_disagreement':cross['lineage_disagreement'],'paired_content_organization':{k:{'pairs':len(v),'expert_content_longer':sum(a>b for a,b,*_ in v),'expert_same_text':sum(x[-1] for x in v),'median_lengths_expert_content_org_llm_content_org':[statistics.median(x) for x in zip(*(x[:4] for x in v))]} for k,v in paired.items()},'expression_sentence_proposal_status':dict(statuses),'proposal_character_edit_proxy':dict(dist),'proposal_mechanical_indicators':dict(stats),'semantic_validation':False,'human_gold_claim':False,'new_model_calls':0}

if __name__=='__main__':print(json.dumps(audit(read(sys.argv[1])[0]),ensure_ascii=False,indent=2))
