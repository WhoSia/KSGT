"use strict";
const crypto = require("node:crypto");
function parseCsv(s) {
 if(typeof s!=="string")throw Error("CSV_NOT_TEXT");
 const rows=[];let row=[],f="",quoted=false;
 s=s.replace(/^\uFEFF/,"");
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(quoted){if(c==='"'&&s[i+1]==='"'){f+='"';i++;}else if(c==='"'){quoted=false;}else{f+=c;}}
  else if(c==='"'){if(f)throw Error("UNEXPECTED_QUOTE");quoted=true;}
  else if(c===","){row.push(f);f="";}
  else if(c==="\n"){row.push(f.replace(/\r$/,""));rows.push(row);row=[];f="";}
  else{f+=c;}
 }
 if(quoted)throw Error("UNTERMINATED_QUOTE");
 if(f||row.length){row.push(f.replace(/\r$/,""));rows.push(row);}
 return rows;
}
const COLUMNS=["challenge_id","row_index0","m2_block_1based","row_sha256","risk_stratum","hidden_annotator","source","visible_ref","candidate"];
function audit(csv) {
 const [header,...data]=parseCsv(csv);
 if(!header || JSON.stringify(header)!==JSON.stringify(COLUMNS))throw Error("CSV_HEADER_SCHEMA_MISMATCH");
 const seen=new Set(),hashes=new Set(),risk={};let sourceKept=0,refNoop=0,matchVisible=0;
 for(const [i,row] of data.entries()){
  if(row.length!==COLUMNS.length)throw Error("CSV_FIELD_COUNT_"+(i+2));
  const obj=Object.fromEntries(COLUMNS.map((k,j)=>[k,row[j]]));
  if(!/^R2ay-\d{3}$/.test(obj.challenge_id))throw Error("CHALLENGE_ID_FORMAT");
  if(seen.has(obj.challenge_id))throw Error("CHALLENGE_DUPLICATE");
  seen.add(obj.challenge_id);
  if(!/^[a-f0-9]{64}$/.test(obj.row_sha256))throw Error("SOURCE_SHA_FORMAT");
  if(hashes.has(obj.row_sha256))throw Error("SOURCE_ROW_HASH_DUPLICATE");
  hashes.add(obj.row_sha256);
  if(!obj.source||!obj.visible_ref||!obj.candidate)throw Error("EMPTY_TEXT");
  if(obj.candidate===obj.source)sourceKept++;
  if(obj.visible_ref===obj.source)refNoop++;
  if(obj.candidate===obj.visible_ref)matchVisible++;
  risk[obj.risk_stratum]=(risk[obj.risk_stratum]||0)+1;
 }
 return {
  scope:"HISTORIC_ANNOTATOR_PACKETS_NOT_INDEPENDENT_HUMAN_PREFERENCE",
  sourceArtifactRole:"DRIVE_TEXT_CSV_METADATA_PARSED_NOT_RAW_BYTES_REPLAY",
  rows:data.length,distinctChallengeIds:seen.size,distinctRowHashes:hashes.size,
  candidateIdenticalToSource:sourceKept,visibleHumanCorrectionIdenticalToSource:refNoop,
  candidateIdenticalToVisibleReference:matchVisible,riskStrata:risk,
  sourceWorkIndependentN:"UNKNOWN_NOT_72",
  claims:{semanticGold:false,nativeReaderPreference:false,modelComparisonWin:false},
  fingerprintSha256:crypto.createHash("sha256").update(JSON.stringify({count:data.length,sourceKept,refNoop,matchVisible,risk})).digest("hex")
 };
}
if(require.main===module) {
 try{
  const p=process.argv[2];if(!p)throw Error("USAGE_CSV_PATH_REQUIRED");
  const result=audit(require("node:fs").readFileSync(p,"utf8"));
  process.stdout.write(JSON.stringify(result,null,2)+"\n");
 }catch(e){console.error("R9_PRIVATE_CSV_AUDIT_FAIL:"+e.message);process.exitCode=1;}
}
module.exports={parseCsv,audit,COLUMNS};
