'use strict';
// This is a source inventory/reader-effect scheduling contract, not a semantic verifier.
function validate(w){
 if(!w||typeof w.id!=='string'||!w.id||!['genre','audience','task'].every(k=>typeof w[k]==='string'&&w[k].trim())||!Array.isArray(w.facts)||!w.facts.length||!w.facts.every(x=>typeof x==='string'&&x.trim())||!Array.isArray(w.paragraphs)||!w.paragraphs.length)throw Error('BRIEF');
 const seen=new Set();
 for(const p of w.paragraphs){
  if(!p||typeof p.effect!=='string'||!p.effect.trim()||!Array.isArray(p.introduce)||!p.introduce.length||!Array.isArray(p.refer)||new Set(p.refer).size!==p.refer.length)throw Error('OBLIGATION');
  for(const n of p.refer)if(!seen.has(n))throw Error('FUTURE_REFERENCE');
  for(const n of p.introduce){if(!Number.isInteger(n)||n<1||n>w.facts.length||seen.has(n))throw Error('FACT_PARTITION');seen.add(n)}
 }
 if(seen.size!==w.facts.length)throw Error('FACT_PARTITION');
 return w;
}
function records(w){validate(w);const header=[`장르: ${w.genre}`,`독자: ${w.audience}`,`과제: ${w.task}`,`문단 수: ${w.paragraphs.length}`];const facts=w.facts.map((s,i)=>`정보 ${i+1}: ${s}`);const effects=w.paragraphs.map((p,i)=>`문단 ${i+1}의 전달 의도: ${p.effect} 새로 다룰 정보 ${p.introduce.join(', ')}. 앞 문단에서 이어받을 정보 ${p.refer.length?p.refer.join(', '):'없음'}.`);return {header,facts,effects};}
function render(w,arm){const {header,facts,effects}=records(w);let content;
 if(arm==='direct')content=[...header,...facts,...effects];
 else if(arm==='coupled')content=[...header,...w.paragraphs.flatMap((p,i)=>[effects[i],...p.introduce.map(n=>facts[n-1])])];
 else throw Error('ARM');
 return content.join('\n');
}
module.exports={validate,records,render};
