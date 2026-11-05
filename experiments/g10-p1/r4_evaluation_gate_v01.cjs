"use strict";
/** R4: evidence gate for source-work clustered blind reader evaluations.
 * This code never assigns semantic truth or reader preference by itself.
 */
const crypto=require("node:crypto");
const ARMS=Object.freeze(["STRONG_DIRECT","EXPLICIT_EDGE_PROMPT","GRAPH_PLAN"]);
function validateManifest(m){
 if(m?.schema!=="ksgt.g10.p1.r4.manifest.v01"||!Array.isArray(m.works)||!m.works.length)
  throw Error("INVALID_MANIFEST");
 const ids=new Set();
 for(const w of m.works){
  if(typeof w.id!=="string"||!w.id.trim()||ids.has(w.id)||
   typeof w.eligibleForOrderChange!=="boolean"||
   !["DEVELOPMENT","FROZEN_EXTERNAL"].includes(w.provenance))throw Error("INVALID_WORK");
  ids.add(w.id);
 }
 if(m.works.some(w=>w.provenance==="FROZEN_EXTERNAL")&&m.sourceDisjointVerified!==true)
  throw Error("EXTERNAL_DISJOINT_NOT_VERIFIED");
 return m;
}
function preflight(m){
 validateManifest(m);
 const eligible=m.works.filter(w=>w.eligibleForOrderChange);
 const n=m.works.length;
 return {schema:"ksgt.g10.p1.r4.preflight.v01",sourceWorks:n,
   eligibleWorks:eligible.length,nonInterventionWorks:n-eligible.length,
   eligibilityFraction:eligible.length/n,
   sourceWorkUnitsNotOutputUnits:true,sourceDisjointVerified:m.sourceDisjointVerified===true,
   provenanceKinds:[...new Set(m.works.map(w=>w.provenance))].sort(),
   providerGenerationsObserved:0,independentReaderObservations:0,
   evidence:"DESIGN_COVERAGE_ONLY_NOT_TREATMENT_EFFECT"};
}
function validateBallots(manifest,ballots){
 validateManifest(manifest);
 if(!Array.isArray(ballots))throw Error("INVALID_BALLOTS");
 const workMap=new Map(manifest.works.map(w=>[w.id,w]));
 const seen=new Set();
 for(const b of ballots){
  if(!b||typeof b.readerId!=="string"||!b.readerId.trim()||
   !workMap.has(b.workId)||!ARMS.includes(b.left)||!ARMS.includes(b.right)||
   b.left===b.right||!["LEFT","RIGHT","TIE"].includes(b.choice)||
   b.blinded!==true||b.independentReader!==true)throw Error("UNQUALIFIED_BALLOT");
  const pair=[b.left,b.right].sort().join("|");
  const key=crypto.createHash("sha256").update(JSON.stringify([b.readerId,b.workId,pair])).digest("hex");
  if(seen.has(key))throw Error("DUPLICATE_READER_SOURCE_PAIR");
  seen.add(key);
 }
 return true;
}
function summarize(manifest,ballots){
 validateBallots(manifest,ballots);
 const workMap=new Map(manifest.works.map(w=>[w.id,w]));
 const byWork=new Map();
 for(const b of ballots){
  const key=b.workId;
  if(!byWork.has(key))byWork.set(key,{workId:key,eligibleForOrderChange:workMap.get(key).eligibleForOrderChange,ratings:0,ties:0,graphWins:0,graphLosses:0});
  const row=byWork.get(key);row.ratings++;
  if(b.choice==="TIE")row.ties++;
  if([b.left,b.right].includes("GRAPH_PLAN")&&b.choice!=="TIE"){
   const winner=b.choice==="LEFT"?b.left:b.right;
   if(winner==="GRAPH_PLAN")row.graphWins++;else row.graphLosses++;
  }
 }
 return {schema:"ksgt.g10.p1.r4.descriptive-reader-ledger.v01",ballots:ballots.length,
  ratedSourceWorks:byWork.size,sourceWorksInManifest:manifest.works.length,
  workClusters:[...byWork.values()].sort((a,b)=>a.workId.localeCompare(b.workId)),
  causalEffectIdentified:false,semanticFidelityAdjudicated:false,
  warning:"DESCRIPTIVE_ONLY_NO_PSEUDOREPLICATION_OR_UNRATED_QUALITY_CLAIMS"};
}
module.exports={ARMS,validateManifest,preflight,validateBallots,summarize};
