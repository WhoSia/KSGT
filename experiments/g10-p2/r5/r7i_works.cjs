'use strict';
const works=['filter','return','scale','tile'].map(x=>require('./r7i_'+x+'.json'));
const arms=['PLAN','DRAFT'];
for(const w of works){if(!w.id||!w.genre||!w.goal||!w.license||!Array.isArray(w.facts)||w.facts.length!==4||new Set(w.facts).size!==4)throw Error('BAD_WORK');}
module.exports={works,arms};
