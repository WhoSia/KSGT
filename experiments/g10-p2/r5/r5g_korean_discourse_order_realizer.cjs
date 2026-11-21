"use strict";
/* KSGT G10-P2 R5g: executable small Korean rhetorical ordering lattice + one-call
 * strong direct/guided real prose comparison. No new trained LM or reader model.
 * The six-node source DAG and all epistemic labels are investigator-authored.
 */
const fs=require("node:fs"),path=require("node:path"),{createHash}=require("node:crypto");
const {chat,resolveProvider}=require("../../g10-p1/provider_client_v01.cjs");
const fixture=require("./fixtures/r5g_new_eight_korean_rhetorical_dags_v01.json");
const MODEL="openai/gpt-oss-120b",MAX=1450,SETTINGS=Object.freeze({provider:"groq",model:MODEL,temperature:0,maxTokens:MAX});
const sha=s=>createHash("sha256").update(typeof s==="string"?s:JSON.stringify(s)).digest("hex");
const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
const KINDS=["science","notice","chat","scene"];
const STATUS=new Set(["OBSERVED","REPORTED","UNMEASURED","PLANNED","UNDECIDED","LICENSED_SCENE"]);
const ROLE_WEIGHT={
 science:{CONTEXT:8,METHOD:7,RESULT:6,UNCERTAINTY:5,LIMIT:4,PLAN:3},
 notice:{CONTEXT:8,LIMIT:7,DETAIL:6,ACTION:5,UNCERTAINTY:4},
 chat:{CONTEXT:8,EVIDENCE:7,LIMIT:6,UNCERTAINTY:5,ACTION:4},
 scene:{SCENE:8,PERCEPTION:7,ACTION:6,TENSION:5,OPEN_END:4}
};
const ROLE_EDGES=new Set(["CONTEXT:METHOD","METHOD:RESULT","RESULT:UNCERTAINTY",
 "UNCERTAINTY:LIMIT","LIMIT:PLAN","CONTEXT:LIMIT","CONTEXT:DETAIL",
 "DETAIL:ACTION","LIMIT:ACTION","CONTEXT:EVIDENCE","EVIDENCE:UNCERTAINTY",
 "UNCERTAINTY:ACTION","SCENE:ACTION","SCENE:PERCEPTION","ACTION:PERCEPTION",
 "PERCEPTION:TENSION","TENSION:OPEN_END","ACTION:OPEN_END"]);
