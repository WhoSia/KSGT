"use strict";
/** Real prose pairwise blind export, completely separate private mapping.
 * One pair per source-work × model: role-aware v05 vs its char-matched rich rival.
 * Never score a pair or treat an anonymous model-generated judgment as human gold.
 */
const fs=require("node:fs"),crypto=require("node:crypto");
const A="ROLE_AWARE_PLAN_V05",B="RICH_CHAR_MATCH_V05";
function build(report,randomInt=crypto.randomInt){
 if(!report||report.schema!=="ksgt.g10.p1.crossed-model-architecture.v02"||
  report.status!=="MODEL_REQUESTS_ATTEMPTED")throw Error("ACTUAL_V05_REPORT_REQUIRED");
 if(!Array.isArray(report.rows)||!report.rows.length)throw Error("ROWS_REQUIRED");
 const grouped=new Map();
 for(const r of report.rows){
  const k=r.sourceWork+"::"+r.model;let arr=grouped.get(k)||[];arr.push(r);grouped.set(k,arr);
 }
 const packet=[],privateKeys=[];
 for(const [group,rows] of grouped){
  const choose=(arm)=>rows.filter(x=>x.arm===arm);
  if(choose(A).length!==1||choose(B).length!==1)throw Error("MISSING_OR_REPEATED_PAIR_ARM");
  const x=choose(A)[0],y=choose(B)[0];
  for(const row of [x,y]){
   if(row.outcome!=="GENERATED"||typeof row.text!=="string"||!row.text.trim())throw Error("ONLY_REAL_COMPLETE_TEXTS");
  }
  if(x.sourceTask!==y.sourceTask||x.sourceWork!==y.sourceWork)throw Error("SOURCE_PAIR_MISMATCH");
  const left=randomInt(2)===0?x:y,right=left===x?y:x;
  const blindId="PAIR_"+crypto.randomBytes(12).toString("hex");
  packet.push({blindId,sourceTask:x.sourceTask,sourceWork:x.sourceWork,
   instruction:"동일한 글쓰기 과제의 두 한국어 문단 중 더 읽기 좋은 글을 선택하거나 동률을 표시하세요. 원천 충실도는 별도 평가자가 확인합니다.",
   A:left.text,B:right.text,readerChoice:null,readerId:null});
  privateKeys.push({blindId,sourceTask:x.sourceTask,sourceWork:x.sourceWork,model:x.model,
   A_arm:left.arm,B_arm:right.arm,
   A_sha256:crypto.createHash("sha256").update(left.text).digest("hex"),
   B_sha256:crypto.createHash("sha256").update(right.text).digest("hex")});
 }
 return {publicPacket:{schema:"ksgt.g10.p1.blind-pair-v01",status:"UNRATED_REAL_OUTPUTS",pairs:packet},
  privateKey:{schema:"ksgt.g10.p1.blind-pair-mapping-v01",pairs:privateKeys},
  limitation:"Reader independence, valid source rights and preferences must be established externally."};
}
function main(){
 const a=process.argv.slice(2);
 if(a.length!==6||a[0]!=="--input"||a[2]!=="--packet"||a[4]!=="--key")throw Error("USAGE --input FILE --packet FILE --key FILE");
 const [inp,out,key]=[a[1],a[3],a[5]];
 if(new Set([inp,out,key]).size!==3)throw Error("DISTINCT_OUTPUT_REQUIRED");
 const r=build(JSON.parse(fs.readFileSync(inp,"utf8")));
 fs.writeFileSync(out,JSON.stringify(r.publicPacket,null,2)+"\n",{flag:"wx",mode:0o600});
 fs.writeFileSync(key,JSON.stringify(r.privateKey,null,2)+"\n",{flag:"wx",mode:0o600});
 process.stdout.write(JSON.stringify({pairs:r.publicPacket.pairs.length,packet:out,key})+"\n");
}
if(require.main===module)try{main()}catch(e){console.error(e.message);process.exitCode=1}
module.exports={build};
