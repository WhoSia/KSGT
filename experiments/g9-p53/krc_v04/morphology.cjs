"use strict";
/* Partial Korean morphology, explicit discourse conditions.
 * Works for NFC Hangul syllable-final nouns only.
 * Does not resolve pragmatics, honorifics or non-Hangul transliteration. */
function defect(code){const e=new Error(code);e.code=code;throw e;}
function jongIndex(word){
 if(typeof word!=="string"||!word.trim())defect("EMPTY_NOMINAL");
 const n=word.normalize("NFC").trim();
 if(/[^\p{L}\p{M}\s]/u.test(n))defect("NONNOMINAL_MATERIAL");
 const cps=[...n],last=cps[cps.length-1],point=last.codePointAt(0);
 if(point<0xAC00||point>0xD7A3)defect("UNKNOWN_HANGUL_CODA");
 return {word:n,jong:(point-0xAC00)%28};
}
const ROLES=new Set(["NOMINATIVE","ACCUSATIVE","TOPIC","INSTRUMENTAL"]);
function mark(word,role,ctx={}){
 if(!ROLES.has(role))defect("UNSUPPORTED_CASE_ROLE");
 const {word:n,jong}=jongIndex(word);
 if(role==="TOPIC"&&ctx.given!==true)defect("UNLICENSED_TOPIC_INFORMATION_STATE");
 if(role==="TOPIC"&&ctx.exclusiveContrast===true&&ctx.contrastWarrant!==true)
   defect("UNLICENSED_CONTRASTIVE_TOPIC");
 const particle=role==="NOMINATIVE"?(jong?"이":"가"):
  role==="ACCUSATIVE"?(jong?"을":"를"):
  role==="TOPIC"?(jong?"은":"는"):
  (jong===0||jong===8?"로":"으로");
 return {word:n,role,particle,surface:n+particle,
   semantic_role_preserved:role,
   pragmatic_equivalence:"NOT_AUTOMATICALLY_ASSERTED",
   surface_scope:"NFC_HANGUL_FINAL_SYLLABLE_ONLY"};
}
function verifyInSegments(atom,obligation){
 const s=mark(obligation.word,obligation.role,obligation.context||{});
 if(!atom.segments.some(x=>x.includes(s.surface)))defect("MORPHOLOGICAL_CASE_CUSTODY_MISMATCH");
 return {fact_id:atom.id,expected:s.surface,role:s.role,licensed:true,
   info_status:obligation.context?.given?"EXPLICIT_GIVEN_CONTEXT":"NOMINAL_CASE_ONLY"};
}
module.exports={jongIndex,mark,verifyInSegments};
