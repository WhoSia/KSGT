'use strict';
function compile(spec) {
  const ids=[...spec.required,...spec.optional];
  if(ids.length<1||ids.length>20||new Set(ids).size!==ids.length||!spec.required.includes(spec.terminal))throw Error("INVALID_OBLIGATIONS");
  const bit=new Map(ids.map((id,i)=>[id,1<<i]));
  const mask=xs=>{let m=0;for(const x of xs){if(!bit.has(x))throw Error("UNKNOWN_OBLIGATION");m|=bit.get(x);}return m;};
  const need=mask(spec.required),terminal=bit.get(spec.terminal),seen=new Set(),edges=[];
  for(const c of spec.moves){
    if(seen.has(c.id)||typeof c.id!=="string"||!Number.isSafeInteger(c.cost)||c.cost<0||typeof c.text!=="string"||!c.text.trim()||!["EMIT","END","CONTROL"].includes(c.kind)||!["APPROVED","UNKNOWN","FORBIDDEN"].includes(c.authority))throw Error("INVALID_MOVE");
    seen.add(c.id);
    const add=mask(c.covers),pre=mask(c.requires);
    if(c.kind==="CONTROL"||c.authority!=="APPROVED")continue;
    if(!add||Boolean(add&terminal)!==(c.kind==="END"))throw Error("INVALID_TERMINAL_BINDING");
    edges.push({...c,add,pre});
  }
  const penalties=spec.transitionCosts||{};
  for(const [k,v] of Object.entries(penalties))if(!Number.isSafeInteger(v)||v<0)throw Error("INVALID_TRANSITION_COST");
  return {need,terminal,edges,penalties};
}

function solve(spec) {
  const p=compile(spec),memo=new Map();
  function best(mask,last){
    const key=mask+"|"+last;if(memo.has(key))return memo.get(key);
    let ans=null;
    for(const c of p.edges){
      if((mask&c.pre)!==c.pre||!(c.add&~mask))continue;
      const next=mask|c.add;
      if(c.kind==="END"&&(next&p.need)!==p.need)continue;
      const suffix=c.kind==="END"?{cost:0,ids:[],text:[]}:best(next,c.id);
      if(!suffix)continue;
      const option={cost:c.cost+(p.penalties[last+">"+c.id]||0)+suffix.cost,ids:[c.id,...suffix.ids],text:[c.text,...suffix.text]};
      if(!ans||option.cost<ans.cost||option.cost===ans.cost&&JSON.stringify(option.ids)<JSON.stringify(ans.ids))ans=option;
    }
    memo.set(key,ans);return ans;
  }
  const a=best(0,"START");return a?{status:"FINITE_AUTHORED_CANDIDATE",...a,text:a.text.join(" "),states:memo.size,semanticAuthority:"AUTHOR_LABELS_NOT_INDEPENDENT"}:{status:"HOLD_NO_FEASIBLE_PATH",states:memo.size,semanticAuthority:"AUTHOR_LABELS_NOT_INDEPENDENT"};
}

function brute(spec){
  const p=compile(spec);let best=null,paths=0;
  function walk(mask,last,cost,ids,text){
    for(const c of p.edges){
      if((mask&c.pre)!==c.pre||!(c.add&~mask))continue;
      const next=mask|c.add,score=cost+c.cost+(p.penalties[last+">"+c.id]||0),i=[...ids,c.id],t=[...text,c.text];
      if(c.kind==="END"){if((next&p.need)!==p.need)continue;paths++;const o={cost:score,ids:i,text:t.join(" ")};if(!best||o.cost<best.cost||o.cost===best.cost&&JSON.stringify(o.ids)<JSON.stringify(best.ids))best=o;}
      else walk(next,c.id,score,i,t);
    }
  }walk(0,"START",0,[],[]);return {best,paths};
}

