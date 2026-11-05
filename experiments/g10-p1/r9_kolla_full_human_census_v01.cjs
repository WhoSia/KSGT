"use strict";
/** Complete existing human-reference M2 census; excludes missing second references from pair denominator. */
const fs=require("node:fs"),crypto=require("node:crypto");
const {parseM2,replay}=require("./r9_kolla_m2_cold_replay_v01.cjs");
function census(m2){
 const blocks=parseM2(m2),c={blocks:blocks.length,bothAnnotated:0,missingSecond:0,firstOnlyKeeps:0,secondOnlyKeeps:0,bothKeep:0,bothEdit:0,bothEditSame:0,bothEditDifferent:0,pairExact:0,firstKeeps:0,secondKeeps:0};
 const missingFingerprints=new Map();
 for(const [idx,b] of blocks.entries()){
  if(!b.edits[0].length)throw Error("MISSING_FIRST_ANNOTATOR_"+idx);
  const a=replay(b,0),aKeep=a===b.source;c.firstKeeps+=aKeep;
  if(!b.edits[1].length){
   c.missingSecond++;
   const hash=crypto.createHash("sha256").update(b.source).digest("hex");
   const positions=missingFingerprints.get(hash)||[];positions.push(idx);missingFingerprints.set(hash,positions);
   continue;
  }
  c.bothAnnotated++;
  const h=replay(b,1),hKeep=h===b.source;c.secondKeeps+=hKeep;
  c.bothKeep+=(aKeep&&hKeep);
  c.firstOnlyKeeps+=(aKeep&&!hKeep);c.secondOnlyKeeps+=(!aKeep&&hKeep);
  c.bothEdit+=(!aKeep&&!hKeep);c.bothEditSame+=(!aKeep&&!hKeep&&a===h);c.bothEditDifferent+=(!aKeep&&!hKeep&&a!==h);
  c.pairExact+=(a===h);
 }
 if(c.bothKeep+c.firstOnlyKeeps+c.secondOnlyKeeps+c.bothEdit!==c.bothAnnotated)throw Error("PARTITION_INCONSISTENT");
 if(c.pairExact!==c.bothKeep+c.bothEditSame)throw Error("MATCH_COUNT_INCONSISTENT");
 return {schema:"ksgt.g10.p1.r9.3.kolla-human-reference-census.v01",originalM2SHA256:crypto.createHash("sha256").update(m2).digest("hex"),
 ...c,pairedExactRate:c.bothAnnotated?c.pairExact/c.bothAnnotated:null,
 missingSecondDistinctSourceSHA:missingFingerprints.size,
 missingSecondRepeatedFingerprintCounts:[...missingFingerprints.values()].map(x=>x.length).sort((a,b)=>b-a),
 missingSecondPositions:[...missingFingerprints.values()].flat().sort((a,b)=>a-b),
 distinction:"REAL_HUMAN_REFERENCE_PAIRS_ONLY_NO_KSGT_CANDIDATES_IN_THIS_CENSUS",
 essayGroupReconstruction:"UNIDENTIFIED_NOT_IN_M2",newModelOutputs:0,newHumanRatings:0};
}
if(require.main===module){try{const p=process.argv[2];if(!p)throw Error("USAGE_M2_FILE");console.log(JSON.stringify(census(fs.readFileSync(p,"utf8")),null,2));}catch(e){console.error("R9_CENSUS_FAILED:"+e.message);process.exitCode=1;}}
module.exports={census};
