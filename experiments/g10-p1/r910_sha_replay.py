#!/usr/bin/env python3
"""Reproduce KoLLA M2 versus UD dev/test SHA256 match receipts, privately.
No original learner text or textual fingerprints leave the working directory.
"""
import argparse, collections, hashlib, json, re, unicodedata, zipfile
from pathlib import Path
M2_ZIP_SHA='d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7'
M2_CONTENT_SHA='d848bac8095bf4280e9c8f6bb7ef2733434cf0eb2c2977d34fd4a0eb6c061ed4'
UD_BLOBS={'dev':'eff8a689c1dad1231ac5d342ebb78742f6327fa3','test':'637d4405a89b41439b63cc175ec20ae666227905'}
def norm(s):
    return re.sub(r'\s+', '', unicodedata.normalize('NFC', s))
def sha(s): return hashlib.sha256(s.encode('utf-8')).hexdigest()
def parse_m2(raw):
    blocks=[]
    for b in re.split(r'\n\s*\n',raw.decode('utf-8-sig')):
        lines=b.splitlines()
        if not lines:continue
        if not lines[0].startswith('S '):
            raise ValueError('UNEXPECTED_M2_RECORD')
        blocks.append(lines[0][2:])
    return blocks
def replay(original_zip, ud_json):
    raw=Path(original_zip).read_bytes()
    if sha_bytes(raw)!=M2_ZIP_SHA:raise ValueError('UNSEALED_KOLLA_ARCHIVE')
    with zipfile.ZipFile(original_zip) as z: m2=z.read('KoLLA_multi-refs.m2')
    if sha_bytes(m2)!=M2_CONTENT_SHA:raise ValueError('UNSEALED_M2')
    sources=parse_m2(m2)
    ud=json.loads(Path(ud_json).read_text('utf-8-sig'))
    if ud.get('schema')!='ksgt.r9.10.ud-source-sentences.private-bridge.v01':raise ValueError('INVALID_UD_SNAPSHOT')
    if {x['split']:x['gitBlob'] for x in ud['metadata']}!=UD_BLOBS:raise ValueError('UNPINNED_UD_BLOB')
    rows=ud['rows']
    keys=[(r['split'],r['id']) for r in rows]
    if len(keys)!=len(set(keys)):raise ValueError('REPEATED_UD_ID')
    idx=collections.defaultdict(list)
    for n,s in enumerate(sources):idx[(sha(norm(s)),len(norm(s)))].append(n)
    matched,ambiguous,missing=[],[],[]
    for row in rows:
        if not re.fullmatch(r'KL-(?:fb|fi|hb|hi)-\d+-\d+(?:-\d+)?',row['id']):raise ValueError('INVALID_ID')
        n=norm(row['text']);positions=idx.get((sha(n),len(n)),[])
        item={'split':row['split'],'udId':row['id'],'m2Index0':positions[0] if len(positions)==1 else None}
        if not positions:missing.append(item)
        elif len(positions)>1:ambiguous.append({**item,'candidateCount':len(positions)})
        else:matched.append(item)
    groups=collections.defaultdict(list)
    for x in matched:
        parts=x['udId'].split('-');groups['-'.join(parts[:3])].append({**x,'number':int(parts[3])})
    spans=[(g,min(x['m2Index0'] for x in v),max(x['m2Index0'] for x in v)) for g,v in groups.items()]
    crossings=[(a[0],b[0]) for i,a in enumerate(spans) for b in spans[i+1:] if a[1]<=b[2] and b[1]<=a[2]]
    pair_count=0;inverse=0;ties=0
    for v in groups.values():
        for i,a in enumerate(v):
            for b in v[i+1:]:
                if a['number']==b['number']:
                    ties+=1;continue
                pair_count+=1
                if (a['number']-b['number'])*(a['m2Index0']-b['m2Index0'])<0:inverse+=1
    return {'schema':'ksgt.r9.10.ud-kolla-sha256-cold-replay.v01',
      'originalKoLLAZipSha256':M2_ZIP_SHA,'originalM2Sha256':M2_CONTENT_SHA,'sourceM2Blocks':len(sources),
      'udBlobSHA1':UD_BLOBS,'candidateUDRows':len(rows),
      'unique':len(matched),'missing':len(missing),'ambiguous':len(ambiguous),
      'uniqueM2SourceIndices':len(set(x['m2Index0'] for x in matched)),
      'candidateGroupSpans':len(groups),'spansInterleavingCount':len(crossings),
      'withinGroupComparablePairs':pair_count,'withinGroupSequenceInversions':inverse,
      'withinGroupSameNumberPairsExcluded':ties,
      'originalEssayMapCertified':False,'independentHumanRatings':0,
      'rawLearnerTextPublished':False,
      'udRecordsPerSplit':dict(collections.Counter(x['split'] for x in rows)),
      'limitations':['NFC+whitespace normalized equality, not raw bytes','UD IDs are external and unauthenticated as original essay IDs','No UD train text replay','No end-to-end original essay boundaries']} 
def sha_bytes(b):return hashlib.sha256(b).hexdigest()
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('original_zip');a.add_argument('ud_snapshot');a.add_argument('--output',required=True);args=a.parse_args()
 result=replay(args.original_zip,args.ud_snapshot)
 out=Path(args.output)
 if out.exists(): raise ValueError('NO_OVERWRITE')
 out.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
 print(json.dumps({k:result[k] for k in ('candidateUDRows','unique','missing','ambiguous','candidateGroupSpans','spansInterleavingCount','withinGroupComparablePairs','withinGroupSequenceInversions','withinGroupSameNumberPairsExcluded')},ensure_ascii=False))
