"use strict";
/** R4b human gate: real completed Korean prose, matched PATCH vs REWRITE.
 * A: reader-first, no source; B: independent source auditor, facts visible.
 * Never leak investigator mapping or posthoc target labels into A/B.
 * Two forms/panel are order balances, not independent source works.
 */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const adapter=require("./r4b_whitespace_alignment_v01.cjs");
const edit=require("./r4b_original_text_local_repair.cjs");
const source=require("./fixtures/r4a_new_full_prose_12works_v01.json");
const sha=v=>crypto.createHash("sha256").update(v).digest("hex");
const panels={
 P:["CHAT_UPLOAD_direct","NOTICE_CHEM_direct","SCI_SEED_rich","SCENE_NOTE_rich"],
 Q:["CHAT_UPLOAD_rich","NOTICE_CHEM_rich","SCI_SEED_rich","SCENE_NOTE_rich"]
};
function ensure(c,m){if(!c)throw Error(m);}
function quote(s){return s.split(/\r?\n/).map(x=>"> "+x).join("\n");}
function viewData(originalRoot,recoveredRoot){
 const replay=adapter.replay(originalRoot,recoveredRoot);
 const raw=edit.score(originalRoot,recoveredRoot);
 const src=new Map(source.works.map(x=>[x.id,x]));
 const report=new Map(replay.rows.map(x=>[x.id,x]));
 const x=[];
 for(const item of raw.rows.filter(x=>x.goldStatus==="ISSUE")){
  const r=report.get(item.id);
  ensure(r&&typeof r.outputText==="string"&&r.changed&&
   ["EXACT_APPLIED_UNVERIFIED","EDGE_WHITESPACE_ALIGNED_UNVERIFIED"].includes(r.adapter),
   "R4B1_REPLAY_NOT_COMPLETE_"+item.id);
  const work=src.get(item.work);
  ensure(work&&typeof item.rewrite.output==="string"&&item.rewrite.changed,
   "R4B_REQUIRED_SOURCE_OR_FULL_REWRITE_MISSING");
  ensure(sha(r.outputText)===r.outputSha256&&
   sha(item.rewrite.output)===item.rewrite.resultSha256,
   "R4B_EDIT_TEXT_MISMATCH");
  x.push({id:item.id.replace(/^R4B_R4A_/,""),
   sourceWork:work.id,genre:work.genre,work,
   modelLocalPatch:r.outputText,fullRewrite:item.rewrite.output,
   editSha:r.outputSha256,fullSha:item.rewrite.resultSha256,
   rawOriginalSha:item.originalTextSha256});
 }
 ensure(x.length===6,"WRONG_UNIQUE_EDIT_CASES");
 return x;
}
function renderForm(data,panel,version,stage){
 ensure(Object.keys(panels).includes(panel)&&[1,2].includes(version)&&["A","B"].includes(stage),
  "INVALID_FORM_SELECTORS");
 const lookup=new Map(data.map(x=>[x.id,x]));
 const ids=panels[panel];
 const order=version===1?ids:[...ids].reverse();
 const rows=order.map(id=>lookup.get(id));
 ensure(rows.length===4&&rows.every(Boolean)&&
  new Set(rows.map(x=>x.sourceWork)).size===4,"FORM_SOURCE_WORK_COLLISION");
 const key={panel,version,stage,rows:[]};
 let text="# KSGT G10-P2 R4b — "+(stage==="A"?"독립 독자 사용성 평가":"독립 원천 충실도 감사")+
  " · "+panel+version+"\n\n";
 text+="**참여자 코드:** __________\n\n"+
  "**평가 원칙:** 이 양식에는 네 가지 글감이 있으며, 같은 글감을 사용한 다른 양식이 존재합니다. "+
  "선택지 A와 B가 어떤 생성·수정 방식인지 모르는 상태에서 각 글을 읽어 주세요. 실제 사용자 응답은 아직 수집하지 않았습니다.\n\n";
 if(stage==="A")text+="**A단계:** 원천 사실 목록은 보여 주지 않습니다. 자연스러움·목적 달성·독해·최초 수정 위치를 평가해 주세요. 다른 원천 감사 자료를 보지 않은 사람이 참여해야 합니다.\n\n";
 else text+="**B단계:** 원천 사실을 대조해 원천에 없는 약속·장소·행위자·인과·추가 사건·누락된 조건을 구체적으로 확인합니다. 다른 독자 평가 자료나 모델 판단표는 보지 말아 주세요.\n\n";
 for(const [i,row] of rows.entries()){
  // Orientation is based on frozen panel identity, not reordered form slot;
  // otherwise reversing a four-item form cancels the intended arm flip.
  const forward=(ids.indexOf(row.id)+version)%2===0;
  const A=forward?row.modelLocalPatch:row.fullRewrite;
  const B=forward?row.fullRewrite:row.modelLocalPatch;
  text+="## 글감 "+(i+1)+" · "+row.genre+"\n\n"+
   "**독자·목적:** "+row.work.audience+" / "+row.work.purpose+"\n\n"+
   "**집필 요청:** "+row.work.task+"\n\n";
  if(stage==="B"){
   text+="**원천 사실:**\n\n";
   row.work.facts.forEach((fact,i)=>text+="- F"+(i+1)+": "+fact+"\n");
   if(row.work.license)text+="\n**문학적 부수 묘사 허용 범위:** "+row.work.license+"\n";
   text+="\n";
  }
  text+="**완성문 A**\n\n"+quote(A)+"\n\n**완성문 B**\n\n"+quote(B)+"\n\n";
  if(stage==="A"){
    text+="- 실제로 바로 사용할 글을 고르면: A / B / 동률 / 둘 다 부적합 / 보류\n";
    text+="- 실제 독해 질문 — "+row.work.readerQuestion+"\n";
    text+="- 글 A에서 읽은 답: __________\n";
    text+="- 글 B에서 읽은 답: __________\n";
    text+="- A에서 가장 먼저 고칠 구절과 이유: __________\n";
    text+="- B에서 가장 먼저 고칠 구절과 이유: __________\n";
    text+="- 선택 이유와 자연스러움의 근거: __________\n";
  }else{
    text+="- A 전체의 원천 충실도: 문제 없음 / 명백한 위반 / 판단 보류\n";
    text+="- B 전체의 원천 충실도: 문제 없음 / 명백한 위반 / 판단 보류\n";
    text+="- A: 원천에 없는 구절(정확한 인용)·대조할 원천 F번호: __________\n";
    text+="- B: 원천에 없는 구절(정확한 인용)·대조할 원천 F번호: __________\n";
    text+="- 중요 조건 누락, 행위자 교환, 양태·인과 승격이 있다면 그 이유: __________\n";
    text+="- 원천을 보존한 채 바로 사용할 글: A / B / 둘 다 / 둘 다 불가 / 보류\n";
  }
  text+="\n---\n\n";
  key.rows.push({slot:i+1,id:row.id,sourceWork:row.sourceWork,
   A:forward?"MODEL_LOCAL_PATCH":"MODEL_FULL_REWRITE",
   B:forward?"MODEL_FULL_REWRITE":"MODEL_LOCAL_PATCH",
   shaA:sha(A),shaB:sha(B),sourceAnswer:row.work.answer,
   priorTextSha256:row.rawOriginalSha});
 }
 return {text,key};
}
function pack(originalRoot,firstRecoveryRoot,destination){
 ensure(!fs.existsSync(destination),"REFUSE_EXISTING_PACKET_DIR");
 const rows=viewData(originalRoot,firstRecoveryRoot);
 fs.mkdirSync(destination,{mode:0o700});
 const paths={A:path.join(destination,"A_reader_only"),
  B:path.join(destination,"B_source_auditor_only"),
  P:path.join(destination,"P_private_investigator")};
 for(const key of Object.keys(paths))fs.mkdirSync(paths[key],{mode:0o700});
 const map={schema:"ksgt.g10p2.r4b.blind-pair-mapping.v1",
  sourceWorkGroups:4,actualUniqueOriginalTextCases:6,
  independentReaderRatings:0,independentSourceAudits:0,
  note:"DO NOT DISTRIBUTE THE INVESTIGATOR KEY; FORMS REPEAT WORKS",
  forms:[]},manifest={schema:"ksgt.g10p2.r4b.form-custody.v1",files:[]};
 for(const panel of ["P","Q"])for(const ver of [1,2]){
  for(const stage of ["A","B"]){
   const {text,key}=renderForm(rows,panel,ver,stage);
   const dest=path.join(paths[stage],panel+ver+".md");
   fs.writeFileSync(dest,text,{flag:"wx",mode:0o600});
   map.forms.push(key);
   manifest.files.push({stage,panel,version:ver,name:panel+ver+".md",
    sha256:sha(text),utf8Bytes:Buffer.byteLength(text)});
  }
 }
 fs.writeFileSync(path.join(paths.P,"private_mapping.json"),JSON.stringify(map,null,2)+"\n",{flag:"wx",mode:0o600});
 fs.writeFileSync(path.join(destination,"public_manifest.json"),JSON.stringify(manifest,null,2)+"\n",{flag:"wx",mode:0o600});
 return {sourceWorks:4,uniqueTextCases:6,pairedPresentationsPerStage:16,
  independentReaderRatings:0,independentAuditorRatings:0,manifest};
}
if(require.main===module){
 const [a,b,c,...extra]=process.argv.slice(2);
 if(!a||!b||!c||extra.length)throw Error("USAGE ORIGINAL_R4A_DIR R4B_RAW_DIR NEW_PACKET_DIR");
 console.log(JSON.stringify(pack(a,b,c),null,2));
}
module.exports={panels,viewData,renderForm,pack};
