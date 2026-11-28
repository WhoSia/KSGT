'use strict';
const {works}=require('./r6l_works.cjs');
// Candidate text meanings and focus sets are supplied by the investigator. No semantic parser.
function solve(w,{mode='context',exhaustive=false}={}){
 const us=w.units,n=us.length;if(n>12||new Set(us.map(u=>u.id)).size!==n)throw Error('INVALID_UNITS');
 const ids=new Map(us.map((u,i)=>[u.id,i])); const bit=id=>{if(!ids.has(id))throw Error('UNKNOWN_UNIT');return 1<<ids.get(id)};
 const full=(1<<n)-1,cache=new Map();let visited=0;
 function recurse(mask,last){
  if(mask===full)return {cost:0,seq:[]};const key=mask+'|'+(last?last.i+':'+last.j:'-');if(!exhaustive&&cache.has(key))return cache.get(key);visited++;
  let best=null;const paragraph=Math.min(...us.filter((_,i)=>!(mask&(1<<i))).map(u=>u.p));
  for(let i=0;i<n;i++){const u=us[i];if((mask&(1<<i))||u.p!==paragraph||u.after.some(id=>!(mask&bit(id))))continue;
   const prev=last&&us[last.i].p===u.p?us[last.i]:null, pv=prev?prev.variants[last.j]:null;
   for(let j=0;j<u.variants.length;j++){const v=u.variants[j];if(v.extra||v.requires?.some(id=>!(mask&bit(id))))continue;
    if(mode==='context'&&((v.ref&&!(pv?.focus.length===1&&pv.focus[0]===v.ref))||(v.prev&&prev?.id!==v.prev)))continue;
    // Explicitly authored reference/anchor constraints; length is not naturalness.
    const tail=recurse(mask|1<<i,{i,j});if(!tail)continue;
    const cost=Array.from(v.text).length+tail.cost;
    if(!best||cost<best.cost)best={cost,seq:[{i,j},...tail.seq]};
   }
  }if(!exhaustive)cache.set(key,best);return best;
 }
 const best=recurse(0,null);if(!best)return null;
 let p=-1, text='';const violations=[];let last=null;
 for(const {i,j} of best.seq){const u=us[i],v=u.variants[j],prev=last&&us[last.i].p===u.p?us[last.i]:null,pv=prev?prev.variants[last.j]:null;
  if(v.ref&&!(pv?.focus.length===1&&pv.focus[0]===v.ref))violations.push([u.id,'AMBIGUOUS_OR_UNINTRODUCED_REFERENCE']);
  if(v.prev&&prev?.id!==v.prev)violations.push([u.id,'WRONG_RELATION_ANCHOR']);
  text+=(p===-1?'':p===u.p?' ':'\n\n')+v.text;p=u.p;last={i,j};
 }return {...best,text,visited,violations};
}
function receipt(){return works.map(w=>({id:w.id,shortest:solve(w,{mode:'length'}),context:solve(w),oracle:solve(w,{exhaustive:true})}));}
module.exports={solve,receipt};if(require.main===module)console.log(JSON.stringify(receipt(),null,2));
