"""Compare explicit proposed surfaces without treating the expert answer as gold.
Aggregate only; source data stays in the authorized runtime.
"""
import re, sys, json, difflib
from collections import Counter, defaultdict
from r6a_nikl_census import read, one, target
from r6a_feedback_pairs import propose

ENDING = re.compile(r'(?:으)?로 바꾸어 보실 것을 제안해 드립니다\.$')
QUOTE = re.compile(r'"([^"\n]+)"|“([^”\n]+)”|‘([^’\n]+)’|\'([^\'\n]+)\'|<([^<>\n]+)>')
CUE = re.compile(r'(?:그러므로|따라서|이에 따라)\s*$')

def terminal_candidate(source, comment, threshold=.7):
    # Format-sensitive extraction, not a semantic decision. Reject competing recommendations.
    comment = comment.strip()
    if comment.count('바꾸어 보실 것을 제안해 드립니다.') != 1:
        return 'NO_SINGLE_RECOMMENDATION', None
    quotes = list(QUOTE.finditer(comment))
    if not quotes or not ENDING.fullmatch(comment[quotes[-1].end():].strip()):
        return 'NO_TERMINAL_QUOTE', None
    m = quotes[-1]; c = next(x for x in m.groups() if x)
    # Either direct conclusion or an explicit quoted old->new replacement.
    before = comment[:m.start()].rstrip()
    if not CUE.search(before):
        prev = quotes[-2] if len(quotes)>1 else None
        if not prev or not re.fullmatch(r'\s*(?:을|를)\s*', comment[prev.end():m.start()]):
            return 'NO_CONCLUSION_LINK', None
        old = next(x for x in prev.groups() if x)
        if old != source: return 'NOT_WHOLE_SOURCE_REPLACEMENT', None
    if any(x in c for x in '"“”‘’\'<>'):
        return 'NESTED_QUOTE', None
    if not c.endswith(('.', '?', '!')):
        return 'MISSING_SENTENCE_END', None
    if difflib.SequenceMatcher(None,source,c,autojunk=False).ratio()<threshold:
        return 'LOW_SOURCE_SIMILARITY', None
    return 'EXPLICIT_UNCHANGED' if c==source else 'REVIEW_CANDIDATE_ONLY', c

def linked(i,t):
    return sum(isinstance(s['form'],str) and t==s['form'].strip() for p in i['paragraph'] for s in p['sentence'])==1

def edits(s,c):
    return [(a,b,c[x:y]) for op,a,b,x,y in difflib.SequenceMatcher(None,s,c,autojunk=False).get_opcodes() if op!='equal']

def touched(ops):
    # Boundary markers for insertions; character positions for deletions/replacements.
    return {(('B',a) if a==b else ('C',j)) for a,b,_ in ops for j in (range(a,b) if a!=b else [a])}

def audit(rows, threshold=.7):
    count=Counter(); es=Counter(); ms=Counter(); cross=Counter(); bynorm=defaultdict(Counter)
    private=[]
    for r in rows:
        i,o=one(r['input']),one(r['output'])
        if (o['feedback_type'],o['text_type'])!=('표현','문장'):continue
        count['sentence_rows']+=1
        t=target(one(o['instruction'])['input_data']); ex=one(o['expert_comment'])['comment']; model=one(o['task3'])['answer']
        if not linked(i,t):count['unlinked']+=1;continue
        count['linked']+=1
        _,old_e=propose(t,ex);_,old_m=propose(t,model)
        count['strict_expert']+=old_e is not None;count['strict_model']+=old_m is not None;count['strict_joint']+=old_e is not None and old_m is not None
        a,e=terminal_candidate(t,ex,threshold);b,m=terminal_candidate(t,model,threshold);es[a]+=1;ms[b]+=1
        count['expert_recovered']+=e is not None;count['model_recovered']+=m is not None
        count['expert_strict_lost']+=old_e is not None and e!=old_e
        count['model_strict_lost']+=old_m is not None and m!=old_m
        if e is None or m is None:continue
        count['joint']+=1
        eq=e==m;ws=''.join(e.split())==''.join(m.split()); ep,mp=edits(t,e),edits(t,m);et,mt=touched(ep),touched(mp)
        kind='EXACT' if eq else 'WHITESPACE_STRIPPED_EQUAL' if ws else 'DIFFERENT_SURFACE'
        cross[kind]+=1
        if not eq:
            cross['EXPERT_UNCHANGED']+=not ep;cross['MODEL_UNCHANGED']+=not mp
            if et and mt:cross['DISJOINT_TOUCHED_POSITIONS' if not et&mt else 'OVERLAPPING_TOUCHED_POSITIONS']+=1
        cats={str(n['category']) for n in one(o['reference_norm'])['norm_list']}
        for cat in cats:bynorm[cat]['joint']+=1;bynorm[cat]['exact']+=eq
        private.append((kind,t,e,m,ex,model))
    return {'counts':dict(count),'expert_status':dict(es),'model_status':dict(ms),'surface_comparison':dict(cross),'norm_category_joint_overlapping_membership':{k:dict(v) for k,v in sorted(bynorm.items())},'threshold':threshold,'semantic_validation':False,'new_provider_calls':0},private

if __name__=='__main__':
    rows,_=read(sys.argv[1]);print(json.dumps({str(t):audit(rows,t)[0] for t in (.6,.7,.8,.9)},ensure_ascii=False,indent=2))
