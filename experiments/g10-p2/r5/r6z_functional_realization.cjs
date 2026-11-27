'use strict';
function compile(spec) {
 const unique=(a)=>Array.isArray(a)&&a.every(x=>typeof x==="string"&&/^[A-Za-z0-9_-]+$/.test(x))&&new Set(a).size===a.length;
 const {facts,functions,paragraphs,moves,terminal}=spec;
 if(!unique(facts)||!unique(functions)||facts.length>16||functions.length>12||!facts.includes(terminal)||!Number.isInteger(paragraphs)||paragraphs<1||paragraphs>4||!Array.isArray(moves)||moves.length>40)throw Error("BAD_SPEC");
 const masks=(ids,universe)=>{if(!unique(ids)||ids.some(x=>!universe.includes(x)))throw Error("BAD_IDS");return ids.reduce((m,x)=>m|(1<<universe.indexOf(x)),0)};
 const required=masks(spec.requiredFacts,facts),functional=masks(spec.requiredFunctions,functions),end=1<<facts.indexOf(terminal);
 if(!(required&end))throw Error("END_NOT_REQUIRED");
 const seen=new Set(),edges=[];
 for(const m of moves){
  if(!unique([m.id])||seen.has(m.id)||["START","BREAK"].includes(m.id)||!["EMIT","END"].includes(m.kind)||!["APPROVED","UNKNOWN","FORBIDDEN"].includes(m.authority)||!Number.isSafeInteger(m.cost)||m.cost<0||m.cost>1000000||!Number.isInteger(m.paragraph)||m.paragraph<1||m.paragraph>paragraphs||typeof m.text!=="string"||!m.text.trim()||/[\r\n]/.test(m.text))throw Error("BAD_MOVE");
  seen.add(m.id);
  const add=masks(m.addFacts,facts),fun=masks(m.addFunctions,functions),pre=masks(m.requiresFacts,facts),preFun=masks(m.requiresFunctions,functions);
  if(!(add||fun)||Boolean(add&end)!==(m.kind==="END")||(m.kind==="END"&&m.paragraph!==paragraphs))throw Error("BAD_EFFECT");
  if(m.authority==="APPROVED")edges.push({...m,add,fun,pre,preFun});
 }
 const penalty=spec.transitionCosts||{};for(const v of Object.values(penalty))if(!Number.isSafeInteger(v)||v<0||v>1000000)throw Error("BAD_TRANSITION_COST");
 return {required,functional,end,edges,paragraphs,penalty};
}

function solve(spec){
 const p=compile(spec),memo=new Map();
 function best(f,g,k,has,last){
  const key=[f,g,k,Number(has),last].join("|");if(memo.has(key))return memo.get(key);
  let winner=null;
  function offer(cost,ids,segments){const x={cost,ids,segments};if(!winner||x.cost<winner.cost||x.cost===winner.cost&&JSON.stringify(x.ids)<JSON.stringify(winner.ids))winner=x;}
  if(has&&k<p.paragraphs){const r=best(f,g,k+1,false,"BREAK");if(r)offer((p.penalty[last+">BREAK"]||0)+r.cost,["BREAK",...r.ids],["\n\n",...r.segments]);}
  for(const m of p.edges){
   if(m.paragraph!==k||(f&m.pre)!==m.pre||(g&m.preFun)!==m.preFun||!((m.add&~f)||(m.fun&~g)))continue;
   const nf=f|m.add,ng=g|m.fun,local=m.cost+(p.penalty[last+">"+m.id]||0);
   if(m.kind==="END"){
    if(k===p.paragraphs&&(nf&p.required)===p.required&&(ng&p.functional)===p.functional)offer(local,[m.id],[m.text]);
   }else{const r=best(nf,ng,k,true,m.id);if(r)offer(local+r.cost,[m.id,...r.ids],[m.text,...r.segments]);}
  }
  memo.set(key,winner);return winner;
 }
 const x=best(0,0,1,false,"START");return x?{status:"FINITE_AUTHORED_CANDIDATE",cost:x.cost,ids:x.ids,text:x.segments.join(" ").replace(/ *\n\n */g,"\n\n"),states:memo.size,semanticAuthority:"MANUAL_NOT_INDEPENDENT"}:{status:"HOLD_NO_FEASIBLE_PATH",states:memo.size};
}