function fixture(){
 return {required:["standing","receipt","silence","open"],optional:["light"],terminal:"open",moves:[
 {id:"a",kind:"EMIT",authority:"APPROVED",text:"유진은 엘리베이터 앞에 서 있었다.",covers:["standing"],requires:[],cost:1},
 {id:"b",kind:"EMIT",authority:"APPROVED",text:"손에는 접힌 영수증이 들려 있었다.",covers:["receipt"],requires:["standing"],cost:1},
 {id:"c",kind:"EMIT",authority:"APPROVED",text:"민석은 문 옆에 서 있었다. 둘은 아무 말도 하지 않았다.",covers:["silence"],requires:["standing"],cost:1},
 {id:"d",kind:"EMIT",authority:"APPROVED",text:"안내등의 숫자가 3에서 2로 바뀌었다.",covers:["light"],requires:["standing"],cost:0},
 {id:"e",kind:"END",authority:"APPROVED",text:"엘리베이터 문이 열렸다.",covers:["open"],requires:["standing"],cost:1},
 {id:"meta",kind:"CONTROL",authority:"APPROVED",text:"장면은 그 순간 끝난다.",covers:["open"],requires:[],cost:0},
 {id:"invent",kind:"EMIT",authority:"UNKNOWN",text:"민석은 유진의 영수증을 빼앗았다.",covers:["receipt"],requires:[],cost:0},
 {id:"joint",kind:"EMIT",authority:"APPROVED",text:"접힌 영수증을 손에 쥔 유진은 엘리베이터 앞에 서 있었다.",covers:["standing","receipt"],requires:[],cost:1}
 ],transitionCosts:{"joint>c":2}};
}

function runSelfTest(){
 const assert=(x,label)=>{if(!x)throw Error(label);};let checks=0;const check=(x,l)=>{assert(x,l);checks++};
 const f=fixture(),a=solve(f),b=brute(f);
 check(a.cost===b.best.cost&&JSON.stringify(a.ids)===JSON.stringify(b.best.ids),"reference optimum");
 check(a.ids.at(-1)==="e"&&!a.ids.includes("meta")&&!a.ids.includes("invent"),"scope separation");
 check(a.text.endsWith("엘리베이터 문이 열렸다."),"terminal text");
 const missing=fixture();missing.moves=missing.moves.filter(c=>c.id!=="c");check(solve(missing).status==="HOLD_NO_FEASIBLE_PATH","missing mandatory");
 const early=fixture();early.moves=early.moves.map(c=>c.id==="c"?{...c,requires:["open"]}:c);check(solve(early).status==="HOLD_NO_FEASIBLE_PATH","postterminal prerequisite conflict");
 const wrong=fixture();wrong.moves=wrong.moves.map(c=>c.id==="e"?{...c,kind:"EMIT"}:c);let rejected=false;try{solve(wrong)}catch(e){rejected=e.message==="INVALID_TERMINAL_BINDING"}check(rejected,"reject terminal masquerade");
 const adversarial=fixture();adversarial.moves.push({id:"lying-label",kind:"EMIT",authority:"APPROVED",text:"유진이 영수증을 버렸다.",covers:["standing","receipt","silence"],requires:[],cost:0});check(solve(adversarial).ids.includes("lying-label"),"explicit false-authority limitation");
 let seed=20261128;const rnd=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 let compared=0,feasible=0,totalPaths=0;for(let i=0;i<96;i++){const x=fixture();for(const m of x.moves)m.cost=rnd(6);x.transitionCosts={"a>b":rnd(5),"joint>c":rnd(5),"c>d":rnd(5)};if(i%7===0)x.moves=x.moves.filter(c=>c.id!=="c");const d=solve(x),e=brute(x);check(e.best?d.cost===e.best.cost&&JSON.stringify(d.ids)===JSON.stringify(e.best.ids):d.status==="HOLD_NO_FEASIBLE_PATH","random "+i);compared++;if(e.best)feasible++;totalPaths+=e.paths;}
 return {checks,compared,feasible,totalPaths,example:a,adversarialAccepted:true,scope:"FINITE_SYNTHETIC_AUTHOR_LABELS_ONLY"};
}
module.exports={compile,solve,brute,fixture,runSelfTest};
if(require.main===module)console.log(JSON.stringify(runSelfTest(),null,2));
