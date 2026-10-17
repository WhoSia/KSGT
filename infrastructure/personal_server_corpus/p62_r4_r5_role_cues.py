"""Source-witnessed Korean particle cues, not semantic event roles or antecedents."""
import hashlib
PARTICLES=('에게서','에게','께서','에서는','에서','으로','부터','이','가','은','는','을','를','께','에','도','만','와','과','의')
CUES={'이':'NOMINATIVE_CUE','가':'NOMINATIVE_CUE','은':'TOPIC_OR_CONTRAST_CUE','는':'TOPIC_OR_CONTRAST_CUE',
 '을':'ACCUSATIVE_CUE','를':'ACCUSATIVE_CUE','께서':'HONORIFIC_SUBJECT_CUE','에게':'DATIVE_OR_GOAL_CUE',
 '에게서':'SOURCE_OR_AGENT_CUE','께':'DATIVE_OR_GOAL_CUE','에':'LOCATIVE_OR_GOAL_CUE',
 '에서':'LOCATIVE_OR_SOURCE_CUE','에서는':'LOCATIVE_AND_TOPIC_CUE','으로':'DIRECTION_OR_INSTRUMENT_CUE',
 '부터':'SOURCE_CUE','도':'ADDITIVE_CUE','만':'EXCLUSIVE_CUE','와':'COORDINATION_OR_COMITATIVE_CUE',
 '과':'COORDINATION_OR_COMITATIVE_CUE','의':'GENITIVE_CUE'}
def quote_scope(s,at):
 stack=[]
 for i,c in enumerate(s[:at]):
  if c=='“':stack.append(i)
  elif c=='”':
   if not stack:return None
   stack.pop()
 return tuple(stack)
def cue(forms,span,target):
 if type(forms) is not list or not forms or any(type(s) is not str for s in forms):raise ValueError('Original units required')
 for obj in (span,target):
  if type(obj) is not dict or any(type(obj.get(k)) is not int for k in ('unit','start','end')):raise ValueError('Exact integer offsets required')
  i,a,b=(obj[k] for k in ('unit','start','end'))
  if not 0<=i<len(forms) or not 0<=a<b<=len(forms[i]):raise ValueError('Invalid bounds')
 offsets=[0]
 for s in forms:offsets.append(offsets[-1]+len(s))
 gs=offsets[span['unit']]+span['start'];ge=offsets[span['unit']]+span['end']
 ts=offsets[target['unit']]+target['start']
 if ge>ts:raise ValueError('Future source witness')
 source=forms[span['unit']]
 fragment=source[span['start']:span['end']]
 witness={'unit':span['unit'],'start':span['start'],'end':span['end'],'global_start':gs,'global_end':ge,
  'sha256':hashlib.sha256(fragment.encode()).hexdigest()}
 suffix=source[span['end']:span['end']+14]
 particle=next((p for p in PARTICLES if suffix.startswith(p)),None)
 pw=None
 if particle:
  a=span['end'];b=a+len(particle)
  pw={'unit':span['unit'],'start':a,'end':b,'sha256':hashlib.sha256(particle.encode()).hexdigest()}
 full=''.join(forms);q1=quote_scope(full,gs);q2=quote_scope(full,ts)
 uncertainty=[]
 if q1 is None or q2 is None:uncertainty.append('HOLD_MALFORMED_QUOTATION_DELIMITER')
 elif q1!=q2:uncertainty.append('UNRESOLVED_QUOTATION_ACCESSIBILITY')
 if not particle:uncertainty.append('NO_ADJACENT_CASE_OR_TOPIC_CUE')
 if particle and len(suffix)>len(particle) and suffix[len(particle)].isalpha():
  uncertainty.append('AMBIGUOUS_PARTICLE_OR_LEXICAL_CONTINUATION')
 return {'witness':witness,'particle_witness':pw,'surface_particle':particle,
  'cue_types':[CUES[particle]] if particle else [],'grammatical_function':'UNDETERMINED',
  'semantic_role':None,'quotation_source_scope':q1,'quotation_target_scope':q2,
  'uncertainties':uncertainty,'human_ground_truth':None,'reference_licensed':False}
def admitted(cue_result,admitted_ids,node_id):
 if type(admitted_ids) not in (set,frozenset) or node_id not in admitted_ids:
  return {'status':'HOLD_SOURCE_NOT_IN_ADMITTED_GRAPH','semantic_role':None}
 if cue_result['uncertainties']:
  return {'status':'HOLD_CUE_AMBIGUITY','reasons':cue_result['uncertainties'],'semantic_role':None}
 return {'status':'SOURCE_SURFACE_CUE_ONLY_NOT_SEMANTIC_ROLE','cue_types':cue_result['cue_types'],'semantic_role':None}
