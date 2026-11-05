'use strict';
/** Admissibility for independently collected blinded reader comparisons; not quality assessment. */
function validatePacket(p){
 if(!p||!Array.isArray(p.works)||!Array.isArray(p.pairs))throw Error('PACKET_REQUIRED');
 const works=new Map(),pairs=new Set(),errors=[],sourceSplits=new Map();
 for(const w of p.works){
  if(!w||typeof w.id!=='string'||!w.id||works.has(w.id)||!['development','heldout'].includes(w.split)||!/^[a-f0-9]{64}$/.test(w.sourceSha256||'')){errors.push('INVALID_WORK');continue}
  works.set(w.id,w);
  if(sourceSplits.has(w.sourceSha256)&&sourceSplits.get(w.sourceSha256)!==w.split)errors.push('SOURCE_LEAKAGE');
  sourceSplits.set(w.sourceSha256,w.split);
 }
 for(const q of p.pairs){
  if(!q||typeof q.id!=='string'||!q.id||pairs.has(q.id)){errors.push('INVALID_PAIR');continue}pairs.add(q.id);
  if(!works.has(q.workId)){errors.push('UNKNOWN_WORK');continue}
  if(!['A','B'].every(x=>/^[a-f0-9]{64}$/.test(q[x+'OutputSha256']||'')))errors.push('UNSEALED_OUTPUT');
  if(q.AOutputSha256===q.BOutputSha256)errors.push('IDENTICAL_PAIR');
  if(!q.blindKeySeparated)errors.push('ARM_KEY_EXPOSED');
  if(q.readerRatings!==undefined){
   if(!Array.isArray(q.readerRatings))errors.push('INVALID_RATINGS');
   else for(const r of q.readerRatings)if(!r||!['A','B','tie'].includes(r.choice)||r.independent!==true||r.nativeKorean!==true||!r.raterPseudonym)errors.push('UNADMITTED_RATING');
  }
 }
 return {schema:'ksgt.r97.reader-evidence-gate.v1',pass:errors.length===0,errors:[...new Set(errors)],works:works.size,pairs:pairs.size,
   readerPacketComplete:errors.length===0&&p.pairs.length>0&&p.pairs.every(q=>Array.isArray(q.readerRatings)&&q.readerRatings.length>0),
   writingSuperiorityEstablished:false,
   caveat:'No code can certify independent human identity, semantic correctness, or writing preference superiority from this packet alone.'};
}
module.exports={validatePacket};
