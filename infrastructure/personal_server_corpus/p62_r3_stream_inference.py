"""Source-stream evidence graph with selective machine proposals, never gold.

Character-window selection is invariant to unit resegmentation for identical
concatenated code points and target global offset. No suffix is consumed.
"""
import re,bisect,hashlib,json
import p62_reference as ref
WINDOW=1024
AMBIGUITY_GAP=48
COUNT=re.compile(ref.COUNT.pattern.replace('(?![가-힣])',r'(?=(?:에게서|으로|에서|에게|은|는|이|가|을|를|의|에|와|과|도|만)?(?:[^가-힣]|$))'))
def stream_coordinates(forms,target):
 offsets=[0]
 for form in forms:offsets.append(offsets[-1]+len(form))
 start=offsets[target['unit']]+target['start'];end=offsets[target['unit']]+target['end']
 if ref.TARGET.fullmatch(''.join(forms)[start:end]) is None:raise ValueError('Invalid observed target')
 return offsets,start,end
def provenance(offsets,start,end):
 spans=[]
 for unit in range(max(0,bisect.bisect_right(offsets,start)-1),len(offsets)-1):
  lo=max(start,offsets[unit]);hi=min(end,offsets[unit+1])
  if lo<hi:spans.append({'unit':unit,'start':lo-offsets[unit],'end':hi-offsets[unit]})
  if offsets[unit+1]>=end:break
 return spans
def infer(forms,target,window=WINDOW,ambiguity_gap=AMBIGUITY_GAP,filters=True):
 offsets,start,end=stream_coordinates(forms,target)
 stream=''.join(forms);lo=max(0,start-window);prefix=stream[lo:start]
 nodes=[];excluded=[]
 for m in COUNT.finditer(prefix):
  raw=m.group('number');number=int(raw) if raw.isdigit() else ref.NUMBERS.get(raw)
  a=lo+m.start();b=lo+m.end();previous=prefix[:m.start()]
  boundary=max(previous.rfind('.'),previous.rfind('!'),previous.rfind('?'),previous.rfind('\n'))+1
  clause=previous[boundary:];reasons=[]
  if number is None:reasons.append('UNKNOWN_CARDINALITY')
  elif number<2:reasons.append('NOT_EXPLICIT_PLURAL')
  if filters and (previous.count('"')%2 or previous.count('“')>previous.count('”')):reasons.append('QUOTED_CUE_RULE')
  if filters and re.search('만약|가정|예를 들어',clause):reasons.append('HYPOTHETICAL_CUE_RULE')
  # Evidence is prefix-only. This conservative surface filter is not semantic negation parsing.
  after=prefix[m.end():];close=re.split(r'[.!?\n]',after,maxsplit=1)[0]
  if filters and re.search(r'없|아니|않',close):reasons.append('NEGATION_CUE_RULE')
  identity=hashlib.sha256(json.dumps([a,b,m.group(),m.group('counter')],ensure_ascii=False).encode()).hexdigest()
  node={'global_start':a,'global_end':b,'source_spans':provenance(offsets,a,b),'node_id':identity,'counter':m.group('counter'),'cardinality':number,'character_distance':start-b,'exact_repetitions_elsewhere':prefix[:m.start()].count(m.group())+prefix[m.end():].count(m.group()),'exclusion_reasons':reasons}
  (excluded if reasons else nodes).append(node)
 nodes.sort(key=lambda x:(x['character_distance'],x['node_id']))
 if not nodes:state='ABSTAIN_NO_ADMISSIBLE_GROUP';selected=None;compatible=[]
 else:
  compatible=[x for x in nodes if x['character_distance']-nodes[0]['character_distance']<=ambiguity_gap]
  selected=nodes[0] if len(compatible)==1 else None
  state='PROVISIONAL_SOURCE_GROUP' if selected else 'ABSTAIN_COMPETING_GROUPS'
 return {'status':state,'selected_global_span':None if selected is None else [selected['global_start'],selected['global_end']],'candidate_global_spans':[[x['global_start'],x['global_end']] for x in compatible],'nodes':nodes,'excluded':excluded,'prefix_sha256':hashlib.sha256(prefix.encode()).hexdigest(),'window_codepoints':window,'human_ground_truth':None,'semantic_accuracy':None}
