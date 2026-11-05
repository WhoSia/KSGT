'use strict';
/** R9.5 SHA-256 normalized-string receipts; never certifies essay identity. */
const crypto=require('node:crypto');
function norm(s){if(typeof s!=='string')throw Error('NOT_TEXT');return s.normalize('NFC').replace(/\s+/gu,'');}
function sha(s){return crypto.createHash('sha256').update(norm(s),'utf8').digest('hex');}
function audit(sources,rows){
 if(!Array.isArray(sources)||!Array.isArray(rows))throw Error('ARRAYS_REQUIRED');
 const index=new Map();
 sources.forEach((s,i)=>{const k=sha(s)+':'+[...norm(s)].length;const a=index.get(k)||[];a.push(i);index.set(k,a)});
 const seen=new Set(),matched=[],ambiguous=[],missing=[];
 for(const r of rows){
  if(!r||!['dev','test','train'].includes(r.split)||!/^KL-(?:fb|fi|hb|hi)-\d+-\d+(?:-\d+)?$/.test(r.id)||!/^[a-f0-9]{64}$/.test(r.sha256)||!Number.isInteger(r.normLength)||r.normLength<1)throw Error('INVALID_RECEIPT');
  const key=r.split+':'+r.id;if(seen.has(key))throw Error('DUPLICATE_UD_ID');seen.add(key);
  const hits=index.get(r.sha256+':'+r.normLength)||[];
  if(hits.length===1)matched.push({id:r.id,split:r.split,m2Index0:hits[0],groupCandidate:r.id.split('-').slice(0,3).join('-'),sentenceNumber:Number(r.id.split('-')[3])});
  else if(hits.length===0)missing.push(r.id);else ambiguous.push({id:r.id,candidates:hits});
 }
 const groups=new Map(),atSource=new Map();
 for(const x of matched){const a=groups.get(x.groupCandidate)||[];a.push(x);groups.set(x.groupCandidate,a);const s=atSource.get(x.m2Index0)||new Set();s.add(x.groupCandidate);atSource.set(x.m2Index0,s)}
 let comparisons=0,inversions=0,interleavings=0;const spans=[];
 for(const [name,a] of groups){
  for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){
   if(a[i].sentenceNumber===a[j].sentenceNumber)continue;
   comparisons++;if((a[i].m2Index0-a[j].m2Index0)*(a[i].sentenceNumber-a[j].sentenceNumber)<0)inversions++;
  }
  spans.push({name,lo:Math.min(...a.map(x=>x.m2Index0)),hi:Math.max(...a.map(x=>x.m2Index0))});
 }
 for(let i=0;i<spans.length;i++)for(let j=i+1;j<spans.length;j++)if(spans[i].lo<=spans[j].hi&&spans[j].lo<=spans[i].hi)interleavings++;
 return {schema:'ksgt.r9.5.sha-bridge.v03',total:rows.length,unique:matched.length,missing:missing.length,ambiguous:ambiguous.length,groupCandidates:groups.size,comparablePairs:comparisons,inversions,interleavings,crossGroupSourceConflicts:[...atSource.values()].filter(s=>s.size>1).length,matched,missingIds:missing,ambiguousEntries:ambiguous,sourceWorkVerified:false,documentLevelHold:true,independentReaderRatings:0};
}
module.exports={norm,sha,audit};
