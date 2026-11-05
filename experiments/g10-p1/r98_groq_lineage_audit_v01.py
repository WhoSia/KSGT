#!/usr/bin/env python3
"""Read-only original Groq R5-R8 audit; export aggregates, not model or learner texts."""
import hashlib,json,re,zipfile
from pathlib import Path
from collections import defaultdict
EXPECTED={
'R5':'6545b0bbc6de471323e7f90eee712a977d015fbbf739cac3c934ebaf51d2cf9a',
'R6':'80695e18ae9c48b08b8a0e9c3564992c65222dc3bbb1905c84f8c7ddcbdb5e44',
'R7':'d96f511be037f4b9e0b0d39a835b8a5943776980baffe5427d070e385e38d5c2',
'R8':'4c8c3f8adcd63b047bc5c71ceeed76e0a26a299ee6b770debb39b316aec591e9'}
def load(label,path):
 raw=Path(path).read_bytes()
 if hashlib.sha256(raw).hexdigest()!=EXPECTED[label]:raise ValueError('ZIP_HASH_MISMATCH')
 with zipfile.ZipFile(path) as z:
  if z.namelist()!=['r'+label[-1]+'_output.json']:raise ValueError('ZIP_MEMBERS_UNEXPECTED')
  return json.loads(z.read(z.namelist()[0]))
def usage(u):
 if not isinstance(u,dict):raise ValueError('USAGE_REQUIRED')
 p,c,t=(u.get(k) for k in ('prompt_tokens','completion_tokens','total_tokens'))
 if not all(isinstance(x,int) and x>=0 for x in (p,c,t)) or p+c!=t:raise ValueError('TOKEN_INCONSISTENCY')
 r=(u.get('completion_tokens_details') or {}).get('reasoning_tokens',0)
 if not isinstance(r,int) or r<0 or r>c:raise ValueError('REASONING_INCONSISTENCY')
 return p,c,t,r
def audit(paths):
 summary={};totalCalls=0;paired=[]
 for label in ('R5','R6','R7','R8'):
  d=load(label,paths[label]);rows=[]
  if label=='R5':rows=[(w['sourceWork'],w['arm'],w) for w in d['records']]
  if label=='R6':rows=[(w['sourceWork'],w['arm'],w) for w in d['rows']]
  if label=='R7':
   for w in d['records']:
    for s in w['steps']:rows.append((w['sourceWork'],w['arm'],s))
  if label=='R8':
   for w in d['records']:
    rows.append((w['sourceWork'],'BASE_DRAFT',w['draft']))
    for r in w['revisions']:rows.append((w['sourceWork'],r['arm'],r))
    g,k=w['revisions']
    if (g['arm'],k['arm'])!=('GENERIC_REVISION','SOURCE_ACCOUNTABLE_REVISION') or g['draftSha256']!=k['draftSha256']:raise ValueError('PAIR_INVALID')
    pg,cg,_,rg=usage(g['usage']);pk,ck,_,rk=usage(k['usage'])
    para=lambda s:len([p for p in re.split(r'\n\s*\n',s.strip()) if p.strip()])
    paired.append({'sourceWork':w['sourceWork'],'sameFinal':g['text']==k['text'],'inputDelta':pk-pg,'completionDelta':ck-cg,'reasoningDelta':rk-rg,'genericParagraphs':para(g['text']),'ksgtParagraphs':para(k['text']),'genericChars':len(g['text']),'ksgtChars':len(k['text'])})
  byArm=defaultdict(lambda:{'calls':0,'prompt':0,'completion':0,'reasoning':0,'total':0})
  for work,arm,step in rows:
   p,c,t,r=usage(step['usage']);s=byArm[arm]
   s['calls']+=1;s['prompt']+=p;s['completion']+=c;s['total']+=t;s['reasoning']+=r
  summary[label]={'calls':len(rows),'distinctWorks':len(set(x[0] for x in rows)),'arms':dict(byArm)}
  totalCalls+=len(rows)
 return {'schema':'ksgt.r98.groq-lineage.v01','rawArchivesHashVerified':4,'totalProviderStages':totalCalls,'finalDocuments':63,'rounds':summary,'r8Pairs':paired,'independentHumanRatings':0,'newProviderCalls':0,'semanticGold':0,'stage':'G10-P1_OPEN'}
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser()
 for n in ('r5','r6','r7','r8'):p.add_argument('--'+n,required=True)
 p.add_argument('--output',required=True);a=p.parse_args()
 report=audit({n.upper():getattr(a,n) for n in ('r5','r6','r7','r8')})
 out=Path(a.output)
 if out.exists():raise ValueError('OUTPUT_EXISTS_NO_OVERWRITE')
 out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'totalProviderStages':report['totalProviderStages'],'finalDocuments':report['finalDocuments'],'r8Identical':sum(p['sameFinal'] for p in report['r8Pairs'])}))
