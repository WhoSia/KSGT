"""Conservative candidate proposal, not automatic text deletion or quality evidence."""
def propose(prefix, continuation):
    if not isinstance(prefix,str) or not isinstance(continuation,str) or not prefix.strip():
        raise ValueError('INVALID_TEXT')
    if not continuation.startswith(prefix):
        return {'status':'KEEP','text':prefix+'\n'+continuation,'removed_chars':0}
    rest=continuation[len(prefix):]
    # Exact whole-prefix repetition followed by a whitespace boundary only.
    if not rest.strip() or not rest[0].isspace():
        return {'status':'REVIEW_NO_CANDIDATE','text':prefix+'\n'+continuation,'removed_chars':0}
    candidate=prefix+'\n'+rest.lstrip()
    return {'status':'REVIEW_CANDIDATE_ONLY','text':candidate,'removed_chars':len(prefix+'\n'+continuation)-len(candidate)}
