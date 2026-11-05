"use strict";
/** G10 global document map: a conservative, inspectable grouping hypothesis.
 * All facts remain visible to all arms. No external generation or hand labels.
 */
const crypto=require("node:crypto");
const CUES={
 boundary:/(?:아직|미정|확인되지|알려지지|측정하지|결정되지|확정할 수 없|포함되지|못했다|추정할 수 없)/u,
 action:/(?:신청|마감|완료해야|포털|참관|참여|열린다|제공|진행)/u,
 observation:/(?:관찰|조사|종수|기록|바라보|가리켰|반납|걸어갔|들어왔|놓았다|향했다)/u,
 setup:/(?:목표|사업|기존|복원 전|비가 오는|게시판|도서관|오리엔테이션|행사|서식처)/u
};
function validate(task){
 if(!task||typeof task.id!=="string"||typeof task.genre!=="string"||
  !Array.isArray(task.facts)||task.facts.length<6||
  task.facts.some(x=>typeof x!=="string"||!x.trim())||
  !Array.isArray(task.uncertainties))throw Error("INVALID_WHOLE_DOCUMENT_SOURCE");
}
function role(fact,genre){
 if(CUES.boundary.test(fact))return "BOUNDARY";
 if(genre==="public_notice"&&CUES.action.test(fact))return "ACTION";
 if(CUES.observation.test(fact))return "DEVELOPMENT";
 if(CUES.setup.test(fact))return "CONTEXT";
 return "UNRESOLVED";
}
function map(task,{ablate=false}={}){
 validate(task);
 const classified=task.facts.map((fact,i)=>({id:"F"+(i+1),role:role(fact,task.genre),i}));
 // Global (not local) allocation with a genre-dependent reader purpose.
 const section=task.genre==="public_notice"?
  {CONTEXT:0,ACTION:1,DEVELOPMENT:1,BOUNDARY:2,UNRESOLVED:1}:
  {CONTEXT:0,ACTION:1,DEVELOPMENT:1,BOUNDARY:2,UNRESOLVED:1};
 const groups=[[],[],[]];
 for(const x of classified)groups[section[x.role]].push(x.id);
 // For readability, do not fabricate facts to fill empty sections.
 // An ablation rotates factual responsibilities, preserving all facts and uncertainty text.
 if(ablate){const x=groups.pop();groups.unshift(x);}
 const labels=task.genre==="public_notice"?
  ["목적과 일정 개관","참여 행동·세부 일정","예외·확인되지 않은 조건"]:
  task.genre==="scene_essay"?
  ["장면의 배경","인물의 관찰 가능한 움직임","장면의 종결과 남은 불확실성"]:
  ["연구 배경과 목적","관찰·진행과 비교","해석의 범위 및 미확인 변수"];
 const plan=groups.map((g,i)=>"문단 "+(i+1)+"("+labels[i]+"): "+(g.length?g.join(", "):"필요한 원천 정보만 자연스럽게 연결")).join("\n");
 return {schema:"ksgt.g10.p1.global-map.v01",sourceId:task.id,ablation:ablate,
  sections:groups.map((ids,i)=>({index:i+1,function:labels[i],factIds:ids})),
  factCoverage:classified.length,unresolvedFactIds:classified.filter(x=>x.role==="UNRESOLVED").map(x=>x.id),
  prompt:"원천 사실과 확인되지 않은 내용만으로 세 문단을 작성하세요. 다음 문단별 역할은 참고 계획이며 새 사실을 허용하지 않습니다.\n"+plan+
   "\n서로 다른 문단의 사실을 불필요하게 반복하지 말고, 문단 사이 논리적 연결을 자연스럽게 작성하세요."+
   "\n미확인 사실을 단정하거나 참석 자격·신청 기한·원인 관계를 바꾸지 마세요.",
  sourceHash:crypto.createHash("sha256").update(JSON.stringify(task.facts)).digest("hex"),
  epistemicLimit:"SHALLOW_LEXICAL_GLOBAL_GROUPING_NOT_A_SEMANTIC_DEPENDENCY_PARSER"};
}
module.exports={validate,role,map};
