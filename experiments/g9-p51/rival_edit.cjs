"use strict";
// P51 corpus-free deterministic S7-inspired edit instrument; S5 is downstream governance.
const fs = require("node:fs");
const crypto = require("node:crypto");
const p = require("../rival_edit_preseal.json");
const sha = x => crypto.createHash("sha256").update(x).digest("hex");
const same = (a,b) => JSON.stringify(a)===JSON.stringify(b);
const LANES = ["KOLLA_K1_HARD_CARGO","KOLLA_K2_GENERIC","STYLEKQC_GENERIC"];
const TASK = {KOLLA_K1_HARD_CARGO:"minimal Korean correction",KOLLA_K2_GENERIC:"minimal Korean correction",STYLEKQC_GENERIC:"meaning-preserving Korean paraphrase"};
const ITEM_ID=/^P50-(KOLLA_K1_HARD_CARGO|KOLLA_K2_GENERIC|STYLEKQC_GENERIC)-0[1-8]$/;
function assertPreseal(x=p) {
  if(x.schema!=="ksgt.g9.p51.rival-edit-attempt-preseal.v1" ||
     x.candidate_budget.attempts!==4 ||
     !same(x.candidate_budget.indices,[0,1,2,3]) ||
     !same(x.candidate_budget.seeds,[5101,5102,5103,5104]) ||
     x.frozen_transform_map.orthography.length!==6 ||
     x.frozen_transform_map.spacing.length!==4 ||
     x.frozen_transform_map.connective.length!==3 ||
     x.frozen_transform_map.degree.length!==2 ||
     x.frozen_transform_map.adverb.length!==2) throw Error("PRESEAL_MISMATCH");
  for(const lane of LANES) if(x.task_routing[lane]!==TASK[lane])throw Error("TASK_MAPPING_DRIFT");
}
function singlePass(src,pairs) {
  const ordered=[...pairs].sort((a,b)=>b[0].length-a[0].length);
  const map=new Map(ordered);
  const special="\\^$.*+?()[]{}|";
  const escaped=ordered.map(([s])=>Array.from(s).map(c=>special.includes(c)?"\\"+c:c).join(""));
  const rx=new RegExp(escaped.join("|"),"gu");
  return src.replace(rx,matched=>map.get(matched));
}
function punctuation(src) {
  return /[.!?。！？]$/u.test(src.trimEnd())?src:src+".";
}
function applyRecipe(source,lane,i,x=p) {
  assertPreseal(x);
  if(typeof source!=="string"||!LANES.includes(lane)||![0,1,2,3].includes(i))throw Error("INVALID_INPUT");
  const m=x.frozen_transform_map;
  if(lane==="STYLEKQC_GENERIC") {
    if(i===0)return singlePass(source,m.connective);
    if(i===1)return singlePass(source,[...m.connective,...m.degree]);
    if(i===2)return singlePass(source,[...m.adverb,...m.degree]);
    return singlePass(source,[...m.connective,...m.adverb,...m.degree]);
  }
  const base=singlePass(source,m.orthography);
  if(i===0)return base;
  const spaced=i===1||i===3?singlePass(base,m.spacing):base;
  return i===2||i===3?punctuation(spaced):spaced;
}
function countLiteral(s,t) {
  if(!t)return 0;
  let n=0,pos=0;
  while((pos=s.indexOf(t,pos))>=0){n++;pos+=t.length;}
  return n;
}
function cargoLoss(source,out,protectedTokens) {
  if(!Array.isArray(protectedTokens))throw Error("PROTECTED_LIST_MISSING");
  const misses=[];
  const unique=new Map();
  for(const a of protectedTokens) {
    if(!Array.isArray(a)||a.length!==2||!["URL","EMAIL","NUMBER","ASCII_TOKEN"].includes(a[0])||typeof a[1]!=="string") throw Error("PROTECTED_TOKEN_INVALID");
    unique.set(JSON.stringify(a),a);
  }
  for(const [kind,token] of unique.values()) {
    const original=countLiteral(source,token),after=countLiteral(out,token);
    if(after<original)misses.push({kind,token_sha256:sha(token),missing:original-after});
  }
  return misses;
}
function emitCandidateSet(row,x=p) {
  assertPreseal(x);
  if(!row || !LANES.includes(row.lane) || typeof row.source!=="string" || !row.source.length ||
     !ITEM_ID.test(row.item_id) ||
     !row.item_id.startsWith("P50-"+row.lane+"-") ||
     row.task!==TASK[row.lane] || sha(row.source)!==row.source_sha256) throw Error("SOURCE_PACKET_INTEGRITY_OR_ROLE_FAILED");
  const outputs=[];
  for(let i=0;i<4;i++) {
    const candidate=applyRecipe(row.source,row.lane,i,x);
    const lost=cargoLoss(row.source,candidate,row.protected_tokens);
    outputs.push({index:i,seed:x.candidate_budget.seeds[i],candidate,
      candidate_sha256:sha(candidate),identity:candidate===row.source,
      cargo_loss:lost,operator:x.candidate_lanes[i][row.lane.startsWith("KOLLA")?"correction":"paraphrase"]});
  }
  return outputs;
}
function packetRun(packetBytes,x=p) {
  assertPreseal(x);
  if(sha(packetBytes)!==x.fixed_packet.exact_sha256)throw Error("SOURCE_PACKET_SHA_MISMATCH");
  const rows=packetBytes.toString("utf8").trimEnd().split("\n").map(a=>JSON.parse(a));
  if(rows.length!==24)throw Error("PACKET_24_ITEM_COUNT_MISMATCH");
  const counts={KOLLA_K1_HARD_CARGO:0,KOLLA_K2_GENERIC:0,STYLEKQC_GENERIC:0};
  const ids=new Set(),recs=[];
  for(const row of rows) {
    if(ids.has(row.item_id))throw Error("DUPLICATE_ITEM_ID");
    ids.add(row.item_id);
    if(!LANES.includes(row.lane))throw Error("BAD_LANE");
    counts[row.lane]++;
    const out=emitCandidateSet(row,x);
    recs.push({item_id:row.item_id,lane:row.lane,source_sha256:row.source_sha256,
      candidate_sha256:out.map(a=>a.candidate_sha256),
      candidate0_nonidentity:!out[0].identity,
      any_candidate_nonidentity:out.some(a=>!a.identity),
      candidate_count:out.length,
      distinct_candidate_count:new Set(out.map(a=>a.candidate_sha256)).size,
      cargo_lexical_loss_attempts:out.filter(a=>a.cargo_loss.length>0).map(a=>a.index),
      typed_status:out[0].identity?"CANDIDATE0_IDENTITY_TASK_NONRESPONSE_FLAG":"CANDIDATE0_NONIDENTITY_SEMANTICS_UNJUDGED"});
  }
  if(!same(counts,x.fixed_packet.composition))throw Error("STRATUM_COUNT_MISMATCH");
  recs.sort((a,b)=>a.item_id.localeCompare(b.item_id,"en"));
  const families={};
  for(const lane of LANES) {
    const xs=recs.filter(a=>a.lane===lane);
    families[lane]={n:xs.length,primary_nonidentity:xs.filter(a=>a.candidate0_nonidentity).length,
      any_nonidentity:xs.filter(a=>a.any_candidate_nonidentity).length,
      primary_identity:xs.filter(a=>!a.candidate0_nonidentity).length,
      protected_lexical_loss_attempts:xs.reduce((n,a)=>n+a.cargo_lexical_loss_attempts.length,0)};
  }
  const active=recs.filter(a=>a.candidate0_nonidentity).length;
  return {schema:"ksgt.g9.p51.rival-edit-mechanical-entry-receipt.v1",phase:"G9-P51",
    proposer:"RIVAL_EDIT_V0_SOURCE_CONDITIONED_ZERO_TRAINING",
    source_packet_sha256:sha(packetBytes),source_item_count:24,candidates_generated:96,
    candidate0_nonidentity:active,candidate0_identity:24-active,
    any_candidate_nonidentity:recs.filter(a=>a.any_candidate_nonidentity).length,
    candidate0_pia_maximum_possible_responsive_items:active,
    pia_threshold_required_acceptable_or_locally_repairable:18,
    numerical_entry_precondition:active>=18?"NOT_DISPROVEN_REQUIRES_HUMAN_ADJUDICATION":"FAIL_PRIMARY_TASK_RESPONSE_UPPER_BOUND",
    pia_adjudication:"NOT_PERFORMED",governor_u_vs_k:"BLOCKED_NO_PIA_PASS",
    families,no_raw_sources_candidates_or_hidden_refs_in_receipt:true,
    per_item_opaque_receipts:recs,
    authority:"MECHANICAL_TASK_RESPONSE_UPPER_BOUND_ONLY_NOT_SEMANTIC_QUALITY"};
}
if(require.main===module) {
  const file=process.argv[2],out=process.argv[3];
  if(!file||!out)throw Error("USAGE node rival_edit.cjs source_packet.jsonl summary.json");
  const result=packetRun(fs.readFileSync(file));
  fs.writeFileSync(out,JSON.stringify(result,null,2)+"\n",{encoding:"utf8",flag:"wx"});
  console.log(JSON.stringify({status:result.numerical_entry_precondition,
    n:result.source_item_count,candidate0_nonidentity:result.candidate0_nonidentity,
    families:result.families,receipt_sha256:sha(fs.readFileSync(out)),human_adjudication:"NOT_PERFORMED"}));
}
module.exports={sha,assertPreseal,singlePass,applyRecipe,cargoLoss,emitCandidateSet,packetRun};
