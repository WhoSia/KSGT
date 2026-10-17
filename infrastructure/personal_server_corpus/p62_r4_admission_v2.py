"""Bind machine group metadata to original source fragments, never to semantic gold."""
import re
import p62_r4_discourse as base
from p62_r3_stream_inference import stream_coordinates

BAD_LEFT = re.compile(r'[가-힣\d.,+\-~∼–−]')

def admit_graph(forms, target, result):
    """A strict machine/source contract; this is not an antecedent validator."""
    def hold(reason):
        return {'status':reason,'reference_licensed':False,'human_ground_truth':None}
    if result.get('human_ground_truth') is not None or result.get('semantic_accuracy') is not None:
        return hold('HOLD_AUTHORITY_OVERCLAIM')
    offsets,target_start,_=stream_coordinates(forms,target)
    prefix=''.join(forms)[:target_start]
    try:
        if not base.verify_graph(forms,result):return hold('HOLD_SOURCE_GRAPH')
    except (KeyError,TypeError,IndexError,ValueError):return hold('HOLD_SOURCE_GRAPH')
    nodes={node['id']:node for node in result.get('nodes',[])}
    for node in nodes.values():
        w=node['witness'];unit=forms[w['unit']]
        if (w['global_start']!=offsets[w['unit']]+w['start'] or
                w['global_end']!=offsets[w['unit']]+w['end']):return hold('HOLD_SOURCE_COORDINATES')
        if node.get('reference_licensed') is not False:return hold('HOLD_AUTHORITY_OVERCLAIM')
        if w['global_end']>target_start:return hold('HOLD_FORWARD_SOURCE')
        if w['start'] and BAD_LEFT.fullmatch(unit[w['start']-1]):return hold('HOLD_NUMERAL_TOKEN_BOUNDARY')
        match=next((m for m in base.R4_COUNT.finditer(unit) if (m.start(),m.end())==(w['start'],w['end'])),None)
        if match is None:return hold('HOLD_NONORIGINAL_NUMERAL_MATCH')
        raw=match.group('number');cardinality=int(raw) if raw.isdigit() else base.R4_NUMBERS.get(raw)
        if (type(node.get('cardinality')) is not type(cardinality) or
                node.get('cardinality')!=cardinality or node.get('counter')!=match.group('counter')):
            return hold('HOLD_SOURCE_ATTRIBUTE_BINDING')
        if node['id']!=base._id('R4_GROUP',[w['global_start'],w['global_end'],match.group(),w['unit']]):
            return hold('HOLD_NODE_IDENTITY')
        if node.get('assertion') not in ('UNRESOLVED_ASSERTION','SURFACE_EXISTENTIAL_NEGATION','SURFACE_EVENT_NEGATION'):
            return hold('HOLD_ASSERTION_AUTHORITY')
        visible=unit if w['unit']<target['unit'] else unit[:target['start']]
        if node['assertion']!=base._assertion(visible,w['end']):return hold('HOLD_SOURCE_ASSERTION_BINDING')
        actual_scope=base._quote_scope(prefix,w['global_start'])
        declared_scope=node.get('quote_scope')
        if declared_scope is not None:declared_scope=tuple(declared_scope)
        if actual_scope!=declared_scope:return hold('HOLD_SOURCE_SCOPE_BINDING')
        hypothetical=bool(base.HYPOTHETICAL.search(base._clause_before(prefix,w['global_start'])))
        if node.get('hypothetical') is not hypothetical:return hold('HOLD_SOURCE_SCOPE_BINDING')
    for union in result.get('unions',[]):
        left,right=[nodes[i]['witness'] for i in union['component_ids']]
        coordinator=union['coordinator_witness']
        if not (left['unit']==right['unit']==coordinator['unit'] and left['end']<=coordinator['start']<coordinator['end']<=right['start']):
            return hold('HOLD_COORDINATOR_TOPOLOGY')
        bridge=forms[left['unit']][left['end']:right['start']]
        match=base.COORDINATOR.fullmatch(bridge)
        if match is None:return hold('HOLD_COORDINATOR_SURFACE')
        if (coordinator['start'],coordinator['end'])!=(left['end']+match.start('marker'),left['end']+match.end('marker')):
            return hold('HOLD_COORDINATOR_MARKER_BINDING')
    selected=result.get('selected')
    if selected is not None and (selected.get('id') not in nodes or selected!=nodes[selected['id']]):
        return hold('HOLD_SELECTED_IDENTITY')
    return {'status':'VERIFIED_TYPED_SOURCE_GRAPH_ONLY','reference_licensed':False,'human_ground_truth':None}