function reference(spec){
 compile(spec);let winner=null,paths=0;
 const includes=(set,arr)=>arr.every(x=>set.has(x));
 function walk(f,g,k,has,last,cost,ids,segments){
  if(has&&k<spec.paragraphs)walk(f,g,k+1,false,"BREAK",cost+(spec.transitionCosts?.[last+">BREAK"]||0),[...ids,"BREAK"],[...segments,"\n\n"]);
  for(const m of spec.moves){
   if(m.authority!=="APPROVED"||m.paragraph!==k||!includes(f,m.requiresFacts)||!includes(g,m.requiresFunctions)||includes(f,m.addFacts)&&includes(g,m.addFunctions))continue;
   const nf=new Set([...f,...m.addFacts]),ng=new Set([...g,...m.addFunctions]);
   const val=cost+m.cost+(spec.transitionCosts?.[last+">"+m.id]||0),ni=[...ids,m.id],nt=[...segments,m.text];
   if(m.kind==="END"){
    if(k!==spec.paragraphs||!includes(nf,spec.requiredFacts)||!includes(ng,spec.requiredFunctions))continue;
    paths++;const o={cost:val,ids:ni,text:nt.join(" ").replace(/ *\n\n */g,"\n\n")};if(!winner||o.cost<winner.cost||o.cost===winner.cost&&JSON.stringify(o.ids)<JSON.stringify(winner.ids))winner=o;
   }else walk(nf,ng,k,true,m.id,val,ni,nt);
  }
 }
 walk(new Set(),new Set(),1,false,"START",0,[],[]);return {winner,paths};
}

function examples(){
 const m=(id,paragraph,text,addFacts,addFunctions,requiresFacts=[],requiresFunctions=[],cost=1,kind="EMIT",authority="APPROVED")=>({id,paragraph,text,addFacts,addFunctions,requiresFacts,requiresFunctions,cost,kind,authority});
 return [
 {id:"SCI_TRAY",facts:["setup","result","notMeasured","limit"],functions:["explainComparison"],requiredFacts:["setup","result","notMeasured","limit"],requiredFunctions:["explainComparison"],terminal:"limit",paragraphs:2,moves:[
 m("setup",1,"같은 양의 물을 담은 두 금속 쟁반 가운데 하나에 천을 덮었다.",["setup"],[]),
 m("result",1,"5분 뒤 천을 덮은 쟁반에서는 물이 더 많이 남아 있었다.",["result"],[],["setup"]),
 m("join",1,"같은 양의 물을 담은 두 금속 쟁반 중 하나에 천을 덮었고, 5분 뒤에는 덮은 쟁반에 물이 더 많이 남아 있었다.",["setup","result"],[],[],[],1),
 m("notMeasured",2,"두 쟁반에서 증발한 물의 정확한 양은 측정하지 않았다.",["notMeasured"],[],["result"]),
 m("explain",2,"이 비교에서 확인한 것은 관찰 시점에 남은 물의 상대적인 양이다.",[],["explainComparison"],["result"]),
 m("explainAlt",2,"남은 물의 양을 비교한 관찰과 증발량을 정량적으로 측정한 실험은 구별해야 한다.",[],["explainComparison"],["result"],[],2),
 m("end",2,"따라서 천이 물의 증발에 미치는 영향을 정량적으로 판단할 수는 없다.",["limit"],[],["notMeasured"],["explainComparison"],1,"END"),
 m("unsupported",2,"천의 단열 작용이 증발을 줄였다.",[],["explainComparison"],["result"],[],0,"EMIT","UNKNOWN")],transitionCosts:{"join>BREAK":0}},
 {id:"ESSAY_CLOCK",facts:["found","dial","unknown","return"],functions:["contrastRecordMemory"],requiredFacts:["found","dial","unknown","return"],requiredFunctions:["contrastRecordMemory"],terminal:"return",paragraphs:2,moves:[
 m("found",1,"책상 서랍에서 멈춰 있는 손목시계를 꺼냈다.",["found"],[]),
 m("dial",1,"시곗바늘은 여덟 시 십 분을 가리키고 있었다.",["dial"],[],["found"]),
 m("joint",1,"서랍에서 꺼낸 손목시계는 여덟 시 십 분을 가리킨 채 멈춰 있었다.",["found","dial"],[],[],[],1),
 m("unknown",2,"시계가 언제 멈췄는지는 기억나지 않는다.",["unknown"],[],["dial"]),
 m("reflect",2,"시곗바늘에 남은 시각과 내가 잊어버린 시간은 같은 것이 아니었다.",[],["contrastRecordMemory"],["unknown"]),
 m("reflectAlt",2,"바늘이 가리키는 시각을 안다고 해서 그 순간을 기억하는 것은 아니다.",[],["contrastRecordMemory"],["unknown"],[],2),
 m("end",2,"나는 시계를 다시 서랍에 넣었다.",["return"],[],["unknown"],["contrastRecordMemory"],1,"END"),
 m("future",2,"다음 날 수리점에 가져가기로 했다.",[],["contrastRecordMemory"],["unknown"],[],0,"EMIT","FORBIDDEN")],transitionCosts:{}}
 ];
}

