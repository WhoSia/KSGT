'use strict';
const {compile,len,sentences}=require('./r6n_joint.cjs');
// Sufficient boundary projection for this exact authored contract language only.
function solve(w,{weight=12,fixedOrder=null,quotient=true}={}){
 if(!Number.isFinite(weight)||weight<0)throw Error('BAD_WEIGHT');const g=compile(w),memo=new Map(),n=g.us.length;
 if(fixedOrder&&(fixedOrder.length!==n||new Set(fixedOrder).size!==n||fixedOrder.some(id=>!g.us.some(u=>u.id===id))))throw Error('BAD_ORDER');
 const paragraphs=[...new Set(g.us.map(u=>u.p))].sort((a,b)=>a-b).map(p=>({p,mask:g.us.reduce((m,u,i)=>u.p===p?m|1<<i:m,0),cs:g.cs.filter(c=>c.p===p)}));
 const masks=new Map();for(let i=0;i<n;i++)for(const m of g.us[i].mentions??[]){const byId=masks.get(m.kind)??new Map();byId.set(m.id,(byId.get(m.id)??0)|1<<i);masks.set(m.kind,byId);}
 const cost=g.cs.map(c=>len(c.text)+weight*sentences(c.text));
 const focus=last=>last?.endFocus.length===1?last.endFocus[0]:null;
 let visited=0,cacheHits=0;
 function rec(mask,last){if(mask===g.full)return {cost:0,chunks:[]};const p=paragraphs.find(x=>(mask&x.mask)!==x.mask),prev=last?.p===p.p?last:null;
 // At a paragraph boundary, both local conditions reset. Same mask fixes accumulated mentions.
 const key=mask+'|'+(quotient?JSON.stringify([focus(prev),prev?.endAnchor??null]):last?.i??-1);
 if(memo.has(key)){cacheHits++;return memo.get(key);}visited++;
 let pos=0;if(fixedOrder)for(let x=mask;x;x&=x-1)pos++;
 let best=null;
 for(const c of p.cs){if(c.mask&mask||(c.need&mask)!==c.need||fixedOrder&&!c.ids.every((id,j)=>id===fixedOrder[pos+j]))continue;
  if(c.ref&&focus(prev)!==c.ref||c.prev&&prev?.endAnchor!==c.prev)continue;
  if(c.unique){const m=masks.get(c.unique.kind);if(!m||!((m.get(c.unique.id)??0)&mask)||[...m].some(([id,b])=>id!==c.unique.id&&(b&mask)))continue;}
  const r=rec(mask|c.mask,c);if(!r)continue;const total=cost[c.i]+r.cost;if(!best||total<best.cost)best={cost:total,chunks:[c,...r.chunks]};}
 memo.set(key,best);return best;}
 const r=rec(0,null);if(!r)return null;let p=null,text='';for(const c of r.chunks){text+=(p===null?'':p===c.p?' ':'\n\n')+c.text;p=c.p;}return {...r,text,visited,cacheHits,order:r.chunks.flatMap(c=>c.ids),sentences:sentences(text),length:len(text)};
}
module.exports={solve};
