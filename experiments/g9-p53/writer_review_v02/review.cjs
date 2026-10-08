'use strict';
// KSGT G9-P53: writer-facing candidate review. No inference, no trained
// semantic judge, no remote calls, and no automatic rewriting by default.
const crypto = require('node:crypto');
const {compile} = require('../genre_authority_v01/src/genre_contract.cjs');
const {portfolio} = require('../genre_authority_v01/src/partitive_portfolio.cjs');
const hash = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const MAX_DOCUMENT_CHARS = 100000;
const MAX_CANDIDATES = 8;
function validText(x) {return typeof x === 'string' && x.length > 0 && x.length <= MAX_DOCUMENT_CHARS && x.trim().length > 0;}
function minimalChange(from, to) {
  const a=Array.from(from), b=Array.from(to);
  let left=0, right=0;
  while(left<Math.min(a.length,b.length) && a[left]===b[left])left++;
  while(right<Math.min(a.length-left,b.length-left) && a[a.length-right-1]===b[b.length-right-1])right++;
  const removed=a.slice(left,a.length-right).join('');
  const inserted=b.slice(left,b.length-right).join('');
  return {common_prefix_characters:left, common_suffix_characters:right,
          removed,inserted,removed_codepoints:Array.from(removed).length,inserted_codepoints:Array.from(inserted).length};
}
function review({brief,draft,modelCandidates=[],referenceInput=null,selection=null}={}) {
  const contract=compile(brief); // Validates F/E/L/W and full two-section plan.
  if(!validText(draft))throw Error('INVALID_DRAFT');
  if(!Array.isArray(modelCandidates)||modelCandidates.length>MAX_CANDIDATES)throw Error('INVALID_MODEL_CANDIDATES');
  const candidates=[{id:'KEEP_ORIGINAL',channel:'IDENTITY',text:draft,source_witness:'ORIGINAL_BYTES',
      proof_status:'NO_CHANGE_ONLY',semantic_status:'NOT_ADJUDICATED',naturalness:'NOT_ADJUDICATED',delta:minimalChange(draft,draft)}];
  const seen=new Set([draft]),ids=new Set(['KEEP_ORIGINAL']);
  function append(id,text,channel,witness) {
    if(!validText(text))throw Error('INVALID_CANDIDATE_TEXT');
    if(ids.has(id))throw Error('DUPLICATE_CANDIDATE_ID');
    ids.add(id);
    if(seen.has(text))return;
    seen.add(text);
    candidates.push({id,channel,text,source_witness:witness,proof_status:channel==='KRC_SOURCE_WITNESS'?'LOCAL_EXACT_QUOTE_ONLY':'UNVERIFIED_PROPOSAL',
      semantic_status:'NOT_ADJUDICATED',naturalness:'NOT_ADJUDICATED',delta:minimalChange(draft,text)});
  }
  const alerts=[];
  for(const x of modelCandidates){
    if(!x || typeof x.id!=='string'||!/^MODEL_[A-Za-z0-9_-]{1,32}$/.test(x.id))throw Error('INVALID_MODEL_ID');
    // Candidate-supplied 'fidelity', 'human_verified', etc. are deliberately
    // ignored rather than being promoted to an independent reviewer verdict.
    append(x.id,x.text,'EXTERNAL_PROPOSAL_UNVERIFIED',null);
    if(Object.keys(x).some(k=>!['id','text'].includes(k)))alerts.push({type:'MODEL_SELF_ATTESTATION_IGNORED',id:x.id});
  }
  if(referenceInput!==null){
    if(typeof referenceInput!=='object'||referenceInput.text!==draft){
      alerts.push({type:'REFERENCE_SPAN_SOURCE_MISMATCH',explanation:'Exact source draft required; no edit created.'});
    }else if(contract.common.W.reference_policy==='KEEP'){
      alerts.push({type:'WRITER_REFERENCE_KEEP',explanation:'Author-level KEEP overrides local CLARIFY request.'});
    }else{
      const p=portfolio(referenceInput);
      if(p.status==='PLURAL_CANDIDATES'){
        append('KRC_EXPLICIT_REFERENCE',p.candidates[1].text,'KRC_SOURCE_WITNESS',p.candidates[1].evidence);
        alerts.push({type:'OVERT_REFERENCE_MAY_BE_REPETITIVE',explanation:'Source-licensed quote is not independently natural Korean.'});
      }else alerts.push({type:'NO_REFERENCE_REWRITE',reason:p.source_decision,disposition:p.status});
    }
  }
  const genreRisk={science:'UNMEASURED_CAUSALITY_OR_RATE',narrative:'OUTSIDE_AUTHOR_CREATIVE_LICENSE',argument:'UNSUPPORTED_EMPIRICAL_OR_POLICY_CLAIM'}[brief.genre];
  const allQuestions=contract.common.F.map(f=>({id:f.id,source_commitment:f.text,question:'이 사실이 왜곡·추가·누락되지 않았는가?',verdict:'NOT_ADJUDICATED'}));
  const unknownQuestions=contract.common.E.unknown.map((s,i)=>({id:'E_UNKNOWN_'+(i+1),unknown:s,question:'미확인이 사실로 승격되지 않았는가?',verdict:'NOT_ADJUDICATED'}));
  const candidateIds=candidates.map(c=>c.id);
  let selected=null;
  if(selection!==null){
    if(selection.acknowledge!=='EXPLICIT_AUTHOR_CHOICE'||!candidateIds.includes(selection.id))throw Error('INVALID_EXPLICIT_SELECTION');
    selected={candidate_id:selection.id,text:candidates.find(c=>c.id===selection.id).text,
      selection_provenance:'CALLER_DECLARATION_NOT_AUTHENTICATED',fact_correctness:'NOT_ADJUDICATED',
      note:'Selection is not an automated KSGT correctness, preference or author-identity verdict.'};
  }
  return {
    schema:'ksgt.g9p53.writer-review.v0.2',mode:'LOCAL_WRITER_INSPECTION_NO_AUTO_REWRITE',brief_id:contract.id,
    source_sha256:contract.common_sha256,draft_sha256:hash(draft),author_goal:contract.common.W,
    license:contract.common.L,epistemic:contract.common.E,
    candidates,alerts,review_questions:{facts:allQuestions,unknowns:unknownQuestions,
      license_question:'추가 표현이 L의 허용 범위 안에 있고 F/E와 충돌하지 않는가?',
      genre_risk:genreRisk,meaning_preservation:'UNADJUDICATED',
      true_writer_revision_burden:'NOT_COLLECTED'},
    selected,independent_writer_quality:'NOT_MEASURED',model_comparison:'NOT_PERFORMED',
    privacy:'OFFLINE_ONLY_NO_TELEMETRY; explicit CLI --out/--selected-out writes local data'
  };
}
module.exports={review,minimalChange};
