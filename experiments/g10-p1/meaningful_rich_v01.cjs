"use strict";
const {messages}=require("./paired_runner_v02.cjs");
function prompt(task){
 const out=messages("RICH_PROMPT",task).map(x=>({...x}));
 const guidance=[
 "핵심 배경을 먼저 소개하고 관찰과 결과를 이어 쓰세요. 원천의 배열은 그대로 따를 필요 없습니다.",
 "서로 다른 인물과 사건의 지시 대상을 분명하게 표현하되 불필요한 반복은 줄이세요.",
 "인과와 시간적 선후는 원천이 허용할 때만 표현하세요.",
 "신청 기한, 자격, 부정 조건, 수치, 장소를 정확히 보존하세요.",
 "출처에 없는 감정이나 새로운 사실을 보태지 말고 한 문단의 자연스러운 한국어로 쓰세요.",
 "사실 ID나 계획 메타정보는 출력에 쓰지 마세요."
 ];
 out[1].content+="\n\n글쓰기 원칙: "+guidance.join(" ");
 return out;
}
module.exports={prompt};
