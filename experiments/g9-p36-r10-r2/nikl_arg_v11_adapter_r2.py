import argparse,collections,hashlib,json,os
from pathlib import Path
DEC=json.JSONDecoder()
SLOT_MAP={'subject':'SUBJECT','주어':'SUBJECT','object':'OBJECT','목적어':'OBJECT','complement':'COMPLEMENT','보어':'COMPLEMENT','adjunct':'ADJUNCT','adverbial':'ADJUNCT','부사어':'ADJUNCT','필수적 부사어':'ADJUNCT'}

def iter_docs(path,chunk=1<<20):
    f=open(path,encoding='utf-8-sig');buf='';target='"document"'
    while True:
        c=f.read(chunk)
        if not c:raise RuntimeError('document array not found')
        buf+=c;i=buf.find(target)
        if i>=0:
            j=buf.find('[',i+len(target))
            if j>=0:buf=buf[j+1:];break
        if len(buf)>128:buf=buf[-128:]
    pos=0
    while True:
        while True:
            while pos<len(buf) and buf[pos] in ' \t\r\n,':pos+=1
            if pos<len(buf):break
            c=f.read(chunk)
            if not c:raise RuntimeError('unexpected EOF')
            buf=buf[pos:]+c;pos=0
        if buf[pos]==']':break
        while True:
            try:o,end=DEC.raw_decode(buf,pos);yield o;pos=end;break
            except json.JSONDecodeError:
                c=f.read(chunk)
                if not c:raise
                if pos:buf=buf[pos:]+c;pos=0
                else:buf+=c
        if pos>chunk*4:buf=buf[pos:];pos=0

def slot(x):
    s=str(x or '').strip();return SLOT_MAP.get(s.lower(),SLOT_MAP.get(s,'UNKNOWN' if not s else 'OTHER:'+s))
def anchor(a):
    sid=a.get('sentence_id');b=a.get('begin');e=a.get('end')
    if sid is None:return None
    if sid=='-1':return 'NIKL_EXTERNAL:-1'
    if str(sid).startswith('#'):return 'NIKL_SPECIAL:'+str(sid)
    return f'NIKL:{sid}:{b if b is not None else "NA"}-{e if e is not None else "NA"}'
def pred(z):
    p=z.get('predicate') or {}
    return {'predicate':str(p.get('form') or '').strip(),'sense':None},p

def graph(event_id,slot_id,slt,predicate,recovery,witness,referent,referent_authority,restored,disc,edge):
    return {'version':'KSGT-ARG-v1.1','event':{**predicate,'instance_id':event_id},
      'roles':[{'slot_instance_id':slot_id,'syntactic_slot':slt,'semantic_role':None,'referent':referent,
      'referent_authority':referent_authority,'frame_status':'UNKNOWN','recovery':recovery,'witness':witness,
      'particle':None,'role_source':'NIKL_ZA_GOLD_SLOT'}],
      'scope':{},'discourse':{**disc,'annotation_edge_state':edge},'realization':{'restored_form':restored}}

def legacy(a):
    if a.get('sentence_id')=='-1':
        return 'ZERO_GENERIC_OR_EXOPHORIC',None,None,'EXOPHORIC_UNSPECIFIED','LEGACY_MINUS1_EXTERNAL_OR_UNSPECIFIED'
    w=anchor(a);return 'ZERO_ANAPHORIC',w,w,'BOUND_ENDOPHORIC','NORMAL_EXPLICIT_ANTECEDENT'
def modern(ants):
    if not ants:return 'UNSATURATED_UNKNOWN',None,None,'UNRESOLVED','EMPTY_ANTECEDENT_ARRAY'
    anchors=[anchor(a) for a in ants]
    normal=[x for x in anchors if x and x.startswith('NIKL:')]
    special=[x for x in anchors if x and x.startswith('NIKL_SPECIAL:')]
    witness='NIKLSET:'+hashlib.sha256(json.dumps(anchors,ensure_ascii=False).encode()).hexdigest()[:24]
    if normal:
        edge='MULTI_SPAN_ANTECEDENT' if len(ants)>1 else 'NORMAL_EXPLICIT_ANTECEDENT'
        auth='BOUND_ENDOPHORIC_SET' if len(ants)>1 else 'BOUND_ENDOPHORIC'
        if special:edge='MIXED_NORMAL_AND_SPECIAL_ANTECEDENT';auth='MIXED_BOUND_AND_SPECIAL'
        return 'ZERO_ANAPHORIC',witness,witness,auth,edge
    if special and len(special)==len(ants):
        return 'ZERO_DEICTIC',witness,witness,'DEICTIC_SPECIAL','SPECIAL_HASH_ANTECEDENT'
    return 'UNSATURATED_UNKNOWN',witness,witness,'UNRESOLVED','NONSTANDARD_ANTECEDENT_ID'

