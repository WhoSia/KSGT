"use strict";
/** Build an anonymized native-reader packet and a separate private mapping.
 * Intended only for REAL outputs, never model mocks or DRY_RUN.
 * No labels/predictions/judgments are manufactured by this file.
 */
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const {ARMS}=require("./paired_runner_v02.cjs");
function shuffle(items,randomInt=crypto.randomInt){
 const v=[...items];for(let i=v.length-1;i>0;i--){const j=randomInt(i+1);[v[i],v[j]]=[v[j],v[i]];}return v;
}
function packet(result,randomInt=crypto.randomInt){
 if(result?.schema!=="ksgt.g10.p1.paired-generation.v02"||result.status!=="MODEL_REQUESTS_ATTEMPTED")
  throw Error("ACTUAL_GENERATION_REPORT_REQUIRED");
 if(!Array.isArray(result.rows)||!result.rows.length)throw Error("ROWS_REQUIRED");
 const tasks=[...new Set(result.rows.map(r=>r.taskId))];
 const publicRows=[],mapping=[];
 for(const taskId of tasks){
  const rows=result.rows.filter(r=>r.taskId===taskId);
  if(rows.length!==ARMS.length||new Set(rows.map(r=>r.arm)).size!==ARMS.length)throw Error("MISSING_ARM_OR_DUPLICATE");
  if(rows.some(r=>r.outcome!=="GENERATED"||typeof r.text!=="string"||!r.text.trim()))
    throw Error("CANNOT_BLIND_FAILED_OR_EMPTY_GENERATIONS");
  const work=new Set(rows.map(r=>r.sourceWork));if(work.size!==1)throw Error("SOURCE_WORK_SPLIT");
  const order=shuffle(rows,randomInt);
  for(let i=0;i<order.length;i++){
   const row=order[i],blindId=taskId+"-C"+(i+1);
   publicRows.push({sourceTask:taskId,blindId,text:row.text,independentReaderRating:null,
    coherenceRating:null,registerRating:null,meaningReview:null});
   mapping.push({sourceTask:taskId,sourceWork:row.sourceWork,blindId,arm:row.arm,
    outputSha256:crypto.createHash("sha256").update(row.text).digest("hex")});
  }
 }
 return {publicPacket:{schema:"ksgt.g10.p1.blind-packet.v01",status:"UNRATED_REAL_OUTPUTS",rows:publicRows},
  privateMapping:{schema:"ksgt.g10.p1.private-blind-key.v01",rows:mapping}};
}
function main(){
 const args=process.argv.slice(2);
 if(args.length!==6||args[0]!=="--input"||args[2]!=="--packet"||args[4]!=="--key")throw Error("USAGE_--input_X_--packet_Y_--key_Z");
 const [input,packetPath,keyPath]=[args[1],args[3],args[5]].map(x=>path.resolve(x));
 if(packetPath===keyPath||input===packetPath||input===keyPath)throw Error("OUTPUT_PATHS_MUST_BE_DISTINCT");
 const source=JSON.parse(fs.readFileSync(input,"utf8")),out=packet(source);
 // Reject overwrites, make permissions restrictive. User keeps both private.
 fs.writeFileSync(packetPath,JSON.stringify(out.publicPacket,null,2)+"\n",{flag:"wx",mode:0o600});
 fs.writeFileSync(keyPath,JSON.stringify(out.privateMapping,null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write(JSON.stringify({packetPath,keyPath,items:out.publicPacket.rows.length})+"\n");
}
if(require.main===module){try{main()}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={packet,shuffle};
