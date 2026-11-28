'use strict';
const families=['gallery','lab','archive','transfer'].map(x=>require('./r7d_family_'+x+'.json'));
const scopes=['LICENSED','UNLICENSED'],arms=['DIRECT','GLOBAL_AVOID','CONTEXTUAL'];
function validate(){if(families.length!==4||new Set(families.map(f=>f.id)).size!==4)throw Error('BAD_FAMILIES');for(const f of families){if(!f.genre||!f.task||!f.cue||!f.claim||!f.end||!Array.isArray(f.common)||f.common.length<4||new Set(f.common).size!==f.common.length||!scopes.every(s=>typeof f.vary[s]==='string'&&f.vary[s].trim()))throw Error('BAD_FAMILY_'+f.id);}return true;}
function cases(){validate();return families.flatMap(f=>scopes.map(scope=>({id:f.id+'__'+scope,family:f.id,scope,genre:f.genre,task:f.task,facts:[...f.common,f.vary[scope]],cue:f.cue,claim:f.claim,end:f.end})));}
module.exports={families,scopes,arms,validate,cases};