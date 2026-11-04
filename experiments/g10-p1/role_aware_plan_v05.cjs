"use strict";
/** v0.5 source-authority-preserving information ordering: no Korean parsing.
 * Repair learned from FACTOR001: topological sort alone pushed limitation to front.
 * Limitations follow their claimed target; setup/background precedes observation.
 */
const {validate}=require("./discourse_plan_v02.cjs");
const crypto=require("node:crypto");
const PRIORITY={SETUP:0,EVENT:1,OBSERVATION:2,INTERPRETATION:3,LIMITATION:4,CONCLUSION:5};
function order(task){
 validate(task);
 const n=task.facts.length,edges=Array.from({length:n},()=>new Set()),degree=Array(n).fill(0);
 function constrain(from,to){
  if(from===to)return; if(!edges[from].has(to)){edges[from].add(to);degree[to]++;}
 }
 for(const e of task.relations||[]){
  if(e.type==="TEMPORAL_NEXT"||e.type==="BACKGROUND")constrain(e.from-1,e.to-1);
  if(e.type==="LIMITATION")constrain(e.to-1,e.from-1);
 }
 const priority=i=>PRIORITY[task.factAnnotations?.[i]?.move]??2;
 const queue=[];for(let i=0;i<n;i++)if(degree[i]===0)queue.push(i);
 const result=[];
 while(queue.length){
  queue.sort((a,b)=>priority(a)-priority(b)||a-b);
  const i=queue.shift();result.push(i);
  for(const j of edges[i])if(--degree[j]===0)queue.push(j);
 }
 if(result.length!==n)throw Error("SOURCE_ORDER_RELATION_CYCLE");
 return result.map(i=>"F"+(i+1));
}
function plan(task){
 const seq=order(task);
 const critical=task.facts.map((s,i)=>(/(?:까지|해야|하지|않|없|못|미확인|제외|무관|무효|참여|신청|무료|불가|금지)/.test(s)?"F"+(i+1):null)).filter(Boolean);
 const relation=(task.relations||[]).filter(e=>e.type==="CONTRAST"||e.type==="EVIDENCE_FOR")
  .map(e=>"F"+e.from+":"+e.type+":F"+e.to);
 const summary=[
  "전개 순서: "+seq.join(" > "),
  "주의할 조건·부정·허가: "+(critical.join(", ")||"없음"),
  "관계: "+(relation.join(", ")||"원천에 없음"),
  "작성: 문단 자체를 자연스럽게 구성하되 사실 번호는 드러내지 말 것.",
  "제약: 기한·신청·참여 여부·부정의 극성, 관찰과 원인 미확인을 그대로 보존할 것."
 ].join("\n");
 return {schema:"ksgt.g10.p1.role-aware-compact-plan.v05",sourceId:task.id,
  order:seq,criticalFactIds:critical,relations:relation,
  prompt:summary,
  sourceHash:crypto.createHash("sha256").update(JSON.stringify(task.facts)).digest("hex"),
  interpretation:"HEURISTIC_ROLE_ORDER_WITH_EXPLICIT_AUTHOR_GRAPH_EDGES_NO_SEMANTIC_GOLD"};
}
module.exports={order,plan};
