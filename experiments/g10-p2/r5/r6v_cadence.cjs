'use strict';
// Observational hints, not stylistic correctness scores. Skip quotations and uncertain boundaries.
const chars=s=>[...s.replace(/\s/gu,'')].length;
function sentences(p){
  if(/[“”"「」『』]/u.test(p))return null;
  const out=p.trim().split(/(?<=[.!?])\s+(?=\S)/u).map(s=>s.trim()).filter(Boolean);
  return out.length&&out.every(s=>/[.!?]$/u.test(s))?out:null;
}
function diagnose(text,w){
  if(typeof text!=='string'||!text.trim())throw Error('EMPTY_TEXT');
  const paragraphs=text.trim().split(/\n\s*\n/u),out=[];
  if(paragraphs.length!==w.paragraphs)return {kind:'FORMAT_MISMATCH',paragraphs:paragraphs.length,hints:[],skipped:[]};
  const skipped=[];
  for(const [i,p] of paragraphs.entries()){
    const ss=sentences(p);
    if(!ss){skipped.push(i+1);continue;}
    const protectedSentence=s=>w.refrains.includes(s)||w.protectedStarts.some(t=>s.startsWith(t+' '));
    const lens=ss.map(chars),starts=ss.map(s=>s.split(/\s+/u)[0]);
    for(let j=0;j+2<ss.length;j++){
      const three=ss.slice(j,j+3);if(three.some(protectedSentence))continue;
      const ll=lens.slice(j,j+3),mean=ll.reduce((a,b)=>a+b,0)/3;
      if(starts[j]===starts[j+1]&&starts[j]===starts[j+2])out.push({paragraph:i+1,from:j+1,to:j+3,kind:'REPEATED_OPENING',sample:three,opening:starts[j]});
      if(w.genre!=='과학 잡지 설명문'&&Math.min(...ll)>=12&&(Math.max(...ll)-Math.min(...ll))/mean<=.2)out.push({paragraph:i+1,from:j+1,to:j+3,kind:'SIMILAR_LENGTH',sample:three,lengths:ll});
    }
  }
  // At most one cue per paragraph and three per work. Prefer actual lexical repetition.
  const hints=[];for(const x of [...out].sort((a,b)=>Number(b.kind==='REPEATED_OPENING')-Number(a.kind==='REPEATED_OPENING')||a.paragraph-b.paragraph||a.from-b.from)){if(hints.some(h=>h.paragraph===x.paragraph))continue;hints.push(x);if(hints.length===3)break;}
  return {kind:'OBSERVED',paragraphs:paragraphs.length,hints,skipped};
}
function render(d){
  if(d.kind!=='OBSERVED'||!d.hints.length)return '';
  return '\n\n초안에서 기계적으로 관찰한 검토 후보(오류 판정이나 목표 수치가 아님):\n'+d.hints.map(h=>`${h.paragraph}문단 ${h.from}~${h.to}문장: ${h.kind==='REPEATED_OPENING'?'같은 첫 어절 '+h.opening+'이 연속됨':'공백 제외 길이가 비슷함('+h.lengths.join(', ')+')'}.\n${h.sample.join(' ')}\n이 반복이나 호흡이 해당 문단의 효과에 맞으면 유지하고, 아니라면 정보의 초점과 연결을 살려 조정하세요.`).join('\n');
}
module.exports={chars,sentences,diagnose,render};
