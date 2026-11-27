'use strict';
const roles=['상황','질문','관찰','비교','한계','요청','전개','마무리'];
const rhythms=['담백','완급','유연'];
function parse(text,w){
 const p=JSON.parse(text);if(!p||Object.keys(p).sort().join(',')!=='paragraphs'||!Array.isArray(p.paragraphs)||p.paragraphs.length!==w.paragraphs)throw Error('PARAGRAPH_COUNT');
 const ids=[];
 for(const v of p.paragraphs){if(!v||Object.keys(v).sort().join(',')!=='facts,focus,rhythm,role'||!roles.includes(v.role)||!rhythms.includes(v.rhythm)||!Array.isArray(v.facts)||!v.facts.length||!v.facts.includes(v.focus))throw Error('PARAGRAPH_CONTRACT');for(const n of v.facts){if(!Number.isInteger(n)||n<1||n>w.facts.length||ids.includes(n))throw Error('FACT_PARTITION');ids.push(n)}}
 if(ids.length!==w.facts.length)throw Error('FACT_PARTITION');return p;
}
function decode(text,w){try{return {kind:'VALID',plan:parse(text,w)}}catch(e){return {kind:'FALLBACK',code:e instanceof SyntaxError?'JSON_INVALID':e.message}}}
function render(p){return p.paragraphs.map((v,i)=>`${i+1}문단: ${v.role}; 정보 순서 ${v.facts.join(', ')}; 초점 ${v.focus}; 호흡 ${v.rhythm}`).join('\n')}
module.exports={roles,rhythms,parse,decode,render};