def records(path,version):
    for d in iter_docs(path):
        ss=d.get('sentence') or [];pos={s.get('id'):i for i,s in enumerate(ss)}
        if version=='2020':
            for zi,z in enumerate(d.get('ZA') or []):
                predicate,p=pred(z);ps=p.get('sentence_id');event_id=f'{d.get("id")}|{ps}|{p.get("begin")}-{p.get("end")}|ZA{zi}'
                for ai,a in enumerate(z.get('antecedent') or []):
                    rec,wit,ref,auth,edge=legacy(a);asid=a.get('sentence_id');slot_id=f'{event_id}|A{ai}'
                    dist=(pos.get(asid)-pos.get(ps)) if asid in pos and ps in pos else None
                    disc={'schema_family':'NIKL_ZA_LEGACY_2020','document_id':d.get('id'),'predicate_sentence_id':ps,
                      'antecedent_sentence_ids':[asid],'antecedent_sentence_distance':dist,'antecedent_spans':[a]}
                    yield slot_id,graph(event_id,slot_id,slot(a.get('type')),predicate,rec,wit,ref,auth,a.get('form'),disc,edge)
        else:
            for s in ss:
                for zi,z in enumerate(s.get('ZA') or []):
                    predicate,p=pred(z);ps=p.get('sentence_id');event_id=f'{d.get("id")}|{ps}|{p.get("word_id")}|{p.get("begin")}-{p.get("end")}|ZA{zi}'
                    for ei,e in enumerate(z.get('ellipsis') or []):
                        r=e.get('restored') or {};ants=e.get('antecedent') or [];slot_id=f'{event_id}|E{ei}'
                        rec,wit,ref,auth,edge=modern(ants);sids=[a.get('sentence_id') for a in ants]
                        ds=[pos[a]-pos[ps] for a in sids if a in pos and ps in pos]
                        if not r:edge='BLANK_RESTORED_OBJECT'
                        disc={'schema_family':'NIKL_ZA_ELLIPSIS_2025','document_id':d.get('id'),'predicate_sentence_id':ps,
                          'antecedent_sentence_ids':sids,'antecedent_sentence_distances':ds,'antecedent_spans':ants,'multi_span':len(ants)>1}
                        yield slot_id,graph(event_id,slot_id,slot(r.get('type')),predicate,rec,wit,ref,auth,r.get('form'),disc,edge)

def run(inputs,out):
    os.makedirs(out,exist_ok=True);n=0;slots=collections.Counter();rec=collections.Counter();auth=collections.Counter()
    with open(os.path.join(out,'arg_gold_graphs_v11.jsonl'),'w',encoding='utf8') as g,open(os.path.join(out,'arg_validate_requests_v11.jsonl'),'w',encoding='utf8') as q:
        for spec in inputs:
            version,path=spec.split('=',1)
            for rid,gr in records(path,version):
                n+=1;r=gr['roles'][0];slots[r['syntactic_slot']]+=1;rec[r['recovery']]+=1;auth[r['referent_authority']]+=1
                g.write(json.dumps({'id':rid,'source':Path(path).name,'graph':gr},ensure_ascii=False)+'\n')
                q.write(json.dumps({'id':rid,'op':'validate','left':gr,'expected_pass':True},ensure_ascii=False)+'\n')
    sm={'version':'KSGT-ARG-v1.1','records':n,'syntactic_slot_counts':dict(slots),'recovery_counts':dict(rec),'referent_authority_counts':dict(auth)}
    json.dump(sm,open(os.path.join(out,'adapter_summary_v11.json'),'w'),ensure_ascii=False,indent=2);return sm
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('inputs',nargs='+');ap.add_argument('--out',required=True);a=ap.parse_args()
    print(json.dumps(run(a.inputs,a.out),ensure_ascii=False,indent=2))
