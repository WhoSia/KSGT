"use strict";
/*
 * G10-P2 R4a: generate separate reader-first and source-auditor material
 * from the sealed REAL R4a provider outputs. No fabricated human ratings.
 * Forms reuse the SAME twelve source work units: four forms != 48 independent samples.
 */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const r=require("./r4a_full_prose_selection_v01.cjs");
const sha=x=>crypto.createHash("sha256").update(x).digest("hex");
function ensure(c,msg){if(!c)throw Error(msg)}
function quote(text) {return text.split(/\r?\n/).map(line=>"> "+line).join("\n");}
function renderedWorks(runRoot) {
  const score=r.score(runRoot),writer=r.writerRows(runRoot);
  ensure(score.sourceWorks===12&&score.successfulCalls===60&&writer.length===12,
    "INCOMPLETE_R4A_PROVENANCE");
  const index=new Map(score.rows.map(s=>[s.sourceWork,s]));
  const result=writer.map(row=>{
    const work=row.work,meta=index.get(work.id);
    ensure(meta&&sha(row.direct.text)===meta.candidateSha256.direct&&
      sha(row.rich.text)===meta.candidateSha256.rich,"R4A_READER_TEXT_SHA_MISMATCH");
    return {work,summary:meta,texts:{direct:row.direct.text,rich:row.rich.text}};
  });
  ensure(new Set(result.map(x=>x.work.id)).size===12,"DUPLICATE_SOURCE_WORK");
  return result;
}
function ordering(items,formNo){
  ensure(Number.isInteger(formNo)&&formNo>=1&&formNo<=4,"BAD_FORM_NUMBER");
  const offset=(formNo-1)*3;
  return items.slice(offset).concat(items.slice(0,offset));
}
function orientation(workIndex,formNo){
  return (workIndex+(formNo-1))%2===0?"direct":"rich";
}
function header(form,stage){
  return "# KSGT G10-P2 R4a — "+stage+" 평가 양식 "+form+"\n\n"+
    "> 연구자 작성 12개 글감의 반복 배치입니다. 네 개 양식을 별도 48개 표본으로 세지 않습니다. "+
    "실제 참가자 응답은 아직 수집하지 않았습니다.\n\n";
}
function formData(data,formNo,includeSources=false) {
  const items=ordering(data,formNo);
  let text=header(formNo,includeSources?"원천 충실도 감사 B단계":"독자 이해 및 사용성 A단계");
  text+=includeSources?
    "원문 사실이 모두 공개된 별도의 감사 단계입니다. 각 후보의 원천 위반 여부를 **독립적으로** 판단해 주세요. 가정·부정·행위자·시점·의무·예외·문학적 부수 질감을 구별해 주세요.\n\n":
    "원천 사실 목록은 이 단계에서 제공되지 않습니다. 각 글을 처음 읽는 독자처럼 사용 가능성, 이해 내용, 최초 수정 위치를 판단해 주세요. 후보의 실험 이름은 공개하지 않습니다.\n\n";
  const mapping={form:formNo,stage:includeSources?"B":"A",rows:[]};
  for(const [index,row] of items.entries()){
    const originalIdx=data.findIndex(x=>x.work.id===row.work.id);
    const first=orientation(originalIdx,formNo),second=first==="direct"?"rich":"direct";
    const a=row.texts[first],b=row.texts[second];
    const label="사례 "+String(index+1).padStart(2,"0");
    text+="## "+label+" — "+row.work.genre+"\n\n";
    text+="**작성 요청:** "+row.work.task+"\n\n";
    text+="**예상 독자:** "+row.work.audience+"\n\n";
    if(includeSources){
      text+="**고정된 원천 사실:**\n\n";
      for(let i=0;i<row.work.facts.length;i++)text+="- F"+(i+1)+". "+row.work.facts[i]+"\n";
      if(row.work.license)text+="\n**문학적 부수 표현 허용 범위:** "+row.work.license+"\n";
      text+="\n";
    }
    text+="**후보 A**\n\n"+quote(a)+"\n\n**후보 B**\n\n"+quote(b)+"\n\n";
    if(!includeSources){
      text+="**평가 문항**\n\n";
      text+="- 실제로 사용할 글을 고른다면: A / B / 동률 / 둘 다 사용하기 어려움 / 판단 보류\n";
      text+="- 선택 이유(글에 나온 표현을 구체적으로 지목): __________\n";
      text+="- 후보 A를 읽고 답하기 — "+row.work.readerQuestion+" : __________\n";
      text+="- 후보 B를 읽고 답하기 — "+row.work.readerQuestion+" : __________\n";
      text+="- 후보 A에서 가장 먼저 수정할 구절과 이유: __________\n";
      text+="- 후보 B에서 가장 먼저 수정할 구절과 이유: __________\n\n";
    }else{
      text+="**원천 감사 문항**\n\n";
      text+="- 후보 A: 원천 충실 / 명백한 원천 위반 / 불확실\n";
      text+="- 후보 B: 원천 충실 / 명백한 원천 위반 / 불확실\n";
      text+="- 각각의 원천 밖 새 약속·의무·시간·인과·인물 행위·문학 사건이 있다면 그 구절과 F번호: __________\n";
      text+="- 각각 빠진 중요 조건·적용 범위·단서가 있다면 구절과 F번호: __________\n";
      text+="- 소설의 경우 허용한 감각적 묘사와 새 사건을 구별한 이유: __________\n";
      text+="- 완성된 글로 사용할 수 있는지와 그 이유: __________\n\n";
    }
    mapping.rows.push({case:index+1,id:row.work.id,
      A:first,B:second,shaA:sha(a),shaB:sha(b),
      controller:row.summary.executable.choice,
      controllerStatus:row.summary.executable.status,
      stateAsText:row.summary.stateAsText.valid?row.summary.stateAsText.choice:null,
      answerKey:row.work.answer});
  }
  return {text,mapping};
}
function writeOnce(out,text) {fs.writeFileSync(out,text,{flag:"wx",mode:0o600});}
function pack(root,destination){
  ensure(!fs.existsSync(destination),"REFUSE_EXISTING_READER_PACKAGE");
  const data=renderedWorks(root);
  fs.mkdirSync(destination,{mode:0o700});
  const pa=path.join(destination,"reader-stage-A"),pb=path.join(destination,"auditor-stage-B"),
    pk=path.join(destination,"investigator-private");
  for(const dir of [pa,pb,pk])fs.mkdirSync(dir,{mode:0o700});
  const key={schema:"ksgt.g10p2.r4a.investigator-only.v1",
    warning:"PRIVATE KEY: NEVER SEND TO STAGE A READERS OR STAGE B AUDITORS",
    originalSourceWorks:12,independentReaderResponsesCollected:0,forms:[]};
  const manifest={schema:"ksgt.g10p2.r4a.reader-packet.receipt.v1",
    oldExperimentSourceWorkCount:12,formsPerStage:4,
    independentReaderResponsesCollected:0,docs:[]};
  for(let form=1;form<=4;form++){
    const A=formData(data,form,false),B=formData(data,form,true);
    const name="form-"+form+".md";
    const fA=path.join(pa,name),fB=path.join(pb,name);
    writeOnce(fA,A.text);writeOnce(fB,B.text);
    key.forms.push(A.mapping);
    manifest.docs.push({stage:"A",form,filename:name,sha256:sha(A.text),bytes:Buffer.byteLength(A.text)});
    manifest.docs.push({stage:"B",form,filename:name,sha256:sha(B.text),bytes:Buffer.byteLength(B.text)});
  }
  writeOnce(path.join(pk,"investigator-key.json"),JSON.stringify(key,null,2)+"\n");
  writeOnce(path.join(destination,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
  return manifest;
}
if(require.main===module){
  const [mode,root,out,...more]=process.argv.slice(2);
  if(mode!=="--pack"||!root||!out||more.length)throw Error("USAGE --pack ORIGINAL_R4A_RUN NEW_OUTPUT_DIR");
  console.log(JSON.stringify(pack(root,out),null,2));
}
module.exports={renderedWorks,ordering,orientation,formData,pack};
