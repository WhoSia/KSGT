"""Explicit discourse cues for unresolved requests: retrieval, never proof."""
import re
from r6f_targets import units
CLAIM=re.compile(r'(?:따라서|그러므로|결론적으로|이러한 이유로|이를 통해|이로 인해|즉)(?:\s|,)|(?:해야 한다|할 필요가 있다|하는 것이 중요하다|할 수 있다|라고 볼 수 있다)\s*[.!?]?$')
SUPPORT=re.compile(r'(?:예를 들어|실제로|그 이유는|왜냐하면|조사 결과|실험 결과|측정 결과|관찰 결과)(?:\s|,)|(?:때문이다|기 때문이다|에 따르면)\s*[.!?]?$')
# Scope traps: quotations, hypothetical or reported statements are not asserted facts.
SCOPE=re.compile(r'["\'“”‘’「」]|(?:라면|다면|다고 가정|라고 주장|라고 말|다고 한다|않을 수도)')

def claim_candidates(source, request_kinds, target):
    if 'REQUEST_EVIDENCE' not in request_kinds or target['status']!='UNRESOLVED':
        return {'claims':[], 'support':[], 'scope_review':[], 'authority':'CANDIDATE_ONLY'}
    claims=[];support=[];review=[]
    for i,(a,b) in enumerate(units(source)):
        s=source[a:b]
        c=bool(CLAIM.search(s)); e=bool(SUPPORT.search(s))
        if not (c or e):continue
        if SCOPE.search(s) or (c and e):review.append(i);continue
        if c:claims.append(i)
        if e:support.append(i)
    return {'claims':claims,'support':support,'scope_review':review,'authority':'CANDIDATE_ONLY'}