function selfTest(){
 const xs=examples();let assertions=0,comparisons=0,paths=0,feasible=0;
 function check(ok,name){if(!ok)throw Error(name);assertions++;}
 function compare(s){const a=solve(s),b=reference(s);comparisons++;paths+=b.paths;if(b.winner){feasible++;check(a.cost===b.winner.cost&&JSON.stringify(a.ids)===JSON.stringify(b.winner.ids)&&a.text===b.winner.text,"oracle mismatch "+s.id);}else check(a.status==="HOLD_NO_FEASIBLE_PATH","unexpected feasible");return a;}
 const base=xs.map(s=>({id:s.id,...compare(s)}));
 for(const x of base){check(x.text.split("\n\n").length===2,"paragraph");check(x.ids.at(-1)==="end","terminal");check(x.ids.includes("explain")||x.ids.includes("explainAlt")||x.ids.includes("reflect")||x.ids.includes("reflectAlt"),"functional move");}
 const bad=examples()[0];bad.moves=bad.moves.filter(m=>!m.addFunctions.includes("explainComparison")||m.authority!=="APPROVED");check(compare(bad).status==="HOLD_NO_FEASIBLE_PATH","function requirement");
 const late=examples()[1];late.moves=late.moves.map(m=>m.id==="reflect"||m.id==="reflectAlt"?{...m,requiresFacts:["return"]}:m);check(compare(late).status==="HOLD_NO_FEASIBLE_PATH","post-end function");
 const falseTag=examples()[0];falseTag.moves=falseTag.moves.map(m=>m.id==="unsupported"?{...m,authority:"APPROVED"}:m);check(compare(falseTag).ids.includes("unsupported"),"authority counterexample");
 let seed=20261128;const rnd=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed>>>8)%n;};
 for(let i=0;i<64;i++){const s=examples()[i%2];for(const m of s.moves)m.cost=rnd(7);if(i%7===0)s.moves=s.moves.filter(m=>!m.addFunctions.length||m.authority!=="APPROVED");if(i%9===0)s.transitionCosts={["BREAK>"+(s.id==="SCI_TRAY"?"notMeasured":"unknown")]:rnd(5),["join>BREAK"]:rnd(5)};compare(s);}
 return {assertions,comparisons,paths,feasible,base,scope:"FINITE_AUTHORED_CANDIDATES_NOT_SEMANTIC_OR_QUALITY_GOLD",falseAuthorityCounterexample:true};
}
module.exports={compile,solve,reference,examples,selfTest};
if(require.main===module)console.log(JSON.stringify(selfTest(),null,2));
