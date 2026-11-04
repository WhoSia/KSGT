"use strict";
/** Paired preference summary, strictly descriptive on exposed development works.
 * Requires actual independently collected votes; NO votes are generated here.
 */
const fs=require("node:fs");
function summarize(key,ratings){
 if(key?.schema!=="ksgt.g10.p1.blind-pair-mapping-v01"||
   !Array.isArray(key.pairs)||!key.pairs.length)throw Error("PRIVATE_KEY_REQUIRED");
 if(ratings?.schema!=="ksgt.g10.p1.native-reader-votes.v01"||
   !Array.isArray(ratings.votes)||!ratings.votes.length)throw Error("REAL_READER_VOTES_REQUIRED");
 const map=new Map(key.pairs.map(p=>[p.blindId,p]));
 if(map.size!==key.pairs.length)throw Error("DUPLICATE_KEY_ID");
 const seen=new Set(),buckets=new Map(),raters=new Set();
 for(const v of ratings.votes){
  const k=map.get(v.blindId);
  if(!k)throw Error("UNKNOWN_PAIR");
  if(!["A","B","TIE"].includes(v.choice))throw Error("INVALID_VOTE");
  if(typeof v.readerId!=="string"||!/^[A-Za-z0-9_-]{3,64}$/.test(v.readerId))
    throw Error("ANONYMOUS_READER_ID_REQUIRED");
  if(v.independentHumanReader!==true)throw Error("HUMAN_READER_ATTESTATION_REQUIRED");
  const id=v.blindId+":"+v.readerId;
  if(seen.has(id))throw Error("DUPLICATE_VOTE");seen.add(id);raters.add(v.readerId);
  const winArm=v.choice==="TIE"?null:(v.choice==="A"?k.A_arm:k.B_arm);
  const value=v.choice==="TIE"?0.5:winArm==="ROLE_AWARE_PLAN_V05"?1:0;
  const arr=buckets.get(v.blindId)||[];arr.push(value);buckets.set(v.blindId,arr);
 }
 if(key.pairs.some(p=>!buckets.has(p.blindId)))throw Error("INCOMPLETE_PAIR_COVERAGE");
 const byModel=new Map(),bySource=new Map();
 for(const p of key.pairs){
  const votes=buckets.get(p.blindId),mean=votes.reduce((a,b)=>a+b,0)/votes.length;
  const m=byModel.get(p.model)||[];m.push({sourceWork:p.sourceWork,mean,raters:votes.length});
  byModel.set(p.model,m);
  const s=bySource.get(p.sourceWork)||[];s.push(mean);bySource.set(p.sourceWork,s);
 }
 const modelSummaries=[...byModel.entries()].map(([model,groups])=>({
  model,sourceWorks:groups.length,descriptiveMeanKsgtPreference:groups.reduce((s,x)=>s+x.mean,0)/groups.length
 }));
 return {schema:"ksgt.g10.p1.descriptive-native-reader-results.v01",
  status:"SELF_ATTESTED_DEV_READER_RESPONSES_DESCRIPTIVE_ONLY_NOT_CONFIRMATORY",
  uniqueAnonymousReaders:raters.size,sourceWorkClusters:bySource.size,
  pairCount:key.pairs.length,modelSummaries,
  scientificLimit:"Existing development works repeatedly used for model prompt iteration; no independent reader identity audit, no source-disjoint confirmatory set, no population p-value or CI."};
}
function main(){
 const a=process.argv.slice(2);
 if(a.length!==6||a[0]!=="--key"||a[2]!=="--votes"||a[4]!=="--output")throw Error("USAGE --key FILE --votes FILE --output FILE");
 const load=p=>JSON.parse(fs.readFileSync(p,"utf8"));
 fs.writeFileSync(a[5],JSON.stringify(summarize(load(a[1]),load(a[3])),null,2)+"\n",{flag:"wx",mode:0o600});
}
if(require.main===module)try{main()}catch(e){console.error(e.message);process.exitCode=1}
module.exports={summarize};
