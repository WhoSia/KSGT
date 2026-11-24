"""Replay trace structure and cost arithmetic separately from human semantic judgment."""
import json, sys
from collections import Counter
from r5w_replay import read, require, textsha, indexed

def trace_audit(h,i):
    parents=indexed(h['rows'],'sourceWork');children=indexed(i['rows'],'sourceWork')
    require(set(parents)==set(children),'WORK_SET_MISMATCH')
    counts=Counter(); changes=[]; total_chars=Counter()
    for w,p in parents.items():
        q=children[w]
        for mode,suffix in [('compiledSelected','aggregatedSelected'),('compiledDefault','aggregatedDefault')]:
            t=p[mode]['trace']; frames=indexed(t,'frameID'); seq=q[suffix]['segments']; ids=[]
            for f in t:
                require(textsha(f['outputText'])==f['outputSHA256'],'FRAME_TEXT_HASH')
            for seg in seq:
                fs=seg['sourceFrameIDs'];require(type(fs) is list and 1<=len(fs)<=2,'SEGMENT_ARITY')
                require(all(fid in frames for fid in fs),'UNKNOWN_FRAME')
                require(type(seg['joined']) is bool and seg['joined']==(len(fs)==2),'JOIN_FLAG')
                require(all(frames[f]['actorID']==seg['actorID'] for f in fs),'ACTOR_TRACE_MISMATCH')
                if seg['joined']:require(seg['actorID'] is not None,'BACKGROUND_JOIN')
                counts['joined_segments' if seg['joined'] else 'singleton_segments']+=1
                ids.extend(fs)
            require(ids==[f['frameID'] for f in t],'FRAME_ORDER_OR_COVERAGE')
            require(len(seq)==q[suffix]['aggregatedSentenceCount'],'SEGMENT_COUNT')
            counts['outputs']+=1;counts['frame_references']+=len(ids)
            total_chars['original']+=len(p[mode]['text']);total_chars['aggregated']+=len(q[suffix]['text'])
        # A different selected output only proves mechanical influence, not quality.
        changes.append(p['compiledSelected']['text']!=p['compiledDefault']['text'])
    return {'stage':'DEVELOPMENT_TRACE_REPLAY','counts':dict(counts),'total_characters':dict(total_chars),'selected_default_text_difference_works':sum(changes),'human_semantic_gold':0,'quality_promotion':False}
if __name__=='__main__':
    h,_,_=read(sys.argv[1],'r5h-live/final-score.json');i,_,_=read(sys.argv[2],'r5i-zero-call/compiled-aggregate-score.json');print(json.dumps(trace_audit(h,i),indent=2))
