"""Development-only edit closure on explicit, researcher-labelled dependencies.
No automatic semantic extraction or acceptance; preserve all alternatives.
"""
from collections import defaultdict, deque
import hashlib

def digest(s): return hashlib.sha256(s.encode('utf-8')).hexdigest()

def closure(nodes, seeds, edges):
    """Edges (producer, consumer, facet) fire only for a changed facet.
    Seeds map a node to invalidated facets. A consumer repair may propagate
    only the facet explicitly listed by a human/authoring investigator.
    """
    nodes=set(nodes); reached=set(); queue=deque()
    outgoing=defaultdict(list)
    for a,b,trigger,propagate in edges:
        if a not in nodes or b not in nodes or not trigger or not propagate: raise ValueError('BAD_EDGE')
        outgoing[a,trigger].append((b,propagate))
    for n,facets in seeds.items():
        if n not in nodes or not facets: raise ValueError('BAD_SEED')
        for f in facets: queue.append((n,f))
    while queue:
        key=queue.popleft()
        if key in reached: continue
        reached.add(key);queue.extend(outgoing[key])
    return {n for n,f in reached}

def apply(source, expected_sha, spans, edits, allowed):
    """Verified Unicode offsets; preserve untouched text byte-for-byte."""
    if digest(source)!=expected_sha: raise ValueError('STALE_SOURCE')
    if set(edits)!=set(allowed): raise ValueError('CLOSURE_EDIT_MISMATCH')
    previous=0; parts=[]
    for i,(start,end) in enumerate(spans):
        if not (previous<=start<end<=len(source)): raise ValueError('BAD_SPAN')
        parts.append(source[previous:start]);parts.append(edits.get(i,source[start:end]));previous=end
    if not set(edits)<=set(range(len(spans))): raise ValueError('UNKNOWN_NODE')
    parts.append(source[previous:]);return ''.join(parts)