const RISK={
 OBSERVED:"관찰·검사에 실제로 기록된 범위에서만 진술한다.",
 REPORTED:"제공된 기록이나 설명에 근거한 사실임을 유지한다.",
 UNMEASURED:"측정하지 않은 항목을 측정된 값 또는 변화 없음이라고 쓰지 않는다.",
 PLANNED:"향후 계획이나 예정이지 실행·성공한 결과가 아니다.",
 UNDECIDED:"확인되지 않은 사안을 확정되었거나 통보하기로 약속한 것처럼 쓰지 않는다.",
 LICENSED_SCENE:"서술자가 허용한 현장 묘사 또는 이미 명시된 행위이며, 새 인물·행동·대화는 추가하지 않는다."
};
function validateFixture(root=fixture){
 assert(root.schema==="ksgt.g10p2.r5g.fresh-author-eight-work-discourse-graph.v1"&&
  root.model===MODEL&&root.temperature===0&&root.maxTokens===MAX&&
  root.authority==="INVESTIGATOR_SYNTHETIC_NEW_EIGHT_SOURCE_WORKS_EXPOSED_DEVELOPMENT_NOT_NATURAL_HUMAN_EDITORIAL_GOLD",
  "R5G_FIXTURE_AUTHORITY_OR_MODEL_MISMATCH");
 assert(Array.isArray(root.works)&&root.works.length===8,"R5G_SOURCE_COUNT");
 const idSet=new Set(),count=Object.fromEntries(KINDS.map(k=>[k,0]));
 for(const w of root.works){
  assert(/^R5G_(SCI|NOTICE|CHAT|SCENE)_[A-Z]+$/.test(w.id)&&!idSet.has(w.id),"R5G_DUP_OR_BAD_ID");
  idSet.add(w.id);assert(KINDS.includes(w.genre),"R5G_UNSUPPORTED_GENRE");count[w.genre]++;
  assert(typeof w.audience==="string"&&w.audience.length>5&&
   typeof w.task==="string"&&w.task.length>=30&&
   typeof w.license==="string"&&w.license.length>=35,"R5G_BAD_GENRE_TASK_LICENSE");
  assert(w.nodes?.length===6,"R5G_NODE_COUNT");
  const ids=new Set(w.nodes.map(n=>n.id));
  assert(ids.size===6&&[...ids].every(id=>/^F[1-6]$/.test(id)),"R5G_BAD_NODE_IDS");
  for(const n of w.nodes){
   assert(typeof n.text==="string"&&n.text.length>=15&&
    ROLE_WEIGHT[w.genre][n.role]!==undefined&&STATUS.has(n.status)&&
    Array.isArray(n.topics)&&n.topics.length>=1&&n.topics.length<=3&&
    n.topics.every(t=>typeof t==="string"&&t.length>0)&&
    new Set(n.topics).size===n.topics.length&&
    Array.isArray(n.requires)&&new Set(n.requires).size===n.requires.length&&
    n.requires.every(id=>ids.has(id)&&id!==n.id),"R5G_INVALID_NODE_"+n.id);
   assert((w.genre==="scene")===(n.status==="LICENSED_SCENE"),
    "R5G_SCENE_STATUS_MISMATCH_"+w.id);
  }
  const topo=enumerate(w);
  assert(topo.length>0&&topo.length<=720,"R5G_SOURCE_GRAPH_CYCLE_OR_ENUMERATION_FAILURE");
 }
 assert(Object.values(count).every(n=>n===2),"R5G_GENRE_BALANCE");
 return root;
}
function enumerate(w){
 const seen=new Set(),byID=new Map(w.nodes.map(n=>[n.id,n]));
 assert(byID.size===w.nodes.length,"R5G_NONUNIQUE_GRAPH");
 const orders=[],used=new Set(),prefix=[];
 function walk(){
  if(prefix.length===w.nodes.length){orders.push([...prefix]);return;}
  for(const id of [...byID.keys()].sort()){
   const n=byID.get(id);
   if(used.has(id)||!n.requires.every(d=>used.has(d)))continue;
   used.add(id);prefix.push(id);walk();prefix.pop();used.delete(id);
  }
 }
 walk();return orders;
}
function scoreOrder(w,ids){
 const byID=new Map(w.nodes.map(n=>[n.id,n])),L=ids.length;
 assert(ids.length===6&&new Set(ids).size===6&&ids.every(x=>byID.has(x)),"R5G_SCORE_PERMUTATION_INVALID");
 const position=Object.fromEntries(ids.map((v,i)=>[v,i]));
 assert(ids.every(id=>byID.get(id).requires.every(p=>position[p]<position[id])),
   "R5G_SCORE_DEPENDENCY_VIOLATION");
 let score=0;
 for(let i=0;i<ids.length;i++){
  const n=byID.get(ids[i]);
  score+=(L-i)*ROLE_WEIGHT[w.genre][n.role];
  if(i){
   const prev=byID.get(ids[i-1]);
   score+=3*n.topics.filter(t=>prev.topics.includes(t)).length;
   if(ROLE_EDGES.has(prev.role+":"+n.role))score+=2;
  }
 }
 return score;
}
function solve(w){
 const orders=enumerate(w);
 assert(orders.length>0,"NO_FEASIBLE_SOURCE_PLAN");
 let top=null,score=-Infinity;
 for(const row of orders){
  const val=scoreOrder(w,row);
  if(val>score||(val===score&&JSON.stringify(row)<JSON.stringify(top))){
   score=val;top=row;
  }
 }
 const lookup=new Map(w.nodes.map(n=>[n.id,n]));
 return {sourceWork:w.id,nodeCount:w.nodes.length,validOrders:orders.length,
  objectiveScore:score,orderedIDs:top,
  selected:top.map(id=>({id,role:lookup.get(id).role,
   status:lookup.get(id).status,
   epistemicNote:RISK[lookup.get(id).status]})),
  scoringAuthority:"FROZEN_AUTHOR_DEFINED_ROLE_TOPIC_TRANSITION_OBJECTIVE_NOT_LEARNED_QUALITY"};
}
const GROUND="사용자가 준 사실과 장르의 목적에 맞게 바로 사용할 수 있는 자연스러운 한국어 완성문을 쓴다. 원천에 없는 숫자, 장소, 특정 시각, 의무, 약속, 인과관계, 등장인물의 새 행동이나 서술자의 불필요한 마무리 해설을 추가하지 않는다. 문단 자체가 자연스럽게 이어져야 하며, 원천의 열거 순서를 그대로 나열할 필요는 없다. 목록·표제·상태 라벨 없이 최종 한국어 본문만 작성한다.";
function messages(w,arm){
 assert(["DIRECT","LATTICE"].includes(arm),"BAD_WRITER_ARM");
 const base={
  genre:w.genre,reader:w.audience,request:w.task,
  sourceLicense:w.license,
  originalUnorderedSourceNodes:w.nodes.map(n=>({
   id:n.id,role:n.role,sourceKnowledgeStatus:n.status,
   text:n.text,sourceTopicLabels:n.topics,requiredEarlierFacts:n.requires
  })),
  epistemicSemantics:RISK,
  writerInstruction:GROUND
 };
 if(arm==="LATTICE"){
  const plan=solve(w);
  base.compiledSourceBoundDiscoursePlan={
   orderedIDs:plan.orderedIDs,
   orderedFunctionsAndStatus:plan.selected,
   sourceGraphEligibleOrders:plan.validOrders,
   instruction:"이 순서의 사건/정보 의존관계를 존중해 한국어 문단을 작성한다. 문장 자체는 합치거나 나누고 조사·주어 생략·접속 표현은 자연스럽게 선택한다. 번호나 사실 ID는 독자에게 보여주지 않는다. 원천에 없는 새로운 단계나 결론을 추가하지 않는다."
  };
 }
 return [{role:"system",content:"매끄러운 한국어 전문 문단과 문학 장면을 쓸 수 있는 작가다. 출처의 확인 수준과 허용된 사건을 지킨다."},
  {role:"user",content:JSON.stringify(base)}];
}
function planCalls(){
 validateFixture();
 const cells=[];
 for(const [i,w] of fixture.works.entries()){
  const arms=i%2===0?["DIRECT","LATTICE"]:["LATTICE","DIRECT"];
  for(const arm of arms){
   const prompt=messages(w,arm);
   cells.push({id:w.id+"_"+arm,sourceWork:w.id,genre:w.genre,sourceSHA256:sha(w.nodes),
    planSHA256:sha(solve(w)),arm,model:MODEL,messages:prompt,promptSHA256:sha(prompt)});
  }
 }
 assert(cells.length===16&&new Set(cells.map(x=>x.id)).size===16,"R5G_CALL_PLAN_BAD");
 return cells;
}
function planHash(cells){return sha({schema:"ksgt.g10p2.r5g.strong-120b-rhetorical-dag-writing.v1",settings:SETTINGS,cells})}
function write(file,o){fs.writeFileSync(file,JSON.stringify(o,null,2)+"\n",{flag:"wx",mode:0o600})}
function readReceipts(root,cells){
 const dir=path.join(root,"responses");
 const summary=JSON.parse(fs.readFileSync(path.join(dir,"summary.json"),"utf8"));
 assert(summary.planHash===planHash(cells)&&summary.rows?.length===16,"R5G_SUMMARY_MISMATCH");
 for(const ext of [".attempt.json",".result.json"]){
  const names=fs.readdirSync(dir).filter(x=>x.endsWith(ext));
  assert(names.length===16&&names.every(x=>cells.some(c=>x===c.id+ext)),"R5G_RECEIPTS_MISSING_OR_EXTRA_"+ext);
 }
 return new Map(cells.map(c=>{
  const a=JSON.parse(fs.readFileSync(path.join(dir,c.id+".attempt.json"),"utf8"));
  const r=JSON.parse(fs.readFileSync(path.join(dir,c.id+".result.json"),"utf8"));
  assert(a.id===c.id&&a.promptSHA256===c.promptSHA256&&a.planHash===planHash(cells)&&
   a.planSHA256===c.planSHA256&&a.sourceSHA256===c.sourceSHA256&&
   r.id===c.id&&r.promptSHA256===c.promptSHA256&&r.sourceSHA256===c.sourceSHA256&&
   r.planSHA256===c.planSHA256&&r.modelRequested===MODEL&&r.responseModel===MODEL&&
   r.status==="GENERATED"&&r.finishReason==="stop"&&sha(r.text)===r.textSHA256&&
   Number.isInteger(r.usage?.total_tokens)&&r.usage.total_tokens>0,"R5G_BAD_MODEL_RECEIPT_"+c.id);
  return [c.id,r];
 }));
}
function numericTokens(s){return new Set((s.normalize("NFKC").match(/\d+(?:[.,]\d+)*/g)||[]).map(x=>x.replace(/,/g,"")))}
function score(root){
 const cells=planCalls(),responses=readReceipts(root,cells);
 const rows=fixture.works.map(w=>{
  const elected=solve(w);
  const sourceNumbers=numericTokens(w.nodes.map(n=>n.text).join(" "));
  const outputs={};
  for(const arm of ["DIRECT","LATTICE"]){
   const res=responses.get(w.id+"_"+arm);
   outputs[arm]={text:res.text,textSHA256:res.textSHA256,
    providerTokens:res.usage.total_tokens,
    novelNumericTokens:[...numericTokens(res.text)].filter(n=>!sourceNumbers.has(n)),
    hasUnwelcomeGenericEnding:/단순한.{1,40}(아니라|넘어)|중요한 것은/.test(res.text),
    responseModel:res.responseModel};
  }
  return {sourceWork:w.id,genre:w.genre,task:w.task,license:w.license,audience:w.audience,
   originalSourceNodes:w.nodes,selectedPlan:elected,outputs};
 });
 const byArm=Object.fromEntries(["DIRECT","LATTICE"].map(k=>[k,{
  actualProviderCalls:8,wholeProseTexts:8,
  providerTokens:rows.reduce((n,r)=>n+r.outputs[k].providerTokens,0),
  numericallyNovelOutputInstances:rows.filter(r=>r.outputs[k].novelNumericTokens.length).length,
  aiPhraseSignatureFlaggedInstances:rows.filter(r=>r.outputs[k].hasUnwelcomeGenericEnding).length
 }]));
 return {schema:"ksgt.g10p2.r5g.executable-rhetorical-planning-actual-korean-prose.v1",
  status:"DEVELOPMENT_16_ACTUAL_CALLS_SOURCE_AUTHOR_EXPOSED",
  sourceWorks:8,newProviderCalls:16,completeKoreanTexts:16,
  fixedGraphPlanningExtraModelCalls:0,independentNativeReaders:0,
  independentSemanticGold:0,naturalnessSuperiority:"NOT_ESTABLISHED",
  byArm,rows};
}
function readingPacket(s){
 const arr=["# R5g — 새 한국어 문단 8개 글감 × 직접 120B / 실행형 담화 순서 계획 120B",
 "연구자가 새로 만든 여섯 원천 사실을 동일한 120B 모델에 주었다. 계획 조건만 사실 ID의 실행형 순서를 추가한다. 소설에서는 새 행동·대화를, 실용문에서는 새 약속·시각을 발명하지 않는다.",
 "수치 검사는 출처에 없는 숫자 탐지의 약한 필요조건일 뿐 의미·문체 품질이 아니다."];
 for(const [i,r] of s.rows.entries()){
  arr.push("---\n\n## "+(i+1)+". "+r.sourceWork+" · "+r.genre+
   "\n\n**요청**: "+r.task+"\n\n**허용 범위**: "+r.license+
   "\n\n**원천 사실(연구자가 일부러 섞은 입력 순서)**\n"+
   r.originalSourceNodes.map(n=>n.id+" ["+n.status+"] "+n.text).join("\n")+
   "\n\n**실행형 계산 결과**: "+r.selectedPlan.orderedIDs.join(" → ")+
   " · 위상정렬 가능한 경우의 수 "+r.selectedPlan.validOrders);
  const arms=i%2===0?["DIRECT","LATTICE"]:["LATTICE","DIRECT"];
  arms.forEach((a,j)=>arr.push("### 원고 "+["A","B"][j]+"\n\n"+r.outputs[a].text+
    "\n\n("+a+" · 전체 provider 토큰 "+r.outputs[a].providerTokens+
    " · 원천에 없는 숫자 표면 검사 "+JSON.stringify(r.outputs[a].novelNumericTokens)+")"));
  arr.push("실험 조건 해독: "+arms.map((a,j)=>["A","B"][j]+"="+a).join(" / "));
 }
 return arr.join("\n\n")+"\n";
}
async function run(root,{invoke=chat}={}){
 assert(!fs.existsSync(root),"REFUSE_EXISTING_R5G_RUN");
 const cells=planCalls();
 fs.mkdirSync(root,{recursive:false,mode:0o700});
 write(path.join(root,"frozen-order-plans.json"),{planHash:planHash(cells),
  sourceAuthority:fixture.authority,plans:fixture.works.map(solve),cells:cells.map(({messages,...x})=>x)});
 const dir=path.join(root,"responses");fs.mkdirSync(dir,{mode:0o700});
 const rows=[];
 for(const c of cells){
  write(path.join(dir,c.id+".attempt.json"),{id:c.id,promptSHA256:c.promptSHA256,
   sourceSHA256:c.sourceSHA256,planSHA256:c.planSHA256,planHash:planHash(cells)});
  let res;
  try{
   const r=await invoke({provider:"groq",model:MODEL,messages:c.messages,temperature:0,maxTokens:MAX});
   res={id:c.id,arm:c.arm,sourceWork:c.sourceWork,promptSHA256:c.promptSHA256,
    sourceSHA256:c.sourceSHA256,planSHA256:c.planSHA256,modelRequested:MODEL,responseModel:r.responseModel,
    status:r.finishReason==="stop"?"GENERATED":"INCOMPLETE",text:r.text,textSHA256:sha(r.text),
    finishReason:r.finishReason,usage:r.usage,latencyMs:r.latencyMs};
  }catch(e){
   res={id:c.id,arm:c.arm,sourceWork:c.sourceWork,promptSHA256:c.promptSHA256,
    sourceSHA256:c.sourceSHA256,planSHA256:c.planSHA256,modelRequested:MODEL,
    status:"PROVIDER_ERROR",errorCode:e.status||e.code||e.message||"UNKNOWN"};
  }
  write(path.join(dir,c.id+".result.json"),res);
  rows.push({id:c.id,status:res.status,tokens:res.usage?.total_tokens||0});
 }
 write(path.join(dir,"summary.json"),{planHash:planHash(cells),rows});
 assert(rows.every(x=>x.status==="GENERATED"),"R5G_INCOMPLETE_RAW_BYTES_RETAINED");
 const s=score(root);write(path.join(root,"final-score.json"),s);
 fs.writeFileSync(path.join(root,"plain-Korean-16-graph-ordered-comparisons.md"),readingPacket(s),
   {flag:"wx",mode:0o600});
 return s;
}
async function main(args){
 const [mode,...rest]=args;
 if(mode==="--preflight"&&rest.length===0){
  const cells=planCalls();
  console.log(JSON.stringify({works:8,newCalls:16,model:MODEL,
   planHash:planHash(cells),perWork:fixture.works.map(w=>({id:w.id,genre:w.genre,solution:solve(w)})),
   cells:cells.map(({messages,...x})=>x)}));return;
 }
 if(mode==="--execute"&&rest.length===1){
  resolveProvider("groq");const s=await run(rest[0]),{rows,...head}=s;
  console.log("R5g-live-full-Korean",JSON.stringify(head));return;
 }
 if(mode==="--score"&&rest.length===1){
  const s=score(rest[0]),{rows,...head}=s;console.log(JSON.stringify(head,null,2));return;
 }
 throw Error("USAGE --preflight | --execute NEW_ROOT | --score PREVIOUS_ROOT");
}
if(require.main===module)main(process.argv.slice(2)).catch(e=>{console.error("R5G_FAILED_BUT_RAW_RETAINED",e.message);process.exitCode=1});
module.exports={fixture,SETTINGS,KINDS,STATUS,ROLE_WEIGHT,validateFixture,enumerate,scoreOrder,solve,
 messages,planCalls,planHash,numericTokens,readReceipts,score,readingPacket,run};
