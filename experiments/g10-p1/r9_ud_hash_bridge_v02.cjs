'use strict';
/** Source-only exact external bridge. UD labels are hypotheses, not certified essay IDs. */
const fs=require('node:fs'),crypto=require('node:crypto');
function norm(s){if(typeof s!=='string')throw Error('NOT_TEXT');return s.normalize('NFC').replace(/\s+/gu,'');}
function fingerprint(s){let h=0xcbf29ce484222325n;for(const c of norm(s))h=((h^BigInt(c.codePointAt(0)))*0x100000001b3n)&0xffffffffffffffffn;return h.toString(16).padStart(16,'0');}
function audit(sources,rows){
 if(!Array.isArray(sources)||!Array.isArray(rows))throw Error('ARRAYS_REQUIRED');
 const index=new Map();sources.forEach((s,i)=>{const n=norm(s),k=fingerprint(n)+':'+[...n].length;const arr=index.get(k)||[];arr.push(i);index.set(k,arr)});
 const counts={unique:0,missing:0,ambiguous:0},matched=[],duplicate=[],seen=new Set();
 for(const r of rows){
  if(!r||!['dev','test'].includes(r.split)||!/^KL-(?:fb|fi|hb|hi)-\d+-\d+(?:-\d+)?$/.test(r.id)||!/^[a-f0-9]{16}$/.test(r.fnv64)||!Number.isInteger(r.normLength)||r.normLength<1)throw Error('INVALID_UD_RECEIPT');
  const ref=r.split+':'+r.id;if(seen.has(ref))throw Error('DUPLICATE_UD_ID');seen.add(ref);
  const idx=index.get(r.fnv64+':'+r.normLength)||[];
  if(idx.length===0)counts.missing++;
  else if(idx.length>1){counts.ambiguous++;duplicate.push({udId:r.id,candidates:idx})}
  else{counts.unique++;matched.push({udId:r.id,split:r.split,m2Index0:idx[0],groupCandidate:r.id.split('-').slice(0,3).join('-'),sentenceNumber:Number(r.id.split('-')[3])})}
 }
 const groups=new Map(),perM2=new Map();for(const x of matched){const a=groups.get(x.groupCandidate)||[];a.push(x);groups.set(x.groupCandidate,a);const seenGroups=perM2.get(x.m2Index0)||new Set();seenGroups.add(x.groupCandidate);perM2.set(x.m2Index0,seenGroups)}
 let inversions=0,orderedPairs=0,interleavings=0;const spans=[];
 for(const [group,items] of groups){for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){orderedPairs++;if((items[i].m2Index0-items[j].m2Index0)*(items[i].sentenceNumber-items[j].sentenceNumber)<0)inversions++}spans.push({group,lo:Math.min(...items.map(x=>x.m2Index0)),hi:Math.max(...items.map(x=>x.m2Index0))})}
 for(let i=0;i<spans.length;i++)for(let j=i+1;j<spans.length;j++)if(spans[i].lo<=spans[j].hi&&spans[j].lo<=spans[i].hi)interleavings++;
 return {schema:'ksgt.r9.4.ud-kolla-hash-bridge.v02',total:rows.length,counts,originalM2Blocks:sources.length,uniqueM2:perM2.size,groupCandidates:groups.size,withinGroupPairs:orderedPairs,sequenceInversions:inversions,interleavings,crossGroupM2Conflicts:[...perM2.values()].filter(x=>x.size>1).length,ambiguousEntries:duplicate,matched,sourceWorkVerified:false,documentLevelHold:true,newHumanRatings:0,newModelOutputs:0};
}
module.exports={norm,fingerprint,audit};
