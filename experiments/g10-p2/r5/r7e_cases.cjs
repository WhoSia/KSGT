'use strict';
const families=['map','bubble','box','window'].map(x=>require('./r7e_'+x+'.json'));
const arms=['LOCAL','FULL'],scopes=['AUTHORIZED','UNAUTHORIZED'];
function render(slots){if(!Array.isArray(slots)||slots.length!==4||slots.some(s=>typeof s!=='string'||/[\r\n]/u.test(s)))throw Error('BAD_SLOTS');const paras=[slots.slice(0,2),slots.slice(2)].map(p=>p.filter(Boolean).join(' '));if(paras.some(p=>!p.trim()))throw Error('EMPTY_PARAGRAPH');return paras.join('\n\n');}
function cases(){return families.flatMap(f=>{if(!f.id||!f.target||!f.end||f.draft.length!==4||!f.draft[2].startsWith('\n\n'))throw Error('BAD_FAMILY');const slots=f.draft.map(s=>s.trim());return scopes.map(scope=>({id:f.id+'__'+scope,work:f.id,scope,genre:f.genre,facts:[...f.common,f.license[scope]],target:f.target,end:f.end,slots,draft:render(slots)}));});}
module.exports={families,arms,scopes,render,cases};