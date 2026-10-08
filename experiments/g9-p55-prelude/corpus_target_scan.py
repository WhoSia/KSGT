#!/usr/bin/env python3
"""Aggregate-only finite target-shape census of existing private NIKL 2025 ZIP."""
from collections import Counter
from pathlib import Path
import hashlib,json,re,sys,zipfile
ZIP='c0d65205de493dca86d98cef02cf1742844a3b9259caf0ec3dc7e48ddd62d05d'
MEMBERS={'NXZA2502512313.json':'b3aaefd241ae351c4c252cc493161d9be02232779a47bd7735195d0de87e8f86','SXZA2502512312.json':'717fbe35db08b91bd62fdfb2a29cdef8a2d91aa85d099f256e82802e8122e0cc'}
FORMS=('그중에서도','그중에서','그중에선','그중에','그중')
FINITE=re.compile(r'^그중(?:에서도|에서|에선|에)?\s*(?:\d[\d,]*|한|두|세|네|다섯)\s*(?:개|명|건|팀|장|권|종|가지|마리|곳)')
PCT=re.compile(r'^그중(?:에서도|에서|에선|에)?\s*\d+(?:\.\d+)?\s*%')
BARE=re.compile(r'^그중(?:에서도|에서|에선|에)?\s*(?:절반|하나|한쪽|반|일부)')
def sha(b):return hashlib.sha256(b).hexdigest()
def audit(path):
 b=Path(path).read_bytes()
 if sha(b)!=ZIP:raise ValueError('ARCHIVE_SHA_MISMATCH')
 c=Counter()
 with zipfile.ZipFile(path) as z:
  for name,digest in MEMBERS.items():
   raw=z.read(name)
   if sha(raw)!=digest:raise ValueError('MEMBER_SHA_MISMATCH')
   for doc in json.loads(raw)['document']:
    for row in doc['sentence']:
     s=row['form'];at=s.find('그중')
     if at<0:continue
     s=s[at:];c['geujung_contexts']+=1
     c['finite_integer_counter_target']+=int(bool(FINITE.search(s)))
     c['percent_target']+=int(bool(PCT.search(s)))
     c['nonclassifier_selection']+=int(bool(BARE.search(s)))
     form=next((f for f in FORMS if s.startswith(f)),None)
     if form is None:raise ValueError('UNSEEN_FORM')
     c['form_'+form]+=1
 if c['geujung_contexts']!=25:raise ValueError('SOURCE_COUNT_CHANGED')
 return {'schema':'ksgt.g9p55.private_target_shape.v1','source_sha256':ZIP,'counts':dict(c),'proven_antecedent_gold':0,'observed_writer_choices':0,'public_source_text':False}
if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('Usage: corpus_target_scan.py PRIVATE_NIKL_ZIP')
 print(json.dumps(audit(sys.argv[1]),ensure_ascii=False,indent=2))
