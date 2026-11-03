"use strict";
/** Evidence-bound summary of independent masked Korean reader ratings.
 * Computes nothing when genuine blinded observations are absent.
 * Reviewer attestation is a declaration, NOT cryptographic proof of independence.
 */
const fs=require("node:fs");
const crypto=require("node:crypto");
const ARMS=["DIRECT","RICH_PROMPT","DISCOURSE_GUIDED","LICENSED_PLAN_V02"];
function analyze(packet,key,ratings){
 if(packet?.schema!=="ksgt.g10.p1.blind-packet.v01"||packet.status!=="UNRATED_REAL_OUTPUTS")
  throw Error("REAL_BLINDED_PACKET_REQUIRED");
 if(key?.schema!=="ksgt.g10.p1.private-blind-key.v01")throw Error("PRIVATE_MAPPING_REQUIRED");
 if(ratings?.schema!=="ksgt.g10.p1.independent-reader-ratings.v01"||
    !Array.isArray(ratings.rows))throw Error("RATINGS_SCHEMA_REQUIRED");
 const lookup=new Map(key.rows.map(r=>[r.blindId,r]));
 if(lookup.size!==packet.rows.length||lookup.size!==key.rows.length)throw Error("PACKET_MAPPING_COUNT_MISMATCH");
 const seen=new Set(),pool=new Map(),raters=new Map();
 for(const row of ratings.rows){
  if(!row||!lookup.has(row.blindId))throw Error("UNKNOWN_BLIND_ID");
  if(typeof row.reviewerId!=="string"||!row.reviewerId.trim()||
     row.independenceAttested!==true||!row.protocolId)throw Error("REVIEWER_ATTESTATION_AND_PROTOCOL_REQUIRED");
  if(!Number.isInteger(row.preference)||row.preference<1||row.preference>5)throw Error("INVALID_PREFERENCE");
  if(!Number.isInteger(row.coherence)||row.coherence<1||row.coherence>5)throw Error("INVALID_COHERENCE");
  const id=row.blindId+"::"+row.reviewerId;
  if(seen.has(id))throw Error("DUPLICATE_REVIEW");seen.add(id);
  const entry=lookup.get(row.blindId);
  const metric=pool.get(entry.blindId)||{...entry,n:0,preference:0,coherence:0};
  metric.n++;metric.preference+=row.preference;metric.coherence+=row.coherence;pool.set(entry.blindId,metric);
  const profile=raters.get(row.reviewerId)||new Set();profile.add(entry.sourceWork);raters.set(row.reviewerId,profile);
 }
 if(!ratings.rows.length)throw Error("NO_REAL_INDEPENDENT_RATINGS");
 for(const r of key.rows)if(!pool.has(r.blindId))throw Error("INCOMPLETE_BLIND_PACKET");
 const works=new Map();
 for(const m of pool.values()){
  const work=works.get(m.sourceWork)||{sourceWork:m.sourceWork,arms:[],taskIds:new Set()};
  work.arms.push({arm:m.arm,taskId:m.sourceTask,meanPreference:m.preference/m.n,meanCoherence:m.coherence/m.n,raters:m.n});
  work.taskIds.add(m.sourceTask);works.set(m.sourceWork,work);
 }
 const records=[...works.values()].map(w=>({sourceWork:w.sourceWork,taskCount:w.taskIds.size,arms:w.arms}));
 return {schema:"ksgt.g10.p1.source-cluster-reader-summary.v01",
   status:"SELF_ATTESTED_HUMAN_READER_DATA_NOT_INDEPENDENTLY_VERIFIED",
   sourceWorkCount:records.length,uniqueReviewerCount:raters.size,assessmentCount:ratings.rows.length,
   records,warning:"Ratings and independence attestation must be externally authenticated before scientific publication."};
}
function main(){
 const a=process.argv.slice(2);
 if(a.length!==8||a[0]!=="--packet"||a[2]!=="--key"||a[4]!=="--ratings"||a[6]!=="--output")
  throw Error("USAGE_--packet_X_--key_Y_--ratings_Z_--output_W");
 const [p,k,r,o]=[a[1],a[3],a[5],a[7]];
 const result=analyze(...[p,k,r].map(path=>JSON.parse(fs.readFileSync(path,"utf8"))));
 fs.writeFileSync(o,JSON.stringify(result,null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write(JSON.stringify({sourceWorks:result.sourceWorkCount,reviewers:result.uniqueReviewerCount,output:o})+"\n");
}
if(require.main===module)try{main()}catch(e){console.error(e.message);process.exitCode=1}
module.exports={analyze};
