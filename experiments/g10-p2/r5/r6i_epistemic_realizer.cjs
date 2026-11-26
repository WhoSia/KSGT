'use strict';
// Bounded report microgrammar. Semantic signatures are investigator-specified, not parsed from Korean.
const VALUES=['T','F','U'];
const names=['A 센서','B 센서'];
const atoms=[{k:'T',w:true},{k:'F',w:false},{k:'U',w:true},{k:'U',w:false}];
const worlds=atoms.flatMap(a=>atoms.map(b=>[a,b]));
const states=VALUES.flatMap(a=>VALUES.map(b=>[a,b]));
const start='같은 날 두 센서의 출력값을 각각 기록했다.';
const end='두 센서의 교정 상태는 기록하지 않았다.';
const phrases={T:['변동 폭이 감소한 것으로 확인됐다','변동 폭의 감소가 확인됐다'],F:['변동 폭이 감소하지 않은 것으로 확인됐다','변동 폭이 줄지 않았음을 확인했다'],U:['변동 폭이 감소했는지는 확인하지 못했다','변동 폭의 감소 여부를 확인하지 못했다']};
function stateOK(s){return Array.isArray(s)&&s.length===2&&s.every(v=>VALUES.includes(v))}
function sourceMask(s){if(!stateOK(s))throw Error('INVALID_KNOWLEDGE_STATE');return mask(w=>w.every((a,i)=>a.k===s[i]))}
function mask(fn){return worlds.reduce((acc,w,i)=>fn(w)?acc|(1<<i):acc,0)}
function meaning(c){
 if(c.kind==='status')return mask(w=>c.members.every(i=>w[i].k===c.status));
 if(c.kind==='only-world')return mask(w=>w[c.member].w&&!w[1-c.member].w);
 if(c.kind==='only-confirmed')return mask(w=>w[c.member].k==='T'&&w[1-c.member].k!=='T');
 throw Error('BAD_PREDICATE');
}
function status(members,k,variant){const subject=members.length===2?'두 센서 모두에서':names[members[0]]+'에서는';return {kind:'status',members,status:k,text:subject+' '+phrases[k][variant]+'.'}}
function candidates(s){
 if(!stateOK(s))throw Error('INVALID_KNOWLEDGE_STATE');const out=[];
 for(const order of [[0,1],[1,0]])for(const v of [0,1])out.push(order.map(i=>status([i],s[i],v)));
 if(s[0]===s[1])for(const v of [0,1])out.push([status([0,1],s[0],v)]);
 // A contrast of distinct observation states licenses a connective, not a new causal fact.
 if(s[0]!==s[1])for(const [i,j] of [[0,1],[1,0]]){
  const a=status([i],s[i],0),b=status([j],s[j],0);
  a.text=names[i]+'에서는 '+({T:'변동 폭의 감소가 확인됐지만',F:'변동 폭이 줄지 않은 것으로 확인됐지만',U:'변동 폭이 줄었는지는 확인하지 못했지만'}[s[i]]);
  out.push([a,b]);
 }
 for(const i of [0,1])if(s[i]==='T'){
  out.push([{kind:'only-world',member:i,text:names[i]+'에서만 변동 폭이 감소했다.'}]);
  out.push([{kind:'only-confirmed',member:i,text:names[i]+'에서만 변동 폭의 감소가 확인됐다.'}]);
 }
 return out;
}
function assess(s,cs){const required=sourceMask(s);const actual=cs.reduce((m,c)=>m&meaning(c),(1<<worlds.length)-1);return {required,actual,sound:(actual&required)===required,exact:actual===required}}
function realize(s){const evaluated=candidates(s).map(cs=>{const text=[start,...cs.map(c=>c.text),end].join(' ');return {text,...assess(s,cs),clauses:cs}});const valid=evaluated.filter(r=>r.exact).sort((a,b)=>Array.from(a.text).length-Array.from(b.text).length);if(!valid.length)throw Error('NO_EXACT_CANDIDATE');return {state:s,chosen:valid[0],valid:evaluated.filter(r=>r.exact).length,rejected:evaluated.filter(r=>!r.exact),candidateCount:evaluated.length};}
function facts(s){if(!stateOK(s))throw Error('INVALID_KNOWLEDGE_STATE');return [start,...s.map((k,i)=>names[i]+'의 변동 폭: '+({T:'감소했음을 확인함',F:'감소하지 않았음을 확인함',U:'감소 여부를 확인하지 못함'}[k])+'.'),end]}
module.exports={VALUES,states,worlds,sourceMask,meaning,candidates,assess,realize,facts};
if(require.main===module)console.log(JSON.stringify(states.map(realize),null,2));
