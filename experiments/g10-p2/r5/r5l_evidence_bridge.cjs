'use strict';
// Source-byte custody and mechanical transport only; never semantic certification.
const crypto = require('node:crypto');
const {screen, hash, cp}=require('./r5k_source_span_edit.cjs');
const digest = x=>crypto.createHash('sha256').update(x,'utf8').digest('hex');
function canonical(x){
  if(x===null||typeof x==='string'||typeof x==='boolean')return JSON.stringify(x);
  if(typeof x==='number'&&Number.isFinite(x))return JSON.stringify(x);
  if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
  if(x&&typeof x==='object'&&Object.getPrototypeOf(x)===Object.prototype){
    const keys=Object.keys(x).sort();
    if(keys.some(k=>x[k]===undefined))throw Error('undefined field');
    return '{'+keys.map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
  }
  throw Error('non-JSON evidence');
}
const schema='ksgt.g10.p2.r5l.source-evidence.v1';
const knownKinds=new Set(['POLARITY','MODALITY','ACTOR','OBJECT','CONDITION','QUOTE_SCOPE','TEMPORAL']);
const fail=(reason)=>({status:'ABSTAIN',reason});
// A trusted admission is an in-process capability, not a caller-asserted status string.
const admitted=new WeakSet();
function admit({source,evidence,pinned}={}){
  if(typeof source!=='string'||!evidence||typeof evidence!=='object'||!pinned||typeof pinned!=='object')return fail('MALFORMED');
  if(!/^[a-f0-9]{64}$/.test(pinned.sourceSha256||'')||!/^[a-f0-9]{64}$/.test(pinned.evidenceSha256||''))return fail('MISSING_PINNED_ROOT');
  if(hash(source)!==pinned.sourceSha256)return fail('SOURCE_DIGEST_MISMATCH');
  let evidenceDigest;
  try{evidenceDigest=digest(canonical(evidence))}catch{return fail('INVALID_EVIDENCE_JSON')}
  if(evidenceDigest!==pinned.evidenceSha256)return fail('EVIDENCE_DIGEST_MISMATCH');
  if(evidence.schema!==schema||evidence.sourceSha256!==pinned.sourceSha256||evidence.coordinateUnit!=='UNICODE_CODEPOINT')return fail('SCHEMA_OR_COORDINATE_MISMATCH');
  if(!Array.isArray(evidence.sourceFactIds)||evidence.sourceFactIds.length===0||!evidence.sourceFactIds.every(x=>typeof x==='string'&&x.length>0))return fail('INVALID_FACT_IDS');
  if(!Array.isArray(evidence.protectedSpans)||evidence.protectedSpans.length===0)return fail('MISSING_PROTECTED_SPANS');
  const u=cp(source), n=u.length;
  const valid=(p)=>p&&knownKinds.has(p.kind)&&Number.isSafeInteger(p.startCp)&&Number.isSafeInteger(p.endCp)&&p.startCp>=0&&p.startCp<p.endCp&&p.endCp<=n&&/^[a-f0-9]{64}$/.test(p.sha256||'')&&hash(u.slice(p.startCp,p.endCp).join(''))===p.sha256;
  if(!evidence.protectedSpans.every(valid))return fail('INVALID_PROTECTED_SPAN');
  // No provided sourceFactId or actorID can establish actual semantic truth.
  if(!Array.isArray(evidence.mentions)||!evidence.mentions.every(p=>p&&typeof p.text==='string'&&p.text.length>0&&Number.isSafeInteger(p.startCp)&&Number.isSafeInteger(p.endCp)&&p.startCp>=0&&p.startCp<p.endCp&&p.endCp<=n&&u.slice(p.startCp,p.endCp).join('')===p.text))return fail('INVALID_MENTION');
  const record=Object.freeze({status:'PINNED_BYTE_EVIDENCE_ONLY',source,sourceSha256:pinned.sourceSha256,
    evidenceSha256:evidenceDigest,sourceFactIds:Object.freeze([...evidence.sourceFactIds]),
    protectedSpans:Object.freeze(evidence.protectedSpans.map(p=>Object.freeze({...p}))),
    mentions:Object.freeze(evidence.mentions.map(m=>Object.freeze({...m}))),
    semanticStatus:'UNVERIFIED',naturalnessStatus:'UNVERIFIED'});
  admitted.add(record);
  return record;
}
function screenWithAdmission({admission,proposal,actorId,objectId}={}){
  if(!admission||typeof admission!=='object'||!admitted.has(admission))return fail('NOT_ADMITTED');
  if(typeof actorId!=='string'||!actorId||typeof objectId!=='string'||!objectId||!proposal||typeof proposal!=='object')return fail('MISSING_PROPOSAL_ROLE');
  const witnessed=admission.mentions.some(m=>m.startCp===proposal.startCp&&m.endCp===proposal.endCp&&m.text===proposal.expected);
  if(!witnessed)return fail('EDIT_MENTION_NOT_WITNESSED');
  const r=screen({source:admission.source,sourceSha256:admission.sourceSha256,proposal,
    authority:{sourceFactIds:admission.sourceFactIds,actorId,objectId,mentionText:proposal.expected,exactSourceTrace:true,
      protectedSpans:admission.protectedSpans}});
  return {...r,evidenceSha256:admission.evidenceSha256,semanticStatus:'UNVERIFIED',naturalnessStatus:'UNVERIFIED'};
}
module.exports={schema,canonical,digest,admit,screenWithAdmission};
