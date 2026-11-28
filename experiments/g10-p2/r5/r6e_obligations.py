"""Development-only feedback obligation candidates, not semantic or factual gold."""
import re

RULES = {
    'REQUEST_EVIDENCE': r'(?:근거|자료|증거|사례|예시)(?:를|을|가|이|도|의)?\s*(?:더\s*)?(?:추가|보완|마련|제시|구체화)',
    'CLARIFY_RELATION': r'(?:관계|연관성|논리적 연결|논리적 관계)(?:를|을|이|가)?\s*(?:더\s*)?(?:명확|구체|설명|드러|밝히|강화)',
    'SPLIT': r'(?:문단|단락|문장)(?:을|를)?\s*(?:두\s*개로\s*|둘로\s*)?(?:분리|분할|나누)',
    'MERGE': r'(?:문단|단락|문장)(?:을|를)?\s*(?:하나로\s*)?(?:통합|합치|합하)',
    'REORDER': r'(?:순서|배열|위치)(?:를|을)?\s*(?:조정|변경|바꾸|재배치)',
    'REMOVE': r'(?:문단|단락|문장|내용|표현)(?:을|를)?\s*(?:삭제|제거|생략)',
}
REQUEST = re.compile(r'(?:(?:해야|어야|아야|여야|히\s*해야)\s*(?:합니다|겠습니다|한다)|(?:하|되|이|누|꾸|치|히|르|하였|하겠)[가-힣]*면\s*좋겠습니다|필요(?:합니다|가\s*있습니다)|하는\s*것이\s*좋겠습니다|권합니다)\s*[.!?]?$')
BLOCK = re.compile(r'않아도|않는\s*것|필요\s*없|하지\s*말|하지\s*않|안\s*(?:되|하)|불필요|아니라|(?:인지|는지|은지|한지|을지|할지)\s*(?:확인|검토|고민)|(?:수도|수는)\s*있|(?:다면|라면)|(?:한다고|하라고|하자는|라는)\s*(?:의견|주장|말|것)')
QUOTED = re.compile(r"'[^'\n]*'|\"[^\"\n]*\"|‘[^’\n]*’|“[^”\n]*”|「[^」\n]*」")
COMPILED = {k: re.compile(v) for k,v in RULES.items()}

def candidates(source, feedback):
    # Mask quoted language before splitting and keep the original offsets.
    masked = QUOTED.sub(lambda m: ' ' * len(m.group()), feedback)
    out = []
    for s in re.finditer(r'[^.!?\n]+[.!?]?', masked):
        clause = s.group().strip()
        if not clause: continue
        found = [k for k,p in COMPILED.items() if p.search(clause)]
        if not found: continue
        # shortcut: sentence-level scope only; conjunction, negation, reporting and questions require review.
        status = 'PROPOSED' if len(found)==1 and any(REQUEST.fullmatch(clause[m.end():].strip()) for m in COMPILED[found[0]].finditer(clause)) and not BLOCK.search(clause) and not re.search(r'[,;]|지만|으나|반면|고,|\?$',clause) else 'REVIEW'
        fragment = feedback[s.start():s.end()]
        anchors = []
        for q in QUOTED.finditer(fragment):
            literal = q.group()[1:-1]
            if literal and source.find(literal)>=0 and source.find(literal,source.find(literal)+1)<0:
                start=source.index(literal)
                anchors.append((start,start+len(literal)))
        out.append({'kinds':found,'status':status,'feedback_span':(s.start(),s.end()),'source_spans':anchors,'authority':'CANDIDATE_ONLY','missing_evidence': 'REQUEST_EVIDENCE' in found})
    return out

def baseline(feedback):
    return {k for k,p in COMPILED.items() if p.search(feedback)}

def ordinal_anchor(source, feedback_fragment, level):
    # Structural candidate only: paragraph task, explicit ordinal, simple punctuation.
    if level != '문단' or not source.startswith('#[input data]\n'):
        return None
    offset=len('#[input data]\n'); body=source[offset:]
    if re.search(r'[\n"\'‘’“”「」()\[\]!?]|\d\.\d|\.\.',body) or not body.rstrip().endswith('.'):
        return None
    parts=list(re.finditer(r'[^.]+\.',body))
    if len(parts)<2 or any(not p.group().strip(' .') for p in parts): return None
    matches=re.findall(r'(첫\s*번째|두\s*번째|세\s*번째|마지막)\s*문장',feedback_fragment)
    if len(matches)!=1: return None
    key=re.sub(r'\s+','',matches[0]); i={'첫번째':0,'두번째':1,'세번째':2,'마지막':len(parts)-1}[key]
    if i>=len(parts): return None
    p=parts[i]; start=p.start()+len(p.group())-len(p.group().lstrip())
    return (offset+start,offset+p.end())
