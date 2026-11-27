'use strict';
const {works}=require('./r6l_works.cjs'),{solve}=require('./r6l_discourse.cjs'),{spans,replacements}=require('./r6m_spans.cjs');
const len=s=>Array.from(s).length;
const sentences=s=>(s.match(/[.!?](?=\s|$)/g)||[]).length;
function fuse(w,{sentenceWeight=12,pool=spans[w.id]??[],exhaustive=false}={}){
 if(!Number.isFinite(sentenceWeight)||sentenceWeight<0)throw Error('BAD_WEIGHT');
 const base=solve(w);if(!base)return null;
 const order=base.seq.map(({i,j})=>({id:w.units[i].id,p:w.units[i].p,variant:w.units[i].variants[j],mentions:w.units[i].mentions??[],text:replacements[w.id]?.[w.units[i].id]??w.units[i].variants[j].text}));
 const memo=new Map();let rejected=0; const boundaryRejected=new Set();
 for(const c of pool)if(c.extra)rejected++;
 function rec(i){if(i===order.length)return {cost:0,chunks:[]};if(!exhaustive&&memo.has(i))return memo.get(i);
  const options=[{ids:[order[i].id],text:order[i].text}];
  for(const c of pool)if(!c.extra&&c.ids.length>=2&&c.ids.every((id,j)=>order[i+j]?.id===id&&order[i+j].p===order[i].p)){
   const next=order[i+c.ids.length],same=next?.p===order[i].p;
   const expected=order.slice(i,i+c.ids.length).flatMap(o=>o.mentions.map(m=>m.kind+':'+m.id));
   if(!Array.isArray(c.endFocus)||!Array.isArray(c.mentions)||expected.some(id=>!c.mentions.includes(id))||(same&&next.variant.ref&&!(c.endFocus.length===1&&c.endFocus[0]===next.variant.ref))||(same&&next.variant.prev&&next.variant.prev!==c.endAnchor)){boundaryRejected.add(c);continue;}
   options.push(c);
  }
  let best=null;for(const c of options){const tail=rec(i+c.ids.length);const cost=len(c.text)+sentenceWeight*sentences(c.text)+tail.cost;if(!best||cost<best.cost)best={cost,chunks:[{...c,p:order[i].p},...tail.chunks]};}
  if(!exhaustive)memo.set(i,best);return best;
 }
 const chosen=rec(0);let p=-1,text='';for(const c of chosen.chunks){text+=(p<0?'':p===c.p?' ':'\n\n')+c.text;p=c.p;}
 const revised=order.map((o,i)=>(i===0?'':order[i-1].p===o.p?' ':'\n\n')+o.text).join('');
 return {id:w.id,original:base.text,revised,text,cost:chosen.cost,chunks:chosen.chunks,rejected,boundaryRejected:boundaryRejected.size,originalSentences:sentences(base.text),finalSentences:sentences(text),originalLength:len(base.text),finalLength:len(text)};
}
function receipt(){return {authority:'AUTHORED_SPAN_MEANINGS_AND_FIXED_ORDER_ONLY',rows:works.map(w=>fuse(w)),sensitivity:[0,4,8,12,20,30].map(sentenceWeight=>({sentenceWeight,rows:works.map(w=>{const r=fuse(w,{sentenceWeight});return {id:r.id,length:r.finalLength,sentences:r.finalSentences,spans:r.chunks.filter(c=>c.ids.length>1).length}})}))};}
module.exports={fuse,receipt};if(require.main===module)console.log(JSON.stringify(receipt(),null,2));
