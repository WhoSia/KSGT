#!/usr/bin/env python3
"""Inspect observed R8 formatting and surface markers. NOT a prose evaluator."""
import argparse,hashlib,json,re,zipfile
from pathlib import Path

EXPECTED_R8_ZIP='4c8c3f8adcd63b047bc5c71ceeed76e0a26a299ee6b770debb39b316aec591e9'
# Explicitly known audit register leakage; flags only, not gold semantic adjudication.
META_PATTERNS={
 'source_preservation_meta':r'(?:정확히|그대로)\s*보존(?:되어|되었|해야|한다)',
 'source_nonassertion_meta':r'(?:정기적\s*매주\s*행사|원천에\s*(?:없|명시되지))',
 'instruction_reference':r'(?:주어진\s*(?:원천|사실|조건)|자료에\s*따르면)',
}

def paragraphs(s):return [x.strip() for x in re.split(r'\n\s*\n',s.strip()) if x.strip()]
def analyze_text(s):
 p=paragraphs(s)
 return {'characters':len(s),'paragraphs':len(p),
         'maxParagraphFraction':round(max((len(x) for x in p),default=0)/max(sum(map(len,p)),1),4),
         'paragraphLengths':[len(x) for x in p],
         'singleNewlineLines':len([line for line in s.splitlines() if line.strip()]),
         'surfaceMetaFlags':{k:len(re.findall(v,s)) for k,v in META_PATTERNS.items()}}

def probe(path:Path)->dict:
 raw=path.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=EXPECTED_R8_ZIP:raise ValueError('R8_ZIP_HASH_MISMATCH')
 with zipfile.ZipFile(path) as z:
  if z.namelist()!=['r8_output.json']:raise ValueError('UNEXPECTED_ZIP_MEMBERS')
  d=json.loads(z.read('r8_output.json'))
 records=[]
 for w in d['records']:
  if len(w['revisions'])!=2:raise ValueError('EXPECTED_MATCHED_PAIR')
  a,b=w['revisions']
  if (a['arm'],b['arm'])!=('GENERIC_REVISION','SOURCE_ACCOUNTABLE_REVISION') or a['draftSha256']!=b['draftSha256']:raise ValueError('NOT_SHARED_DRAFT')
  g=analyze_text(a['text']);k=analyze_text(b['text']);
  records.append({'sourceWork':w['sourceWork'],'exactSameText':a['text']==b['text'],
    'generic':g,'accountable':k,'characterDelta':k['characters']-g['characters'],
    'paragraphDelta':k['paragraphs']-g['paragraphs']})
 return {'schema':'ksgt.r911.r8-surface-probe.v1','archiveSha256':EXPECTED_R8_ZIP,
  'sourceWorks':len(records),'sameText':sum(r['exactSameText'] for r in records),
  'ksgtShorter':sum(r['characterDelta']<0 for r in records),
  'ksgtLonger':sum(r['characterDelta']>0 for r in records),
  'paragraphDeficits':sum(r['paragraphDelta']<0 for r in records),
  'genericMetaFlagWorks':sum(any(r['generic']['surfaceMetaFlags'].values()) for r in records),
  'ksgtMetaFlagWorks':sum(any(r['accountable']['surfaceMetaFlags'].values()) for r in records),
  'sourceFidelityGold':0,'readerNaturalnessRatings':0,
  'limitations':'Surface regex may have false positives/negatives. Not objective semantic hallucination or quality scores. Development works only.',
  'records':records}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--zip',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();j=probe(a.zip);a.output.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n');print({k:j[k] for k in ('sameText','ksgtShorter','paragraphDeficits','genericMetaFlagWorks','ksgtMetaFlagWorks')})