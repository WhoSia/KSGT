'use strict';
const works=['coat','waterline','bench','room'].map(x=>require('./r7h_'+x+'.json'));
const names=['OPEN','RESOLVED'];
function validate(w){if(!w.id||!w.genre||!w.prefix||!w.task||!w.terminal||!Array.isArray(w.common)||w.common.length<3||Object.keys(w.branches).sort().join(',')!=='OPEN,RESOLVED'||names.some(k=>typeof w.branches[k]!=='string'||!w.branches[k].trim())||w.branches.OPEN===w.branches.RESOLVED)throw Error('BAD_WORK');return w;}
works.forEach(validate);
module.exports={works,names,validate};