"""Explicit wording markers in paired expert feedback; not semantic labels or quality."""
import re,sys,json
from collections import defaultdict,Counter
from r6a_nikl_census import read,one,target
PATTERNS={
 'ADD_EVIDENCE_OR_DETAIL':r'(?:근거|설명|예시|배경 정보|데이터|내용)[^.!?\n]{0,40}(?:추가해야|추가하면|추가할 필요|보충해야|보완해야|제시할 필요|마련하면|마련해야)',
 'DELETE':r'삭제(?:해야|하면|하는|하고|할 필요|하거나)',
 'SPLIT':r'(?:문단[^.!?\n]{0,28}(?:나누어|나누고|나눌|구분해야)|문단을 정확히 나누어)',
 'MERGE':r'(?:통합|합쳐|합치는)(?:하|할|를|는|어|야|면|고|되|지|는 것)',
 'ORDER':r'(?:순서[^.!?\n]{0,22}(?:검토해야|바꾸|조정|재구성)|(?:서론|본론|결론)의 내용으로 더 적절)',
 'COUNTERARGUMENT':r'(?:반대 의견|반대 측 의견|상대 입장|다른 입장|반박)[^.!?\n]{0,50}(?:부족|추가|보완|고려하면|설명해야|논의해야|설명하거나)',
}
def markers(comment):return {k for k,p in PATTERNS.items() if re.search(p,comment)}
def audit_pairs(rows):
    groups=defaultdict(list)
    for r in rows:
        o=one(r['output']);g=o['feedback_type'],o['text_type']
        if g[0] in ('내용','조직'):groups[target(one(o['instruction'])['input_data'])].append((g,one(o['expert_comment'])['comment']))
    result=defaultdict(lambda:{'pairs':0,'content':Counter(),'organization':Counter(),'both':Counter(),'neither_marked':0})
    for v in groups.values():
        if len(v)!=2 or {x[0][0] for x in v}!={'내용','조직'} or v[0][0][1]!=v[1][0][1]:continue
        d=dict((g[0],s) for g,s in v);a,b=markers(d['내용']),markers(d['조직']);c=result[v[0][0][1]];c['pairs']+=1;c['content'].update(a);c['organization'].update(b);c['both'].update(a&b);c['neither_marked']+=not(a or b)
    return {'matched':dict(result),'patterns':PATTERNS,'meaning':'Exact lexical pattern presence only. Absence does not mean KEEP or no advice; co-occurrence does not prove action identity. Rules authored after viewing development examples.'}
if __name__=='__main__':print(json.dumps(audit_pairs(read(sys.argv[1])[0]),ensure_ascii=False,indent=2))
