"""Source target retrieval, not semantic identity or edit authorization."""
import re, math, unicodedata
from collections import Counter
from r6e_obligations import QUOTED, ordinal_anchor

HEADER='#[input data]\n'
# shortcut: conservative punctuation segmentation, not a Korean sentence parser.
def units(source):
    offset=len(HEADER) if source.startswith(HEADER) else 0
    body=source[offset:]
    masked=QUOTED.sub(lambda m:' '*len(m.group()),body)
    # Preserve decimal points; retain paragraph boundaries and original coordinates.
    boundaries=[m.end() for m in re.finditer(r'[.!?](?=\s|$)|\n+',masked)]
    result=[]; start=0
    for end in sorted(set(boundaries+[len(body)])):
        raw=body[start:end]; l=len(raw)-len(raw.lstrip()); r=len(raw.rstrip())
        if l<r: result.append((offset+start+l,offset+start+r))
        start=end
    return result

def normalize(s):
    return ''.join(c for c in unicodedata.normalize('NFKC',s).lower() if c.isalnum())

def grams(s):
    s=normalize(s)
    return set(s[i:i+n] for n in (2,3) for i in range(len(s)-n+1))

# Remove generic feedback vocabulary; no assumption that the residue denotes a claim.
META=re.compile(r'근거|자료|증거|사례|예시|논리적|연관성|관계|연결|문단|단락|문장|내용|표현|추가|보완|마련|제시|구체화|명확|설명|드러내|밝히|강화|분리|분할|나누|통합|합치|합하|순서|배열|위치|조정|변경|바꾸|재배치|삭제|제거|생략|해야\s*합니다|하면\s*좋겠습니다|필요합니다|더\s*|것이|좋겠습니다|합니다|됩니다')

def query_grams(feedback):
    # Keep word boundaries and remove isolated grammatical residue.
    tokens=re.findall(r'[가-힣A-Za-z0-9]+',META.sub(' ',feedback))
    tokens=[re.sub(r'(?:에\s*관한|에|의|을|를|은|는|이|가)$','',t) for t in tokens if t not in ('관한','대한','대해','위한','관련','을','를','의','에','이','가','은','는')]
    return set().union(*(grams(t) for t in tokens))

def rank(source, feedback, level):
    spans=units(source); texts=[source[a:b] for a,b in spans]
    normalized=[normalize(t) for t in texts]
    quotes=[normalize(q.group()[1:-1]) for q in QUOTED.finditer(feedback)]
    quotes=[q for q in quotes if len(q)>=2]
    hits=[[i for i,t in enumerate(normalized) if q in t] for q in quotes]
    ordinal=ordinal_anchor(source,feedback,level)
    ord_ids=[i for i,(a,b) in enumerate(spans) if ordinal and a<=ordinal[0] and ordinal[1]<=b]
    result={'status':'UNRESOLVED','candidates':[], 'pair_candidates':[], 'authority':'CANDIDATE_ONLY', 'spans':spans}
    if quotes and all(hits):
        if len(hits)==2 and re.search(r'관계|연결|연관',feedback):
            result['pair_candidates']=[(a,b) for a in hits[0] for b in hits[1] if a!=b]
        union=sorted(set().union(*map(set,hits)))
        result['candidates']=union
        if ord_ids and set(ord_ids)!=set(union): result['status']='CONFLICT'
        elif any(len(h)!=1 for h in hits): result['status']='COMPETING_ANCHORS'
        elif len(union)>1: result['status']='MULTI_TARGET'
        else: result['status']='SURFACE_ANCHOR'
        return result
    if ord_ids and not quotes:
        result.update(status='ORDINAL_ANCHOR',candidates=ord_ids);return result
    # Unmatched quotes must not disappear into a misleading lexical ranking.
    if quotes and any(hits):
        result.update(status='PARTIAL_QUOTE_REVIEW',candidates=sorted(set().union(*map(set,hits))))
        return result
    q=grams(' '.join(quotes)) if quotes else query_grams(feedback)
    if not q: return result
    docs=[grams(t) for t in texts]; df=Counter(g for d in docs for g in d)
    weights={g:math.log((len(docs)+1)/(df[g]+1))+1 for g in q}
    total=sum(weights.values())
    scored=[(sum(weights[g] for g in q & d)/total,i) for i,d in enumerate(docs)]
    scored=sorted(((s,i) for s,i in scored if s>=.18),key=lambda p:(-p[0],p[1]))
    if scored:
        best=scored[0][0]
        result['candidates']=[i for s,i in scored if s>=best*.65][:5]
        result['status']='LEXICAL_REVIEW'
    return result

def lexical_top1(source,feedback):
    q=grams(feedback); spans=units(source)
    if not spans or not q:return []
    scores=[len(q&grams(source[a:b])) for a,b in spans]
    return [scores.index(max(scores))] if max(scores)>0 else []
