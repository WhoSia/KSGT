'use strict';
const families=['key','count','color','room'].map(x=>require('./r7b_family_'+x+'.json'));
const statuses=['SUPPORTED','CONTRADICTED','UNSETTLED'];
function validate(){if(families.length!==4||new Set(families.map(x=>x.id)).size!==4)throw Error('BAD_FAMILIES');for(const f of families){if(!f.target||!f.context||!Array.isArray(f.parts)||f.parts.length!==4||f.parts.some(x=>typeof x!=='string'||!x.trim())||Object.keys(f.variants).sort().join(',')!==statuses.slice().sort().join(',')||new Set(Object.values(f.variants)).size!==3)throw Error('BAD_FAMILY_'+f.id);}return true;}
function stimuli(){validate();return families.flatMap((f,i)=>statuses.slice(i%3).concat(statuses.slice(0,i%3)).map(gold=>({work:f.id,kind:f.kind,gold,text:f.context+' '+f.variants[gold],target:f.target,parts:f.parts})));} 
module.exports={families,statuses,validate,stimuli};