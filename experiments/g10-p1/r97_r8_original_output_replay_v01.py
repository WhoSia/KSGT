#!/usr/bin/env python3
"""R9.7 read-only replay; source zip remains outside public repository."""
import argparse,hashlib,json,re,zipfile
from pathlib import Path
EXPECTED='4c8c3f8adcd63b047bc5c71ceeed76e0a26a299ee6b770debb39b316aec591e9'
def replay(path):
 raw=Path(path).read_bytes();digest=hashlib.sha256(raw).hexdigest()
 if digest!=EXPECTED:raise ValueError('SOURCE_ZIP_HASH_MISMATCH')
 with zipfile.ZipFile(path) as z:
  if z.namelist()!=['r8_output.json']:raise ValueError('UNEXPECTED_ARCHIVE')
  data=json.loads(z.read('r8_output.json'))
 if data.get('schema')!='ksgt.g10.p1.r8.execution.v01':raise ValueError('INVALID_SCHEMA')
 def paragraphs(t):return len([x for x in re.split(r'\n\s*\n',t.strip()) if x.strip()])
 rec=[]
 for w in data['records']:
  if len(w['revisions'])!=2:raise ValueError('INVALID_REVISION_COUNT')
  g,k=w['revisions']
  if (g['arm'],k['arm'])!=('GENERIC_REVISION','SOURCE_ACCOUNTABLE_REVISION') or g['draftSha256']!=k['draftSha256']:raise ValueError('PAIR_MISMATCH')
  rec.append({'sourceWork':w['sourceWork'],'textIdentical':g['text']==k['text'],'genericParagraphs':paragraphs(g['text']),'ksgtParagraphs':paragraphs(k['text'])})
 return {'schema':'ksgt.r97.r8-replay.v01','originalZipSha256':digest,'sourceWorks':len(rec),
 'identical':sum(x['textIdentical'] for x in rec),'different':sum(not x['textIdentical'] for x in rec),
 'genericThreeParagraph':sum(x['genericParagraphs']==3 for x in rec),
 'ksgtThreeParagraph':sum(x['ksgtParagraphs']==3 for x in rec),
 'newHumanRatings':data['humanRatings'],'independentSemanticGold':data['independentSemanticGold'],
 'writingQualityWinner':'UNIDENTIFIED','works':rec}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('zip');args=p.parse_args();print(json.dumps(replay(args.zip),indent=2,ensure_ascii=False))
