"use strict";
/* G9-P60: verified original P53 output-hash metadata; no raw prose or new human labels.
   This registry was transcribed from three SHA-checked P53 ZIP source packages.
   Re-read original archives for an independent byte-for-byte audit. */
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const provisional=require("./provisional_edits_v01.json");
const HEX=/^[a-f0-9]{64}$/;
const arch={
 "4B":"e103185725bbc328dbb13ad90fafa83d9cc4089c8829ad1a78e211045e047d46",
 "8B":"57a7af352b9328f1ad5682e7fae3a893b5ef2948bfcc01e41437558ed0348951",
 "14B":"aad15005ad97ec5b9211798d783efb49deca1646ab804ccc22f5e377d3a3ce72"
};
const source={
 SCI01:"3aed7c51f7640559955dbaf7a259a6a55431ef467a0222ef8de6ea85d56a8b4e",
 SCI02:"38d770f4f42936db4adeff0938113223931261d4d77883ebb0c260f8caef428f",
 NAR01:"741a5e12d41a75dc94eccdce766e23ca7ca544ea4136d7e5a69c8d2c2081f252",
 NAR02:"b0df9ba76fdd034282fafb0c18c374ad4c742ef817387ad89c04148ecacb12df"
};
const table=[
["14B","NAR01","B","9b8e8930e3271140027d180cc4fb0381c3a01aee680aa278bc57c6156d3b11b3","239024fc280bc8883d3c1cd9faa4043c435767a07fd56ebddc2bc97affb3d94e,366bdae1ab6dd6bf84d5980bc8d45297d18695c9a86368de0f7aa274861334a5"],
["14B","NAR02","B","a04cf20f01b18cf41929c1c32f60dd4a93d38b8364f14dc80bb8ceedf4f33e58","a04cf20f01b18cf41929c1c32f60dd4a93d38b8364f14dc80bb8ceedf4f33e58"],
["14B","SCI01","B","886f62fad6f00224945025c1053584c3f301efe32587e46a25b4d8531cc1fe6f","2916b03017767dd7d0c9b35dba1802f2ac27431248c5c4bf48e9dd9e8f026454,283925b1b8fe09fa2fcfa419d96ee2894fe2a82aab3a1bdc5bc41d89470ef581"],
["14B","SCI02","B","42f85ac40b0f3946887103a80c750e98abc1604a2c919f58e120d702343b64cf","23e778e99b62344b2e6e3a23797cdaf9e29d1b9beb3e6b0d51cdd9b001c2fd99,1727c6199143a84920badaba69c5b11066eb231fbacc6cb43db11f944f818488"],
["4B","EX09","B_CLEAN","db0a20d2f43c675f8181bd497738b5d1e157c26afabf1db0a168a5c471c63da1","6f45376a691e346849173fbe173efeee043626f6c0e9959dfe3067a9bd5d8f0d,5af1ed72410a0a2498e746f4d537c3185da4170e489a6d2fffadb7ae7d9da3b5"],
["4B","EX09","K_TYPED_PLAN","ec903a7fb499b7e53c16ddaa1491174e6651f8f2446af6460f268e0f06e712d2","a6edd668bdaa2f35cf38504b27177374d8eb0b95d13d45c92cc2503b40059596,4e71e802328b7796cad1a7d70823f4939fa25d416ba5956d95e48c31acc5d626"],
["4B","EX09","U_PLAIN_PLAN","df072781e85fb4835c72fc7ee6dc17b7ea3e9e7e5b3e58fa04aa0f3b89e57c6b","d858600cfdd0a9894319d768e3dad24e2515077bb90641ed95434e712a7098a1,1582f5b105df632c3e87deeb1b09c4e94ef6f51547efa0a8a155d91de3d0ae11"],
["4B","EX10","B_CLEAN","3b854bb290ad925bfac1f6f4dc9bcc73f31bc7d4b56c3d14a6dfb62cbeec1d18","67cd570a175ad4ce475f0a0976ef811cba9980a59a7ba1bfa9297a3138578ed9,ad0a143cb4e6d0516efb842410e451aefdeb6565b49c6ba949cd006b1ff55c30"],
["4B","EX10","K_TYPED_PLAN","911e2a1db70d86001ac7c4c85892cf685c79772f2f8d23657df0bff96c80bbd1","5e996d5a7e3fab466f8975f1cf5ccdd41c772b31deca66a4ab80c69c65b14ae2,558949ce3dc477829e37288bff276993ff4373b3858a296336fc493bcc993904"],
["4B","EX10","U_PLAIN_PLAN","5117666f4902e021d6d4bfe72065c6e3831ce881080a7419c2de1155a9f93642","8419868639a95d42366475d452102ad03aebdf77a1bc05b7cfdecd40db4d927d,7fcaa8dd83908cad419bc95b4399df777ce1493f6a55c27a8fb5bc57f970dacb"],
["8B","NAR02","B","9352b114bcfca5f83ea7c29b71fe5ff772ea17ace25e707bdff7bf3f4d6de76f","9352b114bcfca5f83ea7c29b71fe5ff772ea17ace25e707bdff7bf3f4d6de76f"],
["8B","SCI01","B","d1c0697033355687c13d35d803b9e309af3a9d74a27dd6e82f3c65bd579a00e6","9b847f85d3d2afce3384ec04d9c8023598dee47d9c7440610efc47ca13cf4539,b048ad36ed9139e7be8b6069d5da957199b2d0188516ecd9e3390d894ee5fcd2"]
];
const split={EX09:"pilot_train",EX10:"pilot_dev",SCI01:"pilot_train",SCI02:"reserved_reaudit",NAR01:"pilot_train",NAR02:"pilot_dev"};
const models=table.map(([model,brief,arm,outputHash,parts])=>({
 id:`P53:${model}:${brief}:${arm}`,model,brief,arm,outputHash,
 paragraphHashes:parts.split(","),sourceHash:source[brief]||null,archiveHash:arch[model],
 split:split[brief],exposure:"HISTORICAL_KNOWN",kind:"GENERATED_DRAFT_NOT_REVISION",
 semanticAdmissibility:"NOT_ADJUDICATED",humanPreference:"NOT_OBSERVED"
}));
function components(records=models){
 const parent=records.map((_,i)=>i), edges=[],by=new Map();
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i]}return i};
 records.forEach((r,i)=>{
  for(const [kind,key] of [["SAME_BRIEF",r.brief],["SAME_SOURCE_SHA",r.sourceHash],["SAME_OUTPUT_SHA",r.outputHash]]){
   if(!key)continue;const tag=kind+":"+key;
   if(by.has(tag)){const j=by.get(tag);parent[root(i)]=root(j);edges.push({a:records[j].id,b:r.id,kind});}
   else by.set(tag,i);
  }
 });
 const groups=new Map();
 records.forEach((r,i)=>{const key=root(i);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r)});
 const items=[...groups.values()].map(g=>{
  const briefs=[...new Set(g.map(r=>r.brief))],splits=[...new Set(g.map(r=>r.split))];
  if(briefs.length!==1||splits.length!==1)throw Error("SOURCE_SPLIT_CONTAMINATION");
  return {componentId:"P53_WORK:"+briefs[0],brief:briefs[0],split:splits[0],
   recordIds:g.map(r=>r.id),freshHoldout:false};
 }).sort((a,b)=>a.brief.localeCompare(b.brief));
 return {items,edges};
}
function ledger(records=models){
 const graph=components(records);const items=records.flatMap(r=>r.paragraphHashes.map((hash,i)=>({
  paragraphId:r.id+":P"+(i+1),baseDraftId:r.id,sourceWorkId:"P53_BRIEF:"+r.brief,
  sourceComponentId:"P53_WORK:"+r.brief,split:r.split,model:r.model,
  baseParagraphSha256:hash,sourceArchiveSha256:r.archiveHash,
  role:"ORIGINAL_GENERATED_PARAGRAPH_NOT_EDIT",revisionCandidateIds:provisional.candidates.filter(x=>x.baseDraftId===r.id&&x.baseParagraphSha256===hash&&x.componentId==="P53_WORK:"+r.brief).map(x=>x.candidateId),
  protectedFacts:"NOT_YET_MAPPED",writerIntent:"NOT_YET_MAPPED",
  revisionVerdict:"NOT_EVALUATED",nativeHumanPreference:"NOT_OBSERVED",
  humanEvidenceIds:[],historicalExposure:"PRIOR_P53_GENERATION"
 })));
 return {schema:"ksgt.g9.p60.paragraph-ledger.v1",stage:"G9-P60",
  sourceArchiveCount:3,records:items,connectedSourceWorks:graph.items,
  actualRevisions:0,provisionalEdits:provisional.candidateCount,humanPreferenceObservations:0,freshHoldout:false};
}
function audit(r=models){
 assert.equal(r.length,12);
 const graph=components(r),l=ledger(r);
 assert.equal(graph.items.length,6);assert.equal(l.records.length,22);
 assert.equal(new Set(r.map(x=>x.outputHash)).size,12);
 assert.equal(graph.items.filter(x=>x.split==="pilot_train").length,3);
 assert.equal(graph.items.filter(x=>x.split==="pilot_dev").length,2);
 assert.equal(graph.items.filter(x=>x.split==="reserved_reaudit").length,1);
 assert.ok(graph.edges.filter(x=>x.kind==="SAME_SOURCE_SHA").length>=2);
 for(const x of r){
  assert.ok([x.outputHash,x.archiveHash,...x.paragraphHashes].every(s=>HEX.test(s)));
  assert.equal(x.kind,"GENERATED_DRAFT_NOT_REVISION");
  assert.equal(x.semanticAdmissibility,"NOT_ADJUDICATED");assert.equal(x.humanPreference,"NOT_OBSERVED");
 }
 assert.equal(provisional.candidates.length,2);
 assert.equal(l.records.filter(x=>x.revisionCandidateIds.length>0).length,1);
 assert.equal(l.records.reduce((n,x)=>n+x.revisionCandidateIds.length,0),2);
 for(const x of provisional.candidates){
  assert.ok(HEX.test(x.revisionParagraphSha256));
  assert.equal(x.sourceLicenseAndMeaning,"NOT_ADJUDICATED");
  assert.equal(x.humanPreference,"NOT_OBSERVED");
  assert.equal(x.epistemicPreservation,"HOLD");
 }
 assert.ok(provisional.candidates.some(x=>x.protectedFactCountChangedRelativeToDraft===true));
 return {stage:"G9-P60",test:"PASS",outputs:r.length,paragraphs:l.records.length,
  components:graph.items.length,sourceSplitCounts:{pilot_train:3,pilot_dev:2,reserved_reaudit:1},
  exactOutputDuplicateCount:0,actualRevisions:0,provisionalEdits:2,humanPreferenceObservations:0};
}
function validateCandidate(c,base){
 if(!base||c.baseParagraphSha256!==base.baseParagraphSha256 ||
    c.sourceComponentId!==base.sourceComponentId)throw Error("UNMATCHED_REVISION_SOURCE");
 if(!c.targetedDefect||!c.writerIntent||!Array.isArray(c.protectedFacts)||!c.protectedFacts.length)
  throw Error("MISSING_WRITER_CONTRACT");
 if(!HEX.test(c.revisionParagraphSha256))throw Error("INVALID_REVISION_SHA");
 if(c.semanticAdmissibility==="PASS"&&!c.independentSemanticEvidenceId)
  throw Error("UNWITNESSED_SEMANTIC_PASS");
 if(c.nativeHumanPreference!=="NOT_OBSERVED"&&!c.independentHumanEvidenceId)
  throw Error("UNWITNESSED_HUMAN_PREFERENCE");
 return {status:"STRUCTURAL_LEDGER_PASS_SEMANTICS_NOT_AUTOMATICALLY_PROVEN"};
}
function contrast(){
 const rows=[];
 for(const count of [4,5])for(const polished of [false,true]){
  const text=polished?`과학 동아리 학생 12명 중 ${count}명이 장치를 소개했다. 발표는 계속됐다.`:
    `과학 동아리 학생 12명 중 ${count}명은 장치를 소개했다. 그래서 따라서 발표가 계속됐다.`;
  rows.push({id:count+":"+Number(polished),text,
   typedFactPreservation:count===4,surfaceRepetitionAbsent:polished,
   humanNaturalness:"NOT_OBSERVED",source:"AUTHOR_SYNTHETIC_CONTROL"});
 }
 return rows;
}
function tests(){
 const o=audit(),g=components(),l=ledger();
 const original=l.records[0];
 const c={baseParagraphSha256:original.baseParagraphSha256,sourceComponentId:original.sourceComponentId,
  revisionParagraphSha256:crypto.createHash("sha256").update("fabricated-revision").digest("hex"),
  targetedDefect:"repetition",writerIntent:"report",protectedFacts:["group_count_12","subset_count_4"],
  semanticAdmissibility:"HOLD",nativeHumanPreference:"NOT_OBSERVED"};
 assert.ok(validateCandidate(c,original).status.startsWith("STRUCTURAL"));
 assert.throws(()=>validateCandidate({...c,sourceComponentId:"WRONG"},original),/UNMATCHED/);
 assert.throws(()=>validateCandidate({...c,semanticAdmissibility:"PASS"},original),/UNWITNESSED_SEMANTIC/);
 assert.throws(()=>validateCandidate({...c,nativeHumanPreference:"PREFERRED"},original),/UNWITNESSED_HUMAN/);
 const damaged=models.map(x=>({...x}));damaged[1].split="pilot_train";
 assert.throws(()=>components(damaged),/CONTAMINATION/);
 const x=contrast();assert.equal(x.length,4);
 assert.equal(x.filter(v=>v.typedFactPreservation).length,2);
 assert.equal(x.filter(v=>v.surfaceRepetitionAbsent).length,2);
 assert.equal(x.filter(v=>!v.typedFactPreservation&&v.surfaceRepetitionAbsent).length,1);
 assert.ok(x.every(v=>v.humanNaturalness==="NOT_OBSERVED"));
 return {...o,negativeControls:4,syntheticFactorialCells:4,
  surfaceSmoothedButFactDamaged:1,sourceGraphEdges:g.edges.length};
}
if(require.main===module){
 if(process.argv.includes("--emit-ledger"))console.log(JSON.stringify(ledger(),null,2));
 else if(process.argv.includes("--emit-source-graph"))console.log(JSON.stringify(components(),null,2));
 else console.log(JSON.stringify(tests()));
}
module.exports={models,components,ledger,audit,validateCandidate,contrast,tests};
