"use strict";
/** G10-P1 R1: explicitly witnessed reader-dependency contract; NOT a Korean parser.
 * Structural pass is not evidence of meaning fidelity or prose quality.
 */
function validate(source) {
  if (!source || !Array.isArray(source.facts) || !Array.isArray(source.edges) || source.facts.length === 0) throw Error("INVALID_SOURCE");
  const ids=source.facts.map(f=>f&&f.id);
  if(ids.some(id=>typeof id!=="string" || !/^F[1-9][0-9]*$/.test(id))||new Set(ids).size!==ids.length)throw Error("INVALID_FACT_ID");
  const known=new Set(ids),pairs=new Set();
  for(const e of source.edges) {
    if(!e||!known.has(e.before)||!known.has(e.after)||e.before===e.after||
      e.type!=="READER_PREREQUISITE"||e.evidence!=="AUTHOR_DECLARED")throw Error("UNLICENSED_EDGE");
    const key=e.before+"->"+e.after;
    if(pairs.has(key))throw Error("DUPLICATE_EDGE");
    pairs.add(key);
  }
  const indegree=new Map(ids.map(id=>[id,0])),outgoing=new Map(ids.map(id=>[id,[]]));
  for(const e of source.edges){indegree.set(e.after,indegree.get(e.after)+1);outgoing.get(e.before).push(e.after);}
  const queue=ids.filter(id=>indegree.get(id)===0);let processed=0;
  while(queue.length){const v=queue.shift();processed++;for(const w of outgoing.get(v)){indegree.set(w,indegree.get(w)-1);if(indegree.get(w)===0)queue.push(w);}}
  if(processed!==ids.length)throw Error("DEPENDENCY_CYCLE");
  return ids;
}
function audit(source,order) {
  const ids=validate(source);
  if(!Array.isArray(order)||order.length!==ids.length||new Set(order).size!==order.length||ids.some(id=>!order.includes(id)))throw Error("ORDER_NOT_A_PERMUTATION");
  const pos=new Map(order.map((id,i)=>[id,i]));
  const violations=source.edges.filter(e=>pos.get(e.before)>=pos.get(e.after)).map(e=>({before:e.before,after:e.after,type:e.type}));
  return {pass:violations.length===0,violations,edgeCount:source.edges.length,epistemicLimit:"AUTHOR_DECLARED_EDGES_ONLY_NOT_SEMANTIC_OR_READER_QUALITY"};
}
function stableOrder(source) {
  const ids=validate(source),done=new Set(),out=[];
  while(out.length<ids.length){
    const next=ids.find(id=>!done.has(id)&&source.edges.every(e=>e.after!==id||done.has(e.before)));
    if(!next)throw Error("DEPENDENCY_CYCLE");
    out.push(next);done.add(next);
  }
  return out;
}
module.exports={validate,audit,stableOrder};
