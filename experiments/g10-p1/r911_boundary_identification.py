#!/usr/bin/env python3
"""R9.11: candidate-group partial identification. No essay boundary certification."""
from __future__ import annotations
import hashlib, json, re, unicodedata, zipfile
from collections import defaultdict
from pathlib import Path

EXPECTED_ZIP_SHA='d42d21289708f46c3092b154c36b303b9fd5f77cca4d15b41d770992703de4f7'
EXPECTED_GROUPS=59

def norm(s:str)->str:
    return ''.join(ch for ch in unicodedata.normalize('NFC',s) if not ch.isspace())

def candidate_gap(left_hi:int,right_lo:int)->dict:
    if not isinstance(left_hi,int) or not isinstance(right_lo,int) or left_hi>=right_lo:
        raise ValueError('INVALID_NONOVERLAPPING_SPANS')
    n=right_lo-left_hi
    return {'unanchoredPositions':n-1,'conditionalPossibleBoundaryPositions':n,'pointIdentifiedUnderAdjacency':n==1}

def replay(zip_path:Path,ud_rows:list[dict])->dict:
    raw=zip_path.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=EXPECTED_ZIP_SHA:raise ValueError('SOURCE_ZIP_SHA_MISMATCH')
    with zipfile.ZipFile(zip_path) as z:
        m2=z.read('KoLLA_multi-refs.m2').decode('utf-8-sig')
    source=[line[2:] for line in m2.splitlines() if line.startswith('S ')]
    ix=defaultdict(list)
    for pos,text in enumerate(source):ix[hashlib.sha256(norm(text).encode('utf-8')).hexdigest()].append(pos)
    groups=defaultdict(list);unmatched=0;ambiguous=0;matches=0
    seen=set()
    for row in ud_rows:
        key=(row['split'],row['id'])
        if key in seen:raise ValueError('DUPLICATE_UD_ID')
        seen.add(key)
        m=re.fullmatch(r'(KL-(?:fb|fi|hb|hi)-\d+)-(\d+)(?:-(\d+))?',row['id'])
        if row['split'] not in ('dev','test') or not m:raise ValueError('INVALID_UD_ROW')
        hits=ix.get(hashlib.sha256(norm(row['text']).encode('utf-8')).hexdigest(),[])
        if len(hits)==0: unmatched+=1
        elif len(hits)>1:ambiguous+=1
        else:groups[m.group(1)].append({'index':hits[0],'ordinal':int(m.group(2)),'suffix':m.group(3)});matches+=1
    spans=[];comparisons=0;inversions=0;ties=0
    for name,anchors in groups.items():
        for i,a in enumerate(anchors):
            for b in anchors[i+1:]:
                if a['ordinal']==b['ordinal']:ties+=1;continue
                comparisons+=1
                if (a['ordinal']-b['ordinal'])*(a['index']-b['index'])<0:inversions+=1
        spans.append({'group':name,'lo':min(a['index'] for a in anchors),'hi':max(a['index'] for a in anchors),'anchors':len(anchors)})
    spans.sort(key=lambda x:(x['lo'],x['hi']))
    interleavings=sum(a['hi']>=b['lo'] for i,a in enumerate(spans) for b in spans[i+1:])
    gaps=[candidate_gap(spans[i]['hi'],spans[i+1]['lo']) for i in range(len(spans)-1)] if not interleavings else []
    hist=defaultdict(int)
    for g in gaps:hist[str(g['conditionalPossibleBoundaryPositions'])]+=1
    return {
      'schema':'ksgt.r9.11.candidate-boundary-intervals.v1',
      'sourceBlocks':len(source),'candidateUdRows':len(ud_rows),'uniqueMatched':matches,
      'unmatched':unmatched,'ambiguous':ambiguous,'candidateGroups':len(spans),
      'comparablePairs':comparisons,'sameOrdinalExcludedPairs':ties,'inversions':inversions,
      'interleavings':interleavings,'adjacentCandidateSpanPairs':len(gaps),
      'spansConditionallyUniqueBoundaries':sum(g['pointIdentifiedUnderAdjacency'] for g in gaps),
      'spansConditionallyNonUniqueBoundaries':sum(not g['pointIdentifiedUnderAdjacency'] for g in gaps),
      'maxPossibleBoundaryPositions':max((g['conditionalPossibleBoundaryPositions'] for g in gaps),default=None),
      'totalUnanchoredBetweenCandidateSpans':sum(g['unanchoredPositions'] for g in gaps),
      'conditionalBoundaryMultiplicityHistogram':dict(sorted(hist.items(),key=lambda x:int(x[0]))),
      'certifiedOriginalEssayBoundaries':0,
      'assumptionWarning':'Even a unique adjacent-anchor boundary does not authenticate original essay labels; intervening unseen groups and source-essay authority remain unknown.',
      'rawLearnerTextExported':False,
    }

if __name__=='__main__':
    import argparse
    ap=argparse.ArgumentParser();ap.add_argument('--kolla-zip',type=Path,required=True);ap.add_argument('--ud-private-json',type=Path,required=True);ap.add_argument('--output',type=Path,required=True)
    a=ap.parse_args();ud=json.loads(a.ud_private_json.read_text(encoding='utf-8-sig'))
    data=replay(a.kolla_zip,ud['rows']);a.output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:data[k] for k in ['candidateUdRows','uniqueMatched','unmatched','ambiguous','candidateGroups','adjacentCandidateSpanPairs','spansConditionallyUniqueBoundaries','certifiedOriginalEssayBoundaries']},ensure_ascii=False))
