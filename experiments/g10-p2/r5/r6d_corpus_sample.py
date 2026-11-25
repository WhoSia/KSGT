"""Private development sampling; only counts emitted. Existing loaders in same repo directory."""
import hashlib,json,sys
from collections import defaultdict
from r6a_nikl_census import read,one,target
from r6b_feedback_alignment import audit

def sample(rows):
    groups=defaultdict(list)
    for r in rows:
        o=one(r['output'])
        if o['feedback_type'] in ('내용','조직'):
            groups[target(one(o['instruction'])['input_data'])].append((o['feedback_type'],o['text_type'],one(o['expert_comment'])['comment']))
    out={}
    for level in ('문단','문서'):
        eligible=[(t,v) for t,v in groups.items() if len(v)==2 and {x[0] for x in v}=={'내용','조직'} and all(x[1]==level for x in v) and any(w in t for w in ['학교','도서관','환경','실험','독서','운동','교통','공원','수업','쓰레기']) and not any(w in t or any(w in x[2] for x in v) for w in ['존엄사','안락사','자살','성폭','살인','범죄','혐오'])]
        eligible.sort(key=lambda x:hashlib.sha256(('R6D'+x[0]).encode()).hexdigest());out[level]={'eligible':len(eligible),'selected':len(eligible[:4])}
    _,cases=audit(rows);p={}
    for kind in ('EXACT','WHITESPACE_STRIPPED_EQUAL','DIFFERENT_SURFACE'):
        eligible=[x for x in cases if x[0]==kind and not any(w in ' '.join(x[1:]) for w in ['존엄사','안락사','자살','성폭','살인','범죄','혐오','죽','사망','폭행'])]
        eligible.sort(key=lambda x:hashlib.sha256(('R6D-PROPOSAL'+x[1]).encode()).hexdigest());p[kind]={'eligible':len(eligible),'selected':len(eligible[:4])}
    return {'matched_feedback_sample':out,'proposal_sample':p,'interpretation':'Post hoc topic/keyword-filtered samples for investigator review, not representative or independent. No raw source, IDs, or candidate text.'}
if __name__=='__main__':print(json.dumps(sample(read(sys.argv[1])[0]),ensure_ascii=False,indent=2))
