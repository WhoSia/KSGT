"use strict";
/**
 * G10-P2 R3 closed structured cross-authority proof.
 * Human-authored source relation + human-authored extracted hypothesis;
 * evidence string/offsets and modality are checked, not free Korean parsed.
 */
const fs=require("node:fs"),path=require("node:path");
const corpus=require("../g10-p1/fixtures/r934_reader_cohort_v01.json");
const fixture=require("./fixtures/r3_dual_authority_4works_v01.json");
const ALLOW_KEYS=["predicate","actor","object","time","condition","modality"];
const EPISTEMIC=new Set(["ASSERTED","ATTRIBUTED","QUESTION","DENIED",
  "OBLIGATION","OPTIONAL","CONDITIONAL","PLANNED"]);
function fail(code){throw Error(code)}
function uniqueSpan(text,witness){
  if(typeof text!=="string"||typeof witness!=="string"||
      !witness.trim()||witness!==witness.trim())return null;
  const at=text.indexOf(witness);
  if(at<0||text.indexOf(witness,at+1)>=0)return null;
  return [at,at+witness.length];
}
function loadLicense(workId){
  if(!/^(CHAT|SCI|NOTICE|LIT)_[A-Z]+$/.test(workId))fail("BAD_WORK_ID");
  const entry=fixture.works.find(w=>w.id===workId);
  const source=corpus.find(w=>w.id===workId);
  if(!entry||!source)fail("UNKNOWN_SOURCE_WORK");
  if(!Number.isInteger(entry.factIndex)||entry.factIndex<1||
     entry.factIndex>source.facts.length)fail("BAD_FACT_INDEX");
  const sourceFact=source.facts[entry.factIndex-1];
  const sourceWhole=source.facts.join(" ");
  const witness=uniqueSpan(sourceWhole,sourceFact);
  if(!witness)fail("SOURCE_WITNESS_UNANCHORED");
  const license=entry.relation;
  if(!license||typeof license!=="object"||!license.predicate||
     !license.modality||Object.keys(license).some(key=>!ALLOW_KEYS.includes(key))||
     Object.values(license).some(x=>typeof x!=="string"||!x.length))
     fail("MALFORMED_SOURCE_LICENSE");
  return {workId,sourceId:workId+".F"+entry.factIndex,sourceText:sourceFact,
    sourceWhole,sourceSpan:witness,license:{...license}};
}
function crossCheck({workId,realizedText,evidence,hypothesis}){
  const licensed=loadLicense(workId);
  if(typeof realizedText!=="string"||typeof evidence!=="string"||
     !hypothesis||typeof hypothesis!=="object"||Array.isArray(hypothesis))
     return {decision:"ABSTAIN",reason:"MISSING_OR_INVALID_SURFACE",sourceId:licensed.sourceId};
  const surfaceSpan=uniqueSpan(realizedText,evidence);
  if(!surfaceSpan)return {decision:"ABSTAIN",reason:"UNWITNESSED_OR_NONUNIQUE_SURFACE",
    sourceId:licensed.sourceId};
  const proof={sourceId:licensed.sourceId,sourceSpan:licensed.sourceSpan,
    surfaceSpan,sourceText:licensed.sourceText,evidence};
  if(!EPISTEMIC.has(hypothesis.epistemic))
    return {decision:"ABSTAIN",reason:"UNKNOWN_EPISTEMIC_MODE",proof};
  if(["ATTRIBUTED","QUESTION"].includes(hypothesis.epistemic))
    return {decision:"MENTION_ONLY",reason:"MENTIONED_NOT_ENDORSED",proof};
  const fields=Object.keys(licensed.license);
  const submitted=Object.keys(hypothesis).filter(k=>k!=="epistemic");
  if(fields.length!==submitted.length||fields.some(key=>!submitted.includes(key))||
     submitted.some(key=>!ALLOW_KEYS.includes(key)))
    return {decision:"ABSTAIN",reason:"STRUCTURAL_FIELDS_INCOMPLETE_OR_EXTRA",proof};
  const changed=fields.filter(field=>hypothesis[field]!==licensed.license[field]);
  if(changed.length){
    const reason=changed.includes("modality")||hypothesis.epistemic!==licensed.license.modality
      ?"SOURCE_MODALITY_OR_CONDITION_PROMOTED":"SOURCE_RELATION_CHANGED";
    return {decision:"REJECT",reason,conflictingFields:changed,proof};
  }
  if(hypothesis.epistemic!==licensed.license.modality)
    return {decision:"REJECT",reason:"SOURCE_MODALITY_OR_CONDITION_PROMOTED",proof};
  // R3 v0 refuses to trust a model's own semantic-role tuple as a certificate.
  // Only authored exact full-sentence surfaces may be admitted in this toy court.
  const allowed=new Set(fixture.works.find(w=>w.id===workId).examples
    .filter(ex=>ex.expected==="ALLOW").map(ex=>ex.text));
  if(!allowed.has(realizedText)||realizedText!==evidence)
    return {decision:"ABSTAIN",reason:"NO_INDEPENDENT_SURFACE_RELATION_CERTIFICATE",proof};
  return {decision:"ALLOW",reason:"STRUCTURED_RELATION_AND_AUTHORED_SURFACE_WITNESSED",
    modality:licensed.license.modality,proof};
}
function reviewText(workId,lines,claims){
  if(!Array.isArray(lines)||!Array.isArray(claims)||lines.length!==claims.length||
     lines.length===0||lines.some(x=>typeof x!=="string"||!x.trim()))
    fail("INVALID_TEXT_UNITS");
  const text=lines.join("\n");
  const decisions=claims.map((claim,i)=>{
    if(typeof claim?.evidence!=="string"||claim.evidence!==lines[i])
      return {decision:"ABSTAIN",reason:"INCOMPLETE_LINE_COVERAGE"};
    return crossCheck({workId,realizedText:lines[i],evidence:claim.evidence,
      hypothesis:claim.hypothesis});
  });
  return {decision:decisions.every(d=>d.decision==="ALLOW")?"KEEP":"ABSTAIN",
    text,decisions,modelCalls:0,unknownOrUnsafe:decisions.filter(d=>d.decision!=="ALLOW").length};
}
function diagnostic(){
  return fixture.works.map(w=>({
    work:w.id,sourceId:loadLicense(w.id).sourceId,
    outcomes:w.examples.map(ex=>{
      const result=crossCheck({workId:w.id,realizedText:ex.text,
        evidence:ex.text,hypothesis:ex.hypothesis});
      return {id:ex.id,expected:ex.expected,observed:result.decision,
        reason:result.reason,proof:result.proof};
    })
  }));
}
function main(){
  const results=diagnostic();
  process.stdout.write(JSON.stringify({status:"AUTHOR_STRUCTURED_CLOSED_SCOPE_ONLY",
    sourceWorks:results.length,cases:results.reduce((n,x)=>n+x.outcomes.length,0),
    failedRuleChecks:results.flatMap(x=>x.outcomes).filter(x=>x.expected!==x.observed).length,
    realModelCalls:0,independentHumanRatings:0,results},null,2)+"\n");
}
if(require.main===module)main();
module.exports={fixture,loadLicense,uniqueSpan,crossCheck,reviewText,diagnostic};
