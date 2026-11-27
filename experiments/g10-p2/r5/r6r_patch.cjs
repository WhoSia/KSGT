'use strict';
// Exact-surface edit transaction. Semantic quality is NOT certified by this validator.
function apply(draft,response){
 if(typeof draft!=='string'||!draft.trim()||typeof response!=='string')throw Error('BAD_INPUT');
 let obj;try{obj=JSON.parse(response)}catch{throw Error('INVALID_JSON')}
 if(!obj||Object.keys(obj).length!==1||!Array.isArray(obj.edits)||obj.edits.length>8)throw Error('BAD_EDIT_LIST');
 const positions=[];
 for(const e of obj.edits){
  if(!e||Object.keys(e).sort().join(',')!=='after,before,reason'||[e.before,e.after,e.reason].some(x=>typeof x!=='string')||!e.before||!e.reason.trim()||e.before===e.after)throw Error('BAD_EDIT');
  const i=draft.indexOf(e.before);if(i<0||draft.indexOf(e.before,i+1)>=0)throw Error('NONUNIQUE_ANCHOR');
  positions.push({...e,start:i,end:i+e.before.length});
 }
 positions.sort((a,b)=>a.start-b.start);for(let i=1;i<positions.length;i++)if(positions[i].start<positions[i-1].end)throw Error('OVERLAP');
 let out='',cursor=0;for(const e of positions){out+=draft.slice(cursor,e.start)+e.after;cursor=e.end}out+=draft.slice(cursor);
 if(!out.trim())throw Error('EMPTY_OUTPUT');
 return {text:out,edits:positions,covered:positions.reduce((n,e)=>n+Array.from(e.before).length,0),draftLength:Array.from(draft).length,kind:positions.length?'PATCH':'KEEP'};
}
module.exports={apply};
