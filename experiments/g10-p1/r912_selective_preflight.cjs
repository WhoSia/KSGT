'use strict';
/** R9.12: Node-facing selective-repair preflight; not semantic fact checking. */
const crypto=require('node:crypto');
const KINDS=new Set(['UNSUPPORTED_CLAIM','CONTRADICTION','CERTAINTY_SHIFT','PROTECTED_OMISSION','FORMAT_FAILURE','AUDIT_META_LEAK']);
function sha(s){if(typeof s!=='string')throw Error('TEXT_REQUIRED');return crypto.createHash('sha256').update(s,'utf8').digest('hex');}
function rate(x){if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>1)throw Error('INVALID_CALIBRATION');return x;}
function decide(issue){
 if(!issue||!KINDS.has(issue.kind)||!Array.isArray(issue.factIds)||!issue.factIds.length||issue.factIds.some(x=>!/^F[1-9]\d*$/.test(x)))throw Error('INVALID_ISSUE_EVIDENCE');
 const fields=['pErrorLower','gainLower','repairCostUpper','styleLossUpper'];
 if(!fields.every(k=>Object.hasOwn(issue,k)))return {action:'REVIEW',reason:'UNCALIBRATED',automaticallyEditable:false};
 const [p,g,c,s]=fields.map(k=>rate(issue[k]));
 if(issue.evidenceStatus!=='INDEPENDENTLY_REVIEWED')return {action:'REVIEW',reason:'UNREVIEWED',automaticallyEditable:false};
 return {action:p*g>c+s?'PROPOSE_REPAIR':'KEEP',reason:p*g>c+s?'CONSERVATIVE_NET_GAIN':'NO_CONFIRMED_NET_GAIN',automaticallyEditable:false};
}
function applyHumanPatch(text,patch,authorizedIds,{maxSpan=160}={}){
 if(!patch||patch.humanApproved!==true)throw Error('HUMAN_APPROVAL_REQUIRED');
 if(patch.sourceSha256!==sha(text))throw Error('STALE_SOURCE_DIGEST');
 const {start,end,before,after,factIds}=patch;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<=start||end>Array.from(text).length||!Number.isSafeInteger(maxSpan)||maxSpan<1||end-start>maxSpan)throw Error('CODEPOINT_SPAN_INVALID');
 if(typeof after!=='string'||Array.from(after).length>2*maxSpan||!Array.isArray(factIds)||!factIds.length||factIds.some(x=>!authorizedIds.includes(x)))throw Error('INVALID_PATCH_AUTHORITY');
 const codepoints=Array.from(text);
 if(codepoints.slice(start,end).join('')!==before||before===after)throw Error('PATCH_ANCHOR_MISMATCH');
 return codepoints.slice(0,start).join('')+after+codepoints.slice(end).join('');
}
module.exports={KINDS,sha,decide,applyHumanPatch};
