"use strict";
/** Global map v02: genre-specific rhetorical *purpose* rather than a fixed audit ending.
 * Reuses raw source-only grouping, no human annotations, no additional model call.
 */
const {map:baseMap,validate}=require("./global_document_map_v01.cjs");
const PURPOSE={
 science_explainer:["연구 질문과 설정","관찰 결과와 비교","해석할 수 있는 범위 및 측정 한계"],
 public_notice:["독자가 가장 먼저 알아야 할 신청 행동","행사별 시간·장소·참여 세부","예외 및 아직 확정되지 않은 사항"],
 scene_essay:["장면의 감각적으로 확인 가능한 배경","인물별 움직임과 관찰 가능한 상호작용","마지막 관찰 장면으로 끝내기"]
};
function map(task){
 validate(task);
 const base=baseMap(task),labels=PURPOSE[task.genre]||PURPOSE.science_explainer;
 const groups=base.sections.map(s=>[...s.factIds]);
 // Reallocate unresolved facts only as discourse suggestions; all facts remain accessible.
 // A scene must NOT end with a fact-checking verdict or epistemic appendix.
 const instruction=task.genre==="scene_essay"?
  "마지막 문단은 감정 추측이나 분석적 결론 대신 원천에 명시된 마지막 관찰 가능한 행동·배경으로 끝내세요. '근거 부족', '추론할 수 없다' 같은 해설적 결말은 쓰지 마세요.":
  task.genre==="public_notice"?
  "독자가 먼저 신청 기한·방법을 이해하도록 구성하세요. 오리엔테이션 참관과 실습 신청 자격을 혼동하지 마세요. 미정 준비물의 발표 예정일을 지어내지 마세요.":
  "실험 전후 관찰·외부 변수·인과 판단 한계를 구분하되, 존재하지 않는 조사 주체나 수행 과정을 지어내지 마세요.";
 const intro="글의 목적: "+task.purpose+"\n전역 구성: "+
   groups.map((g,i)=>"문단"+(i+1)+" "+labels[i]+" ["+g.join(",")+"]").join(" / ");
 return {schema:"ksgt.g10.p1.genre-purpose-global-map.v02",sourceId:task.id,
  paragraphRoles:labels,sections:groups,sourceHash:base.sourceHash,
  prompt:intro+"\n"+instruction+"\n원천 사실과 미확인 사항을 넘어서는 새로운 사실을 쓰지 마세요.",
  limitation:"AUTHOR_SYNTHETIC_SHALLOW_GLOBAL_PLANNING_NO_HUMAN_QUALITY_CERTIFICATION"};
}
module.exports={map,PURPOSE};
