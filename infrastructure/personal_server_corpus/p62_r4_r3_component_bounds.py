"""Development-only source-symbol composition; elementary conditional bounds.

Repeated witnessed symbols are deduplicated; different mentions are never
equated to real-world entities. Caller scope/cardinality is not source custody.
This module does not select references or certify Korean coordination.
"""
def compose(nodes,branches):
    by_id={};scopes=set()
    for n in nodes:
        if type(n.get('id')) is not str or not n['id'] or type(n.get('scope')) is not str or not n['scope']:raise ValueError('Explicit scoped source symbol required')
        if n['id'] in by_id and by_id[n['id']]!=n:raise ValueError('Conflicting repeated source symbol')
        by_id[n['id']]=n;scopes.add(n['scope'])
    if not by_id or len(scopes)!=1:return {'status':'HOLD_EMPTY_OR_MIXED_SOURCE_SCOPE','lower':None,'upper':None,'reference_licensed':False}
    ids=set()
    for branch in branches:
        if not isinstance(branch,list) or not branch:raise ValueError('Nonempty explicit branch components required')
        for token in branch:
            if token not in by_id:raise ValueError('Unknown component witness symbol')
            ids.add(token)
    counts=[by_id[x].get('cardinality') for x in sorted(ids)]
    if not counts or any(type(x) is not int or x<0 for x in counts):return {'status':'HOLD_UNKNOWN_CARDINALITY','lower':None,'upper':None,'reference_licensed':False}
    return {'status':'CONDITIONAL_UNIQUE_SYMBOL_UNION_BOUND','component_ids':sorted(ids),'lower':max(counts),'upper':sum(counts),'exact':None,'reference_licensed':False,'source_custody':'NOT_CERTIFIED_BY_THIS_FUNCTION','semantic_denotation':None,'human_ground_truth':None,'assumptions':['Original admitted symbols denote finite sets with faithful cardinalities','All branches intend ordinary set union','Repeated identical scoped symbol is reused; other entity overlap remains unknown']}
