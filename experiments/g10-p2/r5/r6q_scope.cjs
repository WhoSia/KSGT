'use strict';
const {closure}=require('./r6p_temporal.cjs');
const samePair=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&b.length===2&&new Set(a).size===2&&new Set(b).size===2&&a.every(x=>b.includes(x));
function realize(f,{order='ab',placement='before'}={}){
 if(!['ab','ba'].includes(order)||!['before','after'].includes(placement))throw Error('BAD_VARIANT');
 if(!['not_recorded','not_remembered'].includes(f.status)||f.marker?.status!==f.status||!samePair(f.scope,f.marker?.scope)||!samePair(f.scope,['a','b']))throw Error('UNLICENSED_UNCERTAINTY');
 if(!Array.isArray(f.events)||f.events.length!==3||!['a','b','c'].every(x=>f.events.includes(x)))throw Error('BAD_EVENTS');
 const edges=closure(f.events,f.before);if(!edges)throw Error('CYCLIC_SOURCE');
 if(edges.some(([a,b])=>f.scope.includes(a)&&f.scope.includes(b)))throw Error('KNOWN_ORDER_CONTRADICTS_MARKER');
 if(!['a','b'].every(a=>edges.some(e=>e[0]===a&&e[1]==='c')))throw Error('MISSING_CONTROL_ORDER');
 const units={context:f.context,a:f.sentences?.a,b:f.sentences?.b,c:f.sentences?.c,marker:f.marker?.text};if(Object.values(units).some(s=>typeof s!=='string'||!s.trim()))throw Error('BAD_TEXT');
 const pair=order.split('');const ids=['context',...(placement==='before'?['marker',...pair]:[...pair,'marker']),'c'];return {order,placement,ids,text:ids.map(id=>units[id]).join(' '),units};
}
module.exports={realize};
