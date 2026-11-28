"""Retrospective two-proposal shared-edit projection; expert answer is NOT a deployable input."""
import json,sys
from collections import Counter
from r6a_nikl_census import read
from r6b_feedback_alignment import audit,edits

def apply(source,ops):
    end=0; parts=[]
    for a,b,text in sorted(ops):
        if not end<=a<=b<=len(source):raise ValueError('INVALID_EDIT_SPAN')
        parts.extend((source[end:a],text));end=b
    return ''.join(parts)+source[end:]

def shared(source,expert,model):
    e,m=edits(source,expert),edits(source,model)
    return apply(source,set(e)&set(m))

def summarize(cases):
    counts=Counter()
    for kind,t,e,m,*_ in cases:
        if apply(t,edits(t,e))!=e or apply(t,edits(t,m))!=m:raise ValueError('REPLAY_MISMATCH')
        c=shared(t,e,m);counts['pairs']+=1
        if e==m:counts['equal_proposals']+=1;continue
        counts['different_proposals']+=1
        # Mutually exclusive outcomes; unchanged takes precedence over a KEEP proposal.
        outcome = 'unchanged_projection' if c==t else 'exact_expert_projection' if c==e else 'exact_model_projection' if c==m else 'distinct_changed_projection'
        counts[outcome]+=1
    return {'counts':dict(counts),'interpretation':'Developer retrospective surface comparison; two given proposals, not a model-only correction method. Alignment ambiguity, missing shared errors, and semantic differences remain. No human gold.'}

if __name__=='__main__': print(json.dumps(summarize(audit(read(sys.argv[1])[0])[1]),ensure_ascii=False,indent=2))
