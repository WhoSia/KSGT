'use strict';
// G10-P2 R5k: codepoint-exact structural screen for an externally proposed
// bounded Korean edit. It NEVER certifies semantic identity or naturalness.
const {createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
const cp=s=>Array.from(s);
const isIndex=(n,max)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
function screen({source,sourceSha256,proposal,authority}={}) {
  if(typeof source!=='string'||typeof sourceSha256!=='string'||
     !proposal||typeof proposal!=='object'||!authority||typeof authority!=='object')
    return {status:'ABSTAIN',reason:'MALFORMED'};
  if(hash(source)!==sourceSha256)return {status:'ABSTAIN',reason:'SOURCE_DIGEST_MISMATCH'};
  const sourceUnits=cp(source), n=sourceUnits.length;
  const {startCp,endCp,expected,replacement}=proposal;
  if(!isIndex(startCp,n)||!isIndex(endCp,n)||startCp>=endCp||
     typeof expected!=='string'||typeof replacement!=='string')
    return {status:'ABSTAIN',reason:'INVALID_SPAN'};
  if(sourceUnits.slice(startCp,endCp).join('')!==expected)
    return {status:'ABSTAIN',reason:'STALE_SPAN'};
  if(!Array.isArray(authority.protectedSpans)||authority.protectedSpans.length===0||
     !Array.isArray(authority.sourceFactIds)||authority.sourceFactIds.length===0||
     !authority.sourceFactIds.every(x=>typeof x==='string'&&x.length>0)||
     typeof authority.actorId!=='string'||!authority.actorId||
     typeof authority.objectId!=='string'||!authority.objectId)
    return {status:'ABSTAIN',reason:'MISSING_SOURCE_AUTHORITY'};
  for(const p of authority.protectedSpans){
    if(!p||!isIndex(p.startCp,n)||!isIndex(p.endCp,n)||p.startCp>=p.endCp||
       !['POLARITY','MODALITY','ACTOR','OBJECT','CONDITION','QUOTE_SCOPE','TEMPORAL'].includes(p.kind)||
       typeof p.sha256!=='string'|| hash(sourceUnits.slice(p.startCp,p.endCp).join(''))!==p.sha256)
      return {status:'ABSTAIN',reason:'INVALID_PROTECTED_SPAN'};
    if(startCp<p.endCp&&endCp>p.startCp)
      return {status:'ABSTAIN',reason:'PROTECTED_SPAN_OVERLAP',kind:p.kind};
  }
  if(proposal.operation!=='DELETE_REPEATED_NOMINAL'||replacement!=='')
    return {status:'ABSTAIN',reason:'UNSUPPORTED_OPERATION'};
  if(typeof authority.mentionText!=='string'||!authority.mentionText||
     expected!==authority.mentionText||!authority.exactSourceTrace)
    return {status:'ABSTAIN',reason:'MISSING_EXACT_MENTION_TRACE'};
  // A nonoverlapping exact source mention is a surface recurrence only,
  // not evidence of reference identity, well-formed syntax or entailment.
  const other=sourceUnits.slice(0,startCp).join('')+sourceUnits.slice(endCp).join('');
  if(!other.includes(expected))return {status:'ABSTAIN',reason:'NO_OTHER_SURFACE_MENTION'};
  const candidate=sourceUnits.slice(0,startCp).join('')+replacement+sourceUnits.slice(endCp).join('');
  const unchangedSpans=authority.protectedSpans.map(p=>({kind:p.kind,sha256:p.sha256}));
  return {status:'STRUCTURAL_CANDIDATE_ONLY',reason:'BOUNDED_DELETE_WITH_PROTECTED_SURFACES',candidate,
    candidateSha256:hash(candidate),sourceSha256,sourceFactIds:authority.sourceFactIds,
    unchangedSpans,semanticStatus:'UNVERIFIED',naturalnessStatus:'UNVERIFIED'};
}
module.exports={screen,hash,cp};
